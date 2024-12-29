import L from 'leaflet'

/**
 * Creates a custom icon for a stop marker with sequence number
 */
export function getStopIcon(sequence: number) {
  return L.divIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative">
        <div class="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-blue-600"></div>
        <div class="absolute -translate-x-1/2 -top-7 min-w-[24px] h-5 px-1 rounded bg-blue-600 text-white text-xs font-medium flex items-center justify-center">
          ${sequence}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}
