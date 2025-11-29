import { initializeServices as is, getServices as gs } from '../services.js';
import { getApiKey as gk } from '../utils/api-key.js';
import { geniusLyricsAPI as gl } from '../../api/genius-lyrics.js';
import { sponsorBlockAPI as sb } from '../../api/sponsorblock.js';
import { ContextManager as CM } from '../../services/context-manager.js';
import { l, w, e } from '../../utils/shortcuts/log.js';
import { si, ci, to as to } from '../../utils/shortcuts/global.js';
import { r as cr } from '../../utils/shortcuts/runtime.js';
import { sg, ss } from '../../utils/shortcuts/storage.js';
import { ok } from '../../utils/shortcuts/core.js';
import { inc as ic, lwc } from '../../utils/shortcuts/string.js';
import { np, pc } from '../../utils/shortcuts/async.js';
let ka = null;
const ska = () => {
  if (!ka) ka = si(() => cr.getPlatformInfo(() => { }), 2e4);
};
const stka = () => {
  if (ka) {
    ci(ka);
    ka = null;
  }
};
export async function handleAnalyzeVideo(q, r) {
  const { transcript: t, metadata: m, comments: c = [], options: o = {}, useCache: uc = true } = q;
  const v = m?.videoId;
  ska();
  try {
    const k = await gk();
    if (!k) {
      r({ success: false, error: 'API Key NA' });
      return;
    }
    await is(k);
    const { gemini: g, segmentClassification: sc, storage: s } = gs();
    if (uc && v) {
      const d = await s.getVideoData(v);
      if (d?.summary && d?.segments && d.segments.length > 0) {
        l('[AV]Cache');
        r({
          success: true,
          fromCache: true,
          data: {
            summary: d.summary,
            faq: d.faq,
            insights: d.insights,
            segments: d.segments,
            timestamps: d.timestamps,
          },
        });
        return;
      }
    }
    let ly = null;
    const im =
      m?.category === 'Music' ||
      ic(lwc(m?.title || ''), 'official video') ||
      ic(lwc(m?.title || ''), 'lyrics');
    if (im || !t?.length) {
      try {
        ly = await gl.getLyrics(m.title, m.author);
      } catch (x) {
        w('[AV]Lyrics:', x.message);
      }
    }
    let sb2 = [];
    if (v) {
      try {
        sb2 = await sb.fetchSegments(v);
        l(`[AV]SB:${sb2.length}`);
      } catch (x) {
        w('[AV]SB:', x.message);
      }
    }
    let ec = {};
    try {
      l('[AV]Ctx');
      if (!ss) throw new Error('Sync NA');
      const st = await sg(null);
      if (!st || !ok(st).length) w('[AV]No set');
      if (!m) throw new Error('No meta');
      const cm = new CM(st);
      const fp = cm.fetchContext(m);
      const tp = np((_, j) => to(() => j(new Error('TO')), 1e4));
      ec = await pc([fp, tp]);
      l('[AV]Ctx ok');
    } catch (x) {
      e('[AV]Ctx:', x.message);
    }
    if ((!t || !t.length) && !ly && (!c || !c.length)) throw new Error('No content');
    const ac = {
      transcript: t || [],
      lyrics: ly,
      comments: c || [],
      metadata: m,
      sponsorBlockSegments: sb2,
      externalContext: ec,
    };
    const an = await g.generateComprehensiveAnalysis(ac, {
      model: 'gemini-2.5-flash-lite-preview-09-2025',
      language: o.language || 'English',
      length: o.length || 'Medium',
    });
    let sg2 = [],
      fv = null;
    if (o.generateSegments !== false) {
      l('[AV]Seg');
      const sr = await sc.classifyTranscript({
        transcript: t || [],
        metadata: m,
        lyrics: ly,
        comments: c,
      });
      sg2 = sr.segments;
      fv = sr.fullVideoLabel;
      l(`[AV]Seg:${sg2.length}`);
    }
    if (v && s) {
      try {
        await s.saveVideoData(v, {
          metadata: m,
          transcript: t,
          summary: an.summary,
          faq: an.faq || '',
          insights: an.insights || '',
          segments: sg2,
          timestamps: an.timestamps,
        });
      } catch (x) {
        w('[AV]Save:', x.message);
      }
    }
    r({
      success: true,
      fromCache: false,
      data: {
        summary: an.summary,
        faq: an.faq,
        insights: an.insights,
        segments: sg2,
        fullVideoLabel: fv,
        timestamps: an.timestamps,
      },
    });
  } catch (x) {
    r({ success: false, error: x.message });
  } finally {
    stka();
  }
}
