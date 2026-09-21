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
 * Impressão — aqui só como referência do que o documento espera.
 *
 * **Não ajuste isso em Arquivo → Imprimir.** Os ajustes de impressão do
 * Sheets não ficam guardados na planilha: ficam no navegador de cada pessoa,
 * e o Google os redefine sozinho. Quem manda de verdade é o
 * `EXPORTACAO_PDF` do arquivo `05_Gerar_PDF.gs`, que escreve cada ajuste no
 * pedido do PDF. O caminho certo é o menu
 * **Tesouraria CMI → Gerar PDF do comprovante**.
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

/**
 * Largura útil da folha, em pixels — a soma de COLUNAS. Passar disso não
 * quebra a página para baixo: **vaza de lado**, e o PDF sai em duas folhas
 * do mesmo jeito. Ao alargar uma coluna, estreite outra na mesma medida.
 */
var LARGURA_UTIL_PX = 694;

// Cabeçalho institucional. Na Etapa 5 passa a vir da aba Cadastros e a trocar
// por etapa (Aprovação/Pagamento = ADM de Origem; Recebimento = ADM de Destino).
var CABECALHO = {
  entidade: 'CONGREGAÇÃO CRISTÃ NO BRASIL',
  endereco: 'RUA JOAQUIM CARDEAL DE SOUZA , 311',
  cidade: 'COXIM - MS',
  cnpj: 'CNPJ 03.673.233/0001-43 - IE ISENTO',
  folha: 'Folha 1 / 1',
  emitidoEm: 'Emitido em ',   // com E maiúsculo, como o SIGA escreve
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
// GRADE DE COLUNAS — 22 colunas (A..V), 694 px = 520,5 pt de largura.
// A coluna existe para criar um limite; o limite acumulado é o que importa.
//
// A antiga coluna C (58 px, onde ficavam os rótulos da coluna 1) foi dividida
// em QUATRO (C+D+E+F = 15+14+15+14 = 58 px). Isso não mexe em nada do resto do
// documento — a soma é a mesma — e libera limites intermediários para o campo
// Conta começar mais à esquerda: "101.17 - ACG - AG:01 CC:127884427 - PIEDADE"
// não cabia no espaço antigo.
// ---------------------------------------------------------------------------
var COLUNAS = [
  { col: 'A', px: 11 },   //  11 - faixa do rodapé lateral (texto em pé)
  { col: 'B', px: 24 },   //  35 - início do 1º bloco de assinatura / borda da folha
  { col: 'C', px: 15 },   //  50 - FIM dos rótulos "Origem:" e "CNPJ:"
  { col: 'D', px: 14 },   //  64 - FIM do rótulo "Conta:" / início do valor da conta
  { col: 'E', px: 15 },   //  79 - (sobra da antiga coluna C, dividida em quatro)
  { col: 'F', px: 14 },   //  93 - FIM DOS RÓTULOS do bloco de cima (Referência, Data)
  { col: 'G', px: 26 },   // 119 - (era a coluna D)
  { col: 'H', px: 61 },   // 180 - fim do valor da Referência
  { col: 'I', px: 47 },   // 227 - fim do rótulo "numeração SIGA" / do 1º bloco
  { col: 'J', px: 23 },   // 250 - início do 2º bloco de assinatura
  { col: 'K', px: 12 },   // 262 - limite DOCUMENTO|BENEFICIÁRIO da tabela
  { col: 'L', px: 38 },   // 300 - fim dos valores da coluna 1 (origem)
  { col: 'M', px: 87 },   // 387 - FIM DOS RÓTULOS da coluna 2 (destino)
  { col: 'N', px: 9 },    // 396 - início dos valores da coluna 2
  { col: 'O', px: 26 },   // 422 - fim do rótulo "Conta:" do destino / do 2º bloco
  { col: 'P', px: 38 },   // 460 - fim do valor do Valor (38 px: R$ 999.999,99 não cabia em 34)
  { col: 'Q', px: 9 },    // 469 - início do extenso / do 3º bloco de assinatura
  { col: 'R', px: 38 },   // 507 - fim do rótulo "Nome:"
  { col: 'S', px: 9 },    // 516 - limite BENEFICIÁRIO|VALOR da tabela
  { col: 'T', px: 47 },   // 563 - fim do rótulo "Cargo/Ministério:"
  { col: 'U', px: 109 },  // 672 - fim dos blocos de assinatura
  { col: 'V', px: 22 }    // 694 - fim da folha
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
  { id: 'IDENT_2B', px: 16, fonte: 6 },// 2ª linha do extenso (ver desenharIdentificacao_)
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

/**
 * Tabela do lote: 32 lançamentos cabem em uma folha. Eram 33 até o extenso
 * ganhar a segunda linha — os 16 px vieram daqui. Passar disso quebra a
 * página, e `aplicarModo_` avisa quando isso acontece.
 */
var MAX_LINHAS_LOTE = 32;
var ALTURA_LINHA_LOTE = 15;

var COLUNAS_LOTE = [
  { rotulo: 'DATA', ini: 'B', fim: 'F', alinhamento: 'center', formato: 'dd/MM/yyyy' },
  { rotulo: 'DOCUMENTO / CARTÃO', ini: 'G', fim: 'K', alinhamento: 'left' },
  { rotulo: 'BENEFICIÁRIO / FINALIDADE', ini: 'L', fim: 'S', alinhamento: 'left' },
  { rotulo: 'VALOR', ini: 'T', fim: 'V', alinhamento: 'right', formato: 'R$ #,##0.00' }
];

/** Os três blocos de assinatura, em colunas. */
var BLOCOS_ASSINATURA = ['C:I', 'K:O', 'R:U'];

/** Dados de exemplo — os mesmos do comprovante real do SIGA. */
var EXEMPLO = {
  referencia: 'CMP-26/001',
  numeracaoSiga: '656',
  status: 'PAGO',
  data: new Date(2026, 8, 6),                  // 06/09/2026
  valor: 1800,
  extenso: '(UM MIL E OITOCENTOS REAIS)',
  tipo: 'OUTRAS REMESSAS',
  observacao: 'SUPRI CONTA BANCO SÃO GARIBEL PAGCORP',
  origem: 'PIA - COXIM',
  contaOrigem: 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE',
  cnpjOrigem: '03.673.233/0001-43',
  destino: 'PIA - SÃO GABRIEL',
  contaDestino: 'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE',
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
    .addItem('Preencher comprovante (formulário)', 'abrirFormularioCmi')
    .addSeparator()
    .addItem('Gerar PDF do comprovante', 'gerarPdfDoComprovante')
    .addItem('Conferir o layout antes de gerar', 'conferirLayoutParaPdf')
    .addSeparator()
    .addItem('Recriar layout do Comprovante', 'criarLayoutComprovante')
    .addSeparator()
    .addItem('Ver como lançamento único', 'verLancamentoUnico')
    .addItem('Ver como lançamento em lote (5 linhas)', 'verLancamentoEmLote')
    .addSeparator()
    .addItem('Criar / recriar a aba Cadastros', 'criarAbaCadastros')
    .addItem('Conferir cadastros', 'conferirCadastros')
    .addItem('Cadastrar abreviatura de banco', 'cadastrarAbreviaturaDeBanco')
    .addItem('Importar dados para os Cadastros', 'abrirImportacaoDeDados')
    .addSeparator()
    .addItem('Aplicar listas suspensas no Comprovante', 'aplicarValidacoes')
    .addItem('Sugerir próxima referência', 'sugerirProximaReferencia')
    .addItem('Recalcular o comprovante', 'recalcularComprovante')
    .addItem('Proteger os campos calculados', 'protegerCamposCalculados')
    .addItem('Testar o valor por extenso', 'testarValorPorExtenso')
    .addToUi();
}

/** Item de menu: repõe o aviso nos campos que o sistema calcula sozinho. */
function protegerCamposCalculados() {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA);
  if (!sh) throw new Error('A aba "' + ABA + '" ainda não existe.');
  protegerCalculados_(sh);
  SpreadsheetApp.getActive().toast(
    'Extenso, título, CNPJs e total do lote agora avisam antes de serem editados à mão.',
    'Tesouraria CMI', 6);
}

function verLancamentoUnico() {
  aplicarModo_(SpreadsheetApp.getActive().getSheetByName(ABA),
    { lancamentos: 0, mostrarContas: true });
}

function verLancamentoEmLote() {
  aplicarModo_(SpreadsheetApp.getActive().getSheetByName(ABA),
    { lancamentos: 5, mostrarContas: true });
}

/** Item de menu: mede a grade na planilha de verdade, linha por linha. */
function conferirLayoutNaPlanilha() {
  conferirLayoutParaPdf();
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
  protegerCalculados_(sh);

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
  var soma = 0;
  COLUNAS.forEach(function (c) { soma += c.px; });
  if (soma !== LARGURA_UTIL_PX) {
    throw new Error('As colunas somam ' + soma + ' px e precisam somar ' +
      LARGURA_UTIL_PX + '. Ao alargar uma coluna, estreite outra na mesma medida.');
  }

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
  campo_(sh, faixa_('J:Q', 'CAB_1'), CABECALHO.entidade,
    { tam: TAM.entidade, negrito: true, h: 'center' });
  campo_(sh, faixa_('R:V', 'CAB_1'), CABECALHO.folha, { h: 'right' });

  campo_(sh, faixa_('B:I', 'CAB_2'), CABECALHO.endereco, { h: 'left' });
  campo_(sh, faixa_('J:Q', 'CAB_2'), CABECALHO.cidade, { h: 'center' });
  campo_(sh, faixa_('R:V', 'CAB_2'), CABECALHO.cnpj, { h: 'right' });

  // As duas réguas que emolduram o título são espessas, na mesma espessura.
  // O SIGA usa 2,0 pt; a mais próxima que o Sheets oferece é 2,25 pt.
  borda_(sh, faixa_('B:V', 'ESP_1'), { baixo: true, estilo: 'GROSSA' });
  campo_(sh, faixa_('B:V', 'TITULO'),
    tituloDoComprovante_(EXEMPLO.origem, EXEMPLO.destino),
    { tam: TAM.titulo, negrito: true, h: 'center' });
  borda_(sh, faixa_('B:V', 'TITULO'), { baixo: true, estilo: 'GROSSA' });
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
  rotulo_(sh, faixa_('B:F', 'IDENT_1'), 'Referência:');
  campo_(sh, faixa_('G:H', 'IDENT_1'), val_(EXEMPLO.referencia), { negrito: true });

  rotulo_(sh, faixa_('I:J', 'IDENT_1'), 'numeração SIGA:');
  campo_(sh, faixa_('K:L', 'IDENT_1'), val_(EXEMPLO.numeracaoSiga), { negrito: true });

  // O Status vai de O até S: em O:P, "EFETIVADA" e "TRANSFERÊNCIA" saíam
  // cortados na planilha. À direita não há nada nesta linha, então a folga é
  // de graça. Alinhado à esquerda, encostado no rótulo.
  rotulo_(sh, faixa_('M:M', 'IDENT_1'), 'Status:');
  campo_(sh, faixa_('O:S', 'IDENT_1'), val_(EXEMPLO.status), { negrito: true, h: 'left' });

  rotulo_(sh, faixa_('B:F', 'IDENT_2'), 'Data Emissão:');
  campo_(sh, faixa_('G:L', 'IDENT_2'), val_(EXEMPLO.data),
    { negrito: true, formato: 'dd/MM/yyyy' });

  // O rótulo vira "Valor Total:" quando o comprovante é de lote (aplicarModo_).
  rotulo_(sh, faixa_('M:M', 'IDENT_2'), 'Valor:');
  campo_(sh, faixa_('O:P', 'IDENT_2'), val_(EXEMPLO.valor),
    { negrito: true, formato: 'R$ #,##0.00' });

  // O extenso ocupa DUAS linhas e quebra o texto. Em uma linha só, valores
  // altos saíam cortados: 99.999,99 vira "(NOVENTA E NOVE MIL E NOVECENTOS E
  // NOVENTA E NOVE REAIS E NOVENTA E NOVE CENTAVOS)" — mais que o dobro do
  // espaço disponível. Os 16 px da segunda linha vieram da tabela do lote,
  // que passou de 33 para 32 lançamentos; a folha não mudou de tamanho.
  campo_(sh, faixaMulti_('R:V', 'IDENT_2', 'IDENT_2B'), val_(EXEMPLO.extenso),
    { negrito: true, quebra: true, v: 'top' });

  rotulo_(sh, faixa_('B:F', 'TIPO'), 'Tipo Transferência:');
  campo_(sh, faixa_('G:V', 'TIPO'), val_(EXEMPLO.tipo),
    { tam: TAM.destaque, negrito: true });

  rotulo_(sh, faixa_('B:F', 'OBS'), 'Observação:');
  campo_(sh, faixa_('G:V', 'OBS'), val_(EXEMPLO.observacao), { negrito: true });

  borda_(sh, faixa_('B:V', 'SEP_1'), { baixo: true });
}

/**
 * O bloco da ESQUERDA (origem) tem os rótulos encostados no valor: "Origem:"
 * e "CNPJ:" terminam na coluna C, "Conta:" na D — recuado à direita, como no
 * SIGA. É o que libera espaço para o campo Conta, que vai daí até a coluna M —
 * a linha da conta é a mais comprida do documento e não tem nada à direita
 * dela, então avança sobre a faixa dos rótulos do destino sem atrapalhar.
 * O bloco da DIREITA (destino) continua como no layout aprovado: ele já
 * tinha espaço de sobra.
 */
function desenharOrigemDestino_(sh) {
  rotulo_(sh, faixa_('B:C', 'ORIGEM_DESTINO'), 'Origem:');
  campo_(sh, faixa_('D:L', 'ORIGEM_DESTINO'), val_(EXEMPLO.origem), { negrito: true });
  rotulo_(sh, faixa_('M:M', 'ORIGEM_DESTINO'), 'Destino:');
  campo_(sh, faixa_('O:V', 'ORIGEM_DESTINO'), val_(EXEMPLO.destino), { negrito: true });

  rotulo_(sh, faixa_('B:D', 'CONTAS'), 'Conta:');
  campo_(sh, faixa_('E:M', 'CONTAS'), val_(EXEMPLO.contaOrigem), {});
  rotulo_(sh, faixa_('O:O', 'CONTAS'), 'Conta:');
  campo_(sh, faixa_('P:V', 'CONTAS'), val_(EXEMPLO.contaDestino), {});

  rotulo_(sh, faixa_('B:C', 'CNPJ'), 'CNPJ:');
  campo_(sh, faixa_('D:L', 'CNPJ'), val_(EXEMPLO.cnpjOrigem), { negrito: true });
  rotulo_(sh, faixa_('M:M', 'CNPJ'), 'CNPJ:');
  campo_(sh, faixa_('O:V', 'CNPJ'), val_(EXEMPLO.cnpjDestino), { negrito: true });

  borda_(sh, faixa_('B:V', 'SEP_2'), { baixo: true });
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
  var area = 'B' + lin_('TAB_CAB') + ':V' + lin_('TAB_' + MAX_LINHAS_LOTE);
  sh.getRange(area).setBorder(null, null, true, null, null, true,
    '#000000', SpreadsheetApp.BorderStyle.SOLID);

  campo_(sh, faixa_('B:S', 'TAB_TOTAL'), 'TOTAL', { negrito: true, h: 'right' });
  campo_(sh, faixa_('T:V', 'TAB_TOTAL'), '',
    { negrito: true, h: 'right', formato: 'R$ #,##0.00' });
  borda_(sh, faixa_('T:V', 'TAB_TOTAL'), { topo: true, baixo: true });
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
    { bloco: 'C:I', nome: 'NOME_1', cargo: 'CARGO_1' },
    { bloco: 'K:O', nome: 'NOME_1', cargo: 'CARGO_1' },
    { bloco: 'R:U', nome: 'NOME_1', cargo: 'CARGO_1' },
    { bloco: 'C:I', nome: 'NOME_2', cargo: 'CARGO_2' },
    { bloco: 'K:O', nome: 'NOME_2', cargo: 'CARGO_2' }
  ];
  posicoes.forEach(function (p, i) {
    var dados = PREENCHER_EXEMPLO ? EXEMPLO.assinantes[i] : ['', ''];
    campo_(sh, faixa_(p.bloco, p.nome), dados[0], { tam: TAM.destaque, h: 'center' });
    campo_(sh, faixa_(p.bloco, p.cargo), dados[1], { tam: TAM.destaque, h: 'center' });
  });

  // 6ª posição: sempre manual, para signatário fora do cadastro.
  campo_(sh, faixa_('R:R', 'NOME_2'), 'Nome:', { h: 'left' });
  campo_(sh, faixa_('S:U', 'NOME_2'), '', { h: 'left' });
  borda_(sh, faixa_('S:U', 'NOME_2'), { baixo: true });

  campo_(sh, faixa_('R:T', 'CARGO_2'), 'Cargo/Ministério:', { h: 'left' });
  campo_(sh, faixa_('U:U', 'CARGO_2'), '', { h: 'left' });
  borda_(sh, faixa_('U:U', 'CARGO_2'), { baixo: true });
}

/**
 * Rodapé: a identificação do formulário fica **em pé, na lateral esquerda**
 * (coluna A), e a nota das 3 assinaturas fica **abaixo** da régua do rodapé.
 */
function desenharRodape_(sh) {
  borda_(sh, faixa_('B:V', 'ESP_RODAPE'), { baixo: true });

  // Data e hora de emissão à esquerda e nota das 3 assinaturas à direita,
  // os dois abaixo da régua do rodapé — como o SIGA faz.
  campo_(sh, faixa_('B:K', 'NOTA'), '', { tam: TAM.nota, h: 'left' });
  campo_(sh, faixa_('L:V', 'NOTA'), CABECALHO.nota, { tam: TAM.nota, h: 'right' });
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
function carimbarEmissao_(sh, lote) {
  var fuso = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var agora = Utilities.formatDate(new Date(), fuso, 'dd/MM/yyyy HH:mm:ss');
  var texto = CABECALHO.emitidoEm + agora;
  if (lote) lote.valor(faixa_('B:K', 'NOTA'), texto);
  else sh.getRange(faixa_('B:K', 'NOTA')).setValue(texto);
}

// ===========================================================================
// 5b. PROTEÇÃO DOS CAMPOS CALCULADOS
// ===========================================================================

/**
 * Alguns campos do comprovante não são digitados: são CALCULADOS pelo sistema
 * (o valor por extenso, o título, os dois CNPJs e o total do lote). Mudar um
 * deles à mão é o jeito mais fácil de estragar o comprovante sem perceber —
 * principalmente o extenso, que é justamente o que a conferência confere
 * contra o número.
 *
 * A proteção aqui é do tipo AVISO, não trava: o Google pergunta "tem certeza
 * que quer editar?" e quem tiver um motivo segue em frente. É a mesma escolha
 * de sempre neste projeto — avisar, nunca bloquear —, e não atrapalha o
 * script, que continua escrevendo nesses campos normalmente.
 */
var MARCA_PROTECAO = 'CMI - campo calculado';

function protegerCalculados_(sh) {
  sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) {
    var d = p.getDescription() || '';
    if (d.indexOf(MARCA_PROTECAO) === 0) p.remove();
  });

  var alvos = [
    [faixaMulti_('R:V', 'IDENT_2', 'IDENT_2B'), 'valor por extenso'],
    [faixa_('B:V', 'TITULO'), 'título do comprovante'],
    [faixa_('D:L', 'CNPJ'), 'CNPJ de origem'],
    [faixa_('O:V', 'CNPJ'), 'CNPJ de destino'],
    [faixa_('T:V', 'TAB_TOTAL'), 'total do lote']
  ];
  alvos.forEach(function (a) {
    sh.getRange(a[0]).protect()
      .setDescription(MARCA_PROTECAO + ': ' + a[1])
      .setWarningOnly(true);
  });

  // O extenso ganha também a anotação no canto da célula, que fica visível
  // sem precisar tentar editar.
  sh.getRange(faixaMulti_('R:V', 'IDENT_2', 'IDENT_2B')).setNote(
    'CAMPO CALCULADO — NÃO DIGITE AQUI\n\n' +
    'O valor por extenso é escrito pelo sistema a partir do campo Valor. ' +
    'Se for alterado à mão, o comprovante fica com o número dizendo uma coisa ' +
    'e o extenso dizendo outra — que é exatamente o que a conferência procura.\n\n' +
    'Para mudar o extenso, mude o Valor. Para refazer, use ' +
    'Tesouraria CMI → Recalcular o comprovante.');
}

// ===========================================================================
// 6. MODOS DE EXIBIÇÃO (único x lote, contas visíveis ou não)
// ===========================================================================

/**
 * O que fica visível em cada modo — **calculado, não perguntado à planilha**.
 *
 * Antes, cada decisão de altura mandava um `isRowHiddenByUser` para o Google,
 * uma linha por vez: 59 idas e voltas pela internet só para somar a altura da
 * folha, e outras 32 para somar o lote. Como é o próprio código que acabou de
 * esconder e mostrar essas linhas, ele já sabe a resposta — perguntar de novo
 * era pagar a viagem para ouvir o que já estava na mão.
 *
 * Devolve `{ id da linha: true/false }` para todas as linhas do layout.
 */
function visibilidadeDoModo_(op) {
  op = op || {};
  var lancamentos = Math.max(0, Math.min(op.lancamentos || 0, MAX_LINHAS_LOTE));
  var mostrarContas = op.mostrarContas !== false;
  var emLote = lancamentos > 0;

  if (!LINHAS_EXPANDIDAS.length) montarLinhas_();
  var visivel = {};
  LINHAS_EXPANDIDAS.forEach(function (l) { visivel[l.id] = true; });

  visivel.CONTAS = mostrarContas;
  visivel.TAB_CAB = emLote;
  visivel.TAB_TOTAL = emLote;
  for (var i = 1; i <= MAX_LINHAS_LOTE; i++) {
    visivel['TAB_' + i] = emLote && i <= lancamentos;
  }
  return visivel;
}

/** A sobra da folha, a partir do modelo de visibilidade. Zero idas ao Google. */
function sobraDaFolha_(visivel) {
  if (!LINHAS_EXPANDIDAS.length) montarLinhas_();
  var usado = 0;
  LINHAS_EXPANDIDAS.forEach(function (l) {
    if (l.id === 'PREENCHIMENTO') return;
    if (visivel[l.id] !== false) usado += alturaDaLinha_(l);
  });
  return ALTURA_UTIL_PX - usado;
}

/**
 * Esconde e mostra linhas **em blocos**, e não uma a uma.
 *
 * As 32 linhas do lote são vizinhas: esconder da 6ª à 32ª é UM pedido ao
 * Google (`hideRows(inicio, quantas)`), não 27. Junto com o modelo acima, é o
 * que tira a maior parte da espera do botão.
 */
function aplicarVisibilidade_(sh, visivel, lote) {
  if (!LINHAS_EXPANDIDAS.length) montarLinhas_();
  var blocos = [], atual = null;
  LINHAS_EXPANDIDAS.forEach(function (l, i) {
    var mostra = visivel[l.id] !== false;
    if (atual && atual.mostra === mostra && atual.fim === i) { atual.fim = i + 1; return; }
    atual = { mostra: mostra, inicio: i, fim: i + 1 };
    blocos.push(atual);
  });
  blocos.forEach(function (b) {
    var quantas = b.fim - b.inicio;
    if (lote) { lote.linhas(b.inicio + 1, quantas, b.mostra); return; }
    if (b.mostra) sh.showRows(b.inicio + 1, quantas);
    else sh.hideRows(b.inicio + 1, quantas);
  });
}

/**
 * `op.lote` faz tudo isto entrar na fila de um pedido só, em vez de ir uma
 * operação por vez. Sem ele, o comportamento é exatamente o de antes.
 */
function aplicarModo_(sh, op) {
  op = op || {};
  var lote = op.lote || null;
  var lancamentos = Math.max(0, Math.min(op.lancamentos || 0, MAX_LINHAS_LOTE));
  var emLote = lancamentos > 0;

  var visivel = visibilidadeDoModo_(op);
  var sobra = sobraDaFolha_(visivel);
  visivel.PREENCHIMENTO = sobra > 2;

  aplicarVisibilidade_(sh, visivel, lote);
  if (visivel.PREENCHIMENTO) {
    if (lote) lote.altura(lin_('PREENCHIMENTO'), sobra);
    else sh.setRowHeight(lin_('PREENCHIMENTO'), sobra);
  }

  var rotulo = emLote ? 'Valor Total:' : 'Valor:';
  if (lote) lote.valor(faixa_('M:M', 'IDENT_2'), rotulo);
  else sh.getRange(faixa_('M:M', 'IDENT_2')).setValue(rotulo);
  carimbarEmissao_(sh, lote);

  if (sobra < 0) {
    SpreadsheetApp.getActive().toast(
      'O conteúdo passou ' + Math.abs(sobra) + ' px da folha: o PDF vai sair em DUAS páginas. ' +
      'Reduza o número de lançamentos do lote.', 'Tesouraria CMI', 10);
  }
  ULTIMO_MODO = { lancamentos: lancamentos, visivel: visivel };
  if (!lote) SpreadsheetApp.flush();
}

/**
 * O último modo aplicado nesta execução. Serve para quem precisa saber o que
 * está visível sem perguntar à planilha (a soma do lote e a conferência da
 * folha antes do PDF).
 */
var ULTIMO_MODO = null;

/** Sobra da folha. Usa o modelo quando existe; senão pergunta à planilha. */
function alturaDoPreenchimento_(sh) {
  if (ULTIMO_MODO) return sobraDaFolha_(ULTIMO_MODO.visivel);
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

/** Como faixa_, mas para um campo que ocupa mais de uma linha. */
function faixaMulti_(colunas, idPrimeira, idUltima) {
  var partes = colunas.split(':');
  return partes[0] + lin_(idPrimeira) + ':' + partes[1] + lin_(idUltima);
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
   .setVerticalAlignment(op.v || 'middle')
   .setWrapStrategy(op.quebra ? SpreadsheetApp.WrapStrategy.WRAP
                              : SpreadsheetApp.WrapStrategy.CLIP);
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
