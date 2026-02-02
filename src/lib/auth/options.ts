import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { isAdminUser } from '@/lib/auth/admin'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'read:user user:email',
          prompt: 'select_account',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      const email = (user.email || (profile as any)?.email)?.toLowerCase()
      console.log('SignIn attempt:', { email })
      // 모든 사용자 로그인 허용
      return true
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.githubUsername = (profile as { login?: string })?.login
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub || ''
        session.user.githubUsername = token.githubUsername as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

export function isAdmin(email: string | undefined | null): boolean {
  return isAdminUser({ email })
}
