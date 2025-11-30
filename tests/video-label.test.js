import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { injectVideoLabel } from '../extension/content/ui/components/video-label.js';

// Mock DOM
const mockTitle = document.createElement('h1');
mockTitle.className = 'ytd-watch-metadata';
document.body.appendChild(mockTitle);

// Mock shortcuts
vi.mock('../extension/utils/shortcuts/dom.js', () => ({
  qs: sel => document.querySelector(sel),
  ce: tag => document.createElement(tag),
  el: tag => document.createElement(tag),
}));

vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

describe('Video Label Component', () => {
  beforeEach(() => {
    mockTitle.innerHTML = '<span>Original Title</span>';
    const existing = document.getElementById('yt-ai-category-pill-parent');
    if (existing) existing.remove();
  });

  it('should inject sponsor label when sponsor segment exists', () => {
    const segments = [{ category: 'sponsor' }];
    injectVideoLabel(segments);

    const parent = document.getElementById('yt-ai-category-pill-parent');
    expect(parent).toBeTruthy();
    expect(parent.textContent).toContain('Sponsor');

    const pill = parent.querySelector('.yt-ai-category-pill');
    expect(pill.style.backgroundColor).toBe('rgb(0, 212, 0)'); // #00d400
  });

  it('should inject self-promo label when selfpromo segment exists', () => {
    const segments = [{ category: 'selfpromo' }];
    injectVideoLabel(segments);

    const parent = document.getElementById('yt-ai-category-pill-parent');
    expect(parent).toBeTruthy();
    expect(parent.textContent).toContain('Self-promo');
  });

  it('should prioritize sponsor over interaction', () => {
    const segments = [{ category: 'interaction' }, { category: 'sponsor' }];
    injectVideoLabel(segments);

    const parent = document.getElementById('yt-ai-category-pill-parent');
    expect(parent.textContent).toContain('Sponsor');
  });

  it('should do nothing if no relevant segments', () => {
    const segments = [{ category: 'music_off_topic' }]; // Not in our priority list
    injectVideoLabel(segments);

    const parent = document.getElementById('yt-ai-category-pill-parent');
    expect(parent).toBeNull();
  });

  it('should do nothing if title element is missing', () => {
    mockTitle.remove();
    const segments = [{ category: 'sponsor' }];
    injectVideoLabel(segments);
    document.body.appendChild(mockTitle); // Restore for other tests

    const parent = document.getElementById('yt-ai-category-pill-parent');
    expect(parent).toBeNull();
  });
});
