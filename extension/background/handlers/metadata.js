import { w } from '../../utils/shortcuts/log.js';
export async function handleGetMetadata(req, rsp) {
  const { videoId } = req;
  w('[Background] GET_METADATA called - this should be handled by content script');
  rsp({
    success: true,
    data: { title: 'YouTube Video', author: 'Unknown Channel', viewCount: 'Unknown', videoId },
  });
}
