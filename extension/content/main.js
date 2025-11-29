(async () => {
  if (window.location.hostname !== 'www.youtube.com') return;
  const { l, e, w, url, rt, cr, ap, $, on } = await import(
    chrome.runtime.getURL('utils/shortcuts.js')
  );
  const s = cr('script');
  s.src = url('content/youtube-extractor.js');
  s.onload = function () {
    this.remove();
  };
  ap(document.head || document.documentElement, s);
  l('YAM: Start');

  try {
    const { initializeExtension: ie, waitForPageReady: wp } = await import(
      url('content/core/init.js')
    );
    await wp();
    if (await ie()) l('YAM: Ready');
    else e('YAM: Init fail');
  } catch (x) {
    e('YAM: Fatal', x);
  }
})();

chrome.runtime.onMessage.addListener((req, snd, rsp) => {
  const act = req.action || req.type;
  switch (act) {
    case 'START_ANALYSIS':
      import(chrome.runtime.getURL('content/core/analyzer.js'))
        .then(({ startAnalysis: sa }) => {
          sa();
          rsp({ success: true });
        })
        .catch(x => {
          console.error('Imp fail:', x);
          rsp({ success: false, error: x.message });
        });
      return true;
    case 'GET_METADATA':
      hGM(req, rsp);
      return true;
    case 'GET_TRANSCRIPT':
      hGT(req, rsp);
      return true;
    case 'GET_COMMENTS':
      hGC(req, rsp);
      return true;
    case 'SEEK_TO':
      hST(req, rsp);
      return true;
    case 'SHOW_SEGMENTS':
      hSS(req, rsp);
      return true;
    default:
      return false;
  }
});

async function hGM(req, rsp) {
  try {
    const { MetadataExtractor: ME } = await import(
      chrome.runtime.getURL('content/metadata/extractor.js')
    );
    rsp({ success: true, metadata: await ME.extract(req.videoId) });
  } catch (x) {
    console.error('[Meta] Err:', x);
    rsp({
      success: true,
      metadata: {
        title: document.title.replace(' - YouTube', '') || 'YouTube Video',
        author: 'Unknown',
        viewCount: 'Unknown',
        videoId: req.videoId,
      },
    });
  }
}

async function hGT(req, rsp) {
  try {
    const { videoId: vid } = req;
    const wc = await cTC(vid);
    const { getTranscript: gT } = await import(
      chrome.runtime.getURL('content/transcript/service.js')
    );
    const t = await gT(vid);
    if (!t || !t.length) throw new Error('No caps');
    if (!wc) {
      try {
        const { collapseTranscriptWidget: cTW } = await import(
          chrome.runtime.getURL('content/ui/renderers/transcript.js')
        );
        setTimeout(() => cTW(), 1e3);
        console.log('[Tr] Auto-close');
      } catch (e) { }
    }
    rsp({ success: true, transcript: t });
  } catch (x) {
    console.error('Tr fetch err:', x);
    let m = x.message;
    if (m.includes('Transcript is disabled')) m = 'No caps enabled';
    else if (m.includes('No transcript found')) m = 'No caps avail';
    rsp({ error: m });
  }
}

async function hGC(req, rsp) {
  try {
    const { getComments: gC } = await import(chrome.runtime.getURL('content/handlers/comments.js'));
    rsp({ success: true, comments: await gC() });
  } catch (x) {
    console.error('Comm err:', x);
    rsp({ comments: [] });
  }
}

async function cTC(vid) {
  try {
    const k = `video_${vid}_transcript`;
    const r = await chrome.storage.local.get(k);
    if (r[k]) {
      const c = r[k],
        a = Date.now() - c.timestamp;
      if (a < 864e5 && c.data?.length > 0) {
        console.log(`[Tr] Cache hit`);
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

function hST(req, rsp) {
  try {
    const v = document.querySelector('video');
    if (v) {
      v.currentTime = req.timestamp;
      rsp({ success: true });
    } else throw new Error('No video');
  } catch (x) {
    console.error('Seek err:', x);
    rsp({ success: false, error: x.message });
  }
}

async function hSS(req, rsp) {
  try {
    rsp({ success: true });
  } catch (x) {
    console.error('Seg err:', x);
    rsp({ success: false, error: x.message });
  }
}
