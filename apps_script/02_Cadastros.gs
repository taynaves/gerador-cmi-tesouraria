/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * ETAPA 2: aba "Cadastros" — a fonte viva das listas do sistema.
 *
 * O QUE ESTA ABA É
 * É de onde saem todas as listas do formulário: contas, cartões, diáconos,
 * tipos de movimentação, status, ADMs/CNPJ, abreviaturas de bancos e o
 * controle da numeração. Quem edita aqui muda o sistema inteiro — não há
 * lista escrita dentro do código.
 *
 * COMO ELA É ORGANIZADA
 * Cada lista é um BLOCO de colunas, lado a lado, separados por uma coluna
 * estreita. É de propósito: assim, acrescentar uma linha numa lista (um
 * cartão novo, um diácono novo) nunca empurra nem bagunça as outras.
 *   - linha 1: nome do bloco, colorido;
 *   - linha 2: cabeçalho das colunas;
 *   - linha 3 em diante: os dados. Para incluir, escreva na primeira linha
 *     vazia do bloco.
 * As duas primeiras linhas ficam congeladas.
 *
 * Cada bloco também vira um INTERVALO NOMEADO (CAD_CONTAS, CAD_CARTOES,
 * CAD_DIACONOS, CAD_FORMAS, CAD_RELACOES, CAD_FINALIDADES,
 * CAD_REGRAS_FINALIDADE, CAD_STATUS, CAD_ADMS, CAD_BANCOS, CAD_CONTROLE),
 * com folga de linhas em branco. É assim que as próximas etapas leem os dados
 * sem depender de "coluna C, linha 5".
 *
 * ATENÇÃO: rodar `criarAbaCadastros` NÃO apaga o que já está na aba — ela
 * preserva o que existe, acrescenta linha nova, completa coluna nova e tira
 * só o que estiver na lista `aposentadas` de cada bloco. O que ela NÃO faz é
 * trocar o valor de uma célula que já tem dono; para isso existe a janela
 * "Importar dados para os Cadastros", em modo SUBSTITUIR.
 */

var ABA_CADASTROS = 'Cadastros';

/**
 * Espaço em branco reservado abaixo de cada lista, para crescer.
 *
 * Baixou de 200 para 60. Duzentas linhas vazias × onze listas × onze colunas
 * é planilha que o Google carrega toda vez — na leitura dos cadastros e,
 * principalmente, **na hora de montar o PDF**, que é hoje a parte mais lenta.
 * Sessenta continua sendo o dobro da maior lista (42 cartões), e a aba pode
 * ganhar linhas a qualquer momento.
 */
var LINHAS_DE_FOLGA = 60;

/** Limite de letras de uma abreviatura de banco. */
var MAX_LETRAS_ABREVIATURA = 6;

/** Cada bloco é uma lista. A ordem aqui é a ordem das colunas na aba. */
var BLOCOS_CADASTRO = [
  // A codificação do plano de contas é a MESMA em toda PIA, de toda ADM, de
  // toda regional: 100.10 é o caixa da Piedade em qualquer lugar. O que muda é
  // quais contas estão criadas e ativas. Contas de VIAGEM (100.20, 101.13,
  // 101.20) e de MÚSICA (101.14) só existem na PIA da sede da regional — em
  // nenhum outro ponto de atendimento elas ficam ativas.
  {
    id: "CONTAS",
    titulo: "CONTAS POR PIA",
    // Quem identifica a conta é o TEXTO da lista, não a PIA: PIA-COXIM se
    // repete em onze linhas. Ver `chaveDaLinha_`.
    chave: 5,
    cor: "#1c4587",
    colunas: [
      { nome: "PIA", px: 95 },
      { nome: "ADM", px: 110 },
      { nome: "Grupo cont\u00e1bil", px: 150 },
      { nome: "C\u00f3d. SIGA", px: 65 },
      { nome: "Conta PagCorp", px: 85 },
      { nome: "Texto que aparece na lista", px: 280 },
      // A natureza da conta: CAIXA, BANCO, ACG ou CARTAO. É por ela que as
      // regras de relacionamento decidem que formas de movimentação valem
      // entre duas contas — "a ACG nunca recebe espécie" é uma regra sobre a
      // NATUREZA, não sobre uma conta em particular. Deduzir isso do texto da
      // conta seria adivinhação; aqui está escrito.
      // A lista fechada não é enfeite: é ela que permite PROVAR que uma linha
      // está desalinhada. Natureza guardando "Ativa" é impossível num cadastro
      // correto — e foi exatamente o que aconteceu (ver consertarDeslocamento_).
      { nome: "Natureza", px: 90, valores: ["CAIXA", "BANCO", "ACG", "CARTAO"] },
      { nome: "Status", px: 95 },
      { nome: "Observa\u00e7\u00e3o", px: 300 },
      // COLUNA NOVA VAI NO FIM. A INSTITUIÇÃO da conta — BB, SANT, ACG —, e
      // não o banco por extenso: é a mesma abreviatura de até 6 letras que o
      // texto da conta já usa.
      //
      // Ela existe porque três formas dependem de comparar as duas pontas:
      // TRANSF. BANCÁRIA só vale dentro da MESMA instituição, e TED e PIX só
      // entre instituições DIFERENTES. Sem esta coluna, a única saída seria
      // adivinhar o banco lendo o texto da conta — e adivinhar aqui é o mesmo
      // erro que a coluna Natureza já veio consertar.
      //
      // Vazia = conta sem instituição (os caixas). Aí a comparação não
      // acontece e a restrição simplesmente não corta nada — comparar com o
      // que não existe seria inventar resposta.
      //
      // Os CARTÕES levam ACG de propósito: o cartão pré-pago é emitido pela
      // ACG/PagCorp e vive dentro dela. É por isso que carregar cartão é
      // transferência bancária (mesma instituição) e não PIX.
      { nome: "Institui\u00e7\u00e3o", px: 90 },
    ],
    dados: [
      ["PIA-COXIM", "ADM Coxim-MS", "100 - CAIXA", "100.10", "-", "PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE", "CAIXA", "Ativa", "", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "100 - CAIXA", "100.20", "-", "PIA-COXIM: 100.20 - CAIXA VIAGENS MISSION\u00c1RIAS", "CAIXA", "Ativa", "", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "100 - CAIXA", "100.30", "-", "PIA-COXIM: 100.30 - CAIXA ASSEMBL\u00c9IAS E REUNI\u00d5ES", "CAIXA", "Ativa", "", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.10", "-", "PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE", "BANCO", "Ativa", "", "BB"],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.12", "-", "PIA-COXIM: 101.12 - SANT - AG:3109 CC:130027576 - PIEDADE", "BANCO", "Ativa", "", "SANT"],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.13", "-", "PIA-COXIM: 101.13 - SANT - AG:3109 CC:130027569 - VIAGEM", "BANCO", "Ativa", "", "SANT"],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.14", "-", "PIA-COXIM: 101.14 - SANT - AG:3109 CC:130027583 - M\u00daSICA", "BANCO", "Ativa", "", "SANT"],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.15", "127866218", "PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE", "ACG", "Ativa", "Conta \u00fanica no SIGA; no PagCorp se subdivide em duas sub-tesourarias de cart\u00e3o (Atendimento=127866192 e Secretaria=128175981) - n\u00e3o s\u00e3o contas de Origem/Destino separadas, s\u00f3 categorias de cart\u00e3o", "ACG"],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.20", "127865707", "PIA-COXIM: 101.20 - ACG - AG:01 CC:127865707 - VIAGEM", "ACG", "Ativa", "", "ACG"],
      ["PIA-COXIM", "ADM Coxim-MS", "204 - OUTRAS OBRIGA\u00c7\u00d5ES", "204.9", "-", "PIA-COXIM: 204.9 - CART\u00c3O DE D\u00c9BITO", "CARTAO", "Ativa", "", "ACG"],
      ["PIA-COXIM", "ADM Coxim-MS", "201 - OUTRAS OBRIGA\u00c7\u00d5ES", "201.9", "-", "PIA-COXIM: 201.9 - CART\u00c3O DE CR\u00c9DITO", "CARTAO", "Ativa", "", "ACG"],
      ["PIA-SONORA", "ADM Coxim-MS", "100 - CAIXA", "100.10", "-", "PIA-SONORA: 100.10 - CAIXA OBRA DA PIEDADE", "CAIXA", "Ativa", "", ""],
      ["PIA-SONORA", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.16", "127884146", "PIA-SONORA: 101.16 - ACG - AG:01 CC:127884146 - PIEDADE", "ACG", "Ativa", "", "ACG"],
      ["PIA-SONORA", "ADM Coxim-MS", "201 - OUTRAS OBRIGA\u00c7\u00d5ES", "201.9", "-", "PIA-SONORA: 201.9 - CART\u00c3O DE CR\u00c9DITO", "CARTAO", "Ativa", "", "ACG"],
      ["PIA-SONORA", "ADM Coxim-MS", "204 - OUTRAS OBRIGA\u00c7\u00d5ES", "204.9", "-", "PIA-SONORA: 204.9 - CART\u00c3O DE D\u00c9BITO", "CARTAO", "Ativa", "", "ACG"],
      ["PIA-S\u00c3O GABRIEL", "ADM Coxim-MS", "100 - CAIXA", "100.10", "-", "PIA-S\u00c3O GABRIEL: 100.10 - CAIXA OBRA DA PIEDADE", "CAIXA", "Ativa", "", ""],
      ["PIA-S\u00c3O GABRIEL", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.17", "127884427", "PIA-S\u00c3O GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE", "ACG", "Ativa", "", "ACG"],
      ["PIA-S\u00c3O GABRIEL", "ADM Coxim-MS", "201 - OUTRAS OBRIGA\u00c7\u00d5ES", "201.9", "-", "PIA-S\u00c3O GABRIEL: 201.9 - CART\u00c3O DE CR\u00c9DITO", "CARTAO", "Ativa", "", "ACG"],
      ["PIA-S\u00c3O GABRIEL", "ADM Coxim-MS", "204 - OUTRAS OBRIGA\u00c7\u00d5ES", "204.9", "-", "PIA-S\u00c3O GABRIEL: 204.9 - CART\u00c3O DE D\u00c9BITO", "CARTAO", "Ativa", "", "ACG"],
      ["PIA-ALCIN\u00d3POLIS", "ADM Coxim-MS", "100 - CAIXA", "100.10", "-", "PIA-ALCIN\u00d3POLIS: 100.10 - CAIXA OBRA DA PIEDADE", "CAIXA", "Inativa (futura)", "", ""],
      ["PIA-ALCIN\u00d3POLIS", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "A definir", "128091675", "PIA-ALCIN\u00d3POLIS: ACG - AG:01 CC:128091675 - PIEDADE", "ACG", "Inativa (futura)", "Aguardando SIGA atribuir c\u00f3digo reduzido", "ACG"],
      ["PIA-ALCIN\u00d3POLIS", "ADM Coxim-MS", "201 - OUTRAS OBRIGA\u00c7\u00d5ES", "201.9", "-", "PIA-ALCIN\u00d3POLIS: 201.9 - CART\u00c3O DE CR\u00c9DITO", "CARTAO", "Inativa (futura)", "", "ACG"],
      ["PIA-ALCIN\u00d3POLIS", "ADM Coxim-MS", "204 - OUTRAS OBRIGA\u00c7\u00d5ES", "204.9", "-", "PIA-ALCIN\u00d3POLIS: 204.9 - CART\u00c3O DE D\u00c9BITO", "CARTAO", "Inativa (futura)", "", "ACG"],
      ["PIA-COSTA", "ADM Costa Rica-MS", "100 - CAIXA", "100.10", "-", "PIA-COSTA: 100.10 - CAIXA OBRA DA PIEDADE", "CAIXA", "Ativa", "", ""],
      ["PIA-COSTA", "ADM Costa Rica-MS", "101 - BANCOS CONTA MOVIMENTO", "A definir", "128175700", "PIA-COSTA: ACG - AG:01 CC:128175700 - PIEDADE", "ACG", "Ativa", "Conta \u00fanica de Origem/Destino da PIA-COSTA. No PagCorp se subdivide em duas sub-tesourarias de cart\u00e3o (Atendimento=127884955 e Secretaria=127884922) - n\u00e3o s\u00e3o contas de Origem/Destino separadas, s\u00f3 categorias de cart\u00e3o. Aguardando o c\u00f3digo reduzido do SIGA", "ACG"],
      ["PIA-COSTA", "ADM Costa Rica-MS", "201 - OUTRAS OBRIGA\u00c7\u00d5ES", "201.9", "-", "PIA-COSTA: 201.9 - CART\u00c3O DE CR\u00c9DITO", "CARTAO", "Ativa", "", "ACG"],
      ["PIA-COSTA", "ADM Costa Rica-MS", "204 - OUTRAS OBRIGA\u00c7\u00d5ES", "204.9", "-", "PIA-COSTA: 204.9 - CART\u00c3O DE D\u00c9BITO", "CARTAO", "Ativa", "", "ACG"],
    ]
  },
  {
    id: "CARTOES",
    titulo: "CART\u00d5ES PR\u00c9-PAGOS",
    cor: "#38761d",
    colunas: [
      { nome: "N\u00ba conta do cart\u00e3o", px: 95 },
      { nome: "Titular (PagCorp)", px: 230 },
      { nome: "PIA", px: 95 },
      { nome: "Sub-tesouraria", px: 150 },
      { nome: "Conta pai PagCorp", px: 95 },
      { nome: "C\u00f3d. reduzido SIGA", px: 110 },
      { nome: "Nome conforme SIGA", px: 230 },
      { nome: "Consta no SIGA?", px: 150 },
      { nome: "Tipo de cart\u00e3o", px: 170 },
      { nome: "Status", px: 60 },
      { nome: "Observa\u00e7\u00e3o", px: 320 },
    ],
    dados: [
      ["127684660", "Nilson di\u00e1cono (VIAGEM 46.60)", "PIA-COXIM", "VIAGEM", "127865707", "10120", "117031 - NILSON SANT ANNA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699031", "Lindomar (VIAGEM)", "PIA-COXIM", "VIAGEM", "127865707", "10120", "129288 - LINDOMAR DOS ANJOS SOUZA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699049", "Nandinho/Edinaldo di\u00e1cono (VIAGEM 90.49)", "PIA-COXIM", "VIAGEM", "127865707", "10120", "102212 - EDINALDO FERNANDES DA SILVA JUNIOR", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699221", "Tayn\u00e3 di\u00e1cono (VIAGEM 92.21)", "PIA-COXIM", "VIAGEM", "127865707", "10120", "187341 - TAYN\u00c3 ARAUJO NAVES", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699247", "Adalto di\u00e1cono (VIAGEM 92.47)", "PIA-COXIM", "VIAGEM", "127865707", "10120", "102214 - ADALTO AZEVEDO PEREIRA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699478", "Dede/Jos\u00e9 Cavalcanti di\u00e1cono (VIAGEM 94.78)", "PIA-COXIM", "VIAGEM", "127865707", "10120", "36501 - JOS\u00c9 CAVALCANTI COSTA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699486", "Cristiane irm\u00e3 da piedade (VIAGEM 94.86 - Centro Custo: Viagem Costa)", "PIA-COXIM (conta) / uso Costa?", "VIAGEM", "127865707", "10120", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "Cartao presente na PagCorp mas AUSENTE da lista de cartoes viagem do SIGA enviada. Centro de custo aponta Costa, mas a conta ACG e a de Viagem-Coxim (10120). Verificar."],
      ["127699684", "Jos\u00e9 Martini (VIAGEM)", "PIA-COXIM", "VIAGEM", "127865707", "10120", "374290 - JOSE MARTINI", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699718", "Mariene irm\u00e3 da piedade (VIAGEM 97.18)", "PIA-COXIM", "VIAGEM", "127865707", "10120", "367393 - MARIENE MATEUS DA FONSECA SILVA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127700326", "Jo\u00e3o Torquato di\u00e1cono (VIAGEM 03.26)", "PIA-COXIM", "VIAGEM", "127865707", "10120", "80585 - JO\u00c3O TORQUATO DE SOUZA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698298", "Sandra irm\u00e3 da piedade (ATENDIMENTO 82.98)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "1072126 - SANDRA LEITE TELES", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698421", "Neta/Francisca irm\u00e3 da piedade (ATENDIMENTO 84.21)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "365141 - FRANCISCA PEREIRA RIBOLIS", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698603", "Let\u00edcia irm\u00e3 da piedade (ATENDIMENTO 86.03)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "212723 - LETICIA CORONEL DA COSTA BOZE DOS SANTOS", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698694", "Kelen irm\u00e3 da piedade (ATENDIMENTO 86.94)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "367401 - KELEN ADRIANA CARRENHO RIBEIRO", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698702", "Rosalda irm\u00e3 da piedade (ATENDIMENTO 87.02)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "406815 - ROSALDA OLIVEIRA BARBOSA DE PAULA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698801", "Mariene irm\u00e3 da piedade (ATENDIMENTO 88.01)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "367393 - MARIENE MATEUS DA FONSECA SILVA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698827", "Ramona irm\u00e3 da piedade (ATENDIMENTO 88.27)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "177915 - RAMONA VIEIRA DIAS DE OLIVEIRA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698850", "Andreia irm\u00e3 da piedade (ATENDIMENTO 88.50)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "177916 - ANDR\u00c9IA DA SILVA FERREIRA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699064", "Tayn\u00e3 di\u00e1cono (apelido diz M\u00daSICA 90.64, mas Conta Pai \u00e9 Atendimento)", "PIA-COXIM", "ATENDIMENTO (diverg\u00eancia ver observa\u00e7\u00e3o)", "127866192", "10115", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "Apelido cita MUSICA mas o cartao esta hierarquicamente em Atendimento (Pia Coxim), nao na conta Musica (128084027/10161). Nao consta na lista SIGA de Atendimento. Verificar classificacao antes de cadastrar."],
      ["127699239", "Tayn\u00e3 di\u00e1cono (ATENDIMENTO 92.39)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "187341 - TAYN\u00c3 ARAUJO NAVES", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699429", "Adalto di\u00e1cono (ATENDIMENTO 94.29)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "102214 - ADALTO AZEVEDO PEREIRA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699593", "Jo\u00e3o Torquato di\u00e1cono (ATENDIMENTO 95.93)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "080585 - JO\u00c3O TORQUATO DE SOUZA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699668", "Nilson di\u00e1cono (ATENDIMENTO 96.68)", "PIA-COXIM", "ATENDIMENTO", "127866192", "10115", "117031 - NILSON SANT ANNA", "Sim", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699262", "Dede/Jos\u00e9 Cavalcanti di\u00e1cono (ATENDIMENTO 92.62)", "PIA-COXIM", "ATENDIMENTO (Conta Pai no PagCorp \u00e9 o n\u00edvel acima, 127865715)", "127865715", "10115", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698876", "Gerson colab. piedade (SECRETARIA 88.76)", "PIA-COXIM", "SECRETARIA", "128175981", "10115", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "Cartao de Secretaria (Pia Coxim) presente na PagCorp, mas AUSENTE da lista de cartoes Piedade do SIGA enviada -- apesar de o cartao 127698876 (Gerson) ja ter sido usado em comprovante real anexado ao SIGA anteriormente. Verificar cadastro no SIGA."],
      ["127699726", "Tayn\u00e3 di\u00e1cono (SECRETARIA 97.26)", "PIA-COXIM", "SECRETARIA", "128175981", "10115", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "Cartao de Secretaria (Pia Coxim) presente na PagCorp, mas AUSENTE da lista de cartoes Piedade do SIGA enviada -- apesar de o cartao 127698876 (Gerson) ja ter sido usado em comprovante real anexado ao SIGA anteriormente. Verificar cadastro no SIGA."],
      ["127698900", "Evanir irm\u00e3 da piedade (ATENDIMENTO uni\u00e3o 89.00)", "PIA-SONORA", "ATENDIMENTO", "127884146", "10116", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698918", "Maria Lucia irm\u00e3 da piedade (ATENDIMENTO centro 89.18)", "PIA-SONORA", "ATENDIMENTO", "127884146", "10116", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698942", "Edenir irm\u00e3 da piedade (ATENDIMENTO piquiri 89.42)", "PIA-SONORA", "ATENDIMENTO", "127884146", "10116", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699130", "Nandinho di\u00e1cono (ATENDIMENTO 91.30)", "PIA-SONORA", "ATENDIMENTO", "127884146", "10116", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698959", "Rute irm\u00e3 da piedade (ATENDIMENTO 89.59)", "PIA-S\u00c3O GABRIEL", "ATENDIMENTO", "127884427", "10117", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699007", "No\u00eamia irm\u00e3 da piedade (ATENDIMENTO 90.07)", "PIA-S\u00c3O GABRIEL", "ATENDIMENTO", "127884427", "10117", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127699742", "Lindomar di\u00e1cono (ATENDIMENTO 97.42)", "PIA-S\u00c3O GABRIEL", "ATENDIMENTO", "127884427", "10117", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", ""],
      ["127698652", "Ruth irm\u00e3 da piedade (ATENDIMENTO 86.52)", "PIA-COSTA", "ATENDIMENTO", "127884955", "PENDENTE (sem c\u00f3digo SIGA informado)", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "ADM Costa Rica ainda sem codigo de conta reduzida SIGA informado para esta sub-tesouraria -- usar o numero de conta PagCorp como identificador provisorio ate confirmacao."],
      ["127699015", "Dalva irm\u00e3 da piedade (ATENDIMENTO 90.15)", "PIA-COSTA", "ATENDIMENTO", "127884955", "PENDENTE (sem c\u00f3digo SIGA informado)", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "ADM Costa Rica ainda sem codigo de conta reduzida SIGA informado para esta sub-tesouraria -- usar o numero de conta PagCorp como identificador provisorio ate confirmacao."],
      ["127699080", "Erenilda irm\u00e3 da piedade (ATENDIMENTO 90.80)", "PIA-COSTA", "ATENDIMENTO", "127884955", "PENDENTE (sem c\u00f3digo SIGA informado)", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "ADM Costa Rica ainda sem codigo de conta reduzida SIGA informado para esta sub-tesouraria -- usar o numero de conta PagCorp como identificador provisorio ate confirmacao."],
      ["127699114", "Cristiane irm\u00e3 da piedade (ATENDIMENTO 91.14)", "PIA-COSTA", "ATENDIMENTO", "127884955", "PENDENTE (sem c\u00f3digo SIGA informado)", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "ADM Costa Rica ainda sem codigo de conta reduzida SIGA informado para esta sub-tesouraria -- usar o numero de conta PagCorp como identificador provisorio ate confirmacao."],
      ["127699155", "Zeza irm\u00e3 da piedade (ATENDIMENTO 91.55)", "PIA-COSTA", "ATENDIMENTO", "127884955", "PENDENTE (sem c\u00f3digo SIGA informado)", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "ADM Costa Rica ainda sem codigo de conta reduzida SIGA informado para esta sub-tesouraria -- usar o numero de conta PagCorp como identificador provisorio ate confirmacao."],
      ["127699189", "Ubaldo di\u00e1cono (ATENDIMENTO 91.89)", "PIA-COSTA", "ATENDIMENTO", "127884955", "PENDENTE (sem c\u00f3digo SIGA informado)", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "ADM Costa Rica ainda sem codigo de conta reduzida SIGA informado para esta sub-tesouraria -- usar o numero de conta PagCorp como identificador provisorio ate confirmacao."],
      ["127699353", "Lu irm\u00e3 da piedade (ATENDIMENTO 93.53)", "PIA-COSTA", "ATENDIMENTO", "127884955", "PENDENTE (sem c\u00f3digo SIGA informado)", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "ADM Costa Rica ainda sem codigo de conta reduzida SIGA informado para esta sub-tesouraria -- usar o numero de conta PagCorp como identificador provisorio ate confirmacao."],
      ["127699734", "Fatimo di\u00e1cono (ATENDIMENTO 97.34)", "PIA-COSTA", "ATENDIMENTO", "127884955", "PENDENTE (sem c\u00f3digo SIGA informado)", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "ADM Costa Rica ainda sem codigo de conta reduzida SIGA informado para esta sub-tesouraria -- usar o numero de conta PagCorp como identificador provisorio ate confirmacao."],
      ["127699437", "Cristiane irm\u00e3 da piedade (SECRETARIA 94.37)", "PIA-COSTA", "SECRETARIA", "127884922", "PENDENTE (sem c\u00f3digo SIGA informado)", "", "NAO - verificar/incluir no SIGA", "D\u00e9bito (todos s\u00e3o pr\u00e9-pagos corporativos - nunca cr\u00e9dito)", "Ativo", "ADM Costa Rica ainda sem codigo de conta reduzida SIGA informado para esta sub-tesouraria -- usar o numero de conta PagCorp como identificador provisorio ate confirmacao."],
    ]
  },
  {
    id: "DIACONOS",
    titulo: "DI\u00c1CONOS (SIGNAT\u00c1RIOS)",
    cor: "#7f6000",
    colunas: [
      { nome: "Nome", px: 210 },
      { nome: "Cargo", px: 85 },
      { nome: "Frequ\u00eancia", px: 130 },
    ],
    dados: [
      ["Adalto Azevedo Pereira", "Di\u00e1cono", "Mais frequente"],
      ["Eliseu Sim\u00e3o Rezende da Silva", "Di\u00e1cono", "Mais frequente"],
      ["Nilson Sant'Anna", "Di\u00e1cono", "Mais frequente"],
      ["Tayn\u00e3 Araujo Naves", "Di\u00e1cono", "Mais frequente"],
      ["Edinaldo Fernandes da Silva Junior", "Di\u00e1cono", "Frequ\u00eancia m\u00e9dia"],
      ["Jo\u00e3o Torquato de Souza", "Di\u00e1cono", "Frequ\u00eancia m\u00e9dia"],
      ["Lindomar dos Anjos Souza", "Di\u00e1cono", "Frequ\u00eancia m\u00e9dia"],
      ["F\u00e1timo C\u00e2ndido Ferreira", "Di\u00e1cono", "Frequ\u00eancia espor\u00e1dica"],
      ["Jos\u00e9 Cavalcanti Costa", "Di\u00e1cono", "Frequ\u00eancia espor\u00e1dica"],
      ["Ubaldo de S\u00e1 Carnel\u00f3s", "Di\u00e1cono", "Frequ\u00eancia espor\u00e1dica"],
      ["Uriel Carvalho de Oliveira", "Di\u00e1cono", "Frequ\u00eancia espor\u00e1dica"],
    ]
  },
  // -------------------------------------------------------------------------
  // COMO a movimentação acontece. Não é o mesmo que o TIPO (para quê ela
  // serve) nem o que o SUBTIPO (entre quem ela acontece) — esses dois o
  // sistema deduz sozinho das contas escolhidas. A forma é a única coisa que
  // ainda precisa ser dita, e mesmo ela costuma sobrar só uma ou duas depois
  // das regras de relacionamento.
  // -------------------------------------------------------------------------
  {
    id: "FORMAS",
    titulo: "FORMAS DE MOVIMENTA\u00c7\u00c3O",
    cor: "#6a329f",
    colunas: [
      { nome: "Forma", px: 150 },
      { nome: "Em esp\u00e9cie?", px: 90 },
      { nome: "Observa\u00e7\u00e3o", px: 380 },
      // COLUNA NOVA VAI NO FIM. Vazio = forma de primeiro n\u00edvel; preenchido =
      // esta linha \u00e9 subforma da forma indicada.
      { nome: "Subforma de", px: 130 },
      // ---------------------------------------------------------------------
      // AS DUAS COLUNAS ABAIXO SÃO RESTRIÇÕES DA PRÓPRIA FORMA — e não do par
      // de contas. É a diferença entre "esta forma não existe assim" e "esta
      // forma não vale entre estas duas". Dinheiro não deixa de existir entre
      // dois bancos por causa de uma regra da ADM: ele simplesmente não é
      // dinheiro se não há um caixa dos dois lados.
      //
      // Escrever isso no bloco REGRAS ENTRE CONTAS custaria nove linhas (todos
      // os pares em que nenhum dos lados é caixa) e a décima natureza que
      // aparecesse amanhã ficaria de fora, em silêncio. Aqui é uma célula.
      // ---------------------------------------------------------------------

      // Vazia = a forma não exige nada. Preenchida, PELO MENOS UM dos dois
      // lados tem de ser conta daquela natureza. É o que diz "saque exige um
      // caixa": dinheiro e cheque saem de um caixa, entram num caixa, ou as
      // duas coisas — nunca de banco para banco.
      { nome: "Exige conta de", px: 110,
        valores: ["", "CAIXA", "BANCO", "ACG", "CARTAO"] },

      // Vazia = tanto faz. MESMA = só dentro da mesma instituição (é a
      // definição de transferência bancária). DIFERENTES = só entre
      // instituições distintas (TED e PIX existem para atravessar bancos).
      // Quando um dos lados não tem instituição — um caixa —, não há o que
      // comparar e a restrição não corta nada.
      { nome: "Institui\u00e7\u00f5es", px: 110 },
    ],
    dados: [
      // SAQUE \u00e9 fam\u00edlia, e n\u00e3o se escolhe direto: escolhe-se uma das duas
      // subformas. "Saque" sozinho \u00e9 amb\u00edguo \u2014 pode ser dinheiro em esp\u00e9cie
      // ou um cheque descontado, e o comprovante precisa dizer qual.
      ["SAQUE", "Sim", "Fam\u00edlia: escolha DINHEIRO ou CHEQUE", "", "CAIXA", ""],
      ["DINHEIRO", "Sim", "Saque em esp\u00e9cie. Um dos dois lados tem de ser caixa.", "SAQUE", "CAIXA", ""],
      ["CHEQUE", "N\u00e3o", "Saque de cheque (desconto). Um dos dois lados tem de ser caixa.", "SAQUE", "CAIXA", ""],
      ["TRANSF. BANC\u00c1RIA", "N\u00e3o", "Transfer\u00eancia entre contas da mesma institui\u00e7\u00e3o", "", "", "MESMA"],
      ["TED", "N\u00e3o", "Transfer\u00eancia Eletr\u00f4nica Dispon\u00edvel \u2014 entre institui\u00e7\u00f5es diferentes", "", "", "DIFERENTES"],
      ["PIX", "N\u00e3o", "Entre institui\u00e7\u00f5es diferentes", "", "", "DIFERENTES"],
    ],
    // O DOC foi extinto pelo Banco Central; n\u00e3o existe mais para escolher.
    // Aposentar \u00e9 diferente de apagar da lista do projeto: quem j\u00e1 tem a aba
    // criada continuaria com a linha velha l\u00e1, porque recriar PRESERVA o que
    // existe. Esta lista \u00e9 a \u00fanica coisa que autoriza a recria\u00e7\u00e3o a tirar
    // uma linha \u2014 e ela aparece na janela, em SAIU.
    // "TRANSF. TED" dizia duas vezes a mesma coisa: o T de TED j\u00e1 \u00e9
    // "transfer\u00eancia". Virou "TED", e o nome por extenso foi para a
    // Observa\u00e7\u00e3o, onde explica sem ocupar a largura do campo.
    aposentadas: ["TRANSF. DOC", "TRANSF. TED"]
  },
  // -------------------------------------------------------------------------
  // REGRAS DE RELACIONAMENTO ENTRE CONTAS
  //
  // Cada linha diz o que pode acontecer entre duas NATUREZAS de conta. O `*`
  // vale para qualquer natureza.
  //
  //   Formas permitidas  -> só estas valem para esse par (lista fechada)
  //   Formas proibidas   -> estas não valem, e o resto vale
  //
  // **Um par sem nenhuma regra é livre.** As regras aqui são restrições, não
  // permissões: o que não foi proibido continua valendo. É de propósito —
  // assim o cadastro nasce só com o que foi realmente determinado, e ninguém
  // fica travado por uma regra que o sistema inventou.
  //
  // A coluna "Origem da regra" separa o que vem da determinação NACIONAL do
  // que cada regional acrescentou (LOCAL). A coluna "Ativa" desliga uma linha
  // sem apagá-la.
  //
  // Para desligar TODAS as restrições de uma vez — o caso do ajuste financeiro
  // ou contábil —, a chave RESTRICOES_ATIVAS, no bloco CONTROLE.
  // -------------------------------------------------------------------------
  {
    id: "RELACOES",
    // A chave são as quatro colunas que decidem QUANDO a regra vale. Sem isto,
    // o cadastro deduplicaria pela primeira coluna e engoliria toda regra que
    // comece com "*".
    chave: [0, 1, 7, 8],
    titulo: "REGRAS ENTRE CONTAS",
    cor: "#a61c00",
    colunas: [
      { nome: "Natureza de origem", px: 140 },
      { nome: "Natureza de destino", px: 140 },
      { nome: "Formas permitidas", px: 200 },
      { nome: "Formas proibidas", px: 160 },
      { nome: "Origem da regra", px: 110 },
      { nome: "Ativa", px: 70 },
      { nome: "Por qu\u00ea", px: 380 },
      // COLUNAS NOVAS NO FIM. Vazias = a regra vale para qualquer conta
      // daquela natureza. Preenchidas, a regra s\u00f3 vale para contas cujo texto
      // contenha aquele peda\u00e7o \u2014 \u00e9 assim que "as contas do Santander" vira
      // regra sem precisar inventar uma natureza para um banco.
      { nome: "Origem cont\u00e9m", px: 120 },
      { nome: "Destino cont\u00e9m", px: 120 },
    ],
    dados: [
      ["CAIXA", "*", "DINHEIRO", "",
       "NACIONAL", "Sim",
       "Caixa como origem: o valor sai em esp\u00e9cie.", "", ""],
      ["*", "CAIXA", "DINHEIRO; CHEQUE", "",
       "NACIONAL", "Sim",
       "Caixa como destino: entra por saque, em dinheiro ou em cheque.", "", ""],

      // A ACG n\u00e3o tem ag\u00eancia f\u00edsica: n\u00e3o recebe esp\u00e9cie nem compensa cheque.
      // \u00c9 PROIBI\u00c7\u00c3O, e n\u00e3o permiss\u00e3o, de prop\u00f3sito \u2014 proibi\u00e7\u00e3o vale sempre,
      // e \u00e9 ela que torna imposs\u00edvel qualquer movimento entre a ACG e um caixa
      // (o caixa s\u00f3 movimenta por saque).
      ["ACG", "*", "", "SAQUE",
       "NACIONAL", "Sim",
       "A ACG \u00e9 uma fintech: n\u00e3o movimenta em esp\u00e9cie nem em cheque.", "", ""],
      ["*", "ACG", "", "SAQUE",
       "NACIONAL", "Sim",
       "A ACG \u00e9 uma fintech: n\u00e3o recebe esp\u00e9cie nem cheque.", "", ""],

      ["CARTAO", "*", "TRANSF. BANC\u00c1RIA", "",
       "NACIONAL", "Sim",
       "Cart\u00e3o pr\u00e9-pago movimenta por transfer\u00eancia banc\u00e1ria.", "", ""],
      ["*", "CARTAO", "TRANSF. BANC\u00c1RIA", "",
       "NACIONAL", "Sim",
       "Cart\u00e3o pr\u00e9-pago movimenta por transfer\u00eancia banc\u00e1ria.", "", ""],

      // AQUI HAVIA TR\u00caS REGRAS \u2014 ACG\u2192ACG, ACG\u2192CART\u00c3O e CART\u00c3O\u2192ACG, todas
      // permitindo TRANSF. BANC\u00c1RIA \u2014 e elas SA\u00cdRAM por n\u00e3o dizerem mais nada.
      // Quando a coluna `Institui\u00e7\u00f5es` do bloco FORMAS nasceu, transfer\u00eancia
      // banc\u00e1ria passou a exigir a mesma institui\u00e7\u00e3o por defini\u00e7\u00e3o, e os
      // cart\u00f5es levam ACG: as tr\u00eas viraram repeti\u00e7\u00e3o do que a forma j\u00e1 \u00e9.
      //
      // Isso n\u00e3o foi lido no c\u00f3digo, foi MEDIDO: tirando cada regra e comparando
      // as 506 combina\u00e7\u00f5es de contas, s\u00f3 estas tr\u00eas n\u00e3o mudavam nada. A bateria
      // refaz essa medi\u00e7\u00e3o a cada rodada.

      // ACG COM OUTRO BANCO \u00e9 outra institui\u00e7\u00e3o: a\u00ed s\u00f3 PIX.
      ["ACG", "BANCO", "PIX", "",
       "NACIONAL", "Sim",
       "Entre a ACG e outra institui\u00e7\u00e3o financeira, somente PIX.", "", ""],
      ["BANCO", "ACG", "PIX", "",
       "NACIONAL", "Sim",
       "Entre outra institui\u00e7\u00e3o financeira e a ACG, somente PIX.", "", ""],

      ["CARTAO", "CAIXA", "DINHEIRO", "",
       "NACIONAL", "Sim",
       "Exce\u00e7\u00e3o: valor sacado do cart\u00e3o no banco 24h e devolvido \u00e0 tesouraria em esp\u00e9cie, na presta\u00e7\u00e3o de contas.", "", ""],

      ["*", "*", "", "SAQUE",
       "LOCAL", "Sim",
       "N\u00e3o h\u00e1 ag\u00eancia do Santander na cidade: nenhuma conta SANT faz saque.", "SANT", ""],
      ["*", "*", "", "SAQUE",
       "LOCAL", "Sim",
       "N\u00e3o h\u00e1 ag\u00eancia do Santander na cidade: nenhuma conta SANT faz saque.", "", "SANT"],
    ],
    // As tr\u00eas que a medi\u00e7\u00e3o mostrou n\u00e3o dizerem mais nada. A aposentada vem
    // como LINHA e n\u00e3o como texto, porque a chave aqui s\u00e3o quatro colunas.
    aposentadas: [
      ["ACG", "ACG", "", "", "", "", "", "", ""],
      ["ACG", "CARTAO", "", "", "", "", "", "", ""],
      ["CARTAO", "ACG", "", "", "", "", "", "", ""]
    ]
  },
  // -------------------------------------------------------------------------
  // PARA QUÊ a movimentação serve. É a única das cinco perguntas que o sistema
  // NÃO deduz: onde ela acontece sai das contas, como o dinheiro anda sai da
  // forma, que espécie de movimentação é sai do subtipo — mas o propósito só
  // quem lança sabe.
  //
  // A lista não foi inventada aqui. Ela veio de um levantamento feito no
  // projeto das CIs, onde estão os manuais da obra (ver
  // docs/11_prompt_finalidades.md), e cada linha cita a fonte. A primeira
  // tentativa voltou com DESPESAS — alimentação, funeral, vestuário —, que não
  // são CMI: o comprovante documenta dinheiro andando entre contas da própria
  // obra, nunca pagamento a terceiro.
  //
  // `Históricos SIGA` é o código do histórico a usar no lançamento. Não é
  // enfeite: é o que liga este comprovante ao lançamento que ele documenta.
  // -------------------------------------------------------------------------
  {
    id: "FINALIDADES",
    titulo: "FINALIDADES",
    cor: "#0b5394",
    colunas: [
      { nome: "C\u00f3digo", px: 60 },
      { nome: "Finalidade", px: 330 },
      { nome: "O que \u00e9", px: 380 },
      // PIEDADE, VIAGEM, MUSICA — as três frentes desta tesouraria, separadas
      // por ponto e vírgula. Vazio seria ambíguo aqui, então não se usa.
      { nome: "Frentes", px: 150 },
      { nome: "Hist\u00f3ricos SIGA", px: 280 },
      { nome: "Fonte", px: 320 },
      { nome: "Cuidados", px: 360 },
      // COLUNA NOVA NO FIM. `INVERTIDO` quer dizer que a origem RECEBE cr\u00e9dito
      // e o destino \u00e9 debitado \u2014 o contr\u00e1rio do normal. \u00c9 aviso cont\u00e1bil, n\u00e3o
      // trava, e existia na lista de subtipos que foi aposentada. Os tr\u00eas
      // valores vieram de l\u00e1, pelo mapeamento que ele confirmou:
      // "Zerar Conta" -> F10, "Transferencia Debito" -> F14 e F15.
      { nome: "Sentido", px: 100, valores: ["", "INVERTIDO"] },
    ],
    dados: [
      ["F03", "Abastecer o caixa para a reunião de atendimento", "Numerário levado do banco ou de outro caixa para dispor de dinheiro na reunião mensal", "PIEDADE", "032 TRANSF.VLR; 011 CHEQUE Nº; 168 DEP. CX. FUNDO FIXO", "MAD.TES.01 itens 3.4 e 3.5; MOP.PIA.01 p.16; Livro Diário PIA-Coxim (49 lançamentos)", "Saldo do caixa deve bater com o físico no fim do mês (FOR.TES.09)", ""],
      ["F04", "Abastecer o caixa de viagens missionárias", "Numerário transferido para o caixa de viagens antes da emissão dos envelopes", "VIAGEM", "032 TRANSF.VLR; 011 CHEQUE Nº", "MOP.PIA.01 p.20; Livro Diário PIA-Coxim (18 lançamentos)", "Entre departamentos só na PIA sede da Regional (PIA-Coxim); só custeia viagens oradas ou consideradas em RRM", ""],
      ["F05", "Abastecer o caixa do Fundo Musical", "Numerário transferido para o caixa do Fundo Musical", "MUSICA", "032 TRANSF.VLR; 011 CHEQUE Nº", "Plano de Contas PIA-Coxim (conta 10035); rotina confirmada pela Secretaria", "Deliberação sobre o uso dos recursos cabe aos Diáconos com os Encarregados de Orquestra", ""],
      ["F06", "Recolher ao banco a sobra do caixa", "Devolução ao banco do numerário não utilizado no caixa no fechamento do mês", "PIEDADE;VIAGEM;MUSICA", "014 DEP. BANCÁRIO; 032 TRANSF.VLR", "MAD.TES.01 item 3.5; FOR.TES.09", "Conciliação de caixa até o dia 10 do mês seguinte; Termo de Verificação assinado", ""],
      ["F07", "Custodiar numerário em cofre para emergências", "Saque concentrado para manter numerário no cofre e evitar saques repetidos", "PIEDADE", "011 CHEQUE Nº; 032 TRANSF.VLR", "CI 07/26; MOP.PIA.01 p.23", "Proposta ainda em deliberação; cofre aberto por dois ou mais Diáconos em conjunto com formulário assinado", ""],
      ["F08", "Recolher ao caixa o saldo em espécie do cartão", "Valor sacado no cartão pré-pago e não utilizado devolvido ao caixa", "PIEDADE;VIAGEM", "105 SAQUE/COMPRA CARTÃO DÉBITO; 106 COMPRA/SAQUE CARTÃO DÉBITO", "MOP.PIA.01 p.20; Ofício 004/26", "Devolução sempre em Reais", ""],
      ["F09", "Suprir a conta ACG para carga de cartões", "PIX do banco para a conta de pagamento que alimenta os cartões pré-pagos", "PIEDADE;VIAGEM;MUSICA", "032 TRANSF.VLR", "Ofício 004/26; Livro Diário PIA-Coxim", "Operação iniciada em 2026; conferir saldo antes da reunião", ""],
      ["F10", "Devolver ao banco o saldo da conta ACG", "Zeragem da conta de pagamento ao fim do período", "PIEDADE;VIAGEM;MUSICA", "032 TRANSF.VLR; 034 TRANSF.P/ENCERRAMENTO", "Ofício 004/26", "Dispensa da zeragem está em consulta à Tesouraria do Brás", "INVERTIDO"],
      ["F11", "Cobrir saldo de conta para tarifas bancárias", "Reforço de conta bancária sem saldo suficiente para as tarifas do período", "PIEDADE;VIAGEM;MUSICA", "032 TRANSF.VLR", "MAD.TES.01 item 3.4; Livro Diário PIA-Coxim (69 lançamentos)", "Cheque emitido custa R$ 20 conforme CI 07/26", ""],
      ["F12", "Concentrar saldo em outra conta bancária da PIA", "Reunião de saldo disperso em uma única conta da mesma PIA", "PIEDADE;VIAGEM;MUSICA", "032 TRANSF.VLR; 166 REGUL. SALDO", "MAD.TES.01 itens 3.4 e 3.6", "Movimentação exige duas assinaturas (Estatuto art. 26 §2º)", ""],
      ["F13", "Carregar cartão pré-pago do colaborador", "Crédito da conta ACG transferido para o cartão do Diácono ou da irmã", "PIEDADE;VIAGEM", "032 TRANSF.VLR; 108 VLR. ATEND. A MAIS C/ CARTÃO", "Ofício 004/26; MOP.PIA.01 p.17", "O manual recomenda formas de atendimento sem espécie", ""],
      ["F14", "Devolver à conta ACG o saldo não usado do cartão", "Saldo remanescente do cartão devolvido à conta de pagamento", "PIEDADE;VIAGEM", "032 TRANSF.VLR; 109 VLR. ATEND. A MENOS C/ CARTÃO", "Ofício 004/26", "Sentido invertido em relação à carga — conferir antes de confirmar", "INVERTIDO"],
      ["F15", "Transferir saldo entre cartões de colaboradores", "Saldo movido de um cartão pré-pago para outro", "PIEDADE;VIAGEM", "107 TRANSF. VALORES ENTRE CARTÕES", "Ofício 004/26", "Usado em troca de responsável; sentido invertido", "INVERTIDO"],
      ["F16", "Transferir saldo entre contas ACG da PIA", "Saldo movido entre as contas de pagamento da mesma PIA", "PIEDADE;VIAGEM;MUSICA", "032 TRANSF.VLR", "Ofício 004/26; Plano de Contas PIA-Coxim (10115; 10120; 10161)", "", ""],
      ["F17", "Aplicar saldo sem uso imediato", "Sobra de disponibilidade transferida para aplicação financeira", "PIEDADE;VIAGEM;MUSICA", "002 APLICAÇÃO FINANCEIRA", "MAD.TES.01 item 3.6; IT.TES.11; Livro Diário PIA-Coxim", "Vedadas aplicações de risco; exige FOR.TES.06 e FOR.TES.07", ""],
      ["F18", "Resgatar aplicação para honrar compromisso", "Resgate da aplicação para recompor a conta movimento", "PIEDADE;VIAGEM;MUSICA", "031 RESGATE DE APLICAÇÃO", "IT.TES.11; Livro Diário PIA-Coxim", "Separar capital de rendimento quando possível", ""],
      ["F19", "Transferir à Administração valores para compra ou serviço", "Valor repassado antes para que a Administração faça a compra ou contrate o serviço", "PIEDADE", "032 TRANSF.VLR; 178 TRANSF. SETORIZAÇÃO", "MOP.PIA.01 p.15 e p.27", "Aquisição de bens exige deliberação em reunião do ministério de Diáconos", ""],
      ["F20", "Receber da Administração o ressarcimento de valores", "Retorno de valor que a Administração desembolsou por conta da Piedade", "PIEDADE", "110 VLR P/REEMB.; 032 TRANSF.VLR", "CI 11/26", "Exige nota fiscal ou recibo da compra feita pela Administração", ""],
      ["F21", "Suprir a conta ACG de ponto de atendimento agregado", "Carga da conta de pagamento de outra PIA da mesma administração para atendimento com cartão", "PIEDADE", "032 TRANSF.VLR; 178 TRANSF. SETORIZAÇÃO", "Ofício 004/26; MOP.PIA.01 p.26", "Contas 10116 e 10117 ainda sem movimento", ""],
      ["F22", "Carregar cartão de colaborador de outro ponto de atendimento", "Carga de cartão vinculado a outra PIA da mesma administração", "PIEDADE", "032 TRANSF.VLR", "Ofício 004/26; cadastro de cartões do projeto", "O responsável deve corresponder ao cadastro do SIGA na data", ""],
      ["F23", "Ressarcir envelope de viagem entre administrações", "Acerto entre administrações do valor de envelope de viagem pago por uma delas", "VIAGEM", "110 VLR P/REEMB.; 032 TRANSF.VLR", "Definição da Secretaria (set/2026); MOP.PIA.01 p.20", "As receitas e despesas de viagens são centralizadas na Regional Administrativa", ""],
      ["F24", "Remeter à outra administração coletas que lhe cabem", "Repasse a outra administração de coletas arrecadadas e destinadas a ela", "PIEDADE;VIAGEM;MUSICA", "162 TRANSF. REMETIDA - REPARTIÇÃO DAS OFERTAS; 032 TRANSF.VLR; 164 REMESSA EXTERIOR", "Definição da Secretaria (set/2026); Plano de Contas (2082; 2083; 2085)", "Registrar a destinação no Mapa de Coletas antes da remessa; 164 só quando o destino for o exterior", ""],
      ["F25", "Ressarcir a Administração por compra ou serviço", "Devolução à Administração do valor que ela desembolsou pela Piedade ou pelo Departamento dos Diáconos", "PIEDADE", "110 VLR P/REEMB.; 032 TRANSF.VLR", "CI 11/26; definição da Secretaria (set/2026)", "Exige nota fiscal ou recibo; difere de F19 porque a compra já foi feita", ""],
      ["F26", "Devolver valores não utilizados na mesa de atendimento", "Retorno do numerário que sobrou na mesa ao término da reunião", "PIEDADE", "014 DEP. BANCÁRIO; 032 TRANSF.VLR", "MOP.PIA.01 p.19; definição da Secretaria (set/2026)", "Entre departamentos, só nas PIAs que não são sede da administração local", ""],
      ["F27", "Desabastecer o caixa de viagens missionárias", "Retirada do saldo do caixa de viagens para outro caixa ou para o banco", "VIAGEM", "014 DEP. BANCÁRIO; 032 TRANSF.VLR", "Definição da Secretaria (set/2026); MAD.TES.01 item 3.5", "Conferir com o Termo de Verificação do Saldo do Caixa", ""],
      ["F28", "Desabastecer o caixa do Fundo Musical", "Retirada do saldo do caixa do Fundo Musical para outro caixa ou para o banco", "MUSICA", "014 DEP. BANCÁRIO; 032 TRANSF.VLR", "Definição da Secretaria (set/2026); MAD.TES.01 item 3.5", "Conferir com o Termo de Verificação do Saldo do Caixa", ""],
    ]
  },
  // -------------------------------------------------------------------------
  // ONDE cada finalidade pode aparecer. Mesmo desenho das REGRAS ENTRE CONTAS:
  // **vazio quer dizer "serve para qualquer um"**. Uma linha com Forma vazia
  // vale para toda forma; com Subtipo vazio, para todo subtipo.
  //
  // A coluna `Folha` é o código do levantamento (1.1.1, 2.0.2.2...) e serve
  // para rastrear a linha até o documento que a originou. **Não é ela que o
  // sistema compara** — quem compara são as quatro colunas de texto ao lado.
  // Fazer o sistema depender daquela numeração seria amarrá-lo a um esquema
  // que ele não conhece e que ninguém mantém.
  // -------------------------------------------------------------------------
  {
    id: "REGRAS_FINALIDADE",
    // Uma finalidade aparece em várias folhas; o que identifica a linha é o
    // par. Chave só pelo código apagaria 13 das 39 linhas, em silêncio.
    chave: [0, 1],
    titulo: "ONDE CADA FINALIDADE VALE",
    cor: "#134f5c",
    colunas: [
      { nome: "C\u00f3digo da finalidade", px: 120 },
      { nome: "Folha", px: 70 },
      { nome: "Tipo", px: 260 },
      { nome: "Subtipo", px: 150 },
      { nome: "Forma", px: 130 },
      { nome: "Subforma", px: 90 },
      { nome: "Hist\u00f3ricos SIGA", px: 300 },
      { nome: "Por qu\u00ea", px: 400 },
      // COLUNAS NOVAS NO FIM. A NATUREZA de cada lado, quando a finalidade for
      // mesmo restrita a ele. Antes disto a condi\u00e7\u00e3o das contas existia s\u00f3 na
      // prosa da coluna "Por qu\u00ea" \u2014 e prosa o sistema n\u00e3o l\u00ea: "Aplicar saldo
      // sem uso imediato" aparecia num ACG \u2192 cart\u00e3o, onde n\u00e3o cabe.
      //
      // Vazio quer dizer QUALQUER UMA, e est\u00e1 vazio em 11 das 39 linhas de
      // prop\u00f3sito: quando a finalidade serve nos dois sentidos (quem ressarce
      // pode estar de qualquer lado), ou quando a folha j\u00e1 s\u00f3 admite um par.
      { nome: "Origem", px: 90, valores: ["", "CAIXA", "BANCO", "ACG", "CARTAO"] },
      { nome: "Destino", px: 90 },
    ],
    dados: [
      ["F23", "1.1.1", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre administrações", "PIX", "", "110 VLR P/REEMB.; 032 TRANSF.VLR", "Só aparece quando as contas pertencem a administrações diferentes", "", ""],
      ["F24", "1.1.1", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre administrações", "PIX", "", "162 TRANSF. REMETIDA - REPARTIÇÃO DAS OFERTAS; 032 TRANSF.VLR; 164 REMESSA EXTERIOR", "Só aparece quando as contas pertencem a administrações diferentes", "", ""],
      ["F19", "1.2.1", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "PIX", "", "032 TRANSF.VLR; 178 TRANSF. SETORIZAÇÃO", "Só aparece quando as contas são de PIAs diferentes da mesma administração", "", ""],
      ["F20", "1.2.1", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "PIX", "", "110 VLR P/REEMB.; 032 TRANSF.VLR", "Só aparece quando as contas são de PIAs diferentes da mesma administração", "", ""],
      ["F21", "1.2.1", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "PIX", "", "032 TRANSF.VLR", "Só aparece quando o destino é conta ACG de outra PIA da mesma administração", "", "ACG"],
      ["F25", "1.2.1", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "PIX", "", "110 VLR P/REEMB.; 032 TRANSF.VLR", "Só aparece quando as contas são de PIAs diferentes da mesma administração", "", ""],
      ["F03", "1.2.2.2", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "SAQUE", "DINHEIRO", "032 TRANSF.VLR", "Só aparece quando o destino é o caixa da Piedade de outra PIA", "", "CAIXA"],
      ["F04", "1.2.2.2", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "SAQUE", "DINHEIRO", "032 TRANSF.VLR", "Só aparece quando o destino é o caixa de viagens da PIA sede da Regional", "", "CAIXA"],
      ["F06", "1.2.2.2", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "SAQUE", "DINHEIRO", "014 DEP. BANCÁRIO; 032 TRANSF.VLR", "Só aparece quando a origem é caixa e o destino é banco", "CAIXA", "BANCO"],
      ["F08", "1.2.2.2", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "SAQUE", "DINHEIRO", "105 SAQUE/COMPRA CARTÃO DÉBITO; 106 COMPRA/SAQUE CARTÃO DÉBITO", "Só aparece quando a origem é cartão e o destino é caixa", "CARTAO", "CAIXA"],
      ["F26", "1.2.2.2", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "SAQUE", "DINHEIRO", "032 TRANSF.VLR", "Só aparece entre caixas e apenas nas PIAs que não são sede da administração local", "CAIXA", "CAIXA"],
      ["F21", "1.2.3", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "TRANSF. BANCÁRIA", "", "032 TRANSF.VLR; 178 TRANSF. SETORIZAÇÃO", "Só aparece entre contas ACG de PIAs diferentes da mesma administração", "ACG", "ACG"],
      ["F22", "1.2.3", "TRANSFERÊNCIA (externa) DE NUMERÁRIOS", "entre departamentos", "TRANSF. BANCÁRIA", "", "032 TRANSF.VLR", "Só aparece quando há cartão no destino em PIA diferente da mesma administração", "ACG", "CARTAO"],
      ["F09", "2.0.1", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "PIX", "", "032 TRANSF.VLR", "Só aparece quando o destino é conta ACG da mesma PIA", "", "ACG"],
      ["F10", "2.0.1", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "PIX", "", "032 TRANSF.VLR; 034 TRANSF.P/ENCERRAMENTO", "Só aparece quando a origem é conta ACG e o destino é banco na mesma PIA", "ACG", "BANCO"],
      ["F11", "2.0.1", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "PIX", "", "032 TRANSF.VLR", "Só aparece entre contas bancárias da mesma PIA", "", "BANCO"],
      ["F03", "2.0.2.1", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "CHEQUE", "011 CHEQUE Nº", "Só aparece quando há caixa no destino dentro da mesma PIA", "", ""],
      ["F04", "2.0.2.1", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "CHEQUE", "011 CHEQUE Nº", "Só aparece quando o destino é o caixa de viagens da mesma PIA", "", ""],
      ["F05", "2.0.2.1", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "CHEQUE", "011 CHEQUE Nº", "Só aparece quando o destino é o caixa do Fundo Musical da mesma PIA", "", ""],
      ["F07", "2.0.2.1", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "CHEQUE", "011 CHEQUE Nº", "Só aparece em saque de banco para caixa na mesma PIA", "", ""],
      ["F03", "2.0.2.2", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "DINHEIRO", "032 TRANSF.VLR; 168 DEP. CX. FUNDO FIXO", "Só aparece quando há caixa no destino dentro da mesma PIA", "", "CAIXA"],
      ["F04", "2.0.2.2", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "DINHEIRO", "032 TRANSF.VLR", "Só aparece quando o destino é o caixa de viagens da mesma PIA", "", "CAIXA"],
      ["F05", "2.0.2.2", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "DINHEIRO", "032 TRANSF.VLR", "Só aparece quando o destino é o caixa do Fundo Musical da mesma PIA", "", "CAIXA"],
      ["F06", "2.0.2.2", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "DINHEIRO", "014 DEP. BANCÁRIO", "Só aparece quando a origem é caixa e o destino é banco na mesma PIA", "CAIXA", "BANCO"],
      ["F07", "2.0.2.2", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "DINHEIRO", "032 TRANSF.VLR", "Só aparece em saque de banco para caixa na mesma PIA", "BANCO", "CAIXA"],
      ["F08", "2.0.2.2", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "DINHEIRO", "105 SAQUE/COMPRA CARTÃO DÉBITO; 106 COMPRA/SAQUE CARTÃO DÉBITO", "Só aparece quando a origem é cartão e o destino é caixa na mesma PIA", "CARTAO", "CAIXA"],
      ["F26", "2.0.2.2", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "DINHEIRO", "014 DEP. BANCÁRIO; 032 TRANSF.VLR", "Só aparece quando a origem é o caixa da Piedade e o destino é banco", "CAIXA", "BANCO"],
      ["F27", "2.0.2.2", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "DINHEIRO", "014 DEP. BANCÁRIO; 032 TRANSF.VLR", "Só aparece quando a origem é o caixa de viagens da mesma PIA", "CAIXA", ""],
      ["F28", "2.0.2.2", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "SAQUE", "DINHEIRO", "014 DEP. BANCÁRIO; 032 TRANSF.VLR", "Só aparece quando a origem é o caixa do Fundo Musical da mesma PIA", "CAIXA", ""],
      ["F11", "2.0.3", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TED", "", "032 TRANSF.VLR", "Só aparece entre contas bancárias da mesma PIA", "", ""],
      ["F12", "2.0.3", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TED", "", "032 TRANSF.VLR; 166 REGUL. SALDO", "Só aparece entre contas bancárias da mesma PIA", "", ""],
      ["F11", "2.0.4", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TRANSF. BANCÁRIA", "", "032 TRANSF.VLR", "Só aparece entre contas bancárias da mesma PIA", "", "BANCO"],
      ["F12", "2.0.4", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TRANSF. BANCÁRIA", "", "032 TRANSF.VLR; 166 REGUL. SALDO", "Só aparece entre contas bancárias da mesma PIA", "", "BANCO"],
      ["F13", "2.0.4", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TRANSF. BANCÁRIA", "", "032 TRANSF.VLR; 108 VLR. ATEND. A MAIS C/ CARTÃO", "Só aparece quando a origem é conta ACG e o destino é cartão na mesma PIA", "ACG", "CARTAO"],
      ["F14", "2.0.4", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TRANSF. BANCÁRIA", "", "032 TRANSF.VLR; 109 VLR. ATEND. A MENOS C/ CARTÃO", "Só aparece quando a origem é cartão e o destino é conta ACG na mesma PIA", "CARTAO", "ACG"],
      ["F15", "2.0.4", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TRANSF. BANCÁRIA", "", "107 TRANSF. VALORES ENTRE CARTÕES", "Só aparece entre dois cartões da mesma PIA", "CARTAO", "CARTAO"],
      ["F16", "2.0.4", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TRANSF. BANCÁRIA", "", "032 TRANSF.VLR", "Só aparece entre duas contas ACG da mesma PIA", "ACG", "ACG"],
      ["F17", "2.0.4", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TRANSF. BANCÁRIA", "", "002 APLICAÇÃO FINANCEIRA", "Só aparece entre contas bancárias da mesma PIA", "", "BANCO"],
      ["F18", "2.0.4", "MOVIMENTAÇÃO INTERNA (de numerários)", "", "TRANSF. BANCÁRIA", "", "031 RESGATE DE APLICAÇÃO", "Só aparece entre contas bancárias da mesma PIA", "", "BANCO"],

    ]
  },
  {
    id: "STATUS",
    titulo: "STATUS (ETAPAS)",
    cor: "#b45f06",
    colunas: [
      { nome: "Status", px: 90 },
      { nome: "Quando usar", px: 330 },
      { nome: "Etapa da sequ\u00eancia", px: 110 },
    ],
    dados: [
      ["APROVADA", "Primeira etapa, sempre - tanto no fluxo de 2 quanto no de 3 documentos", "1 de 2 ou 1 de 3"],
      ["PAGA", "Fluxo de 3 documentos apenas - origem e destino em PIAs diferentes", "2 de 3"],
      ["RECEBIDA", "Fluxo de 3 documentos apenas - origem e destino em PIAs diferentes", "3 de 3"],
      ["EFETIVADA", "Fluxo de 2 documentos apenas - origem e destino na mesma PIA", "2 de 2"],
    ]
  },
  {
    id: "ADMS",
    titulo: "ADMs, CNPJ E LOCALIDADES",
    // Uma linha por PIA; a ADM se repete.
    chave: 5,
    cor: "#134f5c",
    // Endereço e cidade em colunas SEPARADAS porque o cabeçalho do
    // comprovante usa cada um em um lugar: o endereço à esquerda e a cidade
    // no centro. A inscrição estadual também é dado da ADM ("IE ISENTO").
    colunas: [
      { nome: "ADM", px: 120 },
      { nome: "CNPJ", px: 130 },
      { nome: "Endere\u00e7o", px: 250 },
      { nome: "Cidade / UF", px: 120 },
      { nome: "Inscri\u00e7\u00e3o estadual", px: 110 },
      { nome: "PIA", px: 150 },
      { nome: "Status da PIA", px: 150 },
    ],
    dados: [
      ["ADM Coxim-MS", "03.673.233/0001-43", "RUA JOAQUIM CARDEAL DE SOUZA , 311", "COXIM - MS", "ISENTO", "PIA-COXIM", "Ativa"],
      ["ADM Coxim-MS", "03.673.233/0001-43", "RUA JOAQUIM CARDEAL DE SOUZA , 311", "COXIM - MS", "ISENTO", "PIA-SONORA", "Ativa"],
      ["ADM Coxim-MS", "03.673.233/0001-43", "RUA JOAQUIM CARDEAL DE SOUZA , 311", "COXIM - MS", "ISENTO", "PIA-S\u00c3O GABRIEL", "Ativa"],
      ["ADM Coxim-MS", "03.673.233/0001-43", "RUA JOAQUIM CARDEAL DE SOUZA , 311", "COXIM - MS", "ISENTO", "PIA-ALCIN\u00d3POLIS", "Inativa (futura)"],
      // Cart\u00e3o CNPJ da Receita, conferido em 01/07/2026.
      ["ADM Costa Rica-MS", "15.409.246/0001-99", "RUA TERCIO TEIXEIRA MACHADO , 759", "COSTA RICA - MS", "ISENTO", "PIA-COSTA", "Ativa"],
    ]
  },
  {
    id: "BANCOS",
    titulo: "ABREVIATURAS DE BANCOS",
    cor: "#0b5394",
    colunas: [
      { nome: "Nome do banco", px: 230 },
      { nome: "Abreviatura", px: 90 },
      { nome: "Observa\u00e7\u00e3o", px: 280 },
    ],
    dados: [
      ["BANCO DO BRASIL", "BB", ""],
      ["SANTANDER", "SANT", ""],
      ["CAIXA ECONOMICA FEDERAL", "CEF", ""],
      ["ITAU", "ITAU", ""],
      ["BRADESCO", "BRAD", ""],
      ["SICREDI", "SICRED", ""],
      ["SICOOB", "SICOOB", ""],
      ["BANCO INTER", "INTER", ""],
      ["NUBANK", "NUBANK", ""],
      ["BANRISUL", "BANRIS", ""],
      ["SAFRA", "SAFRA", ""],
      ["BANCO DO NORDESTE", "BNB", ""],
      ["MERCADO PAGO", "MPAGO", ""],
      ["PAGCORP / ACG", "ACG", "Conta de cartao pre-pago corporativo (nao e banco)"],
    ]
  },
  {
    id: "CONTROLE",
    titulo: "CONTROLE DA NUMERA\u00c7\u00c3O",
    cor: "#444444",
    colunas: [
      { nome: "Chave", px: 200 },
      { nome: "Valor", px: 200 },
      { nome: "Para que serve", px: 340 },
    ],
    dados: [
      ["PREFIXO_REFERENCIA", "CMP", "Letras que abrem a Refer\u00eancia \u2014 CMP de comprovante"],
      ["ANO_CORRENTE", "26", "Ano de dois d\u00edgitos usado na Refer\u00eancia (CMP-26/NNN)"],
      ["ULTIMO_NUMERO", "0", "\u00daltimo n\u00famero de Refer\u00eancia j\u00e1 gerado neste ano"],
      ["PROXIMA_REFERENCIA", "CMP-26/001", "Sugest\u00e3o autom\u00e1tica para o pr\u00f3ximo comprovante"],
      ["PASTA_DRIVE_PADRAO", "", "ID ou link da pasta do Drive onde os PDFs s\u00e3o salvos"],
      ["RESTRICOES_ATIVAS", "SIM", "SIM = as regras entre contas filtram as listas e travam o que n\u00e3o \u00e9 permitido. N\u00c3O = tudo liberado, para ajuste financeiro ou cont\u00e1bil"],
      ["PRAXE_CARTAO_NA_MESMA_PIA", "SIM", "Praxe da tesouraria de Coxim: cart\u00e3o carregado pela tesouraria do PR\u00d3PRIO departamento. N\u00c3O h\u00e1 trava \u2014 s\u00f3 uma nota de lembrete. \u00c9 PREFER\u00caNCIA, n\u00e3o determina\u00e7\u00e3o: outra ADM p\u00f5e N\u00c3O e a nota some"],
      ["URL_TELA_CHEIA", "", "Endere\u00e7o do App da Web, para abrir o formul\u00e1rio numa aba inteira. Vazio = o link nem aparece. Sai de Implantar \u2192 Nova implanta\u00e7\u00e3o \u2192 App da Web"],
    ]
  },
];

// ===========================================================================
// CRIAÇÃO DA ABA
// ===========================================================================

/**
 * Monta a aba "Cadastros" — CRIANDO, quando ela não existe, ou RECRIANDO,
 * quando já existe. São duas coisas diferentes, e confundi-las destrói dados.
 *
 * **Criar** (a aba não existe): nasce com as listas originais do projeto e o
 * controle da numeração no zero. É o primeiro dia.
 *
 * **Recriar** (a aba existe): reconstrói a *estrutura* — colunas, cores,
 * congelamento, intervalos nomeados — e **devolve para dentro dela tudo o que
 * já estava lá**: as contas que alguém cadastrou à mão, os cartões que
 * trocaram de responsável, e o controle da numeração. Só então acrescenta as
 * linhas novas que o projeto trouxe e que ainda não existiam.
 *
 * Por que isto importa: recriar era a única forma de receber uma conta nova
 * vinda de uma atualização, e ao mesmo tempo apagava a Referência já
 * consumida — o próximo comprovante sairia com um número já usado. Em
 * protótipo não custa nada; com o sistema rodando, é um documento duplicado
 * no SIGA. Agora as duas coisas convivem: a estrutura se atualiza, os dados
 * ficam.
 *
 * A comparação do que "já existe" é pela PRIMEIRA COLUNA de cada lista (a
 * PIA, o nº do cartão, o nome do diácono, a chave do controle). É a coluna
 * que identifica o registro em todas as oito.
 */
function criarAbaCadastros() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var antiga = ss.getSheetByName(ABA_CADASTROS);
  var recriando = !!antiga;

  var guardado = recriando ? guardarOQueJaExiste_(ss) : null;

  if (antiga) antiga.setName(ABA_CADASTROS + '_ANTIGA_' + new Date().getTime());
  var sh = ss.insertSheet(ABA_CADASTROS);
  if (antiga) ss.deleteSheet(antiga);

  // Tira os intervalos nomeados velhos ANTES de criar os novos. `setNamedRange`
  // com um nome que já existe não substitui: cria um segundo com o mesmo nome,
  // e a partir daí `getRangeByName` pode devolver o antigo — que aponta para
  // uma aba que não existe mais. O sintoma é sempre o mesmo e sempre confuso:
  // uma lista que "sumiu" sem ninguém ter apagado nada.
  limparIntervalosNomeados_(ss);

  var totalColunas = 0;
  BLOCOS_CADASTRO.forEach(function (b) { totalColunas += b.colunas.length + 1; });
  var totalLinhas = 2 + maiorBloco_() + LINHAS_DE_FOLGA;

  ajustarGrade_(sh, totalColunas, totalLinhas);

  var coluna = 1;
  BLOCOS_CADASTRO.forEach(function (bloco) {
    desenharBloco_(ss, sh, bloco, coluna, totalLinhas, guardado ? guardado[bloco.id] : null);
    sh.setColumnWidth(coluna + bloco.colunas.length, 16);   // separador
    coluna += bloco.colunas.length + 1;
  });

  sh.setFrozenRows(2);
  sh.setActiveSelection('A1');
  esquecerCadastros_();
  SpreadsheetApp.flush();

  contarOQueAconteceu_(recriando, guardado);
  return sh;
}

/** Remove os `CAD_*` que sobraram da aba anterior. */
function limparIntervalosNomeados_(ss) {
  ss.getNamedRanges().forEach(function (nomeado) {
    if (String(nomeado.getName() || '').indexOf('CAD_') === 0) nomeado.remove();
  });
}

/** Copia, linha por linha, o que está hoje em cada uma das listas. */
function guardarOQueJaExiste_(ss) {
  var guardado = {};
  BLOCOS_CADASTRO.forEach(function (bloco) {
    var intervalo = ss.getRangeByName('CAD_' + bloco.id);
    if (!intervalo) { guardado[bloco.id] = []; return; }
    guardado[bloco.id] = intervalo.getValues().filter(function (linha) {
      return String(linha[0]).trim() !== '';
    });
  });
  return guardado;
}

/**
 * CONSERTA LINHAS QUE FICARAM DESLOCADAS POR UMA COLUNA NOVA NO MEIO.
 *
 * O defeito, que aconteceu de verdade: a coluna **Natureza** foi acrescentada
 * no MEIO do bloco CONTAS. Ao recriar, as linhas que já estavam na aba tinham
 * uma coluna a menos, foram encostadas à esquerda e completadas no fim — e
 * tudo da Natureza em diante andou uma casa. "Ativa" virou a Natureza, a
 * Natureza real sumiu, e o Status ficou vazio.
 *
 * Isso produziu **três sintomas que pareciam problemas diferentes**: todas as
 * contas aparecendo como inativas, nenhuma regra entre contas funcionando, e
 * DINHEIRO sendo oferecido para a ACG. Um defeito só.
 *
 * A detecção é provável, não adivinhada: uma coluna com **lista fechada de
 * valores** (hoje só a Natureza) guardando algo que não está na lista é
 * impossível num cadastro correto. E o conserto só é aplicado quando ele
 * **se prova**: desloca de volta, confere se agora tudo encaixa, e desfaz se
 * não encaixar. Errar aqui seria estragar o cadastro em silêncio, que é pior
 * do que deixar como está.
 */
function consertarDeslocamento_(bloco, linhas) {
  var quantasColunas = bloco.colunas.length;
  var alvo = -1;
  bloco.colunas.forEach(function (c, i) { if (c.valores && alvo < 0) alvo = i; });
  if (alvo < 0) return { linhas: linhas, consertadas: 0 };

  var validos = {};
  bloco.colunas[alvo].valores.forEach(function (v) { validos[String(v).toUpperCase()] = true; });

  // De onde tirar o valor da coluna nova: a própria lista do projeto.
  var doProjeto = {};
  bloco.dados.forEach(function (linha) {
    var chave = chaveDaLinha_(bloco, linha);
    if (chave) doProjeto[chave] = linha;
  });

  var consertadas = 0;
  var saida = (linhas || []).map(function (linha) {
    var valor = String(linha[alvo] == null ? '' : linha[alvo]).trim().toUpperCase();
    if (!valor || validos[valor]) return linha;          // nada a consertar

    var cheia = ajustarLargura_(linha, quantasColunas);
    if (String(cheia[quantasColunas - 1] || '').trim() !== '') return linha;  // sem espaço

    var tentativa = cheia.slice();
    for (var i = quantasColunas - 1; i > alvo; i--) tentativa[i] = cheia[i - 1];

    var referencia = doProjeto[chaveDaLinha_(bloco, cheia)];
    tentativa[alvo] = referencia ? referencia[alvo] : '';

    /* A PROVA: o valor que estava na coluna errada tem de ter ido para uma
       coluna onde ele faça sentido. Se a linha do projeto existe, comparamos
       com ela; se não existe, exigimos ao menos que a coluna alvo tenha
       ficado com um valor válido (ou vazio, quando não há de onde tirar). */
    var encaixou = referencia
      ? String(tentativa[alvo + 1]).trim().toUpperCase() ===
        String(referencia[alvo + 1]).trim().toUpperCase()
      : true;
    if (!encaixou) return linha;

    consertadas++;
    return tentativa;
  });

  return { linhas: saida, consertadas: consertadas };
}

/**
 * Junta o que já existia com o que o projeto traz, sem repetir.
 *
 * O que já estava vem primeiro e **manda**: se alguém corrigiu o texto de uma
 * conta à mão, a correção fica. Do lado do projeto entram só as linhas cuja
 * primeira coluna ainda não apareceu.
 */
function juntarSemRepetir_(bloco, jaExistia, doProjeto) {
  var quantasColunas = bloco.colunas.length;
  var vistos = {}, saida = [];
  function por(lista) {
    (lista || []).forEach(function (linha) {
      if (String(linha[0]).trim() === '') return;
      var chave = chaveDaLinha_(bloco, linha);
      if (!chave || vistos[chave]) return;
      vistos[chave] = true;
      saida.push(ajustarLargura_(linha, quantasColunas));
    });
  }
  por(jaExistia);     // o que já estava manda
  por(doProjeto);     // as novidades entram ao lado
  return saida;
}

/**
 * Tira da aba as linhas que o projeto APOSENTOU.
 *
 * Recriar preserva o que já existe — é a regra que impede a recriação de
 * apagar o trabalho de quem editou a aba à mão. Só que ela tem um custo: uma
 * linha que o projeto deixou de trazer **continua para sempre** na aba de
 * quem já a tinha. O DOC, extinto pelo Banco Central, continuaria oferecido
 * como forma de movimentação em toda planilha já criada.
 *
 * `bloco.aposentadas` é a única coisa que autoriza a recriação a tirar uma
 * linha, e é uma lista fechada, escrita à mão, chave por chave: não é uma
 * regra ("tire o que o projeto não traz mais"), que apagaria em silêncio toda
 * conta e todo diácono que o Taynã cadastrou. E o que sai aparece na janela,
 * em SAIU, com o nome — quem recria fica sabendo.
 */
function aposentar_(bloco, linhas) {
  var mortas = {};
  (bloco.aposentadas || []).forEach(function (quem) {
    /* Uma aposentada pode ser o TEXTO da chave (quando a chave é uma coluna
       só) ou a LINHA inteira, em lista — que é o caso das REGRAS ENTRE CONTAS,
       cuja chave são quatro colunas. Escrever "ACG ‖ ACG ‖  ‖ " à mão seria
       pedir para errar num separador invisível. */
    mortas[Object.prototype.toString.call(quem) === '[object Array]'
      ? chaveDaLinha_(bloco, quem)
      : String(quem).trim().toUpperCase()] = true;
  });
  if (!(bloco.aposentadas || []).length) return linhas || [];

  return (linhas || []).filter(function (linha) {
    return !mortas[chaveDaLinha_(bloco, linha)];
  });
}

/**
 * Preenche, nas linhas que já estavam na aba, a COLUNA QUE ACABOU DE NASCER.
 *
 * O problema, medido: uma lista ganha uma coluna nova no fim, o projeto traz
 * as linhas dele já com ela preenchida — e nada disso chega a quem já tem a
 * aba criada, porque as linhas dele são preservadas como estão e a coluna
 * nova fica vazia em todas. O sistema passa a ter uma regra que não vale para
 * ninguém, sem nenhum sinal de que não vale. Foi o que aconteceria agora com
 * a Instituição das contas e com as Formas que combinam de cada finalidade.
 *
 * A DETECÇÃO NÃO ADIVINHA, e é aí que ela deixa de ser perigosa: só é
 * considerada nova a coluna que está vazia em **todas** as linhas da aba. Uma
 * coluna que alguém esvaziou de propósito numa linha, ou em cinco, tem valor
 * em alguma outra e não entra aqui. E o valor não é inventado: vem da linha
 * do projeto com a mesma chave — se a linha é do usuário, nada acontece.
 */
function completarColunaNova_(bloco, linhas) {
  if (!linhas || !linhas.length) return { linhas: linhas || [], completadas: 0 };
  var quantasColunas = bloco.colunas.length;

  var doProjeto = {};
  bloco.dados.forEach(function (linha) {
    var chave = chaveDaLinha_(bloco, linha);
    if (chave) doProjeto[chave] = linha;
  });

  var cheias = linhas.map(function (l) { return ajustarLargura_(l, quantasColunas); });

  var nascendo = [];
  for (var c = 0; c < quantasColunas; c++) {
    var vaziaEmTodas = true;
    for (var i = 0; i < cheias.length; i++) {
      if (String(cheias[i][c] == null ? '' : cheias[i][c]).trim() !== '') { vaziaEmTodas = false; break; }
    }
    if (vaziaEmTodas) nascendo.push(c);
  }
  if (!nascendo.length) return { linhas: cheias, completadas: 0 };

  var completadas = 0;
  cheias.forEach(function (linha) {
    var referencia = doProjeto[chaveDaLinha_(bloco, linha)];
    if (!referencia) return;
    var mexeu = false;
    nascendo.forEach(function (c) {
      var valor = String(referencia[c] == null ? '' : referencia[c]).trim();
      if (!valor) return;
      linha[c] = referencia[c];
      mexeu = true;
    });
    if (mexeu) completadas++;
  });

  return { linhas: cheias, completadas: completadas };
}

/** Uma lista pode ter ganhado ou perdido coluna entre uma versão e outra. */
function ajustarLargura_(linha, quantasColunas) {
  var saida = linha.slice(0, quantasColunas);
  while (saida.length < quantasColunas) saida.push('');
  return saida;
}

/**
 * Conta para o usuário o que acabou de acontecer com os dados dele.
 *
 * **Janela, e não aviso de canto.** O `toast` do Sheets é uma caixinha cinza
 * que aparece no canto de baixo à direita e some sozinha — é fácil não ver,
 * ainda mais depois de uma operação que demora alguns segundos e faz a tela
 * piscar. Recriar os Cadastros é raro e consequente: quem faz precisa **ler**
 * o que aconteceu com os dados, não ter a chance de ler.
 */
function contarOQueAconteceu_(recriando, guardado) {
  var ui = SpreadsheetApp.getUi();

  if (!recriando) {
    ui.alert('Aba Cadastros criada',
      'A aba nasceu com as listas originais do projeto.\n\n' +
      'A numeração das Referências começa do zero: a primeira será ' +
      proximaReferencia_() + '.', ui.ButtonSet.OK);
    return;
  }

  /* SÓ O QUE MUDOU — nem totais, nem "mantidos".
     A primeira versão mostrava "CONTAS: 27 mantidas + 2 novas = 29". Com o
     tempo essa janela vira uma parede de números que ninguém lê, e o que
     importa (entraram duas contas, QUAIS?) fica escondido no meio. Agora ela
     responde uma pergunta só: o que entrou e o que saiu. Se nada mudou, ela
     diz isso em uma linha. */
  var depois = guardarOQueJaExiste_(SpreadsheetApp.getActiveSpreadsheet());
  var entraram = [], sairam = [], totalEntrou = 0, totalSaiu = 0;

  BLOCOS_CADASTRO.forEach(function (bloco) {
    var antes = rotulosPorChave_(bloco, guardado[bloco.id]);
    var agora = rotulosPorChave_(bloco, depois[bloco.id]);

    var novas = [], perdidas = [];
    Object.keys(agora).forEach(function (k) { if (!antes[k]) novas.push(agora[k]); });
    Object.keys(antes).forEach(function (k) { if (!agora[k]) perdidas.push(antes[k]); });

    if (novas.length) { totalEntrou += novas.length; entraram.push(listarPoucos_(bloco, novas)); }
    if (perdidas.length) { totalSaiu += perdidas.length; sairam.push(listarPoucos_(bloco, perdidas)); }
  });

  var recado = [];

  var consertadas = 0, ondeConsertou = [];
  BLOCOS_CADASTRO.forEach(function (b) {
    var n = CONSERTOS_DA_RECRIACAO[b.id] || 0;
    if (n) { consertadas += n; ondeConsertou.push('  • ' + b.titulo + ': ' + n); }
  });
  if (consertadas) {
    recado.push('DESENTORTADO (' + consertadas + '):');
    recado.push(ondeConsertou.join('\n'));
    recado.push('Estas linhas estavam com os valores uma coluna fora do lugar, ' +
                'de quando a lista ganhou uma coluna nova no meio. Os dados ' +
                'voltaram para as colunas certas.');
    recado.push('');
  }

  var completadas = 0, ondeCompletou = [];
  BLOCOS_CADASTRO.forEach(function (b) {
    var n = COMPLETADOS_DA_RECRIACAO[b.id] || 0;
    if (n) { completadas += n; ondeCompletou.push('  \u2022 ' + b.titulo + ': ' + n); }
  });
  if (completadas) {
    recado.push('COMPLETADO (' + completadas + '):');
    recado.push(ondeCompletou.join('\n'));
    recado.push('Estas listas ganharam uma coluna nova, e ela estava vazia em ' +
                'todas as linhas. O valor do projeto foi escrito nela. Nenhum ' +
                'dado que voc\u00ea j\u00e1 tinha foi trocado.');
    recado.push('');
  }

  if (totalEntrou) {
    recado.push('ENTROU (' + totalEntrou + '):');
    recado.push(entraram.join('\n'));
  }
  if (totalSaiu) {
    if (recado.length) recado.push('');
    recado.push('SAIU (' + totalSaiu + '):');
    recado.push(sairam.join('\n'));
  }
  if (!recado.length) {
    recado.push('Nenhum registro entrou nem saiu. Só a aparência da aba foi ' +
                'refeita — os dados são os mesmos de antes.');
  }

  ui.alert('Aba Cadastros recriada',
    recado.join('\n') + '\n\n' +
    (completadas ? 'Fora a coluna nova acima, nada do que já estava lá foi alterado.\n'
                 : 'Nada do que já estava lá foi alterado.\n') +
    'Último número usado: ' + lerControle_('ULTIMO_NUMERO') + '\n' +
    'Próxima Referência: ' + proximaReferencia_(), ui.ButtonSet.OK);
}

/** As linhas de um bloco, indexadas pela chave, com um rótulo legível. */
function rotulosPorChave_(bloco, linhas) {
  var mapa = {};
  (linhas || []).forEach(function (linha) {
    var chave = chaveDaLinha_(bloco, linha);
    if (!chave.replace(/[\u2016\s]/g, '')) return;   // chave só de separadores = linha vazia
    mapa[chave] = rotuloDaLinha_(bloco, linha);
  });
  return mapa;
}

/**
 * Como a linha aparece na janela do recriar.
 *
 * Com chave composta, o rótulo não pode ser "a coluna da chave" — não há uma
 * só. Junta as colunas da chave, que é justamente o que identifica a linha
 * para quem lê: "CAIXA -> * " diz mais do que "CAIXA".
 */
function rotuloDaLinha_(bloco, linha) {
  var colunas = bloco.chave;
  if (colunas === undefined || colunas === null) colunas = 0;
  if (typeof colunas === 'number') colunas = [colunas];

  var pedacos = colunas.map(function (c) {
    return String(linha[c] == null ? '' : linha[c]).trim();
  }).filter(function (t) { return t; });
  return pedacos.join(' \u2192 ');
}

/**
 * Escreve a lista de um bloco, cortando o excesso.
 *
 * Mostrar 40 nomes é a mesma parede de números de que ele se queixou, só com
 * outra cara. Seis nomes e a conta do resto dizem o mesmo em três linhas.
 */
function listarPoucos_(bloco, nomes) {
  var MOSTRAR = 6;
  var linha = '  • ' + bloco.titulo + ' (' + nomes.length + '):\n';
  linha += nomes.slice(0, MOSTRAR).map(function (n) { return '      - ' + n; }).join('\n');
  if (nomes.length > MOSTRAR) linha += '\n      - ... e mais ' + (nomes.length - MOSTRAR);
  return linha;
}

/** Quantidade de linhas da maior lista. */
function maiorBloco_() {
  var maior = 0;
  BLOCOS_CADASTRO.forEach(function (b) { maior = Math.max(maior, b.dados.length); });
  return maior;
}

function ajustarGrade_(sh, colunas, linhas) {
  if (sh.getMaxColumns() > colunas) sh.deleteColumns(colunas + 1, sh.getMaxColumns() - colunas);
  else if (sh.getMaxColumns() < colunas) sh.insertColumnsAfter(sh.getMaxColumns(), colunas - sh.getMaxColumns());
  if (sh.getMaxRows() > linhas) sh.deleteRows(linhas + 1, sh.getMaxRows() - linhas);
  else if (sh.getMaxRows() < linhas) sh.insertRowsAfter(sh.getMaxRows(), linhas - sh.getMaxRows());
}

/** Escreve um bloco (título, cabeçalho, dados) a partir da coluna indicada. */
function desenharBloco_(ss, sh, bloco, coluna, totalLinhas, jaExistia) {
  var nCols = bloco.colunas.length;

  // Antes de juntar, conserta o que ficou deslocado por uma coluna nova no
  // meio do bloco. Sem isto, a linha errada é preservada com carinho.
  var arrumado = consertarDeslocamento_(bloco, aposentar_(bloco, jaExistia));
  CONSERTOS_DA_RECRIACAO[bloco.id] = arrumado.consertadas;

  // Depois de desentortar, preenche a coluna que acabou de nascer — senão a
  // regra nova existiria no projeto e valeria para ninguém.
  var completado = completarColunaNova_(bloco, arrumado.linhas);
  COMPLETADOS_DA_RECRIACAO[bloco.id] = completado.completadas;

  var dados = juntarSemRepetir_(bloco, completado.linhas, bloco.dados);

  sh.getRange(1, coluna, 1, nCols).merge()
    .setValue(bloco.titulo)
    .setBackground(bloco.cor)
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sh.getRange(2, coluna, 1, nCols)
    .setValues([bloco.colunas.map(function (c) { return c.nome; })])
    .setBackground('#efefef')
    .setFontWeight('bold')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  /* TUDO NA ABA CADASTROS É TEXTO, e isso tem de ser dito ANTES de escrever.
     O Google converte sozinho o que PARECE número ou data, e a conversão é
     definitiva: "1.1.1" na coluna Folha virou "01/01/2001", e a janela do
     recriar passou a listar `F23 → Mon Jan 01 2001`. O mesmo risco corre para
     "100.10" (vira 100,1, perdendo o zero), "204.9" e qualquer código com
     ponto. Nenhuma coluna daqui é número de contar — são todas identificação.

     Formatar DEPOIS de escrever não desfaz nada: o valor já foi convertido.
     Por isso o formato vem primeiro, sobre a área inteira do bloco. */
  sh.getRange(2, coluna, totalLinhas - 1, nCols).setNumberFormat('@');

  if (dados.length) {
    sh.getRange(3, coluna, dados.length, nCols)
      .setValues(dados)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
      .setVerticalAlignment('middle');
  }

  bloco.colunas.forEach(function (c, i) { sh.setColumnWidth(coluna + i, c.px); });

  sh.getRange(1, coluna, totalLinhas, nCols)
    .setBorder(true, true, true, true, null, null, '#b7b7b7', SpreadsheetApp.BorderStyle.SOLID);

  ss.setNamedRange('CAD_' + bloco.id, sh.getRange(3, coluna, totalLinhas - 2, nCols));
}

// ===========================================================================
// LEITURA (usada pelas próximas etapas)
// ===========================================================================

/**
 * Lê uma lista da aba Cadastros e devolve uma lista de objetos, com os nomes
 * das colunas como chaves. Linhas em branco são descartadas.
 * Ex.: lerCadastro_('DIACONOS')[0].Nome
 */
/**
 * Memória das listas já lidas nesta execução.
 *
 * Cada `lerCadastro_` puxa um bloco inteiro da aba pela internet, e o mesmo
 * bloco era pedido várias vezes no mesmo clique: a lista CONTAS saía duas
 * vezes (uma por lado) e a ADMS três (CNPJ, título e cabeçalho). Guardar o
 * que já veio corta essas viagens sem mudar resposta nenhuma — a aba não muda
 * no meio de uma execução do script.
 *
 * A memória morre junto com a execução, então editar a aba Cadastros e rodar
 * de novo já lê o valor novo. Para esvaziar dentro da mesma execução (depois
 * de uma importação, por exemplo), `esquecerCadastros_()`.
 */
var CADASTROS_LIDOS = {};

/** Quantas linhas cada bloco teve de desentortar na última recriação. */
var CONSERTOS_DA_RECRIACAO = {};

/** Quantas linhas cada bloco teve de completar com uma coluna nova. */
var COMPLETADOS_DA_RECRIACAO = {};

function esquecerCadastros_() { CADASTROS_LIDOS = {}; }

function lerCadastro_(id) {
  if (CADASTROS_LIDOS[id]) return CADASTROS_LIDOS[id];

  var bloco = blocoPorId_(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var intervalo = ss.getRangeByName('CAD_' + id);
  if (!intervalo) throw new Error('A aba Cadastros ainda não foi criada (falta CAD_' + id + ').');

  var chaves = bloco.colunas.map(function (c) { return c.nome; });
  CADASTROS_LIDOS[id] = intervalo.getValues()
    .filter(function (linha) { return String(linha[0]).trim() !== ''; })
    .map(function (linha) {
      var item = {};
      chaves.forEach(function (chave, i) { item[chave] = linha[i]; });
      return item;
    });
  return CADASTROS_LIDOS[id];
}

/**
 * O valor que identifica uma linha dentro da sua lista.
 *
 * Quase sempre é a primeira coluna, mas não em CONTAS (onde a primeira é a
 * PIA, que se repete onze vezes) nem em ADMS (onde é a ADM, que se repete
 * quatro). Cada bloco declara a sua em `chave`; sem declaração, é a primeira.
 *
 * Usar a coluna errada aqui é silencioso e destrutivo: dez das onze contas de
 * PIA-COXIM viram "repetidas" e somem.
 */
function chaveDaLinha_(bloco, linha) {
  /* A chave pode ser UMA coluna ou VÁRIAS. Várias existe porque há listas em
     que nenhuma coluna sozinha identifica a linha — as REGRAS ENTRE CONTAS
     são o caso: metade delas começa com "*", e deduplicar pela primeira
     coluna apagou 7 das 11 regras em silêncio, deixando o sistema permitir o
     que devia proibir. É o mesmo defeito que CONTAS já tinha tido (a primeira
     coluna é a PIA, que se repete). */
  var colunas = bloco.chave;
  if (colunas === undefined || colunas === null) colunas = 0;
  if (typeof colunas === 'number') colunas = [colunas];

  return colunas.map(function (c) {
    return String(linha[c] == null ? '' : linha[c]).trim().toUpperCase();
  }).join(' \u2016 ');
}

function blocoPorId_(id) {
  for (var i = 0; i < BLOCOS_CADASTRO.length; i++) {
    if (BLOCOS_CADASTRO[i].id === id) return BLOCOS_CADASTRO[i];
  }
  throw new Error('Lista desconhecida no cadastro: ' + id);
}

/** Valor de uma chave do bloco CONTROLE (ex.: 'PROXIMA_REFERENCIA'). */
function lerControle_(chave) {
  var itens = lerCadastro_('CONTROLE');
  for (var i = 0; i < itens.length; i++) {
    if (itens[i].Chave === chave) return itens[i].Valor;
  }
  return '';
}

/** Escreve um valor no bloco CONTROLE. */
function gravarControle_(chave, valor) {
  esquecerCadastros_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var intervalo = ss.getRangeByName('CAD_CONTROLE');
  var dados = intervalo.getValues();
  for (var i = 0; i < dados.length; i++) {
    if (String(dados[i][0]).trim() === chave) {
      intervalo.getCell(i + 1, 2).setValue(valor);
      return true;
    }
  }
  return false;
}

// ===========================================================================
// REFERÊNCIA DO COMPROVANTE (CMP-AA/NNN)
// ===========================================================================

/**
 * Monta a Referência a partir do bloco CONTROLE: prefixo + ano + sequência.
 * O prefixo é um dado da aba, não do código — para mudar "CMP" por outra
 * coisa, basta editar a linha PREFIXO_REFERENCIA na aba Cadastros.
 */
function montarReferencia_(numero) {
  var prefixo = String(lerControle_('PREFIXO_REFERENCIA') || 'CMP').toUpperCase();
  var ano = String(lerControle_('ANO_CORRENTE') || '');
  var seq = ('00' + numero).slice(-3);
  return prefixo + '-' + ano + '/' + seq;
}

/**
 * Próxima Referência livre, sem gravar nada.
 *
 * A Referência **não é sugestão**: é o número que o sistema gerou, e é ele
 * que vai no comprovante. Quem quiser outro precisa declarar a exceção no
 * formulário (segunda via, ou histórico indisponível) — ver a seção da
 * Referência em `apps_script/04_Formulario.gs`.
 */
function proximaReferencia_() {
  virarOAnoSePreciso_();
  return montarReferencia_(Number(lerControle_('ULTIMO_NUMERO') || 0) + 1);
}

/**
 * A sequência recomeça do 1 a cada ano civil.
 *
 * Sem isto, em janeiro o sistema continuaria de onde parou em dezembro e
 * escreveria o ano velho na Referência até alguém reparar. A virada acontece
 * sozinha na primeira Referência pedida no ano novo, e é gravada na aba
 * Cadastros — não fica só na memória.
 */
function virarOAnoSePreciso_() {
  var agora = Utilities.formatDate(new Date(),
    SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yy');
  var guardado = String(lerControle_('ANO_CORRENTE') || '').trim();
  if (guardado === agora) return;
  gravarControle_('ANO_CORRENTE', agora);
  gravarControle_('ULTIMO_NUMERO', 0);
}

/** O número sequencial de dentro de uma Referência ('CMP-26/007' -> 7). */
function numeroDaReferencia_(texto) {
  var achado = String(texto || '').match(/\/(\d+)\s*$/);
  return achado ? Number(achado[1]) : 0;
}

/**
 * Marca uma Referência como usada, e calcula a próxima.
 *
 * Chamada quando o PDF é gerado — nunca quando o formulário abre. Duas
 * propriedades importantes, as duas de propósito:
 *
 *   - **Só anda para a frente.** Uma Referência menor que a última usada não
 *     puxa a contagem para trás. É o que permite emitir a segunda via de um
 *     comprovante antigo, ou acertar um número perdido, sem estragar a
 *     sequência de quem vier depois.
 *   - **Repetir não conta duas vezes.** Uma movimentação gera 2 ou 3 PDFs com
 *     a MESMA Referência; do segundo em diante a contagem não se mexe. Sem
 *     isso, cada movimentação queimaria três números.
 *
 * Devolve true quando a contagem andou.
 */
function consumirReferencia_(texto) {
  var numero = numeroDaReferencia_(texto);
  var ultimo = Number(lerControle_('ULTIMO_NUMERO') || 0);
  var andou = numero > ultimo;
  if (andou) gravarControle_('ULTIMO_NUMERO', numero);
  gravarControle_('PROXIMA_REFERENCIA', montarReferencia_(Math.max(numero, ultimo) + 1));
  return andou;
}

// ===========================================================================
// ABREVIATURA DE BANCO (no máximo MAX_LETRAS_ABREVIATURA letras)
// ===========================================================================

var PALAVRAS_IGNORADAS_BANCO = ['BANCO', 'BCO', 'SA', 'S', 'A', 'LTDA',
  'DO', 'DA', 'DE', 'DOS', 'DAS', 'E', 'CONTA', 'CORRENTE'];

/** Tira acentos, pontuação e deixa em caixa alta. */
function normalizarNomeBanco_(texto) {
  var t = String(texto || '').toUpperCase()
    .replace(/[ÁÀÂÃÄ]/g, 'A').replace(/[ÉÈÊË]/g, 'E').replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[ÓÒÔÕÖ]/g, 'O').replace(/[ÚÙÛÜ]/g, 'U').replace(/[Ç]/g, 'C');
  return t.replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Sugere a abreviatura de um banco, dentro do limite de letras do projeto
 * (MAX_LETRAS_ABREVIATURA, hoje 6 — subiu de 5 por causa de SICRED).
 * 1º procura na lista ABREVIATURAS DE BANCOS da aba Cadastros;
 * 2º se não achar, deduz: primeira palavra significativa que caiba no limite,
 *    senão as iniciais, senão as primeiras letras.
 * Devolve { abreviatura, origem: 'cadastrada' | 'automatica' }.
 */
function sugerirAbreviaturaBanco_(nome) {
  var alvo = normalizarNomeBanco_(nome);
  if (!alvo) return { abreviatura: '', origem: 'automatica' };

  try {
    var cadastrados = lerCadastro_('BANCOS');
    for (var i = 0; i < cadastrados.length; i++) {
      var conhecido = normalizarNomeBanco_(cadastrados[i]['Nome do banco']);
      if (conhecido && (alvo.indexOf(conhecido) >= 0 || conhecido.indexOf(alvo) >= 0)) {
        return {
          abreviatura: String(cadastrados[i].Abreviatura).toUpperCase(),
          origem: 'cadastrada'
        };
      }
    }
  } catch (e) { /* aba ainda não criada: segue na dedução automática */ }

  var palavras = alvo.split(' ').filter(function (p) {
    return p && PALAVRAS_IGNORADAS_BANCO.indexOf(p) < 0;
  });
  if (!palavras.length) return { abreviatura: alvo.replace(/ /g, '').slice(0, MAX_LETRAS_ABREVIATURA), origem: 'automatica' };
  if (palavras[0].length <= MAX_LETRAS_ABREVIATURA) return { abreviatura: palavras[0], origem: 'automatica' };
  if (palavras.length >= 3) {
    var iniciais = palavras.map(function (p) { return p.charAt(0); }).join('');
    return { abreviatura: iniciais.slice(0, MAX_LETRAS_ABREVIATURA), origem: 'automatica' };
  }
  return { abreviatura: palavras[0].slice(0, MAX_LETRAS_ABREVIATURA), origem: 'automatica' };
}

/**
 * Pergunta a abreviatura ao usuário: mostra a sugestão, e se ele não
 * concordar, pede a que ele quer. Grava no cadastro quando é nova.
 * Devolve a abreviatura escolhida, ou '' se ele cancelar.
 */
function confirmarAbreviaturaBanco_(nome) {
  var ui = SpreadsheetApp.getUi();
  var sugestao = sugerirAbreviaturaBanco_(nome);

  var resposta = ui.prompt(
    'Abreviatura do banco',
    'Banco: ' + nome + '\n\n' +
    'Sugestão: ' + sugestao.abreviatura +
    (sugestao.origem === 'cadastrada' ? ' (já cadastrada)' : ' (sugerida automaticamente)') +
    '\n\nPara aceitar, deixe em branco e clique OK.\n' +
    'Para usar outra, escreva a abreviatura (até ' + MAX_LETRAS_ABREVIATURA + ' letras).',
    ui.ButtonSet.OK_CANCEL);

  if (resposta.getSelectedButton() !== ui.Button.OK) return '';

  var escolhida = normalizarNomeBanco_(resposta.getResponseText()).replace(/ /g, '');
  if (!escolhida) escolhida = sugestao.abreviatura;

  if (escolhida.length > MAX_LETRAS_ABREVIATURA) {
    ui.alert('Abreviatura longa demais',
      'A abreviatura deve ter no máximo ' + MAX_LETRAS_ABREVIATURA + ' letras. Tente de novo.',
      ui.ButtonSet.OK);
    return confirmarAbreviaturaBanco_(nome);
  }

  if (sugestao.origem !== 'cadastrada' || escolhida !== sugestao.abreviatura) {
    acrescentarAbreviatura_(nome, escolhida);
  }
  return escolhida;
}

/** Acrescenta uma linha na lista ABREVIATURAS DE BANCOS. */
function acrescentarAbreviatura_(nome, abreviatura) {
  esquecerCadastros_();
  var intervalo = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('CAD_BANCOS');
  var dados = intervalo.getValues();
  for (var i = 0; i < dados.length; i++) {
    if (String(dados[i][0]).trim() === '') {
      intervalo.getCell(i + 1, 1).setValue(String(nome).toUpperCase());
      intervalo.getCell(i + 1, 2).setValue(abreviatura);
      return true;
    }
  }
  return false;
}

/** Item de menu: cadastrar a abreviatura de um banco novo. */
function cadastrarAbreviaturaDeBanco() {
  var ui = SpreadsheetApp.getUi();
  var nome = ui.prompt('Banco novo', 'Nome do banco, como aparece no extrato:', ui.ButtonSet.OK_CANCEL);
  if (nome.getSelectedButton() !== ui.Button.OK || !nome.getResponseText().trim()) return;

  var escolhida = confirmarAbreviaturaBanco_(nome.getResponseText().trim());
  if (escolhida) {
    ui.alert('Pronto', 'O banco será escrito como "' + escolhida + '" nas contas.', ui.ButtonSet.OK);
  }
}

/** Mostra quantos registros cada lista tem — para conferência. */
function conferirCadastros() {
  var linhas = BLOCOS_CADASTRO.map(function (b) {
    return b.titulo + ': ' + lerCadastro_(b.id).length + ' registro(s)';
  });

  var soltas = referenciasSoltas_();
  linhas.push('');
  if (soltas.length) {
    linhas.push('ATENÇÃO — ' + soltas.length + ' referência(s) a forma que não existe:');
    linhas.push(soltas.join('\n'));
    linhas.push('');
    linhas.push('Uma forma citada com o nome errado não dá erro: ela simplesmente ' +
                'nunca casa, e a opção some da tela sem explicação. Corrija o ' +
                'nome na célula, ou substitua a lista pela janela de importação.');
  } else {
    linhas.push('Nenhuma referência solta: toda forma citada nas outras listas existe.');
  }

  linhas.push('');
  linhas.push('Próxima referência: ' + proximaReferencia_());
  SpreadsheetApp.getUi().alert('Cadastros', linhas.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Formas citadas em outras listas que NÃO existem no bloco FORMAS.
 *
 * Nasceu de uma renomeação: "TRANSF. TED" virou "TED", e a Remessa continuou
 * citando o nome velho na coluna *Formas que combinam*. Isso não dá erro em
 * lugar nenhum — o nome simplesmente nunca casa, a finalidade some da tela
 * quando TED é escolhido, e não há uma linha sequer dizendo por quê. É o
 * defeito preferido deste projeto: silencioso e plausível.
 *
 * A conferência vale para as três colunas que citam forma pelo nome: *Formas
 * que combinam* (TIPOS) e *Formas permitidas* / *Formas proibidas* (RELACOES).
 * A família SAQUE conta como existente, porque proibir a família é legítimo.
 */
function referenciasSoltas_() {
  var existe = {};
  lerCadastro_('FORMAS').forEach(function (f) {
    var nome = String(f.Forma || '').trim().toUpperCase();
    if (nome) existe[nome] = true;
  });

  var achados = [];
  function olhar(onde, rotulo, texto) {
    nucleoListaDeFormas(texto).forEach(function (nome) {
      if (existe[nome]) return;
      achados.push('  • ' + onde + ' — ' + rotulo + ': "' + nome + '"');
    });
  }

  lerCadastro_('RELACOES').forEach(function (r) {
    var par = String(r['Natureza de origem'] || '') + ' -> ' + String(r['Natureza de destino'] || '');
    olhar('REGRAS ENTRE CONTAS', par + ' (permitidas)', r['Formas permitidas']);
    olhar('REGRAS ENTRE CONTAS', par + ' (proibidas)', r['Formas proibidas']);
  });

  /* E as regras de finalidade, que citam forma e subforma pelo nome — e citam
     também um CÓDIGO de finalidade, que é outro jeito de escrever errado sem
     dar erro: a regra simplesmente nunca encontra a finalidade dela. */
  var temFinalidade = {};
  lerCadastro_('FINALIDADES').forEach(function (f) {
    var cod = String(f['Código'] || '').trim().toUpperCase();
    if (cod) temFinalidade[cod] = true;
  });
  lerCadastro_('REGRAS_FINALIDADE').forEach(function (r) {
    var onde = 'ONDE CADA FINALIDADE VALE';
    var cod = String(r['Código da finalidade'] || '').trim().toUpperCase();
    var rotulo = cod + ' (folha ' + String(r['Folha'] || '?') + ')';
    if (cod && !temFinalidade[cod]) {
      achados.push('  • ' + onde + ' — ' + rotulo + ': código sem finalidade cadastrada');
    }
    olhar(onde, rotulo, r['Forma']);
    olhar(onde, rotulo, r['Subforma']);
  });

  return achados;
}

// ===========================================================================
// IMPORTAÇÃO DE DADOS (CSV, TSV ou tabela de Markdown)
// ===========================================================================
//
// Serve para atualizar qualquer lista da aba Cadastros sem digitar linha por
// linha: cola-se o texto na janela de importação e pronto. O texto pode vir
// de um .csv, de um .md, de um .txt, ou ser copiado direto de outra planilha.
//
// O caminho normal é: um chat novo com o assistente, mandando o arquivo ou
// colando os dados; ele devolve o texto pronto no formato certo; você cola
// aqui. O prompt para esse chat está em docs/05_importar_dados.md.

// ---------------------------------------------------------------------------
// CONFERÊNCIA DE COERÊNCIA — o dado que chegou parece ser desta lista?
// ---------------------------------------------------------------------------
//
// Existe para pegar o erro mais fácil de cometer e mais difícil de perceber:
// importar dados na lista errada. A conferência é feita ANTES de gravar, em
// duas frentes, e o que ela encontra vira uma pergunta ao usuário — nunca
// uma recusa automática, porque pode haver exceção legítima.

/** Exigências de cada lista nas colunas que identificam o registro. */
var REGRAS_COERENCIA = {
  CONTAS: [
    { coluna: 0, teste: /^PIA/i, descricao: 'a PIA deve começar com "PIA"' },
    { coluna: 5, teste: /:/, descricao: 'o texto da lista deve ter dois-pontos, como "PIA-COXIM: 101.10 - BB - ..."' }
  ],
  CARTOES: [
    { coluna: 0, teste: /^\d{6,}$/, descricao: 'o nº da conta do cartão deve ser só números' },
    { coluna: 2, teste: /^PIA/i, descricao: 'a PIA deve começar com "PIA"' }
  ],
  DIACONOS: [
    { coluna: 0, teste: /^\S+\s+\S+/, descricao: 'o nome deve ter pelo menos nome e sobrenome' }
  ],
  FINALIDADES: [
    { coluna: 0, teste: /^F\d+$/i, descricao: 'o código é F seguido de números, como "F13"' },
    { coluna: 1, teste: /\s/, descricao: 'a finalidade é uma frase, não uma palavra só' }
  ],
  REGRAS_FINALIDADE: [
    { coluna: 0, teste: /^F\d+$/i, descricao: 'o código é F seguido de números, como "F13"' },
    { coluna: 1, teste: /^\d+(\.\d+)+$/, descricao: 'a folha é uma numeração como "2.0.2.2"' }
  ],
  STATUS: [
    { coluna: 0, teste: /^(APROVADA|PAGA|RECEBIDA|EFETIVADA)$/i, descricao: 'o status deve ser APROVADA, PAGA, RECEBIDA ou EFETIVADA' }
  ],
  ADMS: [
    { coluna: 1, teste: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, descricao: 'o CNPJ deve estar no formato 00.000.000/0000-00' },
    { coluna: 5, teste: /^PIA/i, descricao: 'a PIA deve começar com "PIA"' }
  ],
  BANCOS: [
    { coluna: 1, teste: /^[A-Za-z0-9]{1,6}$/, descricao: 'a abreviatura deve ter no máximo 6 letras, sem espaço' }
  ],
  CONTROLE: [
    { coluna: 0, teste: /^[A-Z][A-Z_]+$/, descricao: 'a chave deve ser em MAIÚSCULAS com underline, como ANO_CORRENTE' }
  ]
};

/** Classifica um valor por "cara": número, código, CNPJ, PIA, texto… */
function perfilDoValor_(valor) {
  var v = String(valor == null ? '' : valor).trim();
  if (v === '') return 'vazio';
  if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(v)) return 'CNPJ';
  if (/^PIA/i.test(v)) return 'nome de PIA';
  if (/^\d+$/.test(v)) return 'número';
  if (/^\d{1,4}([.,]\d{1,4})+$/.test(v)) return 'código numérico';
  if (v.indexOf(':') >= 0) return 'texto com dois-pontos';
  return 'texto';
}

/**
 * Compara as linhas que chegaram com as que já estão na lista e com as
 * regras da lista. Devolve uma lista de avisos em português.
 */
function conferirCoerencia_(bloco, novas, existentes) {
  var avisos = [];
  var total = novas.length;

  // 1) Regras fixas da lista.
  (REGRAS_COERENCIA[bloco.id] || []).forEach(function (regra) {
    var fora = 0;
    novas.forEach(function (linha) {
      var v = String(linha[regra.coluna] == null ? '' : linha[regra.coluna]).trim();
      if (v !== '' && !regra.teste.test(v)) fora++;
    });
    if (fora) {
      avisos.push('• ' + fora + ' de ' + total + ' linha(s) na coluna "' +
        bloco.colunas[regra.coluna].nome + '": ' + regra.descricao + '.');
    }
  });

  // 2) Comparação com o que já existe: a coluna muda de "cara"?
  var preenchidas = (existentes || []).filter(function (l) {
    return String(l[0]).trim() !== '';
  });
  if (preenchidas.length >= 3) {
    bloco.colunas.forEach(function (coluna, i) {
      var contagem = {}, validos = 0;
      preenchidas.forEach(function (l) {
        var p = perfilDoValor_(l[i]);
        if (p === 'vazio') return;
        contagem[p] = (contagem[p] || 0) + 1;
        validos++;
      });
      if (validos < 3) return;

      var dominante = '', maior = 0;
      for (var p in contagem) { if (contagem[p] > maior) { maior = contagem[p]; dominante = p; } }
      if (maior / validos < 0.8) return;        // coluna variada demais: não dá para cobrar

      var divergentes = 0, exemplo = '';
      novas.forEach(function (linha) {
        var perfil = perfilDoValor_(linha[i]);
        if (perfil === 'vazio') return;
        if (perfil !== dominante) {
          divergentes++;
          if (!exemplo) exemplo = String(linha[i]).substring(0, 40);
        }
      });
      if (divergentes) {
        avisos.push('• coluna "' + coluna.nome + '": ' + divergentes + ' de ' + total +
          ' linha(s) com aparência diferente do resto da lista (o normal aí é ' +
          dominante + ', veio "' + exemplo + '").');
      }
    });
  }
  return avisos;
}

/**
 * Abre a janela de importação.
 *
 * O aviso do resultado fica numa faixa GRUDADA NO TOPO da janela, e a
 * confirmação de dados estranhos é feita por botões dentro da própria
 * janela — nada depende de alert() nem de confirm() do navegador, que o
 * Google bloqueia dentro desta janela.
 */
function abrirImportacaoDeDados() {
  var opcoes = BLOCOS_CADASTRO.map(function (b) {
    return '<option value="' + b.id + '">' + b.titulo + '</option>';
  }).join('');

  var html = [
    '<!DOCTYPE html><html><head><base target="_top"><style>',
    'body{font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:0;padding:12px}',
    'label{display:block;margin:10px 0 4px;font-weight:bold}',
    'select,textarea{width:100%;box-sizing:border-box}',
    'textarea{height:150px;font-family:Consolas,monospace;font-size:12px}',
    '.dica{color:#666;font-size:12px;margin-top:4px}',
    '.arquivo{border:1px dashed #999;border-radius:6px;padding:10px;background:#fafafa}',
    '.botoes{margin-top:12px;text-align:right}',
    'button{padding:8px 16px;font-size:13px;cursor:pointer}',
    '#aviso{margin-top:6px;font-size:12px;color:#188038}',
    '#banner{position:sticky;top:0;z-index:9;display:none;margin:-12px -12px 10px;',
    ' padding:12px;white-space:pre-wrap;max-height:210px;overflow:auto;',
    ' border-bottom:3px solid #999;font-size:13px}',
    '.ok{background:#e6f4ea;border-bottom-color:#34a853!important}',
    '.erro{background:#fce8e6;border-bottom-color:#d93025!important}',
    '.pergunta{background:#fef7e0;border-bottom-color:#f9ab00!important}',
    '#confirmacao{display:none;margin-top:10px;padding:10px;background:#fef7e0;',
    ' border:1px solid #f9ab00;border-radius:6px}',
    '</style></head><body>',

    '<div id="banner"></div>',

    '<label>1. Qual lista você quer atualizar?</label>',
    '<select id="bloco">', opcoes, '</select>',

    '<label>2. O que fazer com o que já está lá?</label>',
    '<select id="modo">',
    '<option value="ACRESCENTAR">Acrescentar ao fim da lista (mantém o que já existe)</option>',
    '<option value="SUBSTITUIR">Substituir a lista inteira (apaga o que já existe)</option>',
    '</select>',

    '<label>3. De onde vêm os dados?</label>',
    '<div class="arquivo">',
    '<input type="file" id="arquivo" accept=".csv,.txt,.md,.tsv,text/plain" onchange="carregar(this)">',
    '<div class="dica">Escolha um arquivo <b>.csv</b>, <b>.txt</b>, <b>.md</b> ou <b>.tsv</b> — ',
    'o conteúdo aparece na caixa abaixo para você conferir antes de importar.<br>',
    'Arquivo do Excel (.xlsx) não serve: no Excel, use <i>Arquivo &rarr; Salvar como &rarr; CSV</i>.</div>',
    '<div id="aviso"></div>',
    '</div>',

    '<label>… ou cole os dados aqui</label>',
    '<textarea id="texto" placeholder="Cole o conteúdo, ou copie e cole direto de outra planilha."></textarea>',
    '<div class="dica">Aceita CSV (vírgula), colado de planilha (tabulação) e tabela de Markdown. ',
    'Se a primeira linha for o cabeçalho das colunas, ela é ignorada automaticamente.</div>',

    '<div id="confirmacao">',
    '<div id="textoConfirmacao" style="white-space:pre-wrap;margin-bottom:10px"></div>',
    '<button onclick="enviar(true)">Importar assim mesmo</button> ',
    '<button onclick="cancelar()">Cancelar</button>',
    '</div>',

    '<div class="botoes"><button onclick="enviar(false)" id="bt">Importar</button></div>',

    '<script>',
    'function carregar(input){',
    '  var f = input.files[0]; if (!f) return;',
    '  ler(f, "UTF-8", function (txt) {',
    '    if (txt.indexOf("\\ufffd") >= 0) { ler(f, "ISO-8859-1", function (t2) { preencher(t2, f.name); }); }',
    '    else preencher(txt, f.name);',
    '  });',
    '}',
    'function ler(f, codificacao, depois){',
    '  var r = new FileReader();',
    '  r.onload = function (e) { depois(e.target.result); };',
    '  r.onerror = function () { banner("Não consegui ler o arquivo.", "erro"); };',
    '  r.readAsText(f, codificacao);',
    '}',
    'function preencher(txt, nome){',
    '  document.getElementById("texto").value = txt;',
    '  var linhas = txt.split(/\\r?\\n/).filter(function (l) { return l.trim() !== ""; }).length;',
    '  document.getElementById("aviso").textContent =',
    '    "Carregado: " + nome + " — " + linhas + " linha(s). Confira abaixo e clique em Importar.";',
    '}',
    'function enviar(confirmado){',
    '  esconderConfirmacao();',
    '  var bt = document.getElementById("bt");',
    '  bt.disabled = true; bt.textContent = "Importando...";',
    '  banner("Importando…", "ok");',
    '  google.script.run.withSuccessHandler(fim).withFailureHandler(falhou)',
    '    .importarCadastroTexto(document.getElementById("bloco").value,',
    '                           document.getElementById("texto").value,',
    '                           document.getElementById("modo").value,',
    '                           confirmado === true);',
    '}',
    'function fim(r){',
    '  liberar();',
    '  if (r && r.status === "CONFIRMAR") {',
    '    banner("Confira antes de continuar — nada foi gravado ainda.", "pergunta");',
    '    document.getElementById("textoConfirmacao").textContent = r.mensagem;',
    '    document.getElementById("confirmacao").style.display = "block";',
    '    document.getElementById("confirmacao").scrollIntoView(true);',
    '    return;',
    '  }',
    '  banner(r && r.mensagem ? r.mensagem : String(r), "ok");',
    '  document.getElementById("texto").value = "";',
    '  document.getElementById("aviso").textContent = "";',
    '}',
    'function falhou(e){',
    '  liberar();',
    '  banner("NÃO FOI POSSÍVEL IMPORTAR. Nada foi gravado. " + (e && e.message ? e.message : e), "erro");',
    '}',
    'function cancelar(){',
    '  esconderConfirmacao();',
    '  banner("Importação cancelada. Nada foi gravado.", "erro");',
    '}',
    'function esconderConfirmacao(){',
    '  document.getElementById("confirmacao").style.display = "none";',
    '}',
    'function liberar(){',
    '  var bt = document.getElementById("bt");',
    '  bt.disabled = false; bt.textContent = "Importar";',
    '}',
    'function banner(msg, classe){',
    '  var d = document.getElementById("banner");',
    '  d.textContent = msg; d.className = classe; d.style.display = "block";',
    '  window.scrollTo(0, 0);',
    '}',
    '</script></body></html>'
  ].join('');

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(600).setHeight(640),
    'Importar dados para os Cadastros');
}

/**
 * Importa o texto colado para uma lista da aba Cadastros.
 * modo: 'ACRESCENTAR' (junta ao que já existe) ou 'SUBSTITUIR' (troca tudo).
 * confirmado: true quando o usuário já respondeu "sim" a um aviso de
 * coerência — sem isso, dados fora do padrão da lista não são gravados.
 *
 * Devolve { status: 'OK' | 'CONFIRMAR', mensagem: '...' }.
 */
function importarCadastroTexto(idBloco, texto, modo, confirmado) {
  var bloco = blocoPorId_(idBloco);
  var nCols = bloco.colunas.length;
  var linhas = interpretarTabela_(texto);

  if (!linhas.length) throw new Error('Não encontrei nenhuma linha de dados no texto.');

  if (pareceCabecalho_(linhas[0], bloco)) linhas = linhas.slice(1);
  if (!linhas.length) throw new Error('O texto só tinha o cabeçalho, sem dados.');

  /* O MODO É CONFERIDO ANTES DE QUALQUER COISA. Sem isto, um modo escrito
     errado (um "substituir" em minúsculas, por exemplo) não dá erro nenhum:
     cai no caminho de ACRESCENTAR e a lista sai com tudo em DOBRO. Aconteceu
     na bancada, e em silêncio — que é como esse defeito chegaria à planilha
     de alguém. */
  modo = String(modo || '').trim().toUpperCase();
  if (modo !== 'ACRESCENTAR' && modo !== 'SUBSTITUIR') {
    throw new Error('Modo de importação desconhecido: "' + modo + '". ' +
      'Escolha "Acrescentar ao fim da lista" ou "Substituir a lista inteira".');
  }

  var problemas = [];
  var prontas = [];
  linhas.forEach(function (linha, i) {
    if (linha.join('').trim() === '') return;
    if (linha.length > nCols) {
      problemas.push('Linha ' + (i + 1) + ': tem ' + linha.length +
        ' colunas, mas a lista "' + bloco.titulo + '" tem ' + nCols + '.');
      return;
    }
    while (linha.length < nCols) linha.push('');
    prontas.push(linha);
  });

  if (problemas.length) {
    throw new Error(problemas.slice(0, 5).join('\n') +
      (problemas.length > 5 ? '\n(e mais ' + (problemas.length - 5) + ' linha(s))' : ''));
  }
  if (!prontas.length) throw new Error('Todas as linhas estavam vazias.');

  var intervalo = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('CAD_' + idBloco);
  if (!intervalo) throw new Error('A aba Cadastros ainda não foi criada.');

  var existentes = intervalo.getValues();

  // Confere se o dado parece mesmo ser desta lista — antes de gravar.
  if (!confirmado) {
    var avisos = conferirCoerencia_(bloco, prontas, existentes);
    if (avisos.length) {
      return {
        status: 'CONFIRMAR',
        mensagem: 'ATENÇÃO: os dados não parecem ser da lista "' + bloco.titulo + '".\n\n' +
          avisos.join('\n') + '\n\n' +
          'Isso costuma acontecer quando a lista escolhida não é a certa.\n' +
          'Confira a lista no passo 1 da janela.\n\n' +
          'Importar assim mesmo?'
      };
    }
  }

  var usadas = 0;
  existentes.forEach(function (l) { if (String(l[0]).trim() !== '') usadas++; });

  var repetidas = [];
  if (modo === 'ACRESCENTAR') {
    // Pela coluna que identifica o registro, e não pela primeira: em CONTAS a
    // primeira é a PIA, e importar dez contas de PIA-COXIM faria nove serem
    // descartadas como "repetidas".
    var jaTem = {};
    existentes.forEach(function (l) {
      var chave = chaveDaLinha_(bloco, l);
      if (chave) jaTem[chave] = true;
    });
    prontas = prontas.filter(function (l) {
      var chave = chaveDaLinha_(bloco, l);
      if (jaTem[chave]) { repetidas.push(l[bloco.chave || 0]); return false; }
      jaTem[chave] = true;
      return true;
    });
  }

  var primeiraLinha = (modo === 'SUBSTITUIR') ? 1 : usadas + 1;
  var cabem = intervalo.getNumRows() - primeiraLinha + 1;
  if (prontas.length > cabem) {
    throw new Error('Não cabe: a lista tem espaço para mais ' + cabem +
      ' registro(s) e você mandou ' + prontas.length +
      '. Acrescente linhas em branco na aba Cadastros e tente de novo.');
  }

  if (modo === 'SUBSTITUIR' && usadas) {
    intervalo.offset(0, 0, usadas, intervalo.getNumColumns()).clearContent();
  }
  if (prontas.length) {
    var destino = intervalo.offset(primeiraLinha - 1, 0, prontas.length, nCols);
    /* O FORMATO DE TEXTO VEM ANTES DE ESCREVER, e não por precaução: sem
       ele, "1.1.1" da coluna Folha vira 01/01/2001 na hora da gravação, e
       depois não adianta — o valor já foi convertido.

       Esta linha faltava, e o estrago dela é indireto, que é o que o torna
       difícil de ver: a importação PARECIA certa (39 linhas, tudo conferido),
       e só na RECRIAÇÃO seguinte o defeito aparecia — as 8 linhas cuja folha
       o Google converte passavam a ter chave diferente da do projeto, não
       casavam, e eram acrescentadas de novo. A lista voltava a 47 sem
       ninguém ter feito nada de errado.

       A importação dependia de a recriação ter formatado a área antes. Uma
       dependência que ninguém declarou e que a bancada não via, porque na
       bancada a recriação sempre vinha antes. */
    destino.setNumberFormat('@');
    destino.setValues(prontas);
  }

  var resumo = 'IMPORTAÇÃO CONCLUÍDA\n\nLista: ' + bloco.titulo + '\n' +
    (modo === 'SUBSTITUIR' ? 'Substituída por ' : 'Acrescentados ') + prontas.length + ' registro(s).';
  if (repetidas.length) {
    resumo += '\n\nIgnorados por já existirem (' + repetidas.length + '):\n- ' +
      repetidas.slice(0, 10).join('\n- ') +
      (repetidas.length > 10 ? '\n- (e mais ' + (repetidas.length - 10) + ')' : '');
  }
  esquecerCadastros_();
  SpreadsheetApp.flush();
  return { status: 'OK', mensagem: resumo };
}

/** Descobre o formato (CSV, colado de planilha ou Markdown) e devolve a tabela. */
function interpretarTabela_(texto) {
  var linhas = String(texto || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  var uteis = linhas.filter(function (l) { return l.trim() !== ''; });
  if (!uteis.length) return [];

  var ehMarkdown = uteis[0].trim().indexOf('|') === 0 || uteis[0].indexOf('|') > 0 &&
                   uteis.length > 1 && /^[\s|:-]+$/.test(uteis[1]);

  if (ehMarkdown) {
    return uteis
      .filter(function (l) { return !/^[\s|:-]+$/.test(l); })
      .map(function (l) {
        return l.replace(/^\s*\|/, '').replace(/\|\s*$/, '')
                .split('|').map(function (c) { return c.trim(); });
      });
  }

  var separador = uteis[0].indexOf('\t') >= 0 ? '\t' : ',';
  return uteis.map(function (l) { return separarLinha_(l, separador); });
}

/** Separa uma linha respeitando aspas: A,"B, com vírgula",C */
function separarLinha_(linha, separador) {
  var campos = [], atual = '', dentroDeAspas = false;
  for (var i = 0; i < linha.length; i++) {
    var c = linha.charAt(i);
    if (c === '"') {
      if (dentroDeAspas && linha.charAt(i + 1) === '"') { atual += '"'; i++; }
      else dentroDeAspas = !dentroDeAspas;
    } else if (c === separador && !dentroDeAspas) {
      campos.push(atual.trim()); atual = '';
    } else {
      atual += c;
    }
  }
  campos.push(atual.trim());
  return campos;
}

/** A primeira linha é o cabeçalho das colunas? */
function pareceCabecalho_(linha, bloco) {
  var simplificar = function (t) {
    return String(t || '').toUpperCase()
      .replace(/[ÁÀÂÃÄ]/g, 'A').replace(/[ÉÈÊË]/g, 'E').replace(/[ÍÌÎÏ]/g, 'I')
      .replace(/[ÓÒÔÕÖ]/g, 'O').replace(/[ÚÙÛÜ]/g, 'U').replace(/[Ç]/g, 'C')
      .replace(/[^A-Z0-9]/g, '');
  };
  var iguais = 0;
  bloco.colunas.forEach(function (c, i) {
    if (i < linha.length && simplificar(linha[i]) === simplificar(c.nome)) iguais++;
  });
  return iguais >= Math.min(2, bloco.colunas.length);
}

/**
 * Acrescenta UMA linha ao fim de um bloco dos Cadastros.
 *
 * Existe para o que a janela de importação não serve: acrescentar um registro
 * só, no meio do preenchimento, sem a pessoa ter de montar um CSV.
 *
 * DUAS COISAS QUE PARECEM DETALHE E NÃO SÃO:
 *
 * 1. O FORMATO DE TEXTO VEM ANTES DE ESCREVER. A coluna `Folha` guarda
 *    "1.1.1", e o Google converte isso em 01/01/2001 se a célula não estiver
 *    formatada como texto ANTES. Depois não adianta: o valor já foi
 *    convertido. Custou uma lista em dobro na planilha dele.
 * 2. A CHAVE NÃO PODE REPETIR. O cadastro deduplica por `bloco.chave`, e uma
 *    chave repetida APAGA linhas em silêncio — já aconteceu duas vezes neste
 *    projeto. Por isso aqui é erro, e não "acrescenta assim mesmo".
 */
function acrescentarLinhaNoBloco_(idBloco, linha) {
  var bloco = blocoPorId_(idBloco);
  if (!bloco) throw new Error('Lista desconhecida: ' + idBloco);

  var nCols = bloco.colunas.length;
  var pronta = [];
  for (var i = 0; i < nCols; i++) pronta.push(linha[i] == null ? '' : String(linha[i]));

  var intervalo = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('CAD_' + idBloco);
  if (!intervalo) {
    throw new Error('A aba Cadastros ainda não foi criada. Rode ' +
                    '"Tesouraria CMI → Criar / recriar a aba Cadastros" primeiro.');
  }

  var existentes = intervalo.getValues();
  var usadas = 0;
  while (usadas < existentes.length && String(existentes[usadas][0]).trim() !== '') usadas++;

  var chaveNova = chaveDaLinha_(bloco, pronta);
  for (var l = 0; l < usadas; l++) {
    if (chaveDaLinha_(bloco, existentes[l]) === chaveNova) {
      throw new Error('Já existe uma linha com essa identificação na lista "' +
                      bloco.titulo + '".');
    }
  }

  if (usadas >= intervalo.getNumRows()) {
    throw new Error('A lista "' + bloco.titulo + '" está cheia. Acrescente ' +
                    'linhas em branco na aba Cadastros e tente de novo.');
  }

  var destino = intervalo.offset(usadas, 0, 1, nCols);
  destino.setNumberFormat('@');
  destino.setValues([pronta]);
  esquecerCadastros_();
  return pronta;
}
