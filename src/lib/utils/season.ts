export type SeasonStatusKey = 'UPCOMING' | 'ACTIVE' | 'COMPLETED'

const STATUS_LABELS: Record<SeasonStatusKey, string> = {
  UPCOMING: '예정',
  ACTIVE: '진행중',
  COMPLETED: '종료',
}

const STATUS_BADGE_CLASSES: Record<SeasonStatusKey, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
}

export function getSeasonStatusKey(season: {
  status?: SeasonStatusKey | null;
  isActive?: boolean | null;
}): SeasonStatusKey {
  if (season.status === 'COMPLETED') {
    return 'COMPLETED'
  }
  if (season.isActive || season.status === 'ACTIVE') {
    return 'ACTIVE'
  }
  return 'UPCOMING'
}

export function getSeasonStatusLabel(season: {
  status?: SeasonStatusKey | null;
  isActive?: boolean | null;
}): string {
  return STATUS_LABELS[getSeasonStatusKey(season)]
}

export function getSeasonStatusBadgeClass(season: {
  status?: SeasonStatusKey | null;
  isActive?: boolean | null;
}): string {
  return STATUS_BADGE_CLASSES[getSeasonStatusKey(season)]
}

export const SEASON_STATUS_OPTIONS = [
  { value: 'UPCOMING' as const, label: STATUS_LABELS.UPCOMING },
  { value: 'ACTIVE' as const, label: STATUS_LABELS.ACTIVE },
  { value: 'COMPLETED' as const, label: STATUS_LABELS.COMPLETED },
]
