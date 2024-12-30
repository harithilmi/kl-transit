import { createContext, useContext, type ReactNode } from 'react'
import type { Map } from 'leaflet'

interface MapContextType {
  map: Map | null
  setMap: (map: Map) => void
}

const MapContext = createContext<MapContextType | null>(null)

export function MapProvider({
  children,
  value,
}: {
  children: ReactNode
  value: MapContextType
}) {
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

export function useMapContext() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider')
  }
  return context
} 