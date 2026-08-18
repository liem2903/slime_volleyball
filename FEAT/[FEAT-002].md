Description: A player is able to set their own primary and secondary position preference for a session they have joined. Positions are one of four values: `middle`, `oppo`, `outside`, `lib` (lowercase, matching this codebase's existing enum convention such as `session_state`/`attendance_state`). The player is identified by their session join `userToken`, the same identity mechanism used by the existing `DELETE /api/players/delete/:sessionId/:userToken` endpoint (hash the token server-side and match against `attendances.user_token_hash`). Primary and secondary must be different positions — reject if they are equal. The preference can be changed any number of times, at any point, EXCEPT once the session has reached the new `teams` state (see FEAT-003) — at that point the preference is frozen and the call must be rejected with a state error.

Input:  {
    primary_position: 'middle'|'oppo'|'outside'|'lib',
    secondary_position: 'middle'|'oppo'|'outside'|'lib'
}

Output: NO OUTPUT. res.status(200).json({success: true});
Route: PATCH /api/players/positions/:sessionId/:userToken