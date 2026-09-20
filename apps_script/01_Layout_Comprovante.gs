/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * ETAPA 1: layout visual da aba "Comprovante".
 *
 * DE ONDE VEM ESTE LAYOUT
 * Ele reproduz, medida por medida, o comprovante que o Taynã aprovou
 * (docs/referencia_layout_aprovado.pdf) — que por sua vez nasceu do
 * comprovante emitido pelo próprio SIGA (docs/referencia_siga_comprovante.pdf).
 * Toda a grade abaixo foi extraída desses dois PDFs, não estimada.
 *
 * COMO O GOOGLE SHEETS EXPORTA EM PDF (medido em exportação real, escala
 * Normal 100%) — é a "régua de conversão" do projeto:
 *   - 1 pixel de linha/coluna = 0,75 ponto;
 *   - o tamanho da fonte sai EXATAMENTE como pedido, mas só aceita número
 *     inteiro: pedir 7,18 vira 8. Por isso todo tamanho aqui é inteiro;
 *   - o topo do texto (alinhamento vertical "meio") cai em:
 *     topo_da_linha + (altura_da_linha − 1,25 × tamanho_da_fonte) / 2 − 0,37 pt
 *     (conferido em 5 campos do PDF aprovado: erro de 0,01 pt);
 *   - só existem três espessuras de borda: fina = 0,75 pt, média = 1,5 pt,
 *     grossa = 2,25 pt. O documento usa **fina em todas as réguas**.
 *
 * O que este arquivo AINDA NÃO faz (vem nas próximas etapas):
 *   - nenhuma fórmula, nenhum valor por extenso automático;
 *   - nenhuma lista suspensa / validação de dados;
 *   - nenhum formulário, nenhuma geração de PDF, nenhum arquivo .md.
 *
 * ATENÇÃO: rodar `criarLayoutComprovante` APAGA e redesenha a aba inteira.
 * Ajustes feitos à mão na aba se perdem — peça a mudança no código.
 */

// ===========================================================================
// 1. CONFIGURAÇÃO
// ===========================================================================

var ABA = 'Comprovante';
var FONTE = 'Tahoma';

/** Tamanhos em pontos. SEMPRE inteiros — o Sheets arredonda para cima. */
var TAM = {
  corpo: 6,      // rótulos e valores
  entidade: 7,   // CONGREGAÇÃO CRISTÃ NO BRASIL
  titulo: 12,    // título do documento
  destaque: 8,   // tipo de transferência e nomes dos signatários
  nota: 6        // nota das 3 assinaturas e rodapé lateral
};

/** false gera a aba sem nenhum dado de exemplo, só o layout. */
var PREENCHER_EXEMPLO = true;

/**
 * Impressão. Estes são os ajustes do PDF aprovado — o mesmo conjunto que a
 * Etapa 5 vai usar para gerar o PDF automaticamente.
 */
var IMPRESSAO = {
  papel: 'A4', orientacao: 'retrato', escala: 'Normal (100%)',
  margens_cm: { topo: 0.97, base: 0.97, esquerda: 1.02, direita: 0.89 },
  alinhamento: { horizontal: 'Centro', vertical: 'Acima' },
  linhasDeGrade: false
};

/**
 * Altura útil da folha, em pixels de planilha — **validada em exportação
 * real**: com 1045 px o documento sai em uma página só, com a régua e a nota
 * do rodapé coladas no pé. Não aumentar sem testar: acima de ~1048 px o
 * Sheets quebra em duas páginas.
 */
var ALTURA_UTIL_PX = 1045;

// Cabeçalho institucional. Na Etapa 5 passa a vir da aba Cadastros e a trocar
// por etapa (Aprovação/Pagamento = ADM de Origem; Recebimento = ADM de Destino).
var CABECALHO = {
  entidade: 'CONGREGAÇÃO CRISTÃ NO BRASIL',
  endereco: 'RUA JOAQUIM CARDEAL DE SOUZA , 311',
  cidade: 'COXIM - MS',
  cnpj: 'CNPJ 03.673.233/0001-43 - IE ISENTO',
  folha: 'Folha 1 / 1',
  emitidoEm: 'emitido em ',
  nota: 'Necessário no mínimo 3 assinaturas (nome completo, cargo ou ministério, e assinatura) para anexação no SIGA.',
  rodapeLateral: ' formulário interno da tesouraria da piedade da ADM local de Coxim, MS. V. 1.26'
};

/**
 * O título depende de onde a movimentação acontece (regra do Taynã):
 *   mesma PIA (só muda de conta)  -> COMPROVANTE DE MOVIMENTAÇÃO INTERNA
 *   PIAs diferentes              -> COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS
 * É a mesma comparação que decide se a movimentação gera 2 ou 3 documentos.
 */
var TITULOS = {
  mesmaPia: 'COMPROVANTE DE MOVIMENTAÇÃO INTERNA',
  piasDiferentes: 'COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS'
};

// ---------------------------------------------------------------------------
// GRADE DE COLUNAS — 19 colunas (A..S), 694 px = 520,5 pt de largura.
// A coluna existe para criar um limite; o limite acumulado é o que importa.
// ---------------------------------------------------------------------------
var COLUNAS = [
  { col: 'A', px: 11 },   //  11 - faixa do rodapé lateral (texto em pé)
  { col: 'B', px: 24 },   //  35 - início do 1º bloco de assinatura / borda da folha
  { col: 'C', px: 58 },   //  93 - FIM DOS RÓTULOS da coluna 1 / início dos valores
  { col: 'D', px: 26 },   // 119 - fim do rótulo "Conta:" da origem
  { col: 'E', px: 61 },   // 180 - fim do valor da Referência
  { col: 'F', px: 47 },   // 227 - fim do rótulo "numeração SIGA" / do 1º bloco
  { col: 'G', px: 23 },   // 250 - início do 2º bloco de assinatura
  { col: 'H', px: 12 },   // 262 - limite DOCUMENTO|BENEFICIÁRIO da tabela
  { col: 'I', px: 38 },   // 300 - fim do valor da numeração SIGA
  { col: 'J', px: 91 },   // 391 - FIM DOS RÓTULOS da coluna 2
  { col: 'K', px: 9 },    // 400 - início dos valores da coluna 2
  { col: 'L', px: 26 },   // 426 - fim do rótulo "Conta:" do destino / do 2º bloco
  { col: 'M', px: 34 },   // 460 - fim do valor do Valor
  { col: 'N', px: 9 },    // 469 - início do extenso / do 3º bloco de assinatura
  { col: 'O', px: 38 },   // 507 - fim do rótulo "Nome:"
  { col: 'P', px: 9 },    // 516 - limite BENEFICIÁRIO|VALOR da tabela
  { col: 'Q', px: 47 },   // 563 - fim do rótulo "Cargo/Ministério:"
  { col: 'R', px: 109 },  // 672 - fim dos blocos de assinatura
  { col: 'S', px: 22 }    // 694 - fim da folha
];

// ---------------------------------------------------------------------------
// GRADE DE LINHAS — cada linha tem nome; o código nunca usa "linha 7".
// ---------------------------------------------------------------------------
var LINHAS = [
  { id: 'CAB_1', px: 16, fonte: 7 },   // entidade / Folha 1 / 1
  { id: 'CAB_2', px: 15, fonte: 6 },   // endereço / cidade / CNPJ
  { id: 'ESP_1', px: 4 },              // régua em cima do título
  { id: 'TITULO', px: 28, fonte: 12 }, // título + régua embaixo (28 px afasta os acentos da régua)
  { id: 'ESP_2', px: 9 },
  { id: 'IDENT_1', px: 16, fonte: 6 }, // Referência | numeração SIGA | Status
  { id: 'IDENT_2', px: 16, fonte: 6 }, // Data Emissão | Valor (Total) | extenso
  { id: 'TIPO', px: 18, fonte: 8 },
  { id: 'OBS', px: 16, fonte: 6 },
  { id: 'SEP_1', px: 9 },              // régua
  { id: 'ESP_3', px: 9 },
  { id: 'ORIGEM_DESTINO', px: 16, fonte: 6 },
  { id: 'CONTAS', px: 16, fonte: 6, opcional: true },
  { id: 'CNPJ', px: 16, fonte: 6 },
  { id: 'SEP_2', px: 9 },              // régua (topo da tabela)
  { id: 'TAB_CAB', px: 16, fonte: 6, opcional: true },
  // as linhas de lançamento do lote entram aqui (montarLinhas_)
  { id: 'TAB_TOTAL', px: 16, fonte: 6, opcional: true },
  { id: 'PREENCHIMENTO', px: 535 },    // sobra da folha — altura recalculada
  { id: 'ESP_ASSIN_1', px: 91 },       // espaço da 1ª fileira + régua de assinatura
  { id: 'NOME_1', px: 18, fonte: 8 },
  { id: 'CARGO_1', px: 18, fonte: 8 },
  { id: 'ESP_ASSIN_2', px: 91 },       // espaço da 2ª fileira + régua de assinatura
  { id: 'NOME_2', px: 18, fonte: 8 },
  { id: 'CARGO_2', px: 18, fonte: 8 },
  { id: 'ESP_RODAPE', px: 30 },        // régua do rodapé
  { id: 'NOTA', px: 15, fonte: 6 }     // nota das 3 assinaturas, abaixo da régua
];

/** Tabela do lote: 33 lançamentos cabem em uma folha. */
var MAX_LINHAS_LOTE = 33;
var ALTURA_LINHA_LOTE = 15;

var COLUNAS_LOTE = [
  { rotulo: 'DATA', ini: 'B', fim: 'C', alinhamento: 'center', formato: 'dd/MM/yyyy' },
  { rotulo: 'DOCUMENTO / CARTÃO', ini: 'D', fim: 'H', alinhamento: 'left' },
  { rotulo: 'BENEFICIÁRIO / FINALIDADE', ini: 'I', fim: 'P', alinhamento: 'left' },
  { rotulo: 'VALOR', ini: 'Q', fim: 'S', alinhamento: 'right', formato: 'R$ #,##0.00' }
];

/** Os três blocos de assinatura, em colunas. */
var BLOCOS_ASSINATURA = ['C:F', 'H:L', 'O:R'];

/** Dados de exemplo — os mesmos do comprovante real do SIGA. */
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
  contaOrigem: '101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE',
  cnpjOrigem: '03.673.233/0001-43',
  destino: 'PIA - SÃO GABRIEL DO OESTE',
  contaDestino: '101.17 - ACG - AG:01 CC:127884427 - PIEDADE',
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

function verLancamentoUnico() {
  aplicarModo_(SpreadsheetApp.getActive().getSheetByName(ABA),
    { lancamentos: 0, mostrarContas: true });
}

function verLancamentoEmLote() {
  aplicarModo_(SpreadsheetApp.getActive().getSheetByName(ABA),
    { lancamentos: 5, mostrarContas: true });
}

// ===========================================================================
// 3. FUNÇÃO PRINCIPAL
// ===========================================================================

function criarLayoutComprovante() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

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

var MAPA_LINHAS = {};
var LINHAS_EXPANDIDAS = [];

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

function lin_(id) {
  if (!MAPA_LINHAS[id]) montarLinhas_();
  return MAPA_LINHAS[id];
}

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
  LINHAS_EXPANDIDAS.forEach(function (l, i) {
    sh.setRowHeight(i + 1, alturaDaLinha_(l));
  });
}

/**
 * Altura de uma linha, respeitando o mínimo que o Sheets impõe pela fonte.
 * Se uma linha for mais baixa que esse mínimo, o Sheets a estica sozinho na
 * exportação — foi isso que empurrou o documento para uma segunda página.
 * Mínimo medido em exportação real: fonte × 1,667 + 4,7 pixels
 * (6 pt = 15 px · 7 pt = 16 px · 8 pt = 18 px · 12 pt = 25 px).
 */
function alturaDaLinha_(linha) {
  var minimo = linha.fonte ? Math.round(linha.fonte * 1.667 + 4.7) : 2;
  return Math.max(linha.px, minimo);
}

function aplicarBaseVisual_(sh) {
  sh.getRange(1, 1, LINHAS_EXPANDIDAS.length, COLUNAS.length)
    .setFontFamily(FONTE)
    .setFontSize(TAM.corpo)
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sh.setHiddenGridlines(true);
}

// ===========================================================================
// 5. BLOCOS DO DOCUMENTO
// ===========================================================================

function desenharCabecalho_(sh) {
  campo_(sh, faixa_('G:N', 'CAB_1'), CABECALHO.entidade,
    { tam: TAM.entidade, negrito: true, h: 'center' });
  campo_(sh, faixa_('O:S', 'CAB_1'), CABECALHO.folha, { h: 'right' });

  campo_(sh, faixa_('B:F', 'CAB_2'), CABECALHO.endereco, { h: 'left' });
  campo_(sh, faixa_('G:N', 'CAB_2'), CABECALHO.cidade, { h: 'center' });
  campo_(sh, faixa_('O:S', 'CAB_2'), CABECALHO.cnpj, { h: 'right' });

  // As duas réguas que emolduram o título são espessas, na mesma espessura.
  // O SIGA usa 2,0 pt; a mais próxima que o Sheets oferece é 2,25 pt.
  borda_(sh, faixa_('B:S', 'ESP_1'), { baixo: true, estilo: 'GROSSA' });
  campo_(sh, faixa_('B:S', 'TITULO'),
    tituloDoComprovante_(EXEMPLO.origem, EXEMPLO.destino),
    { tam: TAM.titulo, negrito: true, h: 'center' });
  borda_(sh, faixa_('B:S', 'TITULO'), { baixo: true, estilo: 'GROSSA' });
}

/**
 * Escolhe o título conforme a movimentação seja dentro da mesma PIA ou entre
 * PIAs diferentes. A comparação é pelo prefixo da PIA — é a mesma regra que
 * decide se a movimentação gera 2 ou 3 documentos.
 */
function tituloDoComprovante_(origem, destino) {
  return pia_(origem) === pia_(destino) ? TITULOS.mesmaPia : TITULOS.piasDiferentes;
}

/** Extrai a PIA de um texto de conta ("PIA-COXIM: 101.10 - ..." -> "PIA-COXIM"). */
function pia_(texto) {
  if (!texto) return '';
  return String(texto).split(':')[0].replace(/\s|-/g, '').toUpperCase();
}

function desenharIdentificacao_(sh) {
  rotulo_(sh, faixa_('B:C', 'IDENT_1'), 'Referência:');
  campo_(sh, faixa_('D:E', 'IDENT_1'), val_(EXEMPLO.referencia), { negrito: true });

  rotulo_(sh, faixa_('F:G', 'IDENT_1'), 'numeração SIGA:');
  campo_(sh, faixa_('H:I', 'IDENT_1'), val_(EXEMPLO.numeracaoSiga), { negrito: true });

  rotulo_(sh, faixa_('J:J', 'IDENT_1'), 'Status:');
  campo_(sh, faixa_('L:M', 'IDENT_1'), val_(EXEMPLO.status), { negrito: true });

  rotulo_(sh, faixa_('B:C', 'IDENT_2'), 'Data Emissão:');
  campo_(sh, faixa_('D:I', 'IDENT_2'), val_(EXEMPLO.data),
    { negrito: true, formato: 'dd/MM/yyyy' });

  // O rótulo vira "Valor Total:" quando o comprovante é de lote (aplicarModo_).
  rotulo_(sh, faixa_('J:J', 'IDENT_2'), 'Valor:');
  campo_(sh, faixa_('L:M', 'IDENT_2'), val_(EXEMPLO.valor),
    { negrito: true, formato: 'R$ #,##0.00' });
  campo_(sh, faixa_('O:S', 'IDENT_2'), val_(EXEMPLO.extenso), { negrito: true });

  rotulo_(sh, faixa_('B:C', 'TIPO'), 'Tipo Transferência:');
  campo_(sh, faixa_('D:S', 'TIPO'), val_(EXEMPLO.tipo),
    { tam: TAM.destaque, negrito: true });

  rotulo_(sh, faixa_('B:C', 'OBS'), 'Observação:');
  campo_(sh, faixa_('D:S', 'OBS'), val_(EXEMPLO.observacao), { negrito: true });

  borda_(sh, faixa_('B:S', 'SEP_1'), { baixo: true });
}

function desenharOrigemDestino_(sh) {
  rotulo_(sh, faixa_('B:C', 'ORIGEM_DESTINO'), 'Origem:');
  campo_(sh, faixa_('D:I', 'ORIGEM_DESTINO'), val_(EXEMPLO.origem), { negrito: true });
  rotulo_(sh, faixa_('J:J', 'ORIGEM_DESTINO'), 'Destino:');
  campo_(sh, faixa_('L:S', 'ORIGEM_DESTINO'), val_(EXEMPLO.destino), { negrito: true });

  rotulo_(sh, faixa_('D:D', 'CONTAS'), 'Conta:');
  campo_(sh, faixa_('E:I', 'CONTAS'), val_(EXEMPLO.contaOrigem), {});
  rotulo_(sh, faixa_('L:L', 'CONTAS'), 'Conta:');
  campo_(sh, faixa_('M:S', 'CONTAS'), val_(EXEMPLO.contaDestino), {});

  rotulo_(sh, faixa_('B:C', 'CNPJ'), 'CNPJ:');
  campo_(sh, faixa_('D:I', 'CNPJ'), val_(EXEMPLO.cnpjOrigem), { negrito: true });
  rotulo_(sh, faixa_('J:J', 'CNPJ'), 'CNPJ:');
  campo_(sh, faixa_('L:S', 'CNPJ'), val_(EXEMPLO.cnpjDestino), { negrito: true });

  borda_(sh, faixa_('B:S', 'SEP_2'), { baixo: true });
}

function desenharTabelaLote_(sh) {
  COLUNAS_LOTE.forEach(function (c) {
    var cab = faixa_(c.ini + ':' + c.fim, 'TAB_CAB');
    campo_(sh, cab, c.rotulo, { negrito: true, h: 'center' });

    for (var i = 1; i <= MAX_LINHAS_LOTE; i++) {
      var cel = sh.getRange(faixa_(c.ini + ':' + c.fim, 'TAB_' + i));
      cel.merge().setHorizontalAlignment(c.alinhamento);
      if (c.formato) cel.setNumberFormat(c.formato);
    }
  });

  // Grade da tabela: só linhas horizontais finas, como no layout aprovado.
  var area = 'B' + lin_('TAB_CAB') + ':S' + lin_('TAB_' + MAX_LINHAS_LOTE);
  sh.getRange(area).setBorder(null, null, true, null, null, true,
    '#000000', SpreadsheetApp.BorderStyle.SOLID);

  campo_(sh, faixa_('B:P', 'TAB_TOTAL'), 'TOTAL', { negrito: true, h: 'right' });
  campo_(sh, faixa_('Q:S', 'TAB_TOTAL'), '',
    { negrito: true, h: 'right', formato: 'R$ #,##0.00' });
  borda_(sh, faixa_('Q:S', 'TAB_TOTAL'), { topo: true, baixo: true });
}

/**
 * Seis espaços de assinatura, em duas fileiras de três. A régua de assinatura
 * é a borda inferior (fina) da linha de espaço, em cada um dos três blocos.
 */
function desenharAssinaturas_(sh) {
  ['ESP_ASSIN_1', 'ESP_ASSIN_2'].forEach(function (linha) {
    BLOCOS_ASSINATURA.forEach(function (bloco) {
      var r = sh.getRange(faixa_(bloco, linha));
      r.merge();
      borda_(sh, faixa_(bloco, linha), { baixo: true });
    });
  });

  var posicoes = [
    { bloco: 'C:F', nome: 'NOME_1', cargo: 'CARGO_1' },
    { bloco: 'H:L', nome: 'NOME_1', cargo: 'CARGO_1' },
    { bloco: 'O:R', nome: 'NOME_1', cargo: 'CARGO_1' },
    { bloco: 'C:F', nome: 'NOME_2', cargo: 'CARGO_2' },
    { bloco: 'H:L', nome: 'NOME_2', cargo: 'CARGO_2' }
  ];
  posicoes.forEach(function (p, i) {
    var dados = PREENCHER_EXEMPLO ? EXEMPLO.assinantes[i] : ['', ''];
    campo_(sh, faixa_(p.bloco, p.nome), dados[0], { tam: TAM.destaque, h: 'center' });
    campo_(sh, faixa_(p.bloco, p.cargo), dados[1], { tam: TAM.destaque, h: 'center' });
  });

  // 6ª posição: sempre manual, para signatário fora do cadastro.
  campo_(sh, faixa_('O:O', 'NOME_2'), 'Nome:', { h: 'left' });
  campo_(sh, faixa_('P:R', 'NOME_2'), '', { h: 'left' });
  borda_(sh, faixa_('P:R', 'NOME_2'), { baixo: true });

  campo_(sh, faixa_('O:Q', 'CARGO_2'), 'Cargo/Ministério:', { h: 'left' });
  campo_(sh, faixa_('R:R', 'CARGO_2'), '', { h: 'left' });
  borda_(sh, faixa_('R:R', 'CARGO_2'), { baixo: true });
}

/**
 * Rodapé: a identificação do formulário fica **em pé, na lateral esquerda**
 * (coluna A), e a nota das 3 assinaturas fica **abaixo** da régua do rodapé.
 */
function desenharRodape_(sh) {
  borda_(sh, faixa_('B:S', 'ESP_RODAPE'), { baixo: true });

  // Data e hora de emissão à esquerda e nota das 3 assinaturas à direita,
  // os dois abaixo da régua do rodapé — como o SIGA faz.
  campo_(sh, faixa_('B:H', 'NOTA'), '', { tam: TAM.nota, h: 'left' });
  campo_(sh, faixa_('I:S', 'NOTA'), CABECALHO.nota, { tam: TAM.nota, h: 'right' });
  carimbarEmissao_(sh);

  // Termina na linha da régua do rodapé — o texto fica ACIMA dela.
  var lateral = sh.getRange('A1:A' + lin_('ESP_RODAPE'));
  lateral.merge()
    .setValue(CABECALHO.rodapeLateral)
    .setFontSize(TAM.nota)
    .setTextRotation(90)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('bottom');
}

/**
 * Escreve "emitido em dd/MM/yyyy HH:mm:ss" no rodapé. Na Etapa 1 o carimbo é
 * o momento em que a aba foi montada; a partir da Etapa 5 ele é refeito no
 * instante em que o PDF é gerado, que é a data que vale no documento.
 */
function carimbarEmissao_(sh) {
  var fuso = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var agora = Utilities.formatDate(new Date(), fuso, 'dd/MM/yyyy HH:mm:ss');
  sh.getRange(faixa_('B:H', 'NOTA')).setValue(CABECALHO.emitidoEm + agora);
}

// ===========================================================================
// 6. MODOS DE EXIBIÇÃO (único x lote, contas visíveis ou não)
// ===========================================================================

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

  sh.getRange(faixa_('J:J', 'IDENT_2')).setValue(emLote ? 'Valor Total:' : 'Valor:');
  carimbarEmissao_(sh);

  // Se a tabela ocupar a folha inteira, a linha de sobra some por completo.
  var sobra = alturaDoPreenchimento_(sh);
  if (sobra > 2) {
    mostrar_(sh, 'PREENCHIMENTO', true);
    sh.setRowHeight(lin_('PREENCHIMENTO'), sobra);
  } else {
    mostrar_(sh, 'PREENCHIMENTO', false);
  }
  SpreadsheetApp.flush();
}

/** Sobra da folha: fica entre a tabela e as assinaturas, que ficam no pé. */
function alturaDoPreenchimento_(sh) {
  if (!LINHAS_EXPANDIDAS.length) montarLinhas_();
  var usado = 0;
  LINHAS_EXPANDIDAS.forEach(function (l, i) {
    if (l.id === 'PREENCHIMENTO') return;
    if (!sh.isRowHiddenByUser(i + 1)) usado += alturaDaLinha_(l);
  });
  return ALTURA_UTIL_PX - usado;
}

function mostrar_(sh, id, visivel) {
  var n = lin_(id);
  if (visivel) sh.showRows(n); else sh.hideRows(n);
}

// ===========================================================================
// 7. AUXILIARES
// ===========================================================================

/** Monta "C7:F7" a partir de "C:F" e do nome da linha. */
function faixa_(colunas, idLinha) {
  var n = lin_(idLinha);
  var partes = colunas.split(':');
  return partes[0] + n + ':' + partes[1] + n;
}

/**
 * Valor de um campo do documento. Todo dado preenchido sai em CAIXA ALTA,
 * como no SIGA — os rótulos, não: eles ficam como estão escritos.
 * Nomes e cargos dos signatários são exceção: saem como estão no cadastro
 * de diáconos (regra do CLAUDE.md sobre nomes próprios).
 */
function val_(valor) {
  if (!PREENCHER_EXEMPLO) return '';
  return typeof valor === 'string' ? valor.toUpperCase() : valor;
}

/** Rótulo do formulário: fonte normal, alinhado à direita. */
function rotulo_(sh, intervalo, texto) {
  return campo_(sh, intervalo, texto, { h: 'right' });
}

/** Mescla o intervalo, escreve o conteúdo e aplica fonte/alinhamento/formato. */
function campo_(sh, intervalo, valor, op) {
  op = op || {};
  var r = sh.getRange(intervalo);
  if (r.getNumColumns() > 1 || r.getNumRows() > 1) r.merge();
  if (op.formato) r.setNumberFormat(op.formato);
  r.setFontSize(op.tam || TAM.corpo)
   .setFontWeight(op.negrito ? 'bold' : 'normal')
   .setHorizontalAlignment(op.h || 'left')
   .setVerticalAlignment(op.v || 'middle');
  if (valor !== undefined && valor !== null && valor !== '') r.setValue(valor);
  return r;
}

/**
 * Réguas. FINA = 0,75 pt | MEDIA = 1,5 pt | GROSSA = 2,25 pt no PDF.
 * O documento usa fina em tudo, menos nas duas réguas do título.
 */
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
