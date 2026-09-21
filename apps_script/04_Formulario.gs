/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * ETAPA 4: o formulário — a porta de entrada de todo preenchimento.
 *
 * O QUE ESTE ARQUIVO FAZ
 * É o lado de dentro (o "servidor") do formulário. Ele:
 *   - junta todas as listas da aba Cadastros e entrega prontas para a tela;
 *   - recebe de volta o que foi preenchido e escreve na aba Comprovante;
 *   - manda recalcular tudo (extenso, PIA, CNPJ, título, cabeçalho, soma);
 *   - gera o PDF sem sair do formulário;
 *   - guarda a movimentação inteira, com os assinantes de cada etapa, para a
 *     Etapa 5 poder emitir os 2 ou 3 PDFs depois.
 *
 * A tela em si está no arquivo `04_Formulario_Tela.html`.
 *
 * POR QUE A TELA NÃO SE CHAMA `04_Formulario`
 * O editor do Apps Script **não deixa dois arquivos terem o mesmo nome**,
 * ainda que um seja Script e o outro HTML: ele responde "Já existe um arquivo
 * com este nome". A extensão não conta como diferença. Por isso a tela é
 * `04_Formulario_Tela`, e é esse o nome que `createHtmlOutputFromFile` procura
 * — se um dia alguém renomear o arquivo da tela, tem de mudar aqui também.
 *
 * POR QUE A TELA É UM ARQUIVO SEPARADO, E NÃO TEXTO MONTADO AQUI DENTRO
 * As outras janelas deste projeto montam o HTML juntando pedaços de texto
 * dentro do `.gs`. Funciona para janela pequena, mas cobra caro: um `\n` fora
 * do lugar, uma aspa a mais, e a janela abre com **todos os botões mortos e
 * nenhuma mensagem de erro** — armadilha já paga neste projeto, duas vezes.
 * Esta tela é grande demais para correr esse risco. Num arquivo `.html` de
 * verdade nada é "gerado": o que está escrito é o que roda, o editor do Apps
 * Script mostra os erros, e os dados chegam depois, por `google.script.run`.
 *
 * REGRAS DESTE ARQUIVO (todas vêm de docs/00_estado_do_projeto.md)
 *   - **Nenhum lado mexe no outro.** Trocar a origem não pode mexer no
 *     destino, e o contrário também não. A única coisa que os dois lados
 *     mudam juntos é a lista de TIPOS, que depende das duas PIAs.
 *   - **A conta é o dado de entrada; a PIA é consequência.** A PIA na tela é
 *     um filtro para achar a conta mais rápido; quem manda é a conta.
 *   - **Avisar, nunca bloquear.** Nada aqui recusa. Tudo o que está estranho
 *     vira aviso na tela, e o botão continua funcionando.
 *   - **Tudo em CAIXA ALTA**, menos nome e cargo dos signatários.
 *   - **Zero `alert()` e `confirm()`** — o Google os bloqueia nestas janelas.
 */

// ===========================================================================
// 1. ABRIR O FORMULÁRIO
// ===========================================================================

/**
 * Item de menu "Preencher comprovante (formulário)".
 *
 * É uma janela sobre a planilha. A largura de 920 px é a da tela de
 * computador; no celular ela encolhe sozinha e os campos viram uma coluna só
 * (isso está no CSS do arquivo `04_Formulario_Tela.html`).
 */
function abrirFormularioCmi() {
  var tela = HtmlService.createHtmlOutputFromFile('04_Formulario_Tela')
    .setWidth(920)
    .setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(tela, 'Comprovante de Movimentação Interna');
}

// ===========================================================================
// 2. AS LISTAS QUE A TELA PRECISA
// ===========================================================================

/**
 * Entrega, de uma vez só, tudo o que a tela precisa para montar os campos.
 *
 * Uma ida só ao servidor. Chamar o Apps Script de dentro da janela é a parte
 * lenta (cada chamada vai e volta pela internet), então é melhor trazer tudo
 * junto na abertura e filtrar na própria tela, que é instantâneo.
 *
 * Repare em `piaChave`: é a PIA já normalizada por `pia_()` — a mesma função
 * que o resto do sistema usa para decidir se a movimentação gera 2 ou 3
 * documentos. A tela nunca recalcula isso por conta própria; ela só compara
 * os textos que chegam daqui. Assim não existe uma segunda regra, escrita em
 * outro lugar, que possa discordar desta.
 */
function dadosDoFormulario() {
  var contas = lerCadastro_('CONTAS').map(function (c) {
    return {
      texto: String(c['Texto que aparece na lista'] || '').trim(),
      pia: String(c.PIA || '').trim(),
      piaChave: pia_(c.PIA),
      piaEscrita: piaEscrita_(c.PIA),
      adm: String(c.ADM || '').trim(),
      grupo: String(c['Grupo contábil'] || '').trim(),
      codigo: String(c['Cód. SIGA'] || '').trim(),
      ativa: /^ATIVA/i.test(String(c.Status || '').trim())
    };
  }).filter(function (c) { return c.texto; });

  var cartoes = lerCadastro_('CARTOES').map(function (c) {
    return {
      numero: String(c['Nº conta do cartão'] || '').trim(),
      titular: String(c['Titular (PagCorp)'] || '').trim(),
      pia: String(c.PIA || '').trim(),
      piaChave: pia_(c.PIA),
      subTesouraria: String(c['Sub-tesouraria'] || '').trim(),
      contaPai: String(c['Conta pai PagCorp'] || '').trim(),
      nomeSiga: String(c['Nome conforme SIGA'] || '').trim(),
      ativo: /^ATIVO/i.test(String(c.Status || '').trim())
    };
  }).filter(function (c) { return c.numero; });

  var diaconos = lerCadastro_('DIACONOS').map(function (d) {
    return {
      nome: String(d.Nome || '').trim(),
      cargo: String(d.Cargo || '').trim(),
      frequencia: String(d['Frequência'] || '').trim()
    };
  }).filter(function (d) { return d.nome; });

  var tipos = lerCadastro_('TIPOS').map(function (t) {
    return {
      nome: String(t['Tipo de movimentação'] || '').trim(),
      sentido: String(t['Sentido crédito/débito'] || '').trim(),
      // "Sim" = só entre PIAs diferentes · "Não" = só dentro da mesma PIA ·
      // "Indiferente" = serve nos dois casos.
      entrePias: String(t['Entre PIAs diferentes'] || '').trim(),
      invertido: String(t['Sentido crédito/débito'] || '').toUpperCase().indexOf('INVERTIDO') >= 0,
      observacao: String(t['Observação'] || '').trim()
    };
  }).filter(function (t) { return t.nome; });

  var status = lerCadastro_('STATUS').map(function (s) {
    return {
      nome: String(s.Status || '').trim(),
      quandoUsar: String(s['Quando usar'] || '').trim(),
      etapa: String(s['Etapa da sequência'] || '').trim()
    };
  }).filter(function (s) { return s.nome; });

  // As PIAs saem do cadastro de CONTAS, e não do de ADMs: uma PIA sem nenhuma
  // conta cadastrada não serve como origem nem como destino.
  var vistas = {}, pias = [];
  contas.forEach(function (c) {
    if (!c.piaChave || vistas[c.piaChave]) return;
    vistas[c.piaChave] = true;
    pias.push({ chave: c.piaChave, escrita: c.piaEscrita, adm: c.adm, ativa: c.ativa });
  });

  return {
    contas: contas,
    cartoes: cartoes,
    diaconos: diaconos,
    tipos: tipos,
    status: status,
    pias: pias,
    proximaReferencia: proximaReferencia_(),
    hoje: Utilities.formatDate(new Date(),
      SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd'),
    maxLinhasLote: MAX_LINHAS_LOTE
  };
}

// ===========================================================================
// 3. AS ETAPAS DA MOVIMENTAÇÃO (2 ou 3 documentos)
// ===========================================================================

/**
 * Quais Status a movimentação vai percorrer.
 *
 * Regra central do projeto: mesma PIA nos dois lados → 2 documentos
 * (APROVADA → EFETIVADA); PIAs diferentes → 3 (APROVADA → PAGA → RECEBIDA).
 *
 * A comparação é pela **chave da PIA**, nunca pelo código da conta: o mesmo
 * código (10010 - CAIXA OBRA DA PIEDADE) existe em mais de uma PIA e são
 * contas diferentes entre si.
 */
function etapasDaMovimentacao_(piaChaveOrigem, piaChaveDestino) {
  var mesmaPia = piaChaveOrigem && piaChaveOrigem === piaChaveDestino;
  return mesmaPia ? ['APROVADA', 'EFETIVADA'] : ['APROVADA', 'PAGA', 'RECEBIDA'];
}

/** Versão que a tela chama, quando precisa recontar as etapas. */
function etapasDaMovimentacao(piaChaveOrigem, piaChaveDestino) {
  return etapasDaMovimentacao_(piaChaveOrigem, piaChaveDestino);
}

// ===========================================================================
// 4. ESCREVER NA ABA COMPROVANTE
// ===========================================================================

/**
 * Recebe o que a tela preencheu e escreve na aba Comprovante.
 *
 * `mov` é o objeto montado pelo formulário:
 *   referencia, numeracaoSiga, status, data ('aaaa-mm-dd'), tipo, observacao,
 *   contaOrigem, contaDestino, modo ('unico' | 'lote'), valor, lancamentos[],
 *   assinantesPorEtapa{}, etapaAtual
 *
 * Devolve um resumo do que foi escrito, para a tela mostrar.
 */
function preencherComprovante(mov) {
  var sh = abaDoComprovante_();
  mov = mov || {};

  var lancamentos = (mov.lancamentos || []).filter(function (l) {
    return l && (l.data || l.documento || l.beneficiario || Number(l.valor));
  });
  var emLote = mov.modo === 'lote' && lancamentos.length > 0;

  // 1) O modo da folha primeiro: é ele que mostra ou esconde a tabela do lote,
  //    e é preciso que as linhas estejam visíveis ANTES de escrever nelas —
  //    `somarLote_` pula linha escondida, e escreveríamos num lugar que o
  //    total nunca somaria.
  aplicarModoDoFormulario_(sh, emLote ? lancamentos.length : 0);

  // 2) Identificação.
  escrever_(sh, faixa_('G:H', 'IDENT_1'), maiuscula_(mov.referencia));
  escreverNumeracaoSiga_(sh, mov.numeracaoSiga);
  escrever_(sh, faixa_('O:P', 'IDENT_1'), maiuscula_(mov.status));
  escrever_(sh, faixa_('G:L', 'IDENT_2'), dataDoFormulario_(mov.data));
  escrever_(sh, faixa_('G:V', 'TIPO'), maiuscula_(mov.tipo));
  escrever_(sh, faixa_('G:V', 'OBS'), maiuscula_(mov.observacao));

  // 3) Origem e destino. Só a CONTA é escrita: a PIA, o CNPJ, o título e o
  //    cabeçalho saem dela, no passo 6.
  escrever_(sh, faixa_('E:M', 'CONTAS'), maiuscula_(mov.contaOrigem));
  escrever_(sh, faixa_('P:V', 'CONTAS'), maiuscula_(mov.contaDestino));

  // 4) A tabela do lote. Limpa as 32 linhas antes de escrever: sem isso,
  //    sobra de um lote maior ficaria escondida na folha e voltaria a aparecer
  //    no próximo comprovante com mais linhas.
  limparTabelaDoLote_(sh);
  if (emLote) {
    lancamentos.forEach(function (l, i) { escreverLancamento_(sh, i + 1, l); });
  } else {
    escrever_(sh, faixa_('O:P', 'IDENT_2'), Number(mov.valor) || 0);
  }

  // 5) Assinantes da etapa que está sendo impressa agora.
  escreverAssinantes_(sh, assinantesDaEtapa_(mov, mov.etapaAtual));

  // 6) Recalcula tudo pelas funções da Etapa 3 — as mesmas que a planilha
  //    usava sozinha. Não existe aqui nenhuma segunda versão dessas contas.
  somarLote_(sh);
  preencherPiaPelaConta_(sh);
  preencherCnpjPelaPia_(sh);
  atualizarTitulo_(sh);
  atualizarCabecalho_(sh);
  atualizarExtenso_(sh);
  carimbarEmissao_(sh);
  SpreadsheetApp.flush();

  guardarMovimentacao_(mov);

  return {
    status: 'OK',
    emLote: emLote,
    lancamentos: lancamentos.length,
    valor: sh.getRange(faixa_('O:P', 'IDENT_2')).getValue(),
    extenso: sh.getRange(faixaMulti_('R:V', 'IDENT_2', 'IDENT_2B')).getValue(),
    titulo: sh.getRange(faixa_('B:V', 'TITULO')).getValue(),
    piaOrigem: sh.getRange(faixa_('D:L', 'ORIGEM_DESTINO')).getValue(),
    piaDestino: sh.getRange(faixa_('O:V', 'ORIGEM_DESTINO')).getValue(),
    cnpjOrigem: sh.getRange(faixa_('D:L', 'CNPJ')).getValue(),
    cnpjDestino: sh.getRange(faixa_('O:V', 'CNPJ')).getValue()
  };
}

/**
 * Mostra ou esconde a tabela do lote.
 *
 * `aplicarModo_` (Etapa 1) só considera "lote" a partir de DOIS lançamentos.
 * O formulário precisa também do lote de **um** — é o caso do carregamento
 * avulso de cartão, em que a única coisa que identifica a movimentação é o
 * número do cartão, e ele só tem lugar na tabela.
 *
 * Em vez de repetir a conta da altura da folha aqui, chamamos `aplicarModo_`
 * normalmente e, no caso de um lançamento só, mostramos as três linhas da
 * tabela e devolvemos à linha de sobra a altura que ela perdeu. A conta
 * continua sendo a da Etapa 1 (`alturaDoPreenchimento_`), em um lugar só.
 */
function aplicarModoDoFormulario_(sh, quantosLancamentos) {
  aplicarModo_(sh, { lancamentos: quantosLancamentos, mostrarContas: true });
  if (quantosLancamentos !== 1) return;

  mostrar_(sh, 'TAB_CAB', true);
  mostrar_(sh, 'TAB_1', true);
  mostrar_(sh, 'TAB_TOTAL', true);

  var sobra = alturaDoPreenchimento_(sh);
  if (sobra > 2) {
    mostrar_(sh, 'PREENCHIMENTO', true);
    sh.setRowHeight(lin_('PREENCHIMENTO'), sobra);
  } else {
    mostrar_(sh, 'PREENCHIMENTO', false);
  }
  SpreadsheetApp.flush();
}

/**
 * A numeração do SIGA é opcional. Quando não existe, **o rótulo também sai**
 * do documento — um "numeração SIGA:" sozinho, sem número ao lado, parece
 * campo que alguém esqueceu de preencher.
 */
function escreverNumeracaoSiga_(sh, numeracao) {
  var texto = String(numeracao == null ? '' : numeracao).trim();
  sh.getRange(faixa_('I:J', 'IDENT_1')).setValue(texto ? 'numeração SIGA:' : '');
  sh.getRange(faixa_('K:L', 'IDENT_1')).setValue(maiuscula_(texto));
}

/** Apaga as 32 linhas da tabela do lote, visíveis ou não. */
function limparTabelaDoLote_(sh) {
  sh.getRange('B' + lin_('TAB_1') + ':V' + lin_('TAB_' + MAX_LINHAS_LOTE)).clearContent();
  sh.getRange(faixa_('T:V', 'TAB_TOTAL')).clearContent();
}

/** Escreve uma linha da tabela do lote. */
function escreverLancamento_(sh, posicao, lancamento) {
  var id = 'TAB_' + posicao;
  escrever_(sh, faixa_('B:F', id), dataDoFormulario_(lancamento.data));
  escrever_(sh, faixa_('G:K', id), maiuscula_(lancamento.documento));
  escrever_(sh, faixa_('L:S', id), maiuscula_(lancamento.beneficiario));
  escrever_(sh, faixa_('T:V', id), Number(lancamento.valor) || 0);
}

/**
 * Escreve os seis espaços de assinatura.
 *
 * Nome e cargo saem **como estão no cadastro**, sem caixa alta: são nomes
 * próprios, e essa é a exceção declarada à regra do documento todo em
 * maiúsculas. Espaço sem assinante fica em branco de propósito — o
 * comprovante pode ser gerado com menos de três e preenchido à caneta.
 */
function escreverAssinantes_(sh, assinantes) {
  var lugares = [
    { nome: faixa_('C:I', 'NOME_1'), cargo: faixa_('C:I', 'CARGO_1') },
    { nome: faixa_('K:O', 'NOME_1'), cargo: faixa_('K:O', 'CARGO_1') },
    { nome: faixa_('R:U', 'NOME_1'), cargo: faixa_('R:U', 'CARGO_1') },
    { nome: faixa_('C:I', 'NOME_2'), cargo: faixa_('C:I', 'CARGO_2') },
    { nome: faixa_('K:O', 'NOME_2'), cargo: faixa_('K:O', 'CARGO_2') },
    // O sexto é o espaço de preenchimento manual, com os rótulos "Nome:" e
    // "Cargo/Ministério:" impressos ao lado.
    { nome: faixa_('S:U', 'NOME_2'), cargo: faixa_('U:U', 'CARGO_2') }
  ];

  lugares.forEach(function (lugar, i) {
    var quem = (assinantes && assinantes[i]) || {};
    sh.getRange(lugar.nome).setValue(String(quem.nome || '').trim());
    sh.getRange(lugar.cargo).setValue(String(quem.cargo || '').trim());
  });
}

/** Os assinantes de uma etapa, respeitando a resposta do "são os mesmos?". */
function assinantesDaEtapa_(mov, etapa) {
  var porEtapa = mov.assinantesPorEtapa || {};
  if (mov.mesmosAssinantes) return porEtapa.TODAS || [];
  return porEtapa[etapa] || porEtapa.TODAS || [];
}

// ===========================================================================
// 5. GERAR O PDF SEM SAIR DO FORMULÁRIO
// ===========================================================================

/**
 * Preenche e gera o PDF da etapa escolhida, devolvendo os endereços para a
 * própria tela mostrar.
 *
 * Não chama `gerarPdfDoComprovante()` porque aquela função conversa por
 * `ui.alert` e abre uma janela própria — e uma janela não pode abrir outra
 * por cima de si. O trabalho de verdade (conferir a grade, pedir o PDF ao
 * Google, escolher a pasta, dar nome ao arquivo) continua sendo o da Etapa 5:
 * as funções chamadas abaixo são todas de lá.
 */
function preencherEGerarPdf(mov) {
  var resumo = preencherComprovante(mov);
  var sh = abaDoComprovante_();

  var problemas = conferirGrade_(sh);

  carimbarEmissao_(sh);
  SpreadsheetApp.flush();

  var resposta = UrlFetchApp.fetch(urlDeExportacao_(sh), {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  if (resposta.getResponseCode() !== 200) {
    throw new Error('O Google recusou o pedido do PDF (código ' +
      resposta.getResponseCode() + '). Tente de novo daqui a pouco.');
  }

  var nome = nomeDoArquivoPdf_(sh);
  var pasta = pastaDeDestino_();
  var arquivo = pasta.createFile(resposta.getBlob().setName(nome));

  resumo.pdf = {
    nome: nome,
    pasta: pasta.getName(),
    urlArquivo: arquivo.getUrl(),
    urlPasta: pasta.getUrl(),
    problemas: problemas
  };
  return resumo;
}

// ===========================================================================
// 6. GUARDAR A MOVIMENTAÇÃO PARA A ETAPA 5
// ===========================================================================

/**
 * Guarda a última movimentação preenchida, inteira, junto com os assinantes
 * de cada etapa.
 *
 * A Etapa 4 imprime **uma** etapa por vez. Os 2 ou 3 PDFs da movimentação
 * vêm na Etapa 5, e para emiti-los é preciso lembrar o que foi respondido
 * aqui — inclusive quem assina cada etapa, quando não são os mesmos. Fica
 * guardado na própria planilha (não no computador de quem preencheu), para
 * que outro diácono possa continuar de onde o primeiro parou.
 */
var CHAVE_MOVIMENTACAO = 'CMI_ULTIMA_MOVIMENTACAO';

function guardarMovimentacao_(mov) {
  try {
    PropertiesService.getDocumentProperties()
      .setProperty(CHAVE_MOVIMENTACAO, JSON.stringify(mov));
  } catch (e) {
    // Guardar é conveniência, não requisito: se falhar, o comprovante já foi
    // escrito na aba e nada do que o usuário fez se perde.
  }
}

/** A última movimentação guardada, ou null. Usada pela Etapa 5. */
function ultimaMovimentacao_() {
  try {
    var texto = PropertiesService.getDocumentProperties().getProperty(CHAVE_MOVIMENTACAO);
    return texto ? JSON.parse(texto) : null;
  } catch (e) {
    return null;
  }
}

// ===========================================================================
// 7. AUXILIARES
// ===========================================================================

/**
 * Escreve um valor numa faixa, deixando a célula em branco quando não há
 * valor. `setValue('')` apaga; `setValue(0)` escreveria um zero de verdade,
 * que num campo de valor é informação, não vazio — por isso o número passa
 * direto e só o texto vazio vira limpeza.
 */
function escrever_(sh, intervalo, valor) {
  sh.getRange(intervalo).setValue(valor === undefined || valor === null ? '' : valor);
}

/** Caixa alta, como o SIGA escreve. Nomes de signatários não passam por aqui. */
function maiuscula_(texto) {
  return String(texto == null ? '' : texto).trim().toUpperCase();
}

/**
 * Converte a data do formulário ('aaaa-mm-dd') em data de planilha.
 *
 * `new Date('2026-09-06')` seria lido como meia-noite em Londres, e em
 * Coxim (UTC-4) viraria dia 5. Montando com ano, mês e dia separados a data
 * nasce no fuso da planilha e o dia não anda para trás.
 */
function dataDoFormulario_(texto) {
  var partes = String(texto || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!partes) return '';
  return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
}
