import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { seasonNumber: 'desc' },
      include: {
        problems: {
          orderBy: { dayNumber: 'asc' },
        },
        participants: {
          orderBy: { githubUsername: 'asc' },
        },
      },
    })

    if (seasons.length === 0) {
      return NextResponse.json({ error: 'No active season' }, { status: 404 })
    }

    return NextResponse.json(seasons)
  } catch (error) {
    console.error('Error fetching current season:', error)
    return NextResponse.json({ error: 'Failed to fetch current season' }, { status: 500 })
  }
}
