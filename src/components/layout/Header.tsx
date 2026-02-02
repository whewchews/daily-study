'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { LoginModal } from '@/components/auth/LoginModal'
import { isAdminUser } from '@/lib/auth/admin'

export function Header() {
  const { data: session } = useSession()
  const showAdminLink = isAdminUser({
    email: session?.user?.email,
  })

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Daily Study
            </Link>
            <nav className="hidden md:flex space-x-4">
              {session ? (
                <Link
                  href="/submit"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  코드 제출
                </Link>
              ) : (
                <LoginModal
                  triggerLabel="코드 제출"
                  callbackUrl="/submit"
                  triggerClassName="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                />
              )}
              <Link
                href="/seasons"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                기수 현황
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                {showAdminLink && (
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    관리자
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  로그아웃
                </button>
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ''}
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </>
            ) : (
              <LoginModal
                triggerLabel="로그인"
                triggerClassName="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
