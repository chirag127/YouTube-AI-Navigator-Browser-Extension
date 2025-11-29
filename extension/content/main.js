(async () => {
  if (window.location.hostname !== 'www.youtube.com') return;
  const { r, ru: gu } = await import(chrome.runtime.getURL('utils/shortcuts/runtime.js'));
  const { ce: el, qs } = await import(gu('utils/shortcuts/dom.js'));
  const { l, e, st: to } = await import(gu('utils/shortcuts/global.js'));
  const { sl } = await import(gu('utils/shortcuts/storage.js'));
  const s = el('script');
  s.type = 'module';
  s.src = gu('content/youtube-extractor.js');
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
  l('YAM: Start');
  try {
    const { initializeExtension: ie, waitForPageReady: wp } = await import(
      gu('content/core/init.js')
    );
    await wp();
    if (await ie()) l('YAM: Ready');
    else e('YAM: Init fail');
  } catch (x) {
    e('YAM: Fatal', x);
  }
  r.onMessage.addListener((m, _, p) => {
    const a = m.action || m.type;
    switch (a) {
      case 'START_ANALYSIS':
        import(gu('content/core/analyzer.js'))
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
        hGM(m, p);
        return true;
      case 'GET_TRANSCRIPT':
        hGT(m, p);
        return true;
      case 'GET_COMMENTS':
        hGC(m, p);
        return true;
      case 'SEEK_TO':
        hST(m, p);
        return true;
      case 'SHOW_SEGMENTS':
        hSS(m, p);
        return true;
      case 'GET_VIDEO_DATA':
        hGVD(m, p);
        return true;
      default:
        return false;
    }
  });
  const hGM = async (m, p) => {
    try {
      const { MetadataExtractor: ME } = await import(gu('content/metadata/extractor.js'));
      p({ success: true, metadata: await ME.extract(m.videoId) });
    } catch (x) {
      e('[Meta] Err:', x);
      p({
        success: true,
        metadata: {
          title: document.title.replace(' - YouTube', '') || 'YouTube Video',
          author: 'Unknown',
          viewCount: 'Unknown',
          videoId: m.videoId,
        },
      });
    }
  };
  const hGT = async (m, p) => {
    try {
      const { videoId: v } = m;
      const wc = await cTC(v);
      const { extractTranscript: gT } = await import(gu('content/transcript/strategy-manager.js'));
      const r2 = await gT(v);
      if (!r2.success || !r2.data || !r2.data.length) throw new Error(r2.error || 'No caps');
      const t = r2.data;
      if (!wc) {
        try {
          const { collapseTranscriptWidget: cTW } = await import(
            gu('content/ui/renderers/transcript.js')
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
      let msg = x.message;
      if (msg.includes('Transcript is disabled')) msg = 'No caps enabled';
      else if (msg.includes('No transcript found')) msg = 'No caps avail';
      p({ error: msg });
    }
  };
  const hGC = async (_, p) => {
    try {
      const { getComments: gC } = await import(gu('content/handlers/comments.js'));
      p({ success: true, comments: await gC() });
    } catch (x) {
      e('Comm err:', x);
      p({ comments: [] });
    }
  };
  const cTC = async v => {
    try {
      const k = `v_${v}_t`;
      const r = await sl.get(k);
      if (r[k]) {
        const c = r[k],
          a = Date.now() - c.timestamp;
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
  const hST = (m, p) => {
    try {
      const v = qs('video');
      if (v) {
        v.currentTime = m.timestamp;
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
  const hGVD = async (m, p) => {
    try {
      const { VideoDataExtractor: VDE } = await import(gu('content/metadata/video-data.js'));
      p({ success: true, data: await VDE.extract(m.videoId) });
    } catch (x) {
      e('GVD err:', x);
      p({ success: false, error: x.message });
    }
  };
})();
