import { initializeServices, getServices } from '../services.js';
import { getApiKey } from '../utils/api-key.js';
import gl from '../../api/genius-lyrics.js';
import sb from '../../api/sponsorblock.js';
import { ContextManager } from '../../services/context-manager.js';
import { l, w, e, si, csi, rt, sg, mfl, pd, js, ks } from '../../utils/shortcuts-sw.js';

let ka = null;
function ska() {
  if (ka) return;
  ka = si(() => rt.getPlatformInfo(() => { }), 2e4);
}
function stka() {
  if (ka) {
    csi(ka);
    ka = null;
  }
}

export async function handleAnalyzeVideo(req, rsp) {
  const {
    transcript: t,
    metadata: m,
    comments: c = [],
    options: o = {},
    useCache: uc = true,
  } = req;
  const vid = m?.videoId;
  ska();
  try {
    const k = await getApiKey();
    if (!k) {
      rsp({ success: false, error: 'API Key not configured' });
      return;
    }
    await initializeServices(k);
    const { gemini: g, segmentClassification: sc, storage: s } = getServices();

    if (uc && vid) {
      const cd = await s.getVideoData(vid);
      if (cd?.summary && cd?.segments && cd.segments.length > 0) {
        l('[AV] Cache hit');
        rsp({
          success: true,
          fromCache: true,
          data: {
            summary: cd.summary,
            faq: cd.faq,
            insights: cd.insights,
            segments: cd.segments,
            timestamps: cd.timestamps,
          },
        });
        return;
      }
    }

    let lyr = null;
    const im =
      m?.category === 'Music' ||
      m?.title?.toLowerCase().includes('official video') ||
      m?.title?.toLowerCase().includes('lyrics');
    if (im || !t?.length) {
      try {
        lyr = await gl.getLyrics(m.title, m.author);
      } catch (e) { }
    }

    let sbs = [];
    if (vid) {
      try {
        sbs = await sb.fetchSegments(vid);
        l(`[AV] SB: ${sbs.length}`);
      } catch (x) {
        w('[AV] SB fail:', x.message);
      }
    }

    let ec = {};
    try {
      l('[AV] Ctx fetch');
      if (!chrome.storage?.sync) throw new Error('Sync NA');
      const st = await sg(null);
      if (!st || !ks(st).length) w('[AV] No settings');
      if (!m) throw new Error('No meta');
      const cm = new ContextManager(st);
      const fp = cm.fetchContext(m);
      const tp = new Promise((_, r) => setTimeout(() => r(new Error('Ctx timeout')), 1e4));
      ec = await Promise.race([fp, tp]);
      l('[AV] Ctx done');
    } catch (x) {
      e('[AV] Ctx err:', x.message);
    }

    if ((!t || !t.length) && !lyr) throw new Error('No content');

    const ac = {
      transcript: t || [],
      lyrics: lyr,
      comments: c || [],
      metadata: m,
      sponsorBlockSegments: sbs,
      externalContext: ec,
    };
    const an = await g.generateComprehensiveAnalysis(ac, {
      model: 'gemini-2.5-flash-lite-preview-09-2025',
      language: o.language || 'English',
      length: o.length || 'Medium',
    });

    let seg = [],
      fvl = null;
    if (o.generateSegments !== false) {
      l('[AV] Gen segs');
      const sr = await sc.classifyTranscript({
        transcript: t || [],
        metadata: m,
        lyrics: lyr,
        comments: c,
      });
      seg = sr.segments;
      fvl = sr.fullVideoLabel;
      l(`[AV] Segs: ${seg.length}`);
    }

    if (vid && s) {
      try {
        await s.saveVideoData(vid, {
          metadata: m,
          transcript: t,
          summary: an.summary,
          faq: an.faq || '',
          insights: an.insights || '',
          segments: seg,
          timestamps: an.timestamps,
        });
      } catch (e) { }
    }

    rsp({
      success: true,
      fromCache: false,
      data: {
        summary: an.summary,
        faq: an.faq,
        insights: an.insights,
        segments: seg,
        fullVideoLabel: fvl,
        timestamps: an.timestamps,
      },
    });
  } catch (x) {
    rsp({ success: false, error: x.message });
  } finally {
    stka();
  }
}
