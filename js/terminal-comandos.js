'use strict';

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

// cp e mv aceitam vários arquivos de origem; nesse caso o último nome precisa ser uma pasta.
function sourcesAndDestination(name, operands) {
  if (operands.length < 2) fail(`${name}: falta o operando arquivo`, `Uso: ${name} origem destino`);
  const destination = operands[operands.length - 1];
  const sources = operands.slice(0, -1);
  if (sources.length > 1 && getNode(resolvePath(destination))?.type !== 'dir') {
    fail(
      `${name}: o destino '${destination}' não é um diretório`,
      'Com vários arquivos de origem, o último nome precisa ser uma pasta que já existe.'
    );
  }
  return { sources, destination };
}

function copyItem(source, destination, recursive) {
  const sourcePath = resolvePath(source);
  const sourceNode = getNode(sourcePath);
  if (!sourceNode) fail(`cp: não foi possível obter estado de '${source}': Arquivo ou diretório inexistente`);
  if (sourceNode.type === 'dir' && !recursive) {
    fail(`cp: -r não especificado; omitindo o diretório '${source}'`, 'Para copiar pastas, use cp -r origem destino');
  }
  if (!can(sourceNode, 'r')) fail(`cp: não foi possível abrir '${source}' para leitura: Permissão negada`);

  const destinationPath = resolveDestination(sourcePath, destination);
  const destinationNode = getNode(destinationPath);
  if (destinationPath === sourcePath) fail(`cp: '${source}' e '${destination}' são o mesmo arquivo`);
  if (destinationPath.startsWith(`${sourcePath}/`)) {
    fail(`cp: não é possível copiar um diretório, '${source}', para dentro dele mesmo`);
  }
  if (destinationNode?.type === 'dir' && sourceNode.type !== 'dir') {
    fail(`cp: não é possível sobrescrever o diretório '${destination}' com um arquivo`);
  }
  if (destinationNode?.type === 'file' && sourceNode.type === 'dir') {
    fail(`cp: não é possível sobrescrever o arquivo '${destination}' com o diretório '${source}'`);
  }
  if (destinationNode?.type === 'file' && !can(destinationNode, 'w')) {
    fail(
      `cp: não foi possível criar o arquivo comum '${destination}': Permissão negada`,
      'O arquivo de destino está protegido contra escrita. Veja as permissões com ls -l.'
    );
  }
  if (!destinationNode) {
    requireWritableParent(destinationPath, (reason) => `cp: não foi possível criar '${destination}': ${reason}`);
  }

  // Pasta copiada sobre pasta existente: o conteúdo é mesclado, como no cp -r real.
  const now = Date.now();
  [sourcePath, ...descendantsOf(sourcePath)].forEach((path) => {
    const node = terminal.fs[path];
    const targetPath = destinationPath + path.slice(sourcePath.length);
    const existing = getNode(targetPath);
    if (existing && existing.type !== node.type) return;
    if (existing?.type === 'dir') {
      existing.mtime = now;
      return;
    }
    terminal.fs[targetPath] = { ...node, owner: USER, mtime: now };
  });
}

function moveItem(source, destination) {
  const sourcePath = resolvePath(source);
  const sourceNode = getNode(sourcePath);
  if (!sourceNode) fail(`mv: não foi possível obter estado de '${source}': Arquivo ou diretório inexistente`);
  if (sourcePath === '/' || sourcePath === HOME || isDotEntry(source)) fail(`mv: não é possível mover '${source}'`);

  const destinationPath = resolveDestination(sourcePath, destination);
  if (destinationPath === sourcePath) return;
  if (destinationPath.startsWith(`${sourcePath}/`)) {
    fail(`mv: não é possível mover '${source}' para um subdiretório de si mesmo`);
  }
  const destinationNode = getNode(destinationPath);
  if (destinationNode?.type === 'dir') {
    fail(`mv: não é possível sobrescrever o diretório '${destination}'`);
  }
  if (destinationNode && sourceNode.type === 'dir') {
    fail(`mv: não é possível sobrescrever o arquivo '${destination}' com o diretório '${source}'`);
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
      const command = Object.hasOwn(commands, name) ? commands[name] : null;
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
      let listed = 0;

      forEachOperand(targets, (target) => {
        const path = resolvePath(target);
        const node = getNode(path);
        if (!node) fail(`ls: não foi possível acessar '${target}': Arquivo ou diretório inexistente`);

        const isFirst = listed === 0;
        listed += 1;

        if (node.type === 'file') {
          print(isLong ? longEntry(target, node) : entryPart(target, node));
          return;
        }
        if (targets.length > 1) {
          if (!isFirst) print('');
          print(`${target}:`);
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
      forEachOperand(operands, (target) => {
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
      forEachOperand(operands, (target) => {
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
      forEachOperand(operands, (target) => {
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
    usage: 'cp [-r] origem... destino',
    description: 'Copia arquivos ou pastas.',
    options: ['-r  copia pastas e todo o seu conteúdo', 'Com vários arquivos de origem, o último nome precisa ser uma pasta.'],
    examples: ['cp resumo.txt resumo-copia.txt', 'cp resumo.txt estudos/', 'cp a.txt b.txt estudos/', 'cp -r estudos estudos-backup'],
    run({ operands, flags }) {
      const { sources, destination } = sourcesAndDestination('cp', operands);
      forEachOperand(sources, (source) => copyItem(source, destination, flags.has('r') || flags.has('R')));
    }
  },
  mv: {
    usage: 'mv origem... destino',
    description: 'Move ou renomeia arquivos e pastas.',
    options: ['Com vários arquivos de origem, o último nome precisa ser uma pasta.'],
    examples: ['mv resumo.txt novo.txt', 'mv novo.txt estudos/', 'mv a.txt b.txt estudos/'],
    run({ operands }) {
      const { sources, destination } = sourcesAndDestination('mv', operands);
      forEachOperand(sources, (source) => moveItem(source, destination));
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
      forEachOperand(operands, (target) => {
        if (isDotEntry(target)) {
          fail(`rm: recusando-se a remover os diretórios '.' ou '..': ignorando '${target}'`, 'Para apagar a pasta atual, saia dela (cd ..) e use rm -r nome-da-pasta.');
        }
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
      forEachOperand(operands, (target) => {
        const path = resolvePath(target);
        const node = getNode(path);
        const message = (reason) => `rmdir: falhou em remover '${target}': ${reason}`;
        if (isDotEntry(target)) fail(message('Argumento inválido'), 'Saia da pasta (cd ..) e use rmdir nome-da-pasta.');
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
      if (!applyMode('---------', modeArg)) fail(`chmod: modo inválido: '${modeArg}'`, 'Exemplos válidos: 644, 755, u+x, g-w, o=r');
      forEachOperand(targets, (target) => {
        const node = getNode(resolvePath(target));
        if (!node) fail(`chmod: não foi possível acessar '${target}': Arquivo ou diretório inexistente`);
        if (node.owner !== USER) {
          fail(`chmod: alterando as permissões de '${target}': Operação não permitida`, 'Somente o dono do arquivo (ou o root) pode mudar as permissões.');
        }
        const next = applyMode(node.mode, modeArg);
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
      terminalOutput?.replaceChildren();
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

// Palavras viram textos; > e >> fora de aspas viram { redirect }, mesmo colados ao texto (echo oi>notas.txt).
function tokenize(input) {
  const tokens = [];
  let current = '';
  let quote = null;
  let started = false;

  const pushWord = () => {
    if (started) tokens.push(current);
    current = '';
    started = false;
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
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
      pushWord();
    } else if (char === '>') {
      pushWord();
      const append = input[index + 1] === '>';
      if (append) index += 1;
      tokens.push({ redirect: append ? '>>' : '>' });
    } else {
      current += char;
      started = true;
    }
  }
  pushWord();
  return tokens;
}

// Como no bash, o arquivo é aberto antes de o comando rodar: > cria ou esvazia, >> só cria se faltar.
function openRedirect(redirect) {
  const { target, append } = redirect;
  redirect.path = resolvePath(target);
  const existing = getNode(redirect.path);
  if (existing?.type === 'dir') fail(`bash: ${target}: É um diretório`);
  if (existing) {
    if (!can(existing, 'w')) fail(`bash: ${target}: Permissão negada`);
    if (!append) {
      existing.content = '';
      existing.mtime = Date.now();
    }
    return;
  }
  requireWritableParent(redirect.path, (reason) => `bash: ${target}: ${reason}`);
  terminal.fs[redirect.path] = fileNode('');
}

function writeRedirect({ path, buffer }) {
  const node = getNode(path);
  if (!buffer.length || node?.type !== 'file') return;
  const text = buffer.join('\n');
  node.content = node.content ? `${node.content}\n${text}` : text;
  node.mtime = Date.now();
}

function runExecutable(name, depth) {
  const path = resolvePath(name);
  const node = getNode(path);
  if (!node) fail(`bash: ${name}: Arquivo ou diretório inexistente`);
  if (node.type === 'dir') fail(`bash: ${name}: É um diretório`);
  if (!can(node, 'x')) {
    fail(`bash: ${name}: Permissão negada`, `O arquivo não tem permissão de execução (x). Tente: chmod +x ${name}`);
  }
  if (node.content === BINARY_CONTENT) {
    // Programas do sistema não são scripts: o simulador só executa pelo nome do comando.
    fail(`bash: ${name}: execução direta de programas do sistema não é simulada`, `Digite apenas o nome do comando, por exemplo: ${baseNameOf(path)}`);
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
    const redirectIndex = tokens.findIndex((token) => typeof token !== 'string');
    if (redirectIndex !== -1) {
      const target = tokens[redirectIndex + 1];
      if (target === undefined) {
        fail("bash: erro de sintaxe próximo ao token inesperado 'newline'", 'Informe o arquivo depois do >, por exemplo: echo oi > notas.txt');
      }
      if (typeof target !== 'string') fail(`bash: erro de sintaxe próximo ao token inesperado '${target.redirect}'`);
      redirect = { target, append: tokens[redirectIndex].redirect === '>>', buffer: [] };
      tokens.splice(redirectIndex, 2);
      if (tokens.some((token) => typeof token !== 'string')) {
        fail('bash: use apenas um > ou >> por comando nesta simulação');
      }
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

    if (redirect) openRedirect(redirect);
    try {
      if (name.includes('/')) {
        runExecutable(name, depth);
      } else {
        const command = Object.hasOwn(commands, name) ? commands[name] : null;
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
    } finally {
      // Mesmo quando o comando falha, o que ele já tinha mostrado vai para o arquivo.
      if (redirect) writeRedirect(redirect);
    }
    runInfo.ok = true;
  } catch (error) {
    if (!(error instanceof CommandError)) throw error;
    if (error.message) printError(error.message);
    if (error.hint) printHint(error.hint);
  }

  if (depth === 0) afterCommand();
}
