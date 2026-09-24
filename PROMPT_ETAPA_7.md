# Prompt para abrir o chat novo — Etapa 7

**Como usar:**

1. Abra um chat **novo e limpo**.
2. Conecte no projeto do GitHub: `taynaves/gerador-cmi-tesouraria`, ramo
   `claude/cmi-comprovante-layout-quo9wg`.
3. Copie **tudo o que está depois da linha divisória** e cole no chat.
4. A seção "O que eu quero agora" já está preenchida com os pedidos do
   teste da Etapa 6. Se quiser mudar algo, mude antes de colar.
5. Modelo e esforço: **Opus, esforço alto**.

---

Olá! Estou retomando a construção do **Gerador de comprovantes para o SIGA**
(até a Etapa 6 ele se chamava "Gerador de CMI") da tesouraria da Piedade (ADM
Coxim-MS, CCB). O projeto vem de outros chats, está em andamento e **já roda
na minha planilha**.

## ANTES DE QUALQUER COISA: atualize a cópia e leia os arquivos

**Primeiro, `git fetch` e `git pull` do ramo** — na Etapa 6 a cópia local
começou atrasada, sem os arquivos que eu mandei ler.

Depois, **abra os arquivos de verdade, com as suas ferramentas de leitura,
antes de escrever uma única linha.** Nesta ordem:

1. `CLAUDE.md` — o que existe hoje, as regras de código e como falar comigo.
2. `docs/15_checkpoint_etapa_6.md` — a última etapa: o que foi feito, os
   defeitos com a causa de cada um, e **a lista do que evitar de antemão**.
3. `docs/14_checkpoint_etapa_5.md` e `docs/13_checkpoint_etapa_4.md` — as
   etapas anteriores. As listas de "o que evitar" deles **continuam valendo**.
4. `docs/01_regras_negocio_ATUAL.md` e `docs/02_mapeamento_dados_ATUAL.md` —
   o estado atual, mapeado do código.
5. `docs/09_pendencias_e_decisoes.md` — o que está em aberto e o que já foi
   decidido. **Não reabra decisão fechada.**
6. O documento do assunto que eu escolher (o índice é `docs/README.md`).
7. E, **antes de mexer em qualquer arquivo de código, leia aquele arquivo
   inteiro** — não um trecho.

Arquivos com `_OLD` no nome são histórico: servem para saber de onde veio uma
decisão, não como especificação.

### Por que eu insisto nisso

Os arquivos são grandes (a tela passa de 3.600 linhas), um HTML do Apps
Script com defeito **abre normalmente e não responde a botão nenhum, sem
mensagem de erro**, e as marcas e invariantes só existem **dentro** dos
arquivos. Um arquivo reconstruído de memória sai plausível e errado — e quem
paga sou eu, colando, testando e colando de novo.

## A regra que vale daqui para a frente

**Cada etapa roda num chat novo e limpo. Cada etapa aprende com todas as
anteriores, e tem de ser melhor do que cada uma delas.** Ao fim desta, faça o
mesmo por quem vier depois: um checkpoint novo e o prompt da etapa seguinte.

## Onde paramos

Estão prontos, colados na minha planilha e funcionando: o layout do
comprovante, a aba Cadastros com a importação, o extenso e a cadeia conta →
PIA → CNPJ → título → cabeçalho, o formulário inteiro (janela e aba inteira),
os PDFs de cada etapa escolhidos numa caixa, o `.md` de recuperação, a aba
Histórico e — da **Etapa 6** — o **relatório mensal** (a lista dos
comprovantes gerados, que conta e não soma) e o **nome novo** (menu
*Tesouraria • CMP p/ SIGA*).

A bancada tem **1.102 conferências** verdes. Rode-as antes de me pedir teste.

## O que eu quero agora: a Etapa 7

Os pedidos que fiz depois de testar a Etapa 6. **A lista inteira, com o que já
foi analisado de cada um, está em `docs/09_pendencias_e_decisoes.md`, seção
6.2** — leia de lá, não daqui. Em resumo:

- **a.** Importar os dados de um comprovante já emitido (escolher o `.md`
  na janela) — para corrigir e para fazer segunda via sem redigitar.
- **b.** "Corrigir um comprovante" vale para qualquer um (o nome já mudou na
  Etapa 6; falta o caminho de trazer os dados dele).
- **c.** Exportar o comprovante sem gerar PDF — menu e botão no rodapé:
  baixar em Excel, salvar planilha do Google na pasta, baixar o `.md`. O
  `.md` tem de poder sair **do que está na aba**, mesmo editada à mão.
- **d.** Todo PDF continua gerando o `.md`.
- **e.** A aba Comprovante editável à mão sem restrição, **exceto o extenso**
  (R7:R8), protegido com aviso.
- **f.** Abrir a pasta dos arquivos: item de menu e botão no formulário (no
  navegador — abrir o Explorador do Windows não é possível numa página web).
- **g.** As bandeiras amarelas numa caixa **só ao gerar**, com ignorar ou
  corrigir por item, "Gerar CMP nº X mesmo assim", "Voltar e corrigir" e
  "Ignorar tudo e gerar"; voltar leva ao 1º campo não ignorado, com a lista
  aberta; os ignorados ficam no rodapé; as marcações somem ao fechar/abrir.
- **h.** Toda faixa abre uma caixa, e a informação fica na faixa depois de
  fechar; o vermelho que impede continua vermelho até resolver.
- **i.** Layout: a seção 2 (origem e destino) à direita da seção 1.
- **j.** Pastas no Drive por tipo, e uma Lixeira: na correção, os arquivos
  que mudaram ganham "OLD" no nome e vão para a Lixeira (a regra já foi
  calculada: PDF de cada etapa refeita + de cada etapa que deixou de
  existir; o `.md` sempre).
- **k.** Nenhuma anotação na aba Comprovante (para "Mostrar notas" não ter o
  que imprimir — a caixa de impressão do Google não é programável).
- **l.** **Um arquivo só por pedido, uma página por etapa** — e, na correção
  de uma etapa só, o arquivo novo traz as páginas que não mudaram, sem
  perdê-las. Cruzado com o Histórico, a Lixeira e o "OLD" (item j). Já está
  medido lá: o Google não junta PDFs (dois caminhos, com custos), e o
  carimbo "Emitido em" faz uma página redesenhada deixar de ser a mesma.

**Antes de construir, me pergunte o que precisar — uma pergunta por
mensagem.**

## Como quero ser conduzido

- **Uma mensagem, um passo** — mas, **quando for me entregar arquivos para
  colar, entregue todos de uma vez**, cada um com o seu passo a passo (link
  do Raw, onde clicar, como conferir que colou inteiro), e o teste depois.
- **Diga exatamente onde clicar.** Não sou programador.
- **Avise antes** de qualquer tela de autorização do Google.
- **Confira o seu próprio trabalho antes de me pedir teste** — e quebre de
  propósito o que acabou de construir, para ver a bancada acusar.
- **Peça para colar só os arquivos que mudaram** (confira no Git).
- **Se eu for testar na aba inteira, lembre-me de reimplantar.**
- **Quando um pedido meu tiver um custo que dá para prever, me diga o custo
  antes de entregar.**
- **Ao terminar cada mensagem, diga qual modelo e qual esforço eu devo
  selecionar** para continuar.

Pode começar — mas comece atualizando e lendo.
