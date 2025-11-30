import { qs, ce } from '../../../utils/shortcuts/dom.js';
import { e } from '../../../utils/shortcuts/log.js';

const CATEGORY_COLORS = {
  sponsor: { bg: '#00d400', text: '#000000', label: 'Sponsor' },
  selfpromo: { bg: '#ffff00', text: '#000000', label: 'Self-promo' },
  interaction: { bg: '#cc00ff', text: '#ffffff', label: 'Interaction' },
  intro: { bg: '#00ffff', text: '#000000', label: 'Intro' },
  outro: { bg: '#00ffff', text: '#000000', label: 'Outro' },
  preview: { bg: '#0080ff', text: '#ffffff', label: 'Preview' },
  filler: { bg: '#7300ff', text: '#ffffff', label: 'Filler' },
  highlight: { bg: '#ff0000', text: '#ffffff', label: 'Highlight' },
  exclusive: { bg: '#008000', text: '#ffffff', label: 'Exclusive' },
};

export function injectVideoLabel(segments) {
  try {
    // Find the title element
    const titleElem = qs('h1.ytd-watch-metadata');
    if (!titleElem) return;

    // Check if we already injected
    let parent = qs('#yt-ai-category-pill-parent');
    if (parent) parent.remove(); // Re-inject to update

    if (!segments || !segments.length) return;

    // Determine the dominant category or just show the first relevant one
    // For now, let's just pick the first non-content segment that appears early?
    // Or maybe the user wants to know if the video *contains* these things.
    // SponsorBlock usually shows segments on the timeline.
    // The "Category Pill" in the title usually indicates the *current* segment or the *main* category of the video if it's tagged entirely.
    // The user's request says: "This entire video is labeled as this category..." in the aria-label.
    // This implies this UI element is for when the *whole* video is a sponsor/ad.
    // However, the user might want this to appear when the *current time* is a sponsor.
    // BUT, the user said "Inject the full video labels... just like the sponsor block browser extension".
    // SponsorBlock puts a pill in the title if the *entire video* is submitted as a specific category.
    // Since we are dealing with segments, maybe we should check if there is a segment that covers most of the video?
    // OR, maybe the user just wants to see *what* is in the video.

    // Let's assume for now we want to show a label if the video contains a Sponsor segment,
    // OR if we are currently IN a segment (that requires time updates, which is more complex).

    // Re-reading the prompt: "Inject the full video labels... just like the sponsor block browser extension is doing in this code example."
    // The code example shows "Sponsor".
    // If I look at how SponsorBlock works, it adds these pills next to the title.

    // Let's iterate through segments and find high-priority ones to label.
    // Priority: Sponsor > Self-promo > Exclusive > etc.

    const priority = ['sponsor', 'selfpromo', 'exclusive', 'interaction'];
    let targetCategory = null;

    for (const p of priority) {
      if (segments.some(s => s.category === p)) {
        targetCategory = p;
        break;
      }
    }

    if (!targetCategory) return; // Nothing interesting to label

    const config = CATEGORY_COLORS[targetCategory];
    if (!config) return;

    // Create structure
    // <span id="yt-ai-category-pill-parent">...</span>

    parent = ce('span');
    parent.id = 'yt-ai-category-pill-parent';
    parent.style.display = 'flex';
    parent.style.marginRight = '8px';
    parent.style.alignItems = 'center';

    const pill = ce('span');
    pill.className = 'yt-ai-category-pill';
    pill.style.backgroundColor = config.bg;
    pill.style.color = config.text;
    pill.style.display = 'flex';
    pill.style.alignItems = 'center';
    pill.style.padding = '0 8px';
    pill.style.borderRadius = '2px';
    pill.style.fontSize = '1.2rem';
    pill.style.fontWeight = '500';
    pill.style.height = '20px';
    pill.style.lineHeight = '20px';
    pill.style.textTransform = 'uppercase';
    pill.style.fontFamily = 'Roboto, Arial, sans-serif';
    pill.style.cursor = 'default';

    // Icon (optional, maybe just text for now as we don't have the assets)
    // User example had an img. I'll skip the img for now to avoid broken images,
    // or use a generic SVG if needed. Text is safer.

    const text = ce('span');
    text.textContent = config.label;

    pill.appendChild(text);
    parent.appendChild(pill);

    // Insert at the beginning of the title
    titleElem.insertBefore(parent, titleElem.firstChild);
  } catch (err) {
    e('Err:injectVideoLabel', err);
  }
}
