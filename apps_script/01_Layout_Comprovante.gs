/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * ETAPA 1: layout visual da aba "Comprovante".
 *
 * IDENTIDADE VISUAL: este layout NÃO é mais uma cópia do modelo em Excel.
 * Ele foi remedido a partir do comprovante que o próprio SIGA emite
 * (docs/referencia_siga_comprovante.pdf), para que os dois documentos tenham
 * a mesma cara: mesma fonte, mesmos tamanhos, mesmas margens, mesma espessura
 * de linha e os campos comuns na MESMA posição da folha (sobreposição).
 *
 * Medidas extraídas do PDF do SIGA (folha A4 em pé, 595,28 x 841,89 pt):
 *   - fonte Tahoma em tudo: 7 pt no corpo, 8 pt em "CONGREGAÇÃO CRISTÃ NO
 *     BRASIL", 14 pt no título;
 *   - rótulos em fonte normal, valores em negrito;
 *   - régua fina de 0,75 pt nos separadores e nas linhas de assinatura;
 *   - régua média de 1,5 pt embaixo do título;
 *   - margem de ~1 cm em volta da folha.
 *
 * Como o Google Sheets exporta (medido em exportação real, escala Normal):
 *   - 1 pixel de linha/coluna = 0,75 ponto no PDF;
 *   - borda FINA = 0,75 pt | borda MÉDIA = 1,5 pt;
 *   - o texto centralizado na vertical cai em:
 *     topo_da_linha + (altura - 0,975 x tamanho_da_fonte) / 2 + 1,25 pt.
 * É essa conta que faz cada campo cair na mesma altura do comprovante do SIGA.
 *
 * O que este arquivo AINDA NÃO faz (vem nas próximas etapas):
 *   - nenhuma fórmula, nenhum valor por extenso automático;
 *   - nenhuma lista suspensa / validação de dados;
 *   - nenhum formulário, nenhuma geração de PDF, nenhum arquivo .md de
 *     recuperação.
 *
 * ATENÇÃO: rodar `criarLayoutComprovante` APAGA e redesenha a aba inteira.
 * Qualquer ajuste feito à mão na aba "Comprovante" se perde. Ajustes devem
 * ser pedidos aqui no código, nunca feitos direto na aba.
 */

// ===========================================================================
// 1. CONFIGURAÇÃO
// ===========================================================================

var ABA = 'Comprovante';

/** Fonte do SIGA. Se o Sheets não renderizar Tahoma, troque por 'Verdana'. */
var FONTE = 'Tahoma';

/**
 * Tamanhos de fonte, em pontos, iguais aos do comprovante do SIGA.
 * O Sheets desenha a fonte 2,5% menor do que o número pedido; por isso os
 * tamanhos passam por `pt_()`, que compensa a diferença.
 */
var TAM = { corpo: 7, entidade: 8, titulo: 14, nota: 7 };
var COMPENSACAO_FONTE = 0.975;

/**
 * true  = preenche com os dados do comprovante real do SIGA, para o teste de
 *         sobreposição (inclusive o título do SIGA).
 * false = preenche com os dados próprios do CMI (ou em branco, ver EXEMPLO).
 */
var MODO_SOBREPOSICAO_SIGA = true;

/** false gera a aba sem nenhum dado de exemplo, só o layout. */
var PREENCHER_EXEMPLO = true;

/** Margens de impressão, em polegadas (usadas na Etapa 5 ao gerar o PDF). */
var MARGENS = { topo: 0.38, base: 0.38, esquerda: 0.40, direita: 0.35 };

/** Altura útil da folha, em pixels de planilha (A4 em pé com essas margens). */
var ALTURA_UTIL_PX = 1038;

// Cabeçalho institucional. Na Etapa 5 passa a vir da aba Cadastros e a trocar
// por etapa (Aprovação/Pagamento = ADM de Origem; Recebimento = ADM de Destino).
var CABECALHO = {
  entidade: 'CONGREGAÇÃO CRISTÃ NO BRASIL',
  endereco: 'RUA JOAQUIM CARDEAL DE SOUZA , 311',
  cidade: 'COXIM - MS',
  cnpj: 'CNPJ 03.673.233/0001-43 - IE ISENTO',
  folha: 'Folha 1 / 1',
  tituloCmi: 'COMPROVANTE DE MOVIMENTAÇÃO INTERNA',
  tituloSiga: 'Comprovante de Transferência de Numerários',
  nota: 'Necessário no mínimo 3 assinaturas (nome completo, cargo ou ministério, e assinatura) para anexação no SIGA.',
  rodape: 'formulário interno da tesouraria da piedade da ADM local de Coxim, MS. V. 1.26'
};

// ---------------------------------------------------------------------------
// GRADE DE COLUNAS — 14 colunas (A..N), 717 px = 537,75 pt de largura total.
// Cada limite abaixo existe por um motivo, anotado ao lado.
// ---------------------------------------------------------------------------
var COLUNAS = [
  { col: 'A', px: 88 },   //  88 - recuo do texto das contas
  { col: 'B', px: 9 },    //  97 - FIM DOS RÓTULOS da coluna 1 / início dos valores
  { col: 'C', px: 98 },   // 195 - fim do valor da Referência
  { col: 'D', px: 47 },   // 242 - fim do 1º bloco de assinatura
  { col: 'E', px: 13 },   // 255 - início do 2º bloco de assinatura
  { col: 'F', px: 35 },   // 290 - fim do rótulo "numeração SIGA"
  { col: 'G', px: 100 },  // 390 - fim do valor da numeração SIGA
  { col: 'H', px: 44 },   // 434 - FIM DOS RÓTULOS da coluna 2 / início dos valores
  { col: 'I', px: 52 },   // 486 - fim do 2º bloco de assinatura
  { col: 'J', px: 8 },    // 494 - início do 3º bloco de assinatura
  { col: 'K', px: 26 },   // 520 - fim do rótulo "Nome:" / fim da coluna Beneficiário
  { col: 'L', px: 9 },    // 529 - início da linha do "Nome:"
  { col: 'M', px: 49 },   // 578 - fim do rótulo "Cargo/Ministério:"
  { col: 'N', px: 139 }   // 717 - fim da folha
];

// ---------------------------------------------------------------------------
// GRADE DE LINHAS — cada linha tem nome, para o código nunca depender de
// "linha 7", "linha 12" etc. A ordem desta lista É a ordem da planilha.
// ---------------------------------------------------------------------------
var LINHAS = [
  { id: 'CAB_1', px: 13 },            // CONGREGAÇÃO CRISTÃ NO BRASIL / Folha 1 / 1
  { id: 'CAB_2', px: 12 },            // endereço / cidade / CNPJ
  { id: 'ESP_1', px: 8 },             // régua fina em cima do título
  { id: 'TITULO', px: 28 },           // título, com régua média embaixo
  { id: 'ESP_2', px: 6 },
  { id: 'IDENT_1', px: 18 },          // Referência | numeração SIGA | Status
  { id: 'IDENT_2', px: 18 },          // Data Emissão | Valor (Total) | extenso
  { id: 'TIPO', px: 18 },
  { id: 'OBS', px: 18 },
  { id: 'SEP_1', px: 9 },             // régua fina
  { id: 'ESP_3', px: 5 },
  { id: 'ORIGEM_DESTINO', px: 18 },
  { id: 'CONTAS', px: 18, opcional: true },   // contas de origem/destino
  { id: 'CNPJ', px: 18 },
  { id: 'SEP_2', px: 8 },             // régua fina
  { id: 'TAB_CAB', px: 16, opcional: true },  // tabela do lote: cabeçalho
  // as linhas de lançamento do lote são inseridas aqui por montarLinhas_()
  { id: 'TAB_TOTAL', px: 18, opcional: true },
  { id: 'ESP_ASSIN_1', px: 62 },      // espaço da 1ª fileira de assinaturas
  { id: 'NOME_1', px: 22 },
  { id: 'CARGO_1', px: 19 },
  { id: 'ESP_ASSIN_2', px: 57 },      // espaço da 2ª fileira de assinaturas
  { id: 'NOME_2', px: 22 },
  { id: 'CARGO_2', px: 19 },
  { id: 'PREENCHIMENTO', px: 616 },   // sobra da folha — altura recalculada
  { id: 'NOTA', px: 13 },             // nota das 3 assinaturas + régua do rodapé
  { id: 'RODAPE', px: 12 }
];

/** Quantidade máxima de lançamentos que cabem na tabela do lote em 1 folha. */
var MAX_LINHAS_LOTE = 35;
var ALTURA_LINHA_LOTE = 16;

/** Colunas da tabela de detalhamento do comprovante em lote. */
var COLUNAS_LOTE = [
  { rotulo: 'DATA', ini: 'A', fim: 'B', alinhamento: 'center', formato: 'dd/MM/yyyy' },
  { rotulo: 'DOCUMENTO / CARTÃO', ini: 'C', fim: 'F', alinhamento: 'left' },
  { rotulo: 'BENEFICIÁRIO / FINALIDADE', ini: 'G', fim: 'K', alinhamento: 'left' },
  { rotulo: 'VALOR', ini: 'L', fim: 'N', alinhamento: 'right', formato: 'R$ #,##0.00' }
];

/** Os três blocos de assinatura, em colunas. */
var BLOCOS_ASSINATURA = ['A:D', 'F:I', 'K:N'];

/** Dados de exemplo — os mesmos do comprovante do SIGA, para a sobreposição. */
var EXEMPLO = {
  referencia: 'INT-26/001',
  numeracaoSiga: '656',
  status: 'PAGO',
  data: new Date(2026, 8, 6),                  // 06/09/2026
  valor: 1800,
  extenso: '(UM MIL E OITOCENTOS REAIS)',
  tipo: 'OUTRAS REMESSAS',
  observacao: 'SUPRI CONTA BANCO SÃO GARIBEL PAGCORP',
  origem: 'PIA - COXIM',
  contaOrigem: 'Conta: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE',
  cnpjOrigem: '03.673.233/0001-43',
  destino: 'PIA - SÃO GABRIEL DO OESTE',
  contaDestino: 'Conta: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE',
  cnpjDestino: '03.673.233/0001-43',
  assinantes: [
    ['Adalto Azevedo Pereira', 'Diácono'],
    ['Taynã Araujo Naves', 'Diácono'],
    ["Nilson Sant'Anna", 'Diácono'],
    ['João Torquato de Souza', 'Diácono'],
    ['Eliseu Simão Rezende da Silva', 'Diácono']
  ]
};

// ===========================================================================
// 2. MENU
// ===========================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tesouraria CMI')
    .addItem('Recriar layout do Comprovante', 'criarLayoutComprovante')
    .addSeparator()
    .addItem('Ver como lançamento único', 'verLancamentoUnico')
    .addItem('Ver como lançamento em lote (5 linhas)', 'verLancamentoEmLote')
    .addToUi();
}

/** Mostra a aba no formato de um lançamento só (sem tabela). */
function verLancamentoUnico() {
  aplicarModo_(SpreadsheetApp.getActive().getSheetByName(ABA),
    { lancamentos: 0, mostrarContas: true });
}

/** Mostra a aba no formato de lote, com 5 lançamentos de exemplo. */
function verLancamentoEmLote() {
  aplicarModo_(SpreadsheetApp.getActive().getSheetByName(ABA),
    { lancamentos: 5, mostrarContas: true });
}

// ===========================================================================
// 3. FUNÇÃO PRINCIPAL
// ===========================================================================

/**
 * Apaga e redesenha a aba "Comprovante" do zero. Pode rodar quantas vezes
 * quiser — nada acumula nem sai do lugar.
 */
function criarLayoutComprovante() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Renomeia a aba antiga antes de criar a nova: assim funciona mesmo quando
  // "Comprovante" é a única aba da planilha.
  var antiga = ss.getSheetByName(ABA);
  if (antiga) antiga.setName(ABA + '_ANTIGA_' + new Date().getTime());

  var sh = ss.insertSheet(ABA, 0);
  if (antiga) ss.deleteSheet(antiga);

  montarLinhas_();
  dimensionarGrade_(sh);
  aplicarBaseVisual_(sh);

  desenharCabecalho_(sh);
  desenharIdentificacao_(sh);
  desenharOrigemDestino_(sh);
  desenharTabelaLote_(sh);
  desenharAssinaturas_(sh);
  desenharRodape_(sh);

  aplicarModo_(sh, { lancamentos: 0, mostrarContas: true });

  sh.setActiveSelection('A1');
  SpreadsheetApp.flush();
  return sh;
}

// ===========================================================================
// 4. MONTAGEM DA GRADE
// ===========================================================================

/** Índice nome-da-linha -> número da linha na planilha. */
var MAPA_LINHAS = {};

/** Insere as linhas do lote na lista e monta o índice de nomes. */
function montarLinhas_() {
  var lista = [];
  LINHAS.forEach(function (l) {
    lista.push(l);
    if (l.id === 'TAB_CAB') {
      for (var i = 1; i <= MAX_LINHAS_LOTE; i++) {
        lista.push({ id: 'TAB_' + i, px: ALTURA_LINHA_LOTE, opcional: true });
      }
    }
  });
  LINHAS_EXPANDIDAS = lista;

  MAPA_LINHAS = {};
  lista.forEach(function (l, i) { MAPA_LINHAS[l.id] = i + 1; });
}

var LINHAS_EXPANDIDAS = [];

/** Número da linha na planilha a partir do nome. */
function lin_(id) {
  if (!MAPA_LINHAS[id]) montarLinhas_();
  return MAPA_LINHAS[id];
}

/** Deixa a aba com exatamente 14 colunas e as medidas calculadas. */
function dimensionarGrade_(sh) {
  var nCols = COLUNAS.length;
  var nLinhas = LINHAS_EXPANDIDAS.length;

  if (sh.getMaxColumns() > nCols) {
    sh.deleteColumns(nCols + 1, sh.getMaxColumns() - nCols);
  } else if (sh.getMaxColumns() < nCols) {
    sh.insertColumnsAfter(sh.getMaxColumns(), nCols - sh.getMaxColumns());
  }
  if (sh.getMaxRows() > nLinhas) {
    sh.deleteRows(nLinhas + 1, sh.getMaxRows() - nLinhas);
  } else if (sh.getMaxRows() < nLinhas) {
    sh.insertRowsAfter(sh.getMaxRows(), nLinhas - sh.getMaxRows());
  }

  COLUNAS.forEach(function (c, i) { sh.setColumnWidth(i + 1, c.px); });
  LINHAS_EXPANDIDAS.forEach(function (l, i) { sh.setRowHeight(i + 1, l.px); });
}

/** Fonte padrão, alinhamento vertical e sem linhas de grade (vira "papel"). */
function aplicarBaseVisual_(sh) {
  sh.getRange(1, 1, LINHAS_EXPANDIDAS.length, COLUNAS.length)
    .setFontFamily(FONTE)
    .setFontSize(pt_(TAM.corpo))
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sh.setHiddenGridlines(true);
}

// ===========================================================================
// 5. BLOCOS DO DOCUMENTO
// ===========================================================================

/** Cabeçalho institucional e título. */
function desenharCabecalho_(sh) {
  campo_(sh, faixa_('D:I', 'CAB_1'), CABECALHO.entidade,
    { tam: TAM.entidade, negrito: true, h: 'center' });
  campo_(sh, faixa_('J:N', 'CAB_1'), CABECALHO.folha, { h: 'right' });

  campo_(sh, faixa_('A:C', 'CAB_2'), CABECALHO.endereco, { h: 'left' });
  campo_(sh, faixa_('D:I', 'CAB_2'), CABECALHO.cidade, { h: 'center' });
  campo_(sh, faixa_('J:N', 'CAB_2'), CABECALHO.cnpj, { h: 'right' });

  // Régua fina em cima do título e média embaixo, como no SIGA.
  borda_(sh, faixa_('A:N', 'ESP_1'), { baixo: true, estilo: 'FINA' });
  campo_(sh, faixa_('A:N', 'TITULO'),
    MODO_SOBREPOSICAO_SIGA ? CABECALHO.tituloSiga : CABECALHO.tituloCmi,
    { tam: TAM.titulo, negrito: true, h: 'center' });
  borda_(sh, faixa_('A:N', 'TITULO'), { baixo: true, estilo: 'MEDIA' });
}

/** Referência, numeração SIGA, Status, Data, Valor, extenso, Tipo, Observação. */
function desenharIdentificacao_(sh) {
  rotulo_(sh, faixa_('A:B', 'IDENT_1'), 'Referência:');
  campo_(sh, faixa_('C:C', 'IDENT_1'), val_(EXEMPLO.referencia), { negrito: true });

  rotulo_(sh, faixa_('D:F', 'IDENT_1'), 'numeração SIGA:');
  campo_(sh, faixa_('G:G', 'IDENT_1'), val_(EXEMPLO.numeracaoSiga), { negrito: true });

  rotulo_(sh, faixa_('H:H', 'IDENT_1'), 'Status:');
  campo_(sh, faixa_('I:N', 'IDENT_1'), val_(EXEMPLO.status), { negrito: true });

  rotulo_(sh, faixa_('A:B', 'IDENT_2'), 'Data Emissão:');
  campo_(sh, faixa_('C:F', 'IDENT_2'), val_(EXEMPLO.data),
    { negrito: true, formato: 'dd/MM/yyyy' });

  // O rótulo vira "Valor Total:" quando o comprovante é de lote (ver aplicarModo_).
  rotulo_(sh, faixa_('G:H', 'IDENT_2'), 'Valor:');
  campo_(sh, faixa_('I:K', 'IDENT_2'), val_(EXEMPLO.valor),
    { negrito: true, formato: 'R$ #,##0.00' });
  campo_(sh, faixa_('L:N', 'IDENT_2'), val_(EXEMPLO.extenso), { negrito: true });

  rotulo_(sh, faixa_('A:B', 'TIPO'), 'Tipo:');
  campo_(sh, faixa_('C:N', 'TIPO'), val_(EXEMPLO.tipo), { negrito: true });

  rotulo_(sh, faixa_('A:B', 'OBS'), 'Observação:');
  campo_(sh, faixa_('C:N', 'OBS'), val_(EXEMPLO.observacao), { negrito: true });

  borda_(sh, faixa_('A:N', 'SEP_1'), { baixo: true, estilo: 'FINA' });
}

/** Origem, Destino, contas envolvidas (opcionais) e CNPJs. */
function desenharOrigemDestino_(sh) {
  rotulo_(sh, faixa_('A:B', 'ORIGEM_DESTINO'), 'Origem:');
  campo_(sh, faixa_('C:F', 'ORIGEM_DESTINO'), val_(EXEMPLO.origem), { negrito: true });
  rotulo_(sh, faixa_('G:H', 'ORIGEM_DESTINO'), 'Destino:');
  campo_(sh, faixa_('I:N', 'ORIGEM_DESTINO'), val_(EXEMPLO.destino), { negrito: true });

  campo_(sh, faixa_('C:F', 'CONTAS'), val_(EXEMPLO.contaOrigem), {});
  campo_(sh, faixa_('I:N', 'CONTAS'), val_(EXEMPLO.contaDestino), {});

  rotulo_(sh, faixa_('A:B', 'CNPJ'), 'CNPJ:');
  campo_(sh, faixa_('C:F', 'CNPJ'), val_(EXEMPLO.cnpjOrigem), { negrito: true });
  rotulo_(sh, faixa_('G:H', 'CNPJ'), 'CNPJ:');
  campo_(sh, faixa_('I:N', 'CNPJ'), val_(EXEMPLO.cnpjDestino), { negrito: true });

  borda_(sh, faixa_('A:N', 'SEP_2'), { baixo: true, estilo: 'FINA' });
}

/**
 * Tabela do comprovante em lote. Fica pronta mas escondida: só aparece quando
 * o comprovante reúne mais de um lançamento, e com exatamente o número de
 * linhas dos lançamentos — nunca sobra linha em branco.
 */
function desenharTabelaLote_(sh) {
  COLUNAS_LOTE.forEach(function (c) {
    var cab = faixa_(c.ini + ':' + c.fim, 'TAB_CAB');
    campo_(sh, cab, c.rotulo, { negrito: true, h: 'center' });
    sh.getRange(cab).setBackground('#f1f1f1');

    for (var i = 1; i <= MAX_LINHAS_LOTE; i++) {
      var cel = sh.getRange(faixa_(c.ini + ':' + c.fim, 'TAB_' + i));
      cel.merge().setHorizontalAlignment(c.alinhamento);
      if (c.formato) cel.setNumberFormat(c.formato);
    }
  });

  var area = 'A' + lin_('TAB_CAB') + ':N' + lin_('TAB_' + MAX_LINHAS_LOTE);
  sh.getRange(area).setBorder(null, true, true, true, true, true,
    '#999999', SpreadsheetApp.BorderStyle.SOLID);

  campo_(sh, faixa_('A:K', 'TAB_TOTAL'), 'TOTAL', { negrito: true, h: 'right' });
  campo_(sh, faixa_('L:N', 'TAB_TOTAL'), '',
    { negrito: true, h: 'right', formato: 'R$ #,##0.00' });
  borda_(sh, faixa_('L:N', 'TAB_TOTAL'), { baixo: true, estilo: 'FINA' });
}

/**
 * Os seis espaços de assinatura. A régua de assinatura é fina (0,75 pt), a
 * mesma espessura da do SIGA.
 */
function desenharAssinaturas_(sh) {
  ['ESP_ASSIN_1', 'ESP_ASSIN_2'].forEach(function (linha) {
    BLOCOS_ASSINATURA.forEach(function (bloco) {
      borda_(sh, faixa_(bloco, linha), { baixo: true, estilo: 'FINA' });
    });
  });

  // Posições 1 a 5: nome e cargo vêm do cadastro de diáconos.
  var posicoes = [
    { bloco: 'A:D', nome: 'NOME_1', cargo: 'CARGO_1' },
    { bloco: 'F:I', nome: 'NOME_1', cargo: 'CARGO_1' },
    { bloco: 'K:N', nome: 'NOME_1', cargo: 'CARGO_1' },
    { bloco: 'A:D', nome: 'NOME_2', cargo: 'CARGO_2' },
    { bloco: 'F:I', nome: 'NOME_2', cargo: 'CARGO_2' }
  ];
  posicoes.forEach(function (p, i) {
    var dados = PREENCHER_EXEMPLO ? EXEMPLO.assinantes[i] : ['', ''];
    campo_(sh, faixa_(p.bloco, p.nome), dados[0], { h: 'center' });
    campo_(sh, faixa_(p.bloco, p.cargo), dados[1], { h: 'center' });
  });

  // Posição 6: sempre manual, para signatário fora do cadastro — igual ao SIGA.
  campo_(sh, faixa_('K:L', 'NOME_2'), 'Nome:', { h: 'left' });
  campo_(sh, faixa_('M:N', 'NOME_2'), '', { h: 'left' });
  borda_(sh, faixa_('M:N', 'NOME_2'), { baixo: true, estilo: 'FINA' });

  campo_(sh, faixa_('K:M', 'CARGO_2'), 'Cargo/Ministério:', { h: 'left' });
  campo_(sh, faixa_('N:N', 'CARGO_2'), '', { h: 'left' });
  borda_(sh, faixa_('N:N', 'CARGO_2'), { baixo: true, estilo: 'FINA' });
}

/** Nota das 3 assinaturas, régua do rodapé e o rodapé em três partes. */
function desenharRodape_(sh) {
  campo_(sh, faixa_('E:N', 'NOTA'), CABECALHO.nota, { tam: TAM.nota, h: 'right' });
  borda_(sh, faixa_('A:N', 'NOTA'), { baixo: true, estilo: 'FINA' });

  campo_(sh, faixa_('A:F', 'RODAPE'), CABECALHO.rodape, { h: 'left' });
  campo_(sh, faixa_('G:K', 'RODAPE'), '', { h: 'center' });   // "Emitido em ..."
  campo_(sh, faixa_('L:N', 'RODAPE'), CABECALHO.folha, { h: 'right' });
}

// ===========================================================================
// 6. MODOS DE EXIBIÇÃO (único x lote, contas visíveis ou não)
// ===========================================================================

/**
 * Ajusta a aba para o comprovante que vai ser gerado:
 *   op.lancamentos    0 = lançamento único (tabela some por completo)
 *                     N = lote com N linhas (aparecem exatamente N linhas)
 *   op.mostrarContas  mostra ou esconde a linha das contas de origem/destino
 *
 * A linha de PREENCHIMENTO é recalculada para que a régua e o rodapé fiquem
 * sempre grudados no pé da folha, em qualquer combinação.
 */
function aplicarModo_(sh, op) {
  op = op || {};
  var lancamentos = Math.max(0, Math.min(op.lancamentos || 0, MAX_LINHAS_LOTE));
  var mostrarContas = op.mostrarContas !== false;
  var emLote = lancamentos > 1;

  mostrar_(sh, 'CONTAS', mostrarContas);
  mostrar_(sh, 'TAB_CAB', emLote);
  mostrar_(sh, 'TAB_TOTAL', emLote);
  for (var i = 1; i <= MAX_LINHAS_LOTE; i++) {
    mostrar_(sh, 'TAB_' + i, emLote && i <= lancamentos);
  }

  // Em lote o rótulo do valor vira "Valor Total:" (é a soma das linhas).
  sh.getRange(faixa_('G:H', 'IDENT_2')).setValue(emLote ? 'Valor Total:' : 'Valor:');

  sh.setRowHeight(lin_('PREENCHIMENTO'), alturaDoPreenchimento_(sh));
  SpreadsheetApp.flush();
}

/** Sobra da folha: o que não foi usado pelas linhas visíveis. */
function alturaDoPreenchimento_(sh) {
  if (!LINHAS_EXPANDIDAS.length) montarLinhas_();
  var usado = 0;
  LINHAS_EXPANDIDAS.forEach(function (l, i) {
    if (l.id === 'PREENCHIMENTO') return;
    if (!sh.isRowHiddenByUser(i + 1)) usado += l.px;
  });
  return Math.max(1, ALTURA_UTIL_PX - usado);
}

function mostrar_(sh, id, visivel) {
  var n = lin_(id);
  if (visivel) sh.showRows(n); else sh.hideRows(n);
}

// ===========================================================================
// 7. AUXILIARES
// ===========================================================================

/** Compensa os 2,5% que o Sheets encolhe a fonte ao exportar em PDF. */
function pt_(tamanho) {
  return tamanho / COMPENSACAO_FONTE;
}

/** Monta "C7:F7" a partir de "C:F" e do nome da linha. */
function faixa_(colunas, idLinha) {
  var n = lin_(idLinha);
  var partes = colunas.split(':');
  return partes[0] + n + ':' + partes[1] + n;
}

/** Devolve o valor de exemplo, ou vazio quando PREENCHER_EXEMPLO = false. */
function val_(valor) {
  return PREENCHER_EXEMPLO ? valor : '';
}

/** Rótulo do formulário: fonte normal, alinhado à direita (como no SIGA). */
function rotulo_(sh, intervalo, texto) {
  return campo_(sh, intervalo, texto, { h: 'right' });
}

/** Mescla o intervalo, escreve o conteúdo e aplica fonte/alinhamento/formato. */
function campo_(sh, intervalo, valor, op) {
  op = op || {};
  var r = sh.getRange(intervalo);
  if (r.getNumColumns() > 1 || r.getNumRows() > 1) r.merge();
  if (op.formato) r.setNumberFormat(op.formato);
  r.setFontSize(pt_(op.tam || TAM.corpo))
   .setFontWeight(op.negrito ? 'bold' : 'normal')
   .setHorizontalAlignment(op.h || 'left')
   .setVerticalAlignment('middle');
  if (valor !== undefined && valor !== null && valor !== '') r.setValue(valor);
  return r;
}

/** Aplica só as bordas pedidas. FINA = 0,75 pt | MEDIA = 1,5 pt no PDF. */
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
