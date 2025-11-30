import { id as i } from '../../utils/shortcuts/dom.js';
export class PromptsSettings {
  constructor(sm, as) {
    this.sm = sm;
    this.as = as;
  }
  async init() {
    const cfg = this.sm.get('prompts') || {};
    const el = id => i(id);
    if (el('prompts-segments-role'))
      el('prompts-segments-role').value = cfg.segments?.roleDescription || '';
    if (el('prompts-segments-timing'))
      el('prompts-segments-timing').value = cfg.segments?.timingAccuracyTarget || 2;
    if (el('prompts-segments-hints'))
      el('prompts-segments-hints').checked = cfg.segments?.enablePatternHints !== false;
    if (el('prompts-segments-sponsor-range'))
      el('prompts-segments-sponsor-range').value =
        cfg.segments?.sponsorDurationRange?.join(',') || '30,90';
    if (el('prompts-segments-intro-range'))
      el('prompts-segments-intro-range').value =
        cfg.segments?.introDurationRange?.join(',') || '5,15';
    if (el('prompts-segments-outro-range'))
      el('prompts-segments-outro-range').value =
        cfg.segments?.outroDurationRange?.join(',') || '10,30';
    if (el('prompts-segments-min-short'))
      el('prompts-segments-min-short').value = cfg.segments?.minSegmentsShort || 3;
    if (el('prompts-segments-min-long'))
      el('prompts-segments-min-long').value = cfg.segments?.minSegmentsLong || 8;
    if (el('prompts-segments-threshold'))
      el('prompts-segments-threshold').value = cfg.segments?.videoLengthThreshold || 600;
    if (el('prompts-comprehensive-role'))
      el('prompts-comprehensive-role').value = cfg.comprehensive?.roleDescription || '';
    if (el('prompts-comprehensive-bold'))
      el('prompts-comprehensive-bold').checked = cfg.comprehensive?.keywordBoldingEnabled !== false;
    if (el('prompts-comprehensive-resources'))
      el('prompts-comprehensive-resources').checked =
        cfg.comprehensive?.includeResourcesSection !== false;
    if (el('prompts-comprehensive-takeaways'))
      el('prompts-comprehensive-takeaways').checked =
        cfg.comprehensive?.includeActionableTakeaways !== false;
    if (el('prompts-comprehensive-max-resources'))
      el('prompts-comprehensive-max-resources').value =
        cfg.comprehensive?.maxResourcesMentioned || 10;
    if (el('prompts-comprehensive-max-takeaways'))
      el('prompts-comprehensive-max-takeaways').value = cfg.comprehensive?.maxTakeaways || 5;
    if (el('prompts-comments-role'))
      el('prompts-comments-role').value = cfg.comments?.roleDescription || '';
    if (el('prompts-comments-spam'))
      el('prompts-comments-spam').checked = cfg.comments?.enableSpamFiltering !== false;
    if (el('prompts-comments-sentiment'))
      el('prompts-comments-sentiment').checked = cfg.comments?.enableSentimentLabeling !== false;
    if (el('prompts-comments-likes'))
      el('prompts-comments-likes').value = cfg.comments?.minLikesForHighEngagement || 10;
    if (el('prompts-comments-themes'))
      el('prompts-comments-themes').value = cfg.comments?.maxThemes || 7;
    if (el('prompts-comments-questions'))
      el('prompts-comments-questions').value = cfg.comments?.maxQuestions || 5;
    if (el('prompts-comments-opportunities'))
      el('prompts-comments-opportunities').checked =
        cfg.comments?.includeCreatorOpportunities !== false;
    [
      'prompts-segments-role',
      'prompts-segments-timing',
      'prompts-segments-hints',
      'prompts-segments-sponsor-range',
      'prompts-segments-intro-range',
      'prompts-segments-outro-range',
      'prompts-segments-min-short',
      'prompts-segments-min-long',
      'prompts-segments-threshold',
      'prompts-comprehensive-role',
      'prompts-comprehensive-bold',
      'prompts-comprehensive-resources',
      'prompts-comprehensive-takeaways',
      'prompts-comprehensive-max-resources',
      'prompts-comprehensive-max-takeaways',
      'prompts-comments-role',
      'prompts-comments-spam',
      'prompts-comments-sentiment',
      'prompts-comments-likes',
      'prompts-comments-themes',
      'prompts-comments-questions',
      'prompts-comments-opportunities',
    ].forEach(id => i(id)?.addEventListener('change', () => this.as.trigger(() => this.save())));

    const saveBtn = i('save-prompts');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await this.save();
        if (this.as.n) this.as.n.success('Settings saved');
      });
    }
  }
  async save() {
    const el = id => i(id);
    const sponsorRange = el('prompts-segments-sponsor-range')?.value.split(',').map(Number) || [
      30, 90,
    ];
    const introRange = el('prompts-segments-intro-range')?.value.split(',').map(Number) || [5, 15];
    const outroRange = el('prompts-segments-outro-range')?.value.split(',').map(Number) || [10, 30];
    if (el('prompts-segments-role'))
      this.sm.set('prompts.segments.roleDescription', el('prompts-segments-role').value);
    if (el('prompts-segments-timing'))
      this.sm.set(
        'prompts.segments.timingAccuracyTarget',
        Number(el('prompts-segments-timing').value)
      );
    if (el('prompts-segments-hints'))
      this.sm.set('prompts.segments.enablePatternHints', el('prompts-segments-hints').checked);
    this.sm.set('prompts.segments.sponsorDurationRange', sponsorRange);
    this.sm.set('prompts.segments.introDurationRange', introRange);
    this.sm.set('prompts.segments.outroDurationRange', outroRange);
    if (el('prompts-segments-min-short'))
      this.sm.set(
        'prompts.segments.minSegmentsShort',
        Number(el('prompts-segments-min-short').value)
      );
    if (el('prompts-segments-min-long'))
      this.sm.set(
        'prompts.segments.minSegmentsLong',
        Number(el('prompts-segments-min-long').value)
      );
    if (el('prompts-segments-threshold'))
      this.sm.set(
        'prompts.segments.videoLengthThreshold',
        Number(el('prompts-segments-threshold').value)
      );
    if (el('prompts-comprehensive-role'))
      this.sm.set('prompts.comprehensive.roleDescription', el('prompts-comprehensive-role').value);
    if (el('prompts-comprehensive-bold'))
      this.sm.set(
        'prompts.comprehensive.keywordBoldingEnabled',
        el('prompts-comprehensive-bold').checked
      );
    if (el('prompts-comprehensive-resources'))
      this.sm.set(
        'prompts.comprehensive.includeResourcesSection',
        el('prompts-comprehensive-resources').checked
      );
    if (el('prompts-comprehensive-takeaways'))
      this.sm.set(
        'prompts.comprehensive.includeActionableTakeaways',
        el('prompts-comprehensive-takeaways').checked
      );
    if (el('prompts-comprehensive-max-resources'))
      this.sm.set(
        'prompts.comprehensive.maxResourcesMentioned',
        Number(el('prompts-comprehensive-max-resources').value)
      );
    if (el('prompts-comprehensive-max-takeaways'))
      this.sm.set(
        'prompts.comprehensive.maxTakeaways',
        Number(el('prompts-comprehensive-max-takeaways').value)
      );
    if (el('prompts-comments-role'))
      this.sm.set('prompts.comments.roleDescription', el('prompts-comments-role').value);
    if (el('prompts-comments-spam'))
      this.sm.set('prompts.comments.enableSpamFiltering', el('prompts-comments-spam').checked);
    if (el('prompts-comments-sentiment'))
      this.sm.set(
        'prompts.comments.enableSentimentLabeling',
        el('prompts-comments-sentiment').checked
      );
    if (el('prompts-comments-likes'))
      this.sm.set(
        'prompts.comments.minLikesForHighEngagement',
        Number(el('prompts-comments-likes').value)
      );
    if (el('prompts-comments-themes'))
      this.sm.set('prompts.comments.maxThemes', Number(el('prompts-comments-themes').value));
    if (el('prompts-comments-questions'))
      this.sm.set('prompts.comments.maxQuestions', Number(el('prompts-comments-questions').value));
    if (el('prompts-comments-opportunities'))
      this.sm.set(
        'prompts.comments.includeCreatorOpportunities',
        el('prompts-comments-opportunities').checked
      );
    await this.sm.save();
  }
}
