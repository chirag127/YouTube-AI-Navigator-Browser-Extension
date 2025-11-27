import { seekVideo } from './dom.js'
export function makeTimestampsClickable(c) {
    const p = /(\[|\()?(\d{1,2}):(\d{2})(\]|\))?/g, w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT), n = []
    let node
    while ((node = w.nextNode())) if (p.test(node.textContent)) n.push(node)
    n.forEach(t => {
        const txt = t.textContent, f = document.createDocumentFragment(); let l = 0
        txt.replace(p, (m, p1, mins, secs, p4, o) => {
            if (o > l) f.appendChild(document.createTextNode(txt.substring(l, o)))
            const s = parseInt(mins) * 60 + parseInt(secs), lnk = document.createElement('span')
            lnk.textContent = m
            lnk.className = 'yt-ai-clickable-timestamp'
            lnk.style.cssText = 'color:var(--yt-ai-accent);cursor:pointer;font-weight:600;text-decoration:underline;'
            lnk.addEventListener('click', () => seekVideo(s))
            f.appendChild(lnk)
            l = o + m.length
        })
        if (l < txt.length) f.appendChild(document.createTextNode(txt.substring(l)))
        t.parentNode.replaceChild(f, t)
    })
}
