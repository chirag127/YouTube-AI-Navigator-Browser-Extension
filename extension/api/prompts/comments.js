import { l } from '../../utils/shortcuts/log.js';

export const comments = comments => {
  if (!comments || comments.length === 0) {
    return `No comments available to analyze.`;
  }

  const text = comments
    .map(c => {
      const author = c.author || c.authorText?.simpleText || 'Unknown';
      const content = c.text || c.contentText || 'No text';
      return `- ${author}: ${content}`;
    })
    .join('\n');

  l('[Comments Prompt] Formatted text:', text);

  return `
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
};
