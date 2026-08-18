Description: A public (non-admin-gated) read endpoint that returns every team defined for a session, along with the players currently assigned to each team (each player's name and their admin-assigned position, if set). Used by both the admin page (to render full team rosters) and the player page (to show a player their own team). If the session hasn't reached `teams` state yet / no teams have been created, return an empty array rather than an error, so callers can fetch unconditionally without checking session state first.

Input: none (sessionId is a URL param)

Output: {
    data: [{
        id: string,
        name: string,
        color: string|null,
        players: [{ id: string, name: string, assigned_position: 'middle'|'oppo'|'outside'|'lib'|null }]
    }],
    success: true
}
Route: GET /api/teams/:sessionId
