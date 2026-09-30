# CLAUDE.md — Gerador de comprovantes para o SIGA (Tesouraria da Piedade, ADM Coxim-MS)

> **O nome mudou na Etapa 6** (decisão dele, 24/09/2026). Era "Gerador de CMI"
> — Comprovante de Movimentação Interna —, e a sigla só dizia um dos dois
> documentos: o sistema também gera o de Transferência de numerários. Hoje:
> **Gerador de comprovantes para o SIGA**; menu **Tesouraria • CMP p/ SIGA**
> (CMP é a mesma sigla do começo da Referência). O repositório e o ramo
> continuam com "cmi" no nome, e alguns nomes internos também, de propósito
> (seção 3.6).

> Este arquivo descreve **só o que existe hoje no repositório**. O que ainda
> não foi construído aparece apenas na seção "O que NÃO existe ainda", e
> nunca como se existisse. A versão anterior deste arquivo, com a história
> completa das decisões, está em `CLAUDE_OLD.md` (histórico — não é
> especificação).

---

## 1. Objetivo do projeto

Gerar os **comprovantes que a tesouraria da Piedade anexa no SIGA** — depois
de assinados — para registrar dinheiro andando **entre contas da própria
obra** (caixas, bancos, conta ACG, cartões pré-pagos). São dois documentos: o
**Comprovante de Movimentação Interna (de numerários)**, na mesma PIA, e o
**Comprovante de Transferência (externa) de Numerários**, entre PIAs. Não é
nota fiscal, nem lançamento contábil, nem pagamento a terceiro. E um
**relatório mensal** lista o que o app gerou em cada mês.

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
| `01_Layout_Comprovante.gs` | Desenha a aba **Comprovante** (grade de 22 colunas = 694 px; linhas nomeadas; altura útil 1045 px), o menu **Tesouraria • CMP p/ SIGA** (`onOpen`) e os modos lançamento único × lote (`aplicarModo_`). |
| `02_Cadastros.gs` | Aba **Cadastros** com 11 blocos (listas), leitura (`lerCadastro_`), recriação sem apagar o que o usuário editou, controle da Referência (`proximaReferencia_`, `consumirReferencia_`), abreviatura de bancos, conferência dos cadastros e janela de importação de dados. |
| `03_Formulas_Validacoes.gs` | Valor por extenso (`numeroPorExtenso`), soma do lote, cadeia **conta → PIA → CNPJ → cabeçalho → título**, avisos (anotação + toast) e listas suspensas na aba Comprovante. Gatilho `onEdit`. |
| `04_Formulario.gs` | Servidor do formulário: abre a janela (`abrirFormularioCmi(abrirNaEscolhaDoPdf, abrirNasExcecoes)`; `abrirFormularioNasExcecoes` abre com o painel roxo) ou a aba inteira (`doGet`), entrega os dados (`dadosDoFormulario`, com contas e cartões no formato do núcleo), escreve no Comprovante (`preencherComprovante`, com o cabeçalho da etapa — `ladoDoCabecalho_` —, e arruma as proteções da planilha antiga uma vez — `arrumarProtecoesUmaVez_`), é a porta dos PDFs (`preencherEGerarPdf` → `emitirMovimentacao_`), salva cópia em planilha e acrescenta finalidade. |
| `04_Formulario_Tela.html` | A tela do formulário (HTML + CSS + JS, ~4.700 linhas). Não contém regra de negócio própria: recebe o núcleo injetado. |
| `05_Gerar_PDF.gs` | Exportação do PDF por URL com todos os ajustes fixos (`EXPORTACAO_PDF`), com nova tentativa em 429/5xx (`pdfDaAba_`); **emissão da movimentação** — um PDF por etapa, Referência consumida uma vez (`emitirMovimentacao_`); **`.md` de recuperação** (`salvarArquivoDeRecuperacao_`); **aba Histórico** (`gravarNoHistorico_`); conferência da grade, nome do arquivo, pasta de destino e cópia `.xlsx` / planilha Google (`salvarCopiaDoComprovante_` → `entregarCopia_`). O `.md` do "exportado sem PDF" é o mesmo `textoDaRecuperacao_`, com `'exportado'`. |
| `06_Tipos_E_Regras.gs` | **A única cópia das regras de negócio** (funções `nucleo*`: também os cartões de cada conta ACG — `nucleoCartoesDaConta`, `nucleoCartoesDoMovimento` — e a leitura do `.md` — `nucleoComprovanteDoArquivo`), a injeção delas na tela (`telaComAsRegras_`) e a **única trava** do projeto (`conferirRegraEntreContas_`, que inclui a do cartão — `conferirCartoesDoMovimento_`). |
| `07_Relatorio_Mensal.gs` | **Relatório mensal** (Etapa 6): menu `relatorioMensal`, janelinha do mês montada como texto (`telaDoRelatorio_`), a regra de contar cada comprovante uma vez (`comprovantesDoHistorico_`, `relatorioDoMes_`), a aba **Relatório** (`escreverRelatorio_`) e o PDF dela (`gerarPdfDoRelatorio`). Também a comparação da correção com a versão anterior (`oQueACorrecaoMudou_`), usada na geração e na prévia da caixa roxa (`previaDaCorrecao`). |
| `08_Exportar.gs` | **Arquivo novo da Etapa 7** (criado à mão no editor). O comprovante **sem PDF**: do formulário (`exportarDoFormulario` — preenche e exporta; planilha com uma aba por etapa, ou o `.md`) e da aba como está (menu `exportarComprovanteDaAba` → `exportarDaAba`; o `.md` lido do papel por `comprovanteDaAba_`, com `"fonte": "aba"`); a pasta dos arquivos (`pastaDosArquivos`, menu `abrirPastaDosArquivos`). Nenhum gasta a Referência nem entra no Histórico. |
| `README.md` | Como colar cada arquivo na planilha. |

### 2.2 Abas da planilha que o código cria

| Aba | Criada por | Uso |
|---|---|---|
| `Comprovante` | `criarLayoutComprovante` | Só impressão. Ninguém digita nela no caminho normal. |
| `Cadastros` | `criarAbaCadastros` | Fonte viva das listas (contas, cartões, diáconos, formas, regras, finalidades, status, ADMs, bancos, controle). |
| `Histórico` | `abaDoHistorico_` (sozinha, no primeiro PDF) | Uma linha por PDF emitido pelo formulário, gravada **pelo nome da coluna**. Protegida por aviso. As três últimas colunas: Linhas do lote e Emissão (para o relatório) e **Restrições** ("SUSPENSAS no formulário" quando o PDF saiu com o botão de suspender). |
| `Relatório` | `escreverRelatorio_` (menu Relatório mensal) | A lista do mês escolhido. **Refeita do zero a cada pedido**; protegida por aviso. |

### 2.3 Outras pastas

| Pasta | Conteúdo |
|---|---|
| `cadastros/*.csv` | Fonte da verdade das listas iniciais (contas, cartões, diáconos, formas, finalidades, status, ADMs, bancos). |
| `ferramentas_de_conferencia/` | Simulador do Sheets (`mock_planilha.js`) e baterias Node que testam os `.gs` e a tela **montada**. |
| `docs/` | Documentação. Índice em `docs/README.md`. Os dois documentos de estado atual são `docs/01_regras_negocio_ATUAL.md` e `docs/02_mapeamento_dados_ATUAL.md`. Arquivos com sufixo `_OLD` são histórico. |

### 2.4 Menu "Tesouraria • CMP p/ SIGA" (o que existe em `onOpen`)

Nome do menu: **Tesouraria • CMP p/ SIGA**.

Preencher comprovante (formulário) · Preencher em uma aba inteira ·
**Corrigir, segunda via ou outro número (exceções)** · Conferir versões dos
arquivos · Diagnosticar o arquivo da tela · Gerar PDF do comprovante ·
**Exportar o comprovante da aba (Excel, planilha, .md)** · **Abrir a pasta dos
arquivos** · Conferir o layout antes de gerar · Relatório mensal · Recriar
layout do Comprovante · Ver como lançamento único · Ver como lançamento em lote
(5 linhas) · Criar / recriar a aba Cadastros · Conferir cadastros · Cadastrar
abreviatura de banco · Importar dados para os Cadastros · Aplicar listas
suspensas no Comprovante · Sugerir próxima referência · Recalcular o
comprovante · **Proteger o valor por extenso (e tirar as anotações)** · Testar
o valor por extenso.

### 2.5 O que NÃO existe ainda (não descreva como se existisse)

- **Etapa 7B** (pedidos j e l, `docs/09`, seção 6.2): pastas no Drive por
  tipo, a Lixeira e o "OLD" da correção; **um arquivo só por pedido**, uma
  página por etapa. Hoje sai um PDF por etapa, todos na mesma pasta.
- **Reabrir pela Referência sem o arquivo**: o `.md` é lido de volta (painel
  roxo → "Trazer os dados de um comprovante"), mas a pessoa escolhe o arquivo;
  nada o procura na pasta pelo número.
- Regras de **agrupamento** do lote (mesma etapa, mesmo mês, mesma origem/
  destino): o lote existe; só os meses e a **ordem das datas** viram aviso.

---

## 3. Regras de código

### 3.1 Regras do negócio que viram regra de código

1. **Avisar, nunca bloquear.** Tudo o que está estranho vira aviso (faixa na
   tela, anotação na célula, `toast`), e o botão continua funcionando.
   **Exceção única:** `conferirRegraEntreContas_` (em `06_Tipos_E_Regras.gs`)
   recusa movimento/forma proibidos entre contas **e o cartão de outra conta
   ACG** (decisão dele, 30/09/2026: a trava do cartão "faz parte das
   restrições") — e tem duas portas de saída: o botão **"Suspender as
   restrições…"** da tela (vale até gerar o PDF ou fechar a janela; o PDF sai
   marcado no Histórico e no `.md`; o servidor só pula a trava com
   `mov.restricoesSuspensas === true`) e a chave `RESTRICOES_ATIVAS = NÃO` no
   bloco CONTROLE. **Segunda exceção,
   pedida por ele (24/09/2026):** com "Segunda via" escolhida no painel roxo,
   nenhum campo muda (`barrarNaSegundaVia`, na tela) — segunda via reimprime.
   Portas de saída: "Mudar para Corrigir" na própria caixa, e "Voltar para a
   referência do sistema". Não crie uma terceira.
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
9. **O relatório mensal conta, NUNCA soma.** Há comprovante gerado direto no
   SIGA; um total só dos daqui teria cara de saldo e não seria. Não escreva
   soma, saldo ou "entradas/saídas" nele (há conferência).
10. **O Histórico tem uma linha por PDF; um comprovante se conta pela
    Referência** — nunca "pela etapa 1". Segunda via não repete; na correção
    valem os dados da emissão mais nova; "a mesma emissão" é a mesma hora
    **e** o mesmo jeito de sair o número, o mesmo motivo, sem etapa repetida
    (a hora sozinha, em segundos, juntou o errado com o corrigido na
    bancada). Detalhe: `docs/16_relatorio_mensal.md`.
11. **As bandeiras aparecem ao GERAR, numa caixa — nunca durante o
    preenchimento** (pedido g). Cada aviso: ignorar ou corrigir; "Gerar CMP
    nº X mesmo assim", "Voltar e corrigir" (primeiro campo não ignorado, com
    a lista aberta), "Ignorar tudo e gerar". Os ignorados ficam no rodapé até
    fechar a janela. **O que trava não é bandeira**: vai para o rodapé ("Não
    dá para gerar: …"), vermelho enquanto existir. Aviso novo na conferência
    leva um **4º elemento** — o campo a que "Corrigir" leva — e, se travar,
    entra em `bloqueios`.
12. **Toda faixa abre uma caixa** (pedido h), a azul também — menos por cima
    da caixa travada de quem está trabalhando, e nunca antes de a tela estar
    de pé. Fechar a caixa não apaga a faixa.
13. **A aba Comprovante é livre para editar à mão, e não tem anotação
    nenhuma** (pedidos e, k). Só o **extenso** é protegido (por aviso). Aviso
    da aba vai para o canto da tela (`toast`), nunca para `setNote`: a caixa
    de impressão do Google imprime anotações, e ela não é programável.
14. **O cartão é da sua conta ACG** (decisão dele, 30/09/2026). A referência
    é a listagem de cartões aptos da PagCorp
    (`cadastros/pagcorp_cartoes_aptos/`) — se o cadastro divergir, vale ela.
    Não há conta contábil de cartão na lista: há **um "PIA-X: CARTÃO DE
    DÉBITO" por PIA**; com a ACG de um lado e ele do outro, só os cartões
    daquela conta aparecem. Detalhe: `docs/17_cartoes_no_siga.md`.

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
- Anotações de célula não vão ao PDF (`printnotes=false`) — e a aba não tem
  **nenhuma** (regra 13), para a impressão pelo Google também não trazer.

### 3.5b A tela: as seções uma abaixo da outra (medido em Chromium, `medir_tela.js`)

- **Desde a Etapa 7 (pedido i, decisão dele — não se reabre):** as seções
  ficam **uma abaixo da outra, cada uma na largura toda**, para uso a 100% de
  zoom; a tela rola. A grade de 2 e 3 colunas da Etapa 4 foi **aposentada**.
  A largura se usa **dentro** das seções: origem e destino lado a lado,
  Finalidade ao lado da Observação, assinantes três por linha
  (`.assin-vaga.so-nome` com 300 px), avisos lado a lado.
- **Medir preenchido, não vazio:** `medir_tela.js` escolhe a conta de nome
  mais comprido, lote e seis assinantes antes de medir, e diz se algum campo
  preenchido corta; `--foto` fotografa cada medida (pasta em
  `FOTOS_DA_MEDICAO`). Na janela do Sheets dele (1097 px) a conta mais
  comprida só coube com os campos dos lados em 14 px.
- Quantos PDFs a movimentação tem aparece no **rodapé** (`#documentosNoRodape`),
  que é o único lugar sempre à vista; em cima dele, `#avisosDoRodape` (o que
  trava, o que será ignorado, as restrições suspensas).

### 3.6 Estilo

- Código em **ES5** em todos os `.gs` (Apps Script V8 aceita mais, mas o
  projeto é homogêneo).
- Nomes e comentários em português; funções internas terminam em `_`.
- Comentários explicam **o porquê**, no mesmo tom do código existente.
- **Nomes internos que continuam com "CMI", de propósito:** `MARCA_PROTECAO`
  (`'CMI - campo calculado'` — é por ela que as proteções existentes são
  reconhecidas e trocadas) e `CHAVE_MOVIMENTACAO` (`'CMI_ULTIMA_MOVIMENTACAO'`
  — trocar faria a janela esquecer o último preenchimento). Ninguém os vê.
  O que as pessoas veem já usa o nome novo.

---

## 4. Comandos úteis

Rodar da raiz do repositório (precisa de Node; `node` está em
`/opt/node22/bin/node` neste ambiente). São **1.333 conferências** (859 do
servidor, 421 de gestos, 53 da tela). A bateria do servidor exige **zero
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

# Medir a tela num Chromium real (só quando mexer em CSS); --foto fotografa
node ferramentas_de_conferencia/medir_tela.js --foto
# (script próprio com playwright: launch({ executablePath: '/opt/pw-browsers/chromium' }),
#  senão ele procura um navegador que não está instalado)

# Listar as combinações tipo · subtipo · forma · subforma que o motor permite
node ferramentas_de_conferencia/listar_combinacoes.js .

# Checar sintaxe de um .gs
cp apps_script/06_Tipos_E_Regras.gs /tmp/x.js && node --check /tmp/x.js

# Quais arquivos mudaram (pedir ao Taynã para colar SÓ esses)
git log -1 --format=%h -- apps_script/<arquivo>
```

Na planilha: **Tesouraria • CMP p/ SIGA → Conferir versões dos arquivos** e
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
- **Busque o ramo ANTES de ler** (`git fetch` e `git pull`), e não só antes de
  encerrar: na Etapa 6 a cópia local começou atrasada, sem o checkpoint 5 e
  os `_ATUAL` que ele mandou ler.

---

## 6. Documentação de referência

- `docs/01_regras_negocio_ATUAL.md` — regras mapeadas do código (`06_Tipos_E_Regras.gs` e cadastros).
- `docs/02_mapeamento_dados_ATUAL.md` — de onde cada dado vem e onde é impresso.
- `docs/ARQUITETURA.md` — diagramas Mermaid (C4 nível 2 e fluxos) do estado atual.
- `docs/19_checkpoint_etapa_7A.md` — a última entrega (7A): o que mudou, os defeitos com causa e **o que evitar de antemão** (soma-se aos checkpoints 13, 14 e 15).
- `docs/17_cartoes_no_siga.md` — como os cartões são escriturados no SIGA, e o modelo do sistema (cartão → conta ACG).
- `docs/16_relatorio_mensal.md` — o relatório mensal: o que é, a regra de contar cada comprovante uma vez, a aba e o PDF.
- `PROMPT_ETAPA_7.md` — o texto que abre a próxima etapa, num chat novo.
- `docs/README.md` — índice dos demais documentos.
- Arquivos com sufixo `_OLD` são histórico: não use como especificação.
