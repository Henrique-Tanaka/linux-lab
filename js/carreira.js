'use strict';

/* ------------------------------------------------------------------
 * Modo carreira: gamificação de um dia de trabalho na TechNova
 * ------------------------------------------------------------------ */

const WORK = `${HOME}/trabalho`;
const DOWNLOADS = `${HOME}/downloads`;

function ensureDirs(...paths) {
  paths.forEach((path) => {
    const missing = [];
    let current = path;
    while (!getNode(current)) {
      missing.unshift(current);
      current = parentOf(current);
    }
    missing.forEach((dirPath) => {
      terminal.fs[dirPath] = dirNode(USER);
    });
  });
}

function seedFile(path, content, mode = 'rw-r--r--') {
  ensureDirs(parentOf(path));
  if (!getNode(path)) {
    terminal.fs[path] = fileNode(content, USER, mode);
  }
}

const isDir = (path) => getNode(path)?.type === 'dir';
const isFile = (path) => getNode(path)?.type === 'file';
const ran = (run, name) => Boolean(run?.ok && run.name === name);
const targets = (run, path) => (run.operands.length ? run.operands.some((operand) => resolvePath(operand) === path) : terminal.cwd === path);
const ranScript = (run, path) =>
  Boolean(run?.ok) &&
  ((run.name.includes('/') && resolvePath(run.name) === path) || (run.name === 'bash' && resolvePath(run.operands[0] || '.') === path));

const careerChapters = [
  {
    id: 'chegada',
    short: 'Chegada',
    title: 'Chegada à estação de trabalho',
    mentor:
      'Bem-vindo(a) à TechNova! Antes de qualquer coisa, reconheça o computador que você vai usar: com qual usuário entrou, em que pasta está e o que já existe nela.',
    setup() {
      seedFile(
        `${HOME}/recado-da-equipe.txt`,
        'Olá! Seja bem-vindo(a) ao time de TI da TechNova.\nSeu primeiro dia terá 5 etapas. Em caso de dúvida, digite help.\nBom trabalho!\n— Carla, coordenação de TI'
      );
    },
    tasks: [
      {
        title: 'Descubra com qual usuário você entrou no sistema',
        hints: ['Existe um comando que responde à pergunta "quem sou eu?" em inglês.', 'whoami'],
        check: (run) => ran(run, 'whoami')
      },
      {
        title: 'Confira em qual pasta você está agora',
        hints: ['O comando é a sigla de "print working directory".', 'pwd'],
        check: (run) => ran(run, 'pwd')
      },
      {
        title: 'Leia o recado da equipe (recado-da-equipe.txt)',
        hints: ['Use o comando que exibe o conteúdo de um arquivo.', 'cat ~/recado-da-equipe.txt'],
        check: (run) => ran(run, 'cat') && targets(run, `${HOME}/recado-da-equipe.txt`)
      },
      {
        title: 'Liste também os arquivos ocultos da sua pasta pessoal',
        hints: ['O ls tem uma opção que mostra os arquivos que começam com ponto.', 'ls -a ~'],
        check: (run) => ran(run, 'ls') && run.flags.has('a')
      }
    ]
  },
  {
    id: 'organizacao',
    short: 'Organização',
    title: 'Organizando a área de trabalho',
    mentor:
      'Quem é organizado encontra tudo rápido. Monte a estrutura de pastas que toda a equipe usa: uma pasta trabalho com projetos, documentos e backups.',
    setup() {},
    tasks: [
      {
        title: 'Crie a pasta trabalho dentro da sua pasta pessoal',
        hints: ['Use mkdir. Lembre: ~ representa a sua pasta pessoal.', 'mkdir ~/trabalho'],
        check: () => isDir(WORK)
      },
      {
        title: 'Dentro de trabalho, crie as pastas projetos, documentos e backups',
        hints: ['O mkdir aceita vários nomes de uma só vez, separados por espaço.', 'mkdir ~/trabalho/projetos ~/trabalho/documentos ~/trabalho/backups'],
        check: () => ['projetos', 'documentos', 'backups'].every((name) => isDir(`${WORK}/${name}`))
      },
      {
        title: 'Entre na pasta trabalho',
        hints: ['Use cd seguido do caminho da pasta.', 'cd ~/trabalho'],
        check: (run) => ran(run, 'cd') && terminal.cwd === WORK
      },
      {
        title: 'Crie documentos/anotacoes.txt com o texto "Reunião às 10h"',
        hints: ['Use echo com o sinal > para gravar um texto em um arquivo.', 'echo "Reunião às 10h" > documentos/anotacoes.txt'],
        check: () => Boolean(getNode(`${WORK}/documentos/anotacoes.txt`)?.content?.includes('10h'))
      }
    ]
  },
  {
    id: 'faxina',
    short: 'Faxina',
    title: 'Faxina na pasta de downloads',
    mentor:
      'Chegaram arquivos de clientes na pasta downloads, tudo misturado. Organize antes da reunião das 10h: o contrato vai para documentos, o relatório ganha um nome claro e o lixo vai embora.',
    setup() {
      ensureDirs(`${WORK}/documentos`);
      seedFile(`${DOWNLOADS}/contrato-cliente.pdf`, '(documento PDF: contrato assinado)');
      seedFile(`${DOWNLOADS}/relatorio-vendas.pdf`, '(documento PDF: vendas de outubro)');
      seedFile(`${DOWNLOADS}/foto-evento.jpg`, '(imagem JPG)');
      seedFile(`${DOWNLOADS}/lixo.tmp`, '(arquivo temporário)');
    },
    tasks: [
      {
        title: 'Veja o que chegou na pasta downloads',
        hints: ['Liste o conteúdo da pasta ~/downloads.', 'ls ~/downloads'],
        check: (run) => ran(run, 'ls') && targets(run, DOWNLOADS)
      },
      {
        title: 'Mova contrato-cliente.pdf para trabalho/documentos',
        hints: ['Use mv origem destino. Se o destino for uma pasta, o arquivo vai para dentro dela.', 'mv ~/downloads/contrato-cliente.pdf ~/trabalho/documentos/'],
        check: () => isFile(`${WORK}/documentos/contrato-cliente.pdf`)
      },
      {
        title: 'Renomeie relatorio-vendas.pdf para relatorio-outubro.pdf',
        hints: ['Renomear também se faz com mv: o nome novo é o destino.', 'mv ~/downloads/relatorio-vendas.pdf ~/downloads/relatorio-outubro.pdf'],
        check: () =>
          !getNode(`${DOWNLOADS}/relatorio-vendas.pdf`) &&
          Object.keys(terminal.fs).some((path) => path.startsWith(`${HOME}/`) && path.endsWith('/relatorio-outubro.pdf'))
      },
      {
        title: 'Apague o arquivo temporário lixo.tmp',
        hints: ['Arquivos são apagados com rm. Cuidado: no terminal não existe lixeira!', 'rm ~/downloads/lixo.tmp'],
        check: () => !getNode(`${DOWNLOADS}/lixo.tmp`)
      }
    ]
  },
  {
    id: 'seguranca',
    short: 'Segurança',
    title: 'Segurança da informação',
    mentor:
      'A auditoria encontrou um arquivo de senhas que qualquer pessoa pode ler! Proteja esse arquivo e depois prepare o script que publica o site da empresa.',
    setup() {
      ensureDirs(`${WORK}/documentos`, `${WORK}/projetos`);
      seedFile(`${WORK}/documentos/senhas-wifi.txt`, 'Rede: TechNova-Corp\nSenha: ********');
      seedFile(
        `${WORK}/projetos/publicar-site.sh`,
        '#!/bin/bash\necho "Publicando o site da TechNova..."\necho "Site no ar! Bom trabalho."'
      );
    },
    tasks: [
      {
        title: 'Veja as permissões dos arquivos em trabalho/documentos',
        hints: ['O ls tem uma opção de formato longo, que mostra as permissões.', 'ls -l ~/trabalho/documentos'],
        check: (run) => ran(run, 'ls') && run.flags.has('l') && targets(run, `${WORK}/documentos`)
      },
      {
        title: 'Deixe senhas-wifi.txt legível e editável só por você',
        hints: ['Dono: rw- (4 + 2 = 6). Grupo e outros: nenhuma permissão (0).', 'chmod 600 ~/trabalho/documentos/senhas-wifi.txt'],
        check: () => getNode(`${WORK}/documentos/senhas-wifi.txt`)?.mode === 'rw-------'
      },
      {
        title: 'Dê permissão de execução ao script projetos/publicar-site.sh',
        hints: ['O chmod aceita a forma simbólica +x.', 'chmod +x ~/trabalho/projetos/publicar-site.sh'],
        check: () => getNode(`${WORK}/projetos/publicar-site.sh`)?.mode[2] === 'x'
      },
      {
        title: 'Execute o script para publicar o site',
        hints: ['Para executar um arquivo, digite o caminho dele (use ./ se ele estiver na pasta atual).', '~/trabalho/projetos/publicar-site.sh'],
        check: (run) => ranScript(run, `${WORK}/projetos/publicar-site.sh`)
      }
    ]
  },
  {
    id: 'backup',
    short: 'Backup',
    title: 'Fim do expediente: backup e relatório',
    mentor:
      'Antes de ir para casa, todo profissional de TI faz backup e registra o que fez no dia. Faltam só as últimas tarefas!',
    setup() {
      ensureDirs(`${WORK}/backups`);
      seedFile(`${WORK}/documentos/anotacoes.txt`, 'Reunião às 10h');
    },
    tasks: [
      {
        title: 'Copie a pasta documentos inteira para dentro de backups',
        hints: ['Para copiar uma pasta com tudo o que há dentro, o cp precisa de uma opção.', 'cp -r ~/trabalho/documentos ~/trabalho/backups/'],
        check: () => Object.keys(terminal.fs).some((path) => path.startsWith(`${WORK}/backups/`) && path.endsWith('/anotacoes.txt'))
      },
      {
        title: 'Registre o texto "Backup concluído" no arquivo trabalho/relatorio.txt',
        hints: ['Use echo com >> para acrescentar ao fim do arquivo (ou > para criar um novo).', 'echo "Backup concluído" >> ~/trabalho/relatorio.txt'],
        check: () => Boolean(getNode(`${WORK}/relatorio.txt`)?.content?.toLowerCase().includes('backup'))
      },
      {
        title: 'Confira o conteúdo do relatório',
        hints: ['Use o comando que exibe o conteúdo de um arquivo.', 'cat ~/trabalho/relatorio.txt'],
        check: (run) => ran(run, 'cat') && targets(run, `${WORK}/relatorio.txt`)
      },
      {
        title: 'Encerre o expediente voltando para sua pasta pessoal',
        hints: ['O cd sem nada (ou com ~) leva você para casa.', 'cd ~'],
        check: (run) => ran(run, 'cd') && terminal.cwd === HOME
      }
    ]
  }
];

const careerRanks = [
  { xp: 0, title: 'Estagiário(a) de TI', icon: '🎒' },
  { xp: 100, title: 'Assistente de TI', icon: '🧰' },
  { xp: 250, title: 'Técnico(a) de Suporte', icon: '🛠️' },
  { xp: 400, title: 'Analista Júnior', icon: '💻' },
  { xp: 550, title: 'Sysadmin', icon: '🏆' }
];

const careerBadges = [
  { id: 'primeiro-passo', icon: '👣', title: 'Primeiro passo', description: 'Concluiu a primeira tarefa.' },
  { id: 'chegada', icon: '🪪', title: 'Crachá liberado', description: 'Reconheceu a estação de trabalho.' },
  { id: 'organizacao', icon: '🗂️', title: 'Mestre das pastas', description: 'Montou a estrutura da equipe.' },
  { id: 'faxina', icon: '🧹', title: 'Faxina digital', description: 'Organizou a pasta de downloads.' },
  { id: 'seguranca', icon: '🔐', title: 'Guardião dos dados', description: 'Protegeu arquivos sensíveis.' },
  { id: 'backup', icon: '💾', title: 'Backup em dia', description: 'Fez backup e relatório do dia.' },
  { id: 'sem-dicas', icon: '🧠', title: 'Sem colar', description: 'Concluiu uma etapa sem revelar comandos.' },
  { id: 'funcionario-do-mes', icon: '⭐', title: 'Funcionário(a) do mês', description: 'Concluiu todo o expediente.' }
];

const TASK_XP = 20;
const HINT_PENALTY = 10;
const CHAPTER_BONUS = 50;
const TOTAL_TASKS = careerChapters.reduce((sum, chapter) => sum + chapter.tasks.length, 0);

function createCareerState() {
  return { started: false, finished: false, chapter: 0, task: 0, xp: 0, revealed: {}, badges: [], setupDone: {} };
}

const career = { ...createCareerState(), ...saved.career };
saved.career = career;

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function rankFor(xp) {
  return careerRanks.reduce((current, rank) => (xp >= rank.xp ? rank : current), careerRanks[0]);
}

function taskKey(chapterIndex = career.chapter, taskIndex = career.task) {
  return `${chapterIndex}-${taskIndex}`;
}

function completedTaskCount() {
  if (career.finished) return TOTAL_TASKS;
  return careerChapters.slice(0, career.chapter).reduce((sum, chapter) => sum + chapter.tasks.length, 0) + career.task;
}

const careerToasts = document.getElementById('careerToasts');

function showToast(text, variant = '') {
  if (!careerToasts) return;
  const toast = document.createElement('div');
  toast.className = `career-toast ${variant}`.trim();
  toast.textContent = text;
  careerToasts.append(toast);
  while (careerToasts.children.length > 3) {
    careerToasts.firstElementChild.remove();
  }
  setTimeout(() => toast.remove(), 4200);
}

function ensureChapterSetup() {
  if (career.finished || career.setupDone[career.chapter]) return;
  careerChapters[career.chapter].setup();
  career.setupDone[career.chapter] = true;
  saveTerminal();
}

function addXp(amount, reason) {
  const before = rankFor(career.xp);
  career.xp += amount;
  const after = rankFor(career.xp);
  printHint(`✔ ${reason} (+${amount} XP)`);
  showToast(`+${amount} XP · ${reason}`);
  if (after !== before) {
    printHint(`🎉 Promoção! Agora você é ${after.title}.`);
    showToast(`${after.icon} Promoção! Agora você é ${after.title}`, 'is-rank');
  }
}

function unlockBadge(id) {
  if (career.badges.includes(id)) return;
  const badge = careerBadges.find((item) => item.id === id);
  career.badges.push(id);
  printHint(`🏅 Conquista desbloqueada: ${badge.title}`);
  showToast(`${badge.icon} Conquista: ${badge.title}`, 'is-badge');
}

function announceCurrentTask() {
  if (career.finished) return;
  const chapter = careerChapters[career.chapter];
  if (career.task === 0) {
    printHint(`📋 Etapa ${career.chapter + 1}: ${chapter.title}. ${chapter.mentor}`);
  }
  printHint(`➜ Próxima tarefa: ${chapter.tasks[career.task].title}`);
}

function completeTask() {
  const chapter = careerChapters[career.chapter];
  const task = chapter.tasks[career.task];
  const usedCommandHint = career.revealed[taskKey()] >= 2;
  addXp(usedCommandHint ? TASK_XP - HINT_PENALTY : TASK_XP, `Tarefa concluída: ${task.title}`);
  unlockBadge('primeiro-passo');

  career.task += 1;
  if (career.task < chapter.tasks.length) return;

  addXp(CHAPTER_BONUS, `Etapa concluída: ${chapter.title}`);
  unlockBadge(chapter.id);
  const noCommandHints = chapter.tasks.every((_, index) => !(career.revealed[taskKey(career.chapter, index)] >= 2));
  if (noCommandHints) unlockBadge('sem-dicas');

  career.chapter += 1;
  career.task = 0;
  if (career.chapter >= careerChapters.length) {
    career.finished = true;
    unlockBadge('funcionario-do-mes');
    printHint(`🏁 Expediente concluído! Você terminou o dia como ${rankFor(career.xp).title}, com ${career.xp} XP.`);
  }
}

function checkCareer() {
  if (!career.started || career.finished) return;
  const run = terminal.lastRun;
  let progressed = false;

  // Um comando pode concluir mais de uma tarefa, por exemplo quando o estado já estava pronto.
  while (!career.finished) {
    ensureChapterSetup();
    const task = careerChapters[career.chapter].tasks[career.task];
    if (!task.check(run)) break;
    completeTask();
    progressed = true;
  }

  if (progressed) {
    announceCurrentTask();
    persist();
    renderCareer();
  }
}

function careerOnTerminalReset() {
  career.setupDone = {};
  if (career.started) ensureChapterSetup();
}

function startCareer() {
  career.started = true;
  ensureChapterSetup();
  persist();
  printHint('🏢 Modo carreira iniciado: seu primeiro dia na TechNova começou!');
  announceCurrentTask();
  renderCareer();
  focusTerminal();
}

// Confirmação em dois cliques dentro da própria página: caixas como confirm() podem ser
// bloqueadas quando a página está incorporada em outro site.
function confirmByClickingTwice(button, prompt, action) {
  if (button.dataset.confirming === 'true') {
    clearTimeout(Number(button.dataset.confirmTimer));
    button.dataset.confirming = '';
    button.textContent = button.dataset.originalText;
    action();
    return;
  }
  button.dataset.confirming = 'true';
  button.dataset.originalText = button.textContent;
  button.textContent = prompt;
  button.dataset.confirmTimer = String(
    setTimeout(() => {
      button.dataset.confirming = '';
      button.textContent = button.dataset.originalText;
    }, 4000)
  );
}

function resetCareer() {
  Object.assign(career, createCareerState());
  // Sem limpar o terminal, as pastas da partida anterior concluiriam tarefas sozinhas.
  resetLab();
  updatePracticeProgress({ announce: false });
  updatePrompt();
  saveTerminal();
  renderCareer();
}

function renderCareerHud() {
  const rank = rankFor(career.xp);
  const nextRank = careerRanks.find((item) => item.xp > career.xp);
  document.getElementById('careerRankIcon').textContent = rank.icon;
  document.getElementById('careerRankTitle').textContent = rank.title;
  document.getElementById('careerXp').textContent = `${career.xp} XP`;

  const fill = document.getElementById('careerXpFill');
  const bar = document.getElementById('careerXpBar');
  if (nextRank) {
    const percentage = Math.round(((career.xp - rank.xp) / (nextRank.xp - rank.xp)) * 100);
    fill.style.width = `${percentage}%`;
    bar.setAttribute('aria-valuenow', String(percentage));
    document.getElementById('careerNextRank').textContent = `Faltam ${nextRank.xp - career.xp} XP para ${nextRank.title}`;
  } else {
    fill.style.width = '100%';
    bar.setAttribute('aria-valuenow', '100');
    document.getElementById('careerNextRank').textContent = 'Cargo máximo alcançado!';
  }

  document.getElementById('careerTasks').textContent = `${completedTaskCount()}/${TOTAL_TASKS}`;
  document.getElementById('careerBadgeCount').textContent = `${career.badges.length}/${careerBadges.length}`;
}

function renderCareerTimeline() {
  document.getElementById('careerTimeline').innerHTML = careerChapters
    .map((chapter, index) => {
      const state = career.finished || index < career.chapter ? 'is-done' : index === career.chapter ? 'is-current' : 'is-locked';
      const label = { 'is-done': 'concluída', 'is-current': 'em andamento', 'is-locked': 'bloqueada' }[state];
      return `<li class="${state}"${state === 'is-current' ? ' aria-current="step"' : ''}>
          <span class="timeline-num" aria-hidden="true">${state === 'is-done' ? '✓' : index + 1}</span>
          <span class="timeline-title">${escapeHtml(chapter.short)}</span>
          <span class="visually-hidden">: etapa ${label}</span>
        </li>`;
    })
    .join('');
}

function mentorHtml(text) {
  return `<div class="mentor-msg">
      <span class="mentor-avatar" aria-hidden="true">C</span>
      <div>
        <strong>Carla · Coordenação de TI</strong>
        <p>${escapeHtml(text)}</p>
      </div>
    </div>`;
}

function renderCareerMission() {
  const mission = document.getElementById('careerMission');

  if (career.finished) {
    const rank = rankFor(career.xp);
    mission.innerHTML = `
      <div class="career-finish">
        <span class="career-finish-icon" aria-hidden="true">${rank.icon}</span>
        <p class="goal-label">Expediente concluído</p>
        <h3>Parabéns! Você terminou o dia como ${escapeHtml(rank.title)}.</h3>
        <p>Total: <strong>${career.xp} XP</strong> e <strong>${career.badges.length} de ${careerBadges.length}</strong> conquistas.
        Tente de novo sem revelar comandos para chegar a Sysadmin e ganhar todas as conquistas.</p>
        <button type="button" class="primary-btn" data-career-action="reset">Jogar de novo</button>
      </div>`;
    return;
  }

  const chapter = careerChapters[career.chapter];
  const header = `<p class="goal-label">Etapa ${career.chapter + 1} de ${careerChapters.length}</p>
    <h3 class="career-chapter-title">${escapeHtml(chapter.title)}</h3>
    ${mentorHtml(chapter.mentor)}`;

  if (!career.started) {
    mission.innerHTML = `${header}
      <p class="career-start-text">São ${TOTAL_TASKS} tarefas em ${careerChapters.length} etapas, todas feitas no terminal simulado.
      Cada tarefa vale ${TASK_XP} XP e cada etapa concluída dá mais ${CHAPTER_BONUS} XP de bônus.</p>
      <button type="button" class="primary-btn" data-career-action="start">Começar expediente</button>`;
    return;
  }

  const task = chapter.tasks[career.task];
  const revealed = career.revealed[taskKey()] || 0;
  const taskList = chapter.tasks
    .map((item, index) => {
      const state = index < career.task ? 'is-done' : index === career.task ? 'is-current' : '';
      return `<li class="${state}">${escapeHtml(item.title)}</li>`;
    })
    .join('');

  mission.innerHTML = `${header}
    <ol class="career-tasks">${taskList}</ol>
    <div class="career-current" aria-live="polite">
      <span class="goal-label">Sua tarefa agora (+${revealed >= 2 ? TASK_XP - HINT_PENALTY : TASK_XP} XP)</span>
      <p class="career-current-title">${escapeHtml(task.title)}</p>
      ${revealed >= 1 ? `<p class="career-hint">💡 ${escapeHtml(task.hints[0])}</p>` : ''}
      ${revealed >= 2
        ? `<div class="career-answer"><code>${escapeHtml(task.hints[1])}</code>
            <button type="button" class="mini-btn" data-career-action="fill">Colocar no terminal</button></div>`
        : ''}
      <div class="activity-actions">
        ${revealed < 1 ? '<button type="button" class="mini-btn" data-career-action="hint">💡 Pedir dica (grátis)</button>' : ''}
        ${revealed === 1 ? `<button type="button" class="mini-btn" data-career-action="reveal">🔑 Mostrar comando (−${HINT_PENALTY} XP)</button>` : ''}
        <button type="button" class="mini-btn" data-career-action="terminal">Abrir terminal aqui</button>
      </div>
    </div>`;
}

function renderCareerBadges() {
  document.getElementById('careerBadges').innerHTML = careerBadges
    .map((badge) => {
      const unlocked = career.badges.includes(badge.id);
      return `<li class="badge-item${unlocked ? ' is-unlocked' : ''}">
          <span class="badge-icon" aria-hidden="true">${unlocked ? badge.icon : '🔒'}</span>
          <strong>${escapeHtml(badge.title)}</strong>
          <span>${escapeHtml(badge.description)}</span>
          <span class="visually-hidden">${unlocked ? 'Desbloqueada' : 'Bloqueada'}</span>
        </li>`;
    })
    .join('');
}

function renderCareer() {
  if (!document.getElementById('careerMission')) return;
  renderCareerHud();
  renderCareerTimeline();
  renderCareerMission();
  renderCareerBadges();
}

document.getElementById('carreira')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-career-action]');
  if (!button) return;
  const action = button.dataset.careerAction;

  if (action === 'start') startCareer();
  if (action === 'reset') {
    confirmByClickingTwice(button, 'Clique de novo para recomeçar (XP, conquistas e arquivos do terminal)', resetCareer);
  }
  if (action === 'terminal') {
      focusTerminal();
  }
  if (action === 'hint' || action === 'reveal') {
    career.revealed[taskKey()] = action === 'hint' ? 1 : 2;
    persist();
    renderCareer();
  }
  if (action === 'fill') {
      terminalInput.value = careerChapters[career.chapter].tasks[career.task].hints[1];
    focusTerminal();
  }
});
