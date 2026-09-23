# Prompt para abrir o chat novo — Etapa 6

**Como usar:**

1. Abra um chat **novo e limpo**.
2. Conecte no projeto do GitHub: `taynaves/gerador-cmi-tesouraria`, ramo
   `claude/cmi-comprovante-layout-quo9wg`.
3. Copie **tudo o que está depois da linha divisória** e cole no chat.
4. Modelo e esforço: **Opus, esforço alto**.

---

Olá! Estou retomando a construção do **Gerador de Comprovantes de Movimentação
Interna (CMI)** da tesouraria da Piedade (ADM Coxim-MS, CCB). O projeto vem de
outros chats, está em andamento e **já roda na minha planilha**.

## ANTES DE QUALQUER COISA: abra os arquivos do repositório e leia

Não é formalidade. **Abra os arquivos de verdade, com as suas ferramentas de
leitura, antes de escrever uma única linha.** Nesta ordem:

1. `CLAUDE.md` — o que existe hoje, as regras de código e como falar comigo.
2. `docs/14_checkpoint_etapa_5.md` — a última etapa: o que foi feito, os
   defeitos com a causa de cada um, e **a lista do que evitar de antemão**.
3. `docs/13_checkpoint_etapa_4.md` — a etapa anterior, com a regra do negócio
   inteira até ali. A lista de "o que evitar" dele **continua valendo**.
4. `docs/01_regras_negocio_ATUAL.md` e `docs/02_mapeamento_dados_ATUAL.md` —
   o estado atual, mapeado do código.
5. `docs/07_gerar_pdf.md`, seções 5, 5b e 5c — os PDFs, o arquivo de
   recuperação e **a aba Histórico**, que é a matéria-prima desta etapa.
6. `docs/09_pendencias_e_decisoes.md` — o que está em aberto e o que já foi
   decidido. **Não reabra decisão fechada.**
7. E, **antes de mexer em qualquer arquivo de código, leia aquele arquivo
   inteiro** — não um trecho.

Arquivos com `_OLD` no nome são histórico: servem para saber de onde veio uma
decisão, não como especificação.

### Por que eu insisto nisso

Os arquivos são grandes (a tela passa de 3.700 linhas), um HTML do Apps
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
e — da **Etapa 5** — os PDFs de cada etapa escolhidos numa caixa, o cabeçalho
do Recebimento, o arquivo `.md` de recuperação e a **aba Histórico**, com uma
linha por PDF emitido.

A bancada tem **965 conferências** verdes. Rode-as antes de me pedir teste.

## O que eu quero agora: a Etapa 6 — o relatório mensal

Um resumo **por mês e por conta**, a partir da aba Histórico, para
**conferência com o extrato** e **apoio ao Conselho Fiscal**.

**Antes de construir, me pergunte o que precisar — uma pergunta por
mensagem.** O formato não foi decidido ainda: onde o relatório aparece (aba
na planilha, PDF, os dois), o que cada linha mostra, como escolho o mês.

### A armadilha que você precisa conhecer antes de somar qualquer coisa

**O Histórico tem uma linha POR PDF, e não por movimentação.** Uma
transferência entre PIAs gera até três linhas (APROVADA, PAGA, RECEBIDA), com
o mesmo valor. E a mesma Referência pode aparecer de novo numa **correção**
(o comprovante saiu errado e foi refeito) ou numa **segunda via**
(reimpressão). Somar a coluna Valor direto conta o mesmo dinheiro duas, três
ou mais vezes. A coluna **"Como saiu o número"** diz de onde veio cada linha,
e a **"Etapa nº"** diz qual documento é. Decida comigo como contar cada
movimentação **uma vez só** antes de escrever a soma — e prove com a bancada.

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

Pode começar — mas comece lendo.
