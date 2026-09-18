/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * ETAPA 1: layout visual da aba "Comprovante".
 *
 * O que este arquivo faz:
 *   Desenha, do zero, a aba "Comprovante" com as MESMAS medidas do modelo
 *   oficial em Excel (Comprovante_de_Movimentacao_Interna.xlsx): largura de
 *   cada uma das 46 colunas (A..AT), altura de cada uma das 68 linhas, todas
 *   as células mescladas, fontes, tamanhos, negritos e bordas.
 *
 * O que este arquivo AINDA NÃO faz (vem nas próximas etapas):
 *   - nenhuma fórmula, nenhum valor por extenso automático;
 *   - nenhuma lista suspensa / validação de dados;
 *   - nenhum formulário, nenhuma geração de PDF.
 *
 * Os valores preenchidos são só EXEMPLO (os mesmos do modelo original), para
 * permitir a conferência visual lado a lado. Para gerar a aba em branco,
 * troque PREENCHER_EXEMPLO para false e rode de novo.
 */

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO
// ---------------------------------------------------------------------------

var ABA = 'Comprovante';
var N_COLS = 46;   // A..AT
var N_LINHAS = 68;

// Fonte do modelo original. Se o Google Sheets não renderizar Tahoma na sua
// conta, troque aqui por 'Verdana' ou 'Arial' — é o único ponto a mudar.
var FONTE = 'Tahoma';

var PREENCHER_EXEMPLO = true;

// Cabeçalho institucional. Na Etapa 5 isto passa a vir da aba Cadastros e a
// trocar por etapa (Aprovação/Pagamento = ADM de Origem; Recebimento = ADM de
// Destino). Por ora fica fixo em Coxim, como no modelo.
var CABECALHO = {
  entidade: 'CONGREGAÇÃO CRISTÃ NO BRASIL',
  endereco: 'RUA JOAQUIM CARDEAL DE SOUZA , 311',
  cidade: 'COXIM - MS',
  cnpj: 'CNPJ 03.673.233/0001-43 - IE ISENTO',
  folha: 'Folha 1 / 1',
  titulo: 'COMPROVANTE DE MOVIMENTAÇÃO INTERNA',
  rodape: ' formulário interno da tesouraria da piedade da ADM local de Coxim, MS',
  notaSiga: 'Necessário no mínimo 3 assinaturas (nome completo, cargo e assinatura) para anexação no SIGA.'
};

// Larguras de coluna em pixels, convertidas das larguras do .xlsx original.
// [primeira coluna, quantidade de colunas, largura em pixels]
// Somadas, dão 790px — a mesma largura do modelo, que cabe em uma folha A4
// em pé (retrato), como no PDF de referência da tesouraria.
var LARGURAS = [
  [1, 1, 10],   // A
  [2, 1, 17],   // B
  [3, 2, 10],   // C..D
  [5, 1, 17],   // E
  [6, 5, 30],   // F..J
  [11, 1, 38],  // K
  [12, 1, 21],  // L
  [13, 1, 6],   // M
  [14, 1, 14],  // N
  [15, 6, 10],  // O..T
  [21, 3, 30],  // U..W
  [24, 3, 10],  // X..Z
  [27, 1, 29],  // AA
  [28, 1, 6],   // AB
  [29, 1, 21],  // AC
  [30, 1, 13],  // AD
  [31, 6, 10],  // AE..AJ
  [37, 1, 13],  // AK
  [38, 5, 10],  // AL..AP
  [43, 2, 30],  // AQ..AR
  [45, 1, 38],  // AS
  [46, 1, 27]   // AT
];

// Alturas de linha em pixels (as demais ficam com a altura padrão de 19px).
// [primeira linha, quantidade de linhas, altura em pixels]
var ALTURAS = [
  [1, 1, 16], [2, 1, 15], [3, 1, 5], [4, 1, 32], [5, 1, 11],
  [6, 4, 20],            // 6..9  — bloco de identificação
  [10, 2, 11],           // 10..11
  [12, 2, 20],           // 12..13 — origem/destino
  [14, 1, 11],
  [15, 1, 20],           // cabeçalho da tabela de detalhamento
  [49, 1, 20],           // linha TOTAL
  [55, 3, 20],           // 55..57 — 1ª fileira de assinaturas
  [63, 3, 20],           // 63..65 — 2ª fileira de assinaturas
  [68, 1, 16]
];

// Tabela de detalhamento (comprovante agrupado) — linhas 15 a 48.
var TAB_LINHA_CABECALHO = 15;
var TAB_PRIMEIRA_LINHA = 16;
var TAB_ULTIMA_LINHA = 48;
var TAB_LINHA_TOTAL = 49;
var TAB_COLUNAS = [
  { rotulo: 'DATA',                      inicio: 'A',  fim: 'F',  alinhamento: 'center' },
  { rotulo: 'DOCUMENTO / CARTÃO',        inicio: 'G',  fim: 'N',  alinhamento: 'left' },
  { rotulo: 'BENEFICIÁRIO / FINALIDADE', inicio: 'O',  fim: 'AH', alinhamento: 'left' },
  { rotulo: 'VALOR',                     inicio: 'AI', fim: 'AT', alinhamento: 'right' }
];

// Posições das assinaturas (conforme docs/02_especificacao_campos.md).
var ASSINATURAS = [
  { linhaRisco: 55, nome: 'C56:K56',   cargo: 'C57:K57' },
  { linhaRisco: 55, nome: 'N56:AA56',  cargo: 'N57:AA57' },
  { linhaRisco: 55, nome: 'AD56:AS56', cargo: 'AD57:AS57' },
  { linhaRisco: 63, nome: 'C64:K64',   cargo: 'C65:K65' },
  { linhaRisco: 63, nome: 'N64:AA64',  cargo: 'N65:AA65' }
  // A 6ª posição (AD64/AD65) é sempre manual — "Nome:" / "Cargo/Ministério:"
  // com uma linha em branco ao lado, para preencher à caneta.
];

var RISCOS_ASSINATURA = ['C55:K55', 'N55:AA55', 'AD55:AS55',
                         'C63:K63', 'N63:AA63', 'AD63:AS63'];

var EXEMPLO = {
  numero: '83101',
  status: 'EFETIVADA',
  data: new Date(2026, 7, 29),                 // 29/08/2026
  valor: 300,
  extenso: '(TREZENTOS REAIS)',
  tipo: 'Transferencia entre bancos CONTA MOVIMENTO',
  observacao: 'Crédito no cartão 127698876 - Gerson colab. piedade (SECRETARIA 88.76)',
  origem: 'PIA-COXIM: 101.10 - Conta movimento PIEDADE',
  cnpjOrigem: '03.673.233/0001-43',
  destino: 'PIA-COXIM: 101.20 - ACG AG: 01 CC: 127865707 - VIAGEM',
  cnpjDestino: '03.673.233/0001-43',
  assinantes: [
    ['Adalto Azevedo Pereira', 'Diácono'],
    ['Taynã Araujo Naves', 'Diácono'],
    ["Nilson Sant'Anna", 'Diácono'],
    ['João Torquato de Souza', 'Diácono'],
    ['Eliseu Simão Rezende da Silva', 'Diácono']
  ]
};

// ---------------------------------------------------------------------------
// MENU
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tesouraria CMI')
    .addItem('Recriar layout do Comprovante', 'criarLayoutComprovante')
    .addToUi();
}

// ---------------------------------------------------------------------------
// FUNÇÃO PRINCIPAL
// ---------------------------------------------------------------------------

/**
 * Apaga e redesenha a aba "Comprovante". Pode ser rodada quantas vezes quiser:
 * ela sempre recria a aba do zero, então nada "acumula" nem sai do lugar.
 */
function criarLayoutComprovante() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Renomeia a aba antiga antes de criar a nova: assim funciona mesmo quando
  // "Comprovante" é a única aba da planilha (o Sheets não deixa ficar sem aba).
  var antiga = ss.getSheetByName(ABA);
  if (antiga) antiga.setName(ABA + '_ANTIGA_' + new Date().getTime());

  var sh = ss.insertSheet(ABA, 0);
  if (antiga) ss.deleteSheet(antiga);

  dimensionarGrade_(sh);
  aplicarBaseVisual_(sh);
  desenharCabecalho_(sh);
  desenharIdentificacao_(sh);
  desenharOrigemDestino_(sh);
  desenharTabelaDetalhamento_(sh);
  desenharAssinaturas_(sh);
  desenharRodape_(sh);

  sh.setActiveSelection('A1');
  SpreadsheetApp.flush();
  return sh;
}

// ---------------------------------------------------------------------------
// BLOCOS DO LAYOUT
// ---------------------------------------------------------------------------

/** Deixa a aba com exatamente 46 colunas x 68 linhas e as medidas do modelo. */
function dimensionarGrade_(sh) {
  if (sh.getMaxColumns() > N_COLS) {
    sh.deleteColumns(N_COLS + 1, sh.getMaxColumns() - N_COLS);
  } else if (sh.getMaxColumns() < N_COLS) {
    sh.insertColumnsAfter(sh.getMaxColumns(), N_COLS - sh.getMaxColumns());
  }
  if (sh.getMaxRows() > N_LINHAS) {
    sh.deleteRows(N_LINHAS + 1, sh.getMaxRows() - N_LINHAS);
  } else if (sh.getMaxRows() < N_LINHAS) {
    sh.insertRowsAfter(sh.getMaxRows(), N_LINHAS - sh.getMaxRows());
  }

  LARGURAS.forEach(function (g) { sh.setColumnWidths(g[0], g[1], g[2]); });
  sh.setRowHeights(1, N_LINHAS, 19);
  ALTURAS.forEach(function (g) { sh.setRowHeights(g[0], g[1], g[2]); });
}

/** Fonte padrão, alinhamento vertical e sem linhas de grade (vira "papel"). */
function aplicarBaseVisual_(sh) {
  sh.getRange(1, 1, N_LINHAS, N_COLS)
    .setFontFamily(FONTE)
    .setFontSize(8)
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sh.setHiddenGridlines(true);
}

/** Linhas 1, 2 e 4: identificação institucional e título. */
function desenharCabecalho_(sh) {
  campo_(sh, 'M1:AB1', CABECALHO.entidade, { tam: 9, negrito: true, h: 'center' });
  campo_(sh, 'AK1:AT1', CABECALHO.folha, { h: 'right' });
  campo_(sh, 'A2:J2', CABECALHO.endereco, { h: 'left' });
  campo_(sh, 'M2:AB2', CABECALHO.cidade, { h: 'center' });
  campo_(sh, 'AI2:AT2', CABECALHO.cnpj, { h: 'right' });

  campo_(sh, 'A4:AT4', CABECALHO.titulo, { tam: 15, negrito: true, h: 'center' });
  borda_(sh, 'A4:AT4', { topo: true, baixo: true, estilo: 'MEDIA' });
}

/** Linhas 6 a 9: número, status, data, valor, extenso, tipo e observação. */
function desenharIdentificacao_(sh) {
  rotulo_(sh, 'A6:F6', 'Número:');
  campo_(sh, 'G6:M6', val_(EXEMPLO.numero), { negrito: true, h: 'left' });

  rotulo_(sh, 'Q6:W6', 'Status:');
  campo_(sh, 'X6:AD6', val_(EXEMPLO.status), { negrito: true, h: 'right' });

  rotulo_(sh, 'A7:F7', 'Data Emissão:');
  campo_(sh, 'G7:M7', val_(EXEMPLO.data), { negrito: true, h: 'left', formato: 'dd/MM/yyyy' });

  rotulo_(sh, 'Q7:W7', 'Valor:');
  campo_(sh, 'X7:AD7', val_(EXEMPLO.valor), {
    negrito: true, h: 'right', formato: 'R$ #,##0.00'
  });
  // Extenso — preenchido automaticamente a partir da Etapa 3.
  campo_(sh, 'AE7:AT7', val_(EXEMPLO.extenso), { negrito: true, h: 'left' });

  rotulo_(sh, 'A8:F8', 'Tipo:');
  campo_(sh, 'G8:AT8', val_(EXEMPLO.tipo), { tam: 10, negrito: true, h: 'left' });

  rotulo_(sh, 'A9:F9', 'Observação');
  campo_(sh, 'G9:AT9', val_(EXEMPLO.observacao), { negrito: true, h: 'left' });

  borda_(sh, 'A10:AT10', { baixo: true, estilo: 'FINA' });
}

/** Linhas 12 e 13: contas de origem e destino, com os respectivos CNPJs. */
function desenharOrigemDestino_(sh) {
  rotulo_(sh, 'A12:F12', 'Origem:');
  campo_(sh, 'G12:V12', val_(EXEMPLO.origem), { negrito: true, h: 'left' });
  rotulo_(sh, 'W12:X12', 'Destino:', 'center');
  campo_(sh, 'Y12:AT12', val_(EXEMPLO.destino), { negrito: true, h: 'left' });

  rotulo_(sh, 'A13:F13', 'CNPJ:');
  campo_(sh, 'G13:V13', val_(EXEMPLO.cnpjOrigem), { negrito: true, h: 'left' });
  rotulo_(sh, 'W13:X13', 'CNPJ:', 'center');
  campo_(sh, 'Y13:AT13', val_(EXEMPLO.cnpjDestino), { negrito: true, h: 'left' });

  borda_(sh, 'A14:AT14', { baixo: true, estilo: 'MEDIA' });
}

/**
 * Linhas 15 a 49: a tabela do comprovante agrupado (uma linha por lançamento),
 * mais a linha de TOTAL. É a única parte que não existe no modelo em Excel —
 * lá essas linhas ficam em branco.
 */
function desenharTabelaDetalhamento_(sh) {
  TAB_COLUNAS.forEach(function (col) {
    var cab = col.inicio + TAB_LINHA_CABECALHO + ':' + col.fim + TAB_LINHA_CABECALHO;
    campo_(sh, cab, col.rotulo, { tam: 7, negrito: true, h: 'center' });
    sh.getRange(cab).setBackground('#f0f0f0');

    for (var l = TAB_PRIMEIRA_LINHA; l <= TAB_ULTIMA_LINHA; l++) {
      var celula = col.inicio + l + ':' + col.fim + l;
      sh.getRange(celula).merge().setHorizontalAlignment(col.alinhamento);
      if (col.rotulo === 'VALOR') sh.getRange(celula).setNumberFormat('R$ #,##0.00');
      if (col.rotulo === 'DATA') sh.getRange(celula).setNumberFormat('dd/MM/yyyy');
    }
  });

  // Grade interna discreta da tabela.
  // Topo fica como null para não apagar a linha média da linha 14, que já é
  // a borda superior da tabela no modelo original.
  var area = 'A' + TAB_LINHA_CABECALHO + ':AT' + TAB_ULTIMA_LINHA;
  sh.getRange(area).setBorder(null, true, true, true, true, true,
    '#b7b7b7', SpreadsheetApp.BorderStyle.SOLID);

  // Linha de TOTAL (a soma automática entra na Etapa 3).
  campo_(sh, 'A' + TAB_LINHA_TOTAL + ':AH' + TAB_LINHA_TOTAL, 'TOTAL', {
    negrito: true, h: 'right'
  });
  campo_(sh, 'AI' + TAB_LINHA_TOTAL + ':AT' + TAB_LINHA_TOTAL, '', {
    negrito: true, h: 'right', formato: 'R$ #,##0.00'
  });
  borda_(sh, 'AI' + TAB_LINHA_TOTAL + ':AT' + TAB_LINHA_TOTAL,
    { topo: true, baixo: true, estilo: 'FINA' });
}

/** Linhas 55 a 65: os seis espaços de assinatura. */
function desenharAssinaturas_(sh) {
  RISCOS_ASSINATURA.forEach(function (risco) {
    borda_(sh, risco, { baixo: true, estilo: 'GROSSA' });
  });

  ASSINATURAS.forEach(function (pos, i) {
    var dados = PREENCHER_EXEMPLO ? EXEMPLO.assinantes[i] : ['', ''];
    campo_(sh, pos.nome, dados[0], { tam: 10, h: 'center' });
    campo_(sh, pos.cargo, dados[1], { tam: 10, h: 'center' });
  });

  // 6ª posição: sempre manual, para signatário fora do cadastro.
  campo_(sh, 'AD64:AG64', 'Nome:', { h: 'center' });
  campo_(sh, 'AH64:AS64', '', { h: 'left' });
  borda_(sh, 'AH64:AS64', { baixo: true, estilo: 'FINA' });

  campo_(sh, 'AD65:AM65', 'Cargo/Ministério:', { h: 'left' });
  campo_(sh, 'AN65:AS65', '', { h: 'left' });
  borda_(sh, 'AN65:AS65', { baixo: true, estilo: 'FINA' });
}

/** Linhas 67 e 68: aviso das 3 assinaturas e rodapé do formulário. */
function desenharRodape_(sh) {
  campo_(sh, 'A67:AT67', CABECALHO.notaSiga, { tam: 7, h: 'center' })
    .setFontStyle('italic');
  campo_(sh, 'A68:AT68', CABECALHO.rodape, { h: 'left' });
  borda_(sh, 'A68:AT68', { topo: true, estilo: 'FINA' });
}

// ---------------------------------------------------------------------------
// AUXILIARES
// ---------------------------------------------------------------------------

/** Devolve o valor de exemplo, ou vazio quando PREENCHER_EXEMPLO = false. */
function val_(valor) {
  return PREENCHER_EXEMPLO ? valor : '';
}

/** Rótulo fixo do formulário (texto cinza-escuro, alinhado à direita). */
function rotulo_(sh, intervalo, texto, alinhamento) {
  return campo_(sh, intervalo, texto, { h: alinhamento || 'right' });
}

/** Mescla o intervalo, escreve o conteúdo e aplica fonte/alinhamento/formato. */
function campo_(sh, intervalo, valor, op) {
  op = op || {};
  var r = sh.getRange(intervalo);
  if (r.getNumColumns() > 1 || r.getNumRows() > 1) r.merge();
  if (op.formato) r.setNumberFormat(op.formato);
  r.setFontSize(op.tam || 8)
   .setFontWeight(op.negrito ? 'bold' : 'normal')
   .setHorizontalAlignment(op.h || 'left')
   .setVerticalAlignment('middle');
  if (valor !== undefined && valor !== null && valor !== '') r.setValue(valor);
  return r;
}

/** Aplica só as bordas pedidas, no estilo pedido (FINA / MEDIA / GROSSA). */
function borda_(sh, intervalo, op) {
  var estilos = {
    FINA: SpreadsheetApp.BorderStyle.SOLID,
    MEDIA: SpreadsheetApp.BorderStyle.SOLID_MEDIUM,
    GROSSA: SpreadsheetApp.BorderStyle.SOLID_THICK
  };
  sh.getRange(intervalo).setBorder(
    op.topo || null, op.esquerda || null, op.baixo || null, op.direita || null,
    null, null, '#000000', estilos[op.estilo || 'FINA']);
}
