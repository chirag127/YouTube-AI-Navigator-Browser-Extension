import { id, on } from '../../utils/shortcuts/dom.js';
import { e } from '../../utils/shortcuts/log.js';

export class UIAppearance {
  constructor(sm, as) {
    this.sm = sm;
    this.as = as;
  }

  init() {
    try {
      this.loadSettings();
      this.attachListeners();
      this.applyStyles();
    } catch (err) {
      e('[UIAppearance] Init error:', err);
    }
  }

  loadSettings() {
    try {
      const c = this.sm.get('ui') || {};
      const ff = id('uiFontFamily');
      const is = id('uiIconStyle');
      const wm = id('uiWallpaperMode');
      const cm = id('uiCompactMode');
      const pc = id('uiPrimaryColor');
      const ac = id('uiAccentColor');
      const bc = id('uiBackgroundColor');
      const tc = id('uiTextColor');
      const boc = id('uiBorderColor');
      const gb = id('uiGlassBlur');
      const co = id('uiCardOpacity');
      const as = id('uiAnimationSpeed');
      const ec = id('uiEasingCurve');
      const mi = id('uiMicroInteractions');
      const bw = id('uiBorderWidth');
      const rs = id('uiRadiusScale');
      const ss = id('uiSpacingScale');
      const si = id('uiShadowIntensity');
      const gi = id('uiGlowIntensity');
      const ga = id('uiGradientAccents');

      if (ff) ff.value = c.fontFamily || 'Inter';
      if (is) is.value = c.iconStyle || 'default';
      if (wm) wm.checked = c.wallpaperMode ?? false;
      if (cm) cm.checked = c.compactMode ?? false;
      if (pc) pc.value = c.primaryColor || '#00f3ff';
      if (ac) ac.value = c.accentColor || '#bc13fe';
      if (bc) bc.value = c.backgroundColor || '#000000';
      if (tc) tc.value = c.textColor || '#ffffff';
      if (boc) boc.value = c.borderColor || '#ffffff';
      if (gb) {
        gb.value = c.glassBlur ?? 32;
        const v = id('uiGlassBlurValue');
        if (v) v.textContent = `${gb.value}px`;
      }
      if (co) {
        co.value = c.cardOpacity ?? 60;
        const v = id('uiCardOpacityValue');
        if (v) v.textContent = `${co.value}%`;
      }
      if (as) {
        as.value = c.animationSpeed ?? 0.2;
        const v = id('uiAnimationSpeedValue');
        if (v) v.textContent = `${as.value}s`;
      }
      if (ec) ec.value = c.easingCurve || 'cubic-bezier(0.4, 0, 0.2, 1)';
      if (mi) mi.checked = c.microInteractions ?? true;
      if (bw) {
        bw.value = c.borderWidth ?? 2;
        const v = id('uiBorderWidthValue');
        if (v) v.textContent = `${bw.value}px`;
      }
      if (rs) {
        rs.value = c.radiusScale ?? 1;
        const v = id('uiRadiusScaleValue');
        if (v) v.textContent = `${rs.value}x`;
      }
      if (ss) {
        ss.value = c.spacingScale ?? 1;
        const v = id('uiSpacingScaleValue');
        if (v) v.textContent = `${ss.value}x`;
      }
      if (si) {
        si.value = c.shadowIntensity ?? 60;
        const v = id('uiShadowIntensityValue');
        if (v) v.textContent = `${si.value}%`;
      }
      if (gi) {
        gi.value = c.glowIntensity ?? 40;
        const v = id('uiGlowIntensityValue');
        if (v) v.textContent = `${gi.value}%`;
      }
      if (ga) ga.checked = c.gradientAccents ?? true;
    } catch (err) {
      e('[UIAppearance] Load error:', err);
    }
  }

  attachListeners() {
    try {
      const ff = id('uiFontFamily');
      const is = id('uiIconStyle');
      const wm = id('uiWallpaperMode');
      const cm = id('uiCompactMode');
      const pc = id('uiPrimaryColor');
      const ac = id('uiAccentColor');
      const bc = id('uiBackgroundColor');
      const tc = id('uiTextColor');
      const boc = id('uiBorderColor');
      const gb = id('uiGlassBlur');
      const co = id('uiCardOpacity');
      const as = id('uiAnimationSpeed');
      const ec = id('uiEasingCurve');
      const mi = id('uiMicroInteractions');
      const bw = id('uiBorderWidth');
      const rs = id('uiRadiusScale');
      const ss = id('uiSpacingScale');
      const si = id('uiShadowIntensity');
      const gi = id('uiGlowIntensity');
      const ga = id('uiGradientAccents');

      if (ff) on(ff, 'change', e => this.handleChange('ui.fontFamily', e.target.value));
      if (is) on(is, 'change', e => this.handleChange('ui.iconStyle', e.target.value));
      if (wm) on(wm, 'change', e => this.handleChange('ui.wallpaperMode', e.target.checked));
      if (cm) on(cm, 'change', e => this.handleChange('ui.compactMode', e.target.checked));
      if (pc) on(pc, 'change', e => this.handleChange('ui.primaryColor', e.target.value));
      if (ac) on(ac, 'change', e => this.handleChange('ui.accentColor', e.target.value));
      if (bc) on(bc, 'change', e => this.handleChange('ui.backgroundColor', e.target.value));
      if (tc) on(tc, 'change', e => this.handleChange('ui.textColor', e.target.value));
      if (boc) on(boc, 'change', e => this.handleChange('ui.borderColor', e.target.value));
      if (gb) {
        on(gb, 'input', e => {
          const v = id('uiGlassBlurValue');
          if (v) v.textContent = `${e.target.value}px`;
        });
        on(gb, 'change', e => this.handleChange('ui.glassBlur', +e.target.value));
      }
      if (co) {
        on(co, 'input', e => {
          const v = id('uiCardOpacityValue');
          if (v) v.textContent = `${e.target.value}%`;
        });
        on(co, 'change', e => this.handleChange('ui.cardOpacity', +e.target.value));
      }
      if (as) {
        on(as, 'input', e => {
          const v = id('uiAnimationSpeedValue');
          if (v) v.textContent = `${e.target.value}s`;
        });
        on(as, 'change', e => this.handleChange('ui.animationSpeed', +e.target.value));
      }
      if (ec) on(ec, 'change', e => this.handleChange('ui.easingCurve', e.target.value));
      if (mi) on(mi, 'change', e => this.handleChange('ui.microInteractions', e.target.checked));
      if (bw) {
        on(bw, 'input', e => {
          const v = id('uiBorderWidthValue');
          if (v) v.textContent = `${e.target.value}px`;
        });
        on(bw, 'change', e => this.handleChange('ui.borderWidth', +e.target.value));
      }
      if (rs) {
        on(rs, 'input', e => {
          const v = id('uiRadiusScaleValue');
          if (v) v.textContent = `${e.target.value}x`;
        });
        on(rs, 'change', e => this.handleChange('ui.radiusScale', +e.target.value));
      }
      if (ss) {
        on(ss, 'input', e => {
          const v = id('uiSpacingScaleValue');
          if (v) v.textContent = `${e.target.value}x`;
        });
        on(ss, 'change', e => this.handleChange('ui.spacingScale', +e.target.value));
      }
      if (si) {
        on(si, 'input', e => {
          const v = id('uiShadowIntensityValue');
          if (v) v.textContent = `${e.target.value}%`;
        });
        on(si, 'change', e => this.handleChange('ui.shadowIntensity', +e.target.value));
      }
      if (gi) {
        on(gi, 'input', e => {
          const v = id('uiGlowIntensityValue');
          if (v) v.textContent = `${e.target.value}%`;
        });
        on(gi, 'change', e => this.handleChange('ui.glowIntensity', +e.target.value));
      }
      if (ga) on(ga, 'change', e => this.handleChange('ui.gradientAccents', e.target.checked));
    } catch (err) {
      e('[UIAppearance] Attach listeners error:', err);
    }
  }

  handleChange(k, v) {
    this.as.save(k, v);
    this.applyStyles();
  }

  applyStyles() {
    try {
      const c = this.sm.get('ui') || {};
      const r = document.documentElement.style;
      if (c.primaryColor) r.setProperty('--primary', c.primaryColor);
      if (c.accentColor) r.setProperty('--accent', c.accentColor);
      if (c.backgroundColor) r.setProperty('--bg-app', c.backgroundColor);
      if (c.textColor) r.setProperty('--text-primary', c.textColor);
      if (c.borderColor)
        r.setProperty('--border-color', `rgba(${this.hexToRgb(c.borderColor)}, 0.12)`);
      if (c.glassBlur !== undefined) r.setProperty('--glass-blur', `${c.glassBlur}px`);
      if (c.cardOpacity !== undefined)
        r.setProperty('--bg-card', `rgba(15, 15, 15, ${c.cardOpacity / 100})`);
      if (c.animationSpeed !== undefined)
        r.setProperty('--transition-speed', `${c.animationSpeed}s`);
      if (c.easingCurve) r.setProperty('--ease-out', c.easingCurve);
      if (c.borderWidth !== undefined) r.setProperty('--border-width', `${c.borderWidth}px`);
      if (c.radiusScale !== undefined) {
        r.setProperty('--radius-sm', `${6 * c.radiusScale}px`);
        r.setProperty('--radius-md', `${12 * c.radiusScale}px`);
        r.setProperty('--radius-lg', `${24 * c.radiusScale}px`);
        r.setProperty('--radius-xl', `${32 * c.radiusScale}px`);
      }
      if (c.shadowIntensity !== undefined) {
        r.setProperty('--card-shadow', `0 16px 40px 0 rgba(0, 0, 0, ${c.shadowIntensity / 100})`);
      }
      if (c.glowIntensity !== undefined) {
        r.setProperty('--accent-glow', `rgba(0, 243, 255, ${c.glowIntensity / 100})`);
      }
      if (c.microInteractions === false) {
        r.setProperty('--transition-speed', '0s');
      }
    } catch (err) {
      e('[UIAppearance] Apply styles error:', err);
    }
  }

  hexToRgb(h) {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }
}
