import { withAuth } from 'next-auth/middleware'
import { isAdminUser } from '@/lib/auth/admin'

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) return false

      if (req.nextUrl.pathname.startsWith('/admin')) {
        return isAdminUser({
          email: token.email,
        })
      }

      return true
    },
  },
})

export const config = {
  matcher: ['/admin/:path*', '/submit/:path*'],
}
