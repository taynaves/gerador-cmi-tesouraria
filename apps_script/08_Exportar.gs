/**
 * 08_Exportar.gs — O COMPROVANTE SEM PDF, E A PASTA DOS ARQUIVOS (Etapa 7)
 *
 * Pedidos c, d e f da Etapa 7:
 *
 *   c. exportar o comprovante sem gerar PDF — Excel, planilha do Google na
 *      pasta, ou o .md —, pelo formulário e pelo menu;
 *   d. todo PDF continua gerando o .md (é o `emitirMovimentacao_`, no 05; nada
 *      aqui mexe nisso);
 *   f. abrir a pasta dos arquivos, pelo menu e pelo formulário.
 *
 * UM CAMINHO PARA CADA METADE DO PEDIDO c (decisão dele, 29/09/2026):
 *
 *   - Formulário → "Exportar…": PREENCHE a aba com o que está na tela e
 *     depois exporta. A fonte é o formulário. Sem preencher antes, sairia o
 *     comprovante anterior com cara de certo — a armadilha anotada em 4.6.
 *   - Menu → "Exportar o comprovante da aba": exporta a aba COMO ESTÁ,
 *     inclusive com o que foi editado à mão. A fonte é a aba.
 *
 * NENHUM DOS DOIS CONSOME A REFERÊNCIA. Quem gasta o número é o PDF, que é o
 * documento que vai ao SIGA (regra 5 do CLAUDE.md).
 *
 * Arquivo NOVO na Etapa 7: no editor do Apps Script ele é criado à mão
 * (+ → Script → "08_Exportar"). O menu "Conferir versões dos arquivos" diz se
 * ele está lá.
 */
var VERSAO_DA_EXPORTACAO = '2026-09-30a';

// ===========================================================================
// 1. DO FORMULÁRIO: PREENCHE E EXPORTA
// ===========================================================================

/**
 * A porta do botão "Exportar…" do formulário.
 *
 * `formato`: 'excel' (os bytes voltam para a tela baixar), 'google' (a
 * planilha fica na pasta) ou 'md' (o texto volta para a tela baixar).
 *
 * UMA ABA POR ETAPA na planilha: o comprovante são os 2 ou 3 documentos da
 * movimentação, e a aba Comprovante guarda um de cada vez. Cada etapa passa
 * pelo preenchimento inteiro, como no PDF — é o mesmo documento, só não vira
 * PDF. No fim a aba fica com a última etapa, como depois de gerar.
 */
function exportarDoFormulario(formato, mov) {
  garantirPlanilha_();
  mov = mov || {};
  var etapas = etapasPelasContas_(mov);
  if (!etapas.length) etapas = [maiuscula_(mov.etapaAtual || mov.status) || 'APROVADA'];
  var sh = abaDoComprovante_();

  if (String(formato) === 'md') {
    var feitos = [], resumo = null;
    etapas.forEach(function (etapa, i) {
      resumo = preencherComprovante(movDaEtapa_(mov, etapa));
      feitos.push({
        etapa: etapa, posicao: i + 1, de: etapas.length,
        nome: '(sem PDF — exportado)',
        emitidoEm: carimboDaAba_(sh),
        cabecalho: resumo.cabecalho || {},
        assinantes: assinantesDaEtapa_(mov, etapa)
      });
    });
    /* Cada preenchimento guardou a cópia da SUA etapa; o que a janela deve
       reabrir é a movimentação como veio — como no `emitirMovimentacao_`. */
    guardarMovimentacao_(mov);
    return {
      formato: 'md',
      nome: nomeDoArquivoDeRecuperacao_(mov.referencia),
      texto: textoDaRecuperacao_(mov, resumo, feitos, 'exportado'),
      etapas: etapas
    };
  }

  var nome = nomeDaExportacao_(mov.referencia);
  var r = entregarPlanilha_(nome, String(formato) === 'excel', function (nova) {
    etapas.forEach(function (etapa) {
      preencherComprovante(movDaEtapa_(mov, etapa));
      SpreadsheetApp.flush();
      sh.copyTo(nova).setName(etapa);
    });
  });
  guardarMovimentacao_(mov);
  r.etapas = etapas;
  return r;
}

/** "CMP-26-007 - exportado 26_09_30": sem a etapa, porque o arquivo tem todas. */
function nomeDaExportacao_(referencia) {
  var fuso = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  return (nomeLimpo_(maiuscula_(referencia)) || 'SEM-REFERENCIA') + ' - exportado ' +
    Utilities.formatDate(new Date(), fuso, 'yy_MM_dd');
}

/** A hora carimbada no rodapé da aba, sem o "Emitido em". */
function carimboDaAba_(sh) {
  return String(sh.getRange(faixa_('B:K', 'NOTA')).getValue() || '')
    .replace(CABECALHO.emitidoEm, '').trim();
}

// ===========================================================================
// 2. DO MENU: A ABA COMO ESTÁ
// ===========================================================================

/** Menu → "Exportar o comprovante da aba". Uma janelinha com os três jeitos. */
function exportarComprovanteDaAba() {
  guardarIdDaPlanilha_();
  abaDoComprovante_();   // sem a aba, o erro sai aqui, e não na janelinha
  var tela = HtmlService.createHtmlOutput(telaDaExportacao_())
    .setWidth(520)
    .setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(tela, 'Exportar o comprovante da aba');
}

/**
 * A porta da janelinha do menu. A aba NÃO é preenchida: sai o que está nela.
 *
 * Excel e planilha do Google usam a cópia que já existia
 * (`salvarCopiaDoComprovante_`, no 05) — que sempre foi da aba como estava.
 * O .md é lido célula por célula (`comprovanteDaAba_`).
 */
function exportarDaAba(formato) {
  garantirPlanilha_();
  var sh = abaDoComprovante_();
  if (String(formato) === 'md') {
    carimbarEmissao_(sh);
    SpreadsheetApp.flush();
    var c = comprovanteDaAba_(sh);
    return { formato: 'md', nome: nomeDoArquivoDeRecuperacao_(c.referencia), texto: textoDaAba_(c) };
  }
  return salvarCopiaDoComprovante_(formato);
}

/**
 * O que está impresso na aba, lido numa passada só.
 *
 * É o que o PAPEL diz, não o que o formulário mandou: se alguém editou a aba
 * à mão, é a edição que sai. Por isso as contas vêm como estão escritas (em
 * caixa alta, com o "Nº" do cartão colado), e a importação (pedido a) é quem
 * procura cada uma no cadastro — e marca o que não achar, sem inventar.
 */
function comprovanteDaAba_(sh) {
  /* ATÉ A ÚLTIMA LINHA NOMEADA, seja ela qual for: perguntar a uma só (a do
     rodapé) apostaria que a ordem das linhas nunca muda. */
  var ultima = Math.max(lin_('NOTA'), lin_('TAB_' + MAX_LINHAS_LOTE), lin_('TAB_TOTAL'),
                        lin_('CARGO_2'), lin_('NOME_2'));
  var bloco = sh.getRange('A1:V' + ultima).getValues();
  function em(colunas, idLinha) {
    var canto = cantoDaFaixa_(faixa_(colunas, idLinha));
    var v = bloco[canto.linha - 1][canto.coluna - 1];
    return v == null ? '' : v;
  }
  function texto(colunas, idLinha) { return String(em(colunas, idLinha)).trim(); }

  var lancamentos = [];
  for (var i = 1; i <= MAX_LINHAS_LOTE; i++) {
    var id = 'TAB_' + i;
    var l = { data: dataDaCelula_(em('B:F', id)), documento: texto('G:K', id),
              beneficiario: texto('L:S', id), valor: numeroDaCelula_(em('T:V', id)) };
    if (l.data || l.documento || l.beneficiario || l.valor) lancamentos.push(l);
  }

  /* Os mesmos seis lugares de `escreverAssinantes_` (no 04), na mesma ordem:
     nome e cargo, com as colunas de cada um. */
  var lugares = [['C:I', 'NOME_1', 'C:I', 'CARGO_1'], ['K:O', 'NOME_1', 'K:O', 'CARGO_1'],
                 ['R:U', 'NOME_1', 'R:U', 'CARGO_1'], ['C:I', 'NOME_2', 'C:I', 'CARGO_2'],
                 ['K:O', 'NOME_2', 'K:O', 'CARGO_2'], ['S:U', 'NOME_2', 'U:U', 'CARGO_2']];
  var assinantes = lugares.map(function (p) {
    return { nome: texto(p[0], p[1]), cargo: texto(p[2], p[3]) };
  });

  var contaOrigem = separarCartao_(texto('E:M', 'CONTAS'));
  var contaDestino = separarCartao_(texto('P:V', 'CONTAS'));
  return {
    fonte: 'aba',
    referencia: texto('G:H', 'IDENT_1'),
    numeracaoSiga: texto('K:L', 'IDENT_1'),
    status: texto('O:S', 'IDENT_1'),
    data: dataDaCelula_(em('G:L', 'IDENT_2')),
    tipoEscrito: texto('G:V', 'TIPO'),
    observacaoImpressa: texto('G:V', 'OBS'),
    contaOrigem: contaOrigem.conta, cartaoOrigem: contaOrigem.cartao,
    contaDestino: contaDestino.conta, cartaoDestino: contaDestino.cartao,
    modo: lancamentos.length ? 'lote' : 'unico',
    valor: numeroDaCelula_(em('O:P', 'IDENT_2')),
    lancamentos: lancamentos,
    assinantes: assinantes,
    impresso: {
      titulo: texto('B:V', 'TITULO'),
      extenso: texto('R:V', 'IDENT_2'),
      piaOrigem: texto('D:L', 'ORIGEM_DESTINO'),
      piaDestino: texto('O:V', 'ORIGEM_DESTINO'),
      cnpjOrigem: texto('D:L', 'CNPJ'),
      cnpjDestino: texto('O:V', 'CNPJ'),
      totalDoLote: numeroDaCelula_(em('T:V', 'TAB_TOTAL')),
      cabecalho: [texto('B:I', 'CAB_2'), texto('J:Q', 'CAB_2'), texto('R:V', 'CAB_2')]
        .filter(function (x) { return x; }).join(' · '),
      emitidoEm: texto('B:K', 'NOTA').replace(CABECALHO.emitidoEm, '').trim()
    }
  };
}

/** "PIA-COXIM: CARTÃO DE DÉBITO Nº 127698421" → a conta e o cartão, separados. */
function separarCartao_(texto) {
  var achado = String(texto || '').match(/^(.*?)\s+Nº\s*(\d[\d.\- ]*)$/);
  return achado ? { conta: achado[1].trim(), cartao: achado[2].trim() }
                : { conta: String(texto || '').trim(), cartao: '' };
}

/** Uma data da folha (Date ou texto dd/mm/aaaa) → 'aaaa-mm-dd'; o resto, ''. */
function dataDaCelula_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.getFullYear() + '-' + ('0' + (v.getMonth() + 1)).slice(-2) + '-' +
      ('0' + v.getDate()).slice(-2);
  }
  var p = String(v || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return p ? p[3] + '-' + p[2] + '-' + p[1] : '';
}

/** Número da folha; texto "1.800,00" também vale (alguém pode ter digitado). */
function numeroDaCelula_(v) {
  if (typeof v === 'number') return v;
  var t = String(v || '').replace(/[R$\s]/g, '');
  if (!t) return 0;
  if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
  var n = Number(t);
  return isNaN(n) ? 0 : n;
}

/**
 * O .md de uma aba. A mesma cara do .md do PDF (`textoDaRecuperacao_`), com
 * duas diferenças que ele precisa saber ao abrir: veio da ABA, e nada foi
 * emitido. O bloco do fim leva `"fonte": "aba"` — é por ele que a importação
 * sabe que as contas estão como foram impressas.
 */
function textoDaAba_(c) {
  var t = [];
  var celula = celulaMd_;
  var im = c.impresso;
  var ref = c.referencia || '(sem Referência)';

  t.push('# Comprovante ' + ref + ' — tirado da aba Comprovante');
  t.push('');
  t.push('Exportado pelo Gerador de comprovantes para o SIGA em ' + (im.emitidoEm || '—') +
    ', **da aba como ela estava** — inclusive o que foi editado à mão. **Nenhum ' +
    'PDF foi gerado e a Referência não foi gasta.** Ao importar este arquivo, o ' +
    'que não bater com a aba Cadastros vem marcado para escolher de novo.');
  t.push('');

  t.push('## Identificação');
  t.push('');
  t.push('- **Título:** ' + (im.titulo || '—'));
  t.push('- **Referência:** ' + ref);
  t.push('- **Numeração SIGA:** ' + (c.numeracaoSiga || '—'));
  t.push('- **Status:** ' + (c.status || '—'));
  t.push('- **Data de emissão:** ' + (dataBrasileira_(c.data) || '—'));
  t.push('- **Tipo Transferência:** ' + (c.tipoEscrito || '(em branco)'));
  t.push('- **Observação:** ' + (c.observacaoImpressa || '(em branco)'));
  t.push('');

  t.push('## Valor');
  t.push('');
  t.push('- **' + (c.lancamentos.length ? 'Valor Total' : 'Valor') + ':** ' +
    emReaisNoServidor_(c.lancamentos.length ? (im.totalDoLote || c.valor) : c.valor) +
    ' ' + (im.extenso || ''));
  if (c.lancamentos.length) {
    t.push('');
    t.push('| Data | Documento / cartão | Beneficiário / finalidade | Valor |');
    t.push('|---|---|---|---:|');
    c.lancamentos.forEach(function (l) {
      t.push('| ' + (dataBrasileira_(l.data) || '') + ' | ' + celula(l.documento) +
        ' | ' + celula(l.beneficiario) + ' | ' + emReaisNoServidor_(l.valor) + ' |');
    });
  }
  t.push('');

  t.push('## Origem e destino');
  t.push('');
  t.push('| | Origem | Destino |');
  t.push('|---|---|---|');
  t.push('| PIA | ' + celula(im.piaOrigem) + ' | ' + celula(im.piaDestino) + ' |');
  t.push('| Conta | ' + celula(nucleoContaComCartao(c.contaOrigem, c.cartaoOrigem)) +
    ' | ' + celula(nucleoContaComCartao(c.contaDestino, c.cartaoDestino)) + ' |');
  t.push('| CNPJ | ' + celula(im.cnpjOrigem) + ' | ' + celula(im.cnpjDestino) + ' |');
  t.push('');
  t.push('- **Cabeçalho:** ' + (im.cabecalho || '—'));
  t.push('');

  t.push('## Assinantes');
  t.push('');
  t.push(listaDeAssinantes_(c.assinantes));
  t.push('');

  t.push('## Dados para o sistema');
  t.push('');
  t.push('```json');
  t.push(JSON.stringify(c, null, 2));
  t.push('```');
  t.push('');
  return t.join('\n');
}

/**
 * A janelinha do menu — montada como texto, como a do relatório.
 *
 * A armadilha de sempre: erro de sintaxe no <script> abre a janela com os
 * botões mortos, sem mensagem. A bancada monta este texto, confere a sintaxe
 * e clica nos botões dele num navegador de mentira. Nada de alert/confirm.
 */
function telaDaExportacao_() {
  return [
    '<!DOCTYPE html><html><head><base target="_top"><meta charset="utf-8"><style>',
    'body{font-family:Arial,Helvetica,sans-serif;font-size:14px;margin:0;padding:16px;color:#202124}',
    '.dica{font-size:13px;color:#5f6368;line-height:1.5;margin:0 0 14px}',
    '.botoes{display:flex;flex-direction:column;gap:8px;margin-top:6px}',
    'button,a.b{font-family:inherit;font-size:14px;padding:9px 16px;border:1px solid #dadce0;',
    ' border-radius:4px;background:#fff;color:#1a73e8;cursor:pointer;text-decoration:none;text-align:left}',
    'button.forte,a.b.forte{background:#1a73e8;border-color:#1a73e8;color:#fff}',
    'button:disabled{opacity:.55;cursor:default}',
    '#resultado{display:none;margin-top:14px;padding:10px 12px;border-left:4px solid;',
    ' border-radius:4px;white-space:pre-wrap;font-size:13px;line-height:1.5}',
    '#resultado.ok{background:#e6f4ea;border-color:#34a853;color:#188038}',
    '#resultado.erro{background:#fce8e6;border-color:#d93025;color:#d93025}',
    '#resultado.indo{background:#e8f0fe;border-color:#1a73e8;color:#1a73e8}',
    '#links{display:none;margin-top:10px;flex-direction:row;flex-wrap:wrap}',
    '</style></head><body>',

    '<p class="dica">Sai <b>o que está na aba Comprovante agora</b>, inclusive o que ',
    'foi editado à mão. Nenhum PDF é gerado e <b>a Referência não é gasta</b>. ',
    'Para exportar o que está no formulário, use o botão "Exportar…" dele.</p>',

    '<div class="botoes">',
    '<button type="button" class="forte" id="btExcel">Baixar em Excel (.xlsx) — vai para o computador</button>',
    '<button type="button" id="btGoogle">Salvar planilha do Google na pasta — fica no Drive</button>',
    '<button type="button" id="btMd">Baixar o .md — vai para o computador</button>',
    '<button type="button" id="btFechar">Fechar</button>',
    '</div>',

    '<div id="resultado"></div>',
    '<div id="links" class="botoes"></div>',

    '<script>',
    'function elem(id){return document.getElementById(id);}',
    'function recado(texto,classe){var r=elem("resultado");r.textContent=texto;',
    ' r.className=classe;r.style.display="block";}',
    'function travar(sim){["btExcel","btGoogle","btMd"].forEach(function(id){elem(id).disabled=sim;});}',
    'function falhou(e){travar(false);',
    ' recado("NÃO DEU CERTO. "+(e&&e.message?e.message:String(e)),"erro");}',
    'function link(rotulo,url,forte,baixar){var a=document.createElement("a");a.className="b"+(forte?" forte":"");',
    ' a.href=url;a.textContent=rotulo;if(baixar){a.download=baixar;}else{a.target="_blank";a.rel="noopener";}return a;}',
    'function mostrarLinks(lista){var l=elem("links");l.innerHTML="";',
    ' lista.forEach(function(a){l.appendChild(a);});l.style.display="flex";}',
    'function baixar(url,nome){var a=link("",url,false,nome);a.style.display="none";',
    ' document.body.appendChild(a);a.click();document.body.removeChild(a);}',
    'function endereco(base64,tipo){try{var b=atob(base64),n=new Uint8Array(b.length);',
    ' for(var i=0;i<b.length;i++){n[i]=b.charCodeAt(i);}',
    ' return window.URL.createObjectURL(new Blob([n],{type:tipo}));}',
    ' catch(e){return "data:"+tipo+";base64,"+base64;}}',
    'function deTexto(texto){try{return window.URL.createObjectURL(new Blob([texto],{type:"text/markdown;charset=utf-8"}));}',
    ' catch(e){return "data:text/markdown;charset=utf-8,"+encodeURIComponent(texto);}}',
    'function pedir(formato,recadoIndo){travar(true);elem("links").style.display="none";recado(recadoIndo,"indo");',
    ' google.script.run.withSuccessHandler(function(r){travar(false);',
    '  if(r.formato==="excel"){var u=endereco(r.base64,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");',
    '   baixar(u,r.nome);recado("Excel baixado: "+r.nome+". Foi para o seu computador (pasta Downloads) e NÃO ficou no Drive.","ok");',
    '   mostrarLinks([link("Baixar de novo",u,true,r.nome)]);return;}',
    '  if(r.formato==="md"){var m=deTexto(r.texto);baixar(m,r.nome);',
    '   recado(".md baixado: "+r.nome+". Foi para o seu computador (pasta Downloads).","ok");',
    '   mostrarLinks([link("Baixar de novo",m,true,r.nome)]);return;}',
    '  recado("Planilha salva no Drive: "+r.nome+", na pasta "+r.pasta+". Nada foi baixado.","ok");',
    '  mostrarLinks([link("Abrir o arquivo",r.urlArquivo,true),link("Abrir a pasta",r.urlPasta,false)]);',
    ' }).withFailureHandler(falhou).exportarDaAba(formato);}',
    'elem("btExcel").addEventListener("click",function(){pedir("excel","Montando o arquivo do Excel…");});',
    'elem("btGoogle").addEventListener("click",function(){pedir("google","Salvando a planilha na pasta…");});',
    'elem("btMd").addEventListener("click",function(){pedir("md","Lendo a aba e montando o .md…");});',
    'elem("btFechar").addEventListener("click",function(){google.script.host.close();});',
    '</script></body></html>'
  ].join('');
}

// ===========================================================================
// 3. A PLANILHA QUE SAI — UMA ABA POR ETAPA
// ===========================================================================

/**
 * Cria a planilha, deixa `encher(nova)` pôr as abas nela, e entrega: no Drive
 * (Google) ou em bytes para baixar (Excel). A regra de entregar é a mesma da
 * cópia de sempre (`entregarCopia_`, no 05) — mora num lugar só.
 *
 * A aba vazia da planilha nova é guardada ANTES e apagada por referência: o
 * nome dela muda com o idioma da conta ("Página1", "Sheet1").
 */
function entregarPlanilha_(nome, comoExcel, encher) {
  var nova = SpreadsheetApp.create(nome);
  var vazia = nova.getSheets()[0];
  try {
    encher(nova);
    nova.deleteSheet(vazia);
    SpreadsheetApp.flush();
  } catch (e) {
    /* A planilha temporária não pode ficar solta no Drive com nome de
       comprovante porque o preenchimento de uma etapa falhou. */
    try { DriveApp.getFileById(nova.getId()).setTrashed(true); } catch (e2) { /* sem saída */ }
    throw e;
  }
  return entregarCopia_(nova, nome, comoExcel);
}

// ===========================================================================
// 4. A PASTA DOS ARQUIVOS (pedido f)
// ===========================================================================
//
// Ele pediu que abrisse o Explorador do Windows, com o Google Drive para
// computador instalado. NÃO É POSSÍVEL: uma página da web não abre uma pasta
// do computador (trava de segurança do navegador), e o Drive para computador
// não oferece endereço que faça isso. Abre no navegador — dito a ele antes.

/** A porta do botão "Abrir a pasta" do formulário. */
function pastaDosArquivos() {
  garantirPlanilha_();
  var pasta = pastaDeDestino_();
  return { nome: pasta.getName(), url: pasta.getUrl() };
}

/**
 * Menu → "Abrir a pasta dos arquivos". Uma janelinha com o link: uma janela
 * do Apps Script só consegue abrir outra aba por um clique num link de
 * verdade — abrir sozinha é o que o bloqueador de janelas barra.
 */
function abrirPastaDosArquivos() {
  var pasta = pastaDeDestino_();
  var tela = HtmlService.createHtmlOutput(telaDaPasta_(pasta.getName(), pasta.getUrl()))
    .setWidth(440)
    .setHeight(190);
  SpreadsheetApp.getUi().showModalDialog(tela, 'A pasta dos arquivos');
}

function telaDaPasta_(nome, url) {
  function escapar(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  return [
    '<!DOCTYPE html><html><head><base target="_top"><meta charset="utf-8"><style>',
    'body{font-family:Arial,Helvetica,sans-serif;font-size:14px;margin:0;padding:16px;color:#202124}',
    '.dica{font-size:13px;color:#5f6368;line-height:1.5;margin:0 0 14px}',
    'a.b,button{display:inline-block;font-family:inherit;font-size:14px;padding:9px 16px;',
    ' border:1px solid #dadce0;border-radius:4px;background:#fff;color:#1a73e8;cursor:pointer;',
    ' text-decoration:none;margin-right:8px}',
    'a.b.forte{background:#1a73e8;border-color:#1a73e8;color:#fff}',
    '</style></head><body>',
    '<p class="dica">PDFs, <b>.md</b> e planilhas ficam na pasta <b>', escapar(nome),
    '</b>, no Google Drive. Ela abre numa aba nova do navegador.</p>',
    '<a class="b forte" id="abrir" href="', escapar(url), '" target="_blank" rel="noopener">Abrir a pasta</a>',
    '<button type="button" id="btFechar">Fechar</button>',
    '<script>',
    'document.getElementById("btFechar").addEventListener("click",function(){google.script.host.close();});',
    '</script></body></html>'
  ].join('');
}
