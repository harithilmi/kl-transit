import React from 'react'
import { ThemeToggle } from './theme-toggle'
import { LanguageSwitcher } from './language-switcher'

export function Navbar() {
  return (
    <div className="flex items-center justify-between p-4 bg-background text-foreground">
      <div className="text-lg font-bold">KL Transit</div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </div>
  )
}
