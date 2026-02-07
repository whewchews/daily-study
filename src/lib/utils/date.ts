import { format, parseISO, startOfDay, endOfDay, addDays, differenceInDays } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const KOREA_TIMEZONE = 'Asia/Seoul'

export function toKoreaTime(date: Date): Date {
  return toZonedTime(date, KOREA_TIMEZONE)
}

export function fromKoreaTime(date: Date): Date {
  return fromZonedTime(date, KOREA_TIMEZONE)
}

export function getKoreaNow(): Date {
  return toKoreaTime(new Date())
}

export function formatKoreaDate(date: Date, formatString: string = 'yyyy-MM-dd'): string {
  return format(toKoreaTime(date), formatString)
}

export function formatKoreaDateTime(date: Date): string {
  return format(toKoreaTime(date), 'yyyy-MM-dd HH:mm:ss')
}

export function getKoreaStartOfDay(date: Date): Date {
  const koreaDate = toKoreaTime(date)
  return fromKoreaTime(startOfDay(koreaDate))
}

export function getKoreaEndOfDay(date: Date): Date {
  const koreaDate = toKoreaTime(date)
  return fromKoreaTime(endOfDay(koreaDate))
}

export function isWithinSubmissionTime(date: Date, problemDate: Date): boolean {
  const koreaSubmitTime = toKoreaTime(date)
  const koreaProblemDate = toKoreaTime(problemDate)

  const submissionStart = startOfDay(koreaProblemDate)
  const submissionEnd = endOfDay(koreaProblemDate)

  return koreaSubmitTime >= submissionStart && koreaSubmitTime <= submissionEnd
}

export function getDayNumber(startDate: Date, currentDate: Date): number {
  const koreaStart = startOfDay(toKoreaTime(startDate))
  const koreaCurrent = startOfDay(toKoreaTime(currentDate))
  return differenceInDays(koreaCurrent, koreaStart) + 1
}

export function getDateForDay(startDate: Date, dayNumber: number): Date {
  const koreaStart = startOfDay(toKoreaTime(startDate))
  return fromKoreaTime(addDays(koreaStart, dayNumber - 1))
}

export function parseKoreaDate(dateString: string): Date {
  return fromKoreaTime(parseISO(dateString))
}
