const gu = p => chrome.runtime.getURL(p);

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { showPlaceholder } = await import(gu('content/ui/components/loading.js'));
const { makeTimestampsClickable } = await import(gu('content/utils/timestamps.js'));
const { parseMarkdown } = await import(gu('lib/marked-loader.js'));
function processHighlights(html) {
  l('processHighlights:Start');
  try {
    const result = html.replace(/==(.*?)==/g, '<mark class="yt-ai-highlight">$1</mark>');
    l('processHighlights:End');
    return result;
  } catch (err) {
    e('Err:processHighlights', err);
    return html;
  }
}

export async function renderSummary(c, d) {
  l('renderSummary:Start');
  try {
    if (!d) {
      showPlaceholder(c, 'Analysis not started yet.');
      l('renderSummary:End');
      return;
    }

    let summaryHtml = await parseMarkdown(d.summary || 'No summary available.');
    let insightsHtml = await parseMarkdown(d.insights || 'No insights available.');
    let faqHtml = await parseMarkdown(d.faq || 'No FAQ available.');

    summaryHtml = processHighlights(summaryHtml);
    insightsHtml = processHighlights(insightsHtml);
    faqHtml = processHighlights(faqHtml);

    c.innerHTML = `<div class="yt-ai-markdown">
        <h3>📝 Summary</h3>
        ${summaryHtml}
        <hr>
        <h3>💡 Key Insights</h3>
        ${insightsHtml}
        <hr>
        <h3>❓ FAQ</h3>
        ${faqHtml}
    </div>`;

    makeTimestampsClickable(c);
    l('renderSummary:End');
  } catch (err) {
    e('Err:renderSummary', err);
  }
}
