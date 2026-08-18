Description: While a session is in `teams` state, the admin assigns one specific player to one of the session's already-created teams. Reject with a state error if the session is not in `teams` state. Reject if the given `team_id` does not belong to this session (e.g. not found / belongs to a different session). This call ONLY sets which team the player belongs to — it is deliberately split from position assignment (see FEAT-006) so the two can be set independently, in either order.

Input:  {
    team_id: string
}

Output: NO OUTPUT. res.status(200).json({success: true});
Route: PATCH /api/admin/:sessionId/:adminId/:playerId/assignTeam
