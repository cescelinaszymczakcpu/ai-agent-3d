'use client';

import { useEffect } from 'react';

const LIMBS = ['arm-left', 'arm-right', 'leg-left', 'leg-right'];

export default function LimbInjector() {
  useEffect(() => {
    const decorateOrbs = () => {
      document.querySelectorAll('.premiumEcho').forEach((orb) => {
        if (orb.dataset.alterDecorated === '1') return;
        orb.dataset.alterDecorated = '1';
        orb.classList.add('alter-limbs-ready', 'alter-male');

        LIMBS.forEach((name) => {
          const limb = document.createElement('span');
          limb.className = `alter-limb ${name}`;
          limb.setAttribute('aria-hidden', 'true');
          orb.appendChild(limb);
        });

        const face = document.createElement('span');
        face.className = 'alter-face';
        face.setAttribute('aria-hidden', 'true');
        face.innerHTML = '<i class="eye eye-left"></i><i class="eye eye-right"></i><i class="male-moustache"></i><i class="female-curl"></i>';
        orb.appendChild(face);
      });

      const builder = document.querySelector('.builderPanel');
      if (builder && !document.querySelector('.alter-gender-picker')) {
        const wrap = document.createElement('div');
        wrap.className = 'pickGroup alter-gender-picker';
        wrap.innerHTML = '<b>Wariant postaci</b><div class="choices"><button class="choice selected" data-gender="male">Męski</button><button class="choice" data-gender="female">Żeński</button></div>';
        builder.prepend(wrap);
        wrap.querySelectorAll('button').forEach((button) => {
          button.addEventListener('click', () => {
            const gender = button.dataset.gender;
            document.querySelectorAll('.premiumEcho').forEach((orb) => {
              orb.classList.toggle('alter-male', gender === 'male');
              orb.classList.toggle('alter-female', gender === 'female');
            });
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
