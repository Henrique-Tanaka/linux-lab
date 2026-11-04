'use strict';

/* ------------------------------------------------------------------
 * Inicialização
 * ------------------------------------------------------------------ */

updatePrompt();
updatePracticeProgress({ announce: false });
updateScenarioStates();
renderCareer();
buildProgressUi();
evaluateProgress({ announce: false });
updateScrollState();
persist();

// Destaca no menu a página aberta.
const currentPage = location.pathname.split('/').pop() || 'index.html';
mainMenu.querySelectorAll('a').forEach((link) => {
  const isCurrent = link.getAttribute('href') === currentPage;
  link.classList.toggle('is-active', isCurrent);
  if (isCurrent) link.setAttribute('aria-current', 'page');
});
