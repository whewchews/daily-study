'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: '대시보드', href: '/admin' },
  { name: '기수 관리', href: '/admin/seasons' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 min-h-screen">
      <div className="p-4">
        <Link href="/" className="text-xl font-bold text-white">
          Daily Study
        </Link>
        <p className="text-gray-400 text-sm mt-1">관리자 페이지</p>
      </div>
      <nav className="mt-8">
        {navigation.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 text-sm ${
                isActive
                  ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
