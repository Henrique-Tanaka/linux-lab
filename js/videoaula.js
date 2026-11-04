'use strict';

/* ------------------------------------------------------------------
 * Videoaula: o iframe informa a própria altura para não ter rolagem interna
 * ------------------------------------------------------------------ */

const videoaulaFrame = document.getElementById('videoaulaFrame');

if (videoaulaFrame) {
  window.addEventListener('message', (event) => {
    if (event.source !== videoaulaFrame.contentWindow || event.data?.type !== 'videoaula-height') return;
    const height = Number(event.data.height);
    if (height > 0) videoaulaFrame.style.height = `${Math.ceil(height)}px`;
  });
}
