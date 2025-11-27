import { GeminiAPI } from './api.js'

export class StreamingSummaryService {
    constructor(k) { this.api = new GeminiAPI(k) }

    async generateStreamingSummary(t, o = {}, cb) {
        const { model = 'gemini-1.5-flash', language = 'English', length = 'Medium' } = o
        const p = this._createPrompt(t, language, length)
        let full = ''

        await this.api.callStream(p, model, (c, a) => {
            full = a
            if (cb) cb(c, full, this._extractTS(full))
        })

        return { summary: full, timestamps: this._extractTS(full) }
    }

    _createPrompt(t, lang, len) {
        const secs = this._groupSections(t, 120)
        const txt = secs.map(s => `[${this._fmt(s.start)}] ${s.segments.map(x => x.text).join(' ')}`).join('\n\n')
        const guide = { Short: '3-5 key points', Medium: '5-8 main points', Long: '10-15 points' }

        return `Create ${len.toLowerCase()} summary in ${lang}. Start each point with [MM:SS] or [HH:MM:SS] timestamp.

TRANSCRIPT:
${txt}

FORMAT:
## Summary
[00:00] **Topic**: Description...
[02:15] **Next**: Details...

## Key Points
- [00:00] Point 1
- [02:15] Point 2

Include ${guide[len] || guide.Medium}.`
    }

    _groupSections(t, int = 120) {
        const s = []
        let c = { start: 0, end: 0, segments: [] }

        for (const seg of t) {
            if (seg.start - c.start >= int && c.segments.length > 0) {
                s.push(c)
                c = { start: seg.start, end: seg.start + seg.duration, segments: [] }
            }
            c.segments.push(seg)
            c.end = seg.start + seg.duration
        }

        if (c.segments.length > 0) s.push(c)
        return s
    }

    _extractTS(txt) {
        const ts = []
        const re = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g
        let m

        while ((m = re.exec(txt)) !== null) {
            const h = m[3] ? parseInt(m[1]) : 0
            const min = m[3] ? parseInt(m[2]) : parseInt(m[1])
            const sec = m[3] ? parseInt(m[3]) : parseInt(m[2])
            ts.push({ text: m[0], seconds: h * 3600 + min * 60 + sec, position: m.index })
        }

        return ts
    }

    _fmt(s) {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = Math.floor(s % 60)
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`
    }

    convertToHTMLWithClickableTimestamps(md, vid) {
        let h = this._md2html(md)
        h = h.replace(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g, (m, p1, p2, p3) => {
            const hrs = p3 ? parseInt(p1) : 0
            const mins = p3 ? parseInt(p2) : parseInt(p1)
            const secs = p3 ? parseInt(p3) : parseInt(p2)
            const tot = hrs * 3600 + mins * 60 + secs
            return `<a href="#" class="timestamp-link" data-timestamp="${tot}" data-video-id="${vid}">${m}</a>`
        })
        return h
    }

    _md2html(md) {
        let h = md
        h = h.replace(/^### (.*$)/gim, '<h3>$1</h3>')
        h = h.replace(/^## (.*$)/gim, '<h2>$1</h2>')
        h = h.replace(/^# (.*$)/gim, '<h1>$1</h1>')
        h = h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        h = h.replace(/\*(.*?)\*/g, '<em>$1</em>')
        h = h.replace(/^\- (.*$)/gim, '<li>$1</li>')
        h = h.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        h = h.split('\n\n').map(p => !p.startsWith('<') && p.trim() ? `<p>${p}</p>` : p).join('\n')
        return h
    }

    attachTimestampClickHandlers(el) {
        el.querySelectorAll('.timestamp-link').forEach(l => {
            l.addEventListener('click', (e) => {
                e.preventDefault()
                const ts = parseFloat(l.dataset.timestamp)
                const v = document.querySelector('video')
                if (v) { v.currentTime = ts; v.play() }
                chrome.runtime.sendMessage({ action: 'SEEK_TO', timestamp: ts, videoId: l.dataset.videoId })
            })
        })
    }
}
