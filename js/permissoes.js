'use strict';

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
