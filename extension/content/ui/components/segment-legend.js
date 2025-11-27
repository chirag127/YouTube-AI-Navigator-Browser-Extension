const colors = {
    Sponsor: '#ff0',
    'Interaction Reminder': '#0f0',
    'Self Promotion': '#f80',
    'Unpaid Promotion': '#0ff',
    Highlight: '#f0f',
    'Preview/Recap': '#88f',
    'Hook/Greetings': '#aaa',
    'Tangents/Jokes': '#fa0'
}

export const renderLegend = () => {
    const html = Object.entries(colors).map(([label, color]) =>
        `<div class="seg-legend-item"><span class="seg-color" style="background:${color}"></span><span>${label}</span></div>`
    ).join('')

    return `<div class="seg-legend"><div class="seg-legend-title">Segment Types</div>${html}</div>`
}

export const injectLegendStyles = () => {
    if (document.getElementById('yt-ai-legend-styles')) return

    const style = document.createElement('style')
    style.id = 'yt-ai-legend-styles'
    style.textContent = `.seg-legend{margin:10px 0;padding:10px;background:#0f0f0f;border-radius:8px}.seg-legend-title{font-weight:600;margin-bottom:8px;font-size:13px}.seg-legend-item{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:12px}.seg-color{width:16px;height:16px;border-radius:3px;display:inline-block}`
    document.head.appendChild(style)
}
