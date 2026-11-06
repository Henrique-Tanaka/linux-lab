'use strict';

/* ------------------------------------------------------------------
 * Tela de login: entrar, criar conta ou continuar como visitante
 * ------------------------------------------------------------------ */

(function loginPage() {
  const $ = (id) => document.getElementById(id);
  const next = Auth.safeNext(new URLSearchParams(location.search).get('voltar'));
  const goOn = () => location.replace(next);

  const tabs = { entrar: $('tabEntrar'), criar: $('tabCriar') };
  const forms = { entrar: $('formEntrar'), criar: $('formCriar') };

  function showTab(name) {
    Object.keys(tabs).forEach((key) => {
      const active = key === name;
      tabs[key].setAttribute('aria-selected', String(active));
      tabs[key].tabIndex = active ? 0 : -1;
      forms[key].hidden = !active;
    });
    $('titulo-form').textContent = name === 'entrar' ? 'Entrar na sua conta' : 'Criar uma conta';
    forms[name].querySelector('input').focus();
  }

  tabs.entrar.addEventListener('click', () => showTab('entrar'));
  tabs.criar.addEventListener('click', () => showTab('criar'));
  [tabs.entrar, tabs.criar].forEach((tab) =>
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const other = tab === tabs.entrar ? 'criar' : 'entrar';
        showTab(other);
        tabs[other].focus();
      }
    })
  );

  /* Já conectado: oferece continuar ou trocar de conta. */
  const user = Auth.current();
  if (user && !user.guest) {
    $('jaConectado').hidden = false;
    $('jaConectadoNome').textContent = user.name;
    $('formulariosArea').hidden = true;
    $('btnContinuar').addEventListener('click', goOn);
    $('btnTrocar').addEventListener('click', () => {
      Auth.logout();
    });
    return;
  }

  if (!Auth.available) {
    $('erroGeral').textContent = 'O navegador está bloqueando o armazenamento do site, então não dá para criar ou usar contas. Libere os dados do site ou use outro navegador. Você ainda pode seguir como visitante.';
    $('erroGeral').hidden = false;
  }

  /* Mostrar e ocultar senha */
  document.querySelectorAll('.toggle-senha').forEach((button) => {
    button.addEventListener('click', () => {
      const input = $(button.dataset.alvo);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? 'Ocultar' : 'Mostrar';
      button.setAttribute('aria-pressed', String(show));
      input.focus();
    });
  });

  /* Medidor de força da senha */
  const meter = $('forcaBarra');
  const meterText = $('forcaTexto');
  $('criarSenha').addEventListener('input', (event) => {
    const p = event.target.value;
    let score = 0;
    if (p.length >= 8) score += 1;
    if (p.length >= 12) score += 1;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    const level = !p ? 0 : score <= 2 ? 1 : score === 3 ? 2 : 3;
    meter.dataset.nivel = String(level);
    meterText.textContent = ['', 'Fraca', 'Boa', 'Forte'][level];
  });

  if (Auth.hasGuestData()) $('migrarArea').hidden = false;

  function fail(box, message) {
    box.textContent = message;
    box.hidden = false;
  }

  async function run(form, box, action) {
    const button = form.querySelector('button[type="submit"]');
    box.hidden = true;
    button.disabled = true;
    const label = button.textContent;
    button.textContent = 'Aguarde…';
    try {
      await action();
      goOn();
    } catch (error) {
      fail(box, error.message || 'Não foi possível concluir. Tente de novo.');
      button.disabled = false;
      button.textContent = label;
    }
  }

  forms.entrar.addEventListener('submit', (event) => {
    event.preventDefault();
    run(forms.entrar, $('erroEntrar'), () => Auth.login($('entrarEmail').value, $('entrarSenha').value, $('entrarLembrar').checked));
  });

  forms.criar.addEventListener('submit', (event) => {
    event.preventDefault();
    const box = $('erroCriar');
    if ($('criarSenha').value !== $('criarConfirma').value) {
      fail(box, 'As senhas não são iguais.');
      return;
    }
    run(forms.criar, box, () =>
      Auth.register({
        name: $('criarNome').value,
        email: $('criarEmail').value,
        password: $('criarSenha').value,
        remember: $('criarLembrar').checked,
        migrate: !$('migrarArea').hidden && $('criarMigrar').checked
      })
    );
  });

  $('btnVisitante').addEventListener('click', () => {
    Auth.enterAsGuest();
    goOn();
  });

  showTab(new URLSearchParams(location.search).get('criar') === '1' ? 'criar' : 'entrar');
})();
