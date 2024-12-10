import { Button } from '@/app/components/ui/button'
import { SignInButton as ClerkSignInButton } from '@clerk/nextjs'

export function SignInButton() {
  return (
    <ClerkSignInButton mode="modal">
      <Button variant="ghost" size="icon" className="rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="sr-only">Sign in</span>
      </Button>
    </ClerkSignInButton>
  )
}
