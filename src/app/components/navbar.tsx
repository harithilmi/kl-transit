import React from 'react'
import { ThemeToggle } from './theme-toggle'
import { LanguageSwitcher } from './language-switcher'
import { SignedOut, SignedIn, SignInButton, UserButton } from '@clerk/nextjs'
export function Navbar() {
  return (
    <div className="flex items-center justify-between p-4 bg-background text-foreground">
      <div className="text-lg font-bold">KL Transit</div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <LanguageSwitcher />
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  )
}
