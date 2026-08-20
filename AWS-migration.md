# Migrate Database to AWS (RDS for PostgreSQL) via Terraform

## Context

The app (`backend/` Express+TS API, `frontend/` React+Vite) currently runs entirely against a local Postgres 16 instance defined in `docker-compose.yml` (DB name `vball`, no persistent cloud presence). There is no ORM — all queries are raw SQL through a single `pg.Pool` (`backend/src/setup/data.ts`), configured entirely by one `DATABASE_URL` env var read from `backend/.env` (gitignored, no `.env.example` exists). Schema is a single flat file (`migrations/001_initial_schema.sql`, 3 tables: `sessions`, `teams`, `attendances`) applied via a `psql` shell script in `backend/package.json` (`db:migrate`). There is currently **zero AWS footprint** — no Terraform, no Dockerfile, no CI/CD, no IaC of any kind — so this is a from-scratch provisioning job, not a lift-and-shift, and there's effectively no production data to migrate (only local dev data).

Decisions made:
- **Target**: RDS for PostgreSQL (not Aurora) — simplest, predictable, fits current small scale.
- **IaC**: Terraform.
- **Scope**: Database only. App hosting (backend/frontend deployment) is explicitly out of scope for this plan — the app will keep running wherever it runs today (local/dev machine or a host set up later), just pointed at the new RDS instance via `DATABASE_URL`.
- **Migrations**: Keep the existing flat-file `psql` approach as-is; no new migration tool.

Because there's no app host yet, network access to RDS will initially be scoped to the operator's IP (for running migrations/admin work) rather than an app security group — the plan calls this out as a follow-up once app hosting exists.

## Steps

### 1. Prerequisites (manual, one-time)
- AWS account + an IAM identity with permissions to create VPC/RDS/Secrets Manager/S3/DynamoDB resources.
- AWS CLI configured locally (`aws configure` or SSO profile) — verify with `aws sts get-caller-identity`.
- Terraform installed (`terraform -version`, >=1.5).

### 2. Terraform state backend (bootstrap)
Before the real infra, create a small bootstrap stack (or do it manually via CLI once) for remote state: an S3 bucket (versioned, encrypted) + a DynamoDB table for state locking. This avoids local `.tfstate` files for something meant to be "production." Document the bucket/table names so the main config's `backend "s3" {}` block can reference them.

### 3. New Terraform config: `infra/terraform/`
Create a new directory at repo root, `infra/terraform/`, with:
- `providers.tf` — AWS provider, region variable.
- `backend.tf` — S3 remote state backend pointing at the bucket/table from step 2.
- `variables.tf` — `region`, `db_name` (`vball`), `db_instance_class` (e.g. `db.t4g.micro`), `allowed_admin_cidr` (operator's IP/32 for now), `environment` tag.
- `network.tf` — either reference the account's default VPC/subnets (simplest, fine at this scale) or create a minimal VPC with 2 private subnets across AZs for the RDS subnet group. Given no app infra exists yet, default VPC + a dedicated DB subnet group is the pragmatic choice — avoid building a full custom VPC for a DB-only migration.
- `security.tf` — a security group for RDS allowing inbound TCP 5432 **only** from `var.allowed_admin_cidr` (the operator's IP). Documented as temporary/admin-only; a follow-up step (noted in file comments) will need to add the app's security group or a bastion/VPN path once app hosting is chosen.
- `rds.tf` — `aws_db_subnet_group` + `aws_db_instance`:
  - `engine = "postgres"`, `engine_version = "16"`
  - `instance_class = var.db_instance_class`
  - `allocated_storage` with `storage_encrypted = true`
  - `db_name = "vball"`, `username` set, **`manage_master_user_password = true`** (RDS-managed credential in Secrets Manager — avoids hand-rolling secret storage)
  - `backup_retention_period` (e.g. 7 days), `multi_az = false` (can be revisited later for HA)
  - `deletion_protection = true`, `skip_final_snapshot = false` — production safety defaults
  - `publicly_accessible = true` only if using default VPC without a private path; otherwise `false` with access via VPN/bastion. Given DB-only scope and no bastion yet, start `publicly_accessible = true` but locked to `allowed_admin_cidr` via the security group — call out in comments that this should move to private-only once app hosting/bastion exists.
- `outputs.tf` — `rds_endpoint`, `rds_port`, `secret_arn` (the Secrets Manager ARN holding the managed master password).

### 4. Provision
```
cd infra/terraform
terraform init
terraform plan
terraform apply
```
Review the plan carefully before applying (this creates billable resources).

### 5. Wire up `DATABASE_URL`
- Pull the generated password from Secrets Manager: `aws secretsmanager get-secret-value --secret-id <secret_arn>`.
- Construct `postgres://<user>:<password>@<rds_endpoint>:5432/vball?sslmode=require` and store it somewhere the operator can use for migration/admin work — **not committed to git**.
- Add a `backend/.env.example` (currently missing) documenting the `DATABASE_URL` contract for future operators, without real credentials.

### 6. Enable SSL on the app's Postgres connection
RDS enforces/expects TLS. Update `backend/src/setup/data.ts` (currently no `ssl` option on the `Pool`) to enable SSL when connecting to RDS, e.g. conditionally based on an env var (`PGSSLMODE` or checking the connection string), so local Docker Postgres (no SSL) keeps working unchanged while RDS connections use `ssl: { rejectUnauthorized: true }` with the RDS CA bundle (or `rejectUnauthorized: false` as a lower-security fallback if the CA bundle isn't wired in yet — flag this tradeoff explicitly rather than silently picking the weaker option).

### 7. Apply schema to RDS
Reuse the existing script, pointed at the new DB:
```
DATABASE_URL="postgres://...rds endpoint.../vball?sslmode=require" npm run db:migrate --prefix backend
```
(or export `DATABASE_URL` in a temporary `.env` used only for this run). Verify tables with `psql "$DATABASE_URL" -c '\dt'`.

### 8. Verify end-to-end
- Run the backend locally with `DATABASE_URL` pointed at RDS and hit `GET /api/health`.
- Run `npm test --prefix backend` against the RDS instance to confirm the integration test suite (which hits a real Postgres) passes against it.
- Confirm the 3 tables + 3 enums exist and match `migrations/001_initial_schema.sql`.

### 9. Follow-ups called out but not executed in this plan
- Once app hosting is chosen, replace the operator-IP-only security group rule with the app's security group / private networking, and consider `publicly_accessible = false` behind a bastion or VPN.
- Fix the hardcoded `localhost:5173` links in `sessionBusiness.ts`/`playerBusiness.ts` before real production traffic (unrelated to the DB, but blocks a real prod launch).
- Consider CloudWatch alarms / Performance Insights for the RDS instance once traffic exists.

## Verification
- `terraform plan` shows no unexpected diffs after `apply` (idempotent).
- `psql "$DATABASE_URL" -c '\dt'` against the RDS endpoint lists `sessions`, `teams`, `attendances`.
- Backend `npm test` (Jest/Supertest integration suite) passes with `DATABASE_URL` pointed at RDS.
- `curl` against a locally-run backend's `/api/health` (with `DATABASE_URL` = RDS) returns healthy.
