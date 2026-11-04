/* Tema claro/escuro. Carregado no <head> para a página já abrir no tema certo, sem piscar.
 * A escolha do aluno fica salva; sem escolha, vale o tema do sistema. */
(function () {
  'use strict';

  var KEY = 'linux-lab:tema';
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function saved() {
    try {
      var value = localStorage.getItem(KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function current() {
    return saved() || (media.matches ? 'dark' : 'light');
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var color = document.querySelector('meta[name="theme-color"]');
    if (color) color.setAttribute('content', theme === 'dark' ? '#07101a' : '#0d1b2a');

    var button = document.getElementById('themeToggle');
    if (button) {
      var isDark = theme === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Mudar para o modo claro' : 'Mudar para o modo escuro');
      button.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
      button.querySelector('.theme-label').textContent = isDark ? 'Claro' : 'Escuro';
    }
  }

  apply(current());

  document.addEventListener('DOMContentLoaded', function () {
    apply(current());
    var button = document.getElementById('themeToggle');
    if (!button) return;
    button.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch (error) {
        // Sem armazenamento: o tema vale só até recarregar.
      }
      apply(next);
    });
  });

  // Sem escolha salva, acompanha mudanças do sistema.
  media.addEventListener('change', function () {
    if (!saved()) apply(current());
  });

  // Mudança em outra aba.
  window.addEventListener('storage', function (event) {
    if (event.key === KEY) apply(current());
  });
})();
