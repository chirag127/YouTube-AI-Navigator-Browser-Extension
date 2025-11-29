import { StorageService } from '../services/storage/index.js';
import { parseMarkdown } from '../lib/marked-loader.js';
import { ge, on, ce, $$, tab, js, jp, mfl, pI, pd, lc, inc, fl } from '../utils/shortcuts.js';

const s = new StorageService(),
  vl = ge('video-list'),
  si = ge('search-input'),
  nr = ge('no-results'),
  vc = ge('video-count'),
  dp = ge('detail-placeholder'),
  dc = ge('detail-content'),
  da = ge('detail-actions'),
  ov = ge('open-video-btn'),
  eb = ge('export-btn'),
  ib = ge('import-btn'),
  ifile = ge('import-file');
let cid = null,
  hd = [];

on(document, 'DOMContentLoaded', init);
async function init() {
  await loadHistory();
  setupEvents();
}
function setupEvents() {
  on(si, 'input', handleSearch);
  on(eb, 'click', handleExport);
  on(ib, 'click', () => ifile.click());
  on(ifile, 'change', handleImport);
  on(ov, 'click', openVideo);
}
async function loadHistory() {
  hd = await s.getHistory();
  renderList(hd);
}
async function handleSearch(e) {
  const q = lc(e.target.value);
  if (!q) {
    renderList(hd);
    return;
  }
  const f = fl(hd, x => inc(lc(x.title || ''), q) || inc(lc(x.author || ''), q));
  renderList(f);
}
function renderList(items) {
  vl.innerHTML = '';
  vc.textContent = `${items.length} video${items.length !== 1 ? 's' : ''}`;
  if (items.length === 0) {
    nr.style.display = 'block';
    return;
  }
  nr.style.display = 'none';
  for (const i of items) {
    const li = ce('li');
    li.className = 'video-item';
    if (i.videoId === cid) li.classList.add('active');
    const d = new Date(i.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    li.innerHTML = `<div class="video-title">${esc(i.title || 'Untitled Video')}</div><div class="video-meta"><span>👤 ${esc(i.author || 'Unknown')}</span><span>📅 ${d}</span></div><div class="video-actions"><button class="btn btn-secondary view-btn" data-id="${i.videoId}">View</button><button class="btn btn-danger delete-btn" data-id="${i.videoId}">Delete</button></div>`;
    on(li.querySelector('.view-btn'), 'click', e => {
      e.stopPropagation();
      viewVideo(i.videoId);
    });
    on(li.querySelector('.delete-btn'), 'click', e => {
      e.stopPropagation();
      deleteVideo(i.videoId);
    });
    on(li, 'click', () => viewVideo(i.videoId));
    vl.appendChild(li);
  }
}
async function viewVideo(v) {
  cid = v;
  $$('.video-item').forEach(x => {
    x.classList.remove('active');
    if (x.querySelector(`[data-id="${v}"]`)) x.classList.add('active');
  });
  const d = await s.getTranscript(v);
  if (!d) {
    dc.innerHTML = '<p>Failed to load video data.</p>';
    dc.style.display = 'block';
    dp.style.display = 'none';
    return;
  }
  dp.style.display = 'none';
  dc.style.display = 'block';
  da.style.display = 'block';
  let h = '';
  if (d.metadata)
    h += `<div class="stats"><div class="stat"><div class="stat-value">${fmtDur(d.metadata.duration)}</div><div class="stat-label">Duration</div></div><div class="stat"><div class="stat-value">${fmtViews(d.metadata.viewCount)}</div><div class="stat-label">Views</div></div><div class="stat"><div class="stat-value">${d.transcript?.length || 0}</div><div class="stat-label">Segments</div></div></div>`;
  if (d.summary) {
    h += '<h2>Summary</h2>';
    h += await parseMarkdown(d.summary);
  } else h += '<p>No summary available for this video.</p>';
  dc.innerHTML = h;
}
async function deleteVideo(v) {
  if (!confirm('Are you sure you want to delete this video from history?')) return;
  await s.deleteVideo(v);
  if (cid === v) {
    cid = null;
    dp.style.display = 'flex';
    dc.style.display = 'none';
    da.style.display = 'none';
  }
  await loadHistory();
  if (si.value) handleSearch({ target: si });
}
function openVideo() {
  if (cid) tab({ url: `https://www.youtube.com/watch?v=${cid}` });
}
async function handleExport() {
  try {
    const all = [];
    for (const i of hd) {
      const f = await s.getTranscript(i.videoId);
      if (f) all.push(f);
    }
    const b = new Blob([js(all, null, 2)], { type: 'application/json' }),
      u = URL.createObjectURL(b),
      a = ce('a');
    a.href = u;
    a.download = `youtube-ai-master-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(u);
    alert(`Exported ${all.length} videos successfully!`);
  } catch (e) {
    alert(`Failed to export data: ${e.message}`);
  }
}
async function handleImport(e) {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const t = await f.text(),
      d = jp(t);
    if (!Array.isArray(d)) throw new Error('Invalid format: expected an array');
    let c = 0;
    for (const i of d) {
      if (i.videoId && i.metadata) {
        await s.saveTranscript(i.videoId, i.metadata, i.transcript || [], i.summary);
        c++;
      }
    }
    await loadHistory();
    alert(`Imported ${c} videos successfully!`);
  } catch (err) {
    alert(`Failed to import data: ${err.message}`);
  }
  ifile.value = '';
}
function esc(t) {
  const d = ce('div');
  d.textContent = t;
  return d.innerHTML;
}
function fmtDur(sec) {
  if (!sec) return '0:00';
  const h = mfl(sec / 3600),
    m = mfl((sec % 3600) / 60),
    s = sec % 60;
  return h > 0
    ? `${h}:${pd(m.toString(), 2, '0')}:${pd(s.toString(), 2, '0')}`
    : `${m}:${pd(s.toString(), 2, '0')}`;
}
function fmtViews(v) {
  if (!v) return '0';
  const n = pI(v, 10);
  return n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}K`
      : n.toString();
}
