import { js } from '../../utils/shortcuts/core.js';
import { rp as rep } from '../../utils/shortcuts/string.js';
import { isa } from '../../utils/shortcuts/array.js';
import { l } from '../../utils/shortcuts/logging.js';

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
  l('ValidateMessage');
  const a = r.action || r.type;
  if (!a || !ALLOWED.has(a)) {
    l('ValidateMessage:Done');
    return { valid: false, error: 'Invalid action' };
  }
  l('ValidateMessage:Done');
  return { valid: true };
};

export const sanitizeVideoId = id => {
  l('SanitizeVideoId');
  if (!id || typeof id !== 'string') {
    l('SanitizeVideoId:Done');
    return null;
  }
  const c = id.trim().slice(0, 11);
  l('SanitizeVideoId:Done');
  return VID_RX.test(c) ? c : null;
};

export const sanitizeString = (s, max = MAX_SL) => {
  l('SanitizeString');
  if (!s || typeof s !== 'string') {
    l('SanitizeString:Done');
    return '';
  }
  l('SanitizeString:Done');
  return rep(s.slice(0, max), /[<>]/g, '');
};

export const validateTranscript = t => {
  l('ValidateTranscript');
  if (!isa(t)) {
    l('ValidateTranscript:Done');
    return false;
  }
  if (js(t).length > MAX_TS) {
    l('ValidateTranscript:Done');
    return false;
  }
  const result = t.every(
    s => typeof s === 'object' && typeof s.start === 'number' && typeof s.text === 'string'
  );
  l('ValidateTranscript:Done');
  return result;
};

export const sanitizeRequest = r => {
  l('SanitizeRequest');
  const s = { ...r };
  if (r.videoId) s.videoId = sanitizeVideoId(r.videoId);
  if (r.question) s.question = sanitizeString(r.question, 5000);
  if (r.title) s.title = sanitizeString(r.title, 500);
  if (r.summary) s.summary = sanitizeString(r.summary, 50000);
  l('SanitizeRequest:Done');
  return s;
};
