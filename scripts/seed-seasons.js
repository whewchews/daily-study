const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const args = process.argv.slice(2)
const selectedSeasons = new Set()
let dryRun = false

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i]
  if (arg === '--season' || arg === '-s') {
    const value = Number(args[i + 1])
    if (!Number.isNaN(value)) {
      selectedSeasons.add(value)
    }
    i += 1
  } else if (arg.startsWith('--season=')) {
    const value = Number(arg.split('=')[1])
    if (!Number.isNaN(value)) {
      selectedSeasons.add(value)
    }
  } else if (arg === '--dry-run') {
    dryRun = true
  }
}

const seasonsDir = path.join(__dirname, '..', 'data', 'seed', 'seasons')
if (!fs.existsSync(seasonsDir)) {
  console.error('Seed directory not found:', seasonsDir)
  process.exit(1)
}

const seasonFiles = fs
  .readdirSync(seasonsDir)
  .filter(
    file =>
      file.endsWith('.js') &&
      !file.startsWith('_') &&
      !file.toLowerCase().includes('template')
  )

const seasonDataList = seasonFiles.map(file => {
  const filePath = path.join(seasonsDir, file)
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const season = require(filePath)
  return { ...season, _file: file }
})

const filteredSeasons =
  selectedSeasons.size === 0
    ? seasonDataList
    : seasonDataList.filter(season => selectedSeasons.has(season.seasonNumber))

if (filteredSeasons.length === 0) {
  console.log('No matching seasons found.')
  process.exit(0)
}

const toDate = value => {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

const normalizeProblemType = value => {
  if (!value) return 'REGULAR'
  const upper = String(value).toUpperCase()
  if (['REGULAR', 'FREE', 'REST'].includes(upper)) {
    return upper
  }
  return 'REGULAR'
}

async function seedSeason(season) {
  const { seasonNumber, name, startDate, endDate, entryFee, status, isActive } = season

  if (!seasonNumber || !name || !startDate || !endDate) {
    throw new Error(`Missing required season fields in ${season._file}`)
  }

  const seasonData = {
    name,
    startDate: toDate(startDate),
    endDate: toDate(endDate),
    entryFee: entryFee ?? 20000,
  }

  if (status) {
    seasonData.status = status
  }
  if (isActive !== undefined) {
    seasonData.isActive = isActive
  }

  if (dryRun) {
    console.log(`[DRY RUN] Upsert season ${seasonNumber}: ${name}`)
    return { id: 'dry-run-season' }
  }

  const upsertedSeason = await prisma.season.upsert({
    where: { seasonNumber },
    update: seasonData,
    create: {
      seasonNumber,
      ...seasonData,
    },
  })

  const problems = Array.isArray(season.problems) ? season.problems : []
  for (const problem of problems) {
    if (!problem.dayNumber || !problem.title || !problem.assignedDate) {
      throw new Error(
        `Missing required problem fields in season ${seasonNumber} (${season._file})`
      )
    }

    const problemData = {
      title: problem.title,
      url: problem.url || null,
      assignedDate: toDate(problem.assignedDate),
      dayNumber: problem.dayNumber,
      problemType: normalizeProblemType(problem.problemType),
      isPractice: Boolean(problem.isPractice),
    }

    await prisma.problem.upsert({
      where: {
        seasonId_dayNumber: {
          seasonId: upsertedSeason.id,
          dayNumber: problem.dayNumber,
        },
      },
      update: problemData,
      create: {
        seasonId: upsertedSeason.id,
        ...problemData,
      },
    })
  }

  console.log(
    `Seeded season ${seasonNumber} (${name}) with ${problems.length} problems`
  )
}

async function main() {
  for (const season of filteredSeasons) {
    await seedSeason(season)
  }
}

main()
  .catch(error => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
