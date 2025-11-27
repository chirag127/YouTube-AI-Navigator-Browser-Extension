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

export const renderTimeline = (segs, dur) => {
    const bar = document.querySelector('.ytp-progress-bar-container')
    if (!bar) return

    const ex = document.getElementById('yt-ai-timeline-markers')
    if (ex) ex.remove()

    const c = document.createElement('div')
    c.id = 'yt-ai-timeline-markers'
    c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:40'

    segs.forEach(s => {
        const m = document.createElement('div')
        const l = (s.start / dur) * 100
        const w = ((s.end - s.start) / dur) * 100
        m.style.cssText = `position:absolute;left:${l}%;width:${w}%;height:100%;background:${colors[s.label] || '#fff'};opacity:0.6;pointer-events:auto;cursor:pointer`
        m.title = `${s.label}: ${s.description}`
        m.onclick = () => {
            const v = document.querySelector('video')
            if (v) v.currentTime = s.start
        }
        c.appendChild(m)
    })

    bar.appendChild(c)
}

export const clearTimeline = () => {
    const ex = document.getElementById('yt-ai-timeline-markers')
    if (ex) ex.remove()
}
