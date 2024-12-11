'use client'
import React, { useState } from 'react'
import { ThemeToggle } from '@/app/components/theme-toggle'
import { LanguageSwitcher } from '@/app/components/language-switcher'
import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { SignInButton } from '@/app/components/auth/sign-in-button'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const { isSignedIn } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-bold hover:opacity-80">
            KL Transit
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            {!isSignedIn ? <SignInButton /> : <UserButton />}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="flex flex-col items-center gap-4 p-4">
              <ThemeToggle />
              <LanguageSwitcher />
              {!isSignedIn ? <SignInButton /> : <UserButton />}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
