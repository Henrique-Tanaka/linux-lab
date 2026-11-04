'use strict';

/* ------------------------------------------------------------------
 * Terminal simulado: sistema de arquivos
 * ------------------------------------------------------------------ */

const USER = 'aluno';
const HOSTNAME = 'ubuntu';
const HOME = `/home/${USER}`;
const LAB_DIR = `${HOME}/estudos`;
const BINARY_CONTENT = '(programa binário)';
const FS_VERSION = 2; // aumente ao mudar os arquivos do sistema em createInitialFs

class CommandError extends Error {
  constructor(message, hint) {
    super(message);
    this.hint = hint;
  }
}

function fail(message, hint) {
  throw new CommandError(message, hint);
}

// Como no shell real, um erro em um dos itens não impede os outros; no fim, o comando conta como falho.
function forEachOperand(items, action) {
  let failed = false;
  items.forEach((item) => {
    try {
      action(item);
    } catch (error) {
      if (!(error instanceof CommandError)) throw error;
      printError(error.message);
      if (error.hint) printHint(error.hint);
      failed = true;
    }
  });
  if (failed) throw new CommandError('');
}

function isDotEntry(target) {
  return ['.', '..'].includes(baseNameOf(target.replace(/\/+$/, '') || '/'));
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
    '/bin/bash': fileNode(BINARY_CONTENT, 'root', 'rwxr-xr-x'),
    '/bin/ls': fileNode(BINARY_CONTENT, 'root', 'rwxr-xr-x'),
    '/boot': dirNode(),
    '/dev': dirNode(),
    '/etc': dirNode(),
    '/etc/hostname': fileNode(HOSTNAME, 'root'),
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

// Quem já usou a página tem o terminal antigo salvo: numa versão nova, os arquivos do sistema (do root)
// são atualizados uma vez. Os arquivos do aluno ficam como estão.
if (saved.terminal && saved.terminal.fsVersion !== FS_VERSION) {
  Object.entries(createInitialFs()).forEach(([path, node]) => {
    if (node.owner === 'root') terminal.fs[path] = node;
  });
}

if (!terminal.fs[terminal.cwd]) {
  terminal.cwd = HOME;
}

function saveTerminal() {
  saved.terminal = {
    fsVersion: FS_VERSION,
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
  if (!terminalOutput) return;
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
  return `${USER}@${HOSTNAME}:${displayPath(terminal.cwd)}$`;
}

function updatePrompt() {
  if (terminalPrompt) terminalPrompt.textContent = promptText();
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
