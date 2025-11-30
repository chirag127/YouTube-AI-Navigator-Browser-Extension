import { e } from '../../utils/shortcuts/log.js';

export const comments = commentList => {
  try {
    if (!commentList || !commentList.length) return '';

    const text = commentList
      .slice(0, 50)
      .map(c => {
        const author = c.authorText || 'Unknown';
        const content = c.textDisplay || '';
        return `- ${author}: ${content}`;
      })
      .join('\n');

    const result = `
    Task: Analyze the sentiment and key themes of these YouTube comments.

    Comments:
    ${text}

    Output Format (Markdown):
    ### Sentiment Overview
    (Positive/Negative/Neutral mix)

    ### Key Themes
    - Theme 1
    - Theme 2

    ### Controversial Topics (if any)
    `;

    return result;
  } catch (err) {
    e('Err:Comments', err);
    return '';
  }
};
