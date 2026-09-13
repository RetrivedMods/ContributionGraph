const { buildSmoothPath } = require('./bezier')

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function monthName(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
}

function niceTicks(max, count) {
  if (max <= 0) return [1]
  const rawStep = max / count
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const residual = rawStep / mag
  let step
  if (residual > 5) step = 10 * mag
  else if (residual > 2) step = 5 * mag
  else if (residual > 1) step = 2 * mag
  else step = mag

  const ticks = []
  for (let v = step; v <= max + step * 0.5; v += step) ticks.push(Math.round(v))
  return ticks.length ? ticks : [Math.ceil(max)]
}

function approxLength(points) {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return len
}

function renderGraph(data, opts) {
  const width = opts.width
  const height = opts.height
  const padLeft = opts.showYAxis ? 42 : 20
  const padRight = 20
  const padTop = opts.title ? 55 : 30
  const padBottom = opts.showXAxis ? 35 : 18
  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom

  const rawMax = Math.max(1, ...data.map(d => d.count))
  const ticks = opts.showYAxis ? niceTicks(rawMax, opts.yTicks) : []
  const scaleMax = ticks.length ? Math.max(rawMax, ticks[ticks.length - 1]) : rawMax

  const points = data.map((d, i) => ({
    x: padLeft + (i / (data.length - 1)) * plotWidth,
    y: padTop + plotHeight - (d.count / scaleMax) * plotHeight,
    date: d.date,
    count: d.count
  }))

  const linePath = buildSmoothPath(points)
  const floorY = padTop + plotHeight
  const areaPath = opts.area
    ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${floorY} L ${points[0].x.toFixed(2)} ${floorY} Z`
    : ''

  const singleMonth = points.every(p => p.date.slice(0, 7) === points[0].date.slice(0, 7))

  let xTicks = []
  if (opts.showXAxis) {
    if (singleMonth) {
      const step = points.length > 20 ? 2 : 1
      xTicks = points.filter((_, i) => i % step === 0 || i === points.length - 1)
    } else {
      let lastMonth = null
      for (const p of points) {
        const month = p.date.slice(0, 7)
        if (month !== lastMonth) {
          xTicks.push(p)
          lastMonth = month
        }
      }
    }
  }

  const yGridLines = ticks
    .map(t => {
      const y = padTop + plotHeight - (t / scaleMax) * plotHeight
      return `<line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" stroke="${opts.gridColor}" stroke-opacity="${opts.showGrid ? 0.1 : 0}" stroke-width="1"/>`
    })
    .join('')

  const yLabels = ticks
    .map(t => {
      const y = padTop + plotHeight - (t / scaleMax) * plotHeight
      return `<text x="${padLeft - 10}" y="${(y + 3.5).toFixed(1)}" fill="${opts.textColor}" font-size="10" font-family="${opts.font}" opacity="0.65" text-anchor="end">${t}</text>`
    })
    .join('')

  const xLabels = xTicks
    .map(p => {
      const label = singleMonth ? String(parseInt(p.date.slice(8, 10), 10)) : monthName(p.date)
      return `<text x="${p.x.toFixed(1)}" y="${height - 12}" fill="${opts.textColor}" font-size="11" font-family="${opts.font}" opacity="0.7" text-anchor="middle">${label}</text>`
    })
    .join('')

  const totalContribs = data.reduce((sum, d) => sum + d.count, 0)

  const titleX = opts.titleAlign === 'left' ? padLeft : opts.titleAlign === 'right' ? width - padRight : width / 2
  const titleAnchor = opts.titleAlign === 'left' ? 'start' : opts.titleAlign === 'right' ? 'end' : 'middle'

  const title = opts.title
    ? `<text x="${titleX}" y="28" fill="${opts.titleColor}" font-size="${opts.titleSize}" font-family="${opts.font}" font-weight="${opts.titleWeight}" text-anchor="${titleAnchor}">${escapeXml(opts.title)}</text>`
    : ''

  const border = opts.hideBorder
    ? ''
    : `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${opts.radius}" fill="none" stroke="${opts.borderColor}" stroke-opacity="0.18" stroke-width="1"/>`

  const peak = points.reduce((a, b) => (b.count > a.count ? b : a), points[0])
  const peakDot = opts.showPeak && peak.count > 0
    ? `<circle cx="${peak.x.toFixed(1)}" cy="${peak.y.toFixed(1)}" r="4" fill="${opts.point}"><animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite"/></circle>`
    : ''

  const pointDots = opts.showPoints
    ? points
        .filter(p => p.count > 0)
        .map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.4" fill="${opts.point}"/>`)
        .join('')
    : ''

  const pathLength = Math.max(1, Math.round(approxLength(points)))
  const drawAnimation = opts.animate
    ? `<animate attributeName="stroke-dashoffset" from="${pathLength}" to="0" dur="1.6s" fill="freeze"/>`
    : ''
  const dashAttrs = opts.animate ? `stroke-dasharray="${pathLength}" stroke-dashoffset="${pathLength}"` : ''

  const glowFilter = opts.glow
    ? `<filter id="lineGlow" x="-30%" y="-30%" width="160%" height="160%">
<feGaussianBlur stdDeviation="3" result="blur"/>
<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`
    : ''

  const linePathAttrs = [opts.glow ? `filter="url(#lineGlow)"` : '', dashAttrs].filter(Boolean).join(' ')
  const bgRect = opts.bgColor === 'transparent'
    ? ''
    : `<rect x="0" y="0" width="${width}" height="${height}" rx="${opts.radius}" fill="${opts.bgColor}"/>`

  const totalLabel = opts.showTotal
    ? `<text x="${width - padRight}" y="24" fill="${opts.textColor}" font-size="11" text-anchor="end" font-family="${opts.font}" opacity="0.6">${totalContribs} contributions</text>`
    : ''

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="fadeArea" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${opts.areaColor}" stop-opacity="0.45"/>
<stop offset="100%" stop-color="${opts.areaColor}" stop-opacity="0.02"/>
</linearGradient>
${glowFilter}
</defs>
${bgRect}
${border}
${title}
${yGridLines}
${opts.area ? `<path d="${areaPath}" fill="url(#fadeArea)" stroke="none"/>` : ''}
<path d="${linePath}" fill="none" stroke="${opts.line}" stroke-width="${opts.strokeWidth}" stroke-linecap="round" ${linePathAttrs}>
${drawAnimation}
</path>
${pointDots}
${peakDot}
${yLabels}
${xLabels}
${totalLabel}
</svg>`
}

module.exports = { renderGraph }
