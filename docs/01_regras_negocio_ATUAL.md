# Regras de negócio — estado ATUAL (mapeado do código)

> Fonte: `apps_script/06_Tipos_E_Regras.gs` (o núcleo `nucleo*` e a trava),
> com os dados iniciais de `apps_script/02_Cadastros.gs` (blocos da aba
> Cadastros) e os pontos em que `01_Layout_Comprovante.gs`,
> `03_Formulas_Validacoes.gs` e `04_Formulario.gs` aplicam essas regras.
> Levantado em 23/09/2026 e atualizado em 30/09/2026 (Etapa 7A), a partir de
> `VERSAO_DO_NUCLEO = '2026-09-30a'`.
>
> **Os dados iniciais (contas, regras, formas, finalidades) vivem na aba
> Cadastros e podem ter sido editados na planilha.** O que está aqui é o que o
> código traz de fábrica; a regra de **como** eles são aplicados é a do código.

---

## 1. As cinco perguntas de uma movimentação

| Pergunta | Como é respondida | Função |
|---|---|---|
| Onde acontece? (TIPO) | Deduzida das duas contas | `nucleoClassificar` |
| Entre quem? (SUBTIPO) | Deduzida das duas contas (só na transferência) | `nucleoClassificar` |
| Como o dinheiro anda? (FORMA / SUBFORMA) | Escolhida, entre as que as regras permitem | `nucleoFormasEntre` |
| Que tipo de contas? (CAIXA / BANCO / CARTÃO) | Deduzida das naturezas | `nucleoContasEnvolvidas` |
| Para quê? (FINALIDADE) | **Escolhida** — a única que o sistema não deduz | `nucleoFinalidadesQueValem` |

---

## 2. Tipos e subtipos de movimentação (deduzidos)

Constantes `TIPOS_DE_MOVIMENTACAO` e `SUBTIPOS_DE_TRANSFERENCIA`.

| Situação das contas | TIPO | SUBTIPO | Documentos (Status) |
|---|---|---|---|
| Mesma PIA | `MOVIMENTAÇÃO INTERNA (de numerários)` | — | 2: `APROVADA` → `EFETIVADA` |
| PIAs diferentes, mesma ADM | `TRANSFERÊNCIA (externa) DE NUMERÁRIOS` | `entre departamentos` | 3: `APROVADA` → `PAGA` → `RECEBIDA` |
| ADMs diferentes | `TRANSFERÊNCIA (externa) DE NUMERÁRIOS` | `entre administrações` | 3: `APROVADA` → `PAGA` → `RECEBIDA` |

Regras de comparação:

- **R-TIPO-1.** A comparação de PIA usa a **chave normalizada** (`pia_`: texto
  antes do `:`, sem espaços e hífens, em caixa alta), nunca o código da conta
  — o mesmo código (ex.: `101.10`) existe em várias PIAs.
- **R-TIPO-2.** "Mesma ADM" exige ADM preenchida na origem **e** igual à do
  destino (`nucleoIgual`, ignora caixa e espaços).
- **R-TIPO-3.** Enquanto faltar uma das contas (ou a PIA de uma delas), a
  classificação sai **vazia** — não se deduz com meio dado.
- **R-TIPO-4.** A mesma comparação define o **título** do documento
  (`TITULOS` / `tituloDoComprovante_`):
  - mesma PIA → `COMPROVANTE DE MOVIMENTAÇÃO INTERNA (de numerários)`
  - PIAs diferentes → `COMPROVANTE DE TRANSFERÊNCIA (externa) DE NUMERÁRIOS`
  O título é escrito **sem** passar pelo caixa-alta.
- **R-TIPO-5.** A mesma comparação define as etapas
  (`etapasDaMovimentacao_` em `04_Formulario.gs`) — e quantos PDFs saem num
  clique (seção 10).

---

## 3. Formas de movimentação (bloco FORMAS)

Dados de fábrica:

| Forma | Subforma de | Em espécie? | Exige conta de | Instituições |
|---|---|---|---|---|
| `SAQUE` (família) | — | Sim | CAIXA | — |
| `DINHEIRO` | SAQUE | Sim | CAIXA | — |
| `CHEQUE` | SAQUE | Não | CAIXA | — |
| `TRANSF. BANCÁRIA` | — | Não | — | `MESMA` |
| `TED` | — | Não | — | `DIFERENTES` |
| `PIX` | — | Não | — | `DIFERENTES` |

Aposentadas (removidas na recriação): `TRANSF. DOC`, `TRANSF. TED`.

Regras:

- **R-FORMA-1 (folhas).** Só se escolhem as formas **sem subforma abaixo**
  (`nucleoFolhas`). `SAQUE` não se escolhe; escolhe-se `DINHEIRO` ou `CHEQUE`.
- **R-FORMA-2 (família).** Permitir ou proibir uma forma alcança ela e todas
  as subformas (`nucleoFamilia`). Proibir `SAQUE` tira `DINHEIRO` e `CHEQUE`.
- **R-FORMA-3 (o que a forma É — `nucleoFormaCabe`).** Não é decisão da
  tesouraria, vale sempre que as restrições estiverem ligadas:
  - `Exige conta de = X` → pelo menos **um** dos lados tem de ter natureza X.
  - `Instituições = MESMA` → as duas contas têm de ter a mesma instituição.
  - `Instituições = DIFERENTES` → as duas contas têm de ter instituições
    diferentes.
  - Se **um dos lados não tem instituição** (caixa), a comparação de
    instituição **não corta nada**.
  - Se uma das naturezas estiver vazia, `Exige conta de` não corta.

---

## 4. Naturezas e instituições das contas (bloco CONTAS)

- **Naturezas válidas:** `CAIXA`, `BANCO`, `ACG`, `CARTAO`
  (`naturezasValidas_`, coluna Natureza com `valores` declarados).
- **R-NAT-1.** Uma natureza fora dessa lista é tratada como desconhecida
  (`nucleoNaturezaConhecida`) — a tela avisa; "não está vazio" não basta.
- **Instituição:** `BB`, `SANT`, `ACG`…; **cartões levam `ACG`**; **caixa não
  tem instituição** (vazio).
- **R-NAT-2 (palavra no papel — `nucleoPalavraDaConta`).** CAIXA → `CAIXA`;
  BANCO **e ACG** → `BANCO`; CARTAO → `CARTÃO`.
- **R-NAT-3 (contas FINANCEIRAS, não contábeis — Etapa 7, decisão dele).** A
  lista CONTAS não tem conta contábil de cartão (as "204.9 CARTÃO DE DÉBITO" e
  "201.9 CARTÃO DE CRÉDITO" foram **aposentadas**). Há **um item "PIA-X:
  CARTÃO DE DÉBITO" por PIA**, natureza `CARTAO`, instituição `ACG`, sem
  código SIGA. A movimentação de cartão continua interna (mesma PIA, 2 PDFs).

### 4.1 Os cartões de cada conta ACG (Etapa 7)

A referência é a listagem de **cartões aptos da PagCorp**, uma por conta
corrente (`cadastros/pagcorp_cartoes_aptos/`); se o cadastro divergir, vale ela.

- **R-CART-1 (`nucleoCartoesDaConta`).** Um cartão ativo é de uma conta ACG
  se: o **Cód. reduzido SIGA** dele (só dígitos) é o **Cód. SIGA** da conta
  (`10115` ↔ `101.15`); **ou** a **conta pai** dele é a **conta corrente
  PagCorp** da conta; **ou** a conta pai é uma das **sub-tesourarias** da
  conta (coluna nova "Sub-tesourarias PagCorp", no fim do bloco CONTAS). O
  código SIGA existe para a planilha antiga: recriar não troca a conta pai
  que já estava escrita.
- **R-CART-2 (`nucleoCartoesDoMovimento`).** Com `CARTAO` de um lado e `ACG`
  do outro, valem os cartões **daquela** conta ACG (nos dois sentidos). Com
  `CARTAO` e outra natureza (o saque no 24h devolvido ao caixa), valem os das
  contas ACG da PIA do cartão. Sem `CARTAO` em nenhum lado, **nenhum**. Com as
  restrições desligadas ou suspensas, todos os ativos.
- **R-CART-3 (na tela).** O campo do cartão (lançamento único) e a coluna do
  documento (lote) oferecem só esses cartões. No lote a coluna se chama
  "Documento / cartão" quando há cartões e "Documento (NF, NFC-e…)" quando não
  há, e o topo da lista diz por quê. NF, NFC-e, número fora do cadastro e texto
  livre continuam livres.
- **R-CART-4 (a trava).** Um número **do cadastro** que a movimentação não
  admite é **vermelho que trava** na tela e recusa no servidor
  (`conferirCartoesDoMovimento_`) — faz parte das restrições. Digitá-lo no
  lote abre a caixa "Este cartão não entra aqui".

---

## 5. Regras entre contas (bloco REGRAS ENTRE CONTAS / `RELACOES`)

Chave do bloco: colunas `[0, 1, 7, 8]` (natureza de origem, natureza de
destino, origem contém, destino contém).

### 5.1 Dados de fábrica

| # | Origem | Destino | Permitidas | Proibidas | Origem contém | Destino contém | Motivo |
|---|---|---|---|---|---|---|---|
| 1 | CAIXA | * | DINHEIRO | | | | Caixa como origem: sai em espécie |
| 2 | * | CAIXA | DINHEIRO; CHEQUE | | | | Caixa como destino: entra por saque |
| 3 | ACG | * | | SAQUE | | | Fintech: não movimenta espécie nem cheque |
| 4 | * | ACG | | SAQUE | | | Fintech: não recebe espécie nem cheque |
| 5 | CARTAO | * | TRANSF. BANCÁRIA | | | | Cartão movimenta por transferência bancária |
| 6 | * | CARTAO | TRANSF. BANCÁRIA | | | | idem |
| 7 | ACG | BANCO | PIX | | | | ACG ↔ outra instituição: só PIX |
| 8 | BANCO | ACG | PIX | | | | idem |
| 9 | CARTAO | CAIXA | DINHEIRO | | | | Exceção: saque no 24h devolvido em espécie |
| 10 | * | * | | SAQUE | SANT | | Sem agência Santander na cidade (LOCAL) |
| 11 | * | * | | SAQUE | | SANT | idem |

Aposentadas: ACG→ACG, ACG→CARTAO, CARTAO→ACG (medido: não mudavam nenhum dos
506 pares — a coluna `Instituições` já dizia o mesmo).

### 5.2 Como as regras se combinam (`nucleoFormasEntre`)

- **R-REL-0.** Se `RESTRICOES_ATIVAS` estiver desligada (`NÃO`, `NAO`,
  `FALSE` ou vazio), **todas as folhas valem** e nada é conferido.
- **R-REL-0b.** Se faltar a natureza de um dos lados, todas as folhas valem.
- **R-REL-1 (par sem regra é livre).** As linhas são restrições, não
  permissões.
- **R-REL-2 (casamento).** Uma regra vale para o par se: está `Ativa` (começa
  com "S"); a natureza de cada lado casa (`*`, vazio ou `QUALQUER` casam com
  tudo); e o texto de cada conta **contém** o pedaço exigido (vazio = qualquer).
- **R-REL-3 (permissões: a mais específica manda).** Especificidade
  (`nucleoEspecificidade`): +1 por natureza preenchida (≠ `*`) em cada lado,
  +2 por "contém" preenchido em cada lado. Só as permissões de **maior**
  pontuação contam, e **se cruzam** entre si (interseção).
- **R-REL-4 (proibições valem sempre).** Toda proibição que casou é subtraída,
  qualquer que seja a especificidade.
- **R-REL-5 (ordem).** Resultado = folhas − proibidas; se houve permissão,
  ∩ permitidas; por último, corta o que a forma não é (R-FORMA-3). Cada corte
  acumula um motivo legível em `motivos`.

### 5.3 Consequências conhecidas (não "consertar" sem conferir)

Pares **impossíveis** sem ninguém ter escrito proibição: caixa ↔ ACG,
caixa ↔ SANT, cartão ↔ banco de outra instituição.

### 5.4 A trava (`conferirRegraEntreContas_`)

Único ponto do projeto que **recusa** em vez de avisar. Roda no servidor, em
`preencherComprovante` e `preencherEGerarPdf`.

- **R-TRAVA-0.** Não roda com `RESTRICOES_ATIVAS` desligada, com
  `mov.restricoesSuspensas === true` (o botão de suspender, R-SUSP-1), nem sem
  as duas contas.
- **R-TRAVA-1.** Par **sem nenhuma forma** permitida → erro "Este movimento
  não é permitido", **mesmo sem forma escolhida**.
- **R-TRAVA-2.** Forma escolhida (vale a subforma, se houver) fora das
  permitidas → erro "Esta forma não é permitida", listando o que vale.
- **R-TRAVA-3.** Toda mensagem de erro ensina as portas de saída: o botão
  "Suspender as restrições…" (até o PDF) e `RESTRICOES_ATIVAS = NÃO`.
- **R-TRAVA-4.** O cartão de outra conta ACG é recusado (R-CART-4).

---

## 6. Finalidades (blocos FINALIDADES e ONDE CADA FINALIDADE VALE)

De fábrica: **26 finalidades** (`F03`–`F28`) e **39 linhas** de onde cada uma
vale. Cada finalidade cita a fonte (manual da obra ou CI); a acrescentada pelo
formulário é marcada como "decisão desta tesouraria" com a data.

| Código | Finalidade |
|---|---|
| F03 | Abastecer o caixa para a reunião de atendimento |
| F04 | Abastecer o caixa de viagens missionárias |
| F05 | Abastecer o caixa do Fundo Musical |
| F06 | Recolher ao banco a sobra do caixa |
| F07 | Custodiar numerário em cofre para emergências |
| F08 | Recolher ao caixa o saldo em espécie do cartão |
| F09 | Suprir a conta ACG para carga de cartões |
| F10 | Devolver ao banco o saldo da conta ACG *(sentido INVERTIDO)* |
| F11 | Cobrir saldo de conta para tarifas bancárias |
| F12 | Concentrar saldo em outra conta bancária da PIA |
| F13 | Carregar cartão pré-pago do colaborador |
| F14 | Devolver à conta ACG o saldo não usado do cartão *(INVERTIDO)* |
| F15 | Transferir saldo entre cartões de colaboradores *(INVERTIDO)* |
| F16 | Transferir saldo entre contas ACG da PIA |
| F17 | Aplicar saldo sem uso imediato |
| F18 | Resgatar aplicação para honrar compromisso |
| F19 | Transferir à Administração valores para compra ou serviço |
| F20 | Receber da Administração o ressarcimento de valores |
| F21 | Suprir a conta ACG de ponto de atendimento agregado |
| F22 | Carregar cartão de colaborador de outro ponto de atendimento |
| F23 | Ressarcir envelope de viagem entre administrações |
| F24 | Remeter à outra administração coletas que lhe cabem |
| F25 | Ressarcir a Administração por compra ou serviço |
| F26 | Devolver valores não utilizados na mesa de atendimento |
| F27 | Desabastecer o caixa de viagens missionárias |
| F28 | Desabastecer o caixa do Fundo Musical |

Regras (`nucleoFinalidadesQueValem`):

- **R-FIN-1 (frentes).** Filtro opcional por `PIEDADE` / `VIAGEM` / `MÚSICA`;
  nenhuma marcada = sem filtro.
- **R-FIN-2.** Sem classificação (faltando conta), devolve **todas** (após o
  filtro de frentes).
- **R-FIN-3 (casamento).** Uma linha de ONDE VALE casa se Tipo, Subtipo,
  Forma, Subforma, natureza de Origem e natureza de Destino casam — comparação
  por `nucleoSimples` (sem acento, caixa alta). **Nunca** pela coluna Folha.
- **R-FIN-4 (vazio não corta, dos dois lados).** Vazio na regra = serve para
  qualquer um; vazio no estado = ainda não escolhido.
- **R-FIN-5.** Por código, basta a **primeira** linha que casar.
- **R-FIN-6 (histórico SIGA).** O histórico da linha de ONDE VALE manda; o da
  finalidade é reserva. Os históricos aparecem **só na tela**, nunca no papel.
- **R-FIN-7 (sentido invertido).** Finalidade com `Sentido = INVERTIDO` gera
  **aviso** (origem recebe crédito) — `nucleoSentidoInvertido` na tela e
  `avisarSentidoInvertido_` na célula.
- **R-FIN-8 (acrescentar pelo formulário).** Nome não pode repetir
  (comparação `nucleoSimples`); código = maior existente + 1 (`F29`…); a
  linha de ONDE VALE recebe a combinação da tela; Folha fica vazia.

---

## 7. Textos compostos que vão ao papel

- **R-TXT-1 (campo Tipo Transferência — `nucleoTextoDoTipo`).**
  `subtipo · forma · subforma · finalidade`, em caixa alta, só as partes
  existentes. **O tipo principal não entra** (já está no título). Movimentação
  interna sem forma → campo em branco.
- **R-TXT-2 (tamanho).** Acima de 95 caracteres, **aviso** de que o PDF pode
  cortar (`nucleoTipoCabeNaLinha`; a linha comporta ~100).
- **R-TXT-3 (Observação — `nucleoObservacaoDoDocumento`).** Na frente do que
  foi digitado entra a frase das contas envolvidas: `ENTRE CAIXAS`,
  `ENTRE BANCOS`, `ENTRE CARTÕES`, `ENTRE CAIXA E BANCO`,
  `ENTRE CAIXA E CARTÃO`, `ENTRE BANCO E CARTÃO`. Ordem fixa
  caixa → banco → cartão (descreve o par, não o sentido). Formato:
  `FRASE. texto digitado` ou `FRASE.`. Se o texto já começa com a frase, não
  repete.
- **R-TXT-4 (cartão na conta — `nucleoContaComCartao`).** Com número de
  cartão informado, a conta sai como `CONTA Nº 123456`; se o número já está no
  texto, não repete. Vale para origem e destino (`nucleoLadoDoCartao`:
  `origem` / `destino` / `ambos`). Em lote o campo não aparece (o cartão vai
  na coluna DOCUMENTO / CARTÃO).

---

## 8. Nota de praxe (aviso, não trava)

- **R-PRAXE-1 (`nucleoPraxeDoCartao`).** Com `PRAXE_CARTAO_NA_MESMA_PIA`
  ligada, se um dos lados é CARTAO e as PIAs são diferentes, a tela mostra uma
  nota: a praxe de Coxim é o cartão ser movimentado pela tesouraria do próprio
  departamento. Não impede nada; `NÃO` na chave desliga.

---

## 9. Regras de outros arquivos que dependem do núcleo

| Regra | Onde | Resumo |
|---|---|---|
| Referência | `02_Cadastros.gs` | `PREFIXO-AA/NNN` (ex.: `CMP-26/001`); reinicia no ano novo; só anda para a frente; repetida não consome de novo; consumida ao gerar PDF (não em segunda via, não na cópia em planilha). |
| Referência (aviso) | `03_Formulas_Validacoes.gs` | Caractere fora de `A-Z a-z 0-9 - /` → aviso no canto da tela (`toast`). **Sem anotação na célula** desde a Etapa 7 (pedido k). |
| Origem = destino | `03_Formulas_Validacoes.gs` | Mesma PIA e mesma conta → aviso no canto da tela. |
| Proteção da aba | `01_Layout_Comprovante.gs` | Só o **extenso** (R7:R8) é protegido, por aviso; o resto da aba é livre para editar à mão. A aba não tem anotação nenhuma; a planilha antiga se arruma no 1º preenchimento (`arrumarProtecoesUmaVez_`). |
| Extenso | `03_Formulas_Validacoes.gs` | Caixa alta, entre parênteses, "UM MIL" (`DIZER_UM_ANTES_DE_MIL`), "DE REAIS" só em milhão redondo. |
| Cabeçalho | `03_Formulas_Validacoes.gs` + `04_Formulario.gs` | Endereço, cidade e CNPJ/IE da ADM de **quem produz o documento** (`ladoDoCabecalho_`): origem na Aprovação, no Pagamento e na Efetivação; **destino no Recebimento**. |
| Assinantes | `04_Formulario.gs` | 6 lugares; "mesmos em todas as etapas" usa `TODAS`; nome/cargo sem caixa alta. |
| Numeração SIGA | `04_Formulario.gs` | Opcional; vazia → o rótulo também some. |

---

## 10. Emissão dos PDFs (`05_Gerar_PDF.gs`, `emitirMovimentacao_`)

- **R-EMI-1 (etapas).** Sai **um PDF por etapa marcada** em
  `etapasEscolhidas` (a caixa de gerar: uma, duas quaisquer ou todas), na
  ordem de `etapasDaMovimentacao_` — contadas **no servidor, pelas contas**
  (`etapasPelasContas_`). Etapa marcada que não existe é ignorada; se nenhuma
  existe, é **erro**. Faltando uma conta, sai só `etapaAtual`. Compatibilidade:
  `todasAsEtapas` (tela antiga) gera todas; sem nenhum dos dois, `etapaAtual`.
- **R-EMI-1b (menu).** `gerarPdfDoComprovante` abre o formulário já na caixa
  de escolha (`abrirFormularioCmi(true)`): o menu passa pela mesma emissão.
- **R-EMI-2 (preenchimento).** Cada etapa passa por `preencherComprovante`
  inteiro, com Status e assinantes daquela etapa (`movDaEtapa_`). Não existe
  atalho que troque só o Status.
- **R-EMI-3 (cabeçalho).** `ladoDoCabecalho_(etapa)`: `RECEBIDA` → ADM de
  destino; as outras → ADM de origem. PIA do cabeçalho fora do bloco ADMs →
  **aviso** no resultado.
- **R-EMI-4 (Referência).** Consumida **uma vez** por emissão, depois dos
  PDFs, se **ao menos um** saiu; nunca em segunda via.
- **R-EMI-5 (falha parcial).** Uma etapa recusada não interrompe as outras;
  o resultado lista `falhas`. Se **nenhuma** sai, o erro sobe e nada é gasto
  nem registrado.
- **R-EMI-6 (Google ocupado).** O pedido do PDF (`pdfDaAba_`) espera
  2 s × tentativa e repete, até 3 vezes, em 429 e 5xx; outros códigos não se
  repetem.
- **R-EMI-7 (`.md`).** Um por Referência (`<ref>.md` — `CMP-26-001.md` —, na pasta dos PDFs):
  cria; se já existe, **reescreve** — exceto em **segunda via**, que
  **mantém** o do original. Termina com o JSON do `mov`.
- **R-EMI-8 (Histórico).** Uma linha por PDF na aba `Histórico` (criada
  sozinha, protegida por aviso), gravada **pelo nome da coluna**; coluna que
  falta é acrescentada no fim. Formato antes do valor: tudo texto, menos
  `Data de emissão` (data) e `Valor` (número). `Emitido em` é lido do carimbo
  impresso.
- **R-EMI-9 (avisar, não derrubar).** Falha no `.md` ou no Histórico vira
  **aviso** no resultado; os PDFs continuam emitidos.
- **R-EMI-10 (Histórico, Etapa 6).** Duas colunas no fim: `Linhas do lote`
  (JSON das linhas do lote: data `aaaa-mm-dd`, documento e beneficiário em
  caixa alta, valor; vazia no único) e `Emissão` (a hora do 1º PDF do clique,
  igual em todos os PDFs dele).
- **R-EMI-11 (nomes).** PDF `<ref>-<ETAPA> - AA_MM_DD.pdf` e `.md` `<ref>.md`,
  sem o `CMI-` da sigla antiga (Etapa 6).

---

## 11. Relatório mensal (`07_Relatorio_Mensal.gs`)

Detalhe e porquês em `16_relatorio_mensal.md`.

- **R-REL-MES-1 (o que é).** Lista dos comprovantes gerados **por este app**
  num mês, **um lançamento por linha** (único = 1; lote = uma por linha do
  lote). **Não soma valores** em lugar nenhum — há comprovante gerado direto
  no SIGA; só conta comprovantes e lançamentos.
- **R-REL-MES-2 (uma vez por comprovante).** O Histórico é agrupado pela
  **Referência** (`comprovantesDoHistorico_`); nunca pela etapa 1.
- **R-REL-MES-3 (emissão).** Linhas seguidas da mesma Referência formam a
  mesma emissão se tiverem a mesma `Emissão`, o mesmo "Como saiu o número", o
  mesmo motivo e nenhuma etapa repetida (`emissoesDe_`).
- **R-REL-MES-4 (segunda via).** Não repete o comprovante; só entra nas
  exceções. Comprovante com **só** segunda via no Histórico aparece, marcado.
- **R-REL-MES-5 (correção).** Valem os **dados** da emissão mais nova que não
  seja segunda via — inclusive a data, que decide o mês.
- **R-REL-MES-6 (PDFs gerados).** União das etapas de todas as emissões
  (menos as de segunda via) **que tenham o mesmo total de etapas da versão
  atual** ("x de N"), na ordem APROVADA, PAGA, EFETIVADA, RECEBIDA; a
  etapa que não saiu na emissão mais nova leva `(antes da correção)` — ou
  `(emissão anterior)`, se a mais nova não for correção.
- **R-REL-MES-7 (mês).** O da **Data de emissão** do comprovante; no lote, a
  data de cada linha. O comprovante entra no mês se alguma linha cair nele.
- **R-REL-MES-8 (exceções).** Correção, segunda via e número escrito à mão
  aparecem numa parte própria, uma linha por emissão, em ordem de Referência,
  com o motivo — só informativa.
- **R-REL-MES-9 (como saiu o número).** Lido do texto gravado no Histórico
  (`comoSaiuONumero_`), sem acento e sem caixa; há conferência que amarra esse
  texto ao de `rotuloDaReferencia_`.
- **R-REL-MES-10 (saída).** A aba `Relatório` é refeita do zero a cada pedido,
  protegida por aviso. O PDF sai deitado, ajustado à largura, com páginas
  numeradas, na pasta dos comprovantes, com o nome
  `Relatório CMP - AAAA-MM - AA_MM_DD.pdf`; é refeito antes de exportar.
- **R-REL-MES-11 (segunda via com dados diferentes).** Continua não valendo
  (valem os dados do original), e a exceção diz "COM DADOS DIFERENTES do
  original" quando Nº SIGA, data, contas, forma, finalidade, lançamentos,
  valor, observação ou linhas do lote mudaram.
- **R-CORR-1 (motivo da correção).** Ao gerar uma correção, o sistema compara
  com a versão que vale daquela Referência no Histórico e escreve no motivo
  o que mudou: `Corrigir um comprovante — corrigidos: data de emissão e valor
  — <complemento>`. Campos comparados, nessa ordem: data de emissão,
  numeração SIGA, valor, conta de origem, conta de destino, forma,
  finalidade, observação, lançamentos do lote, signatários (por etapa). Sem
  versão anterior, ou sem mudança, isso também é escrito.
- **R-CORR-2 (a prévia).** Enquanto a pessoa corrige, a caixa roxa já mostra
  o que mudou (`previaDaCorrecao`, no 07), pela **mesma** comparação da
  R-CORR-1 — a prévia e o registro não podem discordar. A tela pergunta ao
  servidor 0,7 s depois da última mudança, e não a cada tecla; com um 07
  antigo (sem a função), mostra só o nome da escolha.
- **R-2VIA-1 (segunda via não muda nada).** Com "Segunda via" escolhida,
  todo gesto nos campos (foco, clique, tecla) é barrado, e uma caixa roxa
  explica, com "Emitir a segunda via como está", "Mudar para Corrigir um
  comprovante" (que devolve o cursor ao campo) e "Voltar". Livres: o painel
  roxo, a Conferência e o rodapé. Os campos travados ficam lilases. Pedido
  dele, 24/09/2026 — é a segunda coisa do projeto que impede em vez de avisar.
- **R-2VIA-2 (a tela é o original?).** A mesma comparação da R-CORR-2 diz,
  na caixa roxa, se o que está na tela é o original daquela Referência, ou
  em que difere, ou que a Referência não está no Histórico. É aviso: a trava
  segura o que já está na tela. Desde a Etapa 7 o `.md` do original pode ser
  trazido de volta (R-MD-1), e é o jeito certo de fazer a segunda via de um
  comprovante antigo.
- **R-TELA-GERANDO.** Enquanto preenche ou gera, uma caixa **trava o
  formulário**, com a borda azul pulsando (a faixa azul pulsa junto). Não tem
  botão e o Esc não a fecha; ela some quando a caixa do resultado (verde ou
  vermelha) toma o lugar — e um erro da própria tela ao mostrar o resultado
  também vira caixa vermelha, para ela nunca ficar presa.
- **R-EXC-1 (motivo das exceções).** O motivo começa pelo nome da escolha
  ("Segunda via de um comprovante já emitido", "Histórico perdido ou fora de
  alcance", "Corrigir um comprovante"), e o que a pessoa escreve é
  complemento.
- **R-FILA-1 (escrita).** Na fila de escritas, a mesma célula pode entrar
  mais de uma vez; vale a última (`fecharEscritor_`).

---

## 12. Etapa 7A — o formulário e o menu (`docs/09`, seção 6.2)

- **R-MD-1 (trazer os dados de um .md — `nucleoComprovanteDoArquivo`).** O
  painel roxo lê o `.md` escolhido no computador (o navegador lê; nada vai ao
  Drive). Vale o **último** bloco ```json. Dois formatos: o do formulário (a
  movimentação, como está) e o da aba (`"fonte": "aba"`: contas em caixa alta,
  Tipo composto, Observação com a frase das contas na frente — traduzido). O
  que não casa com o cadastro volta **em branco e marcado**; a forma e a
  finalidade de um `.md` da aba também (o papel não as diz). Depois, a pessoa
  escolhe: **corrigir** (mesmo número), **segunda via** ou **aproveitar num
  comprovante novo**. É assim que se corrige **qualquer** comprovante (pedido b).
- **R-EXP-1 (exportar sem PDF — `08_Exportar.gs`).** "Exportar…" do formulário
  **preenche** e exporta: Excel (baixa), planilha do Google (fica na pasta, com
  uma aba por etapa) ou `.md` (baixa). O menu "Exportar o comprovante da aba"
  exporta a aba **como está**, e o `.md` dela vem do papel (`"fonte": "aba"`).
  Nenhum gasta a Referência, nenhum entra no Histórico, nenhum religa as
  restrições. Com a regra quebrada, o Exportar trava junto com o Preencher.
- **R-MD-2 (todo PDF gera o `.md`).** Continua (R-EMIT); o `.md` exportado vai
  para o computador e não substitui o da pasta.
- **R-BAND-1 (bandeiras só ao gerar).** Todo aviso amarelo, e todo vermelho
  que não trava, é **bandeira**: aparece numa caixa entre "Gerar N PDFs" e o
  envio, nunca durante o preenchimento. Cada uma: Ignorar (riscada, vai para o
  rodapé como "Será ignorado") ou Corrigir (fecha e leva ao campo, com a lista
  aberta). Botões: "Gerar CMP nº X mesmo assim", "Voltar e corrigir" (o
  primeiro não ignorado), "Ignorar tudo e gerar". Os ignorados valem até fechar
  a janela. "Fora da sequência, de propósito" é **nota** (azul), não bandeira.
- **R-RODAPE-1.** O que trava ("Falta escolher conta", movimento ou forma
  proibidos, natureza inválida, cartão de outra conta) vai para o rodapé:
  "Não dá para gerar: …", vermelho enquanto existir, clicável.
- **R-FAIXA-1.** Toda faixa do topo abre a caixa — a azul também, menos por
  cima da caixa travada e antes de a tela estar de pé. Fechar a caixa não apaga
  a faixa.
- **R-LOTE-1.** A linha nova do lote nasce com a data da linha de cima (a 1ª,
  com a data de emissão). **R-LOTE-2.** Enter no valor da última linha
  acrescenta outra, com o cursor no documento. **R-LOTE-3.** Data menor que a
  da linha de cima é bandeira ("Datas do lote fora de ordem").
- **R-SUSP-1 (suspender as restrições).** O botão da barra do topo desliga as
  regras entre contas e dos cartões **até gerar o PDF ou fechar a janela**;
  exportar não religa. Sinal: moldura listrada preta e amarela, faixa presa no
  alto com "Religar agora", aviso no rodapé, caixa ao ligar. O PDF sai com
  `restricoesSuspensas: true` e fica marcado no Histórico (coluna
  **Restrições**) e no `.md`. Com `RESTRICOES_ATIVAS = NÃO`, o botão some.
- **R-TELA-1 (layout).** As seções uma abaixo da outra, na largura toda
  (pedido i). Não se reabre.

