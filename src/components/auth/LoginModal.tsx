'use client'

import { signIn } from 'next-auth/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

type LoginModalProps = {
  triggerLabel?: string
  triggerClassName?: string
  callbackUrl?: string
  title?: string
  description?: string
}

export function LoginModal({
  triggerLabel = '로그인',
  triggerClassName = 'text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium',
  callbackUrl,
  title = '로그인',
  description = 'GitHub 계정으로 로그인하세요',
}: LoginModalProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const titleId = useId()

  const search = searchParams.toString()
  const resolvedCallbackUrl = callbackUrl || (search ? `${pathname}?${search}` : pathname)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const handleSignIn = () =>
    signIn('github', { callbackUrl: resolvedCallbackUrl }, { prompt: 'select_account' })

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
          >
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 id={titleId} className="text-xl font-bold text-gray-900">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{description}</p>
            <button
              type="button"
              onClick={handleSignIn}
              className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub로 로그인
            </button>
          </div>
        </div>
      )}
    </>
  )
}
