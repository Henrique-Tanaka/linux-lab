'use strict';

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
  if (!quizContainer) return;
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
