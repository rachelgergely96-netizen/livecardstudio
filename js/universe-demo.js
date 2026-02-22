/**
 * AI Personal Universe Generator — live demo.
 * Text input, "Generating universe..." animation, card render, Try again.
 */

import { generateUniverseFromText } from './universe-generator.js';

const GENERATING_DELAY_MS = 1500;

export function createUniverseDemo(container) {
  let cardEl = null;
  let generatingEl = null;
  let inputEl = null;
  let tryWrap = null;
  let palettePreview = null;
  let currentText = '';

  return {
    init(containerEl) {
      if (!containerEl) return;
      this.container = containerEl;
      containerEl.innerHTML = `
        <div class="universe-demo">
          <div class="universe-input-wrap">
            <input type="text" class="universe-input" placeholder="Describe the person or moment..." autocomplete="off" />
            <button type="button" class="universe-submit">Generate</button>
          </div>
          <div class="universe-generating" aria-hidden="true">
            <p class="universe-generating-text">Generating your universe...</p>
            <div class="universe-palette-preview" role="presentation"></div>
          </div>
          <div class="universe-card-wrap" style="display:none;">
            <div class="live-card" id="universe-card" data-engine="universe"><canvas class="c0"></canvas><canvas class="c1"></canvas></div>
            <div class="universe-try"><button type="button" class="universe-try-btn">Try again</button></div>
          </div>
        </div>
      `;

      inputEl = containerEl.querySelector('.universe-input');
      generatingEl = containerEl.querySelector('.universe-generating');
      palettePreview = containerEl.querySelector('.universe-palette-preview');
      cardEl = containerEl.querySelector('.live-card');
      tryWrap = containerEl.querySelector('.universe-try');

      containerEl.querySelector('.universe-submit').addEventListener('click', () => this.submit());
      containerEl.querySelector('.universe-try-btn').addEventListener('click', () => this.tryAgain());
      inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.submit(); });
      if (typeof window !== 'undefined') window.generateUniverseFromText = generateUniverseFromText;
    },

    submit() {
      currentText = (inputEl && inputEl.value) ? inputEl.value.trim() : '';
      if (!currentText) {
        currentText = 'cosmic stars and moonlight';
      }
      this.showGenerating(currentText, false);
    },

    tryAgain() {
      if (!currentText) return;
      this.showGenerating(currentText, true);
    },

    showGenerating(text, randomize) {
      const inputWrap = this.container.querySelector('.universe-input-wrap');
      const cardWrap = this.container.querySelector('.universe-card-wrap');
      if (inputWrap) inputWrap.style.display = 'none';
      if (cardWrap) cardWrap.style.display = 'none';
      if (generatingEl) {
        generatingEl.style.display = 'block';
        generatingEl.setAttribute('aria-hidden', 'false');
      }

      const config = generateUniverseFromText(text, { randomize });
      const colors = config.palette || [];
      if (palettePreview) {
        palettePreview.innerHTML = colors.slice(0, 6).map((hex, i) =>
          `<span class="universe-swatch" style="background:${hex};animation-delay:${i * 0.12}s"></span>`
        ).join('');
      }

      setTimeout(() => {
        if (cardEl) {
          cardEl._universeConfig = config;
          if (typeof window.bootVisibleCards === 'function') window.bootVisibleCards();
        }
        if (generatingEl) {
          generatingEl.style.display = 'none';
          generatingEl.setAttribute('aria-hidden', 'true');
        }
        if (cardWrap) cardWrap.style.display = 'block';
        if (tryWrap) tryWrap.style.display = 'block';
      }, GENERATING_DELAY_MS);
    },

    destroy() {
      if (cardEl && typeof window.activeCards !== 'undefined') {
        const c = window.activeCards.get('universe-card');
        if (c && c.stop) c.stop();
        window.activeCards.delete('universe-card');
      }
      cardEl = null;
      generatingEl = null;
      inputEl = null;
      tryWrap = null;
      palettePreview = null;
    },
  };
}
