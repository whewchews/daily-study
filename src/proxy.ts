import { withAuth } from 'next-auth/middleware'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) return false

      if (req.nextUrl.pathname.startsWith('/admin')) {
        return !!token.email && ADMIN_EMAILS.includes(token.email.toLowerCase())
      }

      return true
    },
  },
})

export const config = {
  matcher: ['/admin/:path*', '/submit/:path*'],
}
