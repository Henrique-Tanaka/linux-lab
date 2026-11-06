'use strict';

/* ------------------------------------------------------------------
 * Rodapé: apagar progresso
 * ------------------------------------------------------------------ */

document.getElementById('clearProgress')?.addEventListener('click', (event) => {
  confirmByClickingTwice(event.currentTarget, 'Clique de novo para apagar tudo', () => {
    storageLocked = true;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Nada salvo para apagar.
    }
    window.location.reload();
  });
});

/* ------------------------------------------------------------------
 * Progresso da aula: objetivos reais em cada módulo
 * ------------------------------------------------------------------ */

const progress = {
  dwell: {}, // segundos de estudo ativo em cada módulo
  commands: [],
  builderUsed: false,
  video: { scenes: [], total: 0 },
  done: [],
  celebrated: false,
  ...saved.progress
};
saved.progress = progress;
delete saved.reachedSection; // formato antigo, que media apenas a rolagem da página
['seenEnd', 'read', 'need'].forEach((key) => delete progress[key]); // regra antiga: leitura até o fim da página

const QUIZ_PASS = Math.ceil(baseQuestions.length * 0.7);
const STUDY_MINUTES = 15; // tempo de estudo ativo exigido em cada módulo
const STUDY_SECONDS = STUDY_MINUTES * 60;
const IDLE_SECONDS = 120; // sem mexer na página por este tempo, o relógio pausa
const VIDEO_GOAL = 0.8; // fração das cenas da videoaula que precisa ser assistida até o fim
const COMMANDS_GOAL = 5;
const IGNORED_COMMANDS = ['help', 'clear', 'reset', 'history'];

const usedCommands = (...names) => names.every((name) => progress.commands.includes(name));
const videoScenesNeeded = () => Math.ceil(progress.video.total * VIDEO_GOAL);

const formatClock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function studyObjective(sectionId) {
  return {
    id: `${sectionId}:tempo`,
    label: `Estudar este módulo por ${STUDY_MINUTES} minutos`,
    check: () => (progress.dwell[sectionId] || 0) >= STUDY_SECONDS,
    detail: () => `${formatClock(Math.min(STUDY_SECONDS, progress.dwell[sectionId] || 0))} de ${formatClock(STUDY_SECONDS)}`
  };
}

const lessonModules = [
  {
    id: 'videoaula',
    title: 'Videoaula',
    objectives: [
      {
        id: 'videoaula:assistir',
        label: 'Assistir à videoaula',
        check: () => progress.video.total > 0 && progress.video.scenes.length >= videoScenesNeeded(),
        detail: () =>
          progress.video.total
            ? `${progress.video.scenes.length} de ${videoScenesNeeded()} cenas necessárias`
            : `assista pelo menos ${Math.round(VIDEO_GOAL * 100)}% das cenas`
      }
    ]
  },
  {
    id: 'sistema-operacional',
    title: 'Sistema operacional',
    objectives: [studyObjective('sistema-operacional')]
  },
  {
    id: 'linux',
    title: 'Conhecendo o Linux',
    objectives: [studyObjective('linux')]
  },
  {
    id: 'arquivos',
    title: 'Arquivos e diretórios',
    objectives: [
      studyObjective('arquivos'),
      {
        id: 'arquivos:navegar',
        label: 'Digitar cd e ls no terminal para navegar pelas pastas',
        href: 'modulo-4.html',
        check: () => usedCommands('cd', 'ls')
      }
    ]
  },
  {
    id: 'comandos',
    title: 'Comandos do terminal',
    objectives: [
      studyObjective('comandos'),
      {
        id: 'comandos:cinco',
        label: `Digitar ${COMMANDS_GOAL} comandos diferentes no terminal`,
        check: () => progress.commands.length >= COMMANDS_GOAL,
        detail: () => `${Math.min(COMMANDS_GOAL, progress.commands.length)}/${COMMANDS_GOAL} (os botões não contam)`
      }
    ]
  },
  {
    id: 'usuarios',
    title: 'Usuários e permissões',
    objectives: [
      studyObjective('usuarios'),
      {
        id: 'usuarios:construtor',
        label: 'Montar uma permissão no quadro “Monte a permissão”',
        check: () => progress.builderUsed
      },
      {
        id: 'usuarios:chmod',
        label: 'Digitar um chmod no terminal',
        check: () => usedCommands('chmod')
      }
    ]
  },
  {
    id: 'pratique',
    title: 'Prática e revisão',
    objectives: [
      {
        id: 'pratique:atividade',
        label: 'Concluir os 4 passos da atividade guiada',
        check: () => labCompletedCount() === labSteps.length,
        detail: () => `${labCompletedCount()}/${labSteps.length} passos`
      },
      {
        id: 'pratique:missao',
        label: 'Concluir pelo menos uma missão real',
        check: () => Object.values(saved.scenarios || {}).some(Boolean)
      },
      {
        id: 'pratique:quiz',
        label: `Acertar pelo menos ${QUIZ_PASS} de ${baseQuestions.length} questões no quiz`,
        check: () => (saved.quizBest ?? 0) >= QUIZ_PASS,
        detail: () => (saved.quizBest != null ? `melhor resultado: ${saved.quizBest}/${baseQuestions.length}` : '')
      },
      studyObjective('pratique')
    ]
  },
  {
    id: 'carreira',
    title: 'Modo carreira',
    objectives: [
      {
        id: 'carreira:etapa',
        label: 'Concluir a 1ª etapa do expediente',
        check: () => career.finished || career.chapter >= 1
      },
      {
        id: 'carreira:final',
        label: 'Concluir o expediente completo',
        check: () => career.finished,
        detail: () => `${completedTaskCount()}/${TOTAL_TASKS} tarefas`
      },
      studyObjective('carreira')
    ]
  }
];

lessonModules.forEach((module, index) => {
  // A videoaula é a abertura (página própria); os módulos 1 a 7 vêm depois.
  const isVideo = module.id === 'videoaula';
  module.number = isVideo ? 0 : index;
  module.label = isVideo ? 'Videoaula' : `Módulo ${index}`;
  module.page = isVideo ? 'videoaula.html' : `modulo-${index}.html`;
  module.objectives.forEach((objective) => {
    objective.module = module;
  });
});

const allObjectives = lessonModules.flatMap((module) => module.objectives);
const isDone = (objective) => progress.done.includes(objective.id);

function recordCommandUse() {
  const run = terminal.lastRun;
  if (!run?.ok || !run.typed || !Object.hasOwn(commands, run.name) || IGNORED_COMMANDS.includes(run.name)) return;
  if (!progress.commands.includes(run.name)) {
    progress.commands.push(run.name);
  }
}

// A videoaula (iframe) avisa cada cena assistida até o fim. Pular cenas não conta.
window.addEventListener('message', (event) => {
  const frame = document.getElementById('videoaulaFrame');
  const { data } = event;
  if (!frame || event.source !== frame.contentWindow || data?.type !== 'videoaula-cena') return;
  const scene = Number(data.scene);
  const total = Number(data.total);
  if (!Number.isInteger(scene) || !Number.isInteger(total) || scene < 0 || scene >= total) return;
  progress.video.total = total;
  if (!progress.video.scenes.includes(scene)) progress.video.scenes.push(scene);
  persist();
  evaluateProgress();
});

function moduleState(module) {
  const done = module.objectives.filter(isDone).length;
  const total = module.objectives.length;
  const started = done > 0 || (progress.dwell[module.id] || 0) > 0;
  return { done, total, complete: done === total, started };
}

function nextObjective() {
  return allObjectives.find((objective) => !isDone(objective));
}

function setHtml(element, html) {
  if (element && element.dataset.rendered !== html) {
    element.innerHTML = html;
    element.dataset.rendered = html;
  }
}

function objectiveItemHtml(objective) {
  const done = isDone(objective);
  const detail = !done && objective.detail ? objective.detail() : '';
  return `<li class="${done ? 'is-done' : ''}">
      <span class="objective-mark" aria-hidden="true">${done ? '✓' : ''}</span>
      <span>${escapeHtml(objective.label)}${detail ? ` <small>${escapeHtml(detail)}</small>` : ''}</span>
      <span class="visually-hidden">${done ? '(concluído)' : '(pendente)'}</span>
    </li>`;
}

function renderVideoProgress() {
  const text = document.getElementById('videoProgressText');
  if (!text) return;
  const { scenes, total } = progress.video;
  const needed = videoScenesNeeded();
  const watched = progress.done.includes('videoaula:assistir');
  const percent = watched ? 100 : total ? Math.round(Math.min(1, scenes.length / needed) * 100) : 0;

  text.textContent = watched
    ? '✓ Concluída! Já conta no progresso da aula.'
    : total
      ? `${scenes.length} de ${total} cenas assistidas · faltam ${needed - scenes.length} para concluir`
      : `Assista a pelo menos ${Math.round(VIDEO_GOAL * 100)}% das cenas para concluir.`;
  document.getElementById('videoProgressFill').style.width = `${percent}%`;
  document.getElementById('videoProgressBar').setAttribute('aria-valuenow', String(percent));
  text.closest('.video-player')?.classList.toggle('is-watched', watched);
}

function renderProgress() {
  const doneCount = allObjectives.filter(isDone).length;
  const total = allObjectives.length;
  const percent = Math.round((doneCount / total) * 100);

  document.getElementById('headerProgress').textContent = `${percent}%`;

  // O painel "Progresso da aula" só existe na página inicial.
  if (document.getElementById('courseProgressFill')) {
    document.getElementById('courseProgressFill').style.width = `${percent}%`;
    document.getElementById('courseProgressBar').setAttribute('aria-valuenow', String(percent));
    document.getElementById('courseProgressPercent').textContent = `${percent}%`;
    document.getElementById('courseProgressText').textContent = doneCount
      ? `${doneCount} de ${total} objetivos concluídos`
      : `Nenhum dos ${total} objetivos concluído ainda`;

    const nextStep = document.getElementById('courseNextStep');
    const heroStart = document.getElementById('heroStart');
    const next = nextObjective();
    if (next) {
      nextStep.href = next.href || next.module.page;
      nextStep.textContent = `${doneCount ? 'Continuar' : 'Começar'}: ${next.module.label} · ${next.label}`;
      nextStep.classList.remove('is-done');
      heroStart.href = nextStep.getAttribute('href');
      heroStart.textContent = doneCount ? 'Continuar a aula' : 'Começar a aula';
    } else {
      nextStep.href = 'glossario.html';
      nextStep.textContent = '🎓 Aula concluída! Revisar o glossário';
      nextStep.classList.add('is-done');
      heroStart.href = '#modulos';
      heroStart.textContent = 'Revisar os módulos';
    }
  }

  renderVideoProgress();

  setHtml(
    document.getElementById('courseChecklist'),
    lessonModules
      .map((module) => {
        const state = moduleState(module);
        return `<li class="${state.complete ? 'is-complete' : ''}">
            <div class="checklist-head">
              <span>${module.label} · ${escapeHtml(module.title)}</span>
              <span class="checklist-count">${state.done}/${state.total}</span>
            </div>
            <ul>${module.objectives.map(objectiveItemHtml).join('')}</ul>
          </li>`;
      })
      .join('')
  );

  lessonModules.forEach((module) => {
    const state = moduleState(module);
    const card = moduleCards.find((item) => item.dataset.module === module.id);
    if (card) {
      card.classList.toggle('is-complete', state.complete);
      card.classList.toggle('is-progress', !state.complete && state.started);
      card.querySelector('.module-status').textContent = state.complete
        ? 'Concluído ✓'
        : state.started
          ? `Em andamento · ${state.done}/${state.total}`
          : 'Não iniciado';
      card.querySelector('.module-progress-fill').style.width = `${Math.round((state.done / state.total) * 100)}%`;
    }

    const box = document.querySelector(`.module-objectives[data-module="${module.id}"]`);
    if (box) {
      box.classList.toggle('is-complete', state.complete);
      box.querySelector('.module-objectives-count').textContent = state.complete ? 'Módulo concluído ✓' : `${state.done}/${state.total}`;
      setHtml(box.querySelector('ul'), module.objectives.map(objectiveItemHtml).join(''));
    }
  });
}

function evaluateProgress({ announce = true } = {}) {
  const newly = allObjectives.filter((objective) => !isDone(objective) && objective.check());
  newly.forEach((objective) => progress.done.push(objective.id));

  if (newly.length) {
    persist();
    if (announce) {
      newly.forEach((objective) => showToast(`✔ ${objective.module.label}: ${objective.label}`, 'is-progress'));
      newly
        .map((objective) => objective.module)
        .filter((module, index, list) => list.indexOf(module) === index && moduleState(module).complete)
        .forEach((module) => showToast(`📘 ${module.label} concluído: ${module.title}`, 'is-badge'));
    }
  }

  if (!progress.celebrated && allObjectives.every(isDone)) {
    progress.celebrated = true;
    persist();
    if (announce) showToast('🎓 Parabéns! Você concluiu 100% da aula.', 'is-rank');
  }

  renderProgress();
}

// Caixas "Objetivos deste módulo" no início de cada seção e mini barra em cada cartão de módulo.
function buildProgressUi() {
  lessonModules.forEach((module) => {
    const heading = document.querySelector(`#${module.id} .section-heading`);
    if (heading && !document.querySelector(`.module-objectives[data-module="${module.id}"]`)) {
      const box = document.createElement('aside');
      box.className = 'module-objectives';
      box.dataset.module = module.id;
      box.setAttribute('aria-label', `Objetivos: ${module.label}`);
      box.innerHTML = `<div class="module-objectives-head">
          <span class="goal-label">Objetivos deste módulo</span>
          <span class="module-objectives-count"></span>
        </div>
        <ul></ul>`;
      heading.after(box);
    }

    const card = moduleCards.find((item) => item.dataset.module === module.id);
    if (card && !card.querySelector('.module-progress')) {
      const bar = document.createElement('span');
      bar.className = 'module-progress';
      bar.setAttribute('aria-hidden', 'true');
      bar.innerHTML = '<span class="module-progress-fill"></span>';
      card.querySelector('.module-status').before(bar);
    }
  });
}

/* Barra de rolagem no topo da página */

function updateScrollState() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
}

let scrollFrame = null;
function scheduleScrollUpdate() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null;
    updateScrollState();
  });
}

window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
window.addEventListener('resize', scheduleScrollUpdate);
window.addEventListener('load', updateScrollState);

/* ------------------------------------------------------------------
 * Relógio de estudo: 15 minutos ativos em cada módulo
 * Só conta com a aba visível e a pessoa interagindo (rolar, clicar, digitar);
 * depois de 2 minutos parada, o relógio pausa até ela voltar a mexer na página.
 * ------------------------------------------------------------------ */

const studyId = lessonModules.map((module) => module.id).find((id) => id !== 'videoaula' && document.getElementById(id));
let lastActivity = Date.now();
['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'].forEach((type) =>
  window.addEventListener(
    type,
    () => {
      lastActivity = Date.now();
    },
    { passive: true }
  )
);

function createStudyClock() {
  if (!studyId) return null;
  const box = document.createElement('div');
  box.className = 'estudo-relogio';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Tempo de estudo deste módulo');
  box.innerHTML = `<span class="estudo-icone" aria-hidden="true">⏱</span>
    <div class="estudo-corpo">
      <strong class="estudo-tempo"></strong>
      <span class="estudo-estado"></span>
      <span class="estudo-trilho" aria-hidden="true"><span class="estudo-barra"></span></span>
    </div>`;
  document.body.append(box);
  return box;
}

const studyClock = createStudyClock();

function renderStudyClock(active) {
  if (!studyClock) return;
  const spent = Math.min(STUDY_SECONDS, progress.dwell[studyId] || 0);
  const finished = spent >= STUDY_SECONDS;
  studyClock.querySelector('.estudo-tempo').textContent = `${formatClock(spent)} / ${formatClock(STUDY_SECONDS)}`;
  studyClock.querySelector('.estudo-estado').textContent = finished
    ? '✓ Módulo estudado'
    : active
      ? 'Contando seu estudo…'
      : 'Pausado: sem atividade';
  studyClock.querySelector('.estudo-barra').style.width = `${Math.round((spent / STUDY_SECONDS) * 100)}%`;
  studyClock.classList.toggle('is-done', finished);
  studyClock.classList.toggle('is-paused', !finished && !active);
}

let studyTicks = 0;
function studyTick() {
  if (document.visibilityState !== 'visible') return;
  updateScrollState();
  if (!studyId) return;
  const active = Date.now() - lastActivity < IDLE_SECONDS * 1000;
  if (active && (progress.dwell[studyId] || 0) < STUDY_SECONDS) {
    progress.dwell[studyId] = (progress.dwell[studyId] || 0) + 1;
    studyTicks += 1;
    if (studyTicks % 5 === 0) persist();
    evaluateProgress();
  }
  renderStudyClock(active);
}
setInterval(studyTick, 1000);
renderStudyClock(true);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist();
});
