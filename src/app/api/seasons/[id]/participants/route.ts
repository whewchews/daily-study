import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: seasonId } = await params
    const participants = await prisma.participant.findMany({
      where: { seasonId },
      orderBy: { githubUsername: 'asc' },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    })
    return NextResponse.json(participants)
  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: seasonId } = await params
    const body = await request.json()
    const rawEmail = typeof body?.email === 'string' ? body.email : ''
    const email = rawEmail.trim().toLowerCase()
    const { isPaid, status, githubUsername } = body

    if (!email) {
      return NextResponse.json({ error: '이메일이 필요합니다.' }, { status: 400 })
    }

    const existingParticipant = await prisma.participant.findFirst({
      where: {
        seasonId,
        OR: [{ email }, ...(githubUsername ? [{ githubUsername }] : [])],
      },
    })

    if (existingParticipant) {
      return NextResponse.json({ error: '이미 등록된 참여자입니다.' }, { status: 400 })
    }

    const participant = await prisma.participant.create({
      data: {
        seasonId,
        email,
        ...(githubUsername ? { githubUsername } : {}),
        isPaid: isPaid || false,
        ...(status && { status }),
      },
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error('Error creating participant:', error)
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { participantId, isPaid, status, refundCompleted } = body

    const participant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        ...(isPaid !== undefined && { isPaid }),
        ...(status !== undefined && { status }),
        ...(refundCompleted !== undefined && { refundCompleted }),
      },
    })

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Error updating participant:', error)
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 })
    }

    await prisma.participant.delete({ where: { id: participantId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting participant:', error)
    return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 })
  }
}
