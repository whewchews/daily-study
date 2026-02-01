'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { LoginModal } from '@/components/auth/LoginModal'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    AccessDenied: '관리자 권한이 없는 계정입니다.',
    Configuration: '서버 설정 오류가 발생했습니다.',
    Verification: '인증 링크가 만료되었습니다.',
    Default: '알 수 없는 오류가 발생했습니다.',
  }

  const message = errorMessages[error || 'Default'] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
        <div className="text-red-500">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">로그인 오류</h2>
        <p className="text-gray-600">{message}</p>
        <LoginModal
          triggerLabel="다시 시도"
          triggerClassName="inline-block px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          callbackUrl="/admin"
        />
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
