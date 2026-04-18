import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const iconSvg = readFileSync(resolve(root, 'public/icons/icon.svg'))
const maskableSvg = readFileSync(resolve(root, 'public/icons/icon-maskable.svg'))

const sizes = [
  { file: 'icon-72.png', size: 72, svg: iconSvg },
  { file: 'icon-96.png', size: 96, svg: iconSvg },
  { file: 'icon-128.png', size: 128, svg: iconSvg },
  { file: 'icon-144.png', size: 144, svg: iconSvg },
  { file: 'icon-152.png', size: 152, svg: iconSvg },
  { file: 'icon-180.png', size: 180, svg: iconSvg }, // apple-touch-icon
  { file: 'icon-192.png', size: 192, svg: maskableSvg },
  { file: 'icon-384.png', size: 384, svg: maskableSvg },
  { file: 'icon-512.png', size: 512, svg: maskableSvg },
]

for (const { file, size, svg } of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(root, 'public/icons', file))
  console.log(`✓ ${file} (${size}x${size})`)
}

// Favicon: 32x32 PNG + 16x16 PNG
await sharp(iconSvg).resize(32, 32).png().toFile(resolve(root, 'public/favicon-32.png'))
await sharp(iconSvg).resize(16, 16).png().toFile(resolve(root, 'public/favicon-16.png'))
console.log('✓ favicon-32.png, favicon-16.png')

// Apple touch icon at root (many systems look here by default)
await sharp(iconSvg).resize(180, 180).png().toFile(resolve(root, 'public/apple-touch-icon.png'))
console.log('✓ apple-touch-icon.png')

console.log('\nAll icons generated.')
