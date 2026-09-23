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
 *   - **A Referência nunca é digitada** no caminho normal: ela é gerada pelo
 *     sistema e só é consumida quando o PDF sai. Ver a seção 6.
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
  // A janela não é o arquivo .html puro: é ele com as regras do
  // `06_Tipos_E_Regras.gs` coladas dentro, na hora. É o que faz existir uma
  // cópia só das regras — ver o cabeçalho daquele arquivo.
  /* A MAIOR QUE O GOOGLE DEIXAR. Pedido dele: a janela grande, com todos os
     campos à vista. O Apps Script não tem "tela cheia" — o tamanho da janela
     é pedido aqui e o Google o LIMITA ao navegador de quem abre. Pedir mais
     do que cabe não dá erro: ele entrega o que cabe. Por isso o número é
     generoso de propósito, em vez de um palpite sobre o monitor dos outros
     diáconos.

     E de dentro da janela não dá para aumentá-la: ela roda num quadro
     fechado (iframe), sem alcance ao que está em volta. Quem decide o
     tamanho é esta linha, e mais ninguém.

     A tela se arruma em COLUNAS a partir de 1100 px de largura (ver o CSS do
     `04_Formulario_Tela.html`). Medido em navegador: a partir de mais ou
     menos 1400 x 810 ela cabe inteira, sem rolar. Abaixo disso, rola — e
     rolar é melhor do que espremer. */
  guardarIdDaPlanilha_();
  var tela = HtmlService.createHtmlOutput(telaComAsRegras_())
    .setWidth(1600)
    .setHeight(1000);
  SpreadsheetApp.getUi().showModalDialog(tela, 'Comprovante de Movimentação Interna');
}

/* ===========================================================================
   1b. A MESMA TELA, NUMA ABA INTEIRA

   POR QUE ISTO PRECISOU EXISTIR, com os números que decidiram:

   A janela do Sheets vive dentro da aba do navegador, e o navegador dele tem
   escala de 175%. Numa tela física de 1920 x 1080, isso faz o navegador
   enxergar **1097 x 617** — e, tirando a barra do Chrome e a moldura da
   própria janela do Google, sobram uns 400 px de altura para um formulário
   que precisa de 810. Não é um ajuste de CSS que resolve: **nenhum tamanho
   de modal cabe nesse espaço.** Foi medido antes de escrever esta linha.

   Numa aba inteira a mesma tela tem a altura toda do navegador, e aí cabe.

   O PREÇO, que tem de ser dito e não escondido: uma aba inteira é um **App
   da Web**, e um App da Web precisa ser PUBLICADO uma vez, com as telas de
   autorização do Google. Enquanto não for, o link nem aparece — e o
   formulário continua funcionando pela janela, como sempre.
=========================================================================== */

/**
 * O que o navegador pede quando alguém abre o endereço do App da Web.
 *
 * `e` chega com os parâmetros do endereço. O id da planilha vem por ali
 * (`?planilha=...`) ou, se não vier, do que ficou guardado na última vez que
 * alguém abriu o formulário pela planilha.
 */
function doGet(e) {
  var id = (e && e.parameter && e.parameter.planilha) || idDaPlanilhaGuardado_();
  if (!id) {
    return HtmlService.createHtmlOutput(
      '<p style="font-family:Arial;padding:24px;line-height:1.6">' +
      'Esta página é o formulário do <b>Gerador de CMI</b>, mas ela ainda não ' +
      'sabe de qual planilha.<br><br>Abra a planilha, use o menu ' +
      '<b>Tesouraria CMI → Preencher comprovante</b> uma vez, feche a janela e ' +
      'recarregue esta página.</p>');
  }
  PropertiesService.getDocumentProperties();   // sem efeito aqui; ver garantirPlanilha_
  guardarIdDaPlanilha_(id);
  SpreadsheetApp.setActiveSpreadsheet(SpreadsheetApp.openById(id));

  return HtmlService.createHtmlOutput(telaComAsRegras_(true))
    .setTitle('Comprovante de Movimentação Interna')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Garante que existe uma planilha ativa antes de qualquer coisa.
 *
 * Numa janela do Sheets, `getActive()` já devolve a planilha. **Num App da
 * Web ele devolve nada** — cada clique da tela é uma execução nova, solta, sem
 * planilha nenhuma. Sem esta linha no começo de cada porta de entrada, o
 * formulário abriria bonito na aba e estouraria no primeiro botão, com um
 * erro que não diz nada sobre a causa.
 */
function garantirPlanilha_() {
  if (SpreadsheetApp.getActive()) return;
  var id = idDaPlanilhaGuardado_();
  if (!id) {
    throw new Error('Esta página perdeu a ligação com a planilha. Abra a ' +
      'planilha, use o menu Tesouraria CMI uma vez e recarregue esta aba.');
  }
  SpreadsheetApp.setActiveSpreadsheet(SpreadsheetApp.openById(id));
}

/* O id fica nas PROPRIEDADES DO SCRIPT, e não nas do documento: num App da
   Web não há documento ativo, então as propriedades do documento não existem
   — era justamente onde o id não poderia estar. */
function guardarIdDaPlanilha_(id) {
  try {
    var qual = id || SpreadsheetApp.getActive().getId();
    PropertiesService.getScriptProperties().setProperty('ID_DA_PLANILHA', qual);
  } catch (e) { /* sem planilha ativa e sem id: não há o que guardar */ }
}

function idDaPlanilhaGuardado_() {
  return PropertiesService.getScriptProperties().getProperty('ID_DA_PLANILHA') || '';
}

/**
 * O endereço da aba inteira, se já tiver sido publicado.
 *
 * Vazio quer dizer "ainda não publicaram", e aí a tela não oferece o link —
 * oferecer um caminho que não existe é pior do que não oferecer nenhum.
 */
function urlDaTelaCheia_() {
  var url = String(lerControle_('URL_TELA_CHEIA') || '').trim();
  if (!url) return '';
  var id = idDaPlanilhaGuardado_();
  if (!id) return url;
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'planilha=' + encodeURIComponent(id);
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
  garantirPlanilha_();
  var contas = lerCadastro_('CONTAS').map(function (c) {
    return {
      texto: String(c['Texto que aparece na lista'] || '').trim(),
      pia: String(c.PIA || '').trim(),
      piaChave: pia_(c.PIA),
      piaEscrita: piaEscrita_(c.PIA),
      adm: String(c.ADM || '').trim(),
      grupo: String(c['Grupo contábil'] || '').trim(),
      codigo: String(c['Cód. SIGA'] || '').trim(),
      natureza: String(c.Natureza || '').trim().toUpperCase(),
      // BB, SANT, ACG... Vazio nos caixas, que não pertencem a instituição
      // nenhuma. É por ela que a tela sabe que transferência bancária só vale
      // dentro da mesma instituição, e TED e PIX só entre diferentes.
      instituicao: String(c['Instituição'] || '').trim().toUpperCase(),
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

  var formas = todasAsFormas_();

  /* A FINALIDADE é a única das cinco perguntas que o sistema não deduz, então
     a tela precisa das duas listas inteiras para montar a cascata sem ir ao
     Google a cada tecla — é a mesma razão das regras entre contas. */
  var finalidades = finalidadesCadastradas_();
  var regrasDeFinalidade = regrasDeFinalidade_();

  var relacoes = relacoesNormalizadas_();

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
    formas: formas,
    finalidades: finalidades,
    regrasDeFinalidade: regrasDeFinalidade,
    relacoes: relacoes,
    restricoesAtivas: restricoesAtivas_(),
    praxeCartaoNaMesmaPia: praxeDoCartaoLigada_(),
    naturezasValidas: naturezasValidas_(),
    arvore: arvoreDeTipos_(),
    status: status,
    pias: pias,
    urlTelaCheia: urlDaTelaCheia_(),

    /* O ENDEREÇO DA PLANILHA vai junto por causa da aba inteira: quando o
       navegador recusa fechá-la (toda aba aberta de um favorito), a tela
       oferece VOLTAR para a planilha, que é o que a pessoa queria ao clicar
       em fechar. Fechar era o meio, não o fim. */
    urlDaPlanilha: SpreadsheetApp.getActive().getUrl(),
    proximaReferencia: proximaReferencia_(),
    hoje: Utilities.formatDate(new Date(),
      SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd'),
    maxLinhasLote: MAX_LINHAS_LOTE,

    // O último preenchimento volta com a janela. Na tesouraria, um lançamento
    // costuma parecer com o anterior — mesma origem, mesmo tipo, mesmos
    // assinantes — e recomeçar do zero a cada vez é redigitar o que já estava
    // certo. A Referência é a exceção: essa vem sempre nova.
    ultimo: ultimaMovimentacao_()
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
  garantirPlanilha_();
  var sh = abaDoComprovante_();
  mov = mov || {};

  // A regra entre contas é conferida aqui, no servidor, e não só na tela.
  conferirRegraEntreContas_(mov);

  var lancamentos = (mov.lancamentos || []).filter(function (l) {
    return l && (l.data || l.documento || l.beneficiario || Number(l.valor));
  });
  var emLote = mov.modo === 'lote' && lancamentos.length > 0;

  // TUDO o que este trecho escreve entra numa fila só e vai para o Google num
  // pedido único — visibilidade das linhas, altura, valores, assinantes. Era
  // aqui que se perdiam os segundos: cada operação sozinha é uma viagem pela
  // internet. Ver `00_Escrita_Rapida.gs`.
  var lote = novoLoteDeEscrita_(sh);

  // 1) O modo da folha primeiro: é ele que mostra ou esconde a tabela do lote.
  aplicarModoDoFormulario_(sh, emLote ? lancamentos.length : 0, lote);

  // 2) Identificação. Daqui até o passo 5 as escritas entram numa fila e são
  //    gravadas de uma vez, pulando as células que já estão com o valor certo.
  abrirEscritor_();
  escrever_(sh, faixa_('G:H', 'IDENT_1'), maiuscula_(mov.referencia));
  escreverNumeracaoSiga_(sh, mov.numeracaoSiga);
  escrever_(sh, faixa_('O:S', 'IDENT_1'), maiuscula_(mov.status));
  escrever_(sh, faixa_('G:L', 'IDENT_2'), dataDoFormulario_(mov.data));
  // O campo Tipo do documento é composto: o que o sistema deduziu das contas,
  // a forma escolhida, e a finalidade quando houver. A tela manda pronto;
  // aqui só se confere que não veio vazio à toa.
  escrever_(sh, faixa_('G:V', 'TIPO'), maiuscula_(mov.tipoEscrito || mov.tipo));
  /* A OBSERVAÇÃO NÃO É SÓ O QUE FOI DIGITADO. Na frente vai o tipo de contas
     envolvidas — "ENTRE CAIXA E BANCO" —, que é a informação que o comprovante
     perdeu quando as três finalidades departamentais foram aposentadas por
     repetirem o que o sistema já deduz. Deduzida, ela está em TODOS os
     comprovantes; escolhida, estava só nos que alguém lembrasse de marcar, e
     às vezes marcada errado. Quem monta a frase é o núcleo, aqui e na tela. */
  escrever_(sh, faixa_('G:V', 'OBS'),
    maiuscula_(observacaoDoDocumento_(mov.contaOrigem, mov.contaDestino, mov.observacao)));

  // 3) Origem e destino. Só a CONTA é escrita: a PIA, o CNPJ, o título e o
  //    cabeçalho saem dela, no passo 6.
  /* O NÚMERO DO CARTÃO ENTRA COLADO NA CONTA — ver `nucleoContaComCartao`.
     Em lote o cartão vem na coluna da tabela, e a tela nem mostra o campo;
     aqui ele chega vazio e a conta sai como está cadastrada. */
  escrever_(sh, faixa_('E:M', 'CONTAS'),
    maiuscula_(nucleoContaComCartao(mov.contaOrigem, mov.cartaoOrigem)));
  escrever_(sh, faixa_('P:V', 'CONTAS'),
    maiuscula_(nucleoContaComCartao(mov.contaDestino, mov.cartaoDestino)));

  // 4) A tabela do lote. As 32 linhas são apagadas antes de escrever: sem
  //    isso, sobra de um lote maior ficaria escondida na folha e voltaria a
  //    aparecer no próximo comprovante com mais linhas.
  //
  //    O apagar entra na mesma fila, célula por célula, em vez de ser um
  //    `clearContent` solto. Parece mais trabalho e é menos: a fila **pula as
  //    células que já estão vazias**, e numa folha que já estava limpa isso
  //    não gera pedido nenhum.
  for (var i = 1; i <= MAX_LINHAS_LOTE; i++) escreverLancamento_(sh, i, {});
  if (emLote) {
    lancamentos.forEach(function (l, i) { escreverLancamento_(sh, i + 1, l); });
  } else {
    escrever_(sh, faixa_('O:P', 'IDENT_2'), Number(mov.valor) || 0);
  }
  escrever_(sh, faixa_('T:V', 'TAB_TOTAL'), emLote ? '' : '');

  // 5) Assinantes da etapa que está sendo impressa agora.
  escreverAssinantes_(sh, assinantesDaEtapa_(mov, mov.etapaAtual));

  // Tudo o que foi juntado vai agora, de uma vez. Daqui para baixo a folha já
  // está escrita — e só por isso os passos seguintes podem lê-la.
  var gravacao = fecharEscritor_(sh, lote);
  var envio = lote.enviar();

  // 6) Recalcula tudo pelas funções da Etapa 3 — as mesmas que a planilha
  //    usava sozinha. Não existe aqui nenhuma segunda versão dessas contas.
  // As escritas do recálculo entram numa segunda fila — precisam ser uma
  // fila à parte porque cada passo LÊ o que o anterior escreveu, e leitura
  // não enxerga o que ainda está na fila.
  //
  // Repare que cada passo RECEBE o que precisa, em vez de ir buscar na folha.
  // Não é economia: é correção. Dentro de uma fila, ler uma célula cuja
  // escrita ainda está na fila devolve o valor ANTIGO — o extenso sairia do
  // número do comprovante anterior. A regra continua em uma função só; muda
  // só de onde vem o dado de entrada dela.
  var contas = { origem: maiuscula_(mov.contaOrigem), destino: maiuscula_(mov.contaDestino) };
  var piaOrigem = piaEscrita_(piaDaConta_(contas.origem));
  var piaDestino = piaEscrita_(piaDaConta_(contas.destino));

  comFilaAberta_(sh, function () {
    var total = emLote ? somarLote_(sh) : null;
    preencherPiaPelaConta_(sh, null, contas);
    preencherCnpjPelaPia_(sh, piaOrigem, piaDestino);
    atualizarTitulo_(sh, piaOrigem, piaDestino);
    atualizarCabecalho_(sh, 'origem', piaOrigem);
    if (total === null) atualizarExtenso_(sh, Number(mov.valor) || 0);
    carimbarEmissao_(sh, LOTE_ABERTO);
  });
  SpreadsheetApp.flush();

  guardarMovimentacao_(mov);

  var resumo = resumoDaFolha_(sh, mov);
  resumo.celulasEscritas = gravacao.escritas;
  resumo.celulasJaCertas = gravacao.iguais;
  resumo.caminhoDaEscrita = envio.caminho;
  resumo.motivoDoCaminhoAntigo = envio.motivo || '';
  return resumo;
}

/**
 * O que está na folha agora, numa leitura só.
 *
 * Eram oito perguntas à planilha, uma por campo. Um bloco de valores custa o
 * mesmo que uma célula.
 */
function resumoDaFolha_(sh, mov) {
  var bloco = sh.getRange('B' + lin_('TITULO') + ':V' + lin_('CNPJ')).getValues();
  function doBloco(colunas, idLinha) {
    var canto = cantoDaFaixa_(faixa_(colunas, idLinha));
    return bloco[canto.linha - lin_('TITULO')][canto.coluna - 2];
  }
  var lancamentos = ((mov && mov.lancamentos) || []).filter(function (l) {
    return l && (l.data || l.documento || l.beneficiario || Number(l.valor));
  });
  return {
    status: 'OK',
    emLote: !!(mov && mov.modo === 'lote' && lancamentos.length),
    lancamentos: lancamentos.length,
    valor: doBloco('O:P', 'IDENT_2'),
    extenso: doBloco('R:V', 'IDENT_2'),
    titulo: doBloco('B:V', 'TITULO'),
    piaOrigem: doBloco('D:L', 'ORIGEM_DESTINO'),
    piaDestino: doBloco('O:V', 'ORIGEM_DESTINO'),
    cnpjOrigem: doBloco('D:L', 'CNPJ'),
    cnpjDestino: doBloco('O:V', 'CNPJ')
  };
}

/**
 * A folha já está com exatamente esta movimentação?
 *
 * A comparação é com o que foi guardado no último preenchimento — e o que foi
 * guardado é exatamente o que foi escrito. Ninguém digita na aba Comprovante,
 * então o que está guardado é o que está na folha.
 */
function mesmaMovimentacaoJaEscrita_(mov) {
  try {
    var anterior = ultimaMovimentacao_();
    return !!anterior && JSON.stringify(anterior) === JSON.stringify(mov);
  } catch (e) {
    return false;   // na dúvida, preenche de novo: custa tempo, não correção.
  }
}

/**
 * Mostra ou esconde a tabela do lote.
 *
 * Desde que `aplicarModo_` passou a considerar "lote" a partir de UM
 * lançamento, não há mais nada de especial a fazer aqui — a regra do projeto
 * é "em lote, uma linha por lançamento; em lançamento único, a tabela não
 * aparece", e é exatamente o que a Etapa 1 faz agora.
 */
function aplicarModoDoFormulario_(sh, quantosLancamentos, lote) {
  aplicarModo_(sh, { lancamentos: quantosLancamentos, mostrarContas: true, lote: lote });
}

/**
 * A numeração do SIGA é opcional. Quando não existe, **o rótulo também sai**
 * do documento — um "numeração SIGA:" sozinho, sem número ao lado, parece
 * campo que alguém esqueceu de preencher.
 */
function escreverNumeracaoSiga_(sh, numeracao) {
  var texto = String(numeracao == null ? '' : numeracao).trim();
  escrever_(sh, faixa_('I:J', 'IDENT_1'), texto ? 'numeração SIGA:' : '');
  escrever_(sh, faixa_('K:L', 'IDENT_1'), maiuscula_(texto));
}

/** Escreve uma linha da tabela do lote. */
function escreverLancamento_(sh, posicao, lancamento) {
  var id = 'TAB_' + posicao;
  var vazia = !lancamento || (!lancamento.data && !lancamento.documento &&
                              !lancamento.beneficiario && !lancamento.valor);
  escrever_(sh, faixa_('B:F', id), vazia ? '' : dataDoFormulario_(lancamento.data));
  escrever_(sh, faixa_('G:K', id), vazia ? '' : maiuscula_(lancamento.documento));
  escrever_(sh, faixa_('L:S', id), vazia ? '' : maiuscula_(lancamento.beneficiario));
  escrever_(sh, faixa_('T:V', id), vazia ? '' : (Number(lancamento.valor) || 0));
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
    escrever_(sh, lugar.nome, String(quem.nome || '').trim());
    escrever_(sh, lugar.cargo, String(quem.cargo || '').trim());
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
  garantirPlanilha_();
  conferirRegraEntreContas_(mov);

  /* AQUI HAVIA UM ATALHO, E ELE FOI TIRADO.
     Quando a movimentação era "a mesma da última vez", o preenchimento era
     pulado inteiro. A economia era real, mas o atalho confiava numa MEMÓRIA
     do que foi preenchido, e não na folha. Basta a folha ter mudado por fora
     — alguém editou uma célula, outro comprovante foi escrito, uma sessão
     antiga deixou resto — para o PDF sair com dado de outro documento. Foi o
     que o Taynã viu, e a regra que ele pediu é clara: campo vazio limpa a
     célula, sempre.
     O custo de voltar a preencher é pequeno: `fecharEscritor_` lê o bloco
     inteiro numa viagem só e grava apenas as células que realmente mudaram —
     num reenvio idêntico, quase nenhuma. Correção vale mais que as poucas
     idas que o atalho poupava. */
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

  // A Referência é consumida AQUI, e não quando o formulário abre: abrir o
  // formulário e desistir não pode queimar um número. Segunda via é a única
  // que não consome nada — ela reimprime um comprovante que já existe.
  if (mov.referenciaOrigem !== 'segunda-via') {
    resumo.referenciaConsumida = consumirReferencia_(mov.referencia);
  }
  resumo.proximaReferencia = proximaReferencia_();
  return resumo;
}

// ===========================================================================
// 6. A REFERÊNCIA — GERADA, NUNCA DIGITADA (E AS DUAS EXCEÇÕES)
// ===========================================================================
//
// A Referência identifica o comprovante e **nunca se repete**: é ela que
// amarra o PDF ao registro no Histórico. Por isso não é campo de digitar, nem
// sugestão que se aceita ou recusa — o sistema gera, e é aquela.
//
// Existem duas situações reais em que o número certo não é o próximo da fila,
// e as duas precisam existir sem virar hábito:
//
//   1. **Segunda via** de um comprovante já emitido, que se perdeu. O
//      documento sai com a MESMA Referência do original — é o mesmo
//      comprovante, reimpresso. Não consome número nenhum.
//   2. **Histórico perdido ou fora de alcance.** Alguém precisa emitir e não
//      tem como saber em que número a casa parou. Escreve o número à mão; se
//      for maior que o último conhecido, a contagem se acerta por ele.
//
// O que impede isso de virar fluxo contínuo não é um bloqueio — é o preço.
// No caminho normal a Referência já vem pronta e não se digita nada. Na
// exceção é preciso abrir o painel, escolher qual das duas, escrever o número
// e **escrever o motivo**. O motivo fica guardado com a movimentação e vai
// para o Histórico, onde qualquer um vê quantas exceções foram abertas e por
// quê. É a escolha de sempre neste projeto: avisar e registrar, em vez de
// impedir — com o caminho certo sendo também o mais curto.

/** A Referência que o sistema gerou. A tela pede esta, e só esta. */
function referenciaDoSistema() {
  return proximaReferencia_();
}

// ===========================================================================
// 7. GUARDAR A MOVIMENTAÇÃO PARA A ETAPA 5
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
// 8. AUXILIARES
// ===========================================================================

/**
 * Escreve um valor numa faixa, deixando a célula em branco quando não há
 * valor. `setValue('')` apaga; `setValue(0)` escreveria um zero de verdade,
 * que num campo de valor é informação, não vazio — por isso o número passa
 * direto e só o texto vazio vira limpeza.
 *
 * Se houver um escritor aberto (`ESCRITOR`), a escrita entra na fila dele em
 * vez de ir sozinha até o Google. Ver `abrirEscritor_`.
 */
function escrever_(sh, intervalo, valor) {
  var v = (valor === undefined || valor === null) ? '' : valor;
  if (ESCRITOR) { ESCRITOR.fila.push([intervalo, v]); return; }
  sh.getRange(intervalo).setValue(v);
}

// ===========================================================================
// 8b. ESCREVER SÓ O QUE MUDOU
// ===========================================================================

/**
 * Junta as escritas de um preenchimento e grava **só as células que mudaram**.
 *
 * Ideia do Taynã, e a conta fecha: no Apps Script cada `setValue` é uma
 * viagem de ida e volta pela internet, e cada uma custa o mesmo, escreva ela
 * um texto novo ou o mesmo texto que já estava lá. Ler o bloco inteiro de uma
 * vez custa **uma** viagem. A partir da segunda célula que já estava certa, a
 * leitura já se pagou.
 *
 * E o caso comum da tesouraria é justamente esse: vários lançamentos seguidos
 * com a mesma data, a mesma origem, o mesmo tipo e os mesmos assinantes —
 * onde quase nada muda de um comprovante para o outro.
 *
 * Uma leitura só, do retângulo que cobre todas as escritas pendentes, e
 * depois uma escrita por célula diferente.
 */
var ESCRITOR = null;

function abrirEscritor_() { ESCRITOR = { fila: [] }; }

function fecharEscritor_(sh, lote) {
  var escritor = ESCRITOR;
  ESCRITOR = null;
  if (!escritor || !escritor.fila.length) return { escritas: 0, iguais: 0 };

  var cantos = escritor.fila.map(function (item) { return cantoDaFaixa_(item[0]); });
  var linha1 = Math.min.apply(null, cantos.map(function (c) { return c.linha; }));
  var coluna1 = Math.min.apply(null, cantos.map(function (c) { return c.coluna; }));
  var linha2 = Math.max.apply(null, cantos.map(function (c) { return c.linha; }));
  var coluna2 = Math.max.apply(null, cantos.map(function (c) { return c.coluna; }));

  var atuais = sh.getRange(linha1, coluna1, linha2 - linha1 + 1, coluna2 - coluna1 + 1).getValues();

  var escritas = 0, iguais = 0;
  escritor.fila.forEach(function (item, i) {
    var c = cantos[i];
    var jaEsta = atuais[c.linha - linha1][c.coluna - coluna1];
    if (mesmoValor_(jaEsta, item[1])) { iguais++; return; }
    if (lote) lote.valor(item[0], item[1]);
    else sh.getRange(item[0]).setValue(item[1]);
    escritas++;
  });
  return { escritas: escritas, iguais: iguais };
}

/** A primeira célula de uma faixa como "G7:H7" — é nela que o valor mora. */
function cantoDaFaixa_(intervalo) {
  var achado = String(intervalo).match(/^([A-Z]+)(\d+)/);
  if (!achado) throw new Error('Faixa que não sei ler: ' + intervalo);
  var coluna = 0;
  for (var i = 0; i < achado[1].length; i++) coluna = coluna * 26 + (achado[1].charCodeAt(i) - 64);
  return { linha: Number(achado[2]), coluna: coluna };
}

/**
 * O que está na célula é a mesma coisa que vai ser escrito?
 *
 * Datas viram número de milissegundos; número e texto são comparados pelo que
 * representam. Célula vazia lida como '' e valor '' são iguais.
 */
function mesmoValor_(jaEsta, novo) {
  if (jaEsta instanceof Date && novo instanceof Date) return jaEsta.getTime() === novo.getTime();
  if (jaEsta instanceof Date || novo instanceof Date) return false;
  if (typeof jaEsta === 'number' && typeof novo === 'number') return jaEsta === novo;
  return String(jaEsta) === String(novo);
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

// ===========================================================================
// 9. ACRESCENTAR UMA FINALIDADE SEM SAIR DO FORMULÁRIO
// ===========================================================================

/**
 * Registra uma finalidade nova com a combinação que está na tela.
 *
 * POR QUE ISTO EXISTE (pedido dele): quando falta uma finalidade na hora de
 * preencher, o caminho era abrir a aba Cadastros, achar dois blocos
 * diferentes, inventar um código livre e digitar dez colunas à mão — sendo
 * que seis delas o formulário já sabe, porque são justamente a combinação que
 * está na tela naquele instante. Digitar de novo o que o sistema já deduziu é
 * onde o erro entra.
 *
 * O QUE O SISTEMA PREENCHE SOZINHO, e por isso não pergunta:
 *   - o CÓDIGO, que é o próximo livre (a pessoa não tem como saber qual é);
 *   - a linha de ONDE ELA VALE — tipo, subtipo, forma, subforma e a natureza
 *     das duas contas —, que é a combinação da tela.
 *
 * O QUE ELE NÃO INVENTA: a FONTE. As 26 finalidades do projeto vieram de um
 * levantamento nos manuais da obra e cada uma cita de onde saiu. Uma
 * acrescentada aqui **não** veio de manual nenhum, e dizer que veio seria
 * mentir no cadastro. Ela é marcada como decisão desta tesouraria, com a data
 * — quem for conferir daqui a dois anos precisa saber a diferença.
 */
function acrescentarFinalidadeDoFormulario(pedido) {
  garantirPlanilha_();
  pedido = pedido || {};
  var nome = String(pedido.nome || '').trim();
  if (!nome) throw new Error('A finalidade precisa de um nome.');

  var jaTem = finalidadesCadastradas_();
  var repetida = null;
  jaTem.forEach(function (f) {
    if (!repetida && nucleoSimples(f.nome) === nucleoSimples(nome)) repetida = f;
  });
  if (repetida) {
    throw new Error('Já existe uma finalidade com esse nome: ' +
      repetida.codigo + ' — ' + repetida.nome + '.\n\n' +
      'Se ela não está aparecendo na lista, é porque não vale para esta ' +
      'combinação de contas e forma. Nesse caso o que falta é uma linha em ' +
      'ONDE CADA FINALIDADE VALE, não uma finalidade nova.');
  }

  var codigo = proximoCodigoDeFinalidade_(jaTem);
  var hoje = Utilities.formatDate(new Date(),
    SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'dd/MM/yyyy');

  acrescentarLinhaNoBloco_('FINALIDADES', [
    codigo,
    nome,
    String(pedido.oQueE || '').trim(),
    String(pedido.frentes || '').trim(),
    String(pedido.historicos || '').trim(),
    'Acrescentada no formulário em ' + hoje + ' — decisão desta tesouraria, ' +
      'não consta dos manuais levantados',
    String(pedido.cuidados || '').trim(),
    ''
  ]);

  acrescentarLinhaNoBloco_('REGRAS_FINALIDADE', [
    codigo,
    '',                                   // Folha: só o levantamento tem
    String(pedido.tipo || '').trim(),
    String(pedido.subtipo || '').trim(),
    String(pedido.forma || '').trim(),
    String(pedido.subforma || '').trim(),
    String(pedido.historicos || '').trim(),
    'Combinação registrada pelo formulário em ' + hoje,
    String(pedido.origem || '').trim(),
    String(pedido.destino || '').trim()
  ]);

  /* Devolve as listas inteiras, já relidas. A tela troca as dela por estas e
     a finalidade nova aparece na hora — sem fechar e abrir a janela, que era
     justamente o atrito que este botão existe para tirar. */
  return {
    codigo: codigo,
    nome: nome,
    finalidades: finalidadesCadastradas_(),
    regrasDeFinalidade: regrasDeFinalidade_()
  };
}

/**
 * O próximo código livre: F03, F04… F28 → F29.
 *
 * Conta a partir do MAIOR que existe, e não do total de linhas: aposentar uma
 * finalidade no meio faria o total apontar para um código já usado, e código
 * repetido é chave repetida — o defeito que apaga linhas em silêncio.
 */
function proximoCodigoDeFinalidade_(finalidades) {
  var maior = 0;
  (finalidades || []).forEach(function (f) {
    var n = parseInt(String(f.codigo).replace(/[^0-9]/g, ''), 10);
    if (isFinite(n) && n > maior) maior = n;
  });
  var proximo = String(maior + 1);
  while (proximo.length < 2) proximo = '0' + proximo;
  return 'F' + proximo;
}

/**
 * O menu que leva à aba inteira — ou explica como publicá-la.
 *
 * O caminho de publicar é escrito AQUI, e não só na documentação, porque é
 * uma vez na vida: quem for fazer isso daqui a um ano não vai lembrar de
 * procurar, e uma mensagem que só diz "não está publicado" manda a pessoa
 * caçar o que fazer.
 */
function abrirFormularioEmAbaInteira() {
  guardarIdDaPlanilha_();
  var url = urlDaTelaCheia_();
  var ui = SpreadsheetApp.getUi();

  if (!url) {
    ui.alert('A aba inteira ainda não foi publicada',
      'A janela normal do formulário vive dentro da planilha, e o tamanho ' +
      'dela é limitado pelo navegador. A aba inteira usa a tela toda.\n\n' +
      'Para publicar, UMA VEZ SÓ:\n\n' +
      '1. Extensões → Apps Script.\n' +
      '2. Botão azul "Implantar" (canto superior direito) → ' +
      '"Nova implantação".\n' +
      '3. Na engrenagem ao lado de "Selecionar tipo", escolha "App da Web".\n' +
      '4. Em "Executar como", deixe "Eu". Em "Quem pode acessar", escolha ' +
      '"Qualquer pessoa com conta do Google".\n' +
      '5. Clique em "Implantar". O Google vai pedir autorização — é normal, ' +
      'é o mesmo aviso de sempre.\n' +
      '6. Copie o endereço que aparece (termina em /exec).\n' +
      '7. Cole esse endereço na aba Cadastros, bloco CONTROLE DA NUMERAÇÃO, ' +
      'na linha URL_TELA_CHEIA.\n\n' +
      'Depois disso este menu abre a aba direto.\n\n' +
      'E GUARDE ESTA PARTE, que não é uma vez na vida: o endereço /exec '  +
      'serve uma FOTOGRAFIA do script, tirada na hora de implantar. '      +
      'Sempre que os arquivos mudarem, a aba continua com o código velho ' +
      'até você fazer: Implantar → Gerenciar implantações → lápis → '      +
      'Versão: Nova versão → Implantar. O endereço não muda.',
      ui.ButtonSet.OK);
    return;
  }

  /* NÃO DÁ PARA ABRIR UMA ABA DE DENTRO DO SCRIPT — o Apps Script não manda
     no navegador. O que dá é mostrar um botão para clicar.

     E O BOTÃO ABRE COM `window.open`, NÃO com um link `target="_blank"`.
     Parece a mesma coisa e não é: o navegador só deixa uma página se fechar
     sozinha (`window.close()`) quando ela foi aberta POR PROGRAMA. Aberta por
     um link que a pessoa clicou, ela não fecha, e o botão "Fechar esta aba"
     da tela não fazia nada além de mostrar um recado. Foi assim que ele
     encontrou o defeito. */
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial;font-size:14px;line-height:1.6;padding:8px">' +
    '<p>Clique para abrir o formulário numa aba inteira:</p>' +
    '<p><button type="button" id="abrir" style="font-family:inherit;' +
    'font-size:15px;font-weight:bold;padding:10px 18px;border:1px solid #1a73e8;' +
    'border-radius:4px;background:#1a73e8;color:#fff;cursor:pointer">' +
    'Abrir o formulário</button></p>' +
    '<p style="color:#5f6368;font-size:12px">Ao fechar aquela aba, o navegador ' +
    'volta sozinho para esta planilha.</p>' +
    '<p style="color:#5f6368;font-size:12px">Mexeu no script depois de ' +
    'publicar? A aba só recebe a mudança depois de <b>Implantar → Gerenciar ' +
    'implantações → lápis → Versão: Nova versão</b>.</p></div>' +
    '<script>document.getElementById("abrir").addEventListener("click",' +
    'function(){window.open("' + url + '","_blank");});<\/script>')
    .setWidth(420).setHeight(250);
  ui.showModalDialog(html, 'Formulário em aba inteira');
}
