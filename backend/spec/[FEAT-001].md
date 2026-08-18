Description: The admin user is able to edit the capacity of a session that is UNLOCKED. If the session is currently full and the capacity increases - then the most earliest waitlisted player gets promoted. If the session is full and capacity decreases - then the excess players who are cut off are waitlisted - in order of latest to earliest.

5 capacity decreased to 3 means 2 latest players are waitlisted.

Input:  {
    capacity: number
}

Output: NO OUTPUT. res.status(200).json({success: true});
Route: /api/admin/:sessionId/:adminId/changeCapacity