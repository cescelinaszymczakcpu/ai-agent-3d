'use client';

import { useEffect } from 'react';

const LIMBS = ['arm-left', 'arm-right', 'leg-left', 'leg-right'];

export default function LimbInjector() {
  useEffect(() => {
    const decorateOrbs = () => {
      document.querySelectorAll('.premiumEcho').forEach((orb) => {
        if (orb.querySelector(':scope > .alter-limb')) return;

        orb.classList.add('alter-limbs-ready');
        LIMBS.forEach((name) => {
          const limb = document.createElement('span');
          limb.className = `alter-limb ${name}`;
          limb.setAttribute('aria-hidden', 'true');
          orb.appendChild(limb);
        });
      });
    };

    decorateOrbs();
    const observer = new MutationObserver(decorateOrbs);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
