const $ = (id) => document.getElementById(id)
const controls = [
  'username', 'range', 'width', 'line-color', 'area-color', 'point-color',
  'background', 'custom-title', 'hide-title', 'hide-border', 'grid',
  'peak', 'points', 'glow', 'animate', 'area', 'x-axis', 'y-axis',
  'y-ticks', 'height'
]

function getGraphUrl() {
  const params = new URLSearchParams()
  const username = $('username').value.trim()
  params.set('username', username || 'RetrivedMods')
  params.set('range', $('range').value)
  params.set('width', $('width').value || '800')
  params.set('height', $('height').value || '300')
  params.set('line', $('line-color').value.slice(1))
  params.set('area_color', $('area-color').value.slice(1))
  params.set('point', $('point-color').value.slice(1))
  params.set('bg_color', $('background').value)
  params.set('hide_title', String($('hide-title').checked))
  params.set('hide_border', String($('hide-border').checked))
  params.set('grid', String($('grid').checked))
  params.set('peak', String($('peak').checked))
  params.set('points', String($('points').checked))
  params.set('glow', String($('glow').checked))
  params.set('animate', String($('animate').checked))
  params.set('area', String($('area').checked))
  params.set('x_axis', String($('x-axis').checked))
  params.set('y_axis', String($('y-axis').checked))
  params.set('y_ticks', $('y-ticks').value || '5')
  if ($('custom-title').value.trim()) {
    params.set('custom_title', $('custom-title').value.trim())
  }

  const baseUrl = window.location.protocol === 'file:'
    ? 'https://contributiongraph4readme.vercel.app'
    : window.location.href
  const endpoint = new URL('/api/graph', baseUrl)
  endpoint.search = params.toString()
  return endpoint.href
}

function updatePreview() {
  const url = getGraphUrl()
  $('graph-url').value = url
  $('markdown').value = `<img src="${url}" alt="Contribution Graph" />`
  $('preview-image').src = url
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text)
    $('status').textContent = `${label} copied to clipboard.`
  } catch (error) {
    $('status').textContent = `Couldn't copy automatically. Select and copy the ${label.toLowerCase()} above.`
  }
}

controls.forEach((id) => {
  $(id).addEventListener('input', updatePreview)
  $(id).addEventListener('change', updatePreview)
})
$('copy-url').addEventListener('click', () => copyText($('graph-url').value, 'URL'))
$('copy-markdown').addEventListener('click', () => copyText($('markdown').value, 'Markdown'))
$('open-graph').addEventListener('click', () => window.open($('graph-url').value, '_blank', 'noopener'))
updatePreview()
