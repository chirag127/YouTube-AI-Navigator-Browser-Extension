(async () => {
  if (window.location.hostname !== 'www.youtube.com') return;
  const { l, e, st: to } = await import(chrome.runtime.getURL('utils/shortcuts/global.js'));
  const { ru, r: cr } = await import(chrome.runtime.getURL('utils/shortcuts/runtime.js'));
  const { ce, ap, qs } = await import(chrome.runtime.getURL('utils/shortcuts/dom.js'));
  const { sg: cl } = await import(chrome.runtime.getURL('utils/shortcuts/storage.js'));
  const { nw } = await import(chrome.runtime.getURL('utils/shortcuts/core.js'));
  const doc = document;

  const s = ce('script');
  s.type = 'module';
  s.src = ru('content/youtube-extractor.js');
  s.onload = () => s.remove();
  ap(doc.head || doc.documentElement, s);
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
  cr.onMessage.addListener((r, _, p) => {
    const a = r.action || r.type;
    switch (a) {
      case 'START_ANALYSIS':
        import(ru('content/core/analyzer.js'))
          .then(({ startAnalysis: sa }) => {
            sa();
            p({ success: true });
          })
          .catch(x => {
            e('Imp fail:', x);
            p({ success: false, error: x.message });
          });
        return true;
      case 'GET_METADATA':
        hGM(r, p);
        return true;
      case 'GET_TRANSCRIPT':
        hGT(r, p);
        return true;
      case 'GET_COMMENTS':
        hGC(r, p);
        return true;
      case 'SEEK_TO':
        hST(r, p);
        return true;
      case 'SHOW_SEGMENTS':
        hSS(r, p);
        return true;
      case 'GET_VIDEO_DATA':
        hGVD(r, p);
        return true;
      default:
        return false;
    }
  });
  const hGM = async (r, p) => {
    try {
      const { MetadataExtractor: ME } = await import(ru('content/metadata/extractor.js'));
      p({ success: true, metadata: await ME.extract(r.videoId) });
    } catch (x) {
      e('[Meta] Err:', x);
      p({
        success: true,
        metadata: {
          title: doc.title.replace(' - YouTube', '') || 'YouTube Video',
          author: 'Unknown',
          viewCount: 'Unknown',
          videoId: r.videoId,
        },
      });
    }
  };
  const hGT = async (r, p) => {
    try {
      const { videoId: v } = r;
      const wc = await cTC(v);
      const { extractTranscript: gT } = await import(ru('content/transcript/strategy-manager.js'));
      const r2 = await gT(v);
      if (!r2.success || !r2.data || !r2.data.length) throw new Error(r2.error || 'No caps');
      const t = r2.data;
      if (!wc) {
        try {
          const { collapseTranscriptWidget: cTW } = await import(
            ru('content/ui/renderers/transcript.js')
          );
          to(() => cTW(), 1e3);
          l('[Tr] Auto-close');
        } catch (x) {
          e('[Tr] Auto-close err:', x);
        }
      }
      p({ success: true, transcript: t });
    } catch (x) {
      e('Tr fetch err:', x);
      let m = x.message;
      if (m.includes('Transcript is disabled')) m = 'No caps enabled';
      else if (m.includes('No transcript found')) m = 'No caps avail';
      p({ error: m });
    }
  };
  const hGC = async (_, p) => {
    try {
      const { getComments: gC } = await import(ru('content/handlers/comments.js'));
      p({ success: true, comments: await gC() });
    } catch (x) {
      e('Comm err:', x);
      p({ comments: [] });
    }
  };
  const cTC = async v => {
    try {
      const k = `v_${v}_t`;
      const r = await cl(k);
      if (r[k]) {
        const c = r[k],
          a = nw() - c.timestamp;
        if (a < 864e5 && c.data?.length > 0) {
          l(`[Tr] Cache hit`);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };
  const hST = (r, p) => {
    try {
      const v = qs('video');
      if (v) {
        v.currentTime = r.timestamp;
        p({ success: true });
      } else throw new Error('No video');
    } catch (x) {
      e('Seek err:', x);
      p({ success: false, error: x.message });
    }
  };
  const hSS = async (_, p) => {
    try {
      p({ success: true });
    } catch (x) {
      e('Seg err:', x);
      p({ success: false, error: x.message });
    }
  };
  const hGVD = async (r, p) => {
    try {
      const { VideoDataExtractor: VDE } = await import(ru('content/metadata/video-data.js'));
      p({ success: true, data: await VDE.extract(r.videoId) });
    } catch (x) {
      e('GVD err:', x);
      p({ success: false, error: x.message });
    }
  };
})();
