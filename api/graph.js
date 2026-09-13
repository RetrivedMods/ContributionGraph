const { grabContributions } = require('../lib/contributions')
const { renderGraph } = require('../lib/svg')

const cache = new Map()
const CACHE_TIME = 30 * 60 * 1000

function toBool(v, fallback) {
  if (v === undefined) return fallback
  return v === 'true' || v === '1'
}

function resolveColor(v, fallback) {
  if (!v) return fallback
  if (v.toLowerCase() === 'transparent' || v.toLowerCase() === 'none') return 'transparent'
  const clean = v.replace('#', '')
  return /^[0-9a-fA-F]{3,8}$/.test(clean) ? `#${clean}` : fallback
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function buildMonthSeries(data, year, month) {
  const total = daysInMonth(year, month)
  const map = new Map(data.map(d => [d.date, d.count]))
  const series = []
  for (let day = 1; day <= total; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    series.push({ date, count: map.get(date) || 0 })
  }
  return series
}

module.exports = async (req, res) => {
  const q = req.query
  const username = q.username

  if (!username) {
    res.status(400).send('missing username, try ?username=yourhandle')
    return
  }

  const now = new Date()
  const range = q.range === 'year' ? 'year' : 'month'
  const targetYear = q.year ? parseInt(q.year, 10) : now.getUTCFullYear()
  const targetMonth = q.month ? parseInt(q.month, 10) : now.getUTCMonth() + 1

  const defaultTitle = range === 'year'
    ? `${username}'s contribution graph`
    : `${username}'s activity in ${MONTH_NAMES[targetMonth - 1]} ${targetYear}`

  const lineColor = resolveColor(q.line, '#58a6ff')
  const textColor = resolveColor(q.color, '#58a6ff')
  const opts = {
    width: q.width ? parseInt(q.width, 10) : 800,
    height: q.height ? parseInt(q.height, 10) : 300,
    radius: q.radius ? parseInt(q.radius, 10) : 6,
    bgColor: resolveColor(q.bg_color, '#0d1117'),
    textColor,
    titleColor: resolveColor(q.title_color, textColor),
    borderColor: resolveColor(q.border_color, textColor),
    gridColor: resolveColor(q.grid_color, textColor),
    line: lineColor,
    point: resolveColor(q.point, '#1f6feb'),
    area: toBool(q.area, true),
    areaColor: resolveColor(q.area_color, lineColor),
    hideBorder: toBool(q.hide_border, false),
    title: q.hide_title === 'true' ? null : (q.custom_title ? decodeURIComponent(q.custom_title) : defaultTitle),
    titleSize: q.title_size ? parseInt(q.title_size, 10) : 18,
    titleWeight: q.title_weight ? q.title_weight : '600',
    titleAlign: ['left', 'center', 'right'].includes(q.title_align) ? q.title_align : 'center',
    showTotal: toBool(q.total, true),
    showXAxis: toBool(q.x_axis, true),
    showYAxis: toBool(q.y_axis, true),
    showGrid: toBool(q.grid, true),
    showPeak: toBool(q.peak, true),
    showPoints: toBool(q.points, false),
    glow: toBool(q.glow, true),
    animate: toBool(q.animate, false),
    strokeWidth: q.stroke_width ? parseFloat(q.stroke_width) : 2.2,
    yTicks: q.y_ticks ? parseInt(q.y_ticks, 10) : 4,
    font: q.font ? decodeURIComponent(q.font) : "'Segoe UI', Ubuntu, Sans-Serif"
  }

  const cacheKey = req.url
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.time < CACHE_TIME) {
    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800')
    res.status(200).send(hit.svg)
    return
  }

  try {
    const isCurrentMonth = targetYear === now.getUTCFullYear() && targetMonth === now.getUTCMonth() + 1
    const fetchTo = range === 'month' && !isCurrentMonth
      ? new Date(Date.UTC(targetYear, targetMonth, 0)).toISOString().slice(0, 10)
      : undefined

    const raw = await grabContributions(username, fetchTo)
    if (!raw.length) throw new Error('no contribution data found, private profile or bad username?')

    const data = range === 'year' ? raw : buildMonthSeries(raw, targetYear, targetMonth)

    const svg = renderGraph(data, opts)
    cache.set(cacheKey, { svg, time: Date.now() })

    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800')
    res.status(200).send(svg)
  } catch (err) {
    res.setHeader('Content-Type', 'image/svg+xml')
    res.status(500).send(errorSvg(err.message))
  }
}

function errorSvg(msg) {
  return `<svg width="600" height="120" xmlns="http://www.w3.org/2000/svg">
<rect width="600" height="120" fill="#0d1117"/>
<text x="20" y="55" fill="#f85149" font-family="Segoe UI, sans-serif" font-size="14">couldn't build the graph</text>
<text x="20" y="80" fill="#8b949e" font-family="Segoe UI, sans-serif" font-size="12">${msg}</text>
</svg>`
}
