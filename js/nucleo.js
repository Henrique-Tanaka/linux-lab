'use strict';

/* ------------------------------------------------------------------
 * Armazenamento local (progresso do aluno)
 * ------------------------------------------------------------------ */

const STORAGE_KEY = 'linux-lab:aula-1';

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

const saved = readStorage();
let storageLocked = false; // ligado ao apagar o progresso, para nada ser regravado antes de recarregar

function persist() {
  if (storageLocked) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (error) {
    // Armazenamento indisponível (aba anônima, bloqueio): a página segue sem salvar.
  }
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

/* ------------------------------------------------------------------
 * Elementos
 * ------------------------------------------------------------------ */

const progressBar = document.getElementById('progressBar');
const mainMenu = document.getElementById('mainMenu');
const menuToggle = document.querySelector('.menu-toggle');
const terminalCard = document.getElementById('terminalCard');
const terminalOutput = document.getElementById('terminalOutput');
const terminalForm = document.getElementById('terminalForm');
const terminalInput = document.getElementById('terminalInput');
const terminalPrompt = document.getElementById('terminalPrompt');
const quizContainer = document.getElementById('quizContainer');
const moduleCards = [...document.querySelectorAll('.module-card')];
const stepItems = [...document.querySelectorAll('.step-item')];

/* ------------------------------------------------------------------
 * Menu
 * ------------------------------------------------------------------ */

function setMenuOpen(isOpen) {
  mainMenu.classList.toggle('open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
}

if (menuToggle) {
  menuToggle.addEventListener('click', () => setMenuOpen(!mainMenu.classList.contains('open')));
  mainMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mainMenu.classList.contains('open')) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });
}
