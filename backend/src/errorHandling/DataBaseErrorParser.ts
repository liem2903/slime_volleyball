import { DatabaseError } from "pg";
import { ConflictError } from "./error";

export default function ErrorParse(err: DatabaseError): never {
    // Maybe add more later?
    switch (err.code) {
        case "23505":
            throw new ConflictError("ALREADY BOOKED", "Email has already booked for this session");
    }

    throw err;
}