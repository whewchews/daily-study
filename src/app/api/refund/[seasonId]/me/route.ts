import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { calculateRefund, RefundResult } from "@/lib/utils/refund";

const buildRankSummaries = (results: RefundResult[], entryFee: number) => {
  const rankGroups = new Map<number, RefundResult[]>();

  results
    .filter((result) => !result.isDropped && result.rank !== null)
    .forEach((result) => {
      const rank = result.rank as number;
      const group = rankGroups.get(rank) || [];
      group.push(result);
      rankGroups.set(rank, group);
    });

  return Array.from(rankGroups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rank, group]) => {
      const totalPercentage = group.reduce(
        (sum, item) => sum + item.refundPercentage,
        0
      );
      const totalRefund = group.reduce((sum, item) => sum + item.refundAmount, 0);
      const totalBonus = group.reduce(
        (sum, item) => sum + Math.max(0, item.refundAmount - entryFee),
        0
      );

      return {
        rank,
        count: group.length,
        totalPercentage,
        totalBonus,
        totalRefund,
      };
    });
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.githubUsername) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seasonId } = await params;
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        problems: {
          where: { isPractice: false },
        },
        participants: {
          where: { isPaid: true },
          include: {
            submissions: {
              where: { isValid: true },
              select: { problemId: true },
            },
          },
        },
      },
    });

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const problemIds = new Set(season.problems.map((problem) => problem.id));
    const totalProblems = season.problems.length;

    const problemsData = season.problems.map((problem) => ({
      id: problem.id,
      assignedDate: problem.assignedDate,
    }));

    const participantsData = season.participants.map((participant) => ({
      githubUsername:
        participant.githubUsername ||
        participant.email ||
        `participant-${participant.id}`,
      isPaid: participant.isPaid,
      status: participant.status,
      submittedProblemIds: participant.submissions
        .filter((submission) => problemIds.has(submission.problemId))
        .map((submission) => submission.problemId),
    }));

    const refundResult = calculateRefund(
      participantsData,
      problemsData,
      season.entryFee
    );

    const activeResults = refundResult.results.filter((result) => !result.isDropped);
    const droppedResults = refundResult.results.filter((result) => result.isDropped);

    const rankCounts = {
      first: activeResults.filter((result) => result.rank === 1).length,
      second: activeResults.filter((result) => result.rank === 2).length,
      third: activeResults.filter((result) => result.rank === 3).length,
      other: activeResults.filter((result) => (result.rank || 0) > 3).length,
    };

    const rankSummaries = buildRankSummaries(refundResult.results, season.entryFee);

    const activeRefundTotal = activeResults.reduce(
      (sum, result) => sum + result.refundAmount,
      0
    );
    const bonusTotal = activeResults.reduce(
      (sum, result) => sum + Math.max(0, result.refundAmount - season.entryFee),
      0
    );
    const bonusRemainder = Math.max(0, refundResult.droppedPool - bonusTotal);

    const normalizedEmail = session.user.email?.toLowerCase() || undefined

    const myParticipant = await prisma.participant.findFirst({
      where: {
        seasonId,
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(session.user.githubUsername
            ? [{ githubUsername: session.user.githubUsername }]
            : []),
        ],
      },
      select: {
        id: true,
        isPaid: true,
        email: true,
        githubUsername: true,
      },
    });

    let myStatus: "NOT_REGISTERED" | "UNPAID" | "ACTIVE" | "DROPPED" =
      "NOT_REGISTERED";
    let myRefundAmount = 0;
    let myMissedCount = 0;
    let mySubmittedCount = 0;
    let myTotalProblems = totalProblems;

    if (myParticipant) {
      if (!myParticipant.isPaid) {
        myStatus = "UNPAID";
      } else {
        const myIdentifier =
          myParticipant.githubUsername ||
          myParticipant.email ||
          `participant-${myParticipant.id}`;
        const myResult = refundResult.results.find(
          (result) => result.githubUsername === myIdentifier
        );

        if (myResult) {
          myStatus = myResult.isDropped ? "DROPPED" : "ACTIVE";
          myRefundAmount = myResult.refundAmount;
          myMissedCount = myResult.missedCount;
          mySubmittedCount = myResult.submittedCount;
          myTotalProblems = myResult.totalProblems;
        }
      }
    }

    return NextResponse.json({
      season: {
        id: season.id,
        seasonNumber: season.seasonNumber,
        name: season.name,
        entryFee: season.entryFee,
      },
      totalProblems,
      totalPool: refundResult.totalPool,
      droppedPool: refundResult.droppedPool,
      summary: {
        paidCount: refundResult.results.length,
        activeCount: activeResults.length,
        droppedCount: droppedResults.length,
        rankCounts,
        rankSummaries,
        activeRefundTotal,
        bonusTotal,
        bonusRemainder,
      },
      my: {
        status: myStatus,
        refundAmount: myRefundAmount,
        missedCount: myMissedCount,
        submittedCount: mySubmittedCount,
        totalProblems: myTotalProblems,
      },
    });
  } catch (error) {
    console.error("Error calculating refund:", error);
    return NextResponse.json(
      { error: "Failed to calculate refund" },
      { status: 500 }
    );
  }
}
