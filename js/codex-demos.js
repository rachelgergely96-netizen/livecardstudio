/**
 * Codex tab live demos — init/destroy when tab is active/inactive
 */
import { createSoundReactiveDemo } from './sound-reactive.js';
import { createConstellationDemo } from './constellation.js';

const TAB_ID = 'tab-codex';
const DEMOS = {
  'sound-reactive': createSoundReactiveDemo,
  'constellation': createConstellationDemo,
};

let activeDemos = new Map();

function isCodexActive() {
  const panel = document.getElementById(TAB_ID);
  return panel && panel.classList.contains('active');
}

function initDemos() {
  if (!isCodexActive()) return;
  document.querySelectorAll('.codex-demo-container[data-demo]').forEach(container => {
    const key = container.getAttribute('data-demo');
    if (!key || activeDemos.has(key)) return;
    const factory = DEMOS[key];
    if (!factory) return;
    const demo = factory(container);
    demo.init(container);
    activeDemos.set(key, demo);
  });
}

function destroyDemos() {
  activeDemos.forEach(demo => demo.destroy());
  activeDemos.clear();
}

function onTabChange() {
  if (isCodexActive()) {
    initDemos();
  } else {
    destroyDemos();
  }
}

const observer = new MutationObserver(() => onTabChange());
const tabEl = document.getElementById(TAB_ID);
if (tabEl) {
  observer.observe(tabEl, { attributes: true, attributeFilter: ['class'] });
}
if (isCodexActive()) {
  initDemos();
}
