const cheerio = require('cheerio')

async function grabContributions(username, to) {
  const url = to
    ? `https://github.com/users/${encodeURIComponent(username)}/contributions?to=${to}`
    : `https://github.com/users/${encodeURIComponent(username)}/contributions`
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; contrib-graph-bot)' }
  })

  if (!res.ok) throw new Error(`github responded with ${res.status}, double check the username`)

  const html = await res.text()
  const $ = cheerio.load(html)

  const cells = $('td.ContributionCalendar-day, rect.ContributionCalendar-day')
  const data = []

  cells.each((_, el) => {
    const node = $(el)
    const date = node.attr('data-date')
    if (!date) return

    let count = 0
    const id = node.attr('id')
    if (id) {
      const tooltip = $(`tool-tip[for="${id}"]`).text().trim()
      const match = tooltip.match(/^(\d+)/)
      if (match) count = parseInt(match[1], 10)
    }

    data.push({ date, count })
  })

  data.sort((a, b) => (a.date < b.date ? -1 : 1))
  return data
}

module.exports = { grabContributions }
