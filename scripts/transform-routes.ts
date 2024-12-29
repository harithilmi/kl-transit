import fs from 'fs'
import path from 'path'

// Types
interface OldRoute {
  route_number: string
  route_name: string
  route_type: string
}

interface NewRoute {
  routeId: number
  routeShortName: string
  routeLongName: string
  operatorId: string
  networkId: string
  routeType: number
  routeColor: string
  routeTextColor: string
  trips: []
}

// Color mappings
const colorScheme: Record<string, { color: string; textColor: string }> = {
  utama: { color: 'dc241f', textColor: 'ffffff' },
  tempatan: { color: 'dc241f', textColor: 'ffffff' },
  bet: { color: 'dc241f', textColor: 'ffffff' },
  mrt_feeder: { color: '3b7534', textColor: 'ffffff' },
  lrt_feeder: { color: '0075bf', textColor: 'ffffff' },
  mbpj: { color: '004ea2', textColor: 'ffffff' },
  mbsa: { color: '004ea2', textColor: 'ffffff' },
  mpaj: { color: '004ea2', textColor: 'ffffff' },
  mpkl: { color: '004ea2', textColor: 'ffffff' },
  mbsj: { color: '004ea2', textColor: 'ffffff' },
  mbdk: { color: '004ea2', textColor: 'ffffff' },
  mpkj: { color: '004ea2', textColor: 'ffffff' },
  mps: { color: '004ea2', textColor: 'ffffff' },
  nadiputra: { color: '00a650', textColor: 'ffffff' },
  batu_caves_shuttle: { color: 'dc241f', textColor: 'ffffff' },
  mall_shuttle: { color: '666666', textColor: 'ffffff' },
  merdeka_shuttle: { color: 'dc241f', textColor: 'ffffff' },
  shuttle: { color: '666666', textColor: 'ffffff' },
  drt: { color: 'dc241f', textColor: 'ffffff' },
  unknown: { color: '666666', textColor: 'ffffff' },
}

// Operator mappings
const getOperatorId = (networkId: string): string => {
  switch (networkId) {
    case 'utama':
    case 'tempatan':
    case 'bet':
    case 'mrt_feeder':
    case 'lrt_feeder':
    case 'drt':
    case 'shuttle':
    case 'batu_caves_shuttle':
    case 'merdeka_shuttle':
      return 'rapid_bus'
    case 'mbpj':
    case 'mbsa':
    case 'mpaj':
    case 'mpkl':
    case 'mbsj':
    case 'mbdk':
    case 'mpkj':
    case 'mps':
    case 'nadiputra':
      return networkId
    default:
      return 'unknown'
  }
}

async function transformRoutes() {
  try {
    // Read the existing routes file
    const oldRoutesPath = path.join(process.cwd(), 'src/data/clean/routes.json')
    const oldRoutes: OldRoute[] = JSON.parse(
      fs.readFileSync(oldRoutesPath, 'utf-8'),
    )

    // Transform the routes
    const newRoutes: NewRoute[] = oldRoutes.map((route, index) => {
      const colors = colorScheme[route.route_type] ?? colorScheme.unknown

      return {
        routeId: index + 1,
        routeShortName: route.route_number,
        routeLongName: route.route_name,
        operatorId: getOperatorId(route.route_type),
        networkId: route.route_type,
        routeType: 3, // GTFS type for bus
        routeColor: colors?.color ?? '',
        routeTextColor: colors?.textColor ?? '',
        trips: [],
      }
    })

    // Write the new routes file
    const newRoutesPath = path.join(process.cwd(), 'src/data/v2/routes.json')
    fs.writeFileSync(newRoutesPath, JSON.stringify(newRoutes, null, 2))

    console.log(`Transformed ${newRoutes.length} routes`)
    console.log(`New routes file written to: ${newRoutesPath}`)
  } catch (error) {
    console.error('Error transforming routes:', error)
  }
}

transformRoutes()
