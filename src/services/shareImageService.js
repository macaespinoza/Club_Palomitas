const sharp = require('sharp')
const path = require('path')
const https = require('https')
const http = require('http')

// Colores de la app
const COLORS = {
    inkBlack: '#081f21',
    pearlAqua: '#69dadc',
    azureMist: '#eefbfb',
    hotPinkWeb: '#f471b5',
    royalGold: '#fae04c'
}

// Dimensiones para formato 9:16 (Stories)
const WIDTH = 1080
const HEIGHT = 1920

/**
 * Descarga una imagen desde una URL
 */
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Seguir redirect
                return downloadImage(response.headers.location).then(resolve).catch(reject)
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`))
                return
            }

            const chunks = []
            response.on('data', chunk => chunks.push(chunk))
            response.on('end', () => resolve(Buffer.concat(chunks)))
            response.on('error', reject)
        }).on('error', reject)
    })
}

/**
 * Genera estrellas como SVG
 */
function generateStarsSVG(rating, starSize = 60) {
    const stars = []
    const gap = 10
    const totalWidth = (starSize * 5) + (gap * 4)
    const startX = (WIDTH - totalWidth) / 2

    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating
        const x = startX + (i - 1) * (starSize + gap)
        const color = filled ? COLORS.royalGold : '#4a4a4a'

        stars.push(`
            <svg x="${x}" y="0" width="${starSize}" height="${starSize}" viewBox="0 0 24 24">
                <path fill="${color}" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        `)
    }

    return `<svg width="${WIDTH}" height="${starSize}">${stars.join('')}</svg>`
}

/**
 * Ajusta el texto a múltiples líneas
 */
function wrapText(text, maxCharsPerLine = 35) {
    const words = text.split(' ')
    const lines = []
    let currentLine = ''

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
            currentLine = (currentLine + ' ' + word).trim()
        } else {
            if (currentLine) lines.push(currentLine)
            currentLine = word
        }
    }
    if (currentLine) lines.push(currentLine)

    return lines
}

/**
 * Genera la imagen de reseña compartible
 */
async function generateShareImage({
    posterUrl,
    rating,
    comment,
    movieTitle,
    movieYear,
    username
}) {
    // Descargar poster
    let posterBuffer
    try {
        posterBuffer = await downloadImage(posterUrl)
    } catch (error) {
        console.error('Error descargando poster:', error.message)
        // Crear placeholder si falla la descarga
        posterBuffer = await sharp({
            create: {
                width: 400,
                height: 600,
                channels: 4,
                background: { r: 105, g: 218, b: 220, alpha: 1 }
            }
        }).png().toBuffer()
    }

    // Redimensionar poster para que quepa bien
    const posterWidth = 500
    const posterHeight = 750
    const resizedPoster = await sharp(posterBuffer)
        .resize(posterWidth, posterHeight, { fit: 'cover' })
        .png()
        .toBuffer()

    // Crear overlay con bordes redondeados para el poster
    const roundedCorners = Buffer.from(
        `<svg width="${posterWidth}" height="${posterHeight}">
            <rect x="0" y="0" width="${posterWidth}" height="${posterHeight}" rx="20" ry="20" fill="white"/>
        </svg>`
    )

    const posterWithRoundedCorners = await sharp(resizedPoster)
        .composite([{
            input: roundedCorners,
            blend: 'dest-in'
        }])
        .png()
        .toBuffer()

    // Preparar texto del comentario
    console.log('Comentario recibido:', comment)
    const commentLines = comment ? wrapText(comment, 38) : []
    console.log('Líneas de comentario:', commentLines)
    const maxCommentLines = 6
    const displayLines = commentLines.slice(0, maxCommentLines)
    if (commentLines.length > maxCommentLines) {
        displayLines[maxCommentLines - 1] = displayLines[maxCommentLines - 1].slice(0, -3) + '...'
    }

    // Generar SVG del contenido
    const posterX = (WIDTH - posterWidth) / 2
    const posterY = 280
    const starsY = posterY + posterHeight + 50
    const commentY = starsY + 100
    const lineHeight = 42

    // Generar el SVG del comentario por separado
    let commentSvg = ''
    if (displayLines.length > 0) {
        for (let i = 0; i < displayLines.length; i++) {
            const line = displayLines[i]
            const isFirst = i === 0
            const isLast = i === displayLines.length - 1
            const openQuote = isFirst ? '"' : ''
            const closeQuote = isLast ? '"' : ''
            const yPos = commentY + (i * lineHeight)
            commentSvg += `<text x="${WIDTH / 2}" y="${yPos}" font-family="Arial, sans-serif" font-size="32" fill="${COLORS.azureMist}" text-anchor="middle" font-style="italic">${openQuote}${escapeXml(line)}${closeQuote}</text>\n`
        }
    }
    console.log('SVG del comentario generado:', commentSvg)

    // Crear el SVG del texto y elementos
    const svgContent = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${COLORS.inkBlack};stop-opacity:1" />
            <stop offset="50%" style="stop-color:#0d2e31;stop-opacity:1" />
            <stop offset="100%" style="stop-color:${COLORS.inkBlack};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${COLORS.hotPinkWeb}" flood-opacity="0.5"/>
        </filter>
    </defs>

    <!-- Fondo -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGradient)"/>

    <!-- Decoraciones -->
    <circle cx="100" cy="200" r="150" fill="${COLORS.hotPinkWeb}" opacity="0.1"/>
    <circle cx="${WIDTH - 100}" cy="${HEIGHT - 300}" r="200" fill="${COLORS.pearlAqua}" opacity="0.1"/>

    <!-- Logo/Título de la app -->
    <text x="${WIDTH / 2}" y="100" font-family="Arial, sans-serif" font-size="48" font-weight="800" fill="${COLORS.royalGold}" text-anchor="middle">CLUB PALOMITAS</text>

    <!-- Línea decorativa -->
    <line x1="${WIDTH / 2 - 150}" y1="130" x2="${WIDTH / 2 + 150}" y2="130" stroke="${COLORS.pearlAqua}" stroke-width="3"/>

    <!-- Título película -->
    <text x="${WIDTH / 2}" y="200" font-family="Arial, sans-serif" font-size="38" font-weight="800" fill="${COLORS.azureMist}" text-anchor="middle">${escapeXml(movieTitle.length > 30 ? movieTitle.substring(0, 30) + '...' : movieTitle)}</text>
    <text x="${WIDTH / 2}" y="240" font-family="Arial, sans-serif" font-size="24" fill="${COLORS.pearlAqua}" text-anchor="middle">${movieYear}</text>

    <!-- Borde del poster -->
    <rect x="${posterX - 8}" y="${posterY - 8}" width="${posterWidth + 16}" height="${posterHeight + 16}" rx="24" ry="24" fill="none" stroke="${COLORS.royalGold}" stroke-width="4" filter="url(#shadow)"/>

    <!-- Estrellas -->
    ${generateStarsInline(rating, starsY)}

    <!-- Comentario -->
    ${commentSvg}

    <!-- Usuario -->
    <text x="${WIDTH / 2}" y="${HEIGHT - 150}" font-family="Arial, sans-serif" font-size="28" fill="${COLORS.hotPinkWeb}" text-anchor="middle">Resena de @${escapeXml(username)}</text>

    <!-- Línea inferior -->
    <line x1="${WIDTH / 2 - 100}" y1="${HEIGHT - 100}" x2="${WIDTH / 2 + 100}" y2="${HEIGHT - 100}" stroke="${COLORS.pearlAqua}" stroke-width="2"/>

    <!-- Watermark -->
    <text x="${WIDTH / 2}" y="${HEIGHT - 60}" font-family="Arial, sans-serif" font-size="20" fill="${COLORS.pearlAqua}" text-anchor="middle" opacity="0.7">clubpalomitas.app</text>
</svg>`

    // Crear imagen base con el SVG
    const baseImage = await sharp(Buffer.from(svgContent))
        .png()
        .toBuffer()

    // Componer imagen final con el poster
    const finalImage = await sharp(baseImage)
        .composite([{
            input: posterWithRoundedCorners,
            top: posterY,
            left: posterX
        }])
        .png({ quality: 90 })
        .toBuffer()

    return finalImage
}

/**
 * Genera estrellas inline para el SVG principal
 */
function generateStarsInline(rating, y) {
    const starSize = 50
    const gap = 15
    const totalWidth = (starSize * 5) + (gap * 4)
    const startX = (WIDTH - totalWidth) / 2

    let starsHtml = ''
    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating
        const x = startX + (i - 1) * (starSize + gap)
        const color = filled ? COLORS.royalGold : '#4a5568'

        starsHtml += `
            <path transform="translate(${x}, ${y}) scale(${starSize / 24})" fill="${color}" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        `
    }
    return starsHtml
}

/**
 * Escapa caracteres especiales para XML/SVG
 */
function escapeXml(text) {
    if (!text) return ''
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

module.exports = {
    generateShareImage,
    COLORS,
    WIDTH,
    HEIGHT
}
