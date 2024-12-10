'use client'
import React from 'react'
import { ThemeToggle } from './theme-toggle'
import { LanguageSwitcher } from './language-switcher'
import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { SignInButton } from './auth/sign-in-button'
import Link from 'next/link'

export function Navbar() {
  const { isSignedIn } = useUser()
  return (
    <div className="flex items-center justify-between p-4 bg-background text-foreground">
      <Link href="/" className="text-lg font-bold hover:opacity-80">
        KL Transit
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <LanguageSwitcher />
        {/* Auth buttons */}
        {!isSignedIn ? <SignInButton /> : <UserButton />}
      </div>
    </div>
  )
}
