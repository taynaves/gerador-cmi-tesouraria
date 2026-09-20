# Prompt para abrir o chat novo (Etapa 4)

Abra um chat novo, conecte no projeto do GitHub
(`taynaves/gerador-cmi-tesouraria`, ramo `claude/cmi-comprovante-layout-quo9wg`)
e **cole o texto abaixo, inteiro**. É só isso — não precisa explicar mais nada,
o arquivo de estado conta o resto.

Sugestão para esta etapa: **Opus, esforço alto**.

---

Olá! Estou retomando a construção do **Gerador de Comprovantes de Movimentação
Interna (CMI)** da tesouraria da Piedade (ADM Coxim-MS, CCB). O projeto já está
em andamento e vem de outro chat.

**Antes de qualquer coisa, leia nesta ordem:**

1. `docs/00_estado_do_projeto.md` — é o ponto de retomada: o que já existe, as
   regras de conversão medidas, as armadilhas já pagas, as decisões fechadas e
   o que falta construir.
2. `CLAUDE.md` — como conduzir o projeto e como falar comigo.
3. `docs/01_regras_negocio.md` e `docs/02_especificacao_campos.md`.

**Onde paramos:** as Etapas 1 (layout da aba Comprovante), 2 (aba Cadastros e
importação de dados) e 3 (fórmulas, validações e valor por extenso) estão
prontas e aprovadas, com o código já colado na minha planilha e funcionando.

**O que quero agora: a Etapa 4 — o formulário em Apps Script**, que é por onde
todo o preenchimento vai acontecer (a seção 9 do arquivo de estado descreve o
que ele precisa ter).

**Como quero ser conduzido** (está no `CLAUDE.md`, mas reforço porque é o que
faz o projeto andar):

- **Uma etapa de cada vez.** Peça uma ação, espere eu confirmar, só então vá
  para a próxima. Não me dê 10 passos de uma vez.
- **Diga exatamente onde clicar** ("Extensões → Apps Script", e não "abra o
  editor de scripts"). Não sou programador.
- **Avise antes** de qualquer tela de autorização do Google, dizendo o que vai
  aparecer, para eu não abortar achando que é erro.
- **Ao terminar cada mensagem, diga qual modelo e qual esforço eu devo
  selecionar** para continuar na etapa seguinte.

Pode começar.
