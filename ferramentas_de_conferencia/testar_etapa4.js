/* Roda o formulário da Etapa 4 contra os arquivos 01, 02, 03 e 05 de verdade,
   dentro do simulador. Confere o que foi parar em cada célula do comprovante. */
var fs = require('fs'), vm = require('vm'), path = require('path');
var M = require('./mock_planilha.js');

var raiz = process.argv[2];
var planilha = new M.Planilha();
var propriedades = {};
var pdfsGerados = [];

var ULTIMO_ALERTA = { titulo: '', corpo: '' };

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
        alert: function (titulo, corpo) {
          // Guardado para dar para conferir o TEXTO da janela, e não só o
          // efeito dela. Foi o texto que o Taynã pediu para mudar.
          ULTIMO_ALERTA = { titulo: titulo, corpo: corpo === undefined ? '' : String(corpo) };
          return 'OK';
        },
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

  /* O `getContent()` é de verdade: é por ele que o servidor lê a tela para
     colar as regras dentro. Um simulacro que devolvesse texto vazio faria o
     teste passar com a janela chegando sem o núcleo — exatamente o defeito
     que não dá sinal nenhum quando acontece de verdade. */
  HtmlService: {
    createHtmlOutput: function (texto) {
      return { conteudo: texto,
               setWidth: function () { return this; },
               setHeight: function () { return this; },
               getContent: function () { return this.conteudo; } };
    },
    createHtmlOutputFromFile: function (nome) {
      var arquivo = path.join(raiz, 'apps_script', nome + '.html');
      if (!fs.existsSync(arquivo)) throw new Error('MOCK: o arquivo ' + nome + '.html não existe');
      var texto = fs.readFileSync(arquivo, 'utf8');
      return { setWidth: function () { return this; },
               setHeight: function () { return this; },
               getContent: function () { return texto; } };
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
 '03_Formulas_Validacoes', '04_Formulario', '05_Gerar_PDF', '06_Tipos_E_Regras'].forEach(function (nome) {
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
  contas.getCell(primeiraVazia + 1, 7).setValue('CAIXA');   // Natureza
  contas.getCell(primeiraVazia + 1, 8).setValue('Ativa');   // Status
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

rodar('uma coluna nova no MEIO não desalinha o que já estava na aba', function () {
  /* O DEFEITO QUE ELE ACHOU, e que produziu três sintomas parecendo três
     problemas: a coluna Natureza foi acrescentada no meio do bloco CONTAS, as
     linhas que já estavam na aba tinham uma coluna a menos, e tudo dali em
     diante andou uma casa. "Ativa" virou a Natureza. Resultado: todas as
     contas inativas, nenhuma regra entre contas valendo, e DINHEIRO oferecido
     para a ACG — com bandeira verde na conferência. */
  var contas = planilha.getRangeByName('CAD_CONTAS');
  var linhas = contas.getValues();
  var quantas = 0;
  while (quantas < linhas.length && String(linhas[quantas][0]).trim() !== '') quantas++;

  // Desloca, como a recriação antiga deslocou: Status vai para a Natureza.
  for (var l = 0; l < quantas; l++) {
    contas.getCell(l + 1, 7).setValue(linhas[l][7]);
    contas.getCell(l + 1, 8).setValue(linhas[l][8]);
    contas.getCell(l + 1, 9).setValue('');
  }
  contexto.esquecerCadastros_();

  conferirQue('o estrago foi mesmo feito (o teste testa alguma coisa)',
    contexto.lerCadastro_('CONTAS').every(function (c) {
      return ['CAIXA', 'BANCO', 'ACG', 'CARTAO'].indexOf(String(c.Natureza).trim().toUpperCase()) < 0;
    }));

  ULTIMO_ALERTA = { titulo: '', corpo: '' };
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();

  var depois = contexto.lerCadastro_('CONTAS');
  var doProjeto = depois.filter(function (c) { return String(c.PIA) !== 'PIA-NOVA'; });

  conferir('as naturezas das contas do projeto voltaram',
    doProjeto.filter(function (c) {
      return ['CAIXA', 'BANCO', 'ACG', 'CARTAO'].indexOf(String(c.Natureza).trim().toUpperCase()) >= 0;
    }).length, doProjeto.length);
  conferirQue('e o Status voltou para o Status',
    doProjeto.every(function (c) { return /^(ATIVA|INATIVA)/i.test(String(c.Status).trim()); }),
    doProjeto.map(function (c) { return c.Status; }).slice(0, 4).join(' | '));

  /* A CONTA CADASTRADA À MÃO é o caso honesto: o projeto não a conhece, logo
     não tem de onde tirar a Natureza dela. Fica EM BRANCO — e não com o valor
     errado. Quem cobra daí em diante é o formulário, que trava e manda
     preencher. Chutar uma natureza aqui seria inventar dado de tesouraria. */
  var aMao = null;
  depois.forEach(function (c) { if (String(c.PIA) === 'PIA-NOVA') aMao = c; });
  conferirQue('a conta cadastrada à mão continua na lista', !!aMao);
  conferir('e fica com a Natureza em branco, não com o valor errado',
    String(aMao.Natureza || '').trim(), '');
  conferirQue('mas o resto dela foi desentortado',
    /^ATIVA/i.test(String(aMao.Status).trim()), 'Status: ' + aMao.Status);
  conferirQue('e o formulário trava nela',
    !contexto.nucleoNaturezaConhecida(aMao.Natureza, contexto.naturezasValidas_()));
  conferirQue('a janela avisa quantas linhas desentortou',
    /DESENTORTADO \(\d+\)/.test(ULTIMO_ALERTA.corpo), ULTIMO_ALERTA.corpo);

  /* E o efeito que importa: com a Natureza de volta, a regra volta a valer. */
  var caixa = '', acg = '';
  depois.forEach(function (c) {
    var t = String(c['Texto que aparece na lista']);
    if (!caixa && /100\.10 - CAIXA OBRA/.test(t)) caixa = t;
    if (!acg && /101\.15/.test(t)) acg = t;
  });
  var formas = contexto.formasEntreContas_(caixa, acg).formas.map(function (f) { return f.nome; });
  conferirQue('DINHEIRO não vai mais para a ACG', formas.indexOf('DINHEIRO') < 0, formas.join(' | '));
  conferirQue('CHEQUE também não', formas.indexOf('CHEQUE') < 0, formas.join(' | '));
  /* Caixa -> ACG ficou IMPOSSÍVEL, e é o que ele pediu: "Estou com dinheiro
     em espécie no cofre e vou depositar na ACG. Pelas regras, isso deveria
     ser impossível." O caixa só movimenta por saque; a ACG só por PIX. */
  conferir('e caixa -> ACG não tem forma nenhuma: fica bloqueado', formas.length, 0);

  /* Rodar de novo não pode "consertar" o que já está certo. */
  ULTIMO_ALERTA = { titulo: '', corpo: '' };
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();
  conferirQue('e recriar de novo não desentorta nada (não mexe no que está certo)',
    !/DESENTORTADO/.test(ULTIMO_ALERTA.corpo), ULTIMO_ALERTA.corpo);
});

rodar('o campo Tipo não repete o que já está no título', function () {
  /* "movimentação interna de numerários é o tipo principal. Já está no
     título, não precisa especificar no tipo de transferência: fica
     redundante." — o Taynã, olhando o comprovante gerado. */
  function conta(re) {
    var achada = '';
    contexto.lerCadastro_('CONTAS').forEach(function (c) {
      var t = String(c['Texto que aparece na lista']);
      if (!achada && re.test(t)) achada = t;
    });
    return achada;
  }
  var coxim = conta(/PIA-COXIM: 100\.10/), acgCoxim = conta(/PIA-COXIM: 101\.15/);
  var sonora = conta(/PIA-SONORA: 100\.10/), costa = conta(/PIA-COSTA: 201\.9/);

  var interna = contexto.textoDoTipo_(
    contexto.classificarMovimentacao_(coxim, acgCoxim), 'PIX', '');
  conferir('interna: sai só a forma', interna, 'PIX');
  conferirQue('e não repete MOVIMENTAÇÃO INTERNA',
    interna.indexOf('MOVIMENTAÇÃO INTERNA') < 0, interna);

  var entreDeptos = contexto.textoDoTipo_(
    contexto.classificarMovimentacao_(coxim, sonora), 'PIX', '');
  conferir('entre departamentos: o subtipo fica', entreDeptos, 'ENTRE DEPARTAMENTOS · PIX');
  conferirQue('e não repete TRANSFERÊNCIA DE NUMERÁRIOS',
    entreDeptos.indexOf('TRANSFERÊNCIA DE NUMER') < 0, entreDeptos);

  var entreAdms = contexto.textoDoTipo_(
    contexto.classificarMovimentacao_(coxim, costa), 'PIX', 'Zerar Conta');
  conferir('entre administrações: subtipo, forma e finalidade',
    entreAdms, 'ENTRE ADMINISTRAÇÕES · PIX · ZERAR CONTA');

  /* Interna sem forma escolhida: o campo sai VAZIO, e é correto — tudo o que
     havia para dizer já está no título. */
  conferir('interna sem forma: campo em branco',
    contexto.textoDoTipo_(contexto.classificarMovimentacao_(coxim, acgCoxim), '', ''), '');
  conferirQue('e nunca sai um separador solto',
    contexto.textoDoTipo_(contexto.classificarMovimentacao_(coxim, acgCoxim), '', 'Zerar Conta')
      .indexOf('·') < 0);
});

rodar('a finalidade se filtra pela forma escolhida', function () {
  /* A coluna "Formas que combinam", no bloco TIPOS, nasce VAZIA: vazia quer
     dizer "serve para qualquer forma". É o mesmo desenho das regras entre
     contas — o que ninguém restringiu, vale. Esconder finalidade por regra
     inventada seria pior do que mostrar uma a mais. */
  var tipos = contexto.lerCadastro_('TIPOS');
  conferirQue('a coluna existe em todas as linhas',
    tipos.every(function (t) { return t['Formas que combinam'] !== undefined; }));
  conferirQue('e nasce vazia — nenhuma regra foi inventada',
    tipos.every(function (t) { return String(t['Formas que combinam'] || '').trim() === ''; }));

  conferirQue('sem restrição, a finalidade serve para qualquer forma',
    contexto.nucleoFinalidadeCombina({ formas: '' }, 'DINHEIRO'));
  conferirQue('com restrição, só a forma listada',
    contexto.nucleoFinalidadeCombina({ formas: 'PIX; TED' }, 'PIX') &&
    !contexto.nucleoFinalidadeCombina({ formas: 'PIX; TED' }, 'DINHEIRO'));
  conferirQue('sem forma escolhida, mostra tudo',
    contexto.nucleoFinalidadeCombina({ formas: 'PIX' }, ''));
});

rodar('Natureza inválida é diferente de Natureza vazia', function () {
  /* "Ativa" na coluna Natureza não estava vazia — e por isso passou por baixo
     de toda conferência, durante uma rodada inteira de testes do Taynã. */
  var validas = contexto.naturezasValidas_();
  conferirQue('em branco não é conhecida', !contexto.nucleoNaturezaConhecida('', validas));
  conferirQue('"Ativa" TAMBÉM não é conhecida',
    !contexto.nucleoNaturezaConhecida('Ativa', validas));
  conferirQue('ACG é', contexto.nucleoNaturezaConhecida('ACG', validas));
  conferirQue('e não depende da caixa das letras',
    contexto.nucleoNaturezaConhecida('cartao', validas));
});

rodar('dá para saber qual versão de cada arquivo está no editor', function () {
  /* Colar arquivo por arquivo, por várias mensagens, faz perder a conta do
     que já foi atualizado — e um arquivo velho no meio de arquivos novos
     falha longe de onde está a causa. Foi exatamente o que aconteceu: a
     janela morreu dizendo "sem a marca", sem dizer QUAL arquivo estava
     atrasado nem o que fazer. */
  ULTIMO_ALERTA = { titulo: '', corpo: '' };
  contexto.conferirVersoesDosArquivos();
  conferirQue('a conferência mostra as duas versões',
    /06_Tipos_E_Regras/.test(ULTIMO_ALERTA.corpo) &&
    /04_Formulario_Tela/.test(ULTIMO_ALERTA.corpo), ULTIMO_ALERTA.corpo);
  conferirQue('e diz que estão iguais quando estão',
    /mesma versão/.test(ULTIMO_ALERTA.titulo), ULTIMO_ALERTA.titulo);

  var html = fs.readFileSync(path.join(raiz, 'apps_script', '04_Formulario_Tela.html'), 'utf8');
  conferir('a versão da tela é a mesma do núcleo',
    contexto.versaoDaTela_(html), contexto.VERSAO_DO_NUCLEO);

  /* A COLAGEM PELA METADE — a falha de pior cara deste projeto: a janela abre
     normal e não responde a botão nenhum. E ela levava o número da versão
     junto (que fica no alto do arquivo), fazendo o erro acusar "versão
     errada" e mandar consertar o que não estava quebrado. */
  conferirQue('a tela termina com a marca de fim',
    !!contexto.fimEncontrado_(html));
  conferirQue('a marca do núcleo vem ANTES do meio do arquivo',
    html.indexOf(contexto.MARCA_DO_NUCLEO) < html.length / 2,
    'marca em ' + Math.round(100 * html.indexOf(contexto.MARCA_DO_NUCLEO) / html.length) + '% do arquivo');

  /* A FALHA QUE SÓ APARECIA DENTRO DO GOOGLE: o getContent() devolve o arquivo
     SEM comentários. Enquanto as marcas eram comentários, elas nunca chegavam
     ao servidor, e o sistema acusava colagem pela metade num arquivo inteiro.
     Aqui a bateria apaga os comentários de propósito e exige que as marcas
     continuem lá. */
  var semComentarios = html.replace(/\/\*[\s\S]*?\*\//g, '');
  conferirQue('a marca do núcleo sobrevive a uma leitura sem comentários',
    !!contexto.marcaEncontrada_(semComentarios));
  conferirQue('a marca de fim também sobrevive',
    !!contexto.fimEncontrado_(semComentarios));
  conferirQue('e a versão também',
    !!contexto.versaoDaTela_(semComentarios));

  var cortada = html.split('\n').slice(0, 600).join('\n');
  conferirQue('um arquivo cortado ainda traz a versão (por isso ela engana)',
    !!contexto.versaoDaTela_(cortada), 'cortado perdeu a versão');
  conferirQue('mas perde a marca de fim, que é o que denuncia',
    cortada.indexOf(contexto.MARCA_FIM_DA_TELA) < 0);
  conferirQue('a marca que vale não tem acento nenhum',
    /^[\x20-\x7e]*$/.test(contexto.MARCA_DO_NUCLEO), contexto.MARCA_DO_NUCLEO);
  conferirQue('e a marca antiga continua aceita, para um par meio atualizado',
    !!contexto.marcaEncontrada_('nada /* <<< O N\u00daCLEO DAS REGRAS ENTRA AQUI >>> */ nada'));
});

rodar('cabeçalho e dados de cada lista têm a MESMA largura', function () {
  /* Se um bloco ganhar coluna no cabeçalho e não nas linhas (ou o contrário),
     todo valor escorrega uma casa e o cadastro passa a mentir em silêncio:
     "Natureza" mostrando "Ativa", "Status" mostrando a observação. Nada
     estoura, nada avisa — e o comprovante sai errado. Foi o que um print
     levantou a dúvida; não havia nada guardando isto. */
  contexto.BLOCOS_CADASTRO.forEach(function (bloco) {
    var quantas = bloco.colunas.length;
    bloco.dados.forEach(function (linha, i) {
      conferir(bloco.id + ', linha ' + (i + 1) + ': largura da linha',
        linha.length, quantas);
    });
    var colunasDaChave = bloco.chave === undefined ? [0] :
      (typeof bloco.chave === 'number' ? [bloco.chave] : bloco.chave);
    conferirQue(bloco.id + ': toda coluna da chave existe',
      colunasDaChave.every(function (c) { return c < quantas; }),
      'chave aponta ' + colunasDaChave.join(',') + ' de ' + quantas);

    /* A CHAVE TEM DE SER ÚNICA nas linhas que o projeto traz. Deduplicar por
       uma chave que se repete apaga linhas em silêncio — já aconteceu duas
       vezes: em CONTAS (a 1ª coluna é a PIA, que repete) e nas REGRAS ENTRE
       CONTAS, onde 7 das 11 regras sumiram porque metade começa com "*", e o
       sistema passou a permitir o que devia proibir. */
    var vistas = {}, repetidas = [];
    bloco.dados.forEach(function (linha) {
      var k = contexto.chaveDaLinha_(bloco, linha);
      if (vistas[k]) repetidas.push(k);
      vistas[k] = true;
    });
    conferirQue(bloco.id + ': nenhuma linha do projeto tem chave repetida',
      !repetidas.length, 'repetidas: ' + repetidas.slice(0, 3).join(' / '));
    /* Compara por CHAVE, e não por contagem: outras conferências acrescentam
       linhas à aba, e o que importa é que nenhuma linha do projeto tenha
       sumido no caminho. */
    var naAba = {};
    contexto.lerCadastro_(bloco.id).forEach(function (item) {
      var linha = bloco.colunas.map(function (c) { return item[c.nome]; });
      naAba[contexto.chaveDaLinha_(bloco, linha)] = true;
    });
    var sumiram = Object.keys(vistas).filter(function (k) { return !naAba[k]; });
    conferirQue(bloco.id + ': nenhuma linha do projeto sumiu do cadastro',
      !sumiram.length, 'sumiram: ' + sumiram.slice(0, 3).join(' / '));
  });

  /* E o que foi escrito na aba bate com o cabeçalho? Confere pelo nome: o
     valor lido por `lerCadastro_` tem de ser o mesmo que está na célula. */
  var contas = contexto.lerCadastro_('CONTAS');
  conferirQue('Natureza traz natureza, e não o status',
    contas.every(function (c) {
      var n = String(c.Natureza || '').trim().toUpperCase();
      return n === '' || ['CAIXA', 'BANCO', 'ACG', 'CARTAO'].indexOf(n) >= 0;
    }),
    'naturezas vistas: ' + contas.map(function (c) { return c.Natureza; }).join(', '));
  conferirQue('Status traz status, e não a natureza',
    contas.every(function (c) {
      return /^(ATIVA|INATIVA)/i.test(String(c.Status || '').trim()) || !String(c.Status || '').trim();
    }),
    'status vistos: ' + contas.map(function (c) { return c.Status; }).join(', '));
});

rodar('a janela do recriar mostra SÓ o que mudou', function () {
  /* Ele pediu isto olhando a janela: "Ao invés de colocar a quantidade final
     de cada item, melhor seria colocar a quantidade adicionada". Com o tempo
     um resumo de totais vira uma parede de números que ninguém lê. */
  ULTIMO_ALERTA = { titulo: '', corpo: '' };
  contexto.criarAbaCadastros();          // recriar sem nada de novo
  contexto.esquecerCadastros_();

  conferirQue('quando nada muda, ela diz isso em uma linha',
    /Nenhum registro entrou nem saiu/.test(ULTIMO_ALERTA.corpo), ULTIMO_ALERTA.corpo);
  conferirQue('e não fica falando de totais nem de mantidos',
    !/mantido/i.test(ULTIMO_ALERTA.corpo) && !/=\s*\d/.test(ULTIMO_ALERTA.corpo),
    ULTIMO_ALERTA.corpo);
  conferirQue('mas ainda diz onde ficou a numeração',
    /Próxima Referência/.test(ULTIMO_ALERTA.corpo), ULTIMO_ALERTA.corpo);

  /* Agora um registro entrando DE VERDADE. Uma linha acrescentada à mão não
     serve de teste: ela já estava na aba antes de recriar, logo não "entrou"
     com a recriação. O que entra é o que o projeto traz e a aba não tem — o
     caso real de o Taynã colar uma versão nova do script. Simula-se apagando
     uma conta da aba: ao recriar, o projeto a devolve. */
  var contas = planilha.getRangeByName('CAD_CONTAS');
  var linhas = contas.getValues();
  var apagada = String(linhas[0][5]);
  for (var col = 1; col <= linhas[0].length; col++) contas.getCell(1, col).setValue('');
  contexto.esquecerCadastros_();

  ULTIMO_ALERTA = { titulo: '', corpo: '' };
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();

  conferirQue('quando entra registro, ela diz QUAL entrou',
    ULTIMO_ALERTA.corpo.indexOf(apagada) >= 0, apagada + ' -> ' + ULTIMO_ALERTA.corpo);
  conferirQue('e diz quantos entraram',
    /ENTROU \(1\)/.test(ULTIMO_ALERTA.corpo), ULTIMO_ALERTA.corpo);
  conferirQue('e continua sem falar de mantidos',
    !/mantido/i.test(ULTIMO_ALERTA.corpo), ULTIMO_ALERTA.corpo);
  conferirQue('a conta apagada voltou mesmo para a aba',
    contexto.lerCadastro_('CONTAS').some(function (c) {
      return c['Texto que aparece na lista'] === apagada;
    }));
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

rodar('gerar o PDF NUNCA aproveita o que estava na folha', function () {
  /* HAVIA UM ATALHO AQUI, e ele foi tirado. Quando a movimentação era "a
     mesma da última vez", o preenchimento era pulado inteiro — mas o atalho
     confiava numa MEMÓRIA do que tinha sido preenchido, e não na folha.
     Bastava a folha ter mudado por fora para o PDF sair com dado de outro
     documento. Foi o que o Taynã viu, e a regra que ele pediu é clara:
     campo vazio limpa a célula, sempre. */
  var m = JSON.parse(JSON.stringify(movUnica));
  m.referencia = 'CMP-26/090'; m.valor = 4321; m.referenciaOrigem = 'sistema';

  var primeiro = contexto.preencherComprovante(m);
  conferirQue('o 1º preenchimento escreveu células', primeiro.celulasEscritas > 0,
    'escreveu ' + primeiro.celulasEscritas);

  // Alguém mexe na folha por fora — uma edição à mão, um resto de sessão.
  var folha = contexto.abaDoComprovante_();
  folha.getRange(contexto.faixa_('G:V', 'TIPO')).setValue('LIXO DE OUTRO COMPROVANTE');
  folha.getRange(contexto.faixa_('G:V', 'OBS')).setValue('OBSERVAÇÃO DE OUTRO');

  var antes = pdfsGerados.length;
  var segundo = contexto.preencherEGerarPdf(m);

  conferirQue('gerar reescreve o que estava fora do lugar',
    String(folha.getRange(contexto.faixa_('G:V', 'TIPO')).getValue())
      .indexOf('LIXO') < 0,
    String(folha.getRange(contexto.faixa_('G:V', 'TIPO')).getValue()));
  conferirQue('e a observação também',
    String(folha.getRange(contexto.faixa_('G:V', 'OBS')).getValue())
      .indexOf('DE OUTRO') < 0,
    String(folha.getRange(contexto.faixa_('G:V', 'OBS')).getValue()));
  conferir('o PDF saiu', pdfsGerados.length, antes + 1);
  conferir('com o valor certo', segundo.valor, 4321);
  conferir('e o extenso certo', segundo.extenso, '(QUATRO MIL E TREZENTOS E VINTE E UM REAIS)');

  /* E a regra geral: campo vazio limpa a célula. */
  var vazia = JSON.parse(JSON.stringify(m));
  vazia.referencia = 'CMP-26/091';
  vazia.tipo = ''; vazia.tipoEscrito = ''; vazia.observacao = '';
  vazia.numeracaoSiga = '';
  contexto.preencherComprovante(vazia);
  conferir('tipo vazio limpa a célula',
    String(folha.getRange(contexto.faixa_('G:V', 'TIPO')).getValue()), '');
  conferir('observação vazia limpa a célula',
    String(folha.getRange(contexto.faixa_('G:V', 'OBS')).getValue()), '');

  // Mudando qualquer coisa, volta a preencher.
  var outro = JSON.parse(JSON.stringify(m));
  outro.valor = 999;
  var terceiro = contexto.preencherComprovante(outro);
  conferirQue('mudou algo -> preenche de novo', terceiro.celulasEscritas > 0);
  conferir('e o valor novo entrou', terceiro.valor, 999);
});

rodar('abrirFormularioCmi encontra o arquivo da tela', function () {
  contexto.abrirFormularioCmi();
  passou++;
});

console.log('\n' + (falhas.length ? falhas.length + ' FALHA(S) de ' + (passou + falhas.length) : 'Passaram os ' + passou) + ' testes.');
if (falhas.length) { console.log(''); falhas.forEach(function (f, i) { console.log((i + 1) + ') ' + f); }); process.exit(1); }
