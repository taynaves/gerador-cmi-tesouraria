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
 * CAD_DIACONOS, CAD_TIPOS, CAD_STATUS, CAD_ADMS, CAD_BANCOS, CAD_CONTROLE),
 * com folga de linhas em branco. É assim que as próximas etapas leem os dados
 * sem depender de "coluna C, linha 5".
 *
 * ATENÇÃO: rodar `criarAbaCadastros` APAGA e recria a aba com os dados
 * originais do projeto. Depois de começar a editar de verdade, só rode de
 * novo se quiser voltar tudo ao ponto de partida.
 */

var ABA_CADASTROS = 'Cadastros';

/** Espaço em branco reservado abaixo de cada lista, para crescer. */
var LINHAS_DE_FOLGA = 200;

/** Limite de letras de uma abreviatura de banco. */
var MAX_LETRAS_ABREVIATURA = 6;

/** Cada bloco é uma lista. A ordem aqui é a ordem das colunas na aba. */
var BLOCOS_CADASTRO = [
  {
    id: "CONTAS",
    titulo: "CONTAS POR PIA",
    cor: "#1c4587",
    colunas: [
      { nome: "PIA", px: 95 },
      { nome: "ADM", px: 110 },
      { nome: "Grupo cont\u00e1bil", px: 150 },
      { nome: "C\u00f3d. SIGA", px: 65 },
      { nome: "Conta PagCorp", px: 85 },
      { nome: "Texto que aparece na lista", px: 280 },
      { nome: "Status", px: 95 },
      { nome: "Observa\u00e7\u00e3o", px: 300 },
    ],
    dados: [
      ["PIA-COXIM", "ADM Coxim-MS", "100 - CAIXA", "100.10", "-", "PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE", "Ativa", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "100 - CAIXA", "100.20", "-", "PIA-COXIM: 100.20 - CAIXA VIAGENS MISSION\u00c1RIAS", "Ativa", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "100 - CAIXA", "100.30", "-", "PIA-COXIM: 100.30 - CAIXA ASSEMBL\u00c9IAS E REUNI\u00d5ES", "Ativa", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.10", "-", "PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE", "Ativa", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.12", "-", "PIA-COXIM: 101.12 - SANT - AG:3109 CC:130027576 - PIEDADE", "Ativa", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.13", "-", "PIA-COXIM: 101.13 - SANT - AG:3109 CC:130027569 - VIAGEM", "Ativa", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.14", "-", "PIA-COXIM: 101.14 - SANT - AG:3109 CC:130027583 - M\u00daSICA", "Ativa", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.15", "127866218", "PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE", "Ativa", "Conta \u00fanica no SIGA; no PagCorp se subdivide em duas sub-tesourarias de cart\u00e3o (Atendimento=127866192 e Secretaria=128175981) - n\u00e3o s\u00e3o contas de Origem/Destino separadas, s\u00f3 categorias de cart\u00e3o"],
      ["PIA-COXIM", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.20", "127865707", "PIA-COXIM: 101.20 - ACG - AG:01 CC:127865707 - VIAGEM", "Ativa", ""],
      ["PIA-COXIM", "ADM Coxim-MS", "204 - OUTRAS OBRIGA\u00c7\u00d5ES", "204.9", "-", "PIA-COXIM: 204.9 - CART\u00c3O DE D\u00c9BITO", "Ativa", ""],
      ["PIA-SONORA", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.16", "127884146", "PIA-SONORA: 101.16 - ACG - AG:01 CC:127884146 - PIEDADE", "Ativa", ""],
      ["PIA-S\u00c3O GABRIEL", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "101.17", "127884427", "PIA-S\u00c3O GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE", "Ativa", ""],
      ["PIA-ALCIN\u00d3POLIS", "ADM Coxim-MS", "101 - BANCOS CONTA MOVIMENTO", "A definir", "128091675", "PIA-ALCIN\u00d3POLIS: ACG - AG:01 CC:128091675 - PIEDADE", "Inativa (futura)", "Aguardando SIGA atribuir c\u00f3digo reduzido"],
      ["PIA-COSTA", "ADM Costa Rica-MS", "101 - BANCOS CONTA MOVIMENTO", "A definir", "128175700", "PIA-COSTA: ACG - AG:01 CC:128175700 - PIEDADE", "Ativa", "Conta \u00fanica de Origem/Destino da PIA-COSTA. No PagCorp se subdivide em duas sub-tesourarias de cart\u00e3o (Atendimento=127884955 e Secretaria=127884922) - n\u00e3o s\u00e3o contas de Origem/Destino separadas, s\u00f3 categorias de cart\u00e3o. Aguardando o c\u00f3digo reduzido do SIGA"],
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
  {
    id: "TIPOS",
    titulo: "TIPOS DE MOVIMENTA\u00c7\u00c3O",
    cor: "#a64d79",
    colunas: [
      { nome: "Tipo de movimenta\u00e7\u00e3o", px: 300 },
      { nome: "Sentido cr\u00e9dito/d\u00e9bito", px: 260 },
      // "Sim" = s\u00f3 entre PIAs diferentes · "N\u00e3o" = s\u00f3 dentro da mesma PIA ·
      // "Indiferente" = serve nos dois casos. \u00c9 por esta coluna que o formul\u00e1rio
      // da Etapa 4 vai filtrar a lista de tipos depois da PIA escolhida.
      { nome: "Entre PIAs diferentes", px: 140 },
      { nome: "Observa\u00e7\u00e3o", px: 300 },
    ],
    dados: [
      ["Transferencia entre departamentos - entre bancos", "Normal (Origem debitada / Destino creditada)", "Sim", "PIAs diferentes, conta banc\u00e1ria de um departamento para a de outro"],
      ["Transferencia entre departamentos - entre caixas", "Normal", "Sim", "PIAs diferentes, caixa de um departamento para o caixa de outro"],
      ["Transferencia entre departamentos - entre caixa e banco", "Normal", "Sim", "PIAs diferentes, caixa de um departamento para o banco de outro (ou o contr\u00e1rio)"],
      ["Transferencia entre bancos CONTA MOVIMENTO", "Normal (Origem debitada / Destino creditada)", "N\u00e3o", "Uso mais comum dentro da mesma PIA - conta banc\u00e1ria para conta banc\u00e1ria"],
      ["Transferencia interna entre Caixa e Banco", "Normal", "N\u00e3o", "Suprimento de caixa (banco->caixa) ou sangria (caixa->banco)"],
      ["Carregamento de cartao pre-pago (avulso)", "Normal", "Indiferente", "Um \u00fanico cart\u00e3o/colaborador"],
      ["Carregamento de cartao pre-pago (em lote)", "Normal", "Indiferente", "V\u00e1rios cart\u00f5es na mesma conta ACG - ver regra de agrupamento"],
      ["Transferencia Debito (cartao-cartao ou cartao-conta ACG)", "INVERTIDO - Origem recebe credito / Destino e debitado", "Indiferente", "Exibir aviso obrigatorio ao selecionar este tipo"],
      ["Zerar Conta", "INVERTIDO - Origem recebe credito / Destino e debitado", "Indiferente", "Exibir aviso obrigatorio ao selecionar este tipo"],
      ["Remessa para outra ADM/localidade", "Normal", "Sim", "Transferencias remetidas/recebidas entre administracoes (grupo contabil 3.1.5 / 4.1.3 do plano de contas)"],
      ["Suprimento de caixa para viagens/reunioes/assembleias", "Normal", "N\u00e3o", "Movimentacao entre caixas especificos (Obra da Piedade / Viagens Missionarias / Assembleias e Reunioes)"],
      ["Aplicacao financeira", "Normal", "N\u00e3o", "Aguardando inclusao das contas de aplicacao no cadastro de Origem/Destino (nao incluidas nesta primeira versao)"],
      ["Resgate de aplicacao financeira", "Normal", "N\u00e3o", "Aguardando inclusao das contas de aplicacao no cadastro de Origem/Destino (nao incluidas nesta primeira versao)"],
      ["Outro (especificar na Observacao)", "Normal", "Indiferente", "Campo livre - usar quando nenhum tipo acima se aplicar"],
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
    ]
  },
];

// ===========================================================================
// CRIAÇÃO DA ABA
// ===========================================================================

/** Apaga e recria a aba "Cadastros" com os dados originais do projeto. */
function criarAbaCadastros() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var antiga = ss.getSheetByName(ABA_CADASTROS);
  if (antiga) antiga.setName(ABA_CADASTROS + '_ANTIGA_' + new Date().getTime());
  var sh = ss.insertSheet(ABA_CADASTROS);
  if (antiga) ss.deleteSheet(antiga);

  var totalColunas = 0;
  BLOCOS_CADASTRO.forEach(function (b) { totalColunas += b.colunas.length + 1; });
  var totalLinhas = 2 + maiorBloco_() + LINHAS_DE_FOLGA;

  ajustarGrade_(sh, totalColunas, totalLinhas);

  var coluna = 1;
  BLOCOS_CADASTRO.forEach(function (bloco) {
    desenharBloco_(ss, sh, bloco, coluna, totalLinhas);
    sh.setColumnWidth(coluna + bloco.colunas.length, 16);   // separador
    coluna += bloco.colunas.length + 1;
  });

  sh.setFrozenRows(2);
  sh.setActiveSelection('A1');
  SpreadsheetApp.flush();
  return sh;
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
function desenharBloco_(ss, sh, bloco, coluna, totalLinhas) {
  var nCols = bloco.colunas.length;

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

  if (bloco.dados.length) {
    sh.getRange(3, coluna, bloco.dados.length, nCols)
      .setValues(bloco.dados)
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
function lerCadastro_(id) {
  var bloco = blocoPorId_(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var intervalo = ss.getRangeByName('CAD_' + id);
  if (!intervalo) throw new Error('A aba Cadastros ainda não foi criada (falta CAD_' + id + ').');

  var chaves = bloco.colunas.map(function (c) { return c.nome; });
  return intervalo.getValues()
    .filter(function (linha) { return String(linha[0]).trim() !== ''; })
    .map(function (linha) {
      var item = {};
      chaves.forEach(function (chave, i) { item[chave] = linha[i]; });
      return item;
    });
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
  linhas.push('');
  linhas.push('Próxima referência: ' + proximaReferencia_());
  SpreadsheetApp.getUi().alert('Cadastros', linhas.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
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
  TIPOS: [
    { coluna: 0, teste: /\S\s+\S/, descricao: 'o tipo de movimentação deve ser uma descrição, não uma palavra só' }
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
    var jaTem = {};
    existentes.forEach(function (l) {
      var chave = String(l[0]).trim().toUpperCase();
      if (chave) jaTem[chave] = true;
    });
    prontas = prontas.filter(function (l) {
      var chave = String(l[0]).trim().toUpperCase();
      if (jaTem[chave]) { repetidas.push(l[0]); return false; }
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
    intervalo.offset(primeiraLinha - 1, 0, prontas.length, nCols).setValues(prontas);
  }

  var resumo = 'IMPORTAÇÃO CONCLUÍDA\n\nLista: ' + bloco.titulo + '\n' +
    (modo === 'SUBSTITUIR' ? 'Substituída por ' : 'Acrescentados ') + prontas.length + ' registro(s).';
  if (repetidas.length) {
    resumo += '\n\nIgnorados por já existirem (' + repetidas.length + '):\n- ' +
      repetidas.slice(0, 10).join('\n- ') +
      (repetidas.length > 10 ? '\n- (e mais ' + (repetidas.length - 10) + ')' : '');
  }
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
