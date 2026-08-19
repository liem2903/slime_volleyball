Description: While a session is in `teams` state, the admin assigns one specific player - who has a status of 'confirmed' to one of the session's already-created teams - if the player already has a team - reassign the player to the new team. If a player is reassigned to a team that it's already in - succeed as a no-op. When a players team is re-assigned to a new team - their position should be reset back to NULL.  Reject with a state error if the session is not in `teams` state. Reject if the given `team_id` does not belong to this session (e.g. not found / belongs to a different session). If adminId doesn't match session's actual admin - reject with a 403. This call ONLY sets which team the player belongs to — it is deliberately split from position assignment (see FEAT-006) so the two can be set independently, in either order. Team's should have a capacity which is set when the team is initially created - may need to change [FEAT-003] to account for this as well as the migrations file.

Input:  {
    team_id: string
}

Output: NO OUTPUT. res.status(200).json({success: true});
Route: PATCH /api/admin/:sessionId/:adminId/:playerId/assignTeam
