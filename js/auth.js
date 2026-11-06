/* Contas e sessão do Linux Lab.
 * O site é estático (sem servidor), então as contas ficam guardadas só neste navegador:
 * cada conta tem o seu próprio progresso, e a senha nunca é guardada em texto
 * (só um hash PBKDF2 com sal próprio da conta). Carregado no <head>: quem não entrou
 * é levado para a tela de login antes de a página aparecer. */
(function () {
  'use strict';

  var BASE = 'linux-lab:aula-1';
  var ACCOUNTS = 'linux-lab:contas';
  var SESSION = 'linux-lab:sessao';
  var TRIES = 'linux-lab:tentativas';
  var ITERATIONS = 150000;
  var MAX_TRIES = 5;
  var LOCK_MS = 30000;
  var DUMMY_SALT = 'AAAAAAAAAAAAAAAAAAAAAA==';

  /* ---------- armazenamento (pode estar bloqueado: aba anônima, bloqueio de dados) ---------- */

  function store(kind) {
    try {
      return kind === 'session' ? window.sessionStorage : window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function load(kind, key, fallback) {
    try {
      var raw = store(kind).getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function save(kind, key, value) {
    try {
      store(kind).setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function drop(kind, key) {
    try {
      store(kind).removeItem(key);
    } catch (error) {
      // Nada a apagar.
    }
  }

  var available = (function () {
    try {
      var probe = 'linux-lab:teste';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  })();

  function accounts() {
    return load('local', ACCOUNTS, {});
  }

  /* ---------- sessão ---------- */

  function publicUser(account) {
    return { id: account.id, name: account.name, email: account.email, created: account.created };
  }

  function current() {
    var s = load('session', SESSION, null) || load('local', SESSION, null);
    if (!s) return null;
    if (s.guest) return { guest: true, name: 'Visitante' };
    var account = accounts()[s.id];
    return account ? publicUser(account) : null;
  }

  function setSession(value, remember) {
    drop('session', SESSION);
    drop('local', SESSION);
    save(remember ? 'local' : 'session', SESSION, value);
  }

  function storageKey() {
    var user = current();
    return user && !user.guest ? BASE + ':' + user.id : BASE;
  }

  /* ---------- criptografia ---------- */

  function toB64(bytes) {
    var text = '';
    for (var i = 0; i < bytes.length; i += 1) text += String.fromCharCode(bytes[i]);
    return btoa(text);
  }

  function fromB64(text) {
    var raw = atob(text);
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return toB64(crypto.getRandomValues(new Uint8Array(12))).replace(/[^a-zA-Z0-9]/g, 'x');
  }

  async function derive(password, saltB64) {
    if (!window.crypto || !crypto.subtle) {
      throw new Error('Este navegador não oferece criptografia segura. Abra o site em https ou use um navegador atualizado.');
    }
    var key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    var bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: fromB64(saltB64), iterations: ITERATIONS, hash: 'SHA-256' },
      key,
      256
    );
    return toB64(new Uint8Array(bits));
  }

  function sameText(a, b) {
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /* ---------- validações ---------- */

  function normEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function cleanName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ');
  }

  function nameProblem(name) {
    if (name.length < 2) return 'Informe seu nome (pelo menos 2 letras).';
    if (name.length > 60) return 'O nome pode ter no máximo 60 caracteres.';
    return '';
  }

  function emailProblem(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120 ? '' : 'Informe um e-mail válido, como nome@exemplo.com.';
  }

  function passwordProblem(password) {
    if (typeof password !== 'string' || password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
    if (password.length > 100) return 'A senha pode ter no máximo 100 caracteres.';
    if (!/[A-Za-zÀ-ÿ]/.test(password) || !/[0-9]/.test(password)) return 'Use letras e pelo menos um número na senha.';
    return '';
  }

  function findByEmail(email) {
    var all = accounts();
    for (var id in all) {
      if (Object.prototype.hasOwnProperty.call(all, id) && all[id].email === email) return all[id];
    }
    return null;
  }

  /* ---------- ações ---------- */

  function hasGuestData() {
    try {
      return store('local').getItem(BASE) !== null;
    } catch (error) {
      return false;
    }
  }

  async function register(options) {
    var name = cleanName(options.name);
    var email = normEmail(options.email);
    var problem = nameProblem(name) || emailProblem(email) || passwordProblem(options.password);
    if (problem) throw new Error(problem);
    if (!available) throw new Error('O navegador bloqueou o armazenamento do site. Libere os dados do site para criar uma conta.');
    if (findByEmail(email)) throw new Error('Já existe uma conta com este e-mail. Tente entrar.');

    var salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
    var account = { id: newId(), name: name, email: email, salt: salt, hash: await derive(options.password, salt), created: Date.now() };
    var all = accounts();
    all[account.id] = account;
    if (!save('local', ACCOUNTS, all)) throw new Error('Não foi possível salvar a conta neste navegador.');

    if (options.migrate && hasGuestData()) {
      try {
        store('local').setItem(BASE + ':' + account.id, store('local').getItem(BASE));
      } catch (error) {
        // A conta foi criada; só o progresso de visitante não foi copiado.
      }
    }
    setSession({ id: account.id }, options.remember);
    return publicUser(account);
  }

  async function login(emailInput, password, remember) {
    var email = normEmail(emailInput);
    if (emailProblem(email) || !password) throw new Error('Informe o e-mail e a senha.');
    var tries = load('local', TRIES, {});
    var record = tries[email] || { n: 0, until: 0 };
    if (record.until > Date.now()) {
      throw new Error('Muitas tentativas. Aguarde ' + Math.ceil((record.until - Date.now()) / 1000) + ' s e tente de novo.');
    }

    var account = findByEmail(email);
    var ok = false;
    if (account) {
      ok = sameText(await derive(password, account.salt), account.hash);
    } else {
      await derive(password, DUMMY_SALT); // mesmo tempo de resposta, exista a conta ou não
    }
    if (!ok) {
      record.n += 1;
      if (record.n >= MAX_TRIES) {
        record.n = 0;
        record.until = Date.now() + LOCK_MS;
      }
      tries[email] = record;
      save('local', TRIES, tries);
      throw new Error('E-mail ou senha incorretos.');
    }
    delete tries[email];
    save('local', TRIES, tries);
    setSession({ id: account.id }, remember);
    return publicUser(account);
  }

  function enterAsGuest() {
    setSession({ guest: true }, false);
  }

  function logout() {
    drop('session', SESSION);
    drop('local', SESSION);
    location.replace('login.html');
  }

  function ownAccount() {
    var user = current();
    if (!user || user.guest) throw new Error('Entre na sua conta para fazer isso.');
    return { user: user, all: accounts() };
  }

  async function confirmPassword(account, password) {
    if (!sameText(await derive(password || '', account.salt), account.hash)) throw new Error('A senha atual está incorreta.');
  }

  function rename(nameInput) {
    var name = cleanName(nameInput);
    var problem = nameProblem(name);
    if (problem) throw new Error(problem);
    var own = ownAccount();
    own.all[own.user.id].name = name;
    if (!save('local', ACCOUNTS, own.all)) throw new Error('Não foi possível salvar.');
    return name;
  }

  async function changePassword(oldPassword, newPassword) {
    var own = ownAccount();
    var account = own.all[own.user.id];
    await confirmPassword(account, oldPassword);
    var problem = passwordProblem(newPassword);
    if (problem) throw new Error(problem);
    account.salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
    account.hash = await derive(newPassword, account.salt);
    if (!save('local', ACCOUNTS, own.all)) throw new Error('Não foi possível salvar.');
  }

  async function remove(password) {
    var own = ownAccount();
    await confirmPassword(own.all[own.user.id], password);
    delete own.all[own.user.id];
    save('local', ACCOUNTS, own.all);
    drop('local', BASE + ':' + own.user.id);
    drop('local', SESSION);
    drop('session', SESSION);
  }

  /* ---------- backup do progresso (para levar de um aparelho para outro) ---------- */

  function exportData() {
    var user = current();
    var raw = null;
    try {
      raw = store('local').getItem(storageKey());
    } catch (error) {
      raw = null;
    }
    return JSON.stringify(
      {
        app: 'linux-lab',
        versao: 1,
        nome: user ? user.name : '',
        exportadoEm: new Date().toISOString(),
        progresso: raw ? JSON.parse(raw) : {}
      },
      null,
      2
    );
  }

  function importData(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error('Este arquivo não é um backup válido do Linux Lab.');
    }
    if (!data || data.app !== 'linux-lab' || !data.progresso || typeof data.progresso !== 'object' || Array.isArray(data.progresso)) {
      throw new Error('Este arquivo não é um backup válido do Linux Lab.');
    }
    if (!save('local', storageKey(), data.progresso)) throw new Error('Não foi possível salvar o progresso importado.');
  }

  /* ---------- redirecionamento após o login ---------- */

  function safeNext(value) {
    return /^[a-z0-9-]+\.html(#[A-Za-z0-9_-]*)?$/.test(value || '') && value.indexOf('login.html') !== 0 ? value : 'index.html';
  }

  window.Auth = {
    available: available,
    current: current,
    storageKey: storageKey,
    hasGuestData: hasGuestData,
    register: register,
    login: login,
    enterAsGuest: enterAsGuest,
    logout: logout,
    rename: rename,
    changePassword: changePassword,
    remove: remove,
    exportData: exportData,
    importData: importData,
    safeNext: safeNext,
    passwordProblem: passwordProblem,
    emailProblem: emailProblem,
    nameProblem: nameProblem,
    cleanName: cleanName
  };

  /* ---------- porta de entrada ---------- */

  if (available && !document.documentElement.hasAttribute('data-publico') && !current()) {
    document.documentElement.hidden = true; // evita mostrar a página por um instante
    var page = location.pathname.split('/').pop() || 'index.html';
    location.replace('login.html?voltar=' + encodeURIComponent(page + location.hash));
  }
})();
