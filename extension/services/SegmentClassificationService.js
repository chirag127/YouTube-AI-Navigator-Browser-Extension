export class SegmentClassificationService {
  constructor(g, c) { this.geminiService = g; this.chunkingService = c }
  async classifyTranscript(t) {
    if (!t || !t.length) return []
    const f = t.map(s => `[${s.start.toFixed(1)}] ${s.text}`).join('\n')
    try {
      const e = await this.geminiService.extractSegments(f)
      return this._fillContentGaps(e, t)
    } catch (e) { return [] }
  }
  _fillContentGaps(c, o) {
    if (!o.length) return []
    const e = o[o.length - 1].start + o[o.length - 1].duration
    const s = c.sort((a, b) => a.start - b.start)
    const f = []; let t = 0
    for (const seg of s) {
      if (seg.start > t + 1) f.push({ label: 'Content', start: t, end: seg.start, text: 'Main Content' })
      f.push({ ...seg, text: seg.description || seg.label })
      t = Math.max(t, seg.end)
    }
    if (t < e - 1) f.push({ label: 'Content', start: t, end: e, text: 'Main Content' })
    return f
  }
}
