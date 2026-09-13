# Contribution Graph

```md
https://contribution-graph-lfdx.vercel.app/api/graph?username=RetrivedMods
```

## Deploy

Import the repo on vercel.com

## Query params

| param | default | notes |
|---|---|---|
| `username` |  | required |
| `range` | `month` | `month` = current calendar month, `year` = last 365 days |
| `month` / `year` | current | e.g. `month=6&year=2026` |
| `width` / `height` | `800` / `300` | px |
| `radius` | `6` | card corner radius |
| `bg_color` | `0d1117` | hex or `transparent` |
| `color` | `58a6ff` | fallback for text elements below |
| `title_color` / `border_color` / `grid_color` | inherits `color` | |
| `line` | `58a6ff` | line stroke |
| `point` | `1f6feb` | peak/point marker color |
| `area` | `true` | fill under the line |
| `area_color` | inherits `line` | gradient fill |
| `hide_border` | `false` | |
| `custom_title` | auto | URL-encode spaces |
| `hide_title` | `false` | |
| `title_size` / `title_weight` | `18` / `600` | |
| `title_align` | `center` | `left` / `center` / `right` |
| `total` | `true` | show "N contributions" label |
| `x_axis` / `y_axis` | `true` | |
| `y_ticks` | `4` | |
| `grid` | `true` | |
| `peak` | `true` | pulsing dot on best day |
| `points` | `false` | mark every active day |
| `glow` | `true` | glow on the line |
| `animate` | `false` | a animation between lines |
| `stroke_width` | `2.2` | |
| `font` | `'Segoe UI', Ubuntu, Sans-Serif` | URL of fonts |

```md
https://contribution-graph-lfdx.vercel.app/api/graph?username=RetrivedMods&bg_color=0d1117&line=58a6ff&area_color=a0c4ff&hide_border=true&custom_title=Contribution%20Graph
```
