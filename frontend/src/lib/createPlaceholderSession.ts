import type { Session } from '../types'

function createPlaceholderSession(
  capacity: number,
  date: string,
  startTime: string,
  endTime: string,
  price: number,
  hostLink: string,
  joinLink: string
): Session {
  return {
    hostLink,
    joinLink,
    capacity,
    date,
    startTime,
    endTime,
    price,
  }
}

export default createPlaceholderSession
