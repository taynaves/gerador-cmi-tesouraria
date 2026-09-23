> **ARQUIVO HISTÓRICO.** Ele conta como o projeto estava quando foi escrito,
> e é guardado por isso. **Não é o estado de hoje** — para o que vale agora,
> veja `docs/00_estado_do_projeto.md`, `docs/13_checkpoint_etapa_4.md` e
> `PROMPT_ETAPA_5.md`.

# Prompt para abrir o chat novo — Etapa 4, o formulário

**Como usar:**

1. Abra um chat novo.
2. Conecte no projeto do GitHub: `taynaves/gerador-cmi-tesouraria`, ramo
   `claude/cmi-comprovante-layout-quo9wg`.
3. Copie **tudo o que está depois da linha divisória** abaixo e cole no chat.
4. Modelo e esforço para esta etapa: **Opus, esforço alto**.

Não precisa explicar mais nada — o arquivo de estado conta o resto.

---

Olá! Estou retomando a construção do **Gerador de Comprovantes de Movimentação
Interna (CMI)** da tesouraria da Piedade (ADM Coxim-MS, CCB). O projeto já está
em andamento e vem de outro chat.

**Antes de qualquer coisa, leia nesta ordem:**

1. `docs/00_estado_do_projeto.md` — é o ponto de retomada: o que já existe, as
   regras de conversão medidas, as armadilhas já pagas, as decisões fechadas,
   como conferir o trabalho sem depender de eu testar, e o que falta.
2. `CLAUDE.md` — como conduzir o projeto e como falar comigo.
3. `docs/01_regras_negocio.md` e `docs/02_especificacao_campos.md`.

**Onde paramos.** Estão prontas, coladas na minha planilha e funcionando:

- **Etapa 1** — o layout da aba Comprovante, aprovado contra o comprovante do
  SIGA;
- **Etapa 2** — a aba Cadastros, com as 8 listas e a janela de importação;
- **Etapa 3** — extenso, soma do lote, e a cadeia conta → PIA → CNPJ → título →
  cabeçalho, com os campos calculados protegidos por aviso;
- **Etapa 5, primeira parte** — o PDF já sai por código, com margens,
  orientação e escala fixas, em uma folha, sem as anotações das células.

**O que quero agora: a Etapa 4 — o formulário em Apps Script**, que é por onde
todo o preenchimento vai passar. A seção 9 do arquivo de estado descreve o que
ele precisa ter; os pontos que mais me importam:

- **filtro enquanto eu digito** em todo campo de escolha (tipo, origem,
  destino, conta, diácono, cartão) — é o motivo de o formulário existir;
- **filtro em cascata**: escolhida a PIA de um lado, aparecem só as contas
  daquela PIA; escolhidas as duas PIAs, aparecem só os tipos que fazem sentido;
- **nenhum lado pode mudar por causa do outro** — mexer na origem não mexe no
  destino;
- **lançamento único e em lote** na mesma tela;
- uma **seção de Cadastros** dentro do próprio formulário;
- **funcionar no celular**;
- e, ao final, desligar os automatismos da planilha
  (`AUTOMATISMOS_NA_PLANILHA`), já que passa a ser o formulário quem preenche.

**Como quero ser conduzido** (está no `CLAUDE.md`, mas reforço porque é o que
faz o projeto andar):

- **Uma etapa de cada vez.** Peça uma ação, espere eu confirmar, só então vá
  para a próxima. Não me dê 10 passos de uma vez.
- **Diga exatamente onde clicar** ("Extensões → Apps Script", e não "abra o
  editor de scripts"). Não sou programador.
- **Avise antes** de qualquer tela de autorização do Google, dizendo o que vai
  aparecer, para eu não abortar achando que é erro.
- **Confira o seu próprio trabalho antes de me pedir teste** — a seção 8 do
  arquivo de estado explica como isso vem sendo feito.
- **Ao terminar cada mensagem, diga qual modelo e qual esforço eu devo
  selecionar** para continuar na etapa seguinte.

Pode começar.
