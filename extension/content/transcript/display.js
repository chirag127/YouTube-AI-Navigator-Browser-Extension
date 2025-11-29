const gu = p => chrome.runtime.getURL(p);

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { el: ce } = await import(gu('utils/shortcuts/dom.js'));
export function createTranscriptDisplay(s) {
  l('createTranscriptDisplay:Start');
  try {
    const c = ce('div', 'ytai-transcript-display');
    for (const seg of s) c.appendChild(createTranscriptLine(seg));
    l('createTranscriptDisplay:End');
    return c;
  } catch (err) {
    e('Err:createTranscriptDisplay', err);
    return ce('div', 'ytai-transcript-display');
  }
}

function createTranscriptLine(s) {
  l('createTranscriptLine:Start');
  try {
    const line = ce('div', 'ytai-transcript-line');
    line.dataset.start = s.start;
    line.dataset.duration = s.duration;
    const ts = ce('span', 'ytai-transcript-timestamp');
    ts.textContent = formatTimestamp(s.start);
    const tx = ce('span', 'ytai-transcript-text');
    tx.textContent = s.text;
    line.appendChild(ts);
    line.appendChild(tx);
    l('createTranscriptLine:End');
    return line;
  } catch (err) {
    e('Err:createTranscriptLine', err);
    return ce('div', 'ytai-transcript-line');
  }
}

function formatTimestamp(s) {
  l('formatTimestamp:Start');
  try {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const result = `${m}:${sec.toString().padStart(2, '0')}`;
    l('formatTimestamp:End');
    return result;
  } catch (err) {
    e('Err:formatTimestamp', err);
    return '0:00';
  }
}
