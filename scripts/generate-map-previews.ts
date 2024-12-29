import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'
import routes from '../src/data/clean/routes.json'

async function generateMapPreviews() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setViewport({ width: 800, height: 400 })

  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'public', 'map-previews')
  await fs.mkdir(outputDir, { recursive: true })

  // Test with just one route (T410)
  const testRoute = routes.find((route) => route.route_number === 'T410')
  if (!testRoute) {
    console.error('Test route T410 not found')
    await browser.close()
    return
  }

  try {
    console.log(`Generating preview for route ${testRoute.route_number}...`)

    // Navigate to preview page with locale
    await page.goto(
      `http://localhost:3000/en/map-preview/${testRoute.route_number}`,
      { waitUntil: 'networkidle0' },
    )
    await page.waitForSelector('[data-map-ready="true"]')

    // Take and save screenshot
    await page.screenshot({
      path: path.join(outputDir, `${testRoute.route_number}.png`),
      type: 'png',
    })

    console.log(`✓ Generated preview for ${testRoute.route_number}`)
  } catch (error) {
    console.error(
      `Failed to generate preview for ${testRoute.route_number}:`,
      error,
    )
  }

  await browser.close()
}

// Run the script
generateMapPreviews().catch(console.error)
