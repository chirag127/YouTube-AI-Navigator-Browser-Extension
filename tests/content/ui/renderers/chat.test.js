import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock runtime first to control gu output
vi.mock('../../../../extension/utils/shortcuts/runtime.js', () => ({
  gu: path => {
    const mapping = {
      'utils/shortcuts/log.js': '../../../utils/shortcuts/log.js',
      'lib/marked-loader.js': '../../../lib/marked-loader.js',
      'utils/shortcuts/dom.js': '../../../utils/shortcuts/dom.js',
    };
    return mapping[path] || path;
  },
}));

// Mock dependencies using relative paths (as gu returns them)
vi.mock('../../../../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

vi.mock('../../../../extension/lib/marked-loader.js', () => ({
  parseMarkdown: (text) => Promise.resolve(`<p>${text}</p>`),
}));

vi.mock('../../../../extension/utils/shortcuts/dom.js', () => ({
  ce: tag => document.createElement(tag),
  qs: (sel, ctx) => (ctx || document).querySelector(sel),
}));

// Import module under test
import { renderChat, addChatMessage } from '../../../../extension/content/ui/renderers/chat.js';

describe('Chat Renderer', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.innerHTML = '<video></video>'; // Mock video element
    vi.clearAllMocks();
  });

  it('should render chat container if not present', () => {
    renderChat(container);
    expect(container.querySelector('.yt-ai-chat-messages')).toBeTruthy();
    expect(container.innerHTML).toContain('Hi! Ask me anything');
  });

  it('should not re-render if already present', () => {
    container.innerHTML = '<div class="yt-ai-chat-messages">Existing</div>';
    renderChat(container);
    expect(container.innerHTML).toBe('<div class="yt-ai-chat-messages">Existing</div>');
  });

  it('should add user message correctly', async () => {
    renderChat(container);
    document.body.appendChild(container); // Append to body so qs finds #yt-ai-chat-messages

    const msg = await addChatMessage('user', 'Hello');

    expect(msg).toBeTruthy();
    expect(msg.className).toContain('yt-ai-chat-msg user');
    expect(msg.innerHTML).toContain('Hello');
  });

  it('should add AI message correctly with markdown', async () => {
    renderChat(container);
    document.body.appendChild(container);

    const msg = await addChatMessage('ai', '**Bold**');

    expect(msg).toBeTruthy();
    expect(msg.className).toContain('yt-ai-chat-msg ai');
    expect(msg.innerHTML).toContain('<p>**Bold**</p>'); // Mocked markdown parser returns wrapped in p
  });

  it('should handle timestamp clicks', () => {
    renderChat(container);
    const chatContainer = container.querySelector('.yt-ai-chat-messages');

    // Simulate a message with a timestamp button
    const btn = document.createElement('button');
    btn.className = 'timestamp-btn';
    btn.dataset.time = '1:30'; // 90 seconds
    chatContainer.appendChild(btn);

    const video = document.querySelector('video');
    video.play = vi.fn();

    btn.click();

    expect(video.currentTime).toBe(90);
    expect(video.play).toHaveBeenCalled();
  });
});
