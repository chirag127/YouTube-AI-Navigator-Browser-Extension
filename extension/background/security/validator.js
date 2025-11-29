import { js } from '../../utils/shortcuts/core.js';
import { rp as rep } from '../../utils/shortcuts/string.js';
import { isa } from '../../utils/shortcuts/array.js';

const ALLOWED = new Set([
  'TEST',
  'GET_SETTINGS',
  'FETCH_TRANSCRIPT',
  'ANALYZE_VIDEO',
  'ANALYZE_COMMENTS',
  'GENERATE_SUMMARY',
  'CLASSIFY_SEGMENTS',
  'CHAT_WITH_VIDEO',
  'SAVE_TO_HISTORY',
  'GET_METADATA',
  'GET_CACHED_DATA',
  'SAVE_CHAT_MESSAGE',
  'SAVE_COMMENTS',
  'GET_VIDEO_DATA',
  'TRANSCRIBE_AUDIO',
  'GET_LYRICS',
  'OPEN_OPTIONS',
]);

const MAX_TS = 5 * 1024 * 1024;
const MAX_SL = 10000;
const VID_RX = /^[a-zA-Z0-9_-]{11}$/;

export const validateMessage = r => {
  const a = r.action || r.type;
  if (!a || !ALLOWED.has(a)) return { valid: false, error: 'Invalid action' };
  return { valid: true };
};

export const sanitizeVideoId = id => {
  if (!id || typeof id !== 'string') return null;
  const c = id.trim().slice(0, 11);
  return VID_RX.test(c) ? c : null;
};

export const sanitizeString = (s, max = MAX_SL) => {
  if (!s || typeof s !== 'string') return '';
  return rep(s.slice(0, max), /[<>]/g, '');
};

export const validateTranscript = t => {
  if (!isa(t)) return false;
  if (js(t).length > MAX_TS) return false;
  return t.every(
    s => typeof s === 'object' && typeof s.start === 'number' && typeof s.text === 'string'
  );
};

export const sanitizeRequest = r => {
  const s = { ...r };
  if (r.videoId) s.videoId = sanitizeVideoId(r.videoId);
  if (r.question) s.question = sanitizeString(r.question, 5000);
  if (r.title) s.title = sanitizeString(r.title, 500);
  if (r.summary) s.summary = sanitizeString(r.summary, 50000);
  return s;
};
