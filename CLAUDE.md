# CLAUDE.md — Gerador de CMI (Tesouraria da Piedade, ADM Coxim-MS)

> Este arquivo descreve **só o que existe hoje no repositório**. O que ainda
> não foi construído aparece apenas na seção "O que NÃO existe ainda", e
> nunca como se existisse. A versão anterior deste arquivo, com a história
> completa das decisões, está em `CLAUDE_OLD.md` (histórico — não é
> especificação).

---

## 1. Objetivo do projeto

Gerar o **Comprovante de Movimentação Interna (CMI)**: o documento que a
tesouraria da Piedade anexa no SIGA para registrar dinheiro andando **entre
contas da própria obra** (caixas, bancos, conta ACG, cartões pré-pagos). Não é
nota fiscal, nem lançamento contábil, nem pagamento a terceiro.

O sistema roda numa **planilha Google com Apps Script**. Quem preenche usa um
**formulário** (janela do Sheets ou aba inteira do navegador); a planilha é só
a camada de impressão. O PDF sai **por código**, com a aparência idêntica ao
comprovante que o próprio SIGA emite (`docs/referencia_layout_aprovado.pdf`).

**Quem usa:** Taynã (responsável, não é programador) e outros diáconos leigos,
no computador e no celular. Toda mensagem ao usuário é em português simples.

---

## 2. Arquitetura atual

### 2.1 Arquivos do Apps Script (`apps_script/`)

São colados à mão pelo Taynã no editor do Apps Script, **um por vez**.

| Arquivo | Papel |
|---|---|
| `00_Escrita_Rapida.gs` | Fila de escritas enviada à planilha num pedido só (`Sheets.Spreadsheets.batchUpdate`). Se o serviço avançado não estiver ligado, refaz o mesmo trabalho pelo caminho antigo (`SpreadsheetApp`), sem quebrar. Chave: `USAR_ESCRITA_RAPIDA`. |
| `01_Layout_Comprovante.gs` | Desenha a aba **Comprovante** (grade de 22 colunas = 694 px; linhas nomeadas; altura útil 1045 px), o menu **Tesouraria CMI** (`onOpen`) e os modos lançamento único × lote (`aplicarModo_`). |
| `02_Cadastros.gs` | Aba **Cadastros** com 11 blocos (listas), leitura (`lerCadastro_`), recriação sem apagar o que o usuário editou, controle da Referência (`proximaReferencia_`, `consumirReferencia_`), abreviatura de bancos, conferência dos cadastros e janela de importação de dados. |
| `03_Formulas_Validacoes.gs` | Valor por extenso (`numeroPorExtenso`), soma do lote, cadeia **conta → PIA → CNPJ → cabeçalho → título**, avisos (anotação + toast) e listas suspensas na aba Comprovante. Gatilho `onEdit`. |
| `04_Formulario.gs` | Servidor do formulário: abre a janela (`abrirFormularioCmi`; com `true`, já na caixa de escolher os PDFs) ou a aba inteira (`doGet`), entrega os dados (`dadosDoFormulario`), escreve no Comprovante (`preencherComprovante`, com o cabeçalho da etapa — `ladoDoCabecalho_`), é a porta dos PDFs (`preencherEGerarPdf` → `emitirMovimentacao_`), salva cópia em planilha e acrescenta finalidade. |
| `04_Formulario_Tela.html` | A tela do formulário (HTML + CSS + JS, ~3.400 linhas). Não contém regra de negócio própria: recebe o núcleo injetado. |
| `05_Gerar_PDF.gs` | Exportação do PDF por URL com todos os ajustes fixos (`EXPORTACAO_PDF`), com nova tentativa em 429/5xx (`pdfDaAba_`); **emissão da movimentação** — um PDF por etapa, Referência consumida uma vez (`emitirMovimentacao_`); **`.md` de recuperação** (`salvarArquivoDeRecuperacao_`); **aba Histórico** (`gravarNoHistorico_`); conferência da grade, nome do arquivo, pasta de destino e cópia `.xlsx` / planilha Google. |
| `06_Tipos_E_Regras.gs` | **A única cópia das regras de negócio** (funções `nucleo*`), a injeção delas na tela (`telaComAsRegras_`) e a **única trava** do projeto (`conferirRegraEntreContas_`). |
| `README.md` | Como colar cada arquivo na planilha. |

### 2.2 Abas da planilha que o código cria

| Aba | Criada por | Uso |
|---|---|---|
| `Comprovante` | `criarLayoutComprovante` | Só impressão. Ninguém digita nela no caminho normal. |
| `Cadastros` | `criarAbaCadastros` | Fonte viva das listas (contas, cartões, diáconos, formas, regras, finalidades, status, ADMs, bancos, controle). |
| `Histórico` | `abaDoHistorico_` (sozinha, no primeiro PDF) | Uma linha por PDF emitido pelo formulário, gravada **pelo nome da coluna**. Protegida por aviso. |

### 2.3 Outras pastas

| Pasta | Conteúdo |
|---|---|
| `cadastros/*.csv` | Fonte da verdade das listas iniciais (contas, cartões, diáconos, formas, finalidades, status, ADMs, bancos). |
| `ferramentas_de_conferencia/` | Simulador do Sheets (`mock_planilha.js`) e baterias Node que testam os `.gs` e a tela **montada**. |
| `docs/` | Documentação. Índice em `docs/README.md`. Os dois documentos de estado atual são `docs/01_regras_negocio_ATUAL.md` e `docs/02_mapeamento_dados_ATUAL.md`. Arquivos com sufixo `_OLD` são histórico. |

### 2.4 Menu "Tesouraria CMI" (o que existe em `onOpen`)

Preencher comprovante (formulário) · Preencher em uma aba inteira · Conferir
versões dos arquivos · Diagnosticar o arquivo da tela · Gerar PDF do
comprovante · Conferir o layout antes de gerar · Recriar layout do Comprovante
· Ver como lançamento único · Ver como lançamento em lote (5 linhas) ·
Criar / recriar a aba Cadastros · Conferir cadastros · Cadastrar abreviatura
de banco · Importar dados para os Cadastros · Aplicar listas suspensas no
Comprovante · Sugerir próxima referência · Recalcular o comprovante · Proteger
os campos calculados · Testar o valor por extenso.

### 2.5 O que NÃO existe ainda (não descreva como se existisse)

- **Reabrir um comprovante pela Referência** (ler o JSON do `.md`): o `.md`
  já é gravado com esse bloco, mas nada o lê.
- **Relatório mensal** a partir da aba Histórico (Etapa 6).
- Regras de **agrupamento** do lote (mesma etapa, mesmo mês, mesma origem/
  destino): o lote existe, mas nada confere essas condições.

---

## 3. Regras de código

### 3.1 Regras do negócio que viram regra de código

1. **Avisar, nunca bloquear.** Tudo o que está estranho vira aviso (faixa na
   tela, anotação na célula, `toast`), e o botão continua funcionando.
   **Exceção única:** `conferirRegraEntreContas_` (em `06_Tipos_E_Regras.gs`)
   recusa movimento/forma proibidos entre contas — e tem porta de saída: a
   chave `RESTRICOES_ATIVAS = NÃO` no bloco CONTROLE. Não crie segunda trava.
2. **Preferência local vira nota, não trava**, com chave no CONTROLE para
   desligar (modelo: `nucleoPraxeDoCartao` / `PRAXE_CARTAO_NA_MESMA_PIA`).
3. **Campo vazio limpa a célula, sempre.** Nenhum comprovante pode sair com
   dado do anterior. Não crie atalho que pule o preenchimento.
4. **Tudo em CAIXA ALTA no papel** (`maiuscula_`, `val_`), exceto: nome e
   cargo dos signatários, e o **título** (tem "(de numerários)" / "(externa)"
   em caixa baixa de propósito).
5. **A Referência é gerada, nunca digitada** no caminho normal, e só é
   consumida quando o PDF sai (`consumirReferencia_`) — **uma vez** por
   movimentação, por mais PDFs que saiam. A cópia em planilha não consome.
   Numeração SIGA é opcional e pode repetir.
6. **A conta é o dado de entrada; PIA, CNPJ, título e cabeçalho são
   consequência.**
7. **Gerar abre uma caixa que pergunta quais PDFs** — uma, duas quaisquer ou
   todas (`abrirEscolhaDeEtapas` → `etapasEscolhidas`) —, pelo botão, pela aba
   ou pelo menu (`gerarPdfDoComprovante` abre o formulário já na caixa). Todas
   vêm marcadas, sempre; a caixa não guarda escolha. As etapas são conferidas
   **no servidor, pelas contas**, e saem na ordem da movimentação. Cada etapa passa pelo preenchimento inteiro. O
   Recebimento sai com o cabeçalho da ADM de destino (`ladoDoCabecalho_`).
8. **`.md` e Histórico avisam, nunca derrubam** os PDFs já emitidos. Um `.md`
   por Referência: correção reescreve, **segunda via mantém o do original**.

### 3.2 O núcleo das regras (inegociável)

- Regra de negócio mora **só** nas funções `nucleo*` de
  `06_Tipos_E_Regras.gs`. **Nunca** escreva regra dentro de
  `04_Formulario_Tela.html`.
- O núcleo é **JavaScript puro, ES5**: sem `SpreadsheetApp`, `Utilities`,
  `lerCadastro_`; sem `=>`, `let`, `const`; sem chamar função de fora do
  núcleo (recebe tudo por parâmetro). Ele é convertido em texto
  (`Function.prototype.toString`) e colado no HTML.
- Função nova do núcleo tem de entrar em `FUNCOES_DO_NUCLEO`.
- **Marcas são comandos, não comentários:** `var NUCLEO_DAS_REGRAS = 1;`,
  `var FIM_DA_TELA = 1;` (última linha do `<script>`),
  `var EM_ABA_INTEIRA = false;`. O `getContent()` do `HtmlService` devolve o
  HTML **sem comentários**.
- Quando tela e núcleo precisarem mudar **juntos**, suba `VERSAO_DA_TELA` e
  `VERSAO_DO_NUCLEO` para o mesmo valor. Mudança só nas `nucleo*` **não** sobe.

### 3.3 Apps Script / HtmlService

- **Zero `alert()` e `confirm()`** nas janelas HTML (o Google bloqueia).
  Toda mensagem é elemento da página (`mostrarFaixa` / `abrirDialogo`).
- JS com erro de sintaxe numa janela = janela abre com **todos os botões
  mortos e sem erro**. Sempre rode `conferir_tela.js` antes de entregar.
- Toda função que a tela chama via `google.script.run` e que lê a planilha
  começa com `garantirPlanilha_()` (no App da Web não há planilha ativa).
- Leitura que depende de escrita pendente numa fila **não enxerga a fila**:
  passe o valor por parâmetro (ver `atualizarExtenso_(sh, valor)`).

### 3.4 Cadastros

- **Coluna nova vai no FIM** do bloco, nunca no meio.
- A **chave** de um bloco (`chave: n` ou `[n, m, ...]`) tem de identificar a
  linha — chave repetida apaga linhas em silêncio.
- Recriar a aba **não sobrescreve célula que já tem valor**; só acrescenta
  linha nova e completa coluna nova. Remover linha só via `aposentadas`.
- Campo de conjunto fechado declara `valores: [...]` — "não está vazio" não é
  conferência.
- Ao escrever no cadastro, formate como texto (`setNumberFormat('@')`) antes:
  o Google converte "1.1.1" em data. Vale também para o **Histórico**
  (`setNumberFormats` antes de `setValues`).

### 3.5 Layout / PDF

- Largura total das colunas = **694 px**; altura visível ≤ **1045 px**.
  Passou disso, o PDF vira duas folhas.
- Tamanhos de fonte **inteiros**. Escala do PDF sempre **1 (Normal 100%)**.
- Nunca use referência de célula fixa ("G7"): use `faixa_('G:H', 'IDENT_1')`.
- Anotações de célula não vão ao PDF (`printnotes=false`).

### 3.5b A tela em colunas (medido em Chromium, `medir_tela.js`)

- `#colunas` é uma **grade com áreas**, não `flex-wrap`: entre 1000 e 1320 px
  são 2 colunas (`"c1 c2" "c3 c2"`, 5 : 4) e a 3ª coluna (assinantes e
  conferência) fica **embaixo da 1ª**; a partir de 1320 px, 3 colunas
  (4 : 3 : 4). Com `flex-wrap` a 3ª descia para uma linha própria e deixava
  um buraco embaixo da 1ª, na janela do Sheets dele (1097 px).
- Quantos PDFs a movimentação tem aparece no **rodapé** (`#documentosNoRodape`),
  que é o único lugar sempre à vista.

### 3.6 Estilo

- Código em **ES5** em todos os `.gs` (Apps Script V8 aceita mais, mas o
  projeto é homogêneo).
- Nomes e comentários em português; funções internas terminam em `_`.
- Comentários explicam **o porquê**, no mesmo tom do código existente.

---

## 4. Comandos úteis

Rodar da raiz do repositório (precisa de Node; `node` está em
`/opt/node22/bin/node` neste ambiente). São **965 conferências** (667 do
servidor, 245 de gestos, 53 da tela). A bateria do servidor exige **zero
avisos** numa emissão normal: os simulacros do Drive guardam arquivos de
verdade, senão o `.md` e o Histórico falhariam calados e a bateria daria
verde — foi o que aconteceu na primeira rodada da Etapa 5.

```bash
# Bateria do servidor: monta as abas com os .gs reais num simulador do Sheets
node ferramentas_de_conferencia/testar_etapa4.js .

# Lógica da tela fora do navegador (filtros, valores, cascata de finalidades)
node ferramentas_de_conferencia/testar_tela.js .

# Sintaxe e sanidade do HTML da tela (sem alert/confirm, ids, tags)
node ferramentas_de_conferencia/conferir_tela.js apps_script/04_Formulario_Tela.html /tmp

# Gestos na tela montada (precisa de jsdom + playwright, instalados JUNTOS)
npm install jsdom playwright --no-save
node ferramentas_de_conferencia/testar_gestos.js .

# Medir a tela num Chromium real (só quando mexer em CSS)
node ferramentas_de_conferencia/medir_tela.js

# Listar as combinações tipo · subtipo · forma · subforma que o motor permite
node ferramentas_de_conferencia/listar_combinacoes.js .

# Checar sintaxe de um .gs
cp apps_script/06_Tipos_E_Regras.gs /tmp/x.js && node --check /tmp/x.js

# Quais arquivos mudaram (pedir ao Taynã para colar SÓ esses)
git log -1 --format=%h -- apps_script/<arquivo>
```

Na planilha: **Tesouraria CMI → Conferir versões dos arquivos** e
**Diagnosticar o arquivo da tela** dizem, em números, o que o servidor está
lendo. Use antes de afirmar que um arquivo foi "colado pela metade".

**App da Web (aba inteira):** o endereço `/exec` serve uma fotografia do
script. Depois de mudar arquivos: Implantar → Gerenciar implantações → lápis
→ Versão: Nova versão → Implantar.

---

## 5. Como conduzir o trabalho com o Taynã

- **Uma etapa por mensagem** — com uma exceção pedida por ele (23/09/2026):
  **ao entregar arquivos para colar, entregue TODOS de uma vez**, cada um com
  o seu passo a passo completo (link do Raw, onde clicar, como conferir que
  colou inteiro), e o teste depois. Não um arquivo por mensagem.
- Diga **exatamente onde clicar**; explique jargão na primeira vez.
- Avise antes de toda tela de autorização do Google.
- Peça para colar **apenas** os arquivos que mudaram (confira no Git).
- Rode as baterias antes de pedir teste. Procure a **causa**, não o sintoma.
- Nunca acuse a colagem dele sem medir (menu de diagnóstico).
- Termine a mensagem dizendo qual modelo e esforço ele deve escolher.

---

## 6. Documentação de referência

- `docs/01_regras_negocio_ATUAL.md` — regras mapeadas do código (`06_Tipos_E_Regras.gs` e cadastros).
- `docs/02_mapeamento_dados_ATUAL.md` — de onde cada dado vem e onde é impresso.
- `docs/ARQUITETURA.md` — diagramas Mermaid (C4 nível 2 e fluxos) do estado atual.
- `docs/README.md` — índice dos demais documentos.
- Arquivos com sufixo `_OLD` são histórico: não use como especificação.
