# Linux Lab · Aula 1: primeiros passos no Linux

Página educacional e interativa para uma aula introdutória de Sistemas Operacionais com foco em Linux.

## O que tem na página

- **Videoaula narrada** (tela `videoaula.html`, player em `player.html`): animação com slides, demonstrações do Ubuntu e do terminal, legendas e narração em português pela voz do navegador. Assistir a pelo menos 80% das cenas conta como objetivo da aula.
- **Conteúdo da aula:** o que é um sistema operacional, história e estrutura do Linux, diretórios, caminhos e permissões.
- **Terminal simulado** no navegador, com sistema de arquivos e permissões (`ls`, `cd`, `mkdir`, `touch`, `cat`, `echo`, `cp`, `mv`, `rm`, `chmod`, `man` e outros), com redirecionamento `>` e `>>`, histórico com ↑ ↓ e autocompletar com Tab.
- **Monte a permissão:** quadro interativo que converte `rwx` em número e comando `chmod`.
- **Prática:** atividade guiada, missões do dia a dia e quiz de revisão.
- **Modo carreira:** gamificação de um dia de trabalho em uma empresa de TI fictícia, com XP, cargos e conquistas.
- **Progresso da aula** baseado em objetivos reais: 15 minutos de estudo ativo em cada módulo (o relógio pausa se a aba fica escondida ou a pessoa fica 2 minutos parada) e as práticas de cada um, salvo na conta do aluno.

- **Login:** criar conta, entrar, sair e continuar como visitante. Cada conta tem o próprio progresso, terminal e carreira. Em "Minha conta": alterar nome e senha, baixar e importar backup do progresso e excluir a conta. As contas ficam **somente no navegador** (o site não tem servidor), com a senha guardada só como hash PBKDF2.

## Como usar

Abra o arquivo `index.html` em qualquer navegador. Não precisa instalar nada. O botão no topo de todas as páginas troca entre o **modo claro e o escuro** (a escolha fica salva; sem escolha, vale o tema do sistema).

## Arquivos

A aula é dividida em telas, uma para cada item do menu (Videoaula, Sistema operacional, Linux, Arquivos, Comandos, Permissões, Prática, Carreira e Glossário):

| Página | Conteúdo |
|---|---|
| `index.html` | Abertura, objetivos, progresso da aula e lista de módulos |
| `videoaula.html` | Videoaula narrada, com o player embutido |
| `modulo-1.html` | Sistema operacional |
| `modulo-2.html` | Conhecendo o Linux |
| `modulo-3.html` | Arquivos e diretórios |
| `modulo-4.html` | Comandos do terminal, com terminal simulado |
| `modulo-5.html` | Usuários e permissões |
| `modulo-6.html` | Prática, missões e quiz |
| `modulo-7.html` | Modo carreira |
| `glossario.html` | Glossário |
| `login.html` | Entrar, criar conta ou seguir como visitante |
| `conta.html` | Minha conta: perfil, senha, backup e exclusão |
| `criador.html` | Quem criou o Linux Lab: Henrique de Carvalho Tanaka, com o link do LinkedIn |
| `player.html` | O player da videoaula (usado dentro de `videoaula.html`; também abre sozinho) |

| Pasta | Arquivos |
|---|---|
| `css/` | `estilos.css` (visual e tema claro), `tema-escuro.css` (cores do modo escuro), `conta.css` (login, conta e usuário no cabeçalho) |
| `js/` | `auth.js` (contas e sessão), `usuario.js` (nome no cabeçalho), `login.js`, `conta.js`, `tema.js` (claro/escuro), `nucleo.js` (armazenamento e menu), `videoaula.js`, `quiz.js`, `terminal-arquivos.js` (sistema de arquivos e saída), `terminal-comandos.js` (comandos), `terminal-interface.js` (atividade guiada, histórico e Tab, botões), `permissoes.js`, `carreira.js`, `progresso.js`, `inicio.js` |

O progresso, o terminal e a carreira ficam salvos no navegador e valem em todas as páginas.
