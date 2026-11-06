'use strict';

/* ------------------------------------------------------------------
 * Minha conta: perfil, senha, backup do progresso e exclusão
 * ------------------------------------------------------------------ */

(function accountPage() {
  const $ = (id) => document.getElementById(id);
  const user = Auth.current();
  if (!user) return;

  if (user.guest) {
    $('areaVisitante').hidden = false;
    return;
  }
  $('areaConta').hidden = false;

  const created = new Date(user.created || Date.now());
  $('contaNome').textContent = user.name;
  $('contaEmail').textContent = user.email;
  $('contaDesde').textContent = created.toLocaleDateString('pt-BR');
  $('perfilNome').value = user.name;

  function say(box, message, isError) {
    box.textContent = message;
    box.hidden = false;
    box.classList.toggle('is-error', Boolean(isError));
    box.classList.toggle('is-ok', !isError);
  }

  async function submit(form, box, action, doneMessage) {
    const button = form.querySelector('button[type="submit"]');
    box.hidden = true;
    button.disabled = true;
    try {
      await action();
      say(box, doneMessage, false);
      return true;
    } catch (error) {
      say(box, error.message || 'Não foi possível concluir.', true);
      return false;
    } finally {
      button.disabled = false;
    }
  }

  $('formPerfil').addEventListener('submit', (event) => {
    event.preventDefault();
    submit($('formPerfil'), $('msgPerfil'), async () => {
      const name = Auth.rename($('perfilNome').value);
      $('contaNome').textContent = name;
      const chip = document.querySelector('.user-name');
      if (chip) chip.textContent = name.split(' ')[0];
    }, 'Nome atualizado.');
  });

  $('formSenha').addEventListener('submit', async (event) => {
    event.preventDefault();
    if ($('senhaNova').value !== $('senhaConfirma').value) {
      say($('msgSenha'), 'As senhas novas não são iguais.', true);
      return;
    }
    const ok = await submit($('formSenha'), $('msgSenha'), () => Auth.changePassword($('senhaAtual').value, $('senhaNova').value), 'Senha alterada.');
    if (ok) $('formSenha').reset();
  });

  $('btnExportar').addEventListener('click', () => {
    const blob = new Blob([Auth.exportData()], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `linux-lab-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    say($('msgBackup'), 'Backup baixado. Guarde o arquivo em um lugar seguro.', false);
  });

  $('arquivoImportar').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('O arquivo é grande demais para ser um backup do Linux Lab.');
      Auth.importData(await file.text());
      storageLocked = true; // a página ainda tem o progresso antigo na memória: não pode regravá-lo por cima do importado
      say($('msgBackup'), 'Progresso importado. Recarregando…', false);
      setTimeout(() => location.reload(), 900);
    } catch (error) {
      say($('msgBackup'), error.message, true);
    }
  });

  $('btnSair').addEventListener('click', () => Auth.logout());

  $('formExcluir').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!$('excluirConfirma').checked) {
      say($('msgExcluir'), 'Marque a caixa para confirmar que entende que não há volta.', true);
      return;
    }
    const ok = await submit($('formExcluir'), $('msgExcluir'), async () => {
      await Auth.remove($('excluirSenha').value);
      storageLocked = true; // evita que o progresso da conta apagada seja regravado
    }, 'Conta excluída. Redirecionando…');
    if (ok) setTimeout(() => location.replace('login.html'), 900);
  });
})();
