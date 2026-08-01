import type { Session } from '../types'

function createPlaceholderSession(
  capacity: number,
  date: string,
  startTime: string,
  endTime: string,
  cost_cents: number,
  hostLink: string,
  joinLink: string,
  courtName: string
): Session {
  return {
    hostLink,
    joinLink,
    capacity,
    date,
    startTime,
    endTime,
    cost_cents,
    courtName,
  }
}

export default createPlaceholderSession
