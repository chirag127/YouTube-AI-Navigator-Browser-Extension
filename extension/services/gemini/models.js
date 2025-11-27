export class ModelManager {
    constructor(k, b) { this.apiKey = k; this.baseUrl = b; this.models = []; this.selected = null }
    async fetch() {
        if (!this.apiKey) throw new Error('API Key required')
        const u = `${this.baseUrl}/models?key=${this.apiKey}&pageSize=100`, r = await fetch(u)
        if (!r.ok) { const t = await r.text(); let e = r.statusText; try { const d = JSON.parse(t); e = d.error?.message || e } catch (x) { } throw new Error(`Gemini API Error: ${e}`) }
        const t = await r.text(); let d; try { d = JSON.parse(t) } catch (e) { throw new Error('Failed to parse models JSON') }
        if (!d.models) throw new Error('No models found')
        const c = d.models.filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        this.models = c.sort((a, b) => { const ia = a.inputTokenLimit || 0, ib = b.inputTokenLimit || 0; if (ib !== ia) return ib - ia; const oa = a.outputTokenLimit || 0, ob = b.outputTokenLimit || 0; if (ob !== oa) return ob - oa; return a.name.localeCompare(b.name) })
        if (this.models.length > 0) this.selected = this.models[0].name.replace('models/', '')
        return this.models
    }
    getList() {
        const p = ['gemini-2.5-flash-lite-preview-09-2025', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash']
        if (!this.models.length) return p
        const a = this.models.map(m => m.name.replace('models/', ''))
        const o = p.filter(m => a.includes(m))
        const r = a.filter(m => !p.includes(m))
        return [...o, ...r]
    }
}
