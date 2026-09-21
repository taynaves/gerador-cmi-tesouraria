/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * ETAPA 5 (primeira parte): gerar o PDF sem depender de Arquivo → Imprimir.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * Os ajustes de impressão do Google Sheets — margens, orientação, escala,
 * linhas de grade — **não ficam guardados na planilha**. Eles ficam no
 * navegador de cada pessoa, e o Google os redefine sozinho de tempos em
 * tempos. Não existe nenhum comando do Apps Script que trave isso: a caixa
 * de impressão simplesmente não é programável.
 *
 * Por isso o caminho é outro: **não usar mais Arquivo → Imprimir**. Este
 * arquivo pede o PDF direto ao Google, mandando cada ajuste escrito no
 * endereço do pedido. Margem, orientação e escala passam a viver no código,
 * onde ninguém esbarra neles, e o PDF sai igual em qualquer computador, de
 * qualquer diácono, em qualquer dia.
 *
 * (Este endereço de exportação é o mesmo que o próprio Sheets usa por trás
 * do botão "Fazer download → PDF". Ele não é uma API publicada pelo Google,
 * então um dia pode mudar; se mudar, é aqui que se conserta, num lugar só.)
 *
 * O QUE AINDA NÃO ESTÁ AQUI (vem no resto da Etapa 5):
 *   - gerar os 2 ou 3 PDFs da movimentação, um por etapa, com o Status certo;
 *   - trocar o cabeçalho no PDF de Recebimento;
 *   - consumir a Referência e gravar no Histórico;
 *   - salvar o arquivo .md de recuperação ao lado do PDF.
 * Este arquivo gera **um** PDF do que está na aba agora — que é o que
 * resolve o problema do "desformatou de novo".
 */

// ===========================================================================
// 1. OS AJUSTES DE IMPRESSÃO — AGORA NO CÓDIGO
// ===========================================================================

/**
 * São os mesmos ajustes do PDF aprovado (docs/referencia_layout_aprovado.pdf).
 * As margens estão em CENTÍMETROS, como aparecem na tela do Sheets; o código
 * converte para polegadas, que é o que o Google espera no pedido.
 *
 * `escala: 1` é "Normal (100%)". Nunca trocar para 2, 3 ou 4 ("ajustar à
 * largura/altura/página"): eles mudam o tamanho da letra e acabam com a
 * sobreposição com o comprovante do SIGA.
 */
var EXPORTACAO_PDF = {
  papel: 'A4',
  retrato: true,
  escala: 1,
  margens_cm: { topo: 0.97, base: 0.97, esquerda: 1.02, direita: 0.89 },
  alinhamento: { horizontal: 'CENTER', vertical: 'TOP' },
  linhasDeGrade: false
};

/** Monta o endereço do pedido, com todos os ajustes escritos nele. */
function urlDeExportacao_(sh) {
  var CM_POR_POLEGADA = 2.54;
  var m = EXPORTACAO_PDF.margens_cm;
  var pol = function (cm) { return (cm / CM_POR_POLEGADA).toFixed(4); };

  var parametros = [
    'format=pdf',
    'gid=' + sh.getSheetId(),
    'size=' + EXPORTACAO_PDF.papel,
    'portrait=' + (EXPORTACAO_PDF.retrato ? 'true' : 'false'),
    'fitw=false',                       // nunca "ajustar à largura"
    'scale=' + EXPORTACAO_PDF.escala,   // 1 = Normal (100%)
    'gridlines=' + (EXPORTACAO_PDF.linhasDeGrade ? 'true' : 'false'),
    'printtitle=false',                 // sem o nome da planilha no topo
    'sheetnames=false',                 // sem o nome da aba
    'pagenum=UNDEFINED',                // sem número de página
    'fzr=false',                        // sem repetir linhas congeladas
    'horizontal_alignment=' + EXPORTACAO_PDF.alinhamento.horizontal,
    'vertical_alignment=' + EXPORTACAO_PDF.alinhamento.vertical,
    'top_margin=' + pol(m.topo),
    'bottom_margin=' + pol(m.base),
    'left_margin=' + pol(m.esquerda),
    'right_margin=' + pol(m.direita)
  ];

  return 'https://docs.google.com/spreadsheets/d/' +
         SpreadsheetApp.getActive().getId() + '/export?' + parametros.join('&');
}

// ===========================================================================
// 2. CONFERÊNCIA ANTES DE GERAR
// ===========================================================================

/**
 * Confere as duas medidas que fazem o documento virar duas folhas. São as
 * duas que já quebraram o layout na prática:
 *   - largura das colunas ≠ 694 px  -> vaza de lado;
 *   - linhas visíveis acima de 1045 px -> vaza para baixo.
 * Devolve uma lista de problemas em português — vazia quando está tudo bem.
 */
function conferirGrade_(sh) {
  var problemas = [];

  if (sh.getMaxColumns() !== COLUNAS.length) {
    problemas.push('A aba tem ' + sh.getMaxColumns() + ' colunas, e o layout ' +
      'tem ' + COLUNAS.length + '. Alguém acrescentou ou apagou coluna.');
  }

  var largura = 0;
  for (var c = 1; c <= sh.getMaxColumns(); c++) largura += sh.getColumnWidth(c);
  if (largura !== LARGURA_UTIL_PX) {
    problemas.push('A largura das colunas soma ' + largura + ' px, e precisa somar ' +
      LARGURA_UTIL_PX + '. Passando disso o PDF vaza DE LADO e sai em duas folhas.');
  }

  var altura = 0;
  for (var r = 1; r <= sh.getMaxRows(); r++) {
    if (!sh.isRowHiddenByUser(r)) altura += sh.getRowHeight(r);
  }
  if (altura > ALTURA_UTIL_PX) {
    problemas.push('As linhas visíveis somam ' + altura + ' px, acima dos ' +
      ALTURA_UTIL_PX + ' que cabem na folha. O PDF vai sair em duas páginas.');
  }

  return problemas;
}

/** Item de menu: só confere e conta o resultado, sem gerar nada. */
function conferirLayoutParaPdf() {
  var sh = abaDoComprovante_();
  var problemas = conferirGrade_(sh);
  var ui = SpreadsheetApp.getUi();

  if (!problemas.length) {
    ui.alert('Layout conferido',
      'Está tudo na medida: ' + LARGURA_UTIL_PX + ' px de largura e as linhas ' +
      'visíveis dentro dos ' + ALTURA_UTIL_PX + ' px da folha.\n\n' +
      'O PDF vai sair em uma página só, com as margens e a orientação certas — ' +
      'elas estão no código, não nos ajustes do seu navegador.',
      ui.ButtonSet.OK);
  } else {
    ui.alert('O layout saiu da medida', problemas.join('\n\n') +
      '\n\nO conserto normal é rodar "Recriar layout do Comprovante".',
      ui.ButtonSet.OK);
  }
}

// ===========================================================================
// 3. GERAR O PDF
// ===========================================================================

/**
 * Gera o PDF da aba Comprovante como ela está agora e salva no Drive, na
 * mesma pasta da planilha (ou na pasta indicada em PASTA_DRIVE_PADRAO, no
 * bloco CONTROLE dos Cadastros).
 */
function gerarPdfDoComprovante() {
  var ui = SpreadsheetApp.getUi();
  var sh = abaDoComprovante_();

  var problemas = conferirGrade_(sh);
  if (problemas.length) {
    var resposta = ui.alert('O layout saiu da medida',
      problemas.join('\n\n') + '\n\nGerar o PDF assim mesmo?',
      ui.ButtonSet.YES_NO);
    if (resposta !== ui.Button.YES) return;
  }

  // Carimba a hora de emissão: é ela que vale no documento.
  carimbarEmissao_(sh);
  SpreadsheetApp.flush();

  var pdf = UrlFetchApp.fetch(urlDeExportacao_(sh), {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });

  if (pdf.getResponseCode() !== 200) {
    throw new Error('O Google recusou o pedido do PDF (código ' +
      pdf.getResponseCode() + '). Tente de novo; se insistir, avise — ' +
      'o endereço de exportação pode ter mudado.');
  }

  var nome = nomeDoArquivoPdf_(sh);
  var arquivo = pastaDeDestino_().createFile(pdf.getBlob().setName(nome));

  ui.alert('PDF gerado',
    nome + '\n\nSalvo em: ' + pastaDeDestino_().getName() +
    '\n\nAbrir: ' + arquivo.getUrl() +
    '\n\nAs margens, a orientação e a escala vieram do código — não dependem ' +
    'mais dos ajustes de impressão do seu navegador.',
    ui.ButtonSet.OK);
}

/**
 * Nome do arquivo: CMI-[referência]-[ETAPA] - [AA]_[MM]_[DD].pdf
 * A barra da referência (CMP-26/001) vira hífen, porque barra em nome de
 * arquivo confunde o Drive.
 */
function nomeDoArquivoPdf_(sh) {
  var referencia = String(sh.getRange(faixa_('G:H', 'IDENT_1')).getValue() || 'SEM-REFERENCIA');
  var etapa = String(sh.getRange(faixa_('O:P', 'IDENT_1')).getValue() || '').trim();
  var fuso = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var data = Utilities.formatDate(new Date(), fuso, 'yy_MM_dd');

  var limpo = function (t) { return t.replace(/[\/\\:*?"<>|]/g, '-').trim(); };
  return 'CMI-' + limpo(referencia) + (etapa ? '-' + limpo(etapa) : '') +
         ' - ' + data + '.pdf';
}

/** Pasta do Drive onde o PDF é salvo. */
function pastaDeDestino_() {
  var indicada = String(lerControle_('PASTA_DRIVE_PADRAO') || '').trim();
  if (indicada) {
    var id = idDaPasta_(indicada);
    if (id) {
      try { return DriveApp.getFolderById(id); } catch (e) { /* cai no padrão */ }
    }
  }
  // Padrão: a mesma pasta em que a planilha está.
  var pais = DriveApp.getFileById(SpreadsheetApp.getActive().getId()).getParents();
  return pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
}

/** Aceita tanto o ID da pasta quanto o link inteiro copiado do Drive. */
function idDaPasta_(texto) {
  var achado = texto.match(/[-\w]{25,}/);
  return achado ? achado[0] : '';
}

function abaDoComprovante_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA);
  if (!sh) throw new Error('A aba "' + ABA + '" ainda não existe. Rode ' +
    '"Recriar layout do Comprovante" antes.');
  return sh;
}
