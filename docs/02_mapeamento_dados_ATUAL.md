# Mapeamento de dados — estado ATUAL (mapeado do código)

> Como o dado nasce, por onde passa e onde é impresso. Levantado em
> 23/09/2026 a partir dos `.gs` e do `04_Formulario_Tela.html` do
> repositório. Números de linha calculados por `montarLinhas_()`
> (lançamento com as 32 linhas de lote existentes; linhas escondidas
> continuam com o mesmo número).

---

## 1. Visão geral do fluxo

```
 cadastros/*.csv ──(dados de fábrica no 02_Cadastros.gs)──┐
                                                          ▼
                                             Aba "Cadastros" (11 blocos)
                                                          │ lerCadastro_()
                                                          ▼
 04_Formulario.gs · dadosDoFormulario()  ── 1 ida ──►  TELA (04_Formulario_Tela.html)
      + núcleo injetado (06 · telaComAsRegras_)          │  pessoa escolhe contas, forma,
                                                          │  finalidade, valor, assinantes
                                                          │  montarMovimentacao() → mov
                                                          ▼
          google.script.run.preencherComprovante(mov)  ou  .preencherEGerarPdf(mov)
               (gerar passa antes pela caixa "Quais PDFs gerar?" → etapasEscolhidas)
                                                          │
                          conferirRegraEntreContas_(mov)  │  (única trava)
                                                          ▼
                      Aba "Comprovante"  (escrita em fila: 00_Escrita_Rapida.gs)
                                                          │
                     recálculo (03): PIA, CNPJ, título, cabeçalho, extenso, soma
                                                          │
                                  guardarMovimentacao_(mov) → DocumentProperties
                                                          ▼
         05_Gerar_PDF.gs · emitirMovimentacao_: uma volta por etapa (2 ou 3)
                  preencher a etapa → URL de exportação → PDF no Drive
                                     consumirReferencia_ (uma vez) → CONTROLE
                                     .md de recuperação → Drive
                                     uma linha por PDF → aba Histórico
```

---

## 2. Onde o dado é GERADO

### 2.1 Aba Cadastros (fonte viva)

Criada/recriada por `criarAbaCadastros` (`02_Cadastros.gs`), com os dados de
fábrica de `BLOCOS_CADASTRO`. Lida por `lerCadastro_(id)` (com memória por
execução, `CADASTROS_LIDOS`).

| Bloco (`id`) | Título na aba | Colunas usadas pelo sistema | Quem consome |
|---|---|---|---|
| `CONTAS` | CONTAS POR PIA | PIA, ADM, Grupo contábil, Cód. SIGA, Conta PagCorp, Texto que aparece na lista, Natureza, Status, Instituição, **Sub-tesourarias PagCorp** e **Cartões podem sacar** (colunas novas da Etapa 7, no fim). O **CARTÃO DE DÉBITO** é uma linha só, com `*` na PIA: a PIA dele é a da conta do outro lado (`piaDaConta_(conta, outra)`, `nucleoContaNoPar`) | Tela (combos), classificação, regras, `piaDaConta_`, cartões de cada conta ACG (`contasParaONucleo_`) |
| `CARTOES` | CARTÕES PRÉ-PAGOS | Nº conta do cartão, Titular, PIA, Sub-tesouraria, Conta pai PagCorp, Cód. reduzido SIGA, Nome conforme SIGA, Status | Tela (campo cartão / lote) e a trava do cartão (`cartoesParaONucleo_`) |
| `DIACONOS` | DIÁCONOS (SIGNATÁRIOS) | Nome, Cargo, Frequência | Tela (vagas de assinatura) |
| `FORMAS` | FORMAS DE MOVIMENTAÇÃO | Forma, Em espécie?, Observação, Subforma de, Exige conta de, Instituições | `todasAsFormas_` → núcleo |
| `RELACOES` | REGRAS ENTRE CONTAS | Natureza de origem/destino, Formas permitidas/proibidas, Origem da regra, Ativa, Por quê, Origem contém, Destino contém | `relacoesNormalizadas_` → núcleo e trava |
| `FINALIDADES` | FINALIDADES | Código, Finalidade, O que é, Frentes, Históricos SIGA, Fonte, Cuidados, Sentido | `finalidadesCadastradas_` → núcleo; aviso de sentido |
| `REGRAS_FINALIDADE` | ONDE CADA FINALIDADE VALE | Código da finalidade, Folha, Tipo, Subtipo, Forma, Subforma, Históricos SIGA, Por quê, Origem, Destino | `regrasDeFinalidade_` → núcleo |
| `STATUS` | STATUS (ETAPAS) | Status, Quando usar, Etapa da sequência | Tela; lista suspensa do Status |
| `ADMS` | ADMs, CNPJ E LOCALIDADES | ADM, CNPJ, Endereço, Cidade / UF, Inscrição estadual, PIA | `admDaPia_` → CNPJ e cabeçalho |
| `BANCOS` | ABREVIATURAS DE BANCOS | Nome do banco, Abreviatura | Cadastro de abreviatura |
| `CONTROLE` | CONTROLE DA NUMERAÇÃO | Chave, Valor | `lerControle_` / `gravarControle_` |

Chaves do bloco CONTROLE usadas pelo código: `PREFIXO_REFERENCIA`,
`ANO_CORRENTE`, `ULTIMO_NUMERO`, `PROXIMA_REFERENCIA`, `PASTA_DRIVE_PADRAO`,
`RESTRICOES_ATIVAS`, `PRAXE_CARTAO_NA_MESMA_PIA`, `URL_TELA_CHEIA`.

Outras entradas nos Cadastros: janela **Importar dados para os Cadastros**
(`importarCadastroTexto`), menu **Cadastrar abreviatura de banco** e botão de
acrescentar finalidade no formulário (`acrescentarFinalidadeDoFormulario` →
`acrescentarLinhaNoBloco_` em FINALIDADES e REGRAS_FINALIDADE).

### 2.2 O que o servidor entrega à tela (`dadosDoFormulario`)

Uma chamada só na abertura. Campos devolvidos:

`contas[]` (texto, pia, piaChave, piaEscrita, adm, grupo, codigo, natureza,
instituicao, ativa, **contaPagCorp**, **subTesourarias**, **podemSacar**) · `cartoes[]`
(numero, titular, pia, piaChave, subTesouraria, contaPai, codigoSiga, nomeSiga,
ativo) · `diaconos[]` · `formas[]` ·
`finalidades[]` · `regrasDeFinalidade[]` · `relacoes[]` · `restricoesAtivas` ·
`praxeCartaoNaMesmaPia` · `naturezasValidas` · `arvore` · `status[]` ·
`pias[]` (derivadas das CONTAS, não das ADMs) · `urlTelaCheia` ·
`urlDaPlanilha` · `proximaReferencia` · `hoje` · `maxLinhasLote` (32) ·
`ultimo` (a última movimentação guardada, para reabrir preenchido).

Junto com o HTML vai o **código-fonte do núcleo** (`regrasParaATela_`), colado
no lugar de `var NUCLEO_DAS_REGRAS = 1;`.

### 2.3 O que a tela devolve (`montarMovimentacao` → objeto `mov`)

| Campo | Origem na tela | Observação |
|---|---|---|
| `referencia` | Campo travado (sistema) ou manual (exceção) | |
| `referenciaOrigem` | `sistema` / `segunda-via` / `historico-indisponivel` / `correcao` | só `segunda-via` não consome número |
| `referenciaJustificativa` | Texto obrigatório na exceção | Guardado com a movimentação |
| `numeracaoSiga` | Campo livre | Opcional |
| `status`, `etapaAtual` | Deduzidos | A 1ª etapa marcada ao gerar; no preenchimento, a 1ª da movimentação |
| `etapasEscolhidas` | Caixa "Quais PDFs gerar?" | As etapas marcadas; o servidor gera um PDF por etapa, na ordem da movimentação |
| `etapas` | `etapasAgora()` (2 ou 3) | |
| `data` | `aaaa-mm-dd` | |
| `forma`, `subforma`, `finalidade` | Combos em cascata | |
| `tipoDeduzido`, `subtipoDeduzido` | `nucleoClassificar` | |
| `tipoEscrito` | `nucleoTextoDoTipo` | É o que vai para o campo Tipo |
| `observacao` | Texto digitado | A frase das contas é acrescentada no servidor |
| `contaOrigem`, `contaDestino` | Combos de conta | Texto exato do cadastro |
| `cartaoOrigem`, `cartaoDestino` | Campo do cartão (só lançamento único) | |
| `piaChaveOrigem`, `piaChaveDestino` | Da conta escolhida | |
| `modo` | `unico` / `lote` | |
| `valor` | Valor único ou soma do lote | |
| `lancamentos[]` | Linhas do lote: data, documento, beneficiario, valor | Só em lote |
| `mesmosAssinantes` | "Os signatários serão os mesmos?" | |
| `assinantesPorEtapa` | `{TODAS: [...]}` ou `{APROVADA: [...], ...}` | Cada vaga: nome, cargo |
| `restricoesSuspensas` | O botão "Suspender as restrições…" (Etapa 7) | `true` só com ele ligado; o servidor pula a trava e o PDF sai marcado |

### 2.4 Estado guardado entre execuções

| Onde | Chave | Conteúdo | Escrito por |
|---|---|---|---|
| Propriedades do **documento** | `CMI_ULTIMA_MOVIMENTACAO` | JSON do último `mov` | `guardarMovimentacao_` (em todo preenchimento) |
| Propriedades do **script** | `ID_DA_PLANILHA` | id da planilha | `guardarIdDaPlanilha_` (abrir formulário / `doGet`) |
| Aba Cadastros · CONTROLE | `ULTIMO_NUMERO`, `PROXIMA_REFERENCIA`, `ANO_CORRENTE` | Contagem da Referência | `consumirReferencia_`, `virarOAnoSePreciso_` |
| Aba **Histórico** | uma linha por PDF | Emitido em, Referência, Etapa, Etapa nº, Como saiu o número, Motivo, Numeração SIGA, Data de emissão, Título, Tipo, Finalidade, Forma, contas e PIAs, Cabeçalho (ADM), Lançamentos, Valor, Extenso, Observação, Assinantes, Arquivo e endereço do PDF, endereço do `.md`, **Linhas do lote** (JSON) e **Emissão** (hora do 1º PDF do clique) — as duas desde a Etapa 6 — e **Restrições** ("SUSPENSAS no formulário", Etapa 7), no fim | `gravarNoHistorico_` |
| Propriedades do **documento** | `CMP_PROTECOES_DA_ABA` | Marca de que a aba já tem só a proteção do extenso e nenhuma anotação | `protegerCalculados_` (e, uma vez, `arrumarProtecoesUmaVez_` no preenchimento) |
| Pasta do Drive | `<ref>.md` (`CMP-26-001.md`) | Tudo o que originou os PDFs, e o JSON do `mov` no fim | `salvarArquivoDeRecuperacao_` |

---

## 3. Onde o dado é IMPRESSO (aba Comprovante)

Escrita em `preencherComprovante` (`04_Formulario.gs`) em duas filas:
**fila 1** (dados do formulário, gravando só células que mudaram —
`fecharEscritor_`) e **fila 2** (recálculo — `comFilaAberta_`).

### 3.1 Campos preenchidos a partir do `mov`

> **A grade tem 24 colunas (A..X) desde 01/10/2026**: a antiga R virou R:S e a
> antiga T virou U:V (o 6º assinante no desenho dele). As letras abaixo já são
> as novas.

| Campo no papel | Faixa (linha) | Valor escrito | Transformação |
|---|---|---|---|
| Referência | `G6:H6` (IDENT_1) | `mov.referencia` | caixa alta |
| rótulo "numeração SIGA:" | `I6:J6` | fixo, ou vazio | some se não houver número |
| Numeração SIGA | `K6:L6` | `mov.numeracaoSiga` | caixa alta |
| Status | `O6:T6` | `mov.status` | caixa alta |
| Data Emissão | `G7:L7` (IDENT_2) | `mov.data` | `dataDoFormulario_` (data local, sem fuso) |
| Valor | `O7:P7` | `mov.valor` (só lançamento único) | número, formato `R$ #,##0.00` |
| Tipo Transferência | `G9:X9` (TIPO) | `mov.tipoEscrito` (ou `mov.tipo`) | caixa alta |
| Observação | `G10:X10` (OBS, 2 linhas de altura) | `observacaoDoDocumento_(...)` | frase das contas + texto; caixa alta |
| Conta de origem | `E14:M14` (CONTAS) | `nucleoContaComCartao(contaOrigem, cartaoOrigem)` | caixa alta |
| Conta de destino | `P14:X14` | `nucleoContaComCartao(contaDestino, cartaoDestino)` | caixa alta |
| Lote: DATA | `B18:F18` … `B49:F49` | `lancamentos[i].data` | as 32 linhas são limpas antes |
| Lote: DOCUMENTO / CARTÃO | `G..:K..` | `lancamentos[i].documento` | caixa alta |
| Lote: BENEFICIÁRIO / FINALIDADE | `L..:S..` | `lancamentos[i].beneficiario` | caixa alta |
| Lote: VALOR | `T..:V..` | `lancamentos[i].valor` | número |
| Assinante 1–3 (nome/cargo) | `C:I`, `K:O`, `R:W` em 53/54 | `assinantesDaEtapa_(mov, etapaAtual)` | **sem** caixa alta |
| Assinante 4–5 | `C:I`, `K:O` em 56/57 | idem | idem |
| Assinante 6 (manual) | nome `S56:W56`, cargo `V57:W57` (rótulos "Nome:" em `R56` e "Cargo/Ministério:" em `R57:U57`, alinhados embaixo) | idem | idem |

### 3.2 Campos calculados pelo sistema (não vêm direto do formulário)

| Campo no papel | Faixa | Calculado por | A partir de |
|---|---|---|---|
| Visibilidade das linhas / altura do PREENCHIMENTO | linhas 14, 17–50, 51 | `aplicarModo_` | quantidade de lançamentos |
| Rótulo "Valor:" / "Valor Total:" | `M7` | `aplicarModo_` | lote ou não |
| PIA de origem / destino | `D13:L13` / `O13:X13` | `preencherPiaPelaConta_` | conta → `piaDaConta_` → `piaEscrita_` |
| CNPJ de origem / destino | `D15:L15` / `O15:X15` | `preencherCnpjPelaPia_` | PIA → bloco ADMS |
| Título | `B4:X4` | `atualizarTitulo_` | PIA origem × PIA destino |
| Cabeçalho (endereço, cidade, CNPJ/IE) | `B2:I2`, `J2:Q2`, `R2:X2` | `atualizarCabecalho_(sh, ladoDoCabecalho_(etapa))` | ADM da PIA de **origem**; de **destino** na etapa RECEBIDA |
| Total do lote e Valor Total | `U50:X50` e `O7:P7` | `somarLote_` | soma de `U18:V49` |
| Valor por extenso | `R7:X8` (2 linhas, quebra) | `atualizarExtenso_` → `numeroPorExtenso` | valor único ou total do lote |
| "Emitido em dd/MM/yyyy HH:mm:ss" | `B59:K59` | `carimbarEmissao_` | hora do preenchimento e, de novo, na geração do PDF |

Campos **fixos** desenhados pelo layout (não mudam com o formulário):
"CONGREGAÇÃO CRISTÃ NO BRASIL" (`J1:Q1`), "Folha 1 / 1" (`R1:X1`), rótulos,
nota das 3 assinaturas (`L59:X59`) e o rodapé lateral em pé (coluna A).

Campo com **proteção de aviso** (o Google pergunta antes de editar à mão):
**só o extenso** (`protegerCalculados_`, desde a Etapa 7 — pedido e). O resto
da aba é livre para editar à mão, e a aba **não tem anotação nenhuma**
(pedido k): os avisos da aba vão para o canto da tela.

### 3.3 Caminho alternativo: edição direta na aba

Se alguém digitar direto na aba Comprovante, o gatilho `onEdit`
(`03_Formulas_Validacoes.gs`, ativo enquanto `AUTOMATISMOS_NA_PLANILHA = true`)
refaz: extenso (linhas 7–8), aviso da Referência (linha 6), aviso de sentido
invertido (linha 9), PIA/CNPJ/título/cabeçalho (linhas 13–14, **só do lado
editado**) e soma do lote (linhas 18–49). Listas suspensas com "mostrar
aviso" ficam em Status, PIAs e Contas (`aplicarValidacoes`).

---

## 4. Saídas (onde o dado termina)

| Saída | Função | Destino | Nome |
|---|---|---|---|
| **PDFs** (pelo formulário) | `preencherEGerarPdf` → `emitirMovimentacao_` | Pasta `PASTA_DRIVE_PADRAO`, ou a pasta da planilha | Um por etapa: `[referência]-[STATUS] - AA_MM_DD.pdf` (`/` vira `-`; data = dia da geração) |
| **`.md` de recuperação** | `salvarArquivoDeRecuperacao_` | Mesma pasta dos PDFs | `[referência].md` — um por Referência |
| **Aba Histórico** | `gravarNoHistorico_` | A própria planilha | uma linha por PDF |
| **PDFs** (pelo menu) | `gerarPdfDoComprovante` → formulário com a caixa de escolha | idem | o mesmo caminho do botão |
| Planilha Google | `salvarCopiaDoFormulario('google')` | Mesma pasta do PDF | mesmo nome, sem `.pdf` |
| Excel `.xlsx` | `salvarCopiaDoFormulario('excel')` | Downloads de quem clicou (bytes em base64, nada fica no Drive) | mesmo nome + `.xlsx` |
| **Exportar do formulário** (Etapa 7) | `exportarDoFormulario(formato, mov)` — **preenche** cada etapa e exporta | Excel e `.md`: Downloads; planilha do Google: a pasta, **uma aba por etapa** | `[referência] - exportado AA_MM_DD`; o `.md`, `[referência].md` com "exportado sem PDF" |
| **Exportar a aba como está** (Etapa 7) | menu → `exportarDaAba(formato)`; o `.md` por `comprovanteDaAba_` | idem | o `.md` leva `"fonte": "aba"` no bloco do fim |
| **Aba Relatório** | `montarRelatorioMensal` (menu Relatório mensal) → `escreverRelatorio_` | A própria planilha, refeita a cada pedido | aba `Relatório` — lê a aba Histórico |
| **PDF do relatório** | `gerarPdfDoRelatorio` | Mesma pasta dos PDFs | `Relatório CMP - AAAA-MM - AA_MM_DD.pdf` (deitado, ajustado à largura) |

O PDF é pedido à URL `docs.google.com/spreadsheets/d/<id>/export` com os
parâmetros fixos de `EXPORTACAO_PDF` (A4, retrato, escala 1, margens
0,97 / 0,97 / 1,02 / 0,89 cm, sem grade, sem anotações). Antes, a
conferência rápida `conferirGrade_` avisa (sem bloquear) se o número de
linhas/colunas mudou ou se o conteúdo passa de 1045 px.

---

## 5. Lacunas observadas no fluxo atual

Registradas para decisão — nada disto foi alterado:

1. ~~Um PDF por clique~~, ~~cabeçalho de Recebimento~~ e ~~Histórico e
   `.md`~~ — resolvidos na Etapa 5 (seções 2.4 e 4).
2. **`TAB_TOTAL`** é escrito como `''` nos dois modos
   (`emLote ? '' : ''` em `preencherComprovante`); em lote, o total real vem
   depois, de `somarLote_`.
3. **`mesmaMovimentacaoJaEscrita_`** existe em `04_Formulario.gs` mas não é
   chamada por ninguém (resto do atalho retirado).
4. **O `.md` volta para a tela** (Etapa 7, `nucleoComprovanteDoArquivo`), mas
   só quando a pessoa escolhe o arquivo; nada o procura pela Referência.
