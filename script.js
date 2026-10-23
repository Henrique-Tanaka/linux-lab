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

moduleCards.forEach((card) => {
  card.addEventListener('click', () => {
    document.getElementById(card.dataset.module)?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  });
});

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

/* ------------------------------------------------------------------
 * Vídeo: mostra um aviso se o arquivo estiver ausente ou corrompido
 * ------------------------------------------------------------------ */

const lessonVideo = document.getElementById('lessonVideo');
const videoFallback = document.getElementById('videoFallback');

function showVideoFallback() {
  lessonVideo.hidden = true;
  videoFallback.hidden = false;
}

if (lessonVideo && videoFallback) {
  lessonVideo.querySelector('source')?.addEventListener('error', showVideoFallback);
  lessonVideo.addEventListener('error', showVideoFallback);
  lessonVideo.addEventListener('loadedmetadata', () => {
    if (!lessonVideo.duration) showVideoFallback();
  });
  // O erro pode ter acontecido antes de o script começar a escutar.
  window.addEventListener('load', () => {
    if (lessonVideo.error || lessonVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      showVideoFallback();
    }
  });
}

/* ------------------------------------------------------------------
 * Quiz
 * ------------------------------------------------------------------ */

const baseQuestions = [
  {
    question: 'Qual é a função principal do sistema operacional?',
    options: [
      'Controlar a comunicação entre usuário, programas e hardware.',
      'Criar documentos pessoais.',
      'Trocar a internet do computador.',
      'Escolher a cor da interface.'
    ],
    answer: 0,
    explanation: 'O sistema operacional coordena recursos e media a interação entre pessoas, programas e hardware.'
  },
  {
    question: 'Qual parte do Linux gerencia memória, processos e dispositivos?',
    options: ['Kernel', 'Shell', 'Terminal', 'Usuário'],
    answer: 0,
    explanation: 'O kernel é o núcleo do sistema e é responsável por gerenciar os recursos do computador.'
  },
  {
    question: 'Quem iniciou o desenvolvimento do kernel Linux, em 1991?',
    options: ['Linus Torvalds', 'Richard Stallman', 'Bill Gates', 'Steve Jobs'],
    answer: 0,
    explanation: 'Linus Torvalds começou o Linux como projeto pessoal. Richard Stallman fundou o Projeto GNU.'
  },
  {
    question: 'O que significa o diretório /home?',
    options: [
      'Local das pastas pessoais dos usuários.',
      'Diretório dos logs do sistema.',
      'Pasta para arquivos temporários.',
      'Repositório de dados do kernel.'
    ],
    answer: 0,
    explanation: 'No Linux, /home guarda as pastas pessoais de cada usuário, como /home/aluno.'
  },
  {
    question: 'Qual destes é um caminho absoluto?',
    options: ['/home/aluno/Documentos', 'Documentos', '../Documentos', './Documentos'],
    answer: 0,
    explanation: 'Caminhos absolutos começam na raiz (/). Os outros dependem da pasta atual.'
  },
  {
    question: 'Qual comando é usado para criar uma pasta?',
    options: ['mkdir', 'touch', 'cp', 'cat'],
    answer: 0,
    explanation: 'O comando mkdir (make directory) cria diretórios, ou seja, novas pastas.'
  },
  {
    question: 'Qual comando remove uma pasta vazia?',
    options: ['rmdir', 'mkdir', 'touch', 'pwd'],
    answer: 0,
    explanation: 'rmdir remove pastas vazias. Para pastas com conteúdo, usa-se rm -r (com muito cuidado).'
  },
  {
    question: 'Como consultar o manual do comando ls?',
    options: ['man ls', 'help-me ls', 'ls ?', 'sudo ls'],
    answer: 0,
    explanation: 'O comando man abre o manual. Também é possível usar ls --help para um resumo.'
  },
  {
    question: 'O que representa a permissão “x” em arquivos e pastas?',
    options: ['Execução', 'Leitura', 'Escrita', 'Compartilhamento'],
    answer: 0,
    explanation: 'x permite executar um arquivo como programa ou entrar em um diretório.'
  },
  {
    question: 'Um arquivo com permissão rw-r--r-- permite que...',
    options: [
      'o dono leia e escreva; grupo e outros apenas leiam.',
      'todos leiam, escrevam e executem.',
      'apenas o dono leia.',
      'ninguém consiga ler o arquivo.'
    ],
    answer: 0,
    explanation: 'Os três grupos são dono (rw-), grupo (r--) e outros (r--).'
  },
  {
    question: 'O que faz o comando chmod 755 script.sh?',
    options: [
      'Dá rwx ao dono e r-x ao grupo e aos outros.',
      'Apaga o arquivo script.sh.',
      'Deixa o arquivo somente leitura para todos.',
      'Muda o dono do arquivo.'
    ],
    answer: 0,
    explanation: '7 = 4+2+1 (rwx) e 5 = 4+0+1 (r-x). É a permissão típica de scripts e programas.'
  },
  {
    question: 'Para que serve o sudo?',
    options: [
      'Executar um comando com privilégios de administrador (root).',
      'Listar arquivos ocultos.',
      'Desligar o computador.',
      'Criar um usuário automaticamente.'
    ],
    answer: 0,
    explanation: 'sudo executa um único comando como root, depois de confirmar sua senha.'
  }
];

function shuffleArray(items) {
  const clonedItems = [...items];
  for (let index = clonedItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [clonedItems[index], clonedItems[randomIndex]] = [clonedItems[randomIndex], clonedItems[index]];
  }
  return clonedItems;
}

function renderQuiz() {
  const round = shuffleArray(baseQuestions).map((item) => {
    const correctOption = item.options[item.answer];
    const options = shuffleArray(item.options);
    return { ...item, options, answer: options.indexOf(correctOption) };
  });
  const totalQuestions = round.length;
  const best = saved.quizBest;
  let correctAnswers = 0;
  let answeredQuestions = 0;

  quizContainer.innerHTML = `
    <div class="quiz-meta">
      <div class="quiz-score">
        Acertos: <strong>0/${totalQuestions}</strong>
        ${best != null ? `<span class="quiz-best">· Melhor resultado: ${best}/${totalQuestions}</span>` : ''}
      </div>
      <button type="button" class="quiz-reset-btn" id="newQuizRound">Nova rodada</button>
    </div>
    ${round
      .map(
        (item, index) => `
          <article class="quiz-card" data-question-index="${index}">
            <h4 class="question-title">${index + 1}. ${item.question}</h4>
            <ul class="answer-list">
              ${item.options
                .map((option, optionIndex) => `<li><button type="button" data-answer-index="${optionIndex}">${option}</button></li>`)
                .join('')}
            </ul>
            <div class="feedback" aria-live="polite"></div>
          </article>
        `
      )
      .join('')}
  `;

  const scoreLabel = quizContainer.querySelector('.quiz-score strong');

  quizContainer.querySelectorAll('.answer-list button').forEach((button) => {
    button.addEventListener('click', () => {
      const questionCard = button.closest('.quiz-card');
      const question = round[Number(questionCard.dataset.questionIndex)];
      const selectedIndex = Number(button.dataset.answerIndex);
      const buttons = [...questionCard.querySelectorAll('.answer-list button')];
      const feedback = questionCard.querySelector('.feedback');

      buttons.forEach((item) => {
        item.disabled = true;
      });

      const isCorrect = selectedIndex === question.answer;
      buttons[question.answer].classList.add('is-correct');
      if (!isCorrect) button.classList.add('is-wrong');

      if (isCorrect) correctAnswers += 1;
      answeredQuestions += 1;
      scoreLabel.textContent = `${correctAnswers}/${totalQuestions}`;

      feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
      feedback.textContent = `${isCorrect ? 'Correto!' : 'Incorreto.'} ${question.explanation}`;

      if (answeredQuestions === totalQuestions) {
        if (best == null || correctAnswers > best) {
          saved.quizBest = correctAnswers;
          persist();
          evaluateProgress();
        }
        const summary = document.createElement('div');
        summary.className = `feedback ${correctAnswers >= totalQuestions * 0.7 ? 'correct' : 'incorrect'}`;
        summary.setAttribute('role', 'status');
        summary.textContent = correctAnswers >= totalQuestions * 0.7
          ? `Resumo da rodada: você acertou ${correctAnswers} de ${totalQuestions}. Mandou bem!`
          : `Resumo da rodada: você acertou ${correctAnswers} de ${totalQuestions}. Revise as seções e tente uma nova rodada.`;
        quizContainer.appendChild(summary);
      }
    });
  });

  document.getElementById('newQuizRound').addEventListener('click', renderQuiz);
}

renderQuiz();

/* ------------------------------------------------------------------
 * Terminal simulado: sistema de arquivos
 * ------------------------------------------------------------------ */

const USER = 'aluno';
const HOME = `/home/${USER}`;
const LAB_DIR = `${HOME}/estudos`;

class CommandError extends Error {
  constructor(message, hint) {
    super(message);
    this.hint = hint;
  }
}

function fail(message, hint) {
  throw new CommandError(message, hint);
}

function dirNode(owner = 'root', mode = 'rwxr-xr-x') {
  return { type: 'dir', owner, mode, mtime: Date.now() };
}

function fileNode(content = '', owner = USER, mode = 'rw-r--r--') {
  return { type: 'file', owner, mode, content, mtime: Date.now() };
}

function createInitialFs() {
  return {
    '/': dirNode(),
    '/bin': dirNode(),
    '/bin/bash': fileNode('(programa binário)', 'root', 'rwxr-xr-x'),
    '/bin/ls': fileNode('(programa binário)', 'root', 'rwxr-xr-x'),
    '/boot': dirNode(),
    '/dev': dirNode(),
    '/etc': dirNode(),
    '/etc/hostname': fileNode('linux', 'root'),
    '/etc/os-release': fileNode('NAME="Linux Lab"\nVERSION="1.0 (Aula 1)"\nID=linuxlab', 'root'),
    '/home': dirNode(),
    [HOME]: dirNode(USER),
    [`${HOME}/.bashrc`]: fileNode('# Configurações pessoais do shell do usuário aluno'),
    [`${HOME}/boas-vindas.txt`]: fileNode(
      'Bem-vindo ao Linux!\nEste é um arquivo de exemplo para a aula.\nDica: use "ls -l" para ver as permissões.'
    ),
    [`${HOME}/script.sh`]: fileNode(
      '#!/bin/bash\necho "Olá! O script foi executado com sucesso."\necho "Você liberou a permissão de execução (x)."'
    ),
    '/root': dirNode('root', 'rwx------'),
    '/tmp': dirNode('root', 'rwxrwxrwt'),
    '/usr': dirNode(),
    '/var': dirNode(),
    '/var/log': dirNode(),
    '/var/log/syslog': fileNode('kernel: sistema iniciado', 'root', 'rw-r-----')
  };
}

const terminal = {
  fs: saved.terminal?.fs || createInitialFs(),
  cwd: saved.terminal?.cwd || HOME,
  labListed: Boolean(saved.terminal?.labListed),
  labAnnounced: false,
  history: saved.terminal?.history || [],
  historyIndex: null,
  busy: false
};

if (!terminal.fs[terminal.cwd]) {
  terminal.cwd = HOME;
}

function saveTerminal() {
  saved.terminal = {
    fs: terminal.fs,
    cwd: terminal.cwd,
    labListed: terminal.labListed,
    history: terminal.history.slice(-50)
  };
  persist();
}

function getNode(path) {
  return terminal.fs[path];
}

function resolvePath(input = '.') {
  let raw = input;
  if (raw === '~' || raw.startsWith('~/')) {
    raw = HOME + raw.slice(1);
  }
  const base = raw.startsWith('/') ? raw : `${terminal.cwd}/${raw}`;
  const stack = [];
  base.split('/').forEach((segment) => {
    if (!segment || segment === '.') return;
    if (segment === '..') {
      stack.pop();
    } else {
      stack.push(segment);
    }
  });
  return `/${stack.join('/')}`;
}

function parentOf(path) {
  return path === '/' ? '/' : path.slice(0, path.lastIndexOf('/')) || '/';
}

function baseNameOf(path) {
  return path === '/' ? '/' : path.slice(path.lastIndexOf('/') + 1);
}

function joinPath(dir, name) {
  return dir === '/' ? `/${name}` : `${dir}/${name}`;
}

function childrenOf(dir) {
  return Object.keys(terminal.fs)
    .filter((path) => path !== '/' && parentOf(path) === dir)
    .map(baseNameOf)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function descendantsOf(path) {
  const prefix = path === '/' ? '/' : `${path}/`;
  return Object.keys(terminal.fs).filter((key) => key !== path && key.startsWith(prefix));
}

function displayPath(path) {
  if (path === HOME) return '~';
  return path.startsWith(`${HOME}/`) ? `~${path.slice(HOME.length)}` : path;
}

function can(node, permission) {
  const offset = node.owner === USER ? 0 : 6;
  return node.mode[offset + 'rwx'.indexOf(permission)] !== '-';
}

// Garante que o diretório pai existe e aceita escrita; devolve o caminho do pai.
function requireWritableParent(path, makeMessage) {
  const parent = parentOf(path);
  const parentNode = getNode(parent);
  if (!parentNode) fail(makeMessage('Arquivo ou diretório inexistente'));
  if (parentNode.type !== 'dir') fail(makeMessage('Não é um diretório'));
  if (!can(parentNode, 'w')) {
    fail(
      makeMessage('Permissão negada'),
      'Usuários comuns só podem criar ou apagar itens na própria pasta pessoal (~) e em /tmp.'
    );
  }
  return parent;
}

function octalToMode(octal) {
  return [...octal]
    .map((digit) => {
      const value = Number(digit);
      return `${value & 4 ? 'r' : '-'}${value & 2 ? 'w' : '-'}${value & 1 ? 'x' : '-'}`;
    })
    .join('');
}

function modeToOctal(mode) {
  return [0, 3, 6]
    .map((offset) => (mode[offset] !== '-' ? 4 : 0) + (mode[offset + 1] !== '-' ? 2 : 0) + (mode[offset + 2] !== '-' ? 1 : 0))
    .join('');
}

function applyMode(current, spec) {
  if (/^[0-7]{3}$/.test(spec)) {
    return octalToMode(spec);
  }

  const chars = [...current];
  for (const clause of spec.split(',')) {
    const match = clause.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
    if (!match) return null;
    const [, whoRaw, operator, perms] = match;
    const who = !whoRaw || whoRaw.includes('a') ? 'ugo' : whoRaw;
    [...who].forEach((target) => {
      const offset = { u: 0, g: 3, o: 6 }[target];
      ['r', 'w', 'x'].forEach((bit, index) => {
        const listed = perms.includes(bit);
        if (operator === '+' && listed) chars[offset + index] = bit;
        if (operator === '-' && listed) chars[offset + index] = '-';
        if (operator === '=') chars[offset + index] = listed ? bit : '-';
      });
    });
  }
  return chars.join('');
}

/* ------------------------------------------------------------------
 * Terminal simulado: saída
 * ------------------------------------------------------------------ */

// Cada parte é um texto simples ou { text, cls } para colorir. Nunca usa innerHTML,
// então nada que o aluno digite é interpretado como HTML.
function appendLine(parts, className = '') {
  const line = document.createElement('div');
  line.className = `terminal-line ${className}`.trim();
  (Array.isArray(parts) ? parts : [parts]).forEach((part) => {
    if (typeof part === 'string') {
      line.append(part);
    } else {
      const span = document.createElement('span');
      span.className = part.cls;
      span.textContent = part.text;
      line.append(span);
    }
  });
  terminalOutput.append(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function printError(text) {
  appendLine(text, 'is-error');
}

function printHint(text) {
  appendLine(text, 'is-hint');
}

function partsToText(parts) {
  return (Array.isArray(parts) ? parts : [parts]).map((part) => (typeof part === 'string' ? part : part.text)).join('');
}

function promptText() {
  return `${USER}@linux:${displayPath(terminal.cwd)}$`;
}

function updatePrompt() {
  terminalPrompt.textContent = promptText();
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, ' ')} ${time}`;
}

function entryPart(name, node) {
  if (node.type === 'dir') return { text: name, cls: 'term-dir' };
  if (node.mode[2] === 'x') return { text: name, cls: 'term-exec' };
  return name;
}

function longEntry(name, node) {
  const size = node.type === 'dir' ? 4096 : new Blob([node.content]).size;
  const type = node.type === 'dir' ? 'd' : '-';
  return [
    `${type}${node.mode} 1 ${node.owner.padEnd(5)} ${node.owner.padEnd(5)} ${String(size).padStart(5)} ${formatDate(node.mtime)} `,
    entryPart(name, node)
  ];
}

/* ------------------------------------------------------------------
 * Terminal simulado: comandos
 * ------------------------------------------------------------------ */

function resolveDestination(sourcePath, destination) {
  const destinationPath = resolvePath(destination);
  const destinationNode = getNode(destinationPath);
  return destinationNode?.type === 'dir' ? joinPath(destinationPath, baseNameOf(sourcePath)) : destinationPath;
}

function runScript(node, displayName, depth) {
  if (depth > 3) fail(`bash: ${displayName}: muitos níveis de execução`);
  node.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => runLine(line, { echo: false, depth: depth + 1 }));
}

const commands = {
  help: {
    usage: 'help',
    description: 'Mostra os comandos disponíveis.',
    run() {
      appendLine('Comandos disponíveis:');
      Object.entries(commands).forEach(([name, command]) => {
        appendLine([{ text: name.padEnd(9), cls: 'term-cmd' }, command.description]);
      });
      printHint('Use "man comando" ou "comando --help" para detalhes. Para rodar um script: ./script.sh');
      printHint('Atalhos: Tab completa nomes, ↑ e ↓ navegam no histórico.');
    }
  },
  man: {
    usage: 'man comando',
    description: 'Abre o manual de um comando.',
    examples: ['man ls', 'man chmod'],
    run({ operands }) {
      const name = operands[0];
      if (!name) fail('Qual página de manual você deseja?', 'Exemplo: man ls');
      const command = commands[name];
      if (!command) fail(`Nenhuma entrada de manual para ${name}`);
      appendLine({ text: 'NOME', cls: 'term-cmd' });
      appendLine(`    ${name}: ${command.description}`);
      appendLine({ text: 'USO', cls: 'term-cmd' });
      appendLine(`    ${command.usage}`);
      if (command.options) {
        appendLine({ text: 'OPÇÕES', cls: 'term-cmd' });
        command.options.forEach((option) => appendLine(`    ${option}`));
      }
      if (command.examples) {
        appendLine({ text: 'EXEMPLOS', cls: 'term-cmd' });
        command.examples.forEach((example) => appendLine(`    ${example}`));
      }
    }
  },
  pwd: {
    usage: 'pwd',
    description: 'Mostra o caminho do diretório atual.',
    run({ print }) {
      print(terminal.cwd);
    }
  },
  whoami: {
    usage: 'whoami',
    description: 'Mostra o nome do usuário atual.',
    run({ print }) {
      print(USER);
    }
  },
  ls: {
    usage: 'ls [-l] [-a] [caminho]',
    description: 'Lista arquivos e pastas.',
    options: ['-l  formato longo, com permissões, dono e tamanho', '-a  mostra também os arquivos ocultos (que começam com ponto)'],
    examples: ['ls', 'ls -l', 'ls -la ~', 'ls /etc'],
    run({ operands, flags, print }) {
      const targets = operands.length ? operands : ['.'];
      const isLong = flags.has('l');

      targets.forEach((target, targetIndex) => {
        const path = resolvePath(target);
        const node = getNode(path);
        if (!node) fail(`ls: não foi possível acessar '${target}': Arquivo ou diretório inexistente`);

        if (targets.length > 1) {
          if (targetIndex > 0) print('');
          print(`${target}:`);
        }

        if (node.type === 'file') {
          print(isLong ? longEntry(target, node) : entryPart(target, node));
          return;
        }
        if (!can(node, 'r')) fail(`ls: não foi possível abrir o diretório '${target}': Permissão negada`);

        if (path === LAB_DIR && getNode(`${LAB_DIR}/resumo.txt`)) {
          terminal.labListed = true;
        }

        const entries = childrenOf(path)
          .filter((name) => flags.has('a') || !name.startsWith('.'))
          .map((name) => [name, getNode(joinPath(path, name))]);
        if (flags.has('a')) {
          entries.unshift(['.', node], ['..', getNode(parentOf(path))]);
        }

        if (!entries.length) {
          printHint('(diretório vazio)');
          return;
        }
        if (isLong) {
          print(`total ${entries.length}`);
          entries.forEach(([name, entry]) => print(longEntry(name, entry)));
        } else {
          print(entries.flatMap(([name, entry], index) => [...(index ? ['  '] : []), entryPart(name, entry)]));
        }
      });
    }
  },
  cd: {
    usage: 'cd [caminho]',
    description: 'Muda de diretório.',
    examples: ['cd estudos', 'cd ..', 'cd ~', 'cd /etc'],
    run({ operands }) {
      const target = operands[0] || '~';
      const path = resolvePath(target);
      const node = getNode(path);
      if (!node) fail(`bash: cd: ${target}: Arquivo ou diretório inexistente`);
      if (node.type !== 'dir') fail(`bash: cd: ${target}: Não é um diretório`);
      if (!can(node, 'x')) {
        fail(`bash: cd: ${target}: Permissão negada`, `Você é o usuário "${USER}". Só o root pode entrar em ${path}.`);
      }
      terminal.cwd = path;
    }
  },
  mkdir: {
    usage: 'mkdir [-p] nome-da-pasta',
    description: 'Cria uma nova pasta.',
    options: ['-p  cria as pastas intermediárias e não reclama se a pasta já existir'],
    examples: ['mkdir estudos', 'mkdir -p projetos/2026/outubro'],
    run({ operands, flags }) {
      if (!operands.length) fail('mkdir: falta o operando', 'Uso: mkdir nome-da-pasta');
      operands.forEach((target) => {
        const path = resolvePath(target);
        const message = (reason) => `mkdir: não foi possível criar o diretório '${target}': ${reason}`;
        const existing = getNode(path);
        if (existing) {
          if (flags.has('p') && existing.type === 'dir') return;
          fail(message('Arquivo existe'));
        }

        if (!flags.has('p')) {
          requireWritableParent(path, message);
          terminal.fs[path] = dirNode(USER);
          return;
        }

        const missing = [];
        let current = path;
        while (!getNode(current)) {
          missing.unshift(current);
          current = parentOf(current);
        }
        requireWritableParent(missing[0], message);
        missing.forEach((dirPath) => {
          terminal.fs[dirPath] = dirNode(USER);
        });
      });
    }
  },
  touch: {
    usage: 'touch nome-do-arquivo',
    description: 'Cria um arquivo vazio (ou atualiza a data de um existente).',
    examples: ['touch resumo.txt', 'touch estudos/notas.txt'],
    run({ operands }) {
      if (!operands.length) fail('touch: falta o operando arquivo', 'Uso: touch nome-do-arquivo');
      operands.forEach((target) => {
        const path = resolvePath(target);
        const existing = getNode(path);
        if (existing) {
          existing.mtime = Date.now();
          return;
        }
        requireWritableParent(path, (reason) => `touch: não foi possível tocar '${target}': ${reason}`);
        terminal.fs[path] = fileNode('');
      });
    }
  },
  cat: {
    usage: 'cat arquivo',
    description: 'Exibe o conteúdo de um arquivo.',
    examples: ['cat boas-vindas.txt', 'cat /etc/os-release'],
    run({ operands, print }) {
      if (!operands.length) fail('cat: falta o operando arquivo', 'Uso: cat nome-do-arquivo');
      operands.forEach((target) => {
        const node = getNode(resolvePath(target));
        if (!node) fail(`cat: ${target}: Arquivo ou diretório inexistente`);
        if (node.type === 'dir') fail(`cat: ${target}: É um diretório`, 'Para ver o conteúdo de uma pasta, use ls.');
        if (!can(node, 'r')) fail(`cat: ${target}: Permissão negada`, 'Este arquivo só pode ser lido pelo dono ou pelo grupo dele.');
        if (!node.content) {
          printHint(`(${target} está vazio)`);
          return;
        }
        node.content.split('\n').forEach((line) => print(line));
      });
    }
  },
  echo: {
    usage: 'echo texto [> arquivo]',
    description: 'Mostra um texto ou grava em um arquivo.',
    options: ['>   grava o texto no arquivo, substituindo o conteúdo', '>>  acrescenta o texto ao final do arquivo'],
    examples: ['echo Olá', 'echo "Minha primeira nota" > notas.txt', 'echo "Mais uma linha" >> notas.txt'],
    run({ args, print }) {
      print(args.join(' '));
    }
  },
  cp: {
    usage: 'cp [-r] origem destino',
    description: 'Copia arquivos ou pastas.',
    options: ['-r  copia pastas e todo o seu conteúdo'],
    examples: ['cp resumo.txt resumo-copia.txt', 'cp resumo.txt estudos/', 'cp -r estudos estudos-backup'],
    run({ operands, flags }) {
      if (operands.length < 2) fail('cp: falta o operando arquivo', 'Uso: cp origem destino');
      const [source, destination] = operands;
      const sourcePath = resolvePath(source);
      const sourceNode = getNode(sourcePath);
      if (!sourceNode) fail(`cp: não foi possível obter estado de '${source}': Arquivo ou diretório inexistente`);
      if (sourceNode.type === 'dir' && !flags.has('r') && !flags.has('R')) {
        fail(`cp: -r não especificado; omitindo o diretório '${source}'`, 'Para copiar pastas, use cp -r origem destino');
      }
      if (!can(sourceNode, 'r')) fail(`cp: não foi possível abrir '${source}' para leitura: Permissão negada`);

      const destinationPath = resolveDestination(sourcePath, destination);
      if (destinationPath === sourcePath) fail(`cp: '${source}' e '${destination}' são o mesmo arquivo`);
      if (destinationPath.startsWith(`${sourcePath}/`)) {
        fail(`cp: não é possível copiar um diretório, '${source}', para dentro dele mesmo`);
      }
      if (getNode(destinationPath)?.type === 'dir') {
        fail(`cp: não é possível sobrescrever o diretório '${destination}' com um arquivo`);
      }
      requireWritableParent(destinationPath, (reason) => `cp: não foi possível criar '${destination}': ${reason}`);

      const now = Date.now();
      [sourcePath, ...descendantsOf(sourcePath)].forEach((path) => {
        terminal.fs[destinationPath + path.slice(sourcePath.length)] = { ...terminal.fs[path], owner: USER, mtime: now };
      });
    }
  },
  mv: {
    usage: 'mv origem destino',
    description: 'Move ou renomeia arquivos e pastas.',
    examples: ['mv resumo.txt novo.txt', 'mv novo.txt estudos/'],
    run({ operands }) {
      if (operands.length < 2) fail('mv: falta o operando arquivo', 'Uso: mv origem destino');
      const [source, destination] = operands;
      const sourcePath = resolvePath(source);
      if (!getNode(sourcePath)) fail(`mv: não foi possível obter estado de '${source}': Arquivo ou diretório inexistente`);
      if (sourcePath === '/' || sourcePath === HOME) fail(`mv: não é possível mover '${source}'`);

      const destinationPath = resolveDestination(sourcePath, destination);
      if (destinationPath === sourcePath) return;
      if (destinationPath.startsWith(`${sourcePath}/`)) {
        fail(`mv: não é possível mover '${source}' para um subdiretório de si mesmo`);
      }
      if (getNode(destinationPath)?.type === 'dir') {
        fail(`mv: não é possível sobrescrever o diretório '${destination}'`);
      }
      requireWritableParent(sourcePath, (reason) => `mv: não foi possível mover '${source}': ${reason}`);
      requireWritableParent(destinationPath, (reason) => `mv: não foi possível mover para '${destination}': ${reason}`);

      const moved = [sourcePath, ...descendantsOf(sourcePath)].map((path) => [path, terminal.fs[path]]);
      moved.forEach(([path]) => delete terminal.fs[path]);
      moved.forEach(([path, node]) => {
        terminal.fs[destinationPath + path.slice(sourcePath.length)] = node;
      });

      if (terminal.cwd === sourcePath || terminal.cwd.startsWith(`${sourcePath}/`)) {
        terminal.cwd = destinationPath + terminal.cwd.slice(sourcePath.length);
      }
    }
  },
  rm: {
    usage: 'rm [-r] [-f] arquivo',
    description: 'Apaga arquivos (com -r, apaga pastas). Não há lixeira!',
    options: ['-r  apaga pastas e tudo o que há dentro delas', '-f  não reclama de arquivos inexistentes'],
    examples: ['rm resumo-copia.txt', 'rm -r estudos-backup'],
    run({ operands, flags }) {
      if (!operands.length) fail('rm: falta o operando', 'Uso: rm nome-do-arquivo');
      const recursive = flags.has('r') || flags.has('R');
      operands.forEach((target) => {
        const path = resolvePath(target);
        const node = getNode(path);
        if (!node) {
          if (flags.has('f')) return;
          fail(`rm: não foi possível remover '${target}': Arquivo ou diretório inexistente`);
        }
        if (path === '/') {
          fail(`rm: é perigoso operar recursivamente em '/'`, 'Por segurança, o rm se recusa a apagar a raiz do sistema.');
        }
        if (node.type === 'dir' && !recursive) {
          fail(`rm: não foi possível remover '${target}': É um diretório`, 'Use rmdir para pastas vazias ou rm -r para pastas com conteúdo.');
        }
        requireWritableParent(path, (reason) => `rm: não foi possível remover '${target}': ${reason}`);

        [path, ...descendantsOf(path)].forEach((key) => delete terminal.fs[key]);
        if (!getNode(terminal.cwd)) {
          terminal.cwd = parentOf(path);
        }
      });
    }
  },
  rmdir: {
    usage: 'rmdir pasta',
    description: 'Apaga uma pasta vazia.',
    examples: ['rmdir estudos'],
    run({ operands }) {
      if (!operands.length) fail('rmdir: falta o operando', 'Uso: rmdir nome-da-pasta');
      operands.forEach((target) => {
        const path = resolvePath(target);
        const node = getNode(path);
        const message = (reason) => `rmdir: falhou em remover '${target}': ${reason}`;
        if (!node) fail(message('Arquivo ou diretório inexistente'));
        if (node.type !== 'dir') fail(message('Não é um diretório'), 'Para apagar arquivos, use rm.');
        if (childrenOf(path).length) fail(message('Diretório não vazio'), 'Use rm -r para apagar a pasta e tudo o que há dentro dela.');
        requireWritableParent(path, message);
        delete terminal.fs[path];
        if (terminal.cwd === path) terminal.cwd = parentOf(path);
      });
    }
  },
  chmod: {
    usage: 'chmod modo arquivo',
    description: 'Muda as permissões de um arquivo ou pasta.',
    options: ['Números: r=4, w=2, x=1 (ex.: 755, 644, 600)', 'Letras: u (dono), g (grupo), o (outros), a (todos) com + - = (ex.: u+x, g-w, o=r)'],
    examples: ['chmod +x script.sh', 'chmod 644 resumo.txt', 'chmod u=rwx,g=rx,o= script.sh'],
    run({ args }) {
      const [modeArg, ...targets] = args;
      if (!modeArg || !targets.length) fail('chmod: falta o operando', 'Uso: chmod 755 arquivo  ou  chmod +x arquivo');
      targets.forEach((target) => {
        const node = getNode(resolvePath(target));
        if (!node) fail(`chmod: não foi possível acessar '${target}': Arquivo ou diretório inexistente`);
        if (node.owner !== USER) {
          fail(`chmod: alterando as permissões de '${target}': Operação não permitida`, 'Somente o dono do arquivo (ou o root) pode mudar as permissões.');
        }
        const next = applyMode(node.mode, modeArg);
        if (!next) fail(`chmod: modo inválido: '${modeArg}'`, 'Exemplos válidos: 644, 755, u+x, g-w, o=r');
        const previous = node.mode;
        node.mode = next;
        printHint(`${target}: ${previous} → ${next} (${modeToOctal(next)})`);
      });
    }
  },
  bash: {
    usage: 'bash script.sh',
    description: 'Executa um script, mesmo sem permissão x.',
    examples: ['bash script.sh'],
    run({ operands, depth }) {
      const target = operands[0];
      if (!target) fail('bash: informe o script', 'Uso: bash script.sh');
      const node = getNode(resolvePath(target));
      if (!node) fail(`bash: ${target}: Arquivo ou diretório inexistente`);
      if (node.type === 'dir') fail(`bash: ${target}: É um diretório`);
      if (!can(node, 'r')) fail(`bash: ${target}: Permissão negada`);
      runScript(node, target, depth);
    }
  },
  sudo: {
    usage: 'sudo comando',
    description: 'Executaria um comando como administrador (desativado aqui).',
    run({ args }) {
      appendLine(`[sudo] senha para ${USER}:`);
      printHint(
        `Nesta simulação o sudo está desativado. No Linux real, ele executaria "${args.join(' ') || 'o comando'}" como root depois de pedir sua senha.`
      );
    }
  },
  history: {
    usage: 'history',
    description: 'Lista os comandos digitados.',
    run({ print }) {
      terminal.history.forEach((command, index) => print(`${String(index + 1).padStart(4)}  ${command}`));
    }
  },
  clear: {
    usage: 'clear',
    description: 'Limpa a tela do terminal.',
    run() {
      terminalOutput.replaceChildren();
    }
  },
  reset: {
    usage: 'reset',
    description: 'Restaura o ambiente da aula ao estado inicial.',
    run() {
      resetLab();
    }
  }
};

function tokenize(input) {
  const tokens = [];
  let current = '';
  let quote = null;
  let started = false;

  for (const char of input) {
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) {
        tokens.push(current);
        current = '';
        started = false;
      }
    } else {
      current += char;
      started = true;
    }
  }
  if (started) tokens.push(current);
  return tokens;
}

function writeRedirect({ target, append, buffer }) {
  const path = resolvePath(target);
  const existing = getNode(path);
  const text = buffer.join('\n');
  if (existing?.type === 'dir') fail(`bash: ${target}: É um diretório`);
  if (existing) {
    if (!can(existing, 'w')) fail(`bash: ${target}: Permissão negada`);
    existing.content = append && existing.content ? `${existing.content}\n${text}` : text;
    existing.mtime = Date.now();
    return;
  }
  requireWritableParent(path, (reason) => `bash: ${target}: ${reason}`);
  terminal.fs[path] = fileNode(text);
}

function runExecutable(name, depth) {
  const node = getNode(resolvePath(name));
  if (!node) fail(`bash: ${name}: Arquivo ou diretório inexistente`);
  if (node.type === 'dir') fail(`bash: ${name}: É um diretório`);
  if (!can(node, 'x')) {
    fail(`bash: ${name}: Permissão negada`, `O arquivo não tem permissão de execução (x). Tente: chmod +x ${name}`);
  }
  runScript(node, name, depth);
}

function runLine(rawInput, { echo = true, depth = 0, typed = false } = {}) {
  const input = rawInput.trim();
  if (echo) {
    appendLine([{ text: promptText(), cls: 'terminal-prompt' }, ` ${input}`], 'is-command');
  }
  if (!input) return;
  if (echo) terminal.history.push(input);
  if (depth === 0) terminal.lastRun = null;

  try {
    const tokens = tokenize(input);
    let redirect = null;
    const redirectIndex = tokens.findIndex((token) => token === '>' || token === '>>');
    if (redirectIndex !== -1) {
      const target = tokens[redirectIndex + 1];
      if (!target) fail("bash: erro de sintaxe próximo ao token inesperado 'newline'", 'Informe o arquivo depois do >, por exemplo: echo oi > notas.txt');
      redirect = { target, append: tokens[redirectIndex] === '>>', buffer: [] };
      tokens.splice(redirectIndex, 2);
    }

    const [name, ...args] = tokens;
    if (!name) fail('bash: informe um comando antes do >');
    const print = (parts) => {
      if (redirect) {
        redirect.buffer.push(partsToText(parts));
      } else {
        appendLine(parts);
      }
    };

    const flags = new Set();
    const operands = [];
    args.forEach((arg) => {
      if (/^-[a-zA-Z]+$/.test(arg)) {
        [...arg.slice(1)].forEach((flag) => flags.add(flag));
      } else {
        operands.push(arg);
      }
    });

    // Registro do último comando digitado, usado pelo modo carreira para validar tarefas.
    const runInfo = { name, args, flags, operands, typed, ok: false };
    if (depth === 0) terminal.lastRun = runInfo;

    if (name.includes('/')) {
      runExecutable(name, depth);
    } else {
      const command = commands[name];
      if (!command) {
        const hint = getNode(joinPath(terminal.cwd, name))
          ? `Para executar um arquivo da pasta atual, use ./${name}`
          : 'Digite help para ver os comandos disponíveis.';
        fail(`${name}: comando não encontrado`, hint);
      }

      if (args.includes('--help')) {
        appendLine(`Uso: ${command.usage}`);
        appendLine(command.description);
        (command.options || []).forEach((option) => appendLine(`  ${option}`));
      } else {
        command.run({ args, flags, operands, print, depth });
      }
    }

    if (redirect) writeRedirect(redirect);
    runInfo.ok = true;
  } catch (error) {
    if (!(error instanceof CommandError)) throw error;
    printError(error.message);
    if (error.hint) printHint(error.hint);
  }

  if (depth === 0) afterCommand();
}

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

const terminalSlots = [...document.querySelectorAll('[data-terminal-slot]')];

// Há um único terminal; ele "viaja" para a seção onde o aluno está trabalhando.
function mountTerminal(slotName) {
  const slot = terminalSlots.find((item) => item.dataset.terminalSlot === slotName);
  if (!slot) return;
  if (!slot.contains(terminalCard)) {
    slot.append(terminalCard);
  }
  terminalSlots.forEach((item) => item.classList.toggle('is-empty', !item.contains(terminalCard)));
}

function focusTerminal() {
  terminalInput.focus({ preventScroll: true });
  terminalCard.scrollIntoView({ behavior: scrollBehavior, block: 'nearest' });
}

document.querySelectorAll('[data-mount-terminal]').forEach((button) => {
  button.addEventListener('click', () => {
    mountTerminal(button.dataset.mountTerminal);
    focusTerminal();
  });
});

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

terminalInput.addEventListener('keydown', (event) => {
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

terminalForm.addEventListener('submit', (event) => {
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

function slotForButton(button) {
  return button.closest('section[id]')?.id;
}

document.querySelectorAll('[data-command]').forEach((button) => {
  button.addEventListener('click', () => {
    mountTerminal(slotForButton(button));
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
  mountTerminal(slotForButton(button));
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

/* ------------------------------------------------------------------
 * Monte a permissão
 * ------------------------------------------------------------------ */

const permBuilder = document.getElementById('permBuilder');

if (permBuilder) {
  const checkboxes = [...permBuilder.querySelectorAll('input[type="checkbox"]')];
  const groupNames = ['Dono', 'Grupo', 'Outros'];
  const actionNames = { r: 'ler', w: 'escrever', x: 'executar' };

  const findBox = (who, perm) => checkboxes.find((box) => Number(box.dataset.who) === who && box.dataset.perm === perm);

  const renderPermissions = () => {
    const mode = [0, 1, 2]
      .map((who) => ['r', 'w', 'x'].map((perm) => (findBox(who, perm).checked ? perm : '-')).join(''))
      .join('');
    const octal = modeToOctal(mode);

    document.getElementById('permSymbolic').textContent = mode;
    document.getElementById('permOctal').textContent = octal;
    document.getElementById('permCommand').textContent = `chmod ${octal} arquivo.txt`;

    const description = groupNames
      .map((name, who) => {
        const actions = [...mode.slice(who * 3, who * 3 + 3)].filter((char) => char !== '-').map((char) => actionNames[char]);
        return `${name}: ${actions.length ? actions.join(', ') : 'nenhum acesso'}.`;
      })
      .join(' ');
    const warning = mode[7] === 'w' ? ' ⚠ Qualquer pessoa poderá alterar este arquivo: evite dar escrita para “outros”.' : '';

    const explain = document.getElementById('permExplain');
    explain.textContent = description + warning;
    explain.classList.toggle('is-warning', Boolean(warning));
  };

  const markBuilderUsed = () => {
    progress.builderUsed = true;
    evaluateProgress();
  };

  checkboxes.forEach((box) =>
    box.addEventListener('change', () => {
      renderPermissions();
      markBuilderUsed();
    })
  );

  permBuilder.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = octalToMode(button.dataset.preset);
      [0, 1, 2].forEach((who) => {
        ['r', 'w', 'x'].forEach((perm, index) => {
          findBox(who, perm).checked = mode[who * 3 + index] !== '-';
        });
      });
      renderPermissions();
      markBuilderUsed();
    });
  });

  renderPermissions();
}

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
        'Olá! Seja bem-vindo(a) ao time de TI da TechNova.\nSeu primeiro dia terá 5 etapas. Em caso de dúvida, digite help.\nBom trabalho! Carla, coordenação de TI'
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
  mountTerminal('carreira');
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
    mountTerminal('carreira');
    focusTerminal();
  }
  if (action === 'hint' || action === 'reveal') {
    career.revealed[taskKey()] = action === 'hint' ? 1 : 2;
    persist();
    renderCareer();
  }
  if (action === 'fill') {
    mountTerminal('carreira');
    terminalInput.value = careerChapters[career.chapter].tasks[career.task].hints[1];
    focusTerminal();
  }
});

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
  dwell: {},
  seenEnd: {},
  read: [],
  commands: [],
  builderUsed: false,
  done: [],
  celebrated: false,
  ...saved.progress
};
saved.progress = progress;
delete saved.reachedSection; // formato antigo, que media apenas a rolagem da página

const QUIZ_PASS = Math.ceil(baseQuestions.length * 0.7);
const COMMANDS_GOAL = 5;
const IGNORED_COMMANDS = ['help', 'clear', 'reset', 'history'];

const usedCommands = (...names) => names.every((name) => progress.commands.includes(name));

function readObjective(sectionId) {
  return {
    id: `${sectionId}:leitura`,
    label: 'Ler o módulo até o fim',
    check: () => progress.read.includes(sectionId),
    detail: () => readingDetail(sectionId)
  };
}

const lessonModules = [
  {
    id: 'sistema-operacional',
    title: 'Sistema operacional',
    objectives: [readObjective('sistema-operacional')]
  },
  {
    id: 'linux',
    title: 'Conhecendo o Linux',
    objectives: [readObjective('linux')]
  },
  {
    id: 'arquivos',
    title: 'Arquivos e diretórios',
    objectives: [
      readObjective('arquivos'),
      {
        id: 'arquivos:navegar',
        label: 'Digitar cd e ls no terminal para navegar pelas pastas',
        target: 'comandos',
        check: () => usedCommands('cd', 'ls')
      }
    ]
  },
  {
    id: 'comandos',
    title: 'Comandos do terminal',
    objectives: [
      readObjective('comandos'),
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
      readObjective('usuarios'),
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
      }
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
      }
    ]
  }
];

lessonModules.forEach((module, index) => {
  module.number = index + 1;
  module.objectives.forEach((objective) => {
    objective.module = module;
  });
});

const allObjectives = lessonModules.flatMap((module) => module.objectives);
const readingIds = lessonModules.filter((module) => module.objectives.some((o) => o.id.endsWith(':leitura'))).map((m) => m.id);
const isDone = (objective) => progress.done.includes(objective.id);

// O tempo mínimo de leitura cresce com o tamanho do texto. É generoso (20 palavras por segundo):
// serve só para impedir que a seção conte como lida com uma rolagem rápida.
const requiredReadSeconds = {};
readingIds.forEach((id) => {
  const words = (document.getElementById(id)?.textContent || '').split(/\s+/).filter(Boolean).length;
  requiredReadSeconds[id] = Math.min(40, Math.max(10, Math.round(words / 20)));
});

function readingDetail(id) {
  if (progress.read.includes(id)) return '';
  const required = requiredReadSeconds[id];
  const spent = Math.min(required, progress.dwell[id] || 0);
  const parts = [`${spent}s de ${required}s de leitura`];
  if (!progress.seenEnd[id]) parts.push('role até o fim da seção');
  return parts.join(' · ');
}

function refreshReadState() {
  readingIds.forEach((id) => {
    if (progress.read.includes(id)) return;
    if (progress.seenEnd[id] && (progress.dwell[id] || 0) >= requiredReadSeconds[id]) {
      progress.read.push(id);
    }
  });
}

function recordCommandUse() {
  const run = terminal.lastRun;
  if (!run?.ok || !run.typed || !commands[run.name] || IGNORED_COMMANDS.includes(run.name)) return;
  if (!progress.commands.includes(run.name)) {
    progress.commands.push(run.name);
  }
}

function moduleState(module) {
  const done = module.objectives.filter(isDone).length;
  const total = module.objectives.length;
  const started = done > 0 || module.objectives.some((o) => o.id.endsWith(':leitura') && progress.dwell[module.id]);
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

function renderProgress() {
  const doneCount = allObjectives.filter(isDone).length;
  const total = allObjectives.length;
  const percent = Math.round((doneCount / total) * 100);

  document.getElementById('courseProgressFill').style.width = `${percent}%`;
  document.getElementById('courseProgressBar').setAttribute('aria-valuenow', String(percent));
  document.getElementById('courseProgressPercent').textContent = `${percent}%`;
  document.getElementById('headerProgress').textContent = `${percent}%`;
  document.getElementById('courseProgressText').textContent = doneCount
    ? `${doneCount} de ${total} objetivos concluídos`
    : `Nenhum dos ${total} objetivos concluído ainda`;

  const nextStep = document.getElementById('courseNextStep');
  const heroStart = document.getElementById('heroStart');
  const next = nextObjective();
  if (next) {
    nextStep.href = `#${next.target || next.module.id}`;
    nextStep.textContent = `${doneCount ? 'Continuar' : 'Começar'}: Módulo ${next.module.number} · ${next.label}`;
    nextStep.classList.remove('is-done');
    heroStart.href = nextStep.getAttribute('href');
    heroStart.textContent = doneCount ? 'Continuar a aula' : 'Começar a aula';
  } else {
    nextStep.href = '#glossario';
    nextStep.textContent = '🎓 Aula concluída! Revisar o glossário';
    nextStep.classList.add('is-done');
    heroStart.href = '#modulos';
    heroStart.textContent = 'Revisar os módulos';
  }

  setHtml(
    document.getElementById('courseChecklist'),
    lessonModules
      .map((module) => {
        const state = moduleState(module);
        return `<li class="${state.complete ? 'is-complete' : ''}">
            <div class="checklist-head">
              <span>Módulo ${module.number} · ${escapeHtml(module.title)}</span>
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
  refreshReadState();
  const newly = allObjectives.filter((objective) => !isDone(objective) && objective.check());
  newly.forEach((objective) => progress.done.push(objective.id));

  if (newly.length) {
    persist();
    if (announce) {
      newly.forEach((objective) => showToast(`✔ Módulo ${objective.module.number}: ${objective.label}`, 'is-progress'));
      newly
        .map((objective) => objective.module)
        .filter((module, index, list) => list.indexOf(module) === index && moduleState(module).complete)
        .forEach((module) => showToast(`📘 Módulo ${module.number} concluído: ${module.title}`, 'is-badge'));
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
      box.setAttribute('aria-label', `Objetivos do módulo ${module.number}`);
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

/* Posição de leitura: barra do topo, menu e cartão "você está aqui" */

const menuLinks = [...mainMenu.querySelectorAll('a[href^="#"]')];
const pageSections = [...document.querySelectorAll('main section[id]')];

function currentSectionId() {
  const probe = window.innerHeight * 0.4;
  const section = pageSections.find((item) => {
    const rect = item.getBoundingClientRect();
    return rect.top <= probe && rect.bottom > probe;
  });
  return section?.id || null;
}

function updateScrollState() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;

  const current = currentSectionId();
  menuLinks.forEach((link) => {
    const isCurrent = link.getAttribute('href') === `#${current}`;
    link.classList.toggle('is-active', isCurrent);
    if (isCurrent) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
  moduleCards.forEach((card) => card.classList.toggle('is-here', card.dataset.module === current));

  let reachedEnd = false;
  readingIds.forEach((id) => {
    if (progress.seenEnd[id]) return;
    const rect = document.getElementById(id).getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom <= window.innerHeight + 40) {
      progress.seenEnd[id] = true;
      reachedEnd = true;
    }
  });
  if (reachedEnd) {
    persist();
    evaluateProgress();
  }
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

// A seção "sendo lida" é a que ocupa mais espaço visível na tela. Assim o fim de seções curtas
// continua contando, mesmo quando o centro da tela já entrou na seção seguinte.
function mostVisibleSectionId() {
  let best = null;
  let bestVisible = 0;
  pageSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    if (visible > bestVisible) {
      bestVisible = visible;
      best = section.id;
    }
  });
  return best;
}

// Conta o tempo de leitura, só com a aba visível.
let readingTicks = 0;
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  updateScrollState();
  const id = mostVisibleSectionId();
  if (!readingIds.includes(id) || progress.read.includes(id)) return;
  progress.dwell[id] = (progress.dwell[id] || 0) + 1;
  readingTicks += 1;
  if (readingTicks % 5 === 0) persist();
  evaluateProgress();
}, 1000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist();
});

/* ------------------------------------------------------------------
 * Inicialização
 * ------------------------------------------------------------------ */

mountTerminal('comandos');
updatePrompt();
updatePracticeProgress({ announce: false });
updateScenarioStates();
renderCareer();
buildProgressUi();
evaluateProgress({ announce: false });
updateScrollState();
