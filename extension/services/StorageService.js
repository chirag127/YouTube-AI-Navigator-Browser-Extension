export class StorageService {
  constructor() { this.storage = chrome.storage.local }
  async saveTranscript(v, m, t, s = null) {
    if (!v) throw new Error('Video ID required')
    const d = { videoId: v, metadata: m, transcript: t, summary: s, timestamp: Date.now() }
    await this.storage.set({ [`video_${v}`]: d })
    await this._updateIndex(v, m)
  }
  async getTranscript(v) {
    if (!v) throw new Error('Video ID required')
    const r = await this.storage.get(`video_${v}`)
    return r[`video_${v}`] || null
  }
  async getHistory() {
    const r = await this.storage.get('history_index')
    return r.history_index || []
  }
  async searchHistory(q) {
    if (!q) return this.getHistory()
    const i = await this.getHistory(), l = q.toLowerCase()
    return i.filter(x => x.title.toLowerCase().includes(l) || x.author?.toLowerCase().includes(l))
  }
  async _updateIndex(v, m) {
    const i = await this.getHistory()
    const n = i.filter(x => x.videoId !== v)
    n.unshift({ videoId: v, title: m.title, author: m.author, timestamp: Date.now() })
    await this.storage.set({ history_index: n })
  }
  async deleteVideo(v) {
    if (!v) return
    await this.storage.remove(`video_${v}`)
    const i = await this.getHistory()
    await this.storage.set({ history_index: i.filter(x => x.videoId !== v) })
  }
}
