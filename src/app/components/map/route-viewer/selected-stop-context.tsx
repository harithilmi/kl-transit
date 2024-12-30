import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Stop } from '@/types/routes'

interface SelectedStopContextType {
  selectedStop: Stop | null
  setSelectedStop: (stop: Stop | null) => void
}

const SelectedStopContext = createContext<SelectedStopContextType | null>(null)

export function SelectedStopProvider({ children }: { children: ReactNode }) {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null)

  return (
    <SelectedStopContext.Provider value={{ selectedStop, setSelectedStop }}>
      {children}
    </SelectedStopContext.Provider>
  )
}

export function useSelectedStop() {
  const context = useContext(SelectedStopContext)
  if (!context) {
    throw new Error('useSelectedStop must be used within a SelectedStopProvider')
  }
  return context
} 