Description: Once a session has reached the `completed` state (meaning every player has paid and been confirmed — this already happens automatically today when the last `payment_pending` attendance is confirmed), the admin gets a new manual action: define a fixed set of named teams (each with a name, and an optional color) and transition the session into a brand-new `teams` session state, in one atomic action. Reject with a state error if the session is not currently `completed`. This requires a new `teams` table (columns: id, session_id, name, color) and a new `'teams'` value added to the existing `session_state` Postgres enum. At least two teams must be provided.

Input:  {
    teams: [{ name: string, color?: string }, ...]  // array, minimum length 2
}

Output: NO OUTPUT. res.status(200).json({success: true});
Route: PATCH /api/admin/:sessionId/:adminId/moveToTeams
