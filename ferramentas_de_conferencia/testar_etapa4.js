/* Roda o formulário da Etapa 4 contra os arquivos 01, 02, 03 e 05 de verdade,
   dentro do simulador. Confere o que foi parar em cada célula do comprovante. */
var fs = require('fs'), vm = require('vm'), path = require('path');
var M = require('./mock_planilha.js');

var raiz = process.argv[2];
var planilha = new M.Planilha();
var propriedades = {};
var pdfsGerados = [];

var contexto = {
  console: console, JSON: JSON, Math: Math, Date: Date, Number: Number,
  String: String, Object: Object, Array: Array, RegExp: RegExp, isFinite: isFinite,
  Error: Error, parseInt: parseInt, parseFloat: parseFloat, setTimeout: setTimeout,

  SpreadsheetApp: {
    getActive: function () { return planilha; },
    getActiveSpreadsheet: function () { return planilha; },
    flush: function () {},
    getUi: function () {
      return {
        alert: function () { return 'OK'; },
        prompt: function () { return { getSelectedButton: function () { return 'CANCEL'; }, getResponseText: function () { return ''; } }; },
        showModalDialog: function () {},
        ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL', YES_NO: 'YES_NO' },
        Button: { OK: 'OK', YES: 'YES', CANCEL: 'CANCEL' }
      };
    },
    newDataValidation: function () {
      var b = {
        requireValueInList: function () { return b; },
        setAllowInvalid: function () { return b; },
        setHelpText: function () { return b; },
        build: function () { return {}; }
      };
      return b;
    },
    WrapStrategy: { CLIP: 'CLIP', WRAP: 'WRAP' },
    BorderStyle: { SOLID: 'SOLID', SOLID_MEDIUM: 'SOLID_MEDIUM', SOLID_THICK: 'SOLID_THICK' },
    ProtectionType: { RANGE: 'RANGE' }
  },

  Utilities: {
    formatDate: function (data, fuso, formato) {
      var dd = ('0' + data.getDate()).slice(-2), mm = ('0' + (data.getMonth() + 1)).slice(-2);
      var aaaa = data.getFullYear(), aa = String(aaaa).slice(-2);
      var hh = ('0' + data.getHours()).slice(-2), mi = ('0' + data.getMinutes()).slice(-2);
      var ss = ('0' + data.getSeconds()).slice(-2);
      return formato
        .replace('yyyy', aaaa).replace('dd', dd).replace('MM', mm).replace('yy', aa)
        .replace('HH', hh).replace('mm', mi).replace('ss', ss);
    }
  },

  PropertiesService: {
    getDocumentProperties: function () {
      return {
        setProperty: function (k, v) { propriedades[k] = v; },
        getProperty: function (k) { return propriedades[k] || null; }
      };
    }
  },

  HtmlService: {
    createHtmlOutput: function () { return { setWidth: function () { return this; }, setHeight: function () { return this; } }; },
    createHtmlOutputFromFile: function (nome) {
      if (!fs.existsSync(path.join(raiz, 'apps_script', nome + '.html'))) {
        throw new Error('MOCK: o arquivo ' + nome + '.html não existe');
      }
      return { setWidth: function () { return this; }, setHeight: function () { return this; } };
    }
  },

  /* O PDF em si não é testado aqui (nenhuma rede, nenhum Drive). Estes
     simulacros existem só para o caminho de `preencherEGerarPdf` poder ser
     percorrido inteiro — é nele que a Referência é consumida. */
  DriveApp: {
    getFileById: function () {
      return { getParents: function () { return { hasNext: function () { return false; } }; } };
    },
    getRootFolder: function () {
      return {
        getName: function () { return 'Pasta de teste'; },
        getUrl: function () { return 'https://drive.exemplo/pasta'; },
        createFile: function (blob) {
          pdfsGerados.push(blob.nome);
          return { getUrl: function () { return 'https://drive.exemplo/arquivo'; } };
        }
      };
    },
    getFolderById: function () { throw new Error('MOCK: pasta indicada não existe no teste'); }
  },
  UrlFetchApp: {
    fetch: function () {
      return {
        getResponseCode: function () { return 200; },
        getBlob: function () { return { setName: function (n) { return { nome: n }; } }; }
      };
    }
  },
  ScriptApp: { getOAuthToken: function () { return 'token'; } },

  /* O serviço avançado do Sheets.
     `node testar_etapa4.js . --sem-sheets` roda a MESMA bateria com ele
     desligado, pelo caminho antigo. As duas têm de dar o mesmo resultado —
     é o que garante que a chave `USAR_ESCRITA_RAPIDA` pode ser desligada a
     qualquer momento sem mudar nada além da velocidade. */
  Sheets: process.argv.indexOf('--sem-sheets') >= 0 ? undefined : M.servicoSheetsDeMentira(planilha)
};
vm.createContext(contexto);

['00_Escrita_Rapida', '01_Layout_Comprovante', '02_Cadastros',
 '03_Formulas_Validacoes', '04_Formulario', '05_Gerar_PDF'].forEach(function (nome) {
  var codigo = fs.readFileSync(path.join(raiz, 'apps_script', nome + '.gs'), 'utf8');
  try { vm.runInContext(codigo, contexto, { filename: nome + '.gs' }); }
  catch (e) { console.log('ERRO ao carregar ' + nome + '.gs: ' + e.message); process.exit(1); }
});

/* ------------------------------------------------------------------ */
var falhas = [], passou = 0;
function conferir(oque, obtido, esperado) {
  var iguais = (obtido instanceof Date && esperado instanceof Date)
    ? obtido.getTime() === esperado.getTime()
    : String(obtido) === String(esperado);
  if (iguais) { passou++; return; }
  falhas.push(oque + '\n      saiu:      ' + JSON.stringify(obtido) +
                     '\n      esperado:  ' + JSON.stringify(esperado));
}
function conferirQue(oque, condicao, detalhe) {
  if (condicao) { passou++; return; }
  falhas.push(oque + (detalhe ? '\n      ' + detalhe : ''));
}
function rodar(nome, fn) {
  try { fn(); console.log('  · ' + nome); }
  catch (e) { falhas.push(nome + ' ESTOUROU: ' + e.message + '\n' + (e.stack || '').split('\n')[1]); }
}
function valor(sh, faixa) { return sh.getRange(faixa).getValue(); }

console.log('\nMontando as abas com o código de verdade…');
console.log('  caminho de escrita: ' + (contexto.escritaRapidaLigada_() ? 'RÁPIDO (serviço avançado do Sheets)' : 'ANTIGO (uma operação por vez)'));
contexto.criarAbaCadastros();
contexto.criarLayoutComprovante();
var comprovante = planilha.getSheetByName('Comprovante');
console.log('  aba Comprovante: ' + comprovante.getMaxRows() + ' linhas × ' +
            comprovante.getMaxColumns() + ' colunas');

console.log('\nTESTES');

rodar('dadosDoFormulario devolve as listas do cadastro', function () {
  var d = contexto.dadosDoFormulario();
  conferir('contas cadastradas', d.contas.length, 27);
  conferir('cartões cadastrados', d.cartoes.length, 42);
  conferir('diáconos cadastrados', d.diaconos.length, 11);
  conferir('tipos cadastrados', d.tipos.length, 14);
  conferir('status cadastrados', d.status.length, 4);
  conferir('PIAs distintas', d.pias.length, 5);
  conferir('toda PIA tem a conta 100.10',
    d.pias.filter(function (p) {
      return d.contas.some(function (c) { return c.piaChave === p.chave && c.codigo === '100.10'; });
    }).length, 5);
  conferir('próxima referência', d.proximaReferencia, 'CMP-26/001');
  conferir('limite do lote', d.maxLinhasLote, 32);
  conferirQue('toda conta traz a chave da PIA já normalizada',
    d.contas.every(function (c) { return /^PIA[A-ZÀ-Ú]+$/.test(c.piaChave); }),
    'chaves: ' + d.contas.map(function (c) { return c.piaChave; }).join(', '));
  conferir('a chave da PIA usa a mesma regra do resto do sistema',
    d.contas[0].piaChave, contexto.pia_('PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE'));
  conferirQue('os tipos invertidos vêm marcados',
    d.tipos.filter(function (t) { return t.invertido; }).length === 2);
});

rodar('as etapas: mesma PIA gera 2 documentos, PIAs diferentes geram 3', function () {
  conferir('mesma PIA', contexto.etapasDaMovimentacao_('PIACOXIM', 'PIACOXIM').join('→'), 'APROVADA→EFETIVADA');
  conferir('PIAs diferentes', contexto.etapasDaMovimentacao_('PIACOXIM', 'PIASONORA').join('→'), 'APROVADA→PAGA→RECEBIDA');
  conferir('sem destino ainda', contexto.etapasDaMovimentacao_('PIACOXIM', '').join('→'), 'APROVADA→PAGA→RECEBIDA');
});

/* ---------- caso 1: lançamento único, entre PIAs diferentes -------------- */
var movUnica = {
  referencia: 'CMP-26/007', numeracaoSiga: '656', status: 'APROVADA', etapaAtual: 'APROVADA',
  data: '2026-09-06',
  tipo: 'Transferencia entre departamentos - entre bancos',
  observacao: 'supri conta banco são gabriel pagcorp',
  contaOrigem: 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE',
  contaDestino: 'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE',
  modo: 'unico', valor: 1800, lancamentos: [],
  mesmosAssinantes: true,
  assinantesPorEtapa: { TODAS: [
    { nome: 'Adalto Azevedo Pereira', cargo: 'Diácono' },
    { nome: 'Taynã Araujo Naves', cargo: 'Diácono' },
    { nome: "Nilson Sant'Anna", cargo: 'Diácono' },
    { nome: '', cargo: '' }, { nome: '', cargo: '' }, { nome: '', cargo: '' }
  ] }
};

rodar('lançamento único entre PIAs diferentes', function () {
  var r = contexto.preencherComprovante(movUnica);
  var sh = comprovante, f = contexto.faixa_, fm = contexto.faixaMulti_;

  conferir('referência', valor(sh, f('G:H', 'IDENT_1')), 'CMP-26/007');
  conferir('rótulo da numeração SIGA', valor(sh, f('I:J', 'IDENT_1')), 'numeração SIGA:');
  conferir('numeração SIGA', valor(sh, f('K:L', 'IDENT_1')), '656');
  conferir('status', valor(sh, f('O:P', 'IDENT_1')), 'APROVADA');
  conferir('data', valor(sh, f('G:L', 'IDENT_2')), new Date(2026, 8, 6));
  conferir('tipo em caixa alta', valor(sh, f('G:V', 'TIPO')),
    'TRANSFERENCIA ENTRE DEPARTAMENTOS - ENTRE BANCOS');
  conferir('observação em caixa alta', valor(sh, f('G:V', 'OBS')),
    'SUPRI CONTA BANCO SÃO GABRIEL PAGCORP');
  conferir('valor', valor(sh, f('O:P', 'IDENT_2')), 1800);
  conferir('extenso', valor(sh, fm('R:V', 'IDENT_2', 'IDENT_2B')), '(UM MIL E OITOCENTOS REAIS)');

  conferir('PIA de origem, escrita pela conta', valor(sh, f('D:L', 'ORIGEM_DESTINO')), 'PIA - COXIM');
  conferir('PIA de destino, escrita pela conta', valor(sh, f('O:V', 'ORIGEM_DESTINO')), 'PIA - SÃO GABRIEL');
  conferir('CNPJ de origem', valor(sh, f('D:L', 'CNPJ')), '03.673.233/0001-43');
  conferir('CNPJ de destino', valor(sh, f('O:V', 'CNPJ')), '03.673.233/0001-43');
  conferir('título entre PIAs diferentes', valor(sh, f('B:V', 'TITULO')),
    'COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS');
  conferir('cabeçalho: endereço da ADM de origem', valor(sh, f('B:I', 'CAB_2')),
    'RUA JOAQUIM CARDEAL DE SOUZA , 311');
  conferir('cabeçalho: cidade', valor(sh, f('J:Q', 'CAB_2')), 'COXIM - MS');
  conferir('cabeçalho: CNPJ', valor(sh, f('R:V', 'CAB_2')), 'CNPJ 03.673.233/0001-43 - IE ISENTO');

  conferir('1º assinante', valor(sh, f('C:I', 'NOME_1')), 'Adalto Azevedo Pereira');
  conferir('1º cargo, sem caixa alta', valor(sh, f('C:I', 'CARGO_1')), 'Diácono');
  conferir('3º assinante', valor(sh, f('R:U', 'NOME_1')), "Nilson Sant'Anna");
  conferir('4ª vaga fica em branco', valor(sh, f('C:I', 'NOME_2')), '');
  conferir('6ª vaga (manual) em branco', valor(sh, f('S:U', 'NOME_2')), '');

  conferirQue('a tabela do lote fica escondida no lançamento único',
    sh.isRowHiddenByUser(contexto.lin_('TAB_CAB')) && sh.isRowHiddenByUser(contexto.lin_('TAB_TOTAL')));
  conferir('resumo devolvido: não está em lote', r.emLote, false);
  conferir('resumo devolvido: título', r.titulo, 'COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS');
});

/* ---------- caso 2: lote de cartões, dentro da mesma PIA ---------------- */
var movLote = {
  referencia: 'CMP-26/008', numeracaoSiga: '', status: 'APROVADA', etapaAtual: 'APROVADA',
  data: '2026-09-18',
  tipo: 'Carregamento de cartao pre-pago (em lote)',
  observacao: 'carga mensal dos cartoes de atendimento',
  contaOrigem: 'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE',
  contaDestino: 'PIA-COXIM: 204.9 - CARTÃO DE DÉBITO',
  modo: 'lote', valor: 0,
  lancamentos: [
    { data: '2026-09-10', documento: '127698298', beneficiario: 'Sandra Leite Teles', valor: 300 },
    { data: '2026-09-10', documento: '127698421', beneficiario: 'Francisca Pereira Ribolis', valor: 250.5 },
    { data: '2026-09-11', documento: '127698603', beneficiario: 'Leticia Coronel', valor: 449.5 }
  ],
  mesmosAssinantes: false,
  assinantesPorEtapa: {
    APROVADA: [{ nome: 'Adalto Azevedo Pereira', cargo: 'Diácono' }, { nome: '', cargo: '' },
               { nome: '', cargo: '' }, { nome: '', cargo: '' }, { nome: '', cargo: '' }, { nome: '', cargo: '' }],
    EFETIVADA: [{ nome: 'Taynã Araujo Naves', cargo: 'Diácono' }, { nome: '', cargo: '' },
                { nome: '', cargo: '' }, { nome: '', cargo: '' }, { nome: '', cargo: '' }, { nome: '', cargo: '' }]
  }
};

rodar('lote de 3 cartões dentro da mesma PIA', function () {
  var r = contexto.preencherComprovante(movLote);
  var sh = comprovante, f = contexto.faixa_, fm = contexto.faixaMulti_;

  conferir('rótulo da numeração SIGA some quando vazia', valor(sh, f('I:J', 'IDENT_1')), '');
  conferir('numeração SIGA vazia', valor(sh, f('K:L', 'IDENT_1')), '');
  conferir('título dentro da mesma PIA', valor(sh, f('B:V', 'TITULO')),
    'COMPROVANTE DE MOVIMENTAÇÃO INTERNA');
  conferir('rótulo vira "Valor Total:"', valor(sh, f('M:M', 'IDENT_2')), 'Valor Total:');

  conferir('1ª linha do lote — data', valor(sh, f('B:F', 'TAB_1')), new Date(2026, 8, 10));
  conferir('1ª linha do lote — cartão', valor(sh, f('G:K', 'TAB_1')), '127698298');
  conferir('1ª linha do lote — beneficiário em caixa alta', valor(sh, f('L:S', 'TAB_1')), 'SANDRA LEITE TELES');
  conferir('1ª linha do lote — valor', valor(sh, f('T:V', 'TAB_1')), 300);
  conferir('3ª linha do lote — valor', valor(sh, f('T:V', 'TAB_3')), 449.5);

  conferir('TOTAL da tabela', valor(sh, f('T:V', 'TAB_TOTAL')), 1000);
  conferir('o campo Valor recebe a soma', valor(sh, f('O:P', 'IDENT_2')), 1000);
  conferir('o extenso acompanha a soma', valor(sh, fm('R:V', 'IDENT_2', 'IDENT_2B')), '(UM MIL REAIS)');

  conferirQue('as 3 linhas do lote ficam visíveis',
    !sh.isRowHiddenByUser(contexto.lin_('TAB_1')) &&
    !sh.isRowHiddenByUser(contexto.lin_('TAB_3')));
  conferirQue('a 4ª linha continua escondida', sh.isRowHiddenByUser(contexto.lin_('TAB_4')));

  conferir('assinante da etapa impressa (APROVADA)', valor(sh, f('C:I', 'NOME_1')), 'Adalto Azevedo Pereira');
  conferir('resumo: está em lote', r.emLote, true);
  conferir('resumo: quantos lançamentos', r.lancamentos, 3);
});

rodar('a etapa escolhida troca o assinante, sem mexer no resto', function () {
  var outra = JSON.parse(JSON.stringify(movLote));
  outra.etapaAtual = 'EFETIVADA'; outra.status = 'EFETIVADA';
  contexto.preencherComprovante(outra);
  var sh = comprovante, f = contexto.faixa_;
  conferir('status da 2ª etapa', valor(sh, f('O:P', 'IDENT_1')), 'EFETIVADA');
  conferir('assinante da 2ª etapa', valor(sh, f('C:I', 'NOME_1')), 'Taynã Araujo Naves');
  conferir('o valor continua o mesmo nas duas etapas', valor(sh, f('O:P', 'IDENT_2')), 1000);
});

rodar('voltar para lançamento único limpa a sobra do lote', function () {
  contexto.preencherComprovante(movUnica);
  var sh = comprovante, f = contexto.faixa_;
  conferir('a linha 1 do lote foi apagada', valor(sh, f('G:K', 'TAB_1')), '');
  conferir('o TOTAL foi apagado', valor(sh, f('T:V', 'TAB_TOTAL')), '');
  conferir('o valor volta a ser o digitado', valor(sh, f('O:P', 'IDENT_2')), 1800);
  conferir('o rótulo volta a ser "Valor:"', valor(sh, f('M:M', 'IDENT_2')), 'Valor:');
});

rodar('lote de UM lançamento mostra a tabela (carregamento avulso de cartão)', function () {
  var umSo = JSON.parse(JSON.stringify(movLote));
  umSo.lancamentos = [{ data: '2026-09-10', documento: '127698298', beneficiario: 'Sandra', valor: 300 }];
  contexto.preencherComprovante(umSo);
  var sh = comprovante, f = contexto.faixa_;
  conferirQue('o cabeçalho da tabela aparece', !sh.isRowHiddenByUser(contexto.lin_('TAB_CAB')));
  conferirQue('a linha 1 aparece', !sh.isRowHiddenByUser(contexto.lin_('TAB_1')));
  conferirQue('a linha 2 continua escondida', sh.isRowHiddenByUser(contexto.lin_('TAB_2')));
  conferir('o cartão aparece na tabela', valor(sh, f('G:K', 'TAB_1')), '127698298');
  conferir('o total é o do único lançamento', valor(sh, f('T:V', 'TAB_TOTAL')), 300);
});

rodar('a folha continua cabendo em uma página só', function () {
  var problemas = contexto.conferirGrade_(comprovante);
  conferirQue('nenhum problema de grade depois de tudo isso',
    problemas.length === 0, problemas.join(' | '));
  var altura = 0;
  for (var r = 1; r <= comprovante.getMaxRows(); r++) {
    if (!comprovante.isRowHiddenByUser(r)) altura += comprovante.getRowHeight(r);
  }
  conferir('altura das linhas visíveis', altura, contexto.ALTURA_UTIL_PX);
});

rodar('a movimentação fica guardada para a Etapa 5', function () {
  var guardada = contexto.ultimaMovimentacao_();
  conferirQue('existe uma movimentação guardada', !!guardada);
  conferir('com os assinantes das duas etapas',
    Object.keys(guardada.assinantesPorEtapa).sort().join(','), 'APROVADA,EFETIVADA');
});

rodar('o cabeçalho do Recebimento usa a ADM de destino', function () {
  var entreAdms = JSON.parse(JSON.stringify(movUnica));
  entreAdms.contaDestino = 'PIA-COSTA: ACG - AG:01 CC:128175700 - PIEDADE';
  contexto.preencherComprovante(entreAdms);
  var sh = comprovante, f = contexto.faixa_;
  conferir('por padrão o cabeçalho é o da origem', valor(sh, f('J:Q', 'CAB_2')), 'COXIM - MS');
  contexto.atualizarCabecalho_(sh, 'destino');
  conferir('no Recebimento vira o da ADM de destino', valor(sh, f('J:Q', 'CAB_2')), 'COSTA RICA - MS');
  conferir('e o CNPJ acompanha', valor(sh, f('R:V', 'CAB_2')), 'CNPJ 15.409.246/0001-99 - IE ISENTO');
});

rodar('a Referência é gerada pelo sistema, e sobe de um em um', function () {
  conferir('a primeira é a 001', contexto.proximaReferencia_(), 'CMP-26/001');
  conferir('ler o número de dentro', contexto.numeroDaReferencia_('CMP-26/007'), 7);
  conferir('número de referência sem barra', contexto.numeroDaReferencia_('SEM-NUMERO'), 0);
  conferir('número de referência vazia', contexto.numeroDaReferencia_(''), 0);
});

rodar('consumir a Referência: só anda para a frente, e nunca duas vezes', function () {
  conferir('consumir a 001 anda', contexto.consumirReferencia_('CMP-26/001'), true);
  conferir('a próxima vira a 002', contexto.proximaReferencia_(), 'CMP-26/002');

  // Uma movimentação gera 2 ou 3 PDFs com a MESMA Referência. Do segundo em
  // diante a contagem não pode andar, ou cada movimentação queimaria 3 números.
  conferir('consumir a 001 de novo NÃO anda', contexto.consumirReferencia_('CMP-26/001'), false);
  conferir('e a próxima continua a 002', contexto.proximaReferencia_(), 'CMP-26/002');

  // Histórico perdido: o número digitado é maior, a contagem se acerta por ele.
  conferir('um número à frente acerta a contagem', contexto.consumirReferencia_('CMP-26/050'), true);
  conferir('a próxima passa a ser a 051', contexto.proximaReferencia_(), 'CMP-26/051');

  // Segunda via de um comprovante antigo não pode puxar a contagem para trás.
  conferir('um número antigo NÃO volta a contagem', contexto.consumirReferencia_('CMP-26/007'), false);
  conferir('a próxima continua a 051', contexto.proximaReferencia_(), 'CMP-26/051');
});

rodar('a sequência recomeça quando vira o ano', function () {
  contexto.gravarControle_('ANO_CORRENTE', '25');
  contexto.gravarControle_('ULTIMO_NUMERO', 87);
  var primeira = contexto.proximaReferencia_();
  conferir('volta para a 001 no ano novo', primeira, 'CMP-26/001');
  conferir('e o ano guardado se acerta', String(contexto.lerControle_('ANO_CORRENTE')), '26');
  conferir('e a contagem zera', Number(contexto.lerControle_('ULTIMO_NUMERO')), 0);
});

rodar('gerar o PDF consome a Referência — e a segunda via não consome', function () {
  var base = JSON.parse(JSON.stringify(movUnica));

  base.referencia = 'CMP-26/001';
  base.referenciaOrigem = 'sistema';
  var r1 = contexto.preencherEGerarPdf(base);
  conferir('o PDF foi gerado', !!r1.pdf, true);
  conferir('a Referência foi consumida', r1.referenciaConsumida, true);
  conferir('e a próxima já é a 002', r1.proximaReferencia, 'CMP-26/002');

  // A 2ª e a 3ª etapa da MESMA movimentação: mesmo número, sem consumir de novo.
  var r2 = contexto.preencherEGerarPdf(base);
  conferir('a 2ª etapa não consome de novo', r2.referenciaConsumida, false);
  conferir('e a próxima continua a 002', r2.proximaReferencia, 'CMP-26/002');

  // Segunda via de um comprovante antigo: não mexe na contagem de jeito nenhum.
  var via = JSON.parse(JSON.stringify(base));
  via.referencia = 'CMP-26/001';
  via.referenciaOrigem = 'segunda-via';
  via.referenciaJustificativa = 'o diácono perdeu o comprovante do envelope';
  var r3 = contexto.preencherEGerarPdf(via);
  conferir('segunda via não consome nada', r3.referenciaConsumida, undefined);
  conferir('e a próxima continua a 002', r3.proximaReferencia, 'CMP-26/002');

  conferir('o nome do arquivo traz referência e etapa',
    pdfsGerados[0], 'CMI-CMP-26-001-APROVADA - ' +
      contexto.Utilities.formatDate(new Date(), 'x', 'yy_MM_dd') + '.pdf');

  // O motivo da exceção fica guardado para o Histórico da Etapa 6.
  conferir('o motivo da exceção fica guardado',
    contexto.ultimaMovimentacao_().referenciaJustificativa,
    'o diácono perdeu o comprovante do envelope');
});

rodar('recriar a aba Cadastros NÃO destrói o que já estava lá', function () {
  // Simula a vida real: o contador já andou, alguém cadastrou uma conta à mão
  // e corrigiu o texto de outra. Recriar tem de preservar as três coisas.
  contexto.gravarControle_('ULTIMO_NUMERO', 7);
  contexto.gravarControle_('PASTA_DRIVE_PADRAO', 'https://drive.exemplo/pasta-do-taynan');

  var contas = planilha.getRangeByName('CAD_CONTAS');
  var linhas = contas.getValues();
  var primeiraVazia = 0;
  while (String(linhas[primeiraVazia][0]).trim() !== '') primeiraVazia++;
  contas.getCell(primeiraVazia + 1, 1).setValue('PIA-NOVA');
  contas.getCell(primeiraVazia + 1, 6).setValue('PIA-NOVA: 100.10 - CAIXA OBRA DA PIEDADE');
  contas.getCell(primeiraVazia + 1, 7).setValue('Ativa');
  contexto.esquecerCadastros_();

  var antesDeRecriar = contexto.lerCadastro_('CONTAS').length;
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();

  conferir('o último número usado ficou', Number(contexto.lerControle_('ULTIMO_NUMERO')), 7);
  conferir('a próxima Referência continua de onde parou', contexto.proximaReferencia_(), 'CMP-26/008');
  conferir('a pasta do Drive ficou',
    String(contexto.lerControle_('PASTA_DRIVE_PADRAO')), 'https://drive.exemplo/pasta-do-taynan');
  conferir('a conta cadastrada à mão ficou', contexto.lerCadastro_('CONTAS').length, antesDeRecriar);
  conferirQue('e ela é encontrável pelo nome',
    contexto.lerCadastro_('CONTAS').some(function (c) { return c.PIA === 'PIA-NOVA'; }));
  conferirQue('nenhuma lista perdeu registro',
    contexto.lerCadastro_('CARTOES').length === 42 &&
    contexto.lerCadastro_('DIACONOS').length === 11 &&
    contexto.lerCadastro_('TIPOS').length === 14);
});

rodar('criar do zero começa com a numeração no zero', function () {
  var limpa = new (require('./mock_planilha.js').Planilha)();
  // A aba não existe: é criação, não recriação.
  planilha.deleteSheet(planilha.getSheetByName('Cadastros'));
  planilha.nomeados = {};
  contexto.esquecerCadastros_();
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();
  conferir('a contagem nasce zerada', Number(contexto.lerControle_('ULTIMO_NUMERO')), 0);
  conferir('e a primeira Referência é a 001', contexto.proximaReferencia_(), 'CMP-26/001');
});

rodar('abrirFormularioCmi encontra o arquivo da tela', function () {
  contexto.abrirFormularioCmi();
  passou++;
});

console.log('\n' + (falhas.length ? falhas.length + ' FALHA(S) de ' + (passou + falhas.length) : 'Passaram os ' + passou) + ' testes.');
if (falhas.length) { console.log(''); falhas.forEach(function (f, i) { console.log((i + 1) + ') ' + f); }); process.exit(1); }
