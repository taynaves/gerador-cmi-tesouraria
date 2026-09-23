/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * ETAPA 5: gerar os PDFs sem depender de Arquivo → Imprimir — os 2 ou 3 de
 * uma movimentação de uma vez, com o arquivo de recuperação e o Histórico.
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
 * O QUE ESTE ARQUIVO FAZ, NA ORDEM EM QUE ACONTECE (seção 4):
 *   - gera os 2 ou 3 PDFs da movimentação, um por etapa, cada um com o Status
 *     certo e com os assinantes daquela etapa;
 *   - no de RECEBIMENTO, troca o cabeçalho para a ADM de destino — quem
 *     escolhe o lado é `ladoDoCabecalho_`, no `04_Formulario.gs`;
 *   - consome a Referência UMA vez, por mais PDFs que saiam;
 *   - salva ao lado dos PDFs o arquivo .md de recuperação (seção 6);
 *   - grava uma linha por PDF na aba Histórico (seção 7).
 *
 * O menu "Gerar PDF do comprovante" continua gerando UM PDF do que está na
 * aba, sem Histórico e sem consumir número: ele não sabe qual movimentação
 * originou a folha. O caminho de todo dia é o formulário.
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
    // SEM AS ANOTAÇÕES DAS CÉLULAS. Este vinha ligado por padrão, e foi o
    // que botou um "[1]" ao lado do extenso e uma segunda folha inteira só
    // com o texto da anotação. As anotações existem para quem edita a
    // planilha; no comprovante não entram.
    'printnotes=false',
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
/**
 * Conferência rápida, antes de cada PDF. **Duas idas ao Google, não 140.**
 *
 * A conferência completa mede coluna por coluna e linha por linha na planilha:
 * 22 larguras + 59 alturas + 59 perguntas de visibilidade, cada uma uma
 * viagem pela internet. Era metade da espera do botão de gerar.
 *
 * Esta versão pergunta só as duas coisas que mudam quando alguém mexe na aba
 * por engano — quantas colunas e quantas linhas ela tem — e calcula o resto
 * pelo modelo do layout, que é de onde a aba foi desenhada. Pega o acidente
 * comum (inserir ou apagar linha/coluna) de graça.
 *
 * A medição de verdade continua existindo, em `conferirGradeMedindo_`, no
 * menu **Conferir o layout antes de gerar**: ali a espera é esperada, porque
 * foi a pessoa que pediu.
 */
function conferirGrade_(sh) {
  var problemas = [];
  if (!LINHAS_EXPANDIDAS.length) montarLinhas_();

  if (sh.getMaxColumns() !== COLUNAS.length) {
    problemas.push('A aba tem ' + sh.getMaxColumns() + ' colunas, e o layout ' +
      'tem ' + COLUNAS.length + '. Alguém acrescentou ou apagou coluna.');
  }
  if (sh.getMaxRows() !== LINHAS_EXPANDIDAS.length) {
    problemas.push('A aba tem ' + sh.getMaxRows() + ' linhas, e o layout tem ' +
      LINHAS_EXPANDIDAS.length + '. Alguém acrescentou ou apagou linha.');
  }

  var sobra = alturaDoPreenchimento_(sh);
  if (sobra < 0) {
    problemas.push('O conteúdo visível passa ' + Math.abs(sobra) + ' px da folha. ' +
      'O PDF vai sair em duas páginas. Reduza o número de lançamentos do lote.');
  }
  return problemas;
}

/** A conferência completa, medindo na planilha. Lenta de propósito. */
function conferirGradeMedindo_(sh) {
  var problemas = conferirGrade_(sh);

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
  var problemas = conferirGradeMedindo_(sh);
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

  var nome = nomeDoArquivoPdf_(sh);
  var pasta = pastaDeDestino_();
  var arquivo = pasta.createFile(pdfDaAba_(sh).setName(nome));

  mostrarJanelaDoPdf_(nome, pasta.getName(), arquivo.getUrl(), pasta.getUrl());
}

/**
 * Pede o PDF da aba ao Google — e pede de novo quando ele pede calma.
 *
 * POR QUE TENTAR DE NOVO: agora saem 2 ou 3 PDFs seguidos, e o endereço de
 * exportação do Google responde "muitos pedidos" (código 429) quando eles vêm
 * em sequência rápida. Não é defeito de ninguém — é o Google limitando o
 * ritmo. Esperar dois segundos e pedir de novo resolve; desistir no primeiro
 * 429 faria sair só o PDF da Aprovação, com os outros dois perdidos por uma
 * pressa que não era de ninguém.
 *
 * Só se tenta de novo o que pode dar certo esperando: 429 e os erros 5xx
 * (o Google ocupado). Um 403 ou 404 não melhora com espera, e repetir só
 * atrasaria a mensagem.
 */
var TENTATIVAS_DO_PDF = 3;

function pdfDaAba_(sh) {
  var url = urlDeExportacao_(sh);
  var codigo = 0;
  for (var tentativa = 1; tentativa <= TENTATIVAS_DO_PDF; tentativa++) {
    var resposta = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    codigo = resposta.getResponseCode();
    if (codigo === 200) return resposta.getBlob();
    var vaiMelhorar = codigo === 429 || codigo >= 500;
    if (!vaiMelhorar || tentativa === TENTATIVAS_DO_PDF) break;
    Utilities.sleep(2000 * tentativa);
  }
  throw new Error('O Google recusou o pedido do PDF (código ' + codigo + ')' +
    (codigo === 429 || codigo >= 500
      ? ', mesmo depois de ' + TENTATIVAS_DO_PDF + ' tentativas. Espere um minuto e tente de novo.'
      : '. Tente de novo; se insistir, avise — o endereço de exportação pode ter mudado.'));
}

/**
 * A janela que aparece quando o PDF fica pronto, com botões de verdade.
 *
 * Numa janela comum (`ui.alert`) o endereço sai como texto morto: dá para ler
 * e não dá para clicar. Por isso esta é uma janela de página (`HtmlService`),
 * onde "Abrir o PDF" e "Abrir a pasta" são links de verdade e "Fechar" fecha.
 *
 * Duas regras do Apps Script respeitadas aqui, ambas aprendidas na prática:
 * o Google **bloqueia `alert()` e `confirm()`** dentro destas janelas, e um
 * erro de sintaxe no JavaScript da página faz a janela abrir com **todos os
 * botões mortos e nenhuma mensagem de erro**. Por isso abrir é um link comum
 * (`<a target="_blank">`), sem JavaScript nenhum, e o único JavaScript da
 * página é a linha que fecha a janela.
 */
function mostrarJanelaDoPdf_(nome, nomeDaPasta, urlDoArquivo, urlDaPasta) {
  var escapar = function (t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var html = [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<style>',
    ' body{font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#202124;',
    '      margin:0;padding:18px 20px;}',
    ' .ok{color:#188038;font-weight:bold;margin:0 0 10px;}',
    ' .nome{background:#f1f3f4;border-radius:4px;padding:8px 10px;',
    '       word-break:break-all;margin-bottom:10px;}',
    ' .onde{color:#5f6368;margin-bottom:16px;}',
    ' .botoes{display:flex;gap:8px;flex-wrap:wrap;}',
    ' a.b,button.b{display:inline-block;padding:9px 14px;border-radius:4px;',
    '   font-size:13px;font-family:inherit;text-decoration:none;cursor:pointer;',
    '   border:1px solid #dadce0;background:#fff;color:#1a73e8;}',
    ' a.b.forte{background:#1a73e8;border-color:#1a73e8;color:#fff;}',
    ' button.b{color:#5f6368;}',
    '</style></head><body>',
    '<p class="ok">PDF gerado.</p>',
    '<div class="nome">' + escapar(nome) + '</div>',
    '<p class="onde">Salvo na pasta <b>' + escapar(nomeDaPasta) + '</b>.</p>',
    '<div class="botoes">',
    '  <a class="b forte" href="' + escapar(urlDoArquivo) + '" target="_blank" rel="noopener">Abrir o PDF</a>',
    '  <a class="b" href="' + escapar(urlDaPasta) + '" target="_blank" rel="noopener">Abrir a pasta</a>',
    '  <button class="b" onclick="google.script.host.close()">Fechar</button>',
    '</div>',
    '</body></html>'
  ].join('\n');

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(430).setHeight(240),
    'Comprovante em PDF');
}

/**
 * Nome do arquivo: CMI-[referência]-[ETAPA] - [AA]_[MM]_[DD].pdf
 * A barra da referência (CMP-26/001) vira hífen, porque barra em nome de
 * arquivo confunde o Drive.
 */
function nomeDoArquivoPdf_(sh) {
  var referencia = String(sh.getRange(faixa_('G:H', 'IDENT_1')).getValue() || 'SEM-REFERENCIA');
  var etapa = String(sh.getRange(faixa_('O:S', 'IDENT_1')).getValue() || '').trim();
  var fuso = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  var data = Utilities.formatDate(new Date(), fuso, 'yy_MM_dd');

  return 'CMI-' + nomeLimpo_(referencia) + (etapa ? '-' + nomeLimpo_(etapa) : '') +
         ' - ' + data + '.pdf';
}

/** Tira de um texto o que confunde o Drive num nome de arquivo (a barra, sobretudo). */
function nomeLimpo_(texto) {
  return String(texto == null ? '' : texto).replace(/[\/\\:*?"<>|]/g, '-').trim();
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

// ===========================================================================
// 4. A MOVIMENTAÇÃO INTEIRA: OS 2 OU 3 PDFs DE UMA VEZ
// ===========================================================================

/**
 * Emite os PDFs de uma movimentação — um por etapa — e devolve o resumo para
 * a tela mostrar.
 *
 * A REGRA (CLAUDE.md, "a lógica de etapas"): mesma PIA gera 2 documentos,
 * APROVADA → EFETIVADA; PIAs diferentes geram 3, APROVADA → PAGA → RECEBIDA.
 * Número, data, valor, contas, tipo e observação são os mesmos em todos; muda
 * o Status, os assinantes (quando não são os mesmos) e, no Recebimento entre
 * ADMs diferentes, o cabeçalho.
 *
 * CADA ETAPA PASSA PELO PREENCHIMENTO INTEIRO, e isso é de propósito. Seria
 * mais rápido escrever só o Status e os assinantes entre um PDF e outro — e
 * seria exatamente o atalho que este projeto já tirou uma vez: confiar no que
 * "deve estar" na folha em vez de escrever o que tem de estar. O custo é
 * pequeno, porque `fecharEscritor_` grava só as células que mudaram: da
 * segunda etapa em diante, quase nada.
 *
 * AS ETAPAS SÃO CONTADAS AQUI, pelas contas, e não pelo que a tela mandou. A
 * tela conta do lado dela para mostrar; quem decide quantos documentos saem é
 * `etapasDaMovimentacao_`, a mesma regra de sempre.
 *
 * UMA ETAPA QUE FALHA NÃO DERRUBA AS OUTRAS. Se o Google recusar o PDF da
 * PAGA, a RECEBIDA ainda é tentada, e o que saiu fica na pasta, registrado.
 * Só quando NENHUM sai o erro sobe inteiro — aí não há nada a registrar.
 */
function emitirMovimentacao_(mov) {
  mov = mov || {};
  conferirRegraEntreContas_(mov);
  var sh = abaDoComprovante_();

  var todas = etapasPelasContas_(mov);
  var etapas = etapasAGerar_(mov, todas);
  var pasta = pastaDeDestino_();

  var feitos = [], falhas = [], resumo = null, problemas = null;
  etapas.forEach(function (etapa) {
    try {
      resumo = preencherComprovante(movDaEtapa_(mov, etapa));
      if (problemas === null) problemas = conferirGrade_(sh);

      carimbarEmissao_(sh);
      SpreadsheetApp.flush();
      /* O carimbo é LIDO de volta da folha, e não calculado de novo aqui: o
         Histórico tem de dizer a mesma hora que está impressa no PDF, e duas
         contas de "agora" podem cair em segundos diferentes. */
      var carimbo = String(sh.getRange(faixa_('B:K', 'NOTA')).getValue() || '');
      var nome = nomeDoArquivoPdf_(sh);
      var arquivo = pasta.createFile(pdfDaAba_(sh).setName(nome));

      var posicao = todas.indexOf(etapa);
      feitos.push({
        etapa: etapa,
        posicao: posicao >= 0 ? posicao + 1 : 1,
        de: todas.length || 1,
        nome: nome,
        urlArquivo: arquivo.getUrl(),
        emitidoEm: carimbo.replace(CABECALHO.emitidoEm, '').trim(),
        cabecalho: resumo.cabecalho || {},
        assinantes: assinantesDaEtapa_(mov, etapa)
      });
    } catch (e) {
      falhas.push({ etapa: etapa, mensagem: String(e && e.message ? e.message : e) });
    }
  });

  /* Guarda a movimentação COMO ELA VEIO — com "todas as etapas" — e não a
     cópia da última etapa. É ela que volta quando a janela reabre. */
  guardarMovimentacao_(mov);

  if (!feitos.length) {
    throw new Error(falhas.length ? falhas[0].mensagem : 'Nenhum PDF foi gerado.');
  }

  /* A Referência é consumida AQUI, e UMA vez: os 2 ou 3 PDFs são o mesmo
     comprovante e levam o mesmo número. Basta UM PDF ter saído para o número
     estar usado — ele está impresso num arquivo que existe na pasta. Segunda
     via não consome nada: reimprime um comprovante que já existe. */
  if (mov.referenciaOrigem !== 'segunda-via') {
    resumo.referenciaConsumida = consumirReferencia_(mov.referencia);
  }
  resumo.proximaReferencia = proximaReferencia_();

  /* O .md e o Histórico AVISAM, nunca derrubam: os PDFs já estão na pasta, e
     um erro aqui não pode fazer a pessoa achar que o comprovante não saiu. */
  var avisos = [];
  feitos.forEach(function (f) { if (f.cabecalho.aviso) avisos.push(f.cabecalho.aviso); });

  var recuperacao = null;
  try {
    recuperacao = salvarArquivoDeRecuperacao_(mov,
      textoDaRecuperacao_(mov, resumo, feitos), pasta);
  } catch (e) {
    avisos.push('O arquivo de recuperação (.md) não foi salvo: ' +
      (e && e.message ? e.message : e) + ' Os PDFs estão na pasta, e nada se perdeu.');
  }

  var noHistorico = 0;
  try {
    noHistorico = gravarNoHistorico_(linhasDoHistorico_(mov, resumo, feitos, recuperacao));
  } catch (e) {
    avisos.push('O Histórico não foi gravado: ' + (e && e.message ? e.message : e) +
      ' Os PDFs estão na pasta, e nada se perdeu.');
  }

  resumo.pdfs = feitos;
  resumo.falhas = falhas;
  resumo.problemas = problemas || [];
  resumo.pasta = { nome: pasta.getName(), url: pasta.getUrl() };
  resumo.recuperacao = recuperacao;
  resumo.linhasNoHistorico = noHistorico;
  resumo.avisos = avisos;

  /* O FORMATO ANTIGO, com um PDF só, continua indo junto. Se a tela colada
     for a de antes desta mudança, ela lê `pdf` e mostra o primeiro — em vez
     de estourar por não achar o que procura. Um arquivo atrasado piora a
     tela; não a derruba. */
  resumo.pdf = {
    nome: feitos[0].nome,
    pasta: pasta.getName(),
    urlArquivo: feitos[0].urlArquivo,
    urlPasta: pasta.getUrl(),
    problemas: resumo.problemas
  };
  return resumo;
}

/**
 * As etapas da movimentação, pelas contas do cadastro. Vazio quando falta uma
 * das contas — contar etapas com meio dado seria adivinhar.
 */
function etapasPelasContas_(mov) {
  var origem = pia_(piaDaConta_(mov.contaOrigem));
  var destino = pia_(piaDaConta_(mov.contaDestino));
  if (!origem || !destino) return [];
  return etapasDaMovimentacao_(origem, destino);
}

/**
 * Quais etapas saem neste clique: TODAS (o normal) ou só a escolhida.
 *
 * "Só uma" existe para refazer um documento sem refazer os outros — a
 * assinatura do Recebimento que mudou, o PDF da PAGA que o Google recusou. E
 * é também o que acontece quando a tela colada ainda é a de antes desta
 * mudança: ela não manda `todasAsEtapas`, e sai a etapa que ela pediu, como
 * sempre saiu.
 */
function etapasAGerar_(mov, todas) {
  var escolhida = String(mov.etapaAtual || mov.status || '').trim().toUpperCase() || 'APROVADA';
  if (mov.todasAsEtapas && todas.length) return todas.slice();
  return [escolhida];
}

/** A movimentação, com o Status e a etapa de UM dos documentos. */
function movDaEtapa_(mov, etapa) {
  var copia = JSON.parse(JSON.stringify(mov));
  copia.etapaAtual = etapa;
  copia.status = etapa;
  return copia;
}

// ===========================================================================
// 5. UMA CÓPIA DO COMPROVANTE EM PLANILHA (Google ou Excel)
// ===========================================================================

/**
 * Salva, na MESMA pasta do PDF, uma cópia do comprovante em planilha:
 * `'excel'` devolve um arquivo `.xlsx`; qualquer outra coisa devolve uma
 * planilha do Google.
 *
 * POR QUE NÃO É A PLANILHA INTEIRA. O endereço de exportação aceita
 * `format=xlsx` e seria uma linha só — mas ele exporta o ARQUIVO todo, com
 * Cadastros, Histórico e o que mais houver. O comprovante é UMA aba, e quem
 * pede uma cópia do comprovante não está pedindo o cadastro de contas da
 * tesouraria junto. Por isso a aba é copiada para uma planilha nova, e é ela
 * que vira o arquivo.
 *
 * E OS DOIS CAMINHOS TERMINAM EM LUGARES DIFERENTES — decisão dele, e é a
 * que faz sentido:
 *
 *   - **planilha do Google**: fica na PASTA DO DRIVE, junto dos PDFs, e não
 *     baixa nada;
 *   - **Excel (.xlsx)**: vai para o COMPUTADOR de quem clicou, e não fica no
 *     Drive.
 *
 * O `.xlsx` chegou a ser salvo na pasta e oferecido por um endereço de
 * download do Drive — e o botão não funcionava. Aquele endereço depende de
 * sessão, de permissão e de um redirecionamento do Google que muda de tempos
 * em tempos: é o caminho errado para entregar um arquivo que o script já tem
 * na mão. Agora os bytes voltam com a resposta (em base64) e o navegador os
 * salva direto. Nada fica para trás no Drive — nem o arquivo, nem a planilha
 * temporária.
 *
 * A CÓPIA NÃO QUEIMA A REFERÊNCIA. Quem consome o número é o PDF, que é o
 * documento que vai ao SIGA; esta cópia serve para editar, conferir ou
 * arquivar. Do contrário, salvar um Excel só para dar uma olhada gastaria o
 * número de um comprovante que nunca existiu.
 *
 * E ELA NÃO PASSA PELA CONFERÊNCIA DA GRADE, de propósito: aquelas duas
 * medidas (694 px de largura, 1045 px de altura) existem para o documento não
 * virar duas folhas. Planilha não tem folha.
 */
function salvarCopiaDoComprovante_(formato) {
  var comoExcel = String(formato || '').toLowerCase() === 'excel';
  var sh = abaDoComprovante_();

  // A hora de emissão é carimbada igual à do PDF: a cópia é do documento
  // como ele está agora, não de um rascunho sem hora.
  carimbarEmissao_(sh);
  SpreadsheetApp.flush();

  var nome = nomeDaCopia_(sh);

  /* A planilha nova nasce com uma aba vazia, e o NOME dela muda com o idioma
     da conta ("Página1", "Sheet1", "Hoja 1"). Por isso ela é guardada ANTES
     da cópia e apagada por referência: procurá-la pelo nome depois seria
     depender do idioma de quem está rodando. */
  var nova = SpreadsheetApp.create(nome);
  var vazia = nova.getSheets()[0];
  var copiada = sh.copyTo(nova);
  copiada.setName(ABA);
  nova.deleteSheet(vazia);
  SpreadsheetApp.flush();

  var arquivoDaCopia = DriveApp.getFileById(nova.getId());

  if (!comoExcel) {
    var pasta = pastaDeDestino_();
    arquivoDaCopia.moveTo(pasta);
    return {
      formato: 'google',
      nome: nome,
      pasta: pasta.getName(),
      urlArquivo: arquivoDaCopia.getUrl(),
      urlPasta: pasta.getUrl()
    };
  }

  var resposta = UrlFetchApp.fetch(
    'https://docs.google.com/spreadsheets/d/' + nova.getId() + '/export?format=xlsx',
    { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true });

  /* A PLANILHA TEMPORÁRIA SOME NOS DOIS CAMINHOS — inclusive quando o Google
     recusa o pedido. Sem esta linha, cada tentativa que falha deixaria um
     arquivo solto no Drive dele, com nome de comprovante. */
  if (resposta.getResponseCode() !== 200) {
    arquivoDaCopia.setTrashed(true);
    throw new Error('O Google recusou o pedido do arquivo do Excel (código ' +
      resposta.getResponseCode() + '). Tente de novo daqui a pouco.');
  }

  /* OS BYTES VOLTAM COM A RESPOSTA, e o arquivo não passa pelo Drive.
     `base64Encode` é o que permite atravessar a ponte entre o script e a
     página (ela só carrega texto); do outro lado a tela remonta o arquivo e
     manda o navegador salvar. */
  var emTexto = Utilities.base64Encode(resposta.getBlob().getBytes());
  arquivoDaCopia.setTrashed(true);

  return {
    formato: 'excel',
    nome: nome + '.xlsx',
    base64: emTexto
  };
}

/** O mesmo nome do PDF, sem a extensão: a regra do nome mora num lugar só. */
function nomeDaCopia_(sh) {
  return nomeDoArquivoPdf_(sh).replace(/\.pdf$/i, '');
}

// ===========================================================================
// 6. O ARQUIVO DE RECUPERAÇÃO (.md) — UM POR REFERÊNCIA
// ===========================================================================
//
// Ao lado dos PDFs fica um arquivo de texto com TUDO o que originou o
// comprovante: serve para refazer ou conferir sem redigitar nada.
//
// UM ARQUIVO POR REFERÊNCIA, E NÃO UM POR PDF. As 2 ou 3 etapas são o mesmo
// comprovante — mesmo número, mesmos dados —, e o nome do arquivo é a
// Referência, que é o que amarra o .md aos PDFs. Três arquivos com o mesmo
// nome na mesma pasta seriam três respostas para a mesma pergunta. O que
// muda de uma etapa para outra (Status, assinantes, cabeçalho) está dentro
// dele, numa tabela.
//
// E O QUE ACONTECE QUANDO O ARQUIVO JÁ EXISTE depende de por que o número se
// repetiu:
//   - CORREÇÃO: o comprovante saiu errado, então o arquivo é REESCRITO — a
//     recuperação tem de refazer o certo, não o errado;
//   - SEGUNDA VIA: o arquivo do original é MANTIDO. A via reimprime um
//     comprovante que já existe; se ela fosse preenchida diferente, reescrever
//     apagaria a única cópia dos dados do original. O Histórico registra a
//     via com o motivo, e isso basta;
//   - qualquer outro caso (histórico perdido, só uma etapa refeita): reescrito.

/** CMI-CMP-26-001.md — a mesma limpeza do nome do PDF. */
function nomeDoArquivoDeRecuperacao_(referencia) {
  return 'CMI-' + (nomeLimpo_(maiuscula_(referencia)) || 'SEM-REFERENCIA') + '.md';
}

/**
 * Grava o arquivo na pasta dos PDFs. Devolve `{ nome, url, acao }`, onde
 * `acao` é 'criado', 'reescrito' ou 'mantido' — a tela conta qual foi.
 */
function salvarArquivoDeRecuperacao_(mov, texto, pasta) {
  var nome = nomeDoArquivoDeRecuperacao_(mov.referencia);
  var achados = pasta.getFilesByName(nome);
  var existente = achados.hasNext() ? achados.next() : null;

  if (existente) {
    if (mov.referenciaOrigem === 'segunda-via') {
      return { nome: nome, url: existente.getUrl(), acao: 'mantido' };
    }
    existente.setContent(texto);
    return { nome: nome, url: existente.getUrl(), acao: 'reescrito' };
  }
  /* 'text/plain', e não 'text/markdown': o Drive aceita o primeiro em
     qualquer conta, e um tipo recusado aqui derrubaria a gravação. O que faz
     o arquivo ser Markdown é o conteúdo e a extensão. */
  var novo = pasta.createFile(nome, texto, 'text/plain');
  return { nome: nome, url: novo.getUrl(), acao: 'criado' };
}

/**
 * O texto do arquivo: primeiro para gente ler, e no fim os dados para o
 * sistema — o `mov` inteiro, do jeito que o formulário o montou. É esse bloco
 * que um "reabrir pela Referência" vai ler um dia; a parte de cima é a
 * conferência, escrita como sai no papel.
 */
function textoDaRecuperacao_(mov, resumo, feitos) {
  var t = [];
  var ref = maiuscula_(mov.referencia);
  var celula = celulaMd_;

  t.push('# Comprovante ' + ref + ' — arquivo de recuperação');
  t.push('');
  t.push('Gravado pelo Gerador de CMI em ' + feitos[feitos.length - 1].emitidoEm + '. ' +
    'Guarda tudo o que originou os PDFs desta Referência, para refazer ou ' +
    'conferir o comprovante sem redigitar nada. **Não edite este arquivo à ' +
    'mão**: o bloco do fim é lido pelo sistema.');
  t.push('');

  t.push('## Documentos');
  t.push('');
  t.push('| Etapa | Arquivo | Emitido em | Cabeçalho |');
  t.push('|---|---|---|---|');
  feitos.forEach(function (f) {
    t.push('| ' + f.etapa + ' (' + f.posicao + ' de ' + f.de + ') | ' + celula(f.nome) +
      ' | ' + celula(f.emitidoEm) + ' | ' + celula(f.cabecalho.adm || '') + ' |');
  });
  t.push('');

  t.push('## Identificação');
  t.push('');
  t.push('- **Referência:** ' + ref + ' — ' + rotuloDaReferencia_(mov.referenciaOrigem) +
    (mov.referenciaJustificativa ? ' (motivo: ' + mov.referenciaJustificativa + ')' : ''));
  t.push('- **Numeração SIGA:** ' + (String(mov.numeracaoSiga || '').trim() || '—'));
  t.push('- **Data de emissão:** ' + (dataBrasileira_(mov.data) || '—'));
  t.push('- **Título:** ' + (resumo.titulo || '—'));
  t.push('- **Tipo Transferência:** ' + (maiuscula_(mov.tipoEscrito || mov.tipo) || '(em branco)'));
  t.push('- **Forma:** ' + ([mov.forma, mov.subforma].filter(function (x) { return x; }).join(' · ') || '—'));
  t.push('- **Finalidade:** ' + (mov.finalidade || '—'));
  t.push('- **Observação:** ' +
    (maiuscula_(observacaoDoDocumento_(mov.contaOrigem, mov.contaDestino, mov.observacao)) || '(em branco)'));
  t.push('');

  t.push('## Valor');
  t.push('');
  /* Em lote o rótulo é "Valor Total", como no papel. */
  var lancamentos = mov.modo === 'lote' ? lancamentosDoMov_(mov) : [];
  t.push('- **' + (lancamentos.length ? 'Valor Total' : 'Valor') + ':** ' +
    emReaisNoServidor_(resumo.valor) + ' ' + (resumo.extenso || ''));
  if (lancamentos.length) {
    t.push('');
    t.push('| Data | Documento / cartão | Beneficiário / finalidade | Valor |');
    t.push('|---|---|---|---:|');
    lancamentos.forEach(function (l) {
      t.push('| ' + (dataBrasileira_(l.data) || '') + ' | ' + celula(maiuscula_(l.documento)) +
        ' | ' + celula(maiuscula_(l.beneficiario)) + ' | ' + emReaisNoServidor_(l.valor) + ' |');
    });
  }
  t.push('');

  t.push('## Origem e destino');
  t.push('');
  t.push('| | Origem | Destino |');
  t.push('|---|---|---|');
  t.push('| PIA | ' + celula(resumo.piaOrigem) + ' | ' + celula(resumo.piaDestino) + ' |');
  t.push('| Conta | ' + celula(maiuscula_(nucleoContaComCartao(mov.contaOrigem, mov.cartaoOrigem))) +
    ' | ' + celula(maiuscula_(nucleoContaComCartao(mov.contaDestino, mov.cartaoDestino))) + ' |');
  t.push('| CNPJ | ' + celula(resumo.cnpjOrigem) + ' | ' + celula(resumo.cnpjDestino) + ' |');
  t.push('| ADM | ' + celula(admDeUmaConta_(mov.contaOrigem)) + ' | ' +
    celula(admDeUmaConta_(mov.contaDestino)) + ' |');
  t.push('');

  t.push('## Assinantes');
  t.push('');
  if (mov.mesmosAssinantes) {
    t.push('Os mesmos em todas as etapas:');
    t.push('');
    t.push(listaDeAssinantes_(assinantesDaEtapa_(mov, feitos[0].etapa)));
  } else {
    feitos.forEach(function (f) {
      t.push('**' + f.etapa + ':**');
      t.push('');
      t.push(listaDeAssinantes_(f.assinantes));
      t.push('');
    });
  }
  t.push('');

  t.push('## Dados para o sistema');
  t.push('');
  t.push('```json');
  t.push(JSON.stringify(mov, null, 2));
  t.push('```');
  t.push('');
  return t.join('\n');
}

/** "- Nome — Cargo" para cada vaga preenchida; ou a frase de que não há ninguém. */
function listaDeAssinantes_(assinantes) {
  var linhas = (assinantes || []).filter(function (a) {
    return a && String(a.nome || '').trim();
  }).map(function (a) {
    var cargo = String(a.cargo || '').trim();
    return '- ' + String(a.nome).trim() + (cargo ? ' — ' + cargo : '');
  });
  return linhas.length ? linhas.join('\n') : '- (nenhum — espaços em branco, para caneta)';
}

/** As linhas do lote que têm alguma coisa — a mesma régua do preenchimento. */
function lancamentosDoMov_(mov) {
  return (mov.lancamentos || []).filter(function (l) {
    return l && (l.data || l.documento || l.beneficiario || Number(l.valor));
  });
}

/** Como a Referência nasceu, em palavras. */
function rotuloDaReferencia_(origem) {
  var rotulos = {
    'segunda-via': 'segunda via de um comprovante já emitido',
    'correcao': 'correção de um comprovante que saiu errado',
    'historico-indisponivel': 'número escrito à mão (histórico indisponível)'
  };
  return rotulos[origem] || 'gerada pelo sistema';
}

/** '2026-09-06' → '06/09/2026'. Texto, sem passar por Date: não há fuso a errar. */
function dataBrasileira_(texto) {
  var p = String(texto || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return p ? p[3] + '/' + p[2] + '/' + p[1] : '';
}

/** R$ 1.800,00 — contado em centavos inteiros, pela mesma razão do extenso. */
function emReaisNoServidor_(n) {
  var centavos = Math.round(Math.abs(Number(n) || 0) * 100 + 1e-6);
  var inteiro = String(Math.floor(centavos / 100));
  var comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return 'R$ ' + ((Number(n) || 0) < 0 ? '-' : '') + comPontos + ',' + ('0' + (centavos % 100)).slice(-2);
}

/** Um texto dentro de uma tabela Markdown: a barra vertical fecharia a célula. */
function celulaMd_(texto) {
  return String(texto == null ? '' : texto).replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
}

// ===========================================================================
// 7. O HISTÓRICO — UMA LINHA POR PDF EMITIDO
// ===========================================================================
//
// A aba "Histórico" nasce sozinha, no primeiro PDF. Uma linha por PDF, e não
// por movimentação: é o que foi EMITIDO, e uma etapa pode ser refeita sozinha
// (a correção de um Recebimento) sem as outras. Quem quiser somar por
// movimentação filtra pela etapa 1 — o relatório da Etapa 6 faz isso.
//
// A LINHA É GRAVADA PELO NOME DA COLUNA, NÃO PELA POSIÇÃO. É a armadilha da
// coluna no meio, que já custou três sintomas nos Cadastros, tirada daqui de
// antemão: se alguém mover uma coluna, ou se o projeto acrescentar outra
// amanhã, cada valor continua caindo embaixo do nome certo. Coluna que falta
// na aba é acrescentada no fim.
//
// E O FORMATO VEM ANTES DO VALOR, pela razão de sempre: o Google converte o
// que parece data ("1.2.3" numa Numeração SIGA vira 01/02/2003), e depois
// não adianta formatar. Tudo é texto, menos a Data de emissão e o Valor —
// os dois que o relatório mensal vai precisar contar.

var ABA_HISTORICO = 'Histórico';

var COLUNAS_DO_HISTORICO = [
  { nome: 'Emitido em' },
  { nome: 'Referência' },
  { nome: 'Etapa' },
  { nome: 'Etapa nº' },
  { nome: 'Como saiu o número' },
  { nome: 'Motivo da exceção' },
  { nome: 'Numeração SIGA' },
  { nome: 'Data de emissão', formato: 'dd/MM/yyyy' },
  { nome: 'Título' },
  { nome: 'Tipo Transferência' },
  { nome: 'Finalidade' },
  { nome: 'Forma' },
  { nome: 'Conta de origem' },
  { nome: 'PIA de origem' },
  { nome: 'Conta de destino' },
  { nome: 'PIA de destino' },
  { nome: 'Cabeçalho (ADM)' },
  { nome: 'Lançamentos' },
  { nome: 'Valor', formato: 'R$ #,##0.00' },
  { nome: 'Extenso' },
  { nome: 'Observação' },
  { nome: 'Assinantes' },
  { nome: 'Arquivo PDF' },
  { nome: 'Endereço do PDF' },
  { nome: 'Arquivo de recuperação' }
];

/** Uma linha por PDF, como `{ nome da coluna: valor }`. */
function linhasDoHistorico_(mov, resumo, feitos, recuperacao) {
  var lancamentos = mov.modo === 'lote' ? lancamentosDoMov_(mov) : [];
  var comuns = {
    'Referência': maiuscula_(mov.referencia),
    'Como saiu o número': rotuloDaReferencia_(mov.referenciaOrigem),
    'Motivo da exceção': String(mov.referenciaJustificativa || '').trim(),
    'Numeração SIGA': maiuscula_(mov.numeracaoSiga),
    'Data de emissão': dataDoFormulario_(mov.data),
    'Título': resumo.titulo || '',
    'Tipo Transferência': maiuscula_(mov.tipoEscrito || mov.tipo),
    'Finalidade': String(mov.finalidade || '').trim(),
    'Forma': [mov.forma, mov.subforma].filter(function (x) { return x; }).join(' · '),
    'Conta de origem': maiuscula_(nucleoContaComCartao(mov.contaOrigem, mov.cartaoOrigem)),
    'PIA de origem': resumo.piaOrigem || '',
    'Conta de destino': maiuscula_(nucleoContaComCartao(mov.contaDestino, mov.cartaoDestino)),
    'PIA de destino': resumo.piaDestino || '',
    'Lançamentos': lancamentos.length ? 'Lote de ' + lancamentos.length : 'Único',
    'Valor': Number(resumo.valor) || 0,
    'Extenso': resumo.extenso || '',
    'Observação': maiuscula_(observacaoDoDocumento_(mov.contaOrigem, mov.contaDestino, mov.observacao)),
    'Arquivo de recuperação': recuperacao ? recuperacao.url : ''
  };
  return feitos.map(function (f) {
    var linha = {};
    for (var k in comuns) if (comuns.hasOwnProperty(k)) linha[k] = comuns[k];
    linha['Emitido em'] = f.emitidoEm;
    linha['Etapa'] = f.etapa;
    linha['Etapa nº'] = f.posicao + ' de ' + f.de;
    linha['Cabeçalho (ADM)'] = f.cabecalho.adm || '';
    linha['Assinantes'] = (f.assinantes || []).filter(function (a) {
      return a && String(a.nome || '').trim();
    }).map(function (a) { return String(a.nome).trim(); }).join('; ');
    linha['Arquivo PDF'] = f.nome;
    linha['Endereço do PDF'] = f.urlArquivo;
    return linha;
  });
}

/** Grava as linhas no fim da aba, cada valor embaixo do nome da sua coluna. */
function gravarNoHistorico_(registros) {
  if (!registros || !registros.length) return 0;
  var sh = abaDoHistorico_();

  var largura = Math.max(sh.getLastColumn(), 1);
  var cabecalho = sh.getRange(1, 1, 1, largura).getValues()[0].map(function (v) {
    return String(v == null ? '' : v).trim();
  });
  while (cabecalho.length && !cabecalho[cabecalho.length - 1]) cabecalho.pop();

  var faltam = COLUNAS_DO_HISTORICO.filter(function (c) { return cabecalho.indexOf(c.nome) < 0; })
    .map(function (c) { return c.nome; });
  if (faltam.length) {
    garantirColunas_(sh, cabecalho.length + faltam.length);
    sh.getRange(1, cabecalho.length + 1, 1, faltam.length).setNumberFormat('@').setValues([faltam]);
    cabecalho = cabecalho.concat(faltam);
  }

  var formatoDe = {};
  COLUNAS_DO_HISTORICO.forEach(function (c) { formatoDe[c.nome] = c.formato || '@'; });

  var valores = registros.map(function (r) {
    return cabecalho.map(function (nome) {
      return (r.hasOwnProperty(nome) && r[nome] !== null && r[nome] !== undefined) ? r[nome] : '';
    });
  });
  var formatos = registros.map(function () {
    return cabecalho.map(function (nome) { return formatoDe[nome] || '@'; });
  });

  var primeira = sh.getLastRow() + 1;
  var ultima = primeira + registros.length - 1;
  if (sh.getMaxRows() < ultima) sh.insertRowsAfter(sh.getMaxRows(), ultima - sh.getMaxRows());

  var faixa = sh.getRange(primeira, 1, registros.length, cabecalho.length);
  faixa.setNumberFormats(formatos);
  faixa.setValues(valores);
  return registros.length;
}

/**
 * A aba Histórico — criada na primeira vez, com o cabeçalho.
 *
 * Ela nasce PROTEGIDA POR AVISO, como os campos calculados do comprovante:
 * o Google pergunta "tem certeza?" antes de deixar alguém editar à mão, e o
 * script continua escrevendo normalmente. Registro que se edita sem perceber
 * deixa de ser registro.
 */
function abaDoHistorico_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(ABA_HISTORICO);
  if (sh) return sh;

  /* Criar uma aba a torna a aba ATIVA, e a pessoa, que estava no formulário,
     veria a planilha pular para o Histórico sem ter pedido. Guarda a de antes
     e volta para ela. */
  var antes = null;
  try { antes = ss.getActiveSheet ? ss.getActiveSheet() : null; } catch (e) { antes = null; }

  sh = ss.insertSheet(ABA_HISTORICO, ss.getSheets().length);
  var nomes = COLUNAS_DO_HISTORICO.map(function (c) { return c.nome; });
  garantirColunas_(sh, nomes.length);
  sh.getRange(1, 1, 1, nomes.length).setNumberFormat('@').setValues([nomes])
    .setFontWeight('bold').setBackground('#efefef');
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, nomes.length, 140);
  sh.protect().setDescription('CMI - registro automático').setWarningOnly(true);

  try { if (antes && ss.setActiveSheet) ss.setActiveSheet(antes); } catch (e) { /* só cortesia */ }
  return sh;
}

/** A aba tem pelo menos `quantas` colunas. */
function garantirColunas_(sh, quantas) {
  if (sh.getMaxColumns() < quantas) {
    sh.insertColumnsAfter(sh.getMaxColumns(), quantas - sh.getMaxColumns());
  }
}
