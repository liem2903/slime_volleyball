Description: While a session is in `teams` state, the admin sets one specific player's actual playing position (`middle`/`oppo`/`outside`/`lib`), independent of the player's own stated preference from FEAT-002 (the player's preference remains visible to the admin as a hint/reference, but the admin's assignment is authoritative and can differ from it). Reject with a state error if the session is not in `teams` state. This call ONLY sets position — deliberately split from team assignment (see FEAT-005).

Input:  {
    position: 'middle'|'oppo'|'outside'|'lib'
}

Output: NO OUTPUT. res.status(200).json({success: true});
Route: PATCH /api/admin/:sessionId/:adminId/:playerId/assignPosition
