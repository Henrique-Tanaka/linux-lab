'use strict';

/* ------------------------------------------------------------------
 * Atividade guiada
 * ------------------------------------------------------------------ */

const labSteps = [
  () => getNode(LAB_DIR)?.type === 'dir',
  () => getNode(`${LAB_DIR}/resumo.txt`)?.type === 'file',
  () => terminal.labListed,
  () => getNode(`${LAB_DIR}/resumo-copia.txt`)?.type === 'file'
];

// Os passos só contam em ordem: o passo 3 não vale se o 2 ainda não foi feito.
function labCompletedCount() {
  let completed = 0;
  while (completed < labSteps.length && labSteps[completed]()) {
    completed += 1;
  }
  return completed;
}

function updatePracticeProgress({ announce = true } = {}) {
  const completed = labCompletedCount();

  stepItems.forEach((item, index) => {
    item.classList.toggle('completed', index < completed);
    item.classList.toggle('current', index === completed);
  });

  if (completed === labSteps.length) {
    if (announce && !terminal.labAnnounced) {
      printHint('🎉 Atividade guiada concluída! Agora experimente as missões abaixo.');
    }
    terminal.labAnnounced = true;
  } else {
    terminal.labAnnounced = false;
  }
}

function afterCommand() {
  updatePracticeProgress();
  checkCareer();
  recordCommandUse();
  updatePrompt();
  saveTerminal();
  evaluateProgress();
}

function resetLab() {
  terminal.fs = createInitialFs();
  terminal.cwd = HOME;
  terminal.labListed = false;
  terminal.labAnnounced = false;
  saved.scenarios = {};
  updateScenarioStates();
  careerOnTerminalReset();
  printHint('Ambiente resetado: pastas, arquivos, atividade e missões voltaram ao início.');
}

/* ------------------------------------------------------------------
 * Terminal: posição na página, histórico e autocompletar
 * ------------------------------------------------------------------ */

function focusTerminal() {
  if (!terminalCard) return;
  terminalInput.focus({ preventScroll: true });
  terminalCard.scrollIntoView({ behavior: scrollBehavior, block: 'nearest' });
}

function navigateHistory(direction) {
  const { history } = terminal;
  if (!history.length) return;
  if (terminal.historyIndex === null) {
    if (direction > 0) return;
    terminal.historyIndex = history.length;
  }
  terminal.historyIndex = Math.min(history.length, Math.max(0, terminal.historyIndex + direction));
  terminalInput.value = history[terminal.historyIndex] ?? '';
  if (terminal.historyIndex === history.length) {
    terminal.historyIndex = null;
  }
  requestAnimationFrame(() => {
    const end = terminalInput.value.length;
    terminalInput.setSelectionRange(end, end);
  });
}

function commonPrefix(values) {
  return values.reduce((prefix, value) => {
    let index = 0;
    while (index < prefix.length && prefix[index] === value[index]) index += 1;
    return prefix.slice(0, index);
  });
}

function autocomplete() {
  const value = terminalInput.value;
  const lastSpace = value.lastIndexOf(' ');
  const head = value.slice(0, lastSpace + 1);
  const word = value.slice(lastSpace + 1);
  let candidates;

  if (!head.trim()) {
    candidates = Object.keys(commands)
      .filter((name) => name.startsWith(word))
      .map((name) => ({ value: name, label: name, suffix: ' ' }));
  } else {
    const slash = word.lastIndexOf('/');
    const dirPart = word.slice(0, slash + 1);
    const prefix = word.slice(slash + 1);
    const dirPath = resolvePath(dirPart || '.');
    if (getNode(dirPath)?.type !== 'dir') return;
    candidates = childrenOf(dirPath)
      .filter((name) => name.startsWith(prefix) && (prefix.startsWith('.') || !name.startsWith('.')))
      .map((name) => ({
        value: dirPart + name,
        label: name,
        suffix: getNode(joinPath(dirPath, name)).type === 'dir' ? '/' : ' '
      }));
  }

  if (!candidates.length) return;
  if (candidates.length === 1) {
    terminalInput.value = head + candidates[0].value + candidates[0].suffix;
    return;
  }
  const common = commonPrefix(candidates.map((candidate) => candidate.value));
  if (common.length > word.length) {
    terminalInput.value = head + common;
  } else {
    printHint(candidates.map((candidate) => candidate.label).join('  '));
  }
}

terminalInput?.addEventListener('keydown', (event) => {
  // Com o campo vazio, Tab segue o comportamento normal e leva o foco adiante.
  if (event.key === 'Tab' && !event.shiftKey && terminalInput.value) {
    event.preventDefault();
    autocomplete();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    navigateHistory(-1);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    navigateHistory(1);
  }
});

terminalForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (terminal.busy) return;
  const command = terminalInput.value;
  terminalInput.value = '';
  terminal.historyIndex = null;
  runLine(command, { typed: true });
});

/* ------------------------------------------------------------------
 * Botões que executam comandos e missões
 * ------------------------------------------------------------------ */

function setBusy(isBusy) {
  terminal.busy = isBusy;
  document.querySelectorAll('[data-command], .scenario-btn').forEach((button) => {
    button.disabled = isBusy;
  });
}

document.querySelectorAll('[data-command]').forEach((button) => {
  button.addEventListener('click', () => {
    runLine(button.dataset.command);
    focusTerminal();
  });
});

document.querySelectorAll('.copy-btn').forEach((button) => {
  button.addEventListener('click', async () => {
    const originalText = button.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = 'Copiado!';
    } catch (error) {
      button.textContent = 'Erro';
    }
    setTimeout(() => {
      button.textContent = originalText;
    }, 1100);
  });
});

const scenarios = {
  ecommerce: {
    title: 'Loja de e-commerce',
    intro: 'Missão: organizar o estoque da loja e preparar o fechamento diário.',
    commands: [
      'cd ~',
      'mkdir -p loja/produtos loja/vendas',
      'echo "Camiseta: 25 unidades" > loja/produtos/estoque.txt',
      'echo "Boné: 12 unidades" >> loja/produtos/estoque.txt',
      'ls loja',
      'cat loja/produtos/estoque.txt'
    ]
  },
  support: {
    title: 'Empresa de suporte',
    intro: 'Missão: separar chamados por status e manter o setor de suporte organizado.',
    commands: [
      'cd ~',
      'mkdir -p suporte/abertos suporte/atendidos',
      'echo "Chamado 101: impressora sem conexão" > suporte/abertos/chamado-101.txt',
      'ls suporte',
      'ls suporte/abertos'
    ]
  },
  finance: {
    title: 'Departamento financeiro',
    intro: 'Missão: salvar registros financeiros e criar backup para auditoria.',
    commands: [
      'cd ~',
      'mkdir -p financeiro/2026/outubro',
      'echo "Aluguel: R$ 2.500,00" > financeiro/2026/outubro/contas.txt',
      'cp financeiro/2026/outubro/contas.txt financeiro/2026/outubro/contas-backup.txt',
      'chmod 600 financeiro/2026/outubro/contas-backup.txt',
      'ls -l financeiro/2026/outubro'
    ]
  }
};

function updateScenarioStates() {
  document.querySelectorAll('.scenario-card').forEach((card) => {
    const key = card.querySelector('.scenario-btn')?.dataset.scenario;
    card.classList.toggle('is-complete', Boolean(saved.scenarios?.[key]));
  });
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, prefersReducedMotion ? 0 : ms));

async function runScenario(key, button) {
  const scenario = scenarios[key];
  if (!scenario || terminal.busy) return;

  setBusy(true);
  focusTerminal();
  printHint(`=== ${scenario.intro} ===`);
  for (const command of scenario.commands) {
    await wait(400);
    runLine(command);
  }
  saved.scenarios = { ...saved.scenarios, [key]: true };
  persist();
  updateScenarioStates();
  evaluateProgress();
  printHint(`✔ Missão concluída: ${scenario.title}. Que tal repetir digitando os comandos você mesmo?`);
  setBusy(false);
  terminalInput.focus({ preventScroll: true });
}

document.querySelectorAll('.scenario-btn').forEach((button) => {
  button.addEventListener('click', () => runScenario(button.dataset.scenario, button));
});
