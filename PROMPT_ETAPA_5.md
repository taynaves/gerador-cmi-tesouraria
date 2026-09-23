# Prompt para abrir o chat novo — Etapa 5

**Como usar:**

1. Abra um chat **novo e limpo**.
2. Conecte no projeto do GitHub: `taynaves/gerador-cmi-tesouraria`, ramo
   `claude/cmi-comprovante-layout-quo9wg`.
3. Copie **tudo o que está depois da linha divisória** e cole no chat.
4. Modelo e esforço: **Opus 5, esforço alto**.

---

Olá! Estou retomando a construção do **Gerador de Comprovantes de Movimentação
Interna (CMI)** da tesouraria da Piedade (ADM Coxim-MS, CCB). O projeto vem de
outros chats, está em andamento e **já roda na minha planilha**.

## ANTES DE QUALQUER COISA: abra os arquivos do repositório e leia

Este é o primeiro pedido, e ele não é formalidade. **Abra os arquivos de
verdade, com as suas ferramentas de leitura, antes de escrever uma única
linha.** Nesta ordem:

1. `CLAUDE.md` — como conduzir o projeto e como falar comigo.
2. `docs/13_checkpoint_etapa_4.md` — o checkpoint: a história, os defeitos já
   pagos com a causa de cada um, a lista do que evitar de antemão, e a regra
   do negócio inteira.
3. `docs/00_estado_do_projeto.md` — o ponto de retomada.
4. `docs/09_pendencias_e_decisoes.md` — o que ficou em aberto e o que já foi
   decidido (não reabra decisão fechada).
5. E, **antes de mexer em qualquer arquivo de código, leia aquele arquivo
   inteiro** — não um trecho.

### Por que eu estou insistindo nisso

No começo desta etapa isso não foi feito, e custou caro. O assistente
trabalhou a partir do que eu colava no chat e do que ele lembrava, em vez de
abrir os arquivos que estão no repositório. O resultado foi um arquivo
**plausível e errado**, e o estrago tem um formato específico que você precisa
conhecer:

- **os arquivos são grandes** — a tela do formulário tem mais de 3.400 linhas,
  e três dos `.gs` passam de 900. Nenhuma memória reconstrói isso; o que sai é
  parecido, e parecido aqui é pior do que faltando;
- **o erro não aparece.** Um HTML do Apps Script com defeito **abre
  normalmente e não responde a botão nenhum, sem mensagem de erro**. Eu colo o
  arquivo, a janela abre, nada funciona, e ninguém sabe por quê;
- **o sistema tem marcas e invariantes que só existem dentro dos arquivos** —
  uma linha que o servidor procura para saber que o arquivo chegou inteiro,
  uma marca onde as regras são injetadas, dois números de versão que têm de
  casar. Quem não leu, apaga sem saber que apagou;
- **e o custo cai em cima de mim.** Eu colo um arquivo por mensagem, à mão. Um
  arquivo reconstruído de memória me faz colar, testar, relatar e colar de
  novo — e o defeito costuma aparecer três telas depois da causa.

Então, por favor: **ler primeiro, sempre.** E, se em algum momento você não
tiver certeza do que está num arquivo, abra e olhe em vez de deduzir.

## A regra que vale daqui para a frente

**Cada etapa roda num chat novo e limpo. Cada etapa aprende com todas as
anteriores, e tem de ser melhor do que cada uma delas.**

O checkpoint existe para isso: ele passa a experiência adiante. A seção "o que
evitar de antemão" é a primeira coisa a ler e a última a conferir antes de me
entregar qualquer coisa.

E, ao fim desta etapa, **faça o mesmo por quem vier depois**: um checkpoint
novo, com a história, os defeitos com causa, o que evitar, e o prompt da etapa
seguinte.

## Onde paramos

Estão prontos, colados na minha planilha e funcionando:

- **Etapa 1** — o layout da aba Comprovante, aprovado contra o comprovante do
  SIGA;
- **Etapa 2** — a aba Cadastros, com as 11 listas e a janela de importação;
- **Etapa 3** — extenso, soma do lote, e a cadeia conta → PIA → CNPJ → título →
  cabeçalho;
- **Etapa 4** — o formulário inteiro, em janela e em **aba inteira** (publicada
  como App da Web), com filtro-ao-digitar, lote, Referência travada, as regras
  entre contas, a caixa de diálogo de resultado e a cópia do comprovante em
  Excel ou planilha do Google;
- **Etapa 5, primeira parte** — o PDF já sai por código, em uma folha, com
  margens e escala fixas.

A bancada tem **851 conferências** verdes. Rode-as antes de me pedir teste — o
checkpoint explica quais são e o que cada uma prova.

## O que eu quero agora: a Etapa 5

1. **Gerar os 2 ou 3 PDFs de uma vez**, um por etapa (`APROVADA → EFETIVADA`,
   ou `APROVADA → PAGA → RECEBIDA`), cada um com o Status certo já preenchido
   e o nome de arquivo identificando a etapa. Hoje sai um por clique.
2. **Trocar o cabeçalho institucional no PDF de Recebimento** quando origem e
   destino forem de ADMs diferentes — é quem produz o documento que decide o
   cabeçalho.
3. **Salvar, ao lado de cada PDF, o arquivo `.md` de recuperação** com os dados
   que o originaram, nomeado pela Referência.
4. **Gravar no Histórico** o que foi emitido.

O checkpoint descreve a regra das 2 ou 3 etapas inteira, inclusive a exceção do
cabeçalho. Não a deduza de novo: ela já foi validada comigo.

## Como quero ser conduzido

Está no `CLAUDE.md`, mas reforço porque é o que faz o projeto andar:

- **Uma mensagem, um passo.** Peça uma ação, espere eu confirmar, só então vá
  para a próxima. Não me dê dez passos de uma vez.
- **Diga exatamente onde clicar** ("Extensões → Apps Script", e não "abra o
  editor"). Não sou programador.
- **Avise antes** de qualquer tela de autorização do Google, dizendo o que vai
  aparecer, para eu não abortar achando que é erro.
- **Confira o seu próprio trabalho antes de me pedir teste.**
- **Antes de me pedir para colar um arquivo, confira no histórico do Git quais
  arquivos realmente mudaram** e peça só esses.
- **Se eu mexer no script e for testar na aba inteira, lembre-me de
  reimplantar** — o endereço `/exec` serve uma fotografia do código, e sem
  reimplantar a aba continua com a versão velha, calada.
- **Quando um pedido meu tiver um custo que dá para prever, me diga o custo
  antes de entregar.**
- **Ao terminar cada mensagem, diga qual modelo e qual esforço eu devo
  selecionar** para continuar.

Pode começar — mas comece lendo.
