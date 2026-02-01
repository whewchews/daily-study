import { Octokit } from '@octokit/rest'
import { format } from 'date-fns'
import { getKoreaNow } from '@/lib/utils/date'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const REPO_OWNER = process.env.GITHUB_REPO_OWNER || ''
const REPO_NAME = process.env.GITHUB_REPO_NAME || ''

interface CommitResult {
  success: boolean
  sha?: string
  url?: string
  error?: string
}

export async function commitCodeToGitHub(
  seasonNumber: number,
  githubUsername: string,
  problemTitle: string,
  code: string,
  userEmail: string,
  submittedAt: Date
): Promise<CommitResult> {
  try {
    const timestamp = format(submittedAt, 'yyMMddHHmm')
    const sanitizedTitle = problemTitle.replace(/[^a-zA-Z0-9가-힣-_]/g, '_')
    const filePath = `season${seasonNumber}/${githubUsername}/${sanitizedTitle}_${timestamp}.md`

    let existingSha: string | undefined

    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
      })

      if (!Array.isArray(existingFile)) {
        existingSha = existingFile.sha
      }
    } catch {
      // File doesn't exist, which is fine
    }

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: `[Season ${seasonNumber}] ${githubUsername} - ${problemTitle}`,
      content: Buffer.from(code).toString('base64'),
      sha: existingSha,
      committer: {
        name: 'Daily Study Bot',
        email: 'bot@daily-study.com',
      },
      author: {
        name: githubUsername,
        email: userEmail,
      },
    })

    return {
      success: true,
      sha: data.commit.sha,
      url: data.commit.html_url,
    }
  } catch (error) {
    console.error('GitHub commit error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
