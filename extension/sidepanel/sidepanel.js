import { ChunkingService } from '../services/chunking/index.js';
import { GeminiService } from '../api/gemini.js';
import { SegmentClassificationService } from '../services/segments/index.js';
import { StorageService } from '../services/storage/index.js';
import { parseMarkdown } from '../lib/marked-loader.js';
import { id, $$, on, ce } from '../utils/shortcuts/dom.js';
import { sl } from '../utils/shortcuts/storage.js';
import { e, w } from '../utils/shortcuts/log.js';
import { tbc as ct } from '../utils/shortcuts/tabs.js';
import { to as st } from '../utils/shortcuts/global.js';
import { mf } from '../utils/shortcuts/math.js';
import { pd } from '../utils/shortcuts/string.js';

const ss = new StorageService(),
  cs = new ChunkingService();
let gs = null,
  scs = null,
  ctx = '';
const ab = id('analyze-btn'),
  stEl = id('status'),
  aw = id('auth-warning'),
  tbs = $$('.tab-btn'),
  tcs = $$('.tab-content'),
  sc = id('summary-content'),
  ic = id('insights-content'),
  tc = id('transcript-container'),
  ci = id('chat-input'),
  csb = id('chat-send-btn'),
  ch = id('chat-history');

on(document, 'DOMContentLoaded', async () => {
  const { GAK } = await sl.get('GAK');
  if (!GAK) {
    aw.style.display = 'block';
    ab.disabled = true;
    return;
  }
  gs = new GeminiService(GAK);
  scs = new SegmentClassificationService(gs, cs);
  try {
    await gs.fetchAvailableModels();
  } catch (x) {
    void x;
  }
  for (const b of tbs) {
    on(b, 'click', () => {
      for (const x of tbs) x.classList.remove('active');
      for (const x of tcs) x.classList.remove('active');
      b.classList.add('active');
      id(`${b.getAttribute('data-tab')}-tab`).classList.add('active');
    });
  }
  on(csb, 'click', handleChat);
  on(ci, 'keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  });
  on(document, 'click', e => {
    if (e.target.classList.contains('timestamp-btn')) {
      const t = e.target.getAttribute('data-time');
      if (t) {
        const p = t.split(':').map(Number);
        let s = 0;
        if (p.length === 3) s = p[0] * 3600 + p[1] * 60 + p[2];
        else if (p.length === 2) s = p[0] * 60 + p[1];
        seekVideo(s);
      }
    }
  });
});

async function handleChat() {
  const q = ci.value.trim();
  if (!q) return;
  if (!ctx) {
    appendMsg('ai', 'Please analyze a video first so I have context to answer your question.');
    return;
  }
  appendMsg('user', q);
  ci.value = '';
  const lid = appendMsg('ai', 'Thinking...');
  try {
    const a = await gs.chatWithVideo(q, ctx);
    await updateMsg(lid, a);
  } catch (x) {
    await updateMsg(lid, `Error: ${x.message}`);
  }
}

function appendMsg(r, t) {
  const d = ce('div');
  d.className = `chat-message ${r}`;
  d.id = `msg-${Date.now()}`;
  d.textContent = t;
  ch.appendChild(d);
  ch.scrollTop = ch.scrollHeight;
  return d.id;
}

async function updateMsg(id, t) {
  const d = document.getElementById(id);
  if (d) {
    d.innerHTML = await parseMarkdown(t);
    ch.scrollTop = ch.scrollHeight;
  }
}

on(ab, 'click', () => analyzeVideo());

async function analyzeVideo(rc = 0) {
  const mr = 2;
  try {
    setStatus('loading', 'Fetching video info...');
    ab.disabled = true;
    showLoadingState();
    const [tab] = await ct.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.includes('youtube.com/watch'))
      throw new Error('Please open a YouTube video page.');
    const u = new URLSearchParams(new URL(tab.url).search),
      v = u.get('v');
    if (!v) throw new Error('Could not find Video ID.');
    setStatus('loading', 'Fetching video metadata...');
    let md;
    try {
      const r = await smr(tab.id, { action: 'GET_METADATA', videoId: v }, 3);
      if (r.error) throw new Error(r.error);
      md = r.metadata;
    } catch (x) {
      w('Metadata fetch failed, using fallback:', x);
      md = { title: 'Unknown Title', author: 'Unknown Channel', videoId: v };
    }
    setStatus('loading', 'Fetching transcript...');
    const tr = await smr(tab.id, { action: 'GET_TRANSCRIPT', videoId: v }, 2);
    if (tr.error) {
      if (tr.error.includes('does not have captions'))
        showError(
          'No Captions Available',
          'This video does not have captions/subtitles. Please try a different video that has closed captions enabled.'
        );
      else showError('Transcript Error', tr.error);
      return;
    }
    const ts = tr.transcript;
    if (!ts || ts.length === 0)
      throw new Error('Transcript is empty. Please try a different video.');
    ctx = ts.map(s => s.text).join(' ');
    if (!ctx.trim())
      throw new Error('Transcript text is empty. Please try a different video or language.');
    setStatus('loading', 'Classifying segments...');
    try {
      const cls = await scs.classifyTranscript(ts);
      renderTranscript(cls);
      ct.sendMessage(tab.id, { action: 'SHOW_SEGMENTS', segments: cls }).catch(x =>
        w('Failed to send segments:', x)
      );
    } catch (x) {
      w('Segment classification failed:', x);
      renderTranscript(ts.map(t => ({ ...t, label: null })));
    }
    const cfg = await sl.get(['summaryLength', 'targetLanguage', 'maxInsights', 'maxFAQ', 'includeTimestamps']);
    const so = {
      summaryLength: cfg.summaryLength || 'medium',
      language: cfg.targetLanguage || 'en',
      maxInsights: cfg.maxInsights || 8,
      maxFAQ: cfg.maxFAQ || 5,
      includeTimestamps: cfg.includeTimestamps !== false,
    };
    setStatus('loading', 'Generating summary...');
    const an = await gs.generateComprehensiveAnalysis({ transcript: ctx, metadata: md, comments: [], lyrics: null, sponsorBlockSegments: [] }, so);
    await renderMd(an.summary, sc);
    setStatus('loading', 'Analyzing comments...');
    const cr = await ct.sendMessage(tab.id, { action: 'GET_COMMENTS' }).catch(x => {
      e('Failed to get comments:', x);
      return { comments: [] };
    });
    const cms = cr?.comments || [];
    let ca = 'No comments available to analyze.';
    if (cms.length > 0) {
      try {
        ca = await gs.analyzeCommentSentiment(cms);
      } catch (x) {
        e('Comment analysis failed:', x);
        ca = `Failed to analyze comments: ${x.message}`;
      }
    } else w('[Sidepanel] No comments found to analyze');
    const ih = await parseMarkdown(an.insights),
      ch = await parseMarkdown(ca),
      fh = await parseMarkdown(an.faq);
    ic.innerHTML = `<h3>Key Insights</h3>${ih}<hr style="border:0;border-top:1px solid var(--border-color);margin:20px 0;"><h3>Comments Analysis</h3>${ch}<hr style="border:0;border-top:1px solid var(--border-color);margin:20px 0;"><h3>Frequently Asked Questions</h3>${fh}`;
    setStatus('success', '✓ Analysis complete!');
    try {
      await ss.saveTranscript(v, md, ts, an.summary);
    } catch (x) {
      w('Failed to save to history:', x);
    }
  } catch (x) {
    e('Analysis error:', x);
    if (rc < mr && (x.message.includes('fetch') || x.message.includes('network'))) {
      await new Promise(r => st(r, 1000 * (rc + 1)));
      return analyzeVideo(rc + 1);
    }
    showError('Analysis Failed', x.message);
  } finally {
    ab.disabled = false;
  }
}

async function smr(tid, m, mr = 3) {
  for (let i = 0; i < mr; i++) {
    try {
      return await ct.sendMessage(tid, m);
    } catch (x) {
      if (i === mr - 1) throw x;
      await new Promise(r => st(r, 500 * (i + 1)));
    }
  }
}

function setStatus(t, x) {
  stEl.className = t;
  if (t === 'loading') stEl.innerHTML = `<span class="spinner"></span>${x}`;
  else stEl.textContent = x;
}

function showLoadingState() {
  sc.innerHTML =
    '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg><p class="empty-state-title">Generating summary...</p></div>';
  ic.innerHTML =
    '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg><p class="empty-state-title">Generating insights...</p></div>';
  tc.innerHTML =
    '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg><p class="empty-state-title">Loading transcript...</p></div>';
}

function showError(t, m) {
  sc.innerHTML = `<div class="error-container"><svg class="error-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><h3 class="error-title">${t}</h3><p class="error-message">${m}</p><button class="retry-btn" onclick="document.getElementById('analyze-btn').click()">Try Again</button></div>`;
  setStatus('error', `Error: ${t}`);
}

async function renderMd(t, el) {
  el.innerHTML = await parseMarkdown(t);
}

function renderTranscript(sg) {
  tc.innerHTML = '';
  for (const s of sg) {
    const d = ce('div');
    d.className = `transcript-segment ${getSgClass(s.label)}`;
    const tm = ce('span');
    tm.className = 'timestamp';
    tm.textContent = fmtTime(s.start);
    const tx = ce('span');
    tx.className = 'text';
    tx.textContent = s.text;
    if (s.label) {
      const lb = ce('span');
      lb.className = 'segment-label';
      lb.textContent = s.label;
      lb.title = getSgDesc(s.label);
      d.appendChild(lb);
    }
    d.appendChild(tm);
    d.appendChild(tx);
    on(d, 'click', () => seekVideo(s.start));
    tc.appendChild(d);
  }
}

function getSgClass(l) {
  const m = {
    Sponsor: 'segment-sponsor',
    'Interaction Reminder': 'segment-interaction',
    'Self Promotion': 'segment-self-promo',
    'Unpaid Promotion': 'segment-unpaid-promo',
    Highlight: 'segment-highlight',
    'Preview/Recap': 'segment-preview',
    'Hook/Greetings': 'segment-hook',
    'Tangents/Jokes': 'segment-tangent',
    Content: 'segment-content',
  };
  return m[l] || 'segment-unknown';
}

function getSgDesc(l) {
  const d = {
    Sponsor: 'Paid advertisement or sponsorship',
    'Interaction Reminder': 'Asking viewers to like/subscribe/share',
    'Self Promotion': "Promoting creator's own products/services",
    'Unpaid Promotion': 'Shout-outs to other creators/channels',
    Highlight: 'Most important or interesting part',
    'Preview/Recap': 'Coming up next or previously on',
    'Hook/Greetings': 'Video introduction or greeting',
    'Tangents/Jokes': 'Off-topic content or humor',
    Content: 'Main video content',
  };
  return d[l] || 'Unknown segment type';
}

async function seekVideo(s) {
  try {
    const [t] = await ct.query({ active: true, currentWindow: true });
    if (t?.id) await ct.sendMessage(t.id, { action: 'SEEK_TO', timestamp: s });
  } catch (x) {
    void x;
  }
}

function fmtTime(s) {
  const m = mf(s / 60),
    sc = mf(s % 60);
  return `${m}:${pd(sc.toString(), 2, '0')}`;
}
