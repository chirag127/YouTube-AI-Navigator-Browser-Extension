import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');

describe('Chat Handler', () => {
  let sendChatMessage;
  let originalChrome;

  beforeEach(async () => {
    vi.clearAllMocks();
    document.body.innerHTML = '';

    // Setup global chrome mock BEFORE importing chat.js
    originalChrome = global.chrome;

    global.chrome = {
      runtime: {
        getURL: (p) => {
          const absPath = path.join(projectRoot, 'extension', p);
          return `file://${absPath.replace(/\\/g, '/')}`;
        },
        sendMessage: vi.fn().mockResolvedValue({ success: true, answer: 'Test answer' }),
      },
      storage: {
        local: { get: vi.fn().mockResolvedValue({}) },
        sync: { get: vi.fn().mockResolvedValue({}) },
      }
    };

    // Setup DOM for chat
    const input = document.createElement('input');
    input.id = 'yt-ai-chat-input';
    input.value = 'Hello';
    document.body.appendChild(input);

    const chatContainer = document.createElement('div');
    chatContainer.id = 'yt-ai-chat-messages';
    chatContainer.className = 'yt-ai-chat-messages';
    document.body.appendChild(chatContainer);

    // Dynamically import the module under test
    vi.resetModules();
    const module = await import('../../../extension/content/handlers/chat.js');
    sendChatMessage = module.sendChatMessage;
  });

  afterEach(() => {
    global.chrome = originalChrome;
  });

  it('should send chat message successfully using real dependencies', async () => {
    const statePath = path.join(projectRoot, 'extension/content/core/state.js');
    const stateUrl = `file://${statePath.replace(/\\/g, '/')}`;
    const { state } = await import(stateUrl);

    state.currentTranscript = [{ text: 'line 1' }, { text: 'line 2' }];

    await sendChatMessage();

    const messages = document.querySelectorAll('.yt-ai-chat-msg');
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[messages.length - 1].innerHTML).toContain('Test answer');
  });

  it('should seek video when timestamp is clicked', async () => {
    // Setup video element
    const video = document.createElement('video');
    document.body.appendChild(video);

    // Setup chat container
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Import renderChat
    const { renderChat } = await import('../../../extension/content/ui/renderers/chat.js');
    renderChat(container);

    // Simulate adding a message with timestamp
    // renderChat creates .yt-ai-chat-messages inside container if not present
    // But in our beforeEach we already added #yt-ai-chat-messages to body?
    // Wait, renderChat takes a container `c` and looks for `.yt-ai-chat-messages` inside it.
    // In the test, we passed a new div `container`.
    // So it should create `.yt-ai-chat-messages` inside `container`.

    const messagesContainer = container.querySelector('.yt-ai-chat-messages');
    expect(messagesContainer).not.toBeNull();

    const msg = document.createElement('div');
    msg.innerHTML = '<button class="timestamp-btn" data-time="1:30">1:30</button>';
    messagesContainer.appendChild(msg);

    // Click the timestamp
    const btn = msg.querySelector('.timestamp-btn');
    btn.click();

    // Verify video time
    // 1:30 = 90 seconds
    expect(video.currentTime).toBe(90);
  });
});
