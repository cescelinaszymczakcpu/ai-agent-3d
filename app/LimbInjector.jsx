'use client';

import { useEffect } from 'react';

const LIMBS = ['arm-left', 'arm-right', 'leg-left', 'leg-right'];

const FACE_SVG = `
<svg class="alter-face-svg" viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <linearGradient id="alterIris" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="var(--c3)"/>
      <stop offset="45%" stop-color="var(--c2)"/>
      <stop offset="100%" stop-color="var(--c1)"/>
    </linearGradient>
    <linearGradient id="alterGlass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="var(--c2)"/>
      <stop offset="42%" stop-color="var(--c1)"/>
      <stop offset="66%" stop-color="var(--c3)"/>
      <stop offset="100%" stop-color="var(--c2)"/>
    </linearGradient>
    <filter id="alterGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <g class="alter-eyes">
    <ellipse cx="70" cy="87" rx="21" ry="18" fill="rgba(247,250,255,.88)" stroke="rgba(255,255,255,.72)" stroke-width="1.4"/>
    <ellipse cx="130" cy="87" rx="21" ry="18" fill="rgba(247,250,255,.88)" stroke="rgba(255,255,255,.72)" stroke-width="1.4"/>
    <circle cx="72" cy="88" r="11" fill="url(#alterIris)"/>
    <circle cx="128" cy="88" r="11" fill="url(#alterIris)"/>
    <circle cx="72" cy="89" r="6.2" fill="#090b17"/>
    <circle cx="128" cy="89" r="6.2" fill="#090b17"/>
    <circle cx="68.5" cy="84.5" r="2.4" fill="white"/>
    <circle cx="124.5" cy="84.5" r="2.4" fill="white"/>
    <path d="M51 72 Q69 62 85 71" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M115 71 Q132 62 149 72" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="3.2" stroke-linecap="round"/>
  </g>

  <g class="female-lashes" fill="none" stroke="rgba(255,255,255,.88)" stroke-width="2" stroke-linecap="round">
    <path d="M49 83 l-7 -5 M50 88 l-8 0 M151 83 l7 -5 M150 88 l8 0"/>
  </g>

  <path class="alter-mouth" d="M88 126 Q100 135 112 126" fill="none" stroke="rgba(255,255,255,.76)" stroke-width="2.5" stroke-linecap="round"/>

  <g class="male-detail" filter="url(#alterGlow)" fill="none" stroke="url(#alterGlass)" stroke-linecap="round" stroke-linejoin="round">
    <path d="M99 115 C84 103 68 108 55 120 C43 131 27 132 15 122 C24 143 49 145 67 132 C78 124 88 123 99 128" stroke-width="9"/>
    <path d="M101 115 C116 103 132 108 145 120 C157 131 173 132 185 122 C176 143 151 145 133 132 C122 124 112 123 101 128" stroke-width="9"/>
  </g>

  <g class="female-detail" filter="url(#alterGlow)" fill="none" stroke="url(#alterGlass)" stroke-linecap="round">
    <path d="M70 49 C94 18 145 22 155 52 C162 73 147 86 132 74 C122 66 127 53 140 55" stroke-width="6.5"/>
    <path d="M84 45 C103 29 128 29 144 39" stroke-width="3.5" opacity=".75"/>
  </g>
</svg>`;

export default function LimbInjector() {
  useEffect(() => {
    let gender = 'male';

    const applyGender = () => {
      document.querySelectorAll('.premiumEcho').forEach((orb) => {
        orb.classList.toggle('alter-male', gender === 'male');
        orb.classList.toggle('alter-female', gender === 'female');
      });
    };

    const decorateOrbs = () => {
      document.querySelectorAll('.premiumEcho').forEach((orb) => {
        if (orb.dataset.alterDecorated === '1') return;
        orb.dataset.alterDecorated = '1';
        orb.classList.add('alter-limbs-ready');

        LIMBS.forEach((name) => {
          const limb = document.createElement('span');
          limb.className = `alter-limb ${name}`;
          limb.setAttribute('aria-hidden', 'true');
          orb.appendChild(limb);
        });

        const face = document.createElement('span');
        face.className = 'alter-face';
        face.innerHTML = FACE_SVG;
        orb.appendChild(face);
      });

      applyGender();

      const builder = document.querySelector('.builderPanel');
      if (builder && !document.querySelector('.alter-gender-picker')) {
        const wrap = document.createElement('div');
        wrap.className = 'pickGroup alter-gender-picker';
        wrap.innerHTML = '<b>Wariant postaci</b><div class="choices"><button class="choice selected" data-gender="male">Męski</button><button class="choice" data-gender="female">Żeński</button></div>';
        builder.prepend(wrap);
        wrap.querySelectorAll('button').forEach((button) => {
          button.addEventListener('click', () => {
            gender = button.dataset.gender;
            applyGender();
            wrap.querySelectorAll('button').forEach((b) => b.classList.toggle('selected', b === button));
          });
        });
      }
    };

    decorateOrbs();
    const observer = new MutationObserver(decorateOrbs);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
