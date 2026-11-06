'use strict';

/* ------------------------------------------------------------------
 * Usuário no cabeçalho: nome com acesso à conta, botão de sair e saudação
 * ------------------------------------------------------------------ */

(function showUser() {
  const tools = document.querySelector('.nav-tools');
  const user = Auth.current();
  if (!tools || !user) return;

  if (user.guest) {
    const enter = document.createElement('a');
    enter.className = 'user-chip';
    enter.href = 'login.html';
    enter.textContent = 'Entrar';
    tools.prepend(enter);
    return;
  }

  const firstName = user.name.split(' ')[0];

  const chip = document.createElement('a');
  chip.className = 'user-chip';
  chip.href = 'conta.html';
  chip.title = `Minha conta (${user.email})`;
  chip.setAttribute('aria-label', `Minha conta: ${user.name}`);

  const avatar = document.createElement('span');
  avatar.className = 'user-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = user.name.charAt(0).toUpperCase();

  const label = document.createElement('span');
  label.className = 'user-name';
  label.textContent = firstName;

  chip.append(avatar, label);

  const exit = document.createElement('button');
  exit.type = 'button';
  exit.className = 'user-exit';
  exit.title = 'Sair da conta';
  exit.setAttribute('aria-label', 'Sair da conta');
  exit.textContent = 'Sair';
  exit.addEventListener('click', () => Auth.logout());

  tools.prepend(chip, exit);

  // Saudação na página inicial.
  const eyebrow = document.querySelector('.hero-copy .eyebrow');
  if (eyebrow) {
    const hello = document.createElement('p');
    hello.className = 'welcome';
    hello.textContent = `Olá, ${firstName}! Seu progresso fica salvo na sua conta.`;
    eyebrow.before(hello);
  }
})();
