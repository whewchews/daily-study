import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { format } from 'date-fns'
import { prisma } from '@/lib/db/prisma'
import { commitCodeToGitHub } from '@/lib/github/commit'
import { isWithinSubmissionTime, getKoreaNow } from '@/lib/utils/date'
import { getSeasonStatusKey } from '@/lib/utils/season'
import { authOptions } from '@/lib/auth/options'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { problemId, code, customTitle, customUrl } = body

    if (!problemId || !code) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        season: true,
      },
    })

    if (!problem) {
      return NextResponse.json({ error: '문제를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 휴식일에는 제출 불가
    if (problem.problemType === 'REST') {
      return NextResponse.json(
        { error: '휴식일에는 제출할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 자율 문제인 경우 customTitle 필수
    if (problem.problemType === 'FREE' && !customTitle) {
      return NextResponse.json(
        { error: '자율 문제는 문제 제목을 입력해야 합니다.' },
        { status: 400 }
      )
    }

    if (getSeasonStatusKey(problem.season) !== 'ACTIVE') {
      return NextResponse.json(
        { error: '현재 진행중인 기수가 아닙니다.' },
        { status: 400 }
      )
    }

    const normalizedEmail = session.user.email?.toLowerCase() || undefined

    // 세션 이메일로만 참가자를 찾음 (클라이언트 제공 정보 불신)
    const participant = await prisma.participant.findFirst({
      where: {
        seasonId: problem.seasonId,
        email: normalizedEmail,
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: '등록된 참여자가 아닙니다.' },
        { status: 400 }
      )
    }

    if (participant.status === 'DROPPED') {
      return NextResponse.json(
        { error: '중도 포기한 참여자입니다.' },
        { status: 400 }
      )
    }

    if (participant.status === 'COMPLETED') {
      return NextResponse.json(
        { error: '이미 완료된 참여자입니다.' },
        { status: 400 }
      )
    }

    // GitHub username은 세션에서 가져오거나, 참가자 DB 정보 사용
    const githubUsername = session.user.name || participant.githubUsername

    if (!githubUsername) {
      return NextResponse.json(
        { error: 'GitHub 사용자 이름이 필요합니다. 프로필에서 설정해주세요.' },
        { status: 400 }
      )
    }

    // 참가자의 githubUsername이 없으면 업데이트
    if (!participant.githubUsername) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: { githubUsername },
      })
    }

    const now = getKoreaNow()
    const timestamp = format(now, 'yyMMddHHmm')

    // 자율 문제와 연습 문제는 시간 제한 없음
    const isValidTime =
      problem.problemType === 'FREE' ||
      problem.isPractice ||
      isWithinSubmissionTime(now, problem.assignedDate)

    const existingSubmission = await prisma.submission.findUnique({
      where: {
        participantId_problemId: {
          participantId: participant.id,
          problemId: problem.id,
        },
      },
    })

    // 자율 문제인 경우 customTitle 사용, 아니면 problem.title 사용
    const problemTitle = problem.problemType === 'FREE' ? customTitle : problem.title

    const fileName = `${problemTitle.replace(/[^a-zA-Z0-9가-힣-_]/g, '_')}_${timestamp}.md`

    const commitResult = await commitCodeToGitHub(
      problem.season.seasonNumber,
      githubUsername,
      problemTitle,
      code,
      session.user.email,
      now
    )

    let submission
    let messagePrefix

    if (existingSubmission) {
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          code,
          fileName,
          githubCommitSha: commitResult.sha || null,
          githubCommitUrl: commitResult.url || null,
          isValid: isValidTime,
          submittedAt: now,
        },
      })
      messagePrefix = '수정이'
    } else {
      submission = await prisma.submission.create({
        data: {
          seasonId: problem.seasonId,
          participantId: participant.id,
          problemId: problem.id,
          code,
          fileName,
          githubCommitSha: commitResult.sha || null,
          githubCommitUrl: commitResult.url || null,
          isValid: isValidTime,
        },
      })
      messagePrefix = '제출이'
    }

    return NextResponse.json({
      success: true,
      submission,
      commit: commitResult,
      isValid: isValidTime,
      message: isValidTime
        ? `${messagePrefix} 완료되었습니다.`
        : `${messagePrefix} 완료되었지만, 시간이 지나 무효 처리됩니다.`,
    })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
