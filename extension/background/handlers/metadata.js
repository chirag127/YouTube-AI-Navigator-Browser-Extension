import { l, e, w } from '../../utils/shortcuts/logging.js';
export async function handleGetMetadata(req, rsp) {
  l('GetMetadata');
  try {
    const { videoId } = req;
    w('[Background] GET_METADATA called - this should be handled by content script');
    l('GetMetadata:OK');
    rsp({
      success: true,
      data: { title: 'YouTube Video', author: 'Unknown Channel', viewCount: 'Unknown', videoId },
    });
    l('GetMetadata:Done');
  } catch (x) {
    e('GetMetadata:', x);
    rsp({ success: false, error: x.message });
    l('GetMetadata:Done');
  }
}
