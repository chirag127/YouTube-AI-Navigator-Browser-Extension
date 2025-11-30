(async () => {
  if (window.top !== window) return;
  if (window.location.hostname !== 'www.youtube.com') return;
  const { r, ru: gu } = await import(chrome.runtime.getURL('utils/shortcuts/runtime.js'));
  const { ce: el, qs } = await import(gu('utils/shortcuts/dom.js'));
  const { e } = await import(gu('utils/shortcuts/log.js'));
  const { to } = await import(gu('utils/shortcuts/global.js'));
  const { sl } = await import(gu('utils/shortcuts/storage.js'));
  const s = el('script');
  s.type = 'module';
  s.src = gu('content/youtube-extractor.js');
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
  try {
    const { initializeExtension: ie, waitForPageReady: wp } = await import(
      gu('content/core/init.js')
    );
    await wp();
    if (!(await ie())) e('YAM: Init fail');

    const v = new URLSearchParams(window.location.search).get('v');
    if (v) {
      const { sg } = await import(gu('utils/shortcuts/storage.js'));
      const st = await sg('config');
      const cfg = st.config || {};
      if (cfg.segments?.enabled) {
        const { StorageService } = await import(gu('services/storage/index.js'));
        const ss = new StorageService();
        const vd = await ss.getVideoData(v);
        if (vd?.segments?.length) {
          const { setupAutoSkip } = await import(gu('content/segments/autoskip.js'));
          const { injectSegmentMarkers } = await import(gu('content/segments/markers.js'));
          await setupAutoSkip(vd.segments);
          injectSegmentMarkers(vd.segments);
          e(`[Init] Loaded ${vd.segments.length} cached segments`);
        }
      }
    }
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
            e('Err:START_ANALYSIS', x);
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
      e('Err:hGM', x);
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
        } catch (x) {
          e('[Tr] Auto-close err:', x);
        }
      }
      to(() => {
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (x) {
          e('[Tr] Scroll err:', x);
        }
      }, 1500);
      p({ success: true, transcript: t });
    } catch (x) {
      e('Err:hGT', x);
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
      e('Err:hGC', x);
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
          return true;
        }
      }
      return false;
    } catch (err) {
      e('Err:cTC', err);
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
      e('Err:hST', x);
      p({ success: false, error: x.message });
    }
  };
  const hSS = async (m, p) => {
    try {
      const { setupAutoSkip } = await import(gu('content/segments/autoskip.js'));
      const { injectSegmentMarkers } = await import(gu('content/segments/markers.js'));
      if (m.segments?.length) {
        await setupAutoSkip(m.segments);
        injectSegmentMarkers(m.segments);
        e(`[SHOW_SEGMENTS] Applied ${m.segments.length} segments`);
      }
      p({ success: true });
    } catch (x) {
      e('Err:hSS', x);
      p({ success: false, error: x.message });
    }
  };
  const hGVD = async (m, p) => {
    try {
      const { VideoDataExtractor: VDE } = await import(gu('content/metadata/video-data.js'));
      p({ success: true, data: await VDE.extract(m.videoId) });
    } catch (x) {
      e('Err:hGVD', x);
      p({ success: false, error: x.message });
    }
  };
})();
