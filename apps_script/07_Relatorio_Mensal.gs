/**
 * GERADOR DE COMPROVANTES PARA O SIGA — Tesouraria da Piedade / ADM Coxim-MS
 * ETAPA 6: o relatório mensal dos comprovantes gerados.
 *
 * O QUE ELE É — E O QUE ELE NÃO É
 * É a LISTA dos comprovantes que ESTE APP gerou num mês, com os dados de cada
 * um e cada linha de lote à parte. Serve para responder uma pergunta:
 * "este lançamento financeiro já teve o comprovante gerado pelo app?".
 *
 * NÃO é relatório contábil nem financeiro, e isso é decisão dele (24/09/2026):
 * alguns comprovantes passam a sair DIRETO DO SIGA, e aí somar só os que
 * saíram daqui daria um número com cara de saldo que não é saldo. Por isso
 * não existe soma de valores em lugar nenhum deste arquivo — só contagem.
 *
 * DE ONDE VEM: da aba Histórico (`05_Gerar_PDF.gs`, seção 7), que tem UMA
 * LINHA POR PDF, e não por comprovante. Um comprovante entre PIAs deixa três
 * linhas lá; uma correção deixa as linhas do errado e as do certo; uma
 * segunda via repete o comprovante inteiro. Listar o Histórico direto
 * mostraria o mesmo comprovante várias vezes. As regras de quem aparece, e
 * uma vez só, estão em `comprovantesDoHistorico_`.
 *
 * O QUE SAI: a aba "Relatório", refeita a cada pedido, e dela um PDF na pasta
 * dos comprovantes. Menu: Tesouraria • CMP p/ SIGA → Relatório mensal.
 */

var ABA_RELATORIO = 'Relatório';

var NOMES_DOS_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/**
 * A ordem das etapas no papel. É por ela que "PDFs gerados" se escreve, e não
 * pela ordem em que as linhas entraram no Histórico: uma etapa refeita depois
 * continua sendo a 2ª do comprovante.
 */
var ORDEM_DAS_ETAPAS = ['APROVADA', 'PAGA', 'EFETIVADA', 'RECEBIDA'];

/** As colunas da lista, na ordem em que saem. Aprovadas por ele. */
var COLUNAS_DO_RELATORIO = [
  { nome: 'Data', px: 72, formato: 'dd/MM/yyyy' },
  { nome: 'Referência', px: 78 },
  /* 110 e 100, e não 60 e 78: no PDF do teste da Etapa 6 "TESTE001" quebrava
     em duas linhas, e estas mesmas colunas levam, na parte das exceções, a
     hora ("24/09/2026 06:59:48") e os PDFs daquela emissão. */
  { nome: 'Nº SIGA', px: 110 },
  { nome: 'Lançamento', px: 100 },
  { nome: 'Documento / cartão', px: 100 },
  { nome: 'Beneficiário / finalidade da linha', px: 150 },
  { nome: 'Valor', px: 82, formato: 'R$ #,##0.00' },
  { nome: 'Conta de origem', px: 230 },
  { nome: 'Conta de destino', px: 230 },
  { nome: 'Finalidade', px: 200 },
  { nome: 'Forma', px: 110 },
  { nome: 'PDFs gerados', px: 190 }
];

// ===========================================================================
// 1. A JANELA DO MENU
// ===========================================================================

/**
 * Item de menu "Relatório mensal": abre a janelinha de escolher o mês.
 *
 * Ela já vem no MÊS ANTERIOR — o relatório é de fechamento, e o fechamento é
 * do mês que acabou. Quem quiser outro troca na janela.
 */
function relatorioMensal() {
  guardarIdDaPlanilha_();
  var inicial = mesAnterior_(new Date());
  var tela = HtmlService.createHtmlOutput(telaDoRelatorio_(inicial))
    .setWidth(520)
    .setHeight(460);
  SpreadsheetApp.getUi().showModalDialog(tela, 'Relatório mensal');
}

/** O mês anterior a uma data: { ano, mes } com mes de 1 a 12. */
function mesAnterior_(hoje) {
  var ano = hoje.getFullYear(), mes = hoje.getMonth();   // getMonth: 0 = janeiro
  if (mes === 0) return { ano: ano - 1, mes: 12 };
  return { ano: ano, mes: mes };
}

/**
 * O HTML da janelinha.
 *
 * É pequeno o bastante para morar aqui dentro, como a janela de importação —
 * mas carrega a armadilha de sempre: um erro de sintaxe no <script> faz a
 * janela abrir normal e não responder a botão nenhum, sem mensagem. Por isso
 * a bancada monta este texto, confere a sintaxe do que foi montado e clica
 * nos botões dele num navegador de mentira.
 *
 * Nada de alert() nem confirm(): o Google bloqueia os dois nestas janelas.
 * O resultado aparece na própria página.
 */
function telaDoRelatorio_(inicial) {
  var opcoes = NOMES_DOS_MESES.map(function (nome, i) {
    return '<option value="' + (i + 1) + '"' + (i + 1 === inicial.mes ? ' selected' : '') + '>' +
      nome + '</option>';
  }).join('');

  return [
    '<!DOCTYPE html><html><head><base target="_top"><meta charset="utf-8"><style>',
    'body{font-family:Arial,Helvetica,sans-serif;font-size:14px;margin:0;padding:16px;color:#202124}',
    'label{display:block;font-weight:bold;font-size:12px;color:#5f6368;margin-bottom:4px}',
    '.linha{display:flex;gap:12px;margin-bottom:12px}',
    '.linha>div{flex:1 1 0}',
    'select,input{width:100%;box-sizing:border-box;font-size:15px;padding:7px 8px;',
    ' border:1px solid #dadce0;border-radius:4px}',
    '.dica{font-size:12px;color:#5f6368;line-height:1.45;margin:0 0 14px}',
    '.botoes{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}',
    'button,a.b{font-family:inherit;font-size:14px;padding:9px 16px;border:1px solid #dadce0;',
    ' border-radius:4px;background:#fff;color:#1a73e8;cursor:pointer;text-decoration:none}',
    'button.forte,a.b.forte{background:#1a73e8;border-color:#1a73e8;color:#fff}',
    'button:disabled{opacity:.55;cursor:default}',
    '#resultado{display:none;margin-top:14px;padding:10px 12px;border-left:4px solid;',
    ' border-radius:4px;white-space:pre-wrap;font-size:13px;line-height:1.5}',
    '#resultado.ok{background:#e6f4ea;border-color:#34a853;color:#188038}',
    '#resultado.erro{background:#fce8e6;border-color:#d93025;color:#d93025}',
    '#resultado.indo{background:#e8f0fe;border-color:#1a73e8;color:#1a73e8}',
    '#links{display:none;margin-top:10px}',
    '</style></head><body>',

    '<p class="dica">A lista dos comprovantes que <b>este app</b> gerou no mês, ',
    'um lançamento por linha. Os emitidos direto no SIGA não aparecem aqui — ',
    'por isso o relatório conta, mas <b>não soma</b> valores.</p>',

    '<div class="linha">',
    '<div><label for="mes">Mês</label><select id="mes">', opcoes, '</select></div>',
    '<div><label for="ano">Ano</label><input type="number" id="ano" min="2020" max="2100" value="',
    String(inicial.ano), '"></div>',
    '</div>',

    '<div class="botoes">',
    '<button type="button" class="forte" id="btMontar">Montar o relatório</button>',
    '<button type="button" id="btPdf" disabled>Gerar o PDF do relatório</button>',
    '<button type="button" id="btFechar">Fechar</button>',
    '</div>',

    '<div id="resultado"></div>',
    '<div id="links" class="botoes"></div>',

    '<script>',
    'function elem(id){return document.getElementById(id);}',
    'function escolhido(){return {ano:Number(elem("ano").value),mes:Number(elem("mes").value)};}',
    'function recado(texto,classe){var r=elem("resultado");r.textContent=texto;',
    ' r.className=classe;r.style.display="block";}',
    'function travar(sim){elem("btMontar").disabled=sim;elem("btPdf").disabled=sim||!montado;}',
    'var montado=false;',
    'function falhou(e){travar(false);',
    ' recado("NÃO DEU CERTO. "+(e&&e.message?e.message:String(e)),"erro");}',
    'function montar(){var m=escolhido();montado=false;travar(true);',
    ' elem("links").style.display="none";',
    ' var o=elem("mes").options[elem("mes").selectedIndex];',
    ' recado("Montando o relatório de "+(o?o.text:m.mes)+"/"+m.ano+"…","indo");',
    ' google.script.run.withSuccessHandler(function(r){montado=true;travar(false);',
    '  recado(r.texto,"ok");}).withFailureHandler(falhou).montarRelatorioMensal(m.ano,m.mes);}',
    'function link(rotulo,url,forte){var a=document.createElement("a");a.className="b"+(forte?" forte":"");',
    ' a.href=url;a.target="_blank";a.rel="noopener";a.textContent=rotulo;return a;}',
    'function gerarPdf(){var m=escolhido();travar(true);',
    ' recado("Montando o relatório e pedindo o PDF ao Google…","indo");',
    ' google.script.run.withSuccessHandler(function(r){travar(false);',
    '  recado(r.texto+"\\n\\nPDF: "+r.nome+", na pasta "+r.pasta+".","ok");',
    '  var l=elem("links");l.innerHTML="";',
    '  l.appendChild(link("Abrir o PDF",r.urlArquivo,true));',
    '  l.appendChild(link("Abrir a pasta",r.urlPasta,false));',
    '  l.style.display="flex";}).withFailureHandler(falhou).gerarPdfDoRelatorio(m.ano,m.mes);}',
    'elem("btMontar").addEventListener("click",montar);',
    'elem("btPdf").addEventListener("click",gerarPdf);',
    'elem("btFechar").addEventListener("click",function(){google.script.host.close();});',
    'elem("mes").addEventListener("change",function(){montado=false;travar(false);});',
    'elem("ano").addEventListener("input",function(){montado=false;travar(false);});',
    '</script></body></html>'
  ].join('');
}

// ===========================================================================
// 2. AS PORTAS QUE A JANELA CHAMA
// ===========================================================================

/**
 * Refaz a aba "Relatório" com o mês pedido e devolve o resumo para a janela.
 *
 * `garantirPlanilha_()` pela regra de sempre: toda porta que a tela chama e
 * que lê a planilha abre a planilha antes.
 */
function montarRelatorioMensal(ano, mes) {
  garantirPlanilha_();
  var r = escreverRelatorio_(Number(ano), Number(mes));
  return { texto: resumoDoRelatorio_(r), comprovantes: r.comprovantes,
           lancamentos: r.lancamentos.length };
}

/**
 * Refaz a aba e gera o PDF dela, na pasta dos comprovantes.
 *
 * REFAZ ANTES DE EXPORTAR, sempre, mesmo que a pessoa tenha acabado de montar:
 * o PDF tem de ser do mês que está na janela agora, e não do que ficou na aba
 * de um pedido anterior. É o "campo vazio limpa a célula" do relatório.
 *
 * O PDF NÃO SEGUE AS REGRAS DO COMPROVANTE: ele sai deitado (são 12 colunas),
 * ajustado à largura da folha e pode ter quantas páginas o mês pedir. As
 * regras do comprovante — uma folha, escala 100% — existem para ele coincidir
 * com o do SIGA, e o relatório não tem com o que coincidir.
 */
function gerarPdfDoRelatorio(ano, mes) {
  garantirPlanilha_();
  var r = escreverRelatorio_(Number(ano), Number(mes));
  SpreadsheetApp.flush();

  var pasta = pastaDeDestino_();
  var nome = nomeDoPdfDoRelatorio_(Number(ano), Number(mes));
  var arquivo = pasta.createFile(pdfDaAba_(r.aba, AJUSTES_DO_RELATORIO).setName(nome));
  return {
    texto: resumoDoRelatorio_(r),
    nome: nome,
    pasta: pasta.getName(),
    urlArquivo: arquivo.getUrl(),
    urlPasta: pasta.getUrl()
  };
}

/** Os ajustes de impressão do relatório — ver `urlDeExportacao_`. */
var AJUSTES_DO_RELATORIO = { retrato: false, ajustarLargura: true, numerarPaginas: true };

/**
 * "Relatório CMP - 2026-09 - 26_09_24.pdf": o mês do relatório e o dia em que
 * foi gerado. O dia vai no nome porque o relatório de um mês pode ser gerado
 * de novo depois (uma correção entrou), e os dois ficam na pasta: pelo nome se
 * sabe qual é o mais novo, sem o sistema apagar nada sozinho.
 */
function nomeDoPdfDoRelatorio_(ano, mes) {
  var fuso = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  return 'Relatório CMP - ' + ano + '-' + ('0' + mes).slice(-2) + ' - ' +
    Utilities.formatDate(new Date(), fuso, 'yy_MM_dd') + '.pdf';
}

/** O que a janela mostra depois de montar. */
function resumoDoRelatorio_(r) {
  var mesAno = NOMES_DOS_MESES[r.mes - 1] + '/' + r.ano;
  if (!r.historicoExiste) {
    return 'A aba Histórico ainda não existe: nenhum PDF foi gerado pelo formulário. ' +
      'A aba Relatório foi montada vazia.';
  }
  if (!r.comprovantes) {
    return 'Nenhum comprovante gerado pelo app com data de ' + mesAno + '. ' +
      'A aba Relatório foi montada, vazia.';
  }
  return 'Relatório de ' + mesAno + ' montado na aba "' + ABA_RELATORIO + '": ' +
    contagem_(r.comprovantes, r.lancamentos.length) +
    (r.excecoes.length ? '\n' + r.excecoes.length + ' correção(ões), segunda(s) via(s) ou ' +
      'número(s) escrito(s) à mão, listados no fim.' : '');
}

/** "3 comprovantes, 7 lançamentos" — com o singular certo. */
function contagem_(comprovantes, lancamentos) {
  return comprovantes + (comprovantes === 1 ? ' comprovante, ' : ' comprovantes, ') +
    lancamentos + (lancamentos === 1 ? ' lançamento.' : ' lançamentos.');
}

// ===========================================================================
// 3. QUEM APARECE, E UMA VEZ SÓ — A REGRA DO RELATÓRIO
// ===========================================================================
//
// O Histórico tem uma linha POR PDF. As regras, decididas com ele:
//
//   1. CADA COMPROVANTE APARECE UMA VEZ, PELA REFERÊNCIA — não uma vez por
//      PDF. E NÃO PELA ETAPA 1: a correção deixa a linha errada no Histórico,
//      e a etapa 1 pode nem ter saído (o Google recusou a APROVADA, ou alguém
//      gerou só a EFETIVADA).
//   2. A SEGUNDA VIA NÃO REPETE O COMPROVANTE: é reimpressão de um que já
//      está listado. Ela aparece só na parte das exceções.
//   3. NA CORREÇÃO VALEM OS DADOS DA EMISSÃO MAIS NOVA. Se a correção mudou a
//      data de mês, o comprovante muda de mês junto.
//   4. "PDFs GERADOS" JUNTA TODAS AS ETAPAS que saíram daquela Referência,
//      e marca as que ficaram de uma emissão anterior. É por isso que a regra
//      3 fala dos DADOS, e não dos PDFs: o caminho que a própria tela ensina
//      para gerar só a etapa que o Google recusou é "Corrigir e gerar de
//      novo" com ela só marcada — e aí as outras duas continuam valendo.
//      MAS SÓ AS ETAPAS QUE AINDA EXISTEM: no teste da Etapa 6 a correção do
//      CMP-26/016 trocou uma transferência entre ADMs (3 PDFs) por uma
//      movimentação na mesma PIA (2 PDFs), e a PAGA e a RECEBIDA antigas
//      apareciam como se valessem. Uma etapa de uma emissão com outro total
//      ("2 de 3" contra "1 de 2") é de outro comprovante, e sai da conta.
//   5. A SEGUNDA VIA QUE MUDOU OS DADOS É DITA, e não engolida: ela devia
//      reimprimir o original, e no teste uma saiu com outro valor. Os dados
//      que valem continuam os do original; a exceção avisa.
//
// E o que decide "a mesma emissão": linhas SEGUIDAS da mesma Referência, com a
// mesma coluna Emissão (a hora do 1º PDF do clique), o mesmo jeito de sair o
// número, o mesmo motivo, e sem etapa repetida. A hora sozinha não basta — ela
// é contada em segundos, e a bancada gerou uma correção no mesmo segundo do
// original: as duas viravam uma emissão só, e o valor errado ficava valendo.
// Sem a coluna Emissão (linhas gravadas antes de ela existir) vale o resto da
// regra, que é o mesmo palpite.

/**
 * Os comprovantes do Histórico, um por Referência, com os lançamentos e as
 * exceções. `registros` são as linhas do Histórico como `{ coluna: valor }`,
 * na ordem da aba.
 *
 * Função sem planilha: recebe as linhas e devolve a resposta. É ela que a
 * bancada prova com a tabela que ele aprovou.
 */
function comprovantesDoHistorico_(registros) {
  var porReferencia = {}, ordem = [];
  (registros || []).forEach(function (r, i) {
    var ref = maiuscula_(r['Referência']);
    if (!ref) return;
    if (!porReferencia[ref]) { porReferencia[ref] = []; ordem.push(ref); }
    porReferencia[ref].push({ r: r, i: i, como: comoSaiuONumero_(r['Como saiu o número']) });
  });

  return ordem.map(function (ref) {
    var linhas = porReferencia[ref];
    var emissoes = emissoesDe_(linhas);
    var validas = emissoes.filter(function (e) { return e.como !== 'segunda-via'; });
    var soSegundaVia = !validas.length;
    var atual = soSegundaVia ? emissoes[emissoes.length - 1] : validas[validas.length - 1];
    var dados = atual.linhas[atual.linhas.length - 1].r;

    return {
      referencia: ref,
      dados: dados,
      pdfs: pdfsGerados_(soSegundaVia ? emissoes : validas, atual),
      soSegundaVia: soSegundaVia,
      excecoes: emissoes.filter(function (e) { return e.como !== 'sistema'; }).map(function (e) {
        var mudou = e.como === 'segunda-via' && !soSegundaVia && dadosDiferentes_(e.linhas[0].r, dados);
        return {
          referencia: ref,
          oQue: ROTULOS_DAS_EXCECOES[e.como] +
            (mudou ? ' — COM DADOS DIFERENTES do original (não valem: segunda via reimprime)' : ''),
          emitidoEm: String(e.linhas[0].r['Emitido em'] || ''),
          etapas: e.linhas.map(function (l) { return maiuscula_(l.r['Etapa']); }).join(' · '),
          motivo: String(e.linhas[0].r['Motivo da exceção'] || '').trim()
        };
      })
    };
  });
}

/** As colunas que uma segunda via não pode mudar em relação ao original. */
var DADOS_DO_COMPROVANTE = ['Numeração SIGA', 'Data de emissão', 'Conta de origem',
  'Conta de destino', 'Finalidade', 'Forma', 'Lançamentos', 'Valor', 'Observação',
  'Linhas do lote'];

function dadosDiferentes_(a, b) {
  return DADOS_DO_COMPROVANTE.some(function (col) {
    var x = a[col], y = b[col];
    if (x instanceof Date && y instanceof Date) return x.getTime() !== y.getTime();
    return String(x == null ? '' : x).trim() !== String(y == null ? '' : y).trim();
  });
}

var ROTULOS_DAS_EXCECOES = {
  'correcao': 'Correção',
  'segunda-via': 'Segunda via',
  'historico-indisponivel': 'Número escrito à mão'
};

/**
 * O caminho do número, a partir do texto que o Histórico guarda.
 *
 * O Histórico grava o texto legível (`rotuloDaReferencia_`), e não o código:
 * "segunda via de um comprovante já emitido". A comparação é sem acento e sem
 * caixa, pela palavra que distingue — o texto pode ganhar uma vírgula um dia
 * sem a regra parar de valer.
 */
function comoSaiuONumero_(texto) {
  var t = nucleoSimples(texto);
  if (t.indexOf('SEGUNDA VIA') >= 0) return 'segunda-via';
  if (t.indexOf('CORRECAO') >= 0) return 'correcao';
  if (t.indexOf('ESCRITO A MAO') >= 0 || t.indexOf('HISTORICO INDISPONIVEL') >= 0) {
    return 'historico-indisponivel';
  }
  return 'sistema';
}

/** As linhas de uma Referência, agrupadas por clique de gerar. */
function emissoesDe_(linhas) {
  var saida = [], atual = null;
  linhas.forEach(function (l) {
    var chave = String(l.r['Emissão'] || '').trim();
    var mesma = !!atual && chave === atual.chave && l.como === atual.como &&
      String(l.r['Motivo da exceção'] || '') === atual.motivo &&
      !atual.etapas[maiuscula_(l.r['Etapa'])];
    if (!mesma) {
      atual = { chave: chave, como: l.como, motivo: String(l.r['Motivo da exceção'] || ''),
                linhas: [], etapas: {} };
      saida.push(atual);
    }
    atual.linhas.push(l);
    atual.etapas[maiuscula_(l.r['Etapa'])] = true;
  });
  return saida;
}

/**
 * "APROVADA · PAGA (antes da correção) · RECEBIDA" — todas as etapas que
 * saíram, na ordem do papel, marcando as que não foram refeitas na emissão
 * mais nova.
 */
function pdfsGerados_(emissoes, atual) {
  var total = totalDeEtapas_(atual.linhas[0].r['Etapa nº']);
  var ultimaDe = {};
  emissoes.forEach(function (e) {
    e.linhas.forEach(function (l) {
      var deN = totalDeEtapas_(l.r['Etapa nº']);
      if (total && deN && deN !== total) return;     // etapa de outra versão do comprovante
      ultimaDe[maiuscula_(l.r['Etapa'])] = e;
    });
  });
  var marca = atual.como === 'correcao' ? ' (antes da correção)' : ' (emissão anterior)';
  var etapas = Object.keys(ultimaDe).sort(function (a, b) {
    return posicaoDaEtapa_(a) - posicaoDaEtapa_(b);
  });
  return etapas.map(function (etapa) {
    return etapa + (ultimaDe[etapa] === atual ? '' : marca);
  }).join(' · ');
}

/** "2 de 3" → 3. Zero quando não dá para ler. */
function totalDeEtapas_(texto) {
  var achado = String(texto || '').match(/de\s*(\d+)\s*$/);
  return achado ? Number(achado[1]) : 0;
}

function posicaoDaEtapa_(etapa) {
  var i = ORDEM_DAS_ETAPAS.indexOf(etapa);
  return i < 0 ? ORDEM_DAS_ETAPAS.length : i;
}

/**
 * O relatório de um mês: os lançamentos, em ordem de data, e as exceções.
 *
 * O MÊS É O DA DATA IMPRESSA NO COMPROVANTE, não o do dia em que o PDF foi
 * gerado — datado 30/09 e gerado 02/10 é de setembro. No lote vale a data de
 * cada linha, e é por isso que um comprovante entra no mês se ALGUMA linha
 * dele cair no mês.
 */
function relatorioDoMes_(registros, ano, mes) {
  var lancamentos = [], excecoes = [], quantos = 0;

  comprovantesDoHistorico_(registros).forEach(function (c) {
    var doMes = lancamentosDoComprovante_(c).filter(function (l) {
      return l.data instanceof Date && l.data.getFullYear() === ano && l.data.getMonth() + 1 === mes;
    });
    if (!doMes.length) return;
    quantos++;
    lancamentos = lancamentos.concat(doMes);
    excecoes = excecoes.concat(c.excecoes);
  });

  /* As exceções em ordem de Referência — é como o Conselho as procura — e,
     dentro da mesma, na ordem em que aconteceram. */
  excecoes = excecoes.map(function (e, i) { e.ordem = i; return e; }).sort(function (a, b) {
    return (a.referencia < b.referencia ? -1 : a.referencia > b.referencia ? 1 : 0) || (a.ordem - b.ordem);
  });
  lancamentos.sort(function (a, b) {
    return (a.data.getTime() - b.data.getTime()) ||
      (a.referencia < b.referencia ? -1 : a.referencia > b.referencia ? 1 : 0) ||
      (a.ordem - b.ordem);
  });
  return { ano: ano, mes: mes, comprovantes: quantos, lancamentos: lancamentos, excecoes: excecoes };
}

/**
 * As linhas que um comprovante põe no relatório: uma no lançamento único, uma
 * por linha no lote.
 *
 * O lote precisa da coluna "Linhas do lote" do Histórico. Um lote gravado
 * antes de ela existir sai numa linha só, com o total, e dizendo que é isso —
 * não se inventa linha que o Histórico não guardou.
 */
function lancamentosDoComprovante_(c) {
  var d = c.dados;
  var base = {
    referencia: c.referencia,
    numeracaoSiga: String(d['Numeração SIGA'] || ''),
    contaOrigem: String(d['Conta de origem'] || ''),
    contaDestino: String(d['Conta de destino'] || ''),
    finalidade: String(d['Finalidade'] || ''),
    forma: String(d['Forma'] || ''),
    pdfs: c.pdfs + (c.soSegundaVia ? ' (só segunda via no Histórico)' : '')
  };
  var dataDoComprovante = dataDoHistorico_(d['Data de emissão']);

  var linhas = linhasDoLoteGuardadas_(d['Linhas do lote']);
  if (!linhas.length) {
    var ehLote = /^LOTE/i.test(String(d['Lançamentos'] || '').trim());
    return [juntar_(base, {
      data: dataDoComprovante,
      lancamento: ehLote ? String(d['Lançamentos']).trim() + ' (sem as linhas)' : 'Único',
      documento: '', beneficiario: '',
      valor: Number(d['Valor']) || 0, ordem: 0
    })];
  }
  return linhas.map(function (l, i) {
    return juntar_(base, {
      data: dataDoFormulario_(l.data) || dataDoComprovante,
      lancamento: 'Lote ' + (i + 1) + ' de ' + linhas.length,
      documento: String(l.documento || ''),
      beneficiario: String(l.beneficiario || ''),
      valor: Number(l.valor) || 0,
      ordem: i
    });
  });
}

/** O JSON da coluna "Linhas do lote", ou nada quando ela está vazia ou estragada. */
function linhasDoLoteGuardadas_(texto) {
  var t = String(texto || '').trim();
  if (!t) return [];
  try {
    var lista = JSON.parse(t);
    return Object.prototype.toString.call(lista) === '[object Array]' ? lista : [];
  } catch (e) {
    return [];
  }
}

/**
 * A data do Histórico como Date. A coluna é gravada como data, mas uma aba
 * editada à mão (ou colada de outro lugar) pode trazer "06/09/2026" em texto.
 */
function dataDoHistorico_(valor) {
  if (valor instanceof Date) return valor;
  var p = String(valor || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return p ? new Date(Number(p[3]), Number(p[2]) - 1, Number(p[1])) : '';
}

function juntar_(a, b) {
  var saida = {};
  [a, b].forEach(function (o) { for (var k in o) if (o.hasOwnProperty(k)) saida[k] = o[k]; });
  return saida;
}

// ===========================================================================
// 4. A ABA "RELATÓRIO"
// ===========================================================================

/** As linhas da aba Histórico, como `{ nome da coluna: valor }`. */
function lerHistorico_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA_HISTORICO);
  if (!sh) return null;
  var ultima = sh.getLastRow(), largura = sh.getLastColumn();
  if (ultima < 2 || largura < 1) return [];
  var cabecalho = sh.getRange(1, 1, 1, largura).getValues()[0].map(function (v) {
    return String(v == null ? '' : v).trim();
  });
  return sh.getRange(2, 1, ultima - 1, largura).getValues().map(function (linha) {
    var registro = {};
    cabecalho.forEach(function (nome, i) { if (nome) registro[nome] = linha[i]; });
    return registro;
  });
}

/**
 * Refaz a aba "Relatório" com o mês pedido. Devolve o relatório calculado e a
 * aba, para quem for exportar.
 *
 * A ABA É REFEITA DO ZERO A CADA PEDIDO, e nasce protegida por aviso: ela é
 * resultado, e anotação feita à mão nela some no próximo pedido — o aviso do
 * Google lembra disso antes de alguém perder trabalho.
 */
function escreverRelatorio_(ano, mes) {
  if (!(mes >= 1 && mes <= 12) || !(ano >= 2000 && ano <= 2100)) {
    throw new Error('Mês ou ano inválido: ' + mes + '/' + ano + '.');
  }
  var registros = lerHistorico_();
  var r = relatorioDoMes_(registros || [], ano, mes);
  r.historicoExiste = registros !== null;

  var ss = SpreadsheetApp.getActive();
  var antiga = ss.getSheetByName(ABA_RELATORIO);
  if (antiga) antiga.setName(ABA_RELATORIO + '_ANTIGA_' + new Date().getTime());
  var sh = ss.insertSheet(ABA_RELATORIO, ss.getSheets().length);
  if (antiga) ss.deleteSheet(antiga);

  var nCols = COLUNAS_DO_RELATORIO.length;
  var fuso = ss.getSpreadsheetTimeZone();
  var mesAno = NOMES_DOS_MESES[mes - 1] + '/' + ano;

  /* O PAPEL, MONTADO EM MEMÓRIA: cada linha com o que vai nela, o formato e
     o estilo. Escrever célula a célula seria uma viagem ao Google por célula;
     assim o texto vai num `setValues` só, com o formato ANTES do valor — a
     regra de sempre, porque o Google converte o que parece data. */
  var linhas = [];
  function texto(valores, estilo) {
    var l = [];
    for (var c = 0; c < nCols; c++) l.push(valores[c] === undefined ? '' : valores[c]);
    linhas.push({ valores: l, formatos: l.map(function () { return '@'; }), estilo: estilo || '' });
  }

  texto(['Relatório mensal dos comprovantes — ' + mesAno], 'titulo');
  texto(['Gerador de comprovantes para o SIGA · montado em ' +
    Utilities.formatDate(new Date(), fuso, 'dd/MM/yyyy HH:mm') + ' · a partir da aba Histórico'], 'nota');
  texto(['Só os comprovantes gerados por este app. Os emitidos direto no SIGA não ' +
    'aparecem aqui — por isso o relatório conta, mas não soma valores.'], 'nota');
  texto([]);

  texto(['COMPROVANTES DO MÊS — um lançamento por linha'], 'secao');
  texto(COLUNAS_DO_RELATORIO.map(function (c) { return c.nome; }), 'cabecalho');
  if (!r.lancamentos.length) {
    texto([r.historicoExiste
      ? 'Nenhum comprovante gerado pelo app com data de ' + mesAno + '.'
      : 'A aba Histórico ainda não existe: nenhum PDF foi gerado pelo formulário.']);
  }
  r.lancamentos.forEach(function (l) {
    var valores = [l.data, l.referencia, l.numeracaoSiga, l.lancamento, l.documento,
      l.beneficiario, l.valor, l.contaOrigem, l.contaDestino, l.finalidade, l.forma, l.pdfs];
    linhas.push({
      valores: valores,
      formatos: COLUNAS_DO_RELATORIO.map(function (c) { return c.formato || '@'; }),
      estilo: 'dado'
    });
  });
  texto([]);
  texto([r.comprovantes ? contagem_(r.comprovantes, r.lancamentos.length) : 'Nenhum comprovante.'], 'contagem');
  texto([]);

  texto(['CORREÇÕES, SEGUNDAS VIAS E NÚMEROS ESCRITOS À MÃO — só para conferência, não repetem comprovante'], 'secao');
  texto(['Referência', 'O que foi', 'Gerado em', 'PDFs desta emissão', 'Motivo'], 'cabecalho');
  if (!r.excecoes.length) texto(['Nenhuma neste mês.']);
  r.excecoes.forEach(function (e) {
    texto([e.referencia, e.oQue, e.emitidoEm, e.etapas, e.motivo], 'dado');
  });

  garantirColunas_(sh, nCols);
  if (sh.getMaxRows() < linhas.length) sh.insertRowsAfter(sh.getMaxRows(), linhas.length - sh.getMaxRows());

  var faixa = sh.getRange(1, 1, linhas.length, nCols);
  faixa.setNumberFormats(linhas.map(function (l) { return l.formatos; }));
  faixa.setValues(linhas.map(function (l) { return l.valores; }));
  faixa.setFontFamily('Arial').setFontSize(9).setVerticalAlignment('top')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  linhas.forEach(function (l, i) {
    if (!l.estilo || l.estilo === 'dado') return;
    var toda = sh.getRange(i + 1, 1, 1, nCols);
    if (l.estilo === 'titulo') toda.setFontSize(13).setFontWeight('bold');
    if (l.estilo === 'nota') toda.setFontColor('#5f6368');
    if (l.estilo === 'secao') toda.setFontWeight('bold').setFontColor('#1a73e8');
    if (l.estilo === 'cabecalho') toda.setFontWeight('bold').setBackground('#efefef');
    if (l.estilo === 'contagem') toda.setFontWeight('bold');
    /* O título, as notas, as seções e a contagem são uma frase só: sem quebra,
       elas escorrem pelas colunas vazias ao lado, em vez de virar uma torre
       de texto dentro da primeira coluna. */
    if (l.estilo !== 'cabecalho') toda.setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  });

  COLUNAS_DO_RELATORIO.forEach(function (c, i) { sh.setColumnWidth(i + 1, c.px); });
  sh.setHiddenGridlines(true);
  sh.protect().setDescription('CMP - relatório (refeito a cada pedido)').setWarningOnly(true);

  try { if (ss.setActiveSheet) ss.setActiveSheet(sh); } catch (e) { /* só cortesia */ }

  r.aba = sh;
  return r;
}
