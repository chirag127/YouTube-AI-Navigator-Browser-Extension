export class ChunkingService {
  constructor() { this.defaultChunkSize = 20000; this.defaultOverlap = 500 }
  chunkText(t, s = this.defaultChunkSize, o = this.defaultOverlap) {
    if (!t) return []
    if (t.length <= s) return [t]
    const c = []; let i = 0
    while (i < t.length) {
      let e = i + s
      if (e < t.length) {
        const sp = t.lastIndexOf(' ', e), p = t.lastIndexOf('.', e)
        if (p > i + s * .5) e = p + 1
        else if (sp > i) e = sp + 1
      }
      const ch = t.substring(i, e).trim()
      if (ch) c.push(ch)
      i = e - o
      if (i >= e) i = e
    }
    return c
  }
  chunkSegments(segs, s = this.defaultChunkSize) {
    if (!segs || !segs.length) return []
    const c = []; let cur = { text: '', start: segs[0].start, end: segs[0].start + segs[0].duration }
    for (const seg of segs) {
      if (cur.text.length + seg.text.length > s && cur.text.length > 0) {
        c.push(cur)
        cur = { text: '', start: seg.start, end: seg.start + seg.duration }
      }
      cur.text += (cur.text ? ' ' : '') + seg.text
      cur.end = seg.start + seg.duration
    }
    if (cur.text.length > 0) c.push(cur)
    return c
  }
}
