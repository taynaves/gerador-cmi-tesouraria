# ESTADO DO PROJETO — ponto de retomada

**Para que serve este arquivo:** permitir que uma conversa nova (ou outra
pessoa) retome o projeto sem precisar reler o histórico e **sem repetir erro
já pago**. Quem ler este arquivo mais o `CLAUDE.md` e os `docs/` citados aqui
consegue reconstruir o sistema inteiro do zero e continuar de onde parou.

**Atualizado em:** 20/09/2026 · **Etapas 1, 2 e 3 prontas e aprovadas.**
**Próxima: Etapa 4 — o formulário.**

---

## 1. Em uma frase

Gerador do **Comprovante de Movimentação Interna (CMI)** da tesouraria da
Piedade (ADM Coxim-MS, CCB), feito como **planilha Google + Apps Script**, com
aparência **idêntica ao comprovante que o próprio SIGA emite**.

Quem usa: **Taynã** (responsável, **não é programador**) e outros diáconos,
no computador e no celular. Como conversar com ele está no `CLAUDE.md`, e é
para levar a sério: **uma etapa de cada vez, dizendo onde clicar, avisando
antes de cada tela de autorização do Google.** Ao fim de cada mensagem,
recomendar **qual modelo e qual esforço** usar na etapa seguinte.

---

## 2. O que já existe

| Etapa | Arquivo | Situação |
|---|---|---|
| 1 — Layout da aba Comprovante | `apps_script/01_Layout_Comprovante.gs` | **aprovada** (PDF conferido contra o do SIGA) |
| 2 — Aba Cadastros + importação | `apps_script/02_Cadastros.gs` | **aprovada** |
| 3 — Fórmulas, validações, extenso | `apps_script/03_Formulas_Validacoes.gs` | **aprovada**, com os ajustes de 20/09 |
| 4 — Formulário (`HtmlService`) | — | **a construir** |
| 5 — Geração dos PDFs multi-etapa | `apps_script/05_Gerar_PDF.gs` | **começada**: o PDF já sai por código, com margens e orientação fixas. Falta o multi-etapa |
| 6 — Histórico e relatório mensal | — | a construir |

Os três `.gs` convivem **no mesmo projeto do Apps Script**, dentro da
planilha (**Extensões → Apps Script**). O menu "Tesouraria CMI" está no
arquivo 01 e chama funções dos outros dois.

### Menu atual

Gerar PDF do comprovante · Conferir o layout antes de gerar · Recriar
layout do Comprovante · Ver como lançamento único · Ver como
lançamento em lote · Criar/recriar a aba Cadastros · Conferir cadastros ·
Cadastrar abreviatura de banco · Importar dados para os Cadastros · Aplicar
listas suspensas · Sugerir próxima referência · Recalcular o comprovante ·
Proteger os campos calculados · Testar o valor por extenso.

### As três abas

- **Comprovante** — só o layout de impressão, desenhado por código.
  **Ninguém digita nela** (o caminho normal é o formulário).
- **Cadastros** — a fonte viva das listas, em **8 blocos lado a lado**
  (CONTAS, CARTOES, DIACONOS, TIPOS, STATUS, ADMS, BANCOS, CONTROLE), cada um
  virando um intervalo nomeado `CAD_*`. Blocos lado a lado, e não empilhados,
  para que acrescentar uma linha numa lista nunca desloque outra.
- **Histórico** — ainda não existe; vem na Etapa 6.

---

## 3. As regras de negócio que mandam em tudo

Detalhe completo em `docs/01_regras_negocio.md`. O resumo que **não pode ser
esquecido**:

1. **Uma movimentação gera 2 ou 3 documentos**, nunca um. Mesma PIA →
   2 (`APROVADA` → `EFETIVADA`); PIAs diferentes → 3 (`APROVADA` → `PAGA` →
   `RECEBIDA`). A decisão é automática, comparando o prefixo da PIA de origem
   com o do destino.
2. **A mesma comparação decide o título:** mesma PIA →
   `COMPROVANTE DE MOVIMENTAÇÃO INTERNA`; PIAs diferentes →
   `COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS`.
3. **Quando as ADMs são diferentes, o cabeçalho muda por etapa:** Aprovação e
   Pagamento saem com a ADM de origem; Recebimento, com a de destino. Quem
   produz o documento decide o cabeçalho. Já funciona na aba:
   `atualizarCabecalho_(sh)` usa a origem, e a Etapa 5 chama
   `atualizarCabecalho_(sh, 'destino')` no Recebimento.
4. **A conta é o dado de entrada, a PIA é consequência.** Trocar a conta de um
   lado refaz a PIA, o CNPJ, o título e o cabeçalho **só daquele lado** —
   mexer na origem nunca pode mexer no destino. Nunca tratar a PIA como campo
   digitado, e nunca escrever no campo da PIA um palpite que não seja uma PIA.
5. **PIAs diferentes = transferência entre departamentos**, em três
   naturezas: entre bancos, entre caixas, entre caixa e banco. A lista TIPOS
   tem a coluna "Entre PIAs diferentes" (Sim/Não/Indiferente) justamente para
   o formulário filtrar.
6. **Agrupamento (lote):** só agrupa mesma etapa + mesmo mês + mesma
   origem/destino (ou mesma conta ACG, no caso de cartões) + mesmo tipo. O
   valor vira a **soma** e o rótulo vira **"Valor Total:"**. Em lançamento
   único **a tabela some inteira** — rótulos, linhas, TOTAL e as bordas do
   campo do total.
7. **Dois campos de identificação, com regras opostas:** *Referência*
   (`CMP-26/NNN`, própria, obrigatória, **única**, sequencial por ano) e
   *numeração SIGA* (opcional, **pode repetir**, some do documento se vazia).
8. **Todo dado preenchido sai em CAIXA ALTA**; rótulos, não. Exceção: nome e
   cargo dos signatários.
9. **Avisar, nunca bloquear.** Vale para validações, listas suspensas,
   importação e proteção de células. A tesouraria tem exceção para quase
   tudo, e bloquear faz o usuário contornar o sistema por fora — pior que o
   erro.
10. **Cada comprovante gerado salva um `.md` ao lado do PDF**, nomeado pela
   Referência, com tudo que o originou (para refazer sem redigitar).

---

## 4. A régua de conversão Sheets → PDF (medida, não estimada)

**Estas seis regras são o capital técnico do projeto.** Ignorar qualquer uma
delas já quebrou o layout uma vez.

1. **1 pixel** de linha/coluna = **0,75 pt** no PDF (escala Normal 100%).
2. A **fonte sai exatamente no tamanho pedido**, mas o Apps Script só aceita
   **inteiro e arredonda para cima**: pedir 7,18 vira 8. *Nunca* usar tamanho
   fracionado — foi o que estourou o documento para 4 páginas.
3. Topo do texto (alinhamento "meio") =
   `topo_da_linha + (altura − 1,25 × fonte) / 2 − 0,37 pt`.
4. Recuo do texto na célula: **3,5 px (2,625 pt)** de cada lado.
5. **Altura mínima de linha = `fonte × 1,667 + 4,7` px** (6 pt = 15 px ·
   7 pt = 16 · 8 pt = 18 · 12 pt = 25). Linha mais baixa que isso o Sheets
   **estica sozinho na exportação** — foi assim que 8 linhas cresceram 17 px
   e jogaram o documento para a segunda página. `alturaDaLinha_()` aplica o
   mínimo.
6. **Altura útil da folha = 1045 px**, validada em exportação real. Acima de
   ~1048 px o Sheets quebra em duas páginas.

Bordas existem só em **0,75 / 1,5 / 2,25 pt**. O documento usa **2,25 nas duas
réguas do título** (o SIGA usa 2,0; 2,25 é a mais próxima) e **0,75 no resto**.

**Impressão:** A4 · Retrato · **Normal (100%)** · margens 0,97 / 0,97 / 1,02 /
0,89 cm · alinhamento Centro/Acima · linhas de grade desmarcado. "Ajustar à
largura/altura" muda o tamanho da letra e quebra a sobreposição com o SIGA —
nunca usar.

**E não se ajusta isso em Arquivo → Imprimir.** Esses ajustes não ficam
guardados na planilha: ficam no navegador de cada pessoa, e o Google os
redefine sozinho. Nenhum comando do Apps Script os trava. Por isso o PDF sai
por **Tesouraria CMI → Gerar PDF do comprovante**, que escreve cada ajuste no
pedido feito ao Google (`EXPORTACAO_PDF`, em `05_Gerar_PDF.gs`).

---

## 5. O layout hoje

Mapa completo, célula por célula, em `docs/02_especificacao_campos.md`.
**Não decore referência de célula**: o layout é gerado por código, as linhas
têm nome (`lin_('IDENT_2')`) e o mapa vive naquele documento.

O essencial:

- **22 colunas (A..V), 694 px = 520,5 pt.** A antiga coluna C (58 px) foi
  dividida em quatro (C+D+E+F = 15+14+15+14) para o campo **Conta** caber —
  a soma é a mesma, então nada mais se moveu.
- **Os dois blocos não são simétricos, de propósito:** à esquerda os rótulos
  terminam colados no valor (C e D) e a conta vai até L; à direita o rótulo
  vai até M e o valor até V (esse lado já tinha espaço).
- **O extenso ocupa duas linhas mescladas** (`IDENT_2` + `IDENT_2B`, `R:V`)
  com quebra de texto e **alinhado ao topo**: em uma linha só, `99.999,99`
  saía cortado.
- **As larguras de M (87) e P (38) andam juntas**: P precisou de 38 px para
  `R$ 999.999,99` caber, e M cedeu os 4 px para a soma continuar em 694.
  Passar de 694 px **vaza na largura** e o PDF sai em duas folhas — é um jeito
  de quebrar a página que não tem nada a ver com a altura.
- **A tabela do lote cabe 32 lançamentos** (eram 33 antes da 2ª linha do
  extenso).
- `PREENCHIMENTO` é uma linha de sobra recalculada a cada mudança
  (`1045 − linhas visíveis`), colocada **entre a tabela e as assinaturas** —
  é ela que mantém assinaturas e rodapé colados no pé da folha.
- **Campos calculados protegidos por aviso:** extenso, título, os dois CNPJs
  e o total do lote.

---

## 6. Armadilhas já pagas — não repetir

| Armadilha | O que acontece | Como se resolve |
|---|---|---|
| Tamanho de fonte fracionado | Apps Script arredonda para cima; tudo cresce ~14% e o PDF vira 4 páginas | só tamanho inteiro |
| Linha mais baixa que o mínimo da fonte | o Sheets estica na exportação, em silêncio, e quebra a página | `alturaDaLinha_()` |
| `alert()` / `confirm()` dentro de `HtmlService` | o Google **bloqueia**; a janela abre e nada acontece | falar só com elementos da própria página (faixa colorida no topo, painel de confirmação) |
| Erro de sintaxe no JS **gerado** da janela | a janela abre, **nenhum botão funciona e nenhum erro aparece** | gerar o HTML, extrair o `<script>` e rodar `node --check` nele |
| `\n` cru dentro de string JS no HTML gerado | quebra o `<script>` inteiro (causa real do caso acima) | escapar `\\n` |
| Importar para a lista errada | passava em silêncio | conferência de coerência em duas camadas (regras fixas por lista + perfil dominante das colunas existentes) e confirmação antes de gravar |
| Centavos em ponto flutuante | `1,005` vira `100,49999…` e arredonda para baixo | contar em **centavos inteiros** com `+1e-6` |
| Mesclar a faixa errada | o cabeçalho saiu 20 pt fora do centro | conferir por sobreposição contra o PDF de referência |
| Somar mais de 694 px de largura | o PDF **vaza na largura** e sai em duas folhas — nada a ver com a altura | ao alargar uma coluna, estreitar outra na mesma medida |
| Tratar a PIA como campo digitado | a conta ia para uma ADM e o CNPJ/cabeçalho ficavam na outra | a conta manda: PIA, CNPJ, título e cabeçalho vêm dela |
| Escrever no campo da PIA um palpite tirado do texto da conta | uma conta fora da lista virava a "PIA" `101.17 - ACG - AG`, nenhuma ADM casava e **o cabeçalho congelava** | só escrever se o resultado começar com "PIA"; senão, avisar e não escrever nada |
| Refazer os dois lados a cada edição | trocar a conta de origem mudava o destino sozinho | agir só no lado editado (`ladoEditado_`) |
| Ajustar a impressão em Arquivo → Imprimir | os ajustes não ficam na planilha; o Google os redefine e o PDF desformata **em silêncio** | gerar o PDF por código, com os ajustes escritos no pedido |
| Dados provisórios ficando na lista de escolha | as sub-tesourarias de cartão de Costa Rica apareciam como conta de origem/destino e faziam escolher a errada | sub-tesouraria de cartão não é conta de origem/destino; vive no cadastro de cartões |
| `onEdit` com `try/catch` mudo | um defeito some sem deixar rastro | existe o **Recalcular o comprovante**, que faz o mesmo **sem engolir erro** |
| Mock que devolve o objeto errado | tudo "parece quebrado" e o erro real fica escondido | conferir o simulador antes de acusar o código |

---

## 7. Decisões fechadas — não reabrir

- **Nada de AppSheet, nem app Android nativo.** Já avaliado e descartado: o
  layout do comprovante (células mescladas, extenso ao lado do valor) é mais
  fiel e mais barato de manter numa planilha.
- **Nada de montar o PDF por HTML.** O Taynã já disse que do jeito que está,
  está bom.
- **Nada de "Fase 2" de Web App para celular.** O formulário `HtmlService` já
  resolve o celular. Um link público fora do Sheets só se ele pedir, e como
  projeto à parte.
- **Ninguém digita na aba Comprovante.** O preenchimento é pelo formulário. A
  lista suspensa na célula é só segunda camada de segurança.
- **A planilha não deve ter regra própria depois que o formulário existir.**
  Decisão do Taynã: como é sempre o formulário que preenche, regra na aba só
  gera mudança silenciosa. A constante `AUTOMATISMOS_NA_PLANILHA` em
  `03_Formulas_Validacoes.gs` desliga tudo de uma vez; as funções continuam
  lá, para o formulário chamar.
- **Não reaproveitar o `ci_generator.py`** do projeto das CIs: são sistemas
  diferentes.
- **Referência usa o prefixo `CMP`** (de *comprovante*), e ele é um dado da
  aba Cadastros (`PREFIXO_REFERENCIA`), não do código.
- **Abreviatura de banco: até 6 letras**, sugerida pelo sistema e
  **confirmada pelo usuário** — nunca decidida sozinha.
- **Extenso escreve "UM MIL"**, pela praxe do documento de valor (o extenso
  existe para travar o número; começar em "MIL" deixa espaço em branco antes
  de si) e por coerência com o SIGA, arquivado lado a lado. Constante
  `DIZER_UM_ANTES_DE_MIL`.

---

## 8. Como conferir o trabalho sem depender do Taynã testar

Existe um caminho de simulação que pegou quase todos os defeitos antes de ele
ver. Vale recriá-lo (os arquivos são de rascunho, ficam fora do repositório):

1. **`mock2.js`** — simulador do `SpreadsheetApp` em Node: roda o
   `01_Layout_Comprovante.gs` de verdade e grava o layout resultante em JSON
   (larguras, alturas, mesclagens, bordas, valores). **Ele estoura erro em
   mesclagem sobreposta e em coluna fora da grade** — é metade do valor.
2. **`render.py`** (pymupdf + a fonte Tahoma) — desenha esse JSON aplicando a
   régua de conversão da seção 4. Sai um PDF praticamente igual ao que o
   Sheets exporta.
3. **Sobreposição** contra `docs/referencia_layout_aprovado.pdf`: comparar a
   posição das réguas horizontais. Na última conferência, as réguas do título
   e todas as do rodapé caíram na mesma posição, e só os dois separadores do
   bloco origem/destino desceram 12 pt — exatamente a segunda linha do
   extenso.
4. **`mock_etapa3.js`** — simulador das três abas com os três `.gs` juntos,
   para testar extenso, soma do lote, CNPJ automático, título e avisos.
   Importante: ele usa um `onEdit` **que mostra o erro**, porque o de
   produção engole de propósito.
5. **`node --check`** em cada `.gs` (copiando para `.js` antes) e, para
   janelas `HtmlService`, no `<script>` **gerado**.

---

## 9. A Etapa 4 — o que precisa ser construído

O formulário é o **coração da arquitetura**: é por ele que tudo é preenchido.
Um modal/sidebar em `HtmlService`, aberto pelo menu.

Precisa ter:

- **Filtro-ao-digitar em todo combo** (tipo, origem, destino, conta, diácono,
  cartão). Esse é o motivo de o formulário existir: o Sheets **não filtra
  lista suspensa enquanto se digita** dentro da célula.
- **Lançamento único e lote** na mesma tela, com uma linha por lançamento e
  soma automática.
- **Sugestão da próxima Referência**, sem consumir o número (quem consome é a
  geração do PDF).
- **Uma pergunta única antes de gerar:** "os signatários serão os mesmos em
  todas as etapas?" Se sim, o mesmo conjunto em todos os PDFs; se não, pede
  etapa por etapa.
- **Seção de Cadastros** dentro do próprio formulário, para quem não vai
  abrir a planilha.
- **Filtrar em cascata:** escolhida a PIA (de origem ou de destino), a lista
  de **contas** daquele lado mostra só as contas daquela PIA. Escolhidas as
  duas PIAs, a lista de **tipos** mostra só os que a coluna "Entre PIAs
  diferentes" permite.
- **Nunca mudar um lado por causa do outro.** A única exceção admitida pelo
  Taynã é uma conta cujas movimentações sejam exclusivamente com uma segunda
  conta, e só com ela — não existe nenhuma assim cadastrada hoje, então não
  construir isso agora.
- **Funcionar bem no celular** (campos de formulário normais, nada de tocar
  em célula mesclada).
- **Zero `alert()` / `confirm()`** — ver a tabela de armadilhas.

Depois dela: **Etapa 5** (gerar os 2 ou 3 PDFs, com o Status certo em cada
um, o cabeçalho trocando por ADM, o nome de arquivo
`CMI-[nº]-[ETAPA] - [AA]_[MM]_[DD].pdf`, a pasta no Drive e o `.md` de
recuperação) e **Etapa 6** (aba Histórico e relatório mensal).

---

## 10. Modelo e esforço sugeridos

| Etapa | Modelo | Esforço | Por quê |
|---|---|---|---|
| 4 — Formulário | Opus | **Alto** | é a peça mais complexa: HTML, JS, filtro, lote, cadastros |
| 5 — PDFs multi-etapa | Opus | **Alto** | regra das 2/3 etapas, cabeçalho por ADM, Drive, `.md` |
| 6 — Histórico e relatório | Opus | Médio | mais mecânico |
| Ajuste pontual / conferência | Opus | Médio | |

---

## 11. Onde está cada coisa

| Arquivo | Conteúdo |
|---|---|
| `CLAUDE.md` | como conduzir o projeto e falar com o Taynã; regras de ouro |
| `docs/00_estado_do_projeto.md` | **este arquivo** |
| `docs/01_regras_negocio.md` | as 20 regras validadas com ele |
| `docs/02_especificacao_campos.md` | grade, mapa de células, impressão |
| `docs/03_conciliacao_cartoes.md` | cartões |
| `docs/04_aba_cadastros.md` | estrutura dos 8 blocos |
| `docs/05_importar_dados.md` | como importar + **o prompt pronto** para preparar dados noutro chat |
| `docs/06_formulas_validacoes.md` | extenso, avisos, listas, campos protegidos |
| `docs/07_gerar_pdf.md` | por que não se usa Arquivo → Imprimir, e como o PDF sai |
| `docs/referencia_siga_comprovante.pdf` | o comprovante emitido pelo SIGA |
| `docs/referencia_layout_aprovado.pdf` | **a referência visual do projeto** |
| `cadastros/*.csv` | contas, cartões, diáconos, tipos, status, CNPJ, abreviaturas |

**Manter em dia:** sempre que uma lista dos Cadastros ganhar ou perder coluna,
atualizar o prompt de `docs/05_importar_dados.md`.
