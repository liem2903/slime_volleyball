import type { Session } from '../types'

function createPlaceholderSession(
  capacity: number,
  date: string,
  startTime: string,
  endTime: string,
  price: number,
  hostLink: string,
  joinLink: string,
  courtName?: string
): Session {
  return {
    hostLink,
    joinLink,
    capacity,
    date,
    startTime,
    endTime,
    price,
    courtName,
  }
}

export default createPlaceholderSession
