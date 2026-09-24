/* Roda o formulário da Etapa 4 contra os arquivos 01, 02, 03 e 05 de verdade,
   dentro do simulador. Confere o que foi parar em cada célula do comprovante. */
var fs = require('fs'), vm = require('vm'), path = require('path');
var M = require('./mock_planilha.js');

var raiz = process.argv[2];
var planilha = new M.Planilha();
var propriedades = {};
var propriedadesDoScript = {};
var pdfsGerados = [];
var copiasCriadas = [];      /* as planilhas temporárias da cópia em planilha */
var arquivosNoLixo = [];     /* e o que foi para a lixeira depois */

/* A PASTA DE MENTIRA GUARDA OS ARQUIVOS DE VERDADE — nome, conteúdo, quantas
   vezes foi reescrito. Antes ela só anotava o nome do PDF, e o arquivo de
   recuperação e o Histórico falhavam aqui dentro sem ninguém ver: a emissão
   os trata como aviso, e a bateria dava verde. Teste verde pelo motivo
   errado é a armadilha 3.13 do checkpoint. */
var arquivosNaPasta = [];
function arquivoDeMentira(nome, conteudo) {
  var a = { nome: nome, conteudo: conteudo, reescritas: 0, id: 'ARQUIVO-' + (arquivosNaPasta.length + 1) };
  a.getName = function () { return a.nome; };
  a.getId = function () { return a.id; };
  a.getUrl = function () { return 'https://drive.exemplo/' + a.id; };
  a.setContent = function (t) { a.conteudo = t; a.reescritas++; return a; };
  arquivosNaPasta.push(a);
  return a;
}
var PASTA = {
  getName: function () { return 'Pasta de teste'; },
  getUrl: function () { return 'https://drive.exemplo/pasta'; },
  createFile: function (blobOuNome, conteudo) {
    if (typeof blobOuNome === 'string') return arquivoDeMentira(blobOuNome, conteudo);
    pdfsGerados.push(blobOuNome.nome);
    return arquivoDeMentira(blobOuNome.nome, '%PDF');
  },
  getFilesByName: function (nome) {
    var achados = arquivosNaPasta.filter(function (a) { return a.nome === nome; });
    return { hasNext: function () { return achados.length > 0; },
             next: function () { return achados.shift(); } };
  }
};

/* O PEDIDO DO PDF FOTOGRAFA A FOLHA no instante da exportação: Status,
   cabeçalho, 1º assinante e o carimbo. É a única prova de que CADA PDF saiu
   com a sua etapa — olhar a folha no fim só mostraria a última.
   `respostasDoGoogle` é uma fila de códigos para simular o Google recusando
   (429, 500...); vazia, ele responde 200. */
var exportacoes = [];
var urlsPedidas = [];
var respostasDoGoogle = [];
var esperas = [];

var ULTIMO_ALERTA = { titulo: '', corpo: '' };

var contexto = {
  console: console, JSON: JSON, Math: Math, Date: Date, Number: Number,
  String: String, Object: Object, Array: Array, RegExp: RegExp, isFinite: isFinite,
  Error: Error, parseInt: parseInt, parseFloat: parseFloat, setTimeout: setTimeout,

  SpreadsheetApp: {
    getActive: function () { return planilha; },
    getActiveSpreadsheet: function () { return planilha; },
    flush: function () {},

    /* A planilha temporária da cópia. Ela nasce com uma aba vazia, como no
       Google — e o nome dessa aba muda com o idioma da conta, que é por isso
       que o código a guarda por referência em vez de procurá-la pelo nome. */
    create: function (nome) {
      var nova = new M.Planilha();
      nova.idDoArquivo = 'COPIA-' + (copiasCriadas.length + 1);
      nova.nomeDoArquivo = nome;
      nova.insertSheet('Página1');
      copiasCriadas.push(nova);
      return nova;
    },
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
    WrapStrategy: { CLIP: 'CLIP', WRAP: 'WRAP', OVERFLOW: 'OVERFLOW' },
    BorderStyle: { SOLID: 'SOLID', SOLID_MEDIUM: 'SOLID_MEDIUM', SOLID_THICK: 'SOLID_THICK' },
    ProtectionType: { RANGE: 'RANGE' }
  },

  Utilities: {
    /* O .xlsx volta em texto (base64) porque a ponte entre o script e a
       página só carrega texto. */
    base64Encode: function (bytes) {
      return Buffer.from(bytes).toString('base64');
    },
    /* Esperar entre uma tentativa e outra do PDF: aqui só se anota quanto. */
    sleep: function (ms) { esperas.push(ms); },
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
    },
    /* AS DO SCRIPT SÃO OUTRA GAVETA, e o id da planilha mora nelas de
       propósito: num App da Web não existe documento ativo, e as do
       DOCUMENTO seriam justamente as que não existiriam ali. */
    getScriptProperties: function () {
      return {
        setProperty: function (k, v) { propriedadesDoScript[k] = v; },
        getProperty: function (k) { return propriedadesDoScript[k] || null; }
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
    getFileById: function (id) {
      var daCopia = null;
      copiasCriadas.forEach(function (c) { if (c.getId() === id) daCopia = c; });
      if (daCopia) {
        return {
          getUrl: function () { return 'https://docs.exemplo/' + daCopia.getId(); },
          moveTo: function (pasta) { daCopia.pastaFinal = pasta.getName(); return this; },
          setTrashed: function () { arquivosNoLixo.push(daCopia.getId()); return this; }
        };
      }
      return { getParents: function () { return { hasNext: function () { return false; } }; } };
    },
    getRootFolder: function () { return PASTA; },
    getFolderById: function () { throw new Error('MOCK: pasta indicada não existe no teste'); }
  },
  UrlFetchApp: {
    /* O endereço pedido fica guardado: é nele que moram os ajustes de
       impressão, e o relatório pede outros (deitado, ajustado à largura). A
       bancada confere que o comprovante continua pedindo os dele. */
    fetch: function (url) {
      urlsPedidas.push(String(url));
      var codigo = respostasDoGoogle.length ? respostasDoGoogle.shift() : 200;
      var sh = planilha.getSheetByName('Comprovante');
      if (codigo === 200 && sh && contexto.faixa_) {
        var f = contexto.faixa_;
        exportacoes.push({
          status: sh.getRange(f('O:S', 'IDENT_1')).getValue(),
          cidade: sh.getRange(f('J:Q', 'CAB_2')).getValue(),
          cnpjDoCabecalho: sh.getRange(f('R:V', 'CAB_2')).getValue(),
          assinante1: sh.getRange(f('C:I', 'NOME_1')).getValue(),
          carimbo: sh.getRange(f('B:K', 'NOTA')).getValue()
        });
      }
      return {
        getResponseCode: function () { return codigo; },
        /* O blob de mentira sabe dizer o nome E os bytes: o PDF vai para a
           pasta pelo nome, e o .xlsx volta para a tela pelos bytes. */
        getBlob: function () {
          return { setName: function (n) { return { nome: n }; },
                   getBytes: function () { return [80, 75, 3, 4]; } };
        }
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
 '03_Formulas_Validacoes', '04_Formulario', '05_Gerar_PDF', '06_Tipos_E_Regras',
 '07_Relatorio_Mensal'].forEach(function (nome) {
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
  conferir('finalidades cadastradas', d.finalidades.length, 26);
  conferir('linhas de onde cada uma vale', d.regrasDeFinalidade.length, 39);
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
  conferirQue('as finalidades de sentido invertido vêm marcadas',
    d.finalidades.filter(function (f) { return contexto.nucleoSentidoInvertido(f); })
      .map(function (f) { return f.codigo; }).join(' ') === 'F10 F14 F15');
});

rodar('a mesma tela serve à janela e à aba inteira', function () {
  /* POR QUE A ABA INTEIRA PRECISOU EXISTIR, com o número que decidiu: a
     janela do Sheets vive dentro da aba do navegador, e com escala de 175%
     uma tela de 1920 x 1080 é enxergada como 1097 x 617. Tirando a barra do
     Chrome e a moldura do Google, sobram uns 400 px de altura para um
     formulário que precisa de 810. Nenhum tamanho de modal cabe nisso. */
  var naJanela = contexto.telaComAsRegras_();
  var naAba = contexto.telaComAsRegras_(true);

  conferirQue('a janela diz que NÃO é aba inteira',
    naJanela.indexOf('var EM_ABA_INTEIRA = false;') >= 0);
  conferirQue('e a aba inteira diz que é',
    naAba.indexOf('var EM_ABA_INTEIRA = true;') >= 0);
  conferirQue('e não sobra o valor antigo na aba',
    naAba.indexOf('var EM_ABA_INTEIRA = false;') < 0);

  /* UM ARQUIVO SÓ. Duas telas quase iguais seria a repetição que este projeto
     passa a vida tirando — e a segunda envelheceria calada. */
  conferir('fora essa linha, as duas telas são idênticas',
    naAba.replace('var EM_ABA_INTEIRA = true;', 'var EM_ABA_INTEIRA = false;'),
    naJanela);

  /* A ABA PRECISA SABER VOLTAR. O navegador recusa fechar toda aba que a
     pessoa abriu de um favorito, e aí a tela oferece voltar para a planilha —
     que é o que ela queria ao clicar em fechar. Para isso o endereço da
     planilha vem junto com os dados: numa aba não existe planilha ativa para
     a tela perguntar depois. */
  var comEndereco = contexto.dadosDoFormulario();
  conferirQue('os dados da tela levam o endereço da planilha',
    String(comEndereco.urlDaPlanilha || '').indexOf('http') === 0,
    comEndereco.urlDaPlanilha);

  /* O ENDEREÇO SÓ EXISTE DEPOIS DE PUBLICADO. Enquanto não, a tela não
     oferece o link: oferecer um caminho que não existe é pior do que não
     oferecer nenhum — a pessoa clica, nada acontece, e passa a desconfiar do
     resto da tela. */
  conferir('sem URL_TELA_CHEIA preenchida, não há link', contexto.urlDaTelaCheia_(), '');

  var controle = planilha.getRangeByName('CAD_CONTROLE');
  var vc = controle.getValues(), linhaUrl = -1;
  for (var i = 0; i < vc.length; i++) {
    if (String(vc[i][0]).trim() === 'URL_TELA_CHEIA') { linhaUrl = i; break; }
  }
  conferirQue('a chave URL_TELA_CHEIA existe no bloco CONTROLE', linhaUrl >= 0);
  controle.getCell(linhaUrl + 1, 2).setValue('https://script.google.com/macros/s/AKfy/exec');
  contexto.esquecerCadastros_();
  contexto.guardarIdDaPlanilha_();

  var url = contexto.urlDaTelaCheia_();
  conferirQue('preenchida, o link aparece', url.indexOf('/exec') >= 0, url);
  conferirQue('e leva o id da planilha junto, para a aba saber de qual se trata',
    url.indexOf('planilha=') >= 0, url);

  controle.getCell(linhaUrl + 1, 2).setValue('');
  contexto.esquecerCadastros_();
});

rodar('acrescentar uma finalidade pelo formulário', function () {
  /* PEDIDO DELE. O caminho antigo era abrir a aba Cadastros, achar DOIS
     blocos, inventar um código livre e digitar dez colunas — sendo que seis
     delas o formulário já sabe, porque são a combinação que está na tela. */
  var antes = contexto.finalidadesCadastradas_().length;
  var antesRegras = contexto.regrasDeFinalidade_().length;

  var r = contexto.acrescentarFinalidadeDoFormulario({
    nome: 'Repor o caixa depois do atendimento extraordinário',
    oQueE: 'Numerário devolvido ao caixa após reunião fora do calendário',
    frentes: 'PIEDADE',
    historicos: '032 TRANSF.VLR',
    tipo: 'MOVIMENTAÇÃO INTERNA (de numerários)',
    subtipo: '',
    forma: 'SAQUE',
    subforma: 'DINHEIRO',
    origem: 'BANCO',
    destino: 'CAIXA'
  });

  /* O CÓDIGO VEM DO MAIOR QUE EXISTE, não da contagem de linhas: aposentar
     uma finalidade do meio faria a contagem apontar para um código já usado,
     e código repetido é chave repetida — o defeito que apaga linhas calado. */
  conferir('o código é o próximo livre depois da F28', r.codigo, 'F29');
  conferir('a lista de finalidades cresceu uma',
    contexto.finalidadesCadastradas_().length, antes + 1);
  conferir('e a de onde cada uma vale, também',
    contexto.regrasDeFinalidade_().length, antesRegras + 1);

  var nova = null;
  contexto.finalidadesCadastradas_().forEach(function (f) { if (f.codigo === 'F29') nova = f; });
  conferirQue('a finalidade nova está lá', !!nova);
  conferir('com o nome que foi digitado', nova.nome,
    'Repor o caixa depois do atendimento extraordinário');
  conferir('e as frentes marcadas', nova.frentes, 'PIEDADE');

  /* A FONTE NÃO É INVENTADA. As 26 do projeto citam manual da obra, uma por
     uma. Esta não veio de manual nenhum, e dizer que veio seria mentir no
     cadastro — quem conferir daqui a dois anos precisa da diferença. */
  conferirQue('a fonte diz que é decisão desta tesouraria, com a data',
    /decis[aã]o desta tesouraria/i.test(nova.fonte) && /\d{2}\/\d{2}\/\d{4}/.test(nova.fonte),
    nova.fonte);

  var regraNova = null;
  contexto.regrasDeFinalidade_().forEach(function (x) { if (x.codigo === 'F29') regraNova = x; });
  conferirQue('a linha de onde ela vale está lá', !!regraNova);
  conferir('com a forma da tela', regraNova.forma, 'SAQUE');
  conferir('a subforma da tela', regraNova.subforma, 'DINHEIRO');
  conferir('e a natureza das duas contas',
    regraNova.origem + '→' + regraNova.destino, 'BANCO→CAIXA');
  conferir('a Folha fica vazia: ela é o código do levantamento, e esta não veio de lá',
    regraNova.folha, '');

  /* E O EFEITO QUE IMPORTA: ela passa a ser oferecida naquela combinação.
     Gravar sem isso seria gravar uma linha que nunca casa com nada. */
  function conta(pedaco) {
    var achado = '';
    contexto.lerCadastro_('CONTAS').forEach(function (c) {
      var t = String(c['Texto que aparece na lista']);
      if (!achado && t.indexOf(pedaco) >= 0) achado = t;
    });
    return achado;
  }
  var oferecidas = contexto.finalidadesQueValem_(
    conta('101.10 - BB'), conta('PIA-COXIM: 100.10'), 'SAQUE', 'DINHEIRO')
    .map(function (x) { return x.finalidade.codigo; });
  conferirQue('a finalidade nova já aparece naquela combinação',
    oferecidas.indexOf('F29') >= 0, oferecidas.join(' '));

  /* NOME REPETIDO É RECUSADO, e a mensagem diz o que fazer: quase sempre o
     que falta não é finalidade nova, é uma linha de onde a antiga vale. */
  var reclamou = '';
  try {
    contexto.acrescentarFinalidadeDoFormulario({ nome: 'Zerar a conta ACG', tipo: 'X' });
    contexto.acrescentarFinalidadeDoFormulario({ nome: 'zerar a CONTA acg', tipo: 'X' });
  } catch (e) { reclamou = e.message; }
  conferirQue('nome repetido, sem acento e em outra caixa, é recusado',
    reclamou.indexOf('Já existe') >= 0, reclamou || '(não recusou)');
  conferirQue('e a mensagem encaminha para o lugar certo',
    reclamou.indexOf('ONDE CADA FINALIDADE VALE') >= 0, reclamou);

  var semNome = '';
  try { contexto.acrescentarFinalidadeDoFormulario({ nome: '   ' }); }
  catch (e) { semNome = e.message; }
  conferirQue('sem nome, também recusa', semNome.indexOf('nome') >= 0, semNome);

  // Devolve a aba ao estado do projeto para as conferências seguintes.
  planilha.getRangeByName('CAD_FINALIDADES').clearContent();
  planilha.getRangeByName('CAD_REGRAS_FINALIDADE').clearContent();
  contexto.esquecerCadastros_();
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();
  conferir('e a aba volta ao estado do projeto',
    contexto.finalidadesCadastradas_().length, 26);
});

rodar('o número do cartão sai colado na conta, e só em lançamento único', function () {
  /* PEDIDO DELE (4.2). Em lote a tabela tem a coluna DOCUMENTO / CARTÃO; em
     lançamento único a tabela não aparece — é regra do projeto — e o número
     ficava sem lugar. Ele vai colado na CONTA porque é ela que o número
     identifica: `204.9 - CARTÃO DE DÉBITO` existe em todas as PIAs. */
  conferir('colado no fim do texto da conta',
    contexto.nucleoContaComCartao('PIA-COXIM: 204.9 - CARTÃO DE DÉBITO', '127884146'),
    'PIA-COXIM: 204.9 - CARTÃO DE DÉBITO Nº 127884146');
  conferir('sem número, a conta sai como está',
    contexto.nucleoContaComCartao('PIA-COXIM: 204.9 - CARTÃO DE DÉBITO', ''),
    'PIA-COXIM: 204.9 - CARTÃO DE DÉBITO');
  conferir('sem conta, nada a colar', contexto.nucleoContaComCartao('', '127884146'), '');

  /* E NÃO REPETE. Se a conta já traz o número (alguém cadastrou assim), colar
     de novo faria o papel dizer o número duas vezes na mesma linha. */
  conferir('número que já está na conta não entra de novo',
    contexto.nucleoContaComCartao('CARTÃO 127884146 - PIEDADE', '127884146'),
    'CARTÃO 127884146 - PIEDADE');

  /* DE QUE LADO ESTÁ O CARTÃO — a mesma resposta para a tela e para o
     servidor, porque é a mesma função. */
  var cartao = { natureza: 'CARTAO' }, acg = { natureza: 'ACG' };
  conferir('cartão no destino', contexto.nucleoLadoDoCartao(acg, cartao), 'destino');
  conferir('cartão na origem', contexto.nucleoLadoDoCartao(cartao, acg), 'origem');
  conferir('cartão nos dois lados', contexto.nucleoLadoDoCartao(cartao, cartao), 'ambos');
  conferir('nenhum cartão', contexto.nucleoLadoDoCartao(acg, acg), '');
  conferir('conta ainda não escolhida', contexto.nucleoLadoDoCartao(null, null), '');
});

rodar('o cartão escolhido chega ao papel, na linha da conta', function () {
  /* A conferência acima prova a REGRA; esta prova o CAMINHO — que o número
     sai da tela, atravessa o servidor e aparece na célula. Já aconteceu de
     uma regra certa nunca ser chamada. */
  var comCartao = {
    referencia: 'CMP-26/044', status: 'APROVADA', etapaAtual: 'APROVADA',
    data: '2026-09-22', observacao: 'carga do cartão',
    contaOrigem: 'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE',
    contaDestino: 'PIA-COXIM: 204.9 - CARTÃO DE DÉBITO',
    cartaoDestino: '127884146',
    modo: 'unico', valor: 500, lancamentos: [],
    mesmosAssinantes: true, assinantesPorEtapa: { TODAS: [] }
  };
  contexto.preencherComprovante(comCartao);
  conferir('a conta de destino leva o número do cartão',
    valor(comprovante, contexto.faixa_('P:V', 'CONTAS')),
    'PIA-COXIM: 204.9 - CARTÃO DE DÉBITO Nº 127884146');
  conferir('e a de origem, que não é cartão, fica intacta',
    valor(comprovante, contexto.faixa_('E:M', 'CONTAS')),
    'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE');

  /* E O QUE NÃO PODE SOBRAR: gerar outro comprovante sem cartão tem de
     LIMPAR o número. É a regra do "campo vazio limpa a célula" — um
     comprovante nunca sai com dado do anterior. */
  comCartao.referencia = 'CMP-26/045';
  comCartao.cartaoDestino = '';
  contexto.preencherComprovante(comCartao);
  conferir('sem cartão, o número do comprovante anterior não fica',
    valor(comprovante, contexto.faixa_('P:V', 'CONTAS')),
    'PIA-COXIM: 204.9 - CARTÃO DE DÉBITO');
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
  /* A Observação leva na frente o tipo de contas envolvidas, deduzido das
     duas contas — BB de PIA-COXIM e ACG de PIA-SÃO GABRIEL são as duas do
     grupo 101, então "ENTRE BANCOS". Era o que as finalidades departamentais
     diziam antes de serem aposentadas; agora ninguém precisa lembrar. */
  conferir('observação em caixa alta, com o tipo de contas na frente',
    valor(sh, f('G:V', 'OBS')),
    'ENTRE BANCOS. SUPRI CONTA BANCO SÃO GABRIEL PAGCORP');
  conferir('valor', valor(sh, f('O:P', 'IDENT_2')), 1800);
  conferir('extenso', valor(sh, fm('R:V', 'IDENT_2', 'IDENT_2B')), '(UM MIL E OITOCENTOS REAIS)');

  /* O CARTÃO NO PAPEL. Esta movimentação não tem cartão, então a conta sai
     limpa — é a metade da regra que garante que o campo novo não suja quem
     nunca vai usá-lo. A outra metade vem logo abaixo. */
  conferir('sem cartão, a conta de destino sai como está cadastrada',
    valor(sh, f('P:V', 'CONTAS')),
    'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE');

  conferir('PIA de origem, escrita pela conta', valor(sh, f('D:L', 'ORIGEM_DESTINO')), 'PIA - COXIM');
  conferir('PIA de destino, escrita pela conta', valor(sh, f('O:V', 'ORIGEM_DESTINO')), 'PIA - SÃO GABRIEL');
  conferir('CNPJ de origem', valor(sh, f('D:L', 'CNPJ')), '03.673.233/0001-43');
  conferir('CNPJ de destino', valor(sh, f('O:V', 'CNPJ')), '03.673.233/0001-43');
  conferir('título entre PIAs diferentes', valor(sh, f('B:V', 'TITULO')),
    'COMPROVANTE DE TRANSFERÊNCIA (externa) DE NUMERÁRIOS');
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
  conferir('resumo devolvido: título', r.titulo, 'COMPROVANTE DE TRANSFERÊNCIA (externa) DE NUMERÁRIOS');
});

/* ---------- caso 2: lote de cartões, dentro da mesma PIA ---------------- */
var movLote = {
  referencia: 'CMP-26/008', numeracaoSiga: '', status: 'APROVADA', etapaAtual: 'APROVADA',
  data: '2026-09-18',
  tipo: 'Carregamento de cartao pre-pago',
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
    'COMPROVANTE DE MOVIMENTAÇÃO INTERNA (de numerários)');

  /* O PARÊNTESE FICA EM CAIXA BAIXA, e isto é conferência e não enfeite: todo
     o resto do documento sai em caixa alta, e o caminho normal de escrita
     (`val_`, `maiuscula_`) devolveria "(DE NUMERÁRIOS)". O título é escrito
     sem passar por ele justamente por isso. */
  conferirQue('e o parêntese do título não vira caixa alta',
    valor(sh, f('B:V', 'TITULO')).indexOf('(de numerários)') > 0,
    valor(sh, f('B:V', 'TITULO')));
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

rodar('lote de UM lançamento mostra a tabela (um cartão só)', function () {
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

  /* A OBSERVAÇÃO TEM DUAS LINHAS DE ALTURA e quebra o texto. Em uma linha só
     ela era CLIP: o que passasse da largura sumia do PDF sem avisar — e o
     sistema passou a gastar uns 20 caracteres dela com o tipo de contas.
     Os 16 px a mais saem de PREENCHIMENTO, não da folha: a conferência acima,
     que exige a altura exata, é o que prova isso. */
  var obs = comprovante.getRange(contexto.faixa_('G:V', 'OBS'));
  conferir('a Observação tem duas linhas de altura',
    comprovante.getRowHeight(contexto.lin_('OBS')), 32);
  conferir('e ajusta o texto em vez de cortar',
    String(obs.getWrapStrategy()), 'WRAP');

  /* E o texto longo cabe mesmo: duas linhas de 6 pt numa faixa de 601 px. */
  var comprido = 'ENTRE CAIXA E BANCO. ' +
    'SANGRIA DO CAIXA DA SECRETARIA PARA A CONTA MOVIMENTO DO BANCO DO BRASIL, ' +
    'CONFORME DELIBERACAO DA REUNIAO DE DIACONOS';
  conferirQue('e o texto longo tem onde caber', comprido.length < 270, comprido.length);
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
    pdfsGerados[0], 'CMP-26-001-APROVADA - ' +
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
    contexto.lerCadastro_('FINALIDADES').length === 26);
});

rodar('cada bloco sobrevive a ganhar uma coluna NOVA no fim', function () {
  /* A PROVA DA REGRA "coluna nova vai no fim", feita por simulação e não por
     disciplina. Para cada lista, monta a aba como ela era ANTES da última
     coluna existir (linhas com uma coluna a menos), recria, e exige que todo
     valor tenha ficado na coluna certa.

     Foi escrita depois de eu mesmo quebrar a regra duas vezes: a Natureza no
     meio de CONTAS (três sintomas que pareciam três problemas) e "Formas que
     combinam" no meio de TIPOS, que empurrou a Observação para dentro da
     coluna das formas e fez a tela anunciar "0 de 9 combinam com PIX". */
  contexto.BLOCOS_CADASTRO.forEach(function (bloco) {
    var nCols = bloco.colunas.length;
    if (nCols < 2) return;

    var intervalo = planilha.getRangeByName('CAD_' + bloco.id);
    var antes = intervalo.getValues().filter(function (l) {
      return String(l[0]).trim() !== '';
    });
    if (!antes.length) return;

    // Como a aba era antes da última coluna existir: o valor dela apagado.
    antes.forEach(function (linha, i) {
      intervalo.getCell(i + 1, nCols).setValue('');
    });
    contexto.esquecerCadastros_();
    contexto.criarAbaCadastros();
    contexto.esquecerCadastros_();

    var depois = {};
    contexto.lerCadastro_(bloco.id).forEach(function (item) {
      var linha = bloco.colunas.map(function (c) { return item[c.nome]; });
      depois[contexto.chaveDaLinha_(bloco, linha)] = linha;
    });

    var tortas = [];
    antes.forEach(function (linha) {
      var achada = depois[contexto.chaveDaLinha_(bloco, linha)];
      if (!achada) return;
      for (var c = 0; c < nCols - 1; c++) {
        if (String(linha[c]).trim() !== String(achada[c]).trim()) {
          tortas.push(bloco.colunas[c].nome + ': "' + linha[c] + '" virou "' + achada[c] + '"');
        }
      }
    });
    conferirQue(bloco.id + ': nenhum valor mudou de coluna',
      !tortas.length, tortas.slice(0, 2).join(' | '));

    /* DEVOLVE A ABA COMO ESTAVA. Sem isto, esta conferência estraga o
       cadastro para todas as seguintes — e um teste que quebra os outros
       testes é pior do que teste nenhum: as falhas aparecem longe da causa. */
    var volta = planilha.getRangeByName('CAD_' + bloco.id);
    antes.forEach(function (linha, i) {
      for (var c = 0; c < nCols; c++) volta.getCell(i + 1, c + 1).setValue(linha[c]);
    });
    contexto.esquecerCadastros_();
  });

  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();
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

  /* Desloca como a recriação antiga deslocou: tira a Natureza do meio, encosta
     todo o resto à esquerda e completa o fim com vazio. Escrito assim, sem
     números de coluna à mão, para o dia em que o bloco ganhar mais uma coluna
     no fim — senão o teste continua "passando" simulando meio estrago. */
  var iNatureza = 0;
  contexto.blocoPorId_('CONTAS').colunas.forEach(function (c, i) {
    if (c.nome === 'Natureza') iNatureza = i;
  });
  var nColsContas = contexto.blocoPorId_('CONTAS').colunas.length;
  for (var l = 0; l < quantas; l++) {
    for (var c = iNatureza; c < nColsContas - 1; c++) {
      contas.getCell(l + 1, c + 1).setValue(linhas[l][c + 1]);
    }
    contas.getCell(l + 1, nColsContas).setValue('');
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

rodar('a forma também tem regra própria: caixa e instituição', function () {
  /* DUAS COISAS DIFERENTES CORTAM UMA FORMA, e confundi-las é o que fazia
     falta aqui. O bloco REGRAS ENTRE CONTAS diz o que esta tesouraria decidiu
     sobre um par ("não há agência do Santander na cidade"). O bloco FORMAS diz
     o que a forma É: dinheiro sem caixa em ponta nenhuma não é dinheiro, e
     transferência bancária entre dois bancos diferentes não é transferência
     bancária — é TED ou PIX. A segunda não é decisão de ninguém.

     A tabela abaixo é a que o Taynã mandou, conta por conta, virada em
     conferência. */
  function conta(pedaco) {
    var achado = '';
    contexto.lerCadastro_('CONTAS').forEach(function (c) {
      var t = String(c['Texto que aparece na lista']);
      if (!achado && t.indexOf(pedaco) >= 0) achado = t;
    });
    if (!achado) throw new Error('conta não encontrada no cadastro: ' + pedaco);
    return achado;
  }
  function formas(de, para) {
    return contexto.formasEntreContas_(de, para).formas
      .map(function (f) { return f.nome; }).join(', ');
  }

  var caixaCoxim   = conta('PIA-COXIM: 100.10');
  var caixaSonora  = conta('PIA-SONORA: 100.10');
  var bb           = conta('101.10 - BB');
  var sant         = conta('101.12 - SANT');
  var santViagem   = conta('101.13 - SANT');
  var acgCoxim     = conta('101.15 - ACG');
  var acgSonora    = conta('101.16 - ACG');
  var cartaoDebito = conta('PIA-COXIM: 204.9');
  var cartaoCred   = conta('PIA-COXIM: 201.9');

  /* O CAIXA: sai em espécie, entra em espécie ou cheque. */
  conferir('caixa -> banco: só dinheiro', formas(caixaCoxim, bb), 'DINHEIRO');
  conferir('banco -> caixa: dinheiro ou cheque', formas(bb, caixaCoxim), 'DINHEIRO, CHEQUE');
  conferir('caixa -> caixa: dinheiro', formas(caixaCoxim, caixaSonora), 'DINHEIRO');

  /* DINHEIRO E CHEQUE EXIGEM UM CAIXA. Entre dois bancos eles somem — e não
     por regra da ADM nenhuma: dinheiro que não passa por um caixa não é
     dinheiro, é transferência. */
  conferirQue('banco -> banco não oferece dinheiro',
    formas(bb, sant).indexOf('DINHEIRO') < 0, formas(bb, sant));
  conferirQue('nem cheque',
    formas(bb, sant).indexOf('CHEQUE') < 0, formas(bb, sant));

  /* A INSTITUIÇÃO: transferência bancária é dentro da mesma; TED e PIX
     existem para atravessar. */
  conferir('BB -> SANT: instituições diferentes', formas(bb, sant), 'TED, PIX');
  conferir('SANT -> SANT: a mesma instituição', formas(sant, santViagem), 'TRANSF. BANCÁRIA');
  conferir('ACG -> ACG: a mesma instituição', formas(acgCoxim, acgSonora), 'TRANSF. BANCÁRIA');
  conferir('ACG -> cartão dela: a mesma instituição',
    formas(acgCoxim, cartaoDebito), 'TRANSF. BANCÁRIA');
  conferir('cartão -> cartão: a mesma instituição',
    formas(cartaoDebito, cartaoCred), 'TRANSF. BANCÁRIA');
  conferir('ACG -> banco: só PIX', formas(acgCoxim, bb), 'PIX');
  conferir('banco -> ACG: só PIX', formas(bb, acgCoxim), 'PIX');

  /* A EXCEÇÃO QUE ELE DESCREVEU: sacar do cartão no banco 24h e devolver o
     dinheiro à tesouraria, na prestação de contas. */
  conferir('cartão -> caixa: dinheiro', formas(cartaoDebito, caixaCoxim), 'DINHEIRO');

  /* OS PARES QUE FICAM IMPOSSÍVEIS. Nenhum deles foi escrito como proibição:
     todos caem de regras que ele deu, cruzadas. */
  conferir('caixa -> ACG: bloqueado', formas(caixaCoxim, acgCoxim), '');
  conferir('SANT -> caixa: bloqueado (não há agência na cidade)',
    formas(sant, caixaCoxim), '');
  conferir('caixa -> SANT: bloqueado', formas(caixaCoxim, sant), '');
  /* O cartão é da ACG: para um banco de fora só haveria PIX, e cartão não faz
     PIX. Quem precisa disso devolve para a conta ACG e de lá manda. */
  conferir('cartão -> banco de fora: bloqueado', formas(cartaoDebito, bb), '');

  /* A MENSAGEM EXPLICA O CORTE. Sem isto a pessoa vê a forma sumir e não
     descobre por quê — que é o defeito que o projeto inteiro tenta não ter. */
  var motivos = contexto.formasEntreContas_(cartaoDebito, bb).motivos.join(' | ');
  conferirQue('e diz que as instituições são diferentes',
    /institui/i.test(motivos), motivos);

  /* SEM OS DOIS LADOS NÃO HÁ COMPARAÇÃO. Um caixa não pertence a banco nenhum;
     concluir "são diferentes, então pode TED" seria inventar resposta a partir
     de um dado que não existe. */
  conferir('caixa não tem instituição: a restrição não corta',
    contexto.nucleoFormaCabe({ nome: 'PIX', instituicoes: 'DIFERENTES' },
      { natureza: 'CAIXA', instituicao: '' }, { natureza: 'BANCO', instituicao: 'BB' }), '');
  conferirQue('mas com os dois lados ela corta',
    !!contexto.nucleoFormaCabe({ nome: 'PIX', instituicoes: 'DIFERENTES' },
      { natureza: 'BANCO', instituicao: 'BB' }, { natureza: 'BANCO', instituicao: 'BB' }));
  conferirQue('"exige conta de CAIXA" aceita o caixa de qualquer um dos lados',
    !contexto.nucleoFormaCabe({ nome: 'DINHEIRO', exigeNatureza: 'CAIXA' },
      { natureza: 'BANCO' }, { natureza: 'CAIXA' }) &&
    !contexto.nucleoFormaCabe({ nome: 'DINHEIRO', exigeNatureza: 'CAIXA' },
      { natureza: 'CAIXA' }, { natureza: 'BANCO' }));

  /* E A TRAVA DE VERDADE, no servidor, acompanha. */
  var travou = '';
  try {
    contexto.conferirRegraEntreContas_({ contaOrigem: bb, contaDestino: sant, forma: 'TRANSF. BANCÁRIA' });
  } catch (e) { travou = e.message; }
  conferirQue('o servidor recusa transferência bancária entre bancos diferentes',
    travou.indexOf('não é permitida') >= 0, travou || '(não travou)');
});

rodar('o cadastro aposenta uma linha e completa uma coluna nova', function () {
  /* DOIS BURACOS DA RECRIAÇÃO, que só aparecem em quem JÁ TEM a aba criada —
     nunca numa planilha nova, que é onde a bateria costuma olhar.

     1) Recriar PRESERVA o que existe. Logo, uma linha que o projeto deixou de
        trazer fica lá para sempre: o DOC, extinto pelo Banco Central,
        continuaria sendo oferecido como forma.
     2) Uma coluna nova no fim nasce VAZIA nas linhas que já estavam. A regra
        nova existe no projeto e não vale para ninguém — sem sinal nenhum. */
  var b = contexto.blocoPorId_('FINALIDADES'), iSentido = -1;
  b.colunas.forEach(function (c, k) { if (c.nome === 'Sentido') iSentido = k; });

  var fins = planilha.getRangeByName('CAD_FINALIDADES');
  var v = fins.getValues(), n = 0;
  while (n < v.length && String(v[n][0]).trim() !== '') n++;
  for (var l = 0; l < n; l++) fins.getCell(l + 1, iSentido + 1).setValue('');
  contexto.esquecerCadastros_();

  conferirQue('o estrago foi mesmo feito (o teste testa alguma coisa)',
    contexto.lerCadastro_('FINALIDADES').every(function (f) {
      return String(f['Sentido'] || '').trim() === '';
    }));

  ULTIMO_ALERTA = { titulo: '', corpo: '' };
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();

  var invertidas = contexto.lerCadastro_('FINALIDADES').filter(function (f) {
    return String(f['Sentido'] || '').trim() === 'INVERTIDO';
  }).map(function (f) { return String(f['Código']); });
  conferir('a coluna nova foi completada a partir do projeto',
    invertidas.join(' '), 'F10 F14 F15');
  conferirQue('e a janela avisa que completou',
    /COMPLETADO \(\d+\)/.test(ULTIMO_ALERTA.corpo), ULTIMO_ALERTA.corpo);

  /* A LINHA APOSENTADA. O DOC saiu da lista de formas por ter sido extinto
     pelo Banco Central; sem `aposentadas`, ele ficaria na aba de quem já a
     tinha criada, para sempre. */
  var formas = planilha.getRangeByName('CAD_FORMAS');
  var vf = formas.getValues(), nf = 0;
  while (nf < vf.length && String(vf[nf][0]).trim() !== '') nf++;
  formas.getCell(nf + 1, 1).setValue('TRANSF. DOC');
  formas.getCell(nf + 1, 2).setValue('Não');
  contexto.esquecerCadastros_();

  ULTIMO_ALERTA = { titulo: '', corpo: '' };
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();
  conferirQue('a linha aposentada saiu',
    !contexto.lerCadastro_('FORMAS').some(function (f) { return /DOC/.test(String(f.Forma)); }),
    contexto.lerCadastro_('FORMAS').map(function (f) { return f.Forma; }).join(' | '));
  conferirQue('e a janela diz que ela saiu, com nome',
    /SAIU \(\d+\)/.test(ULTIMO_ALERTA.corpo) && /DOC/.test(ULTIMO_ALERTA.corpo),
    ULTIMO_ALERTA.corpo);

  /* O CONTRÁRIO, que é o que torna isto seguro: uma coluna com valor em
     ALGUMA linha não é uma coluna nova, e ninguém mexe nela.

     ATENÇÃO AO INTERVALO: recriar a aba TROCA a folha, e o `Range` guardado
     antes continua apontando para a folha velha. Escrever nele não chega à
     aba viva — e este teste passou uma rodada inteira assim, "provando" que
     nada tinha sido completado quando nada tinha sido esvaziado. */
  var fins2 = planilha.getRangeByName('CAD_FINALIDADES');
  var agora = fins2.getValues(), quantas2 = 0;
  while (quantas2 < agora.length && String(agora[quantas2][0]).trim() !== '') quantas2++;
  var guardada = -1;
  for (var l2 = 0; l2 < quantas2; l2++) {
    if (guardada < 0 && String(agora[l2][iSentido]).trim() !== '') { guardada = l2; continue; }
    fins2.getCell(l2 + 1, iSentido + 1).setValue('');
  }
  contexto.esquecerCadastros_();
  conferir('o teste esvaziou mesmo (menos uma linha)',
    contexto.lerCadastro_('FINALIDADES').filter(function (f) {
      return String(f['Sentido'] || '').trim() !== '';
    }).length, 1);

  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();
  conferir('coluna com valor em alguma linha não é completada',
    contexto.lerCadastro_('FINALIDADES').filter(function (f) {
      return String(f['Sentido'] || '').trim() !== '';
    }).length, 1);

  /* O ENSAIO DA ABA DELE, inteiro. A aba de ontem tinha CONTAS sem a coluna
     Instituição e FORMAS sem as duas colunas novas — três buracos de uma vez,
     em três listas diferentes. Recriar tem de curar todos numa passada só:
     curar dois de três deixaria a regra nova valendo pela metade, que é pior
     do que não valer, porque parece funcionar. */
  function esvaziarColuna(id, nomeDaColuna) {
    var bl = contexto.blocoPorId_(id), i = -1;
    bl.colunas.forEach(function (c, k) { if (c.nome === nomeDaColuna) i = k; });
    var r = planilha.getRangeByName('CAD_' + id), vv = r.getValues(), q = 0;
    while (q < vv.length && String(vv[q][0]).trim() !== '') q++;
    for (var j = 0; j < q; j++) r.getCell(j + 1, i + 1).setValue('');
    return q;
  }
  esvaziarColuna('CONTAS', 'Instituição');
  esvaziarColuna('FORMAS', 'Exige conta de');
  esvaziarColuna('FORMAS', 'Instituições');
  contexto.esquecerCadastros_();

  /* O TESTE TESTA ALGUMA COISA? Já aconteceu de um teste destes passar sem ter
     esvaziado nada, guardando um Range da folha morta. Primeiro se prova o
     estrago; só depois faz sentido provar a cura. */
  conferirQue('o estrago foi mesmo feito nas duas listas',
    contexto.lerCadastro_('CONTAS').every(function (c) {
      return String(c['Instituição'] || '').trim() === '';
    }) && contexto.lerCadastro_('FORMAS').every(function (f) {
      return String(f['Instituições'] || '').trim() === '';
    }));

  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();

  var pix = null;
  contexto.lerCadastro_('FORMAS').forEach(function (f) {
    if (String(f.Forma) === 'PIX') pix = f;
  });
  conferir('o PIX recuperou a regra de instituição',
    String(pix['Instituições']), 'DIFERENTES');

  var comInstituicao = contexto.lerCadastro_('CONTAS').filter(function (c) {
    return String(c['Instituição'] || '').trim() !== '';
  }).length;
  conferirQue('as contas recuperaram a Instituição', comInstituicao === 20,
    'contas com instituição: ' + comInstituicao);

  /* E O EFEITO QUE IMPORTA: não basta a coluna voltar, a regra tem de voltar
     a cortar. Sem esta linha, o teste provaria só que uma célula foi escrita. */
  var bbT = '', santT = '';
  contexto.lerCadastro_('CONTAS').forEach(function (c) {
    var t = String(c['Texto que aparece na lista']);
    if (!bbT && /101\.10 - BB/.test(t)) bbT = t;
    if (!santT && /101\.12 - SANT/.test(t)) santT = t;
  });
  conferir('e BB -> SANT já não oferece transferência bancária',
    contexto.formasEntreContas_(bbT, santT).formas.map(function (f) { return f.nome; }).join(', '),
    'TED, PIX');

  // Devolve a aba ao estado do projeto para as conferências seguintes.
  planilha.getRangeByName('CAD_FINALIDADES').clearContent();
  contexto.esquecerCadastros_();
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();
  conferir('e a aba volta inteira ao estado do projeto',
    contexto.lerCadastro_('FINALIDADES').length, 26);
});


rodar('o que recriar NÃO conserta: valor trocado numa linha que já existe', function () {
  /* O LIMITE DE "RECRIAR PRESERVA", escrito como conferência para ninguém
     (eu inclusive) prometer ao Taynã o que a recriação não faz.

     Recriar sabe ACRESCENTAR linha nova e COMPLETAR coluna nova (a que está
     vazia em todas as linhas). Não sabe TROCAR o valor de uma célula que já
     tem dono — e não deve saber: numa coluna onde vazio significa alguma
     coisa, sobrescrever seria apagar uma decisão da tesouraria para impor a do
     projeto.

     A consequência prática: quando o projeto passa a dar valor a uma célula
     que na aba dele está vazia, esse valor NÃO chega sozinho. Tem de ser
     digitado, ou a lista tem de ser substituída pela janela de importação. */
  var b = contexto.blocoPorId_('FINALIDADES'), iSentido = -1;
  b.colunas.forEach(function (c, k) { if (c.nome === 'Sentido') iSentido = k; });

  var fins = planilha.getRangeByName('CAD_FINALIDADES');
  var v = fins.getValues(), n = 0;
  while (n < v.length && String(v[n][0]).trim() !== '') n++;
  var alvo = -1;
  for (var l = 0; l < n; l++) if (String(v[l][0]).trim() === 'F10') alvo = l;
  conferirQue('a F10 está na lista', alvo >= 0);

  // A aba dele: a F10 ainda sem o sentido, e o resto da coluna preenchido.
  fins.getCell(alvo + 1, iSentido + 1).setValue('');
  contexto.esquecerCadastros_();

  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();

  var f10 = '';
  contexto.lerCadastro_('FINALIDADES').forEach(function (f) {
    if (String(f['Código']) === 'F10') f10 = String(f['Sentido'] || '').trim();
  });
  conferir('recriar NÃO escreve por cima da célula que já tem dono', f10, '');

  /* E o conserto, que é o caminho que o Taynã tem: digitar na célula. */
  var fins2 = planilha.getRangeByName('CAD_FINALIDADES');
  var v2 = fins2.getValues(), n2 = 0;
  while (n2 < v2.length && String(v2[n2][0]).trim() !== '') n2++;
  for (var l2 = 0; l2 < n2; l2++) {
    if (String(v2[l2][0]).trim() === 'F10') fins2.getCell(l2 + 1, iSentido + 1).setValue('INVERTIDO');
  }
  contexto.esquecerCadastros_();
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();

  var depois = '';
  contexto.lerCadastro_('FINALIDADES').forEach(function (f) {
    if (String(f['Código']) === 'F10') depois = String(f['Sentido'] || '').trim();
  });
  conferir('e o que ele digitou fica', depois, 'INVERTIDO');
});


rodar('substituir a lista pela importação entrega o que recriar não entrega', function () {
  /* O CAMINHO QUE SOBRA quando o projeto muda o valor de uma célula que já tem
     dono. Recriar preserva (e deve preservar); a janela "Importar dados para
     os Cadastros", em modo SUBSTITUIR, troca a lista inteira.

     Está conferido aqui porque é o que vai ser pedido ao Taynã. Mandar alguém
     colar um texto numa janela sem ter rodado o caminho antes é pedir que ele
     teste o que eu não testei — e o texto que ele vai colar é exatamente este
     arquivo. */
  var csv = fs.readFileSync(path.join(raiz, 'cadastros', 'finalidades.csv'), 'utf8');

  var b = contexto.blocoPorId_('FINALIDADES'), iSentido = -1;
  b.colunas.forEach(function (c, k) { if (c.nome === 'Sentido') iSentido = k; });
  var fins = planilha.getRangeByName('CAD_FINALIDADES');
  var v = fins.getValues(), n = 0;
  while (n < v.length && String(v[n][0]).trim() !== '') n++;
  for (var l = 0; l < n; l++) {
    if (String(v[l][0]).trim() === 'F10') fins.getCell(l + 1, iSentido + 1).setValue('');
  }
  contexto.esquecerCadastros_();

  /* O modo escrito em minúsculas tem de ESTOURAR, não cair calado no
     "acrescentar" — foi assim que esta bateria acabou com a lista em dobro. */
  var reclamou = '';
  try { contexto.importarCadastroTexto('FINALIDADES', csv, 'substituir?', true); }
  catch (e) { reclamou = e.message; }
  conferirQue('modo desconhecido estoura em vez de duplicar a lista',
    reclamou.indexOf('desconhecido') >= 0, reclamou || '(não estourou)');
  conferir('e a lista não foi mexida', contexto.lerCadastro_('FINALIDADES').length, 26);

  var resultado = contexto.importarCadastroTexto('FINALIDADES', csv, 'SUBSTITUIR', true);
  contexto.esquecerCadastros_();
  conferirQue('a importação aceitou o arquivo do projeto', !!resultado);

  var depois = contexto.lerCadastro_('FINALIDADES');
  conferir('e a lista ficou com as 26 finalidades', depois.length, 26);
  var f10 = null;
  depois.forEach(function (f) { if (String(f['Código']) === 'F10') f10 = f; });
  conferir('a F10 voltou com o sentido invertido', String(f10['Sentido']), 'INVERTIDO');
  conferirQue('o cabeçalho do arquivo não virou uma linha de dados',
    !depois.some(function (f) { return /^C.digo$/.test(String(f['Código'])); }),
    depois.map(function (f) { return f['Código']; }).join(' | '));

  /* E O ARQUIVO QUE VAI SER PEDIDO AGORA: onde_cada_finalidade_vale. Ele faz
     duas coisas de uma vez na aba dele — traz as colunas Origem e Destino, que
     recriar não traz (célula que já tem dono não se troca), e varre as 8
     linhas repetidas que a conversão de data deixou lá, porque a chave
     corrompida não casava com a do projeto e a recriação re-acrescentou tudo.

     A lista em DOBRO é justamente o estado da aba dele, então é esse o estado
     que se ensaia aqui — não a aba limpa, onde substituir seria fácil. */
  var csvFolha = fs.readFileSync(path.join(raiz, 'cadastros', 'finalidades_por_folha.csv'), 'utf8');
  var regrasRange = planilha.getRangeByName('CAD_REGRAS_FINALIDADE');
  var vRe = regrasRange.getValues(), nRe = 0;
  while (nRe < vRe.length && String(vRe[nRe][0]).trim() !== '') nRe++;
  var bRe = contexto.blocoPorId_('REGRAS_FINALIDADE');
  for (var d = 0; d < 8; d++) {
    for (var col = 0; col < bRe.colunas.length; col++) {
      regrasRange.getCell(nRe + 1 + d, col + 1).setValue(vRe[d][col]);
    }
  }
  contexto.esquecerCadastros_();
  conferir('a aba em dobro foi mesmo montada (47, como a dele)',
    contexto.lerCadastro_('REGRAS_FINALIDADE').length, nRe + 8);

  /* O FORMATO DA ÁREA É APAGADO DE PROPÓSITO ANTES DE IMPORTAR.
     Sem isto o teste passava sem provar nada: na bancada a recriação sempre
     vinha antes da importação e já tinha formatado tudo como texto, então a
     importação herdava o formato e a falta dela não aparecia. Numa aba de
     verdade essa ordem não é garantida — e foi exatamente aí que a lista
     dele voltou a 47. */
  regrasRange.setNumberFormat('0.00');
  contexto.importarCadastroTexto('REGRAS_FINALIDADE', csvFolha, 'SUBSTITUIR', true);
  contexto.esquecerCadastros_();
  var folhaDepois = contexto.lerCadastro_('REGRAS_FINALIDADE');
  conferir('substituir devolve as 39 linhas, sem as repetidas', folhaDepois.length, 39);
  conferirQue('e as colunas Origem e Destino chegaram preenchidas',
    folhaDepois.filter(function (r) {
      return String(r['Origem'] || '').trim() !== '' ||
             String(r['Destino'] || '').trim() !== '';
    }).length === 28);
  conferirQue('nenhuma Folha virou data no caminho da importação',
    !folhaDepois.some(function (r) { return r['Folha'] instanceof Date; }),
    folhaDepois.map(function (r) { return String(r['Folha']); }).join(' '));

  /* E O PASSO SEGUINTE, que é onde a duplicação voltou na planilha dele:
     importar arruma, e ENTÃO alguém recria a aba. Se o que a importação
     gravou não casar com a chave do projeto, a recriação acrescenta tudo de
     novo — e o estrago reaparece sem ninguém ter feito nada de errado.

     O teste antigo parava na importação. Parar ali é provar meia regra. */
  ULTIMO_ALERTA = { titulo: '', corpo: '' };
  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();
  conferir('e recriar DEPOIS da importação não acrescenta nada',
    contexto.lerCadastro_('REGRAS_FINALIDADE').length, 39);
  conferirQue('a janela do recriar não anuncia linha nova',
    ULTIMO_ALERTA.corpo.indexOf('ONDE CADA FINALIDADE VALE') < 0,
    ULTIMO_ALERTA.corpo);
});


rodar('o aviso de sentido invertido sobreviveu à troca de lista', function () {
  /* ELE ERA ALIMENTADO PELA COLUNA "Sentido crédito/débito" DO BLOCO TIPOS,
     que não existe mais. Passou a ler a coluna `Sentido` das FINALIDADES, pelo
     mapeamento que o Taynã confirmou: Zerar Conta -> F10; Transferência
     Débito -> F14 e F15.

     Isto precisa de conferência porque falha CALADO: se o nome deixar de
     casar, o aviso simplesmente nunca aparece, e o comprovante sai com origem
     e destino trocados sem ninguém ver nada de errado. */
  var sh = planilha.getSheetByName(contexto.ABA);
  var celula = sh.getRange(contexto.faixa_('G:V', 'TIPO'));

  function nomeDe(codigo) {
    var achado = '';
    contexto.lerCadastro_('FINALIDADES').forEach(function (f) {
      if (String(f['Código']) === codigo) achado = String(f['Finalidade']);
    });
    if (!achado) throw new Error('finalidade não encontrada: ' + codigo);
    return achado;
  }

  ['F10', 'F14', 'F15'].forEach(function (codigo) {
    /* O texto do campo é COMPOSTO e em caixa alta — é assim que ele chega à
       célula, e é assim que tem de casar. Testar com o nome solto provaria
       menos do que parece. */
    celula.setValue(contexto.nucleoTextoDoTipo(
      { subtipo: '' }, 'TRANSF. BANCÁRIA', '', nomeDe(codigo)));
    contexto.avisarSentidoInvertido_(sh);
    conferirQue(codigo + ': o aviso aparece no campo Tipo',
      /SENTIDO INVERTIDO/.test(String(celula.getNote() || '')),
      String(celula.getNote() || '(sem nota)'));
  });

  /* E O CONTRÁRIO, que é o que impede o aviso de virar enfeite permanente. */
  celula.setValue(contexto.nucleoTextoDoTipo(
    { subtipo: '' }, 'PIX', '', nomeDe('F09')));
  contexto.avisarSentidoInvertido_(sh);
  conferir('numa finalidade normal, a nota some',
    String(celula.getNote() || ''), '');

  celula.setValue('');
  contexto.avisarSentidoInvertido_(sh);
});


rodar('todo CSV da pasta cadastros entra pela janela de importação', function () {
  /* A GENERALIZAÇÃO DA CONFERÊNCIA ACIMA. Os arquivos de `cadastros/` são o
     que se manda o Taynã colar na janela quando recriar não dá conta. Dois
     deles já foram conferidos um a um; os outros sete nunca tinham passado
     pelo caminho da importação nesta bateria.

     E havia motivo para desconfiar: os arquivos antigos trazem cabeçalho em
     `Codigo_Reduzido_SIGA`, sem acento e com sublinhado, enquanto o bloco diz
     `Cód. SIGA`. Passam — a importação casa por posição, não por nome —, mas
     isso era suposição até aqui. Agora é medida, e o dia em que deixar de
     passar aparece nesta linha, não numa janela na frente dele. */
  var arquivos = {
    CONTAS: 'contas_por_pia.csv',
    CARTOES: 'cartoes.csv',
    DIACONOS: 'diaconos.csv',
    FORMAS: 'formas_de_movimentacao.csv',
    FINALIDADES: 'finalidades.csv',
    REGRAS_FINALIDADE: 'finalidades_por_folha.csv',
    STATUS: 'status.csv',
    ADMS: 'cnpj_e_localidades.csv',
    BANCOS: 'abreviaturas_bancos.csv'
  };

  /* TODO BLOCO COM CSV ESTÁ NA LISTA? Sem isto, um bloco novo com arquivo
     novo entraria sem conferência nenhuma, e a lista pareceria completa. */
  var semArquivo = [];
  contexto.BLOCOS_CADASTRO.forEach(function (b) {
    if (b.id === 'RELACOES' || b.id === 'CONTROLE') return;   // escritos no projeto
    if (!arquivos[b.id]) semArquivo.push(b.id);
  });
  conferir('todo bloco que tem CSV está nesta conferência', semArquivo.join(' '), '');

  Object.keys(arquivos).forEach(function (id) {
    var caminho = path.join(raiz, 'cadastros', arquivos[id]);
    var texto = fs.readFileSync(caminho, 'utf8');
    var esperado = contexto.blocoPorId_(id).dados.length;
    var deu = '';
    try {
      contexto.importarCadastroTexto(id, texto, 'SUBSTITUIR', true);
      contexto.esquecerCadastros_();
    } catch (e) { deu = e.message; }
    conferir(arquivos[id] + ' entra e devolve as linhas do projeto',
      deu || contexto.lerCadastro_(id).length, esperado);
  });
});


rodar('nenhuma regra entre contas é redundante', function () {
  /* REDUNDÂNCIA NÃO SE LÊ, SE MEDE. Tira-se cada regra, refaz-se o retrato de
     TODOS os pares de contas ativas, e compara-se com o retrato completo: a
     regra que não muda nada é repetição do que outra coisa já diz.

     Foi assim que três saíram — ACG→ACG, ACG→CARTÃO e CARTÃO→ACG, todas
     permitindo TRANSF. BANCÁRIA. Quando a coluna `Instituições` nasceu no
     bloco FORMAS, transferência bancária passou a exigir a mesma instituição
     por definição, e os cartões levam ACG: as três viraram eco. Nenhuma
     conferência acusou, porque todas continuavam dando a resposta certa.

     Esta conferência é o que impede a próxima de nascer e ficar. */
  var ativas = contexto.lerCadastro_('CONTAS').filter(function (c) {
    return /^ATIVA/i.test(String(c.Status || ''));
  }).map(function (c) { return String(c['Texto que aparece na lista']); });

  function retrato(relacoes) {
    var linhas = [];
    ativas.forEach(function (a) {
      ativas.forEach(function (b) {
        if (a === b) return;
        var r = contexto.nucleoFormasEntre(
          { natureza: contexto.naturezaDaConta_(a), texto: a,
            instituicao: contexto.instituicaoDaConta_(a) },
          { natureza: contexto.naturezaDaConta_(b), texto: b,
            instituicao: contexto.instituicaoDaConta_(b) },
          contexto.todasAsFormas_(), relacoes, true);
        linhas.push(a + '>' + b + '=' +
          r.formas.map(function (f) { return f.nome; }).sort().join(','));
      });
    });
    return linhas.join('\n');
  }

  var todas = contexto.relacoesNormalizadas_();
  var completo = retrato(todas);
  conferirQue('há pares de contas de verdade para medir',
    completo.split('\n').length > 100, completo.split('\n').length + ' pares');

  var inuteis = [];
  todas.forEach(function (r, i) {
    var sem = todas.filter(function (x, j) { return j !== i; });
    if (retrato(sem) === completo) {
      inuteis.push((r.origem || '*') + ' -> ' + (r.destino || '*') +
        ' (permite "' + r.permitidas + '", proíbe "' + r.proibidas + '")');
    }
  });
  conferirQue('nenhuma regra pode sair sem mudar nada', inuteis.length === 0,
    inuteis.join(' | '));

  /* E AS TRÊS SAEM DA ABA DE QUEM JÁ AS TINHA. A chave das REGRAS ENTRE CONTAS
     são quatro colunas, então a aposentada é declarada como LINHA e não como
     texto: escrever "ACG ‖ ACG ‖  ‖ " à mão seria errar num separador que nem
     aparece na tela. */
  var rel = planilha.getRangeByName('CAD_RELACOES');
  var v = rel.getValues(), n = 0;
  while (n < v.length && String(v[n][0]).trim() !== '') n++;
  rel.getCell(n + 1, 1).setValue('ACG');
  rel.getCell(n + 1, 2).setValue('ACG');
  rel.getCell(n + 1, 3).setValue('TRANSF. BANCÁRIA');
  contexto.esquecerCadastros_();
  conferir('a regra velha voltou para a aba', contexto.relacoesNormalizadas_().length, 12);

  contexto.criarAbaCadastros();
  contexto.esquecerCadastros_();
  conferir('e recriar a tira de novo', contexto.relacoesNormalizadas_().length, 11);
});

rodar('o Google não converte o cadastro em data', function () {
  /* DEFEITO REAL, VISTO NA ABA DELE: a coluna Folha guarda "1.1.1" e
     "2.0.2.2", e o Google converteu "1.1.1" em 01/01/2001. A janela do recriar
     passou a listar `F23 → Mon Jan 01 2001 GMT-0300`, e a rastreabilidade da
     linha até a fonte foi embora. A bateria não via nada, porque o simulador
     guardava string como string.

     Duas coisas consertam isso, e as duas são conferidas aqui: a aba é
     formatada como TEXTO antes de receber valor (depois não adianta — o valor
     já foi convertido), e o simulador passou a converter como o Google
     converte, para um defeito destes nunca mais passar verde. */
  var folhas = contexto.lerCadastro_('REGRAS_FINALIDADE')
    .map(function (r) { return r['Folha']; });
  var datas = folhas.filter(function (f) { return f instanceof Date; });
  conferirQue('nenhuma folha virou data', datas.length === 0, 'viraram data: ' + datas.length);
  conferir('e "1.1.1" continua "1.1.1"', String(folhas[0]), '1.1.1');

  /* A PROVA DE QUE O SIMULADOR PEGA: sem o formato de texto, ele converte. Se
     esta conferência parar de passar, a imitação morreu e o defeito volta a
     ser invisível. */
  var solta = planilha.getSheetByName(contexto.ABA_CADASTROS)
    .getRange('A1000');
  solta.setValue('1.1.1');
  conferirQue('sem formato de texto, o simulador converte igual ao Google',
    solta.getValue() instanceof Date, String(solta.getValue()));
  solta.setNumberFormat('@');
  solta.setValue('1.1.1');
  conferir('com formato de texto, não converte', String(solta.getValue()), '1.1.1');
  solta.setValue('');
});

rodar('a finalidade: a única das cinco perguntas que o sistema não deduz', function () {
  /* Onde a movimentação acontece sai das contas; como o dinheiro anda sai da
     forma; que espécie de movimentação é sai do subtipo. O PROPÓSITO só quem
     lança sabe — e a lista existe para ele escolher entre o que é possível.

     Os dados vieram de um levantamento nos manuais da obra, feito no projeto
     das CIs (docs/11_prompt_finalidades.md). A primeira tentativa voltou com
     DESPESAS — alimentação, funeral, vestuário —, que não são CMI. */
  function conta(pedaco) {
    var achado = '';
    contexto.lerCadastro_('CONTAS').forEach(function (c) {
      var t = String(c['Texto que aparece na lista']);
      if (!achado && t.indexOf(pedaco) >= 0) achado = t;
    });
    if (!achado) throw new Error('conta não encontrada: ' + pedaco);
    return achado;
  }
  function codigos(a, b, forma, sub, frentes) {
    return contexto.finalidadesQueValem_(a, b, forma, sub, frentes)
      .map(function (x) { return x.finalidade.codigo; }).join(' ');
  }
  var caixa = conta('PIA-COXIM: 100.10'), bb = conta('101.10 - BB');
  var acg = conta('101.15 - ACG'), cartao = conta('PIA-COXIM: 204.9');
  var costa = conta('PIA-COSTA: ACG'), sg = conta('101.17 - ACG');

  conferir('as finalidades cadastradas', contexto.finalidadesCadastradas_().length, 26);
  conferir('as linhas de onde cada uma vale', contexto.regrasDeFinalidade_().length, 39);
  conferirQue('e 28 delas dizem a natureza de pelo menos um lado',
    contexto.regrasDeFinalidade_().filter(function (r) { return r.origem || r.destino; }).length === 28);

  /* A CASCATA ESTREITA À MEDIDA QUE OS CAMPOS SÃO PREENCHIDOS. É o que ele
     pediu: "conforme ter preenchido os demais campos, a lista das finalidades
     possíveis já vai sendo criada". */
  conferir('sem contas nenhuma, mostra tudo',
    contexto.finalidadesQueValem_('', '', '', '').length, 26);
  conferir('contas escolhidas, sem forma ainda', codigos(caixa, bb, '', '').split(' ').length, 12);

  /* AS DUAS COLUNAS DE NATUREZA estreitam muito mais do que a forma sozinha.
     Antes delas, a condição das contas existia só na prosa da coluna "Por quê"
     — e prosa o sistema não lê: "Aplicar saldo sem uso imediato" aparecia num
     ACG -> cartão, onde não cabe. */
  conferir('caixa -> banco, saque em dinheiro: só as que saem de caixa',
    codigos(caixa, bb, 'SAQUE', 'DINHEIRO'), 'F06 F26 F27 F28');
  conferir('banco -> caixa, saque em cheque', codigos(bb, caixa, 'SAQUE', 'CHEQUE'),
    'F03 F04 F05 F07');
  conferir('banco -> ACG por PIX: só a que tem ACG no destino',
    codigos(bb, acg, 'PIX', ''), 'F09');
  conferir('ACG -> cartão: só o carregamento',
    codigos(acg, cartao, 'TRANSF. BANCÁRIA', ''), 'F13');
  conferirQue('e "aplicar saldo" não aparece mais num ACG -> cartão',
    codigos(acg, cartao, 'TRANSF. BANCÁRIA', '').indexOf('F17') < 0);

  /* VAZIO NÃO CORTA, DOS DOIS LADOS. Na primeira versão, não ter escolhido
     forma esvaziava a lista: a regra citava PIX, o estado estava em branco, e
     a comparação cortava tudo antes de a pessoa chegar no campo. */
  conferirQue('campo em branco não esvazia a lista',
    codigos(caixa, bb, '', '').indexOf('F03') >= 0, codigos(caixa, bb, '', ''));

  /* O TIPO E O SUBTIPO TAMBÉM ESTREITAM, e são deduzidos das contas. */
  conferir('entre departamentos da mesma ADM, por PIX', codigos(bb, sg, 'PIX', ''), 'F19 F20 F21 F25');
  conferir('entre administrações, por PIX', codigos(bb, costa, 'PIX', ''), 'F23 F24');
  conferirQue('e a remessa entre ADMs não aparece entre departamentos',
    codigos(bb, sg, 'PIX', '').indexOf('F23') < 0, codigos(bb, sg, 'PIX', ''));

  /* ACENTO NÃO MUDA A REGRA. A coluna é digitada à mão na aba; "ENTRE
     ADMINISTRACOES" sem cedilha e sem til tem de valer o mesmo. Casar dois
     textos acentuados é o jeito mais discreto de um dia deixarem de casar. */
  var bR = contexto.blocoPorId_('REGRAS_FINALIDADE'), iSub = -1;
  bR.colunas.forEach(function (c, k) { if (c.nome === 'Subtipo') iSub = k; });
  var rangeR = planilha.getRangeByName('CAD_REGRAS_FINALIDADE');
  var vR = rangeR.getValues(), linhaF23 = -1;
  for (var iR = 0; iR < vR.length; iR++) {
    if (String(vR[iR][0]).trim() === 'F23') { linhaF23 = iR; break; }
  }
  conferirQue('a F23 está na lista', linhaF23 >= 0);
  var subAntes = String(vR[linhaF23][iSub]);
  rangeR.getCell(linhaF23 + 1, iSub + 1).setValue('ENTRE ADMINISTRACOES');
  contexto.esquecerCadastros_();
  conferirQue('sem acento, a F23 continua valendo entre ADMs',
    codigos(bb, costa, 'PIX', '').indexOf('F23') >= 0, codigos(bb, costa, 'PIX', ''));
  conferirQue('e continua não valendo entre departamentos',
    codigos(bb, sg, 'PIX', '').indexOf('F23') < 0, codigos(bb, sg, 'PIX', ''));
  rangeR.getCell(linhaF23 + 1, iSub + 1).setValue(subAntes);
  contexto.esquecerCadastros_();
  conferirQue('e o que vale entre ADMs não aparece dentro da mesma PIA',
    codigos(bb, acg, 'PIX', '').indexOf('F24') < 0, codigos(bb, acg, 'PIX', ''));

  /* O FILTRO DAS FRENTES: nenhuma marcada = sem filtro. Uma lista vazia por
     causa de um filtro esquecido seria pior do que a lista inteira. */
  conferir('só MÚSICA', codigos(bb, caixa, 'SAQUE', 'DINHEIRO', { MUSICA: true }), 'F05');
  conferir('nenhuma marcada é o mesmo que todas',
    codigos(bb, caixa, 'SAQUE', 'DINHEIRO', {}),
    codigos(bb, caixa, 'SAQUE', 'DINHEIRO'));
  conferirQue('duas frentes somam, não cruzam',
    codigos(bb, caixa, 'SAQUE', 'DINHEIRO', { MUSICA: true, PIEDADE: true }).split(' ').length >
    codigos(bb, caixa, 'SAQUE', 'DINHEIRO', { MUSICA: true }).split(' ').length);

  /* AS FOLHAS SEM FINALIDADE NENHUMA. Não são defeito do sistema: o
     levantamento não achou finalidade documentada para elas. Ficam listadas
     aqui para o dia em que alguém as preencher — e para ninguém as descobrir
     pela lista vazia na tela. */
  var vazia = codigos(acg, costa, 'TRANSF. BANCÁRIA', '');
  conferir('entre ADMs por transferência bancária ainda não tem finalidade', vazia, '');
});

rodar('uma forma citada com o nome errado não passa calada', function () {
  /* O DEFEITO PREFERIDO DESTE PROJETO: silencioso e plausível. "TRANSF. TED"
     virou "TED", e a Remessa continuou citando o nome velho. Isso não estoura
     em lugar nenhum — o nome simplesmente nunca casa, a opção some da tela, e
     não há uma linha sequer dizendo por quê.

     Renomear uma linha é trocar a chave dela, e as referências a ela em outras
     listas NÃO se consertam sozinhas (recriar não troca valor de célula que já
     tem dono). Como não dá para consertar sozinho, tem de dar para VER. */
  conferir('o cadastro do projeto não tem referência solta',
    contexto.referenciasSoltas_().join(' | '), '');

  var b = contexto.blocoPorId_('REGRAS_FINALIDADE'), iForma = -1, iCodigo = 0;
  b.colunas.forEach(function (c, k) { if (c.nome === 'Forma') iForma = k; });
  var regras = planilha.getRangeByName('CAD_REGRAS_FINALIDADE');
  var v = regras.getValues(), n = 0;
  while (n < v.length && String(v[n][0]).trim() !== '') n++;
  var antes = String(v[0][iForma]);

  regras.getCell(1, iForma + 1).setValue('TRANSF. TED');
  contexto.esquecerCadastros_();
  var soltas = contexto.referenciasSoltas_();
  conferir('a referência ao nome velho é apontada', soltas.length, 1);
  conferirQue('e a mensagem diz QUAL nome e ONDE',
    soltas[0].indexOf('TRANSF. TED') >= 0 && soltas[0].indexOf(String(v[0][iCodigo])) >= 0,
    soltas[0]);

  /* E O CÓDIGO DA FINALIDADE, que é outro jeito de escrever errado sem dar
     erro: a regra simplesmente nunca encontra a finalidade dela. */
  regras.getCell(1, iForma + 1).setValue(antes);
  regras.getCell(1, 1).setValue('F99');
  contexto.esquecerCadastros_();
  conferirQue('código de finalidade que não existe também aparece',
    contexto.referenciasSoltas_().some(function (x) {
      return x.indexOf('F99') >= 0 && x.indexOf('sem finalidade cadastrada') >= 0;
    }), contexto.referenciasSoltas_().join(' | '));

  regras.getCell(1, 1).setValue(String(v[0][iCodigo]));
  contexto.esquecerCadastros_();

  /* A MESMA CONFERÊNCIA ALCANÇA AS REGRAS ENTRE CONTAS, que também citam forma
     pelo nome — e onde um nome errado faria uma PROIBIÇÃO deixar de valer.
     É o pior dos dois casos: a opção não some da tela, ela passa a ser
     oferecida justamente onde a tesouraria a proibiu. */
  var rel = planilha.getRangeByName('CAD_RELACOES');
  var vr = rel.getValues();
  var antesProibidas = String(vr[0][3]);
  rel.getCell(1, 4).setValue('SAQUE FORA DO CADASTRO');
  contexto.esquecerCadastros_();
  conferirQue('nome errado numa proibição também aparece',
    contexto.referenciasSoltas_().some(function (x) {
      return x.indexOf('REGRAS ENTRE CONTAS') >= 0 && x.indexOf('proibidas') >= 0;
    }), contexto.referenciasSoltas_().join(' | '));

  /* E A FAMÍLIA continua valendo: proibir "SAQUE" é legítimo, ainda que
     ninguém escolha SAQUE diretamente — quem escolhe é DINHEIRO ou CHEQUE.
     Uma conferência que não soubesse disso acusaria o cadastro do projeto. */
  rel.getCell(1, 4).setValue('SAQUE');
  contexto.esquecerCadastros_();
  conferir('a família SAQUE não é referência solta',
    contexto.referenciasSoltas_().join(' | '), '');

  rel.getCell(1, 4).setValue(antesProibidas);
  contexto.esquecerCadastros_();
  conferir('e o cadastro volta sem referência solta',
    contexto.referenciasSoltas_().join(' | '), '');
});


rodar('o prompt de importação conhece as colunas de verdade', function () {
  /* O `docs/05_importar_dados.md` é o texto que o Taynã cola noutro chat para
     preparar dados. Ele estava mentindo: prometia oito colunas em CONTAS
     quando já eram nove, e não mencionava FORMAS nem as REGRAS ENTRE CONTAS.
     Um prompt errado produz um CSV errado, e o CSV errado entra calado.

     Manter isso por disciplina já falhou uma vez. Agora falha o teste. */
  var doc = fs.readFileSync(path.join(raiz, 'docs', '05_importar_dados.md'), 'utf8');
  contexto.BLOCOS_CADASTRO.forEach(function (bloco) {
    var i = doc.indexOf('(`' + bloco.id + '`)');
    conferirQue('o prompt fala da lista ' + bloco.id, i >= 0);
    if (i < 0) return;
    var j = doc.indexOf('Colunas, nesta ordem:', i);
    var linha = doc.slice(j, doc.indexOf('\n', j));
    conferir('e as colunas de ' + bloco.id + ' batem com o cadastro',
      linha,
      'Colunas, nesta ordem: ' +
      bloco.colunas.map(function (c) { return '`' + c.nome + '`'; }).join(' · '));
  });
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

  /* O CORTE É MEDIDO A PARTIR DA VERSÃO, não de um número de linha.
     Este teste já cortou em "linha 600" e passou anos certo por coincidência:
     bastou o CSS da janela larga crescer para a versão cair DEPOIS da linha
     600, e a bateria acusou um defeito que não existia — o arquivo estava
     inteiro. Um teste que depende de onde uma linha calhou de estar é um
     alarme que vai disparar no dia em que alguém mexer noutra coisa. */
  var linhas = html.split('\n');
  var ondeEstaAVersao = -1;
  for (var iv = 0; iv < linhas.length; iv++) {
    if (/VERSAO_DA_TELA\s*=/.test(linhas[iv])) { ondeEstaAVersao = iv; break; }
  }
  conferirQue('a versão está declarada no arquivo', ondeEstaAVersao >= 0);
  var cortada = linhas.slice(0, ondeEstaAVersao + 1).join('\n');
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

rodar('levar o comprovante em planilha: Excel baixa, Google fica no Drive', function () {
  /* PEDIDO DELE, e a divisão é decisão dele também: os dois caminhos terminam
     em lugares DIFERENTES, e a tela diz isso em letras maiúsculas. */
  var m = JSON.parse(JSON.stringify(movUnica));
  m.referencia = 'CMP-26/077'; m.valor = 1500; m.referenciaOrigem = 'sistema';
  contexto.preencherComprovante(m);

  var numeroAntes = Number(contexto.lerControle_('ULTIMO_NUMERO'));
  var copiasAntes = copiasCriadas.length;
  var arquivosAntes = pdfsGerados.length;

  var excel = contexto.salvarCopiaDoFormulario('excel');

  conferir('o arquivo é .xlsx', excel.nome.slice(-5), '.xlsx');
  conferir('e leva o mesmo nome do PDF', excel.nome,
    contexto.nomeDoArquivoPdf_(contexto.abaDoComprovante_()).replace('.pdf', '.xlsx'));

  /* O .xlsx NÃO PASSA PELO DRIVE. Ele chegou a ser salvo na pasta e oferecido
     por um endereço de download do Drive — e o botão não funcionava: aquele
     endereço depende de sessão, de permissão e de um redirecionamento do
     Google. Agora os bytes voltam com a resposta, em texto. */
  conferirQue('os bytes voltam com a resposta', !!excel.base64, excel.base64);
  conferir('nada foi criado na pasta do Drive', pdfsGerados.length, arquivosAntes);
  conferirQue('e a resposta nem fala em pasta', excel.pasta === undefined);

  /* A planilha temporária não fica para trás. */
  var temporaria = copiasCriadas[copiasCriadas.length - 1];
  conferir('nasceu uma planilha temporária', copiasCriadas.length, copiasAntes + 1);
  conferir('com uma aba só', temporaria.getSheets().length, 1);
  conferir('e essa aba é o Comprovante', temporaria.getSheets()[0].getName(), 'Comprovante');
  conferirQue('com o conteúdo do comprovante dentro',
    String(temporaria.getSheets()[0].getRange(contexto.faixa_('G:H', 'IDENT_1')).getValue())
      === 'CMP-26/077',
    String(temporaria.getSheets()[0].getRange(contexto.faixa_('G:H', 'IDENT_1')).getValue()));
  conferirQue('a planilha temporária foi para a lixeira',
    arquivosNoLixo.indexOf(temporaria.getId()) >= 0, arquivosNoLixo.join(', '));

  /* A CÓPIA NÃO QUEIMA A REFERÊNCIA: quem consome o número é o PDF, que é o
     documento que vai ao SIGA. */
  conferir('a contagem das Referências não andou',
    Number(contexto.lerControle_('ULTIMO_NUMERO')), numeroAntes);

  /* O outro caminho termina no lugar oposto: a planilha temporária É o
     arquivo, e em vez de ir para a lixeira ela se muda para a pasta. */
  var google = contexto.salvarCopiaDoFormulario('google');
  var daGoogle = copiasCriadas[copiasCriadas.length - 1];
  conferir('a planilha do Google não leva extensão', google.nome.indexOf('.'), -1);
  conferir('ela se mudou para a pasta do PDF', daGoogle.pastaFinal, 'Pasta de teste');
  conferir('e a resposta diz qual é a pasta', google.pasta, 'Pasta de teste');
  conferirQue('sem ir para a lixeira', arquivosNoLixo.indexOf(daGoogle.getId()) < 0);
  conferirQue('e sem bytes: este caminho não baixa nada', google.base64 === undefined);
  conferir('nenhum arquivo novo foi criado na pasta para ela',
    pdfsGerados.length, arquivosAntes);
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
  /* A OBSERVAÇÃO VAZIA NÃO DEIXA A CÉLULA VAZIA — deixa só o que o sistema
     deduz das contas. O que a regra de ouro exige continua valendo, e é o que
     esta conferência mede: **nada do comprovante anterior sobra**. O texto que
     estava ali ("SUPRI CONTA BANCO...") sumiu; ficou apenas a frase deduzida,
     que é verdadeira para ESTE documento. */
  var obsVazia = String(folha.getRange(contexto.faixa_('G:V', 'OBS')).getValue());
  conferir('observação vazia deixa só o que as contas dizem', obsVazia, 'ENTRE BANCOS.');
  conferirQue('e nada do comprovante anterior sobra',
    obsVazia.indexOf('SUPRI') < 0, obsVazia);

  // Mudando qualquer coisa, volta a preencher.
  var outro = JSON.parse(JSON.stringify(m));
  outro.valor = 999;
  var terceiro = contexto.preencherComprovante(outro);
  conferirQue('mudou algo -> preenche de novo', terceiro.celulasEscritas > 0);
  conferir('e o valor novo entrou', terceiro.valor, 999);
});

/* =====================================================================
   ETAPA 5 — OS 2 OU 3 PDFs DE UMA VEZ, O ARQUIVO DE RECUPERAÇÃO E O HISTÓRICO
   ===================================================================== */

/** As linhas da aba Histórico, como objetos pelo nome da coluna. */
function linhasDoHistorico() {
  var sh = planilha.getSheetByName('Histórico');
  if (!sh) return [];
  var ultima = sh.getLastRow(), largura = sh.getLastColumn();
  if (ultima < 2) return [];
  var cab = sh.getRange(1, 1, 1, largura).getValues()[0];
  return sh.getRange(2, 1, ultima - 1, largura).getValues().map(function (l, i) {
    var o = { _linha: i + 2 };
    cab.forEach(function (nome, k) { o[String(nome)] = l[k]; });
    return o;
  });
}
function arquivoNaPasta(nome) {
  var achados = arquivosNaPasta.filter(function (a) { return a.nome === nome; });
  return achados.length ? achados[0] : null;
}
function quantosNaPasta(nome) {
  return arquivosNaPasta.filter(function (a) { return a.nome === nome; }).length;
}
function hoje() { return contexto.Utilities.formatDate(new Date(), 'x', 'yy_MM_dd'); }
function jsonDoMd(texto) {
  var m = /```json\n([\s\S]*?)\n```/.exec(texto || '');
  return m ? JSON.parse(m[1]) : null;
}

var movMesmaPia = JSON.parse(JSON.stringify(movUnica));
movMesmaPia.contaDestino = 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE';
movMesmaPia.forma = 'SAQUE'; movMesmaPia.subforma = 'DINHEIRO';
movMesmaPia.referenciaOrigem = 'sistema';
movMesmaPia.etapasEscolhidas = ['APROVADA', 'EFETIVADA'];

rodar('Etapa 5: mesma PIA — os 2 PDFs saem de uma vez', function () {
  var m = JSON.parse(JSON.stringify(movMesmaPia));
  m.referencia = contexto.proximaReferencia_();
  var numero = contexto.numeroDaReferencia_(m.referencia);
  var pdfsAntes = pdfsGerados.length, fotosAntes = exportacoes.length;
  var historicoAntes = linhasDoHistorico().length;

  var r = contexto.preencherEGerarPdf(m);

  conferir('saíram 2 PDFs', r.pdfs.length, 2);
  conferir('um por etapa, na ordem', r.pdfs.map(function (p) { return p.etapa; }).join('→'), 'APROVADA→EFETIVADA');
  conferir('nenhuma etapa falhou', r.falhas.length, 0);
  /* O AVISO VAZIO É A CONFERÊNCIA QUE IMPORTA: o .md e o Histórico viram
     aviso quando falham, e sem esta linha a bateria passaria verde com os
     dois quebrados — como passou, antes de a pasta de mentira aprender a
     guardar arquivos. */
  conferir('e nada virou aviso (o .md e o Histórico gravaram)', r.avisos.join(' | '), '');
  var ref = contexto.nomeLimpo_(m.referencia);
  conferir('o 1º PDF tem o nome da etapa', pdfsGerados[pdfsAntes], ref + '-APROVADA - ' + hoje() + '.pdf');
  conferir('o 2º também', pdfsGerados[pdfsAntes + 1], ref + '-EFETIVADA - ' + hoje() + '.pdf');
  conferir('cada PDF saiu com o seu Status impresso',
    exportacoes.slice(fotosAntes).map(function (e) { return e.status; }).join('→'), 'APROVADA→EFETIVADA');
  conferirQue('e cada um com o seu carimbo de emissão',
    exportacoes.slice(fotosAntes).every(function (e) { return /^Emitido em \d\d\/\d\d\/\d{4} /.test(e.carimbo); }));

  conferir('a Referência foi consumida UMA vez', r.referenciaConsumida, true);
  conferir('e a próxima andou só um número', contexto.numeroDaReferencia_(r.proximaReferencia), numero + 1);

  var nomeMd = ref + '.md';
  conferir('o arquivo de recuperação tem o nome da Referência', r.recuperacao.nome, nomeMd);
  conferir('e é UM só, não um por PDF', quantosNaPasta(nomeMd), 1);
  var md = arquivoNaPasta(nomeMd).conteudo;
  conferirQue('ele lista os dois PDFs',
    md.indexOf(pdfsGerados[pdfsAntes]) >= 0 && md.indexOf(pdfsGerados[pdfsAntes + 1]) >= 0);
  conferirQue('traz o valor e o extenso', md.indexOf('R$ 1.800,00 (UM MIL E OITOCENTOS REAIS)') >= 0,
    md.split('\n').filter(function (l) { return /Valor/.test(l); }).join(' / '));
  conferirQue('e a Observação como sai no papel', md.indexOf('ENTRE CAIXA E BANCO. SUPRI CONTA') >= 0);
  var dados = jsonDoMd(md);
  conferirQue('o bloco do sistema é JSON que se lê de volta', !!dados);
  conferir('e devolve a movimentação que originou os PDFs',
    dados && dados.referencia + ' · ' + dados.contaDestino + ' · ' + dados.etapasEscolhidas.join('+'),
    m.referencia + ' · ' + m.contaDestino + ' · APROVADA+EFETIVADA');

  var hist = linhasDoHistorico();
  conferir('o Histórico ganhou uma linha por PDF', hist.length - historicoAntes, 2);
  var novas = hist.slice(historicoAntes);
  conferir('com a etapa de cada uma', novas.map(function (l) { return l['Etapa'] + ' ' + l['Etapa nº']; }).join(' | '),
    'APROVADA 1 de 2 | EFETIVADA 2 de 2');
  conferir('e a Referência', novas[0]['Referência'], m.referencia);
  conferir('o nome do PDF', novas[1]['Arquivo PDF'], pdfsGerados[pdfsAntes + 1]);
  conferir('o endereço do .md', novas[0]['Arquivo de recuperação'], arquivoNaPasta(nomeMd).getUrl());
  conferir('o valor é NÚMERO, para o relatório somar', typeof novas[0]['Valor'], 'number');
  conferirQue('e a data de emissão é DATA', novas[0]['Data de emissão'] instanceof Date,
    String(novas[0]['Data de emissão']));
  conferir('a hora do Histórico é a mesma impressa no PDF',
    'Emitido em ' + novas[0]['Emitido em'], exportacoes[fotosAntes].carimbo);

  conferir('guarda a movimentação como ela veio, e não a cópia da última etapa',
    contexto.ultimaMovimentacao_().etapasEscolhidas.join('+'), 'APROVADA+EFETIVADA');
  conferirQue('o Histórico nasce protegido por aviso',
    planilha.getSheetByName('Histórico').protecaoDaAba &&
    planilha.getSheetByName('Histórico').protecaoDaAba.aviso === true);
});

var movEntreAdms = JSON.parse(JSON.stringify(movUnica));
movEntreAdms.contaDestino = 'PIA-COSTA: ACG - AG:01 CC:128175700 - PIEDADE';
movEntreAdms.forma = 'PIX';
movEntreAdms.referenciaOrigem = 'sistema';
movEntreAdms.etapasEscolhidas = ['APROVADA', 'PAGA', 'RECEBIDA'];
movEntreAdms.mesmosAssinantes = false;
movEntreAdms.assinantesPorEtapa = {
  APROVADA: [{ nome: 'Adalto Azevedo Pereira', cargo: 'Diácono' }],
  PAGA: [{ nome: 'Taynã Araujo Naves', cargo: 'Diácono' }],
  RECEBIDA: [{ nome: 'Ubaldo de Sá Carnelós', cargo: 'Diácono' }]
};
var refEntreAdms = '';

rodar('Etapa 5: entre ADMs — 3 PDFs, e o Recebimento com o cabeçalho de destino', function () {
  var m = JSON.parse(JSON.stringify(movEntreAdms));
  m.referencia = refEntreAdms = contexto.proximaReferencia_();
  var fotosAntes = exportacoes.length, historicoAntes = linhasDoHistorico().length;

  var r = contexto.preencherEGerarPdf(m);
  var fotos = exportacoes.slice(fotosAntes);

  conferir('saíram 3 PDFs', r.pdfs.length, 3);
  conferir('com o Status de cada etapa', fotos.map(function (e) { return e.status; }).join('→'),
    'APROVADA→PAGA→RECEBIDA');
  /* A REGRA: quem PRODUZ o documento decide o cabeçalho. Aprovação e
     Pagamento são da ADM de origem; o Recebimento, da de destino. */
  conferir('o cabeçalho de cada um', fotos.map(function (e) { return e.cidade; }).join(' | '),
    'COXIM - MS | COXIM - MS | COSTA RICA - MS');
  conferir('e o CNPJ do cabeçalho do Recebimento é o da ADM de destino', fotos[2].cnpjDoCabecalho,
    'CNPJ 15.409.246/0001-99 - IE ISENTO');
  conferir('os assinantes mudam por etapa, quando não são os mesmos',
    fotos.map(function (e) { return e.assinante1; }).join(' | '),
    'Adalto Azevedo Pereira | Taynã Araujo Naves | Ubaldo de Sá Carnelós');
  conferir('a caixa sabe de qual ADM é cada cabeçalho',
    r.pdfs.map(function (p) { return p.cabecalho.adm; }).join(' | '),
    'ADM Coxim-MS | ADM Coxim-MS | ADM Costa Rica-MS');
  conferir('nada virou aviso', r.avisos.join(' | '), '');

  var novas = linhasDoHistorico().slice(historicoAntes);
  conferir('o Histórico registra o cabeçalho de cada PDF',
    novas.map(function (l) { return l['Cabeçalho (ADM)']; }).join(' | '),
    'ADM Coxim-MS | ADM Coxim-MS | ADM Costa Rica-MS');
  conferir('e quem assinou cada um', novas[1]['Assinantes'], 'Taynã Araujo Naves');

  var md = arquivoNaPasta(contexto.nomeLimpo_(m.referencia) + '.md').conteudo;
  conferirQue('o .md separa os assinantes por etapa',
    md.indexOf('**RECEBIDA:**') >= 0 && md.indexOf('- Ubaldo de Sá Carnelós — Diácono') >= 0);

  /* E o cabeçalho de destino NÃO fica preso na aba: o próximo preenchimento
     de outra etapa volta a escrever o da origem. */
  var depois = JSON.parse(JSON.stringify(m));
  depois.etapaAtual = 'APROVADA'; depois.status = 'APROVADA';
  contexto.preencherComprovante(depois);
  conferir('preencher a Aprovação devolve o cabeçalho da origem',
    valor(comprovante, contexto.faixa_('J:Q', 'CAB_2')), 'COXIM - MS');
  depois.etapaAtual = 'RECEBIDA'; depois.status = 'RECEBIDA';
  contexto.preencherComprovante(depois);
  conferir('e preencher o Recebimento já mostra o de destino na aba',
    valor(comprovante, contexto.faixa_('J:Q', 'CAB_2')), 'COSTA RICA - MS');
});

rodar('Etapa 5: uma etapa só, quando escolhida — e a correção reescreve o .md', function () {
  var m = JSON.parse(JSON.stringify(movEntreAdms));
  m.referencia = refEntreAdms;
  m.referenciaOrigem = 'correcao';
  m.referenciaJustificativa = 'assinante do Recebimento trocado';
  m.etapasEscolhidas = ['RECEBIDA'];
  m.etapaAtual = 'RECEBIDA'; m.status = 'RECEBIDA';
  var proxima = contexto.proximaReferencia_();
  var fotosAntes = exportacoes.length;
  var md = arquivoNaPasta(contexto.nomeLimpo_(refEntreAdms) + '.md');
  var reescritasAntes = md.reescritas;

  var r = contexto.preencherEGerarPdf(m);
  conferir('saiu UM PDF', r.pdfs.length, 1);
  conferir('o da etapa escolhida, com o cabeçalho de destino',
    exportacoes.slice(fotosAntes).map(function (e) { return e.status + ' / ' + e.cidade; }).join(''),
    'RECEBIDA / COSTA RICA - MS');
  conferir('ele sabe que é o 3º de 3', r.pdfs[0].posicao + ' de ' + r.pdfs[0].de, '3 de 3');
  conferir('a correção não gasta número', contexto.proximaReferencia_(), proxima);
  conferir('o .md foi REESCRITO, e não duplicado', r.recuperacao.acao, 'reescrito');
  conferir('continua um arquivo só', quantosNaPasta(md.nome), 1);
  conferir('e ganhou uma reescrita', md.reescritas, reescritasAntes + 1);
  conferirQue('agora com o motivo da correção', md.conteudo.indexOf('assinante do Recebimento trocado') >= 0);
  var ultima = linhasDoHistorico().slice(-1)[0];
  conferir('o Histórico diz como saiu o número', ultima['Como saiu o número'],
    'correção de um comprovante que saiu errado');
  conferir('e o motivo', ultima['Motivo da exceção'], 'assinante do Recebimento trocado');
});

rodar('Etapa 5: duas etapas quaisquer, na ordem da movimentação', function () {
  var m = JSON.parse(JSON.stringify(movEntreAdms));
  m.referencia = contexto.proximaReferencia_();
  m.etapasEscolhidas = ['RECEBIDA', 'APROVADA'];      // marcadas fora de ordem
  var fotosAntes = exportacoes.length;
  var r = contexto.preencherEGerarPdf(m);
  conferir('saem as duas, na ordem do papel', r.pdfs.map(function (p) { return p.etapa; }).join('→'),
    'APROVADA→RECEBIDA');
  conferir('cada uma com a sua posição', r.pdfs.map(function (p) { return p.posicao + ' de ' + p.de; }).join(' | '),
    '1 de 3 | 3 de 3');
  conferir('e o Recebimento com o cabeçalho de destino',
    exportacoes.slice(fotosAntes).map(function (e) { return e.cidade; }).join(' | '), 'COXIM - MS | COSTA RICA - MS');

  var impossivel = JSON.parse(JSON.stringify(movMesmaPia));
  impossivel.referencia = contexto.proximaReferencia_();
  impossivel.etapasEscolhidas = ['PAGA'];              // não existe na mesma PIA
  var estourou = '';
  try { contexto.preencherEGerarPdf(impossivel); } catch (e) { estourou = e.message; }
  conferirQue('etapa que não existe na movimentação é erro dito, e não zero PDFs calados',
    /Nenhuma das etapas marcadas \(PAGA\)/.test(estourou), estourou);
  conferir('e não gasta número', contexto.proximaReferencia_(), impossivel.referencia);
});

rodar('Etapa 5: arquivos colados em momentos diferentes continuam gerando', function () {
  /* A tela da primeira versão desta etapa mandava `todasAsEtapas`; a de antes
     dela, só `etapaAtual`. Um arquivo atrasado gera o que ele sabe pedir. */
  var velha = JSON.parse(JSON.stringify(movEntreAdms));
  delete velha.etapasEscolhidas;
  velha.referencia = contexto.proximaReferencia_();
  velha.todasAsEtapas = true;
  conferir('todasAsEtapas gera as 3', contexto.preencherEGerarPdf(velha).pdfs.length, 3);
  var maisVelha = JSON.parse(JSON.stringify(movEntreAdms));
  delete maisVelha.etapasEscolhidas;
  maisVelha.referencia = contexto.proximaReferencia_();
  maisVelha.etapaAtual = 'PAGA'; maisVelha.status = 'PAGA';
  var r = contexto.preencherEGerarPdf(maisVelha);
  conferir('só etapaAtual gera aquela', r.pdfs.map(function (p) { return p.etapa; }).join(), 'PAGA');
});

rodar('Etapa 5: o menu "Gerar PDF" abre o formulário já na caixa de escolha', function () {
  var abertas = [];
  var ui = contexto.SpreadsheetApp.getUi;
  contexto.SpreadsheetApp.getUi = function () {
    var u = ui(); u.showModalDialog = function (saida) { abertas.push(saida.getContent()); }; return u;
  };
  contexto.gerarPdfDoComprovante();
  contexto.abrirFormularioCmi();
  contexto.SpreadsheetApp.getUi = ui;
  conferirQue('pelo menu, a tela vem com a marca ligada',
    abertas[0].indexOf('var ABRIR_NA_ESCOLHA_DO_PDF = true;') >= 0);
  conferirQue('pelo item de preencher, não', abertas[1].indexOf('var ABRIR_NA_ESCOLHA_DO_PDF = false;') >= 0);
  conferirQue('e as regras continuam dentro', abertas[0].indexOf('function nucleoClassificar') >= 0);
});

rodar('Etapa 5: a segunda via NÃO reescreve o .md do original', function () {
  var m = JSON.parse(JSON.stringify(movEntreAdms));
  m.referencia = refEntreAdms;
  m.referenciaOrigem = 'segunda-via';
  m.referenciaJustificativa = 'o diácono perdeu a via';
  m.observacao = 'OUTRA COISA QUE NÃO ESTAVA NO ORIGINAL';
  var md = arquivoNaPasta(contexto.nomeLimpo_(refEntreAdms) + '.md');
  var antes = md.conteudo;
  var r = contexto.preencherEGerarPdf(m);
  conferir('os 3 PDFs da via saíram', r.pdfs.length, 3);
  conferir('o .md do original foi mantido', r.recuperacao.acao, 'mantido');
  conferirQue('com o conteúdo intacto', md.conteudo === antes);
  conferir('a via não consome número', r.referenciaConsumida, undefined);
  conferir('e fica registrada no Histórico', linhasDoHistorico().slice(-1)[0]['Como saiu o número'],
    'segunda via de um comprovante já emitido');
});

rodar('Etapa 5: o Google pede calma (429) — espera e tenta de novo', function () {
  var m = JSON.parse(JSON.stringify(movMesmaPia));
  m.referencia = contexto.proximaReferencia_();
  esperas = [];
  respostasDoGoogle = [429, 200, 503];
  var r = contexto.preencherEGerarPdf(m);
  conferir('os 2 PDFs saíram mesmo assim', r.pdfs.length, 2);
  conferir('nenhuma falha', r.falhas.length, 0);
  conferir('esperou antes de cada nova tentativa', esperas.join(','), '2000,2000');
  respostasDoGoogle = [];
});

rodar('Etapa 5: uma etapa recusada não derruba as outras', function () {
  var m = JSON.parse(JSON.stringify(movEntreAdms));
  m.referencia = contexto.proximaReferencia_();
  var numero = contexto.numeroDaReferencia_(m.referencia);
  var historicoAntes = linhasDoHistorico().length;
  esperas = [];
  respostasDoGoogle = [200, 403];     // a PAGA é recusada; 403 não melhora esperando
  var r = contexto.preencherEGerarPdf(m);
  conferir('saíram as outras duas', r.pdfs.map(function (p) { return p.etapa; }).join('→'), 'APROVADA→RECEBIDA');
  conferir('a que falhou está dita', r.falhas.map(function (f) { return f.etapa; }).join(), 'PAGA');
  conferirQue('com o motivo do Google', /403/.test(r.falhas[0].mensagem), r.falhas[0].mensagem);
  conferir('403 não é tentado de novo', esperas.length, 0);
  conferir('o número foi usado pelos que saíram', contexto.numeroDaReferencia_(r.proximaReferencia), numero + 1);
  conferir('o Histórico tem só o que saiu', linhasDoHistorico().length - historicoAntes, 2);

  var nenhum = JSON.parse(JSON.stringify(movMesmaPia));
  nenhum.referencia = contexto.proximaReferencia_();
  respostasDoGoogle = [403, 403];
  var historicoAntes2 = linhasDoHistorico().length, estourou = '';
  try { contexto.preencherEGerarPdf(nenhum); } catch (e) { estourou = e.message; }
  conferirQue('quando NENHUM sai, o erro sobe inteiro', /403/.test(estourou), estourou);
  conferir('e o número NÃO é gasto', contexto.proximaReferencia_(), nenhum.referencia);
  conferir('nem o Histórico ganha linha', linhasDoHistorico().length, historicoAntes2);
  respostasDoGoogle = [];
});

rodar('Etapa 5: o Histórico grava pelo NOME da coluna, e texto como texto', function () {
  /* A armadilha da coluna no meio, testada de antemão: alguém troca duas
     colunas de lugar e apaga o título de uma. Cada valor tem de continuar
     caindo embaixo do nome certo, e a que sumiu volta no fim. */
  var sh = planilha.getSheetByName('Histórico');
  var largura = sh.getLastColumn();
  var cab = sh.getRange(1, 1, 1, largura).getValues()[0];
  var iRef = cab.indexOf('Referência'), iEtapa = cab.indexOf('Etapa'), iExt = cab.indexOf('Extenso');
  sh.getRange(1, iRef + 1).setValue('Etapa');
  sh.getRange(1, iEtapa + 1).setValue('Referência');
  sh.getRange(1, iExt + 1).setValue('');

  var m = JSON.parse(JSON.stringify(movMesmaPia));
  m.referencia = contexto.proximaReferencia_();
  m.numeracaoSiga = '1.2.3';          // o Google transformaria em 01/02/2003
  var r = contexto.preencherEGerarPdf(m);
  conferir('nada virou aviso', r.avisos.join(' | '), '');

  var ultima = linhasDoHistorico().slice(-1)[0];
  conferir('a Referência caiu embaixo do nome "Referência"', ultima['Referência'], m.referencia);
  conferir('e a etapa embaixo de "Etapa"', ultima['Etapa'], 'EFETIVADA');
  var cabDepois = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  conferir('a coluna que perdeu o título voltou no fim', cabDepois[cabDepois.length - 1], 'Extenso');
  conferir('com o valor dentro', ultima['Extenso'], '(UM MIL E OITOCENTOS REAIS)');
  conferir('a Numeração SIGA "1.2.3" continua texto, e não data', ultima['Numeração SIGA'], '1.2.3');
});

/* =====================================================================
   ETAPA 6 — O RELATÓRIO MENSAL DOS COMPROVANTES GERADOS
   ===================================================================== */

/** Uma linha do Histórico, como o relatório a lê: pelo nome da coluna. */
function linhaDeHistorico(ref, etapa, nEtapa, como, valor, data, emissao, extra) {
  var r = {
    'Emitido em': (emissao || '') , 'Referência': ref, 'Etapa': etapa, 'Etapa nº': nEtapa,
    'Como saiu o número': contexto.rotuloDaReferencia_(como),
    'Motivo da exceção': como === 'sistema' ? '' : 'motivo de ' + ref,
    'Numeração SIGA': '', 'Data de emissão': data,
    'Conta de origem': 'PIA-COXIM: 101.10 - BB', 'Conta de destino': 'PIA-COXIM: 100.10 - CAIXA',
    'Finalidade': 'F', 'Forma': 'PIX', 'Lançamentos': 'Único', 'Valor': valor,
    'Linhas do lote': '', 'Emissão': emissao || ''
  };
  for (var k in (extra || {})) r[k] = extra[k];
  return r;
}
function set(d) { return new Date(2026, 8, d); }   // um dia de setembro de 2026

rodar('Etapa 6: a tabela aprovada — cada comprovante uma vez, sem somar o que não andou', function () {
  /* A TABELA QUE ELE APROVOU, linha por linha. Somar a coluna Valor do
     Histórico dá R$ 4.200,00; o que andou foi 500 + 100. O relatório não soma
     (decisão dele: há comprovante gerado direto no SIGA), mas tem de listar
     cada comprovante UMA vez, com os dados certos — e é isso que se prova. */
  var h = [
    linhaDeHistorico('CMP-26/020', 'APROVADA', '1 de 3', 'sistema', 500, set(5), 'E1'),
    linhaDeHistorico('CMP-26/020', 'PAGA', '2 de 3', 'sistema', 500, set(5), 'E1'),
    linhaDeHistorico('CMP-26/020', 'RECEBIDA', '3 de 3', 'sistema', 500, set(5), 'E1'),
    linhaDeHistorico('CMP-26/020', 'APROVADA', '1 de 3', 'segunda-via', 500, set(5), 'E2'),
    linhaDeHistorico('CMP-26/021', 'APROVADA', '1 de 2', 'sistema', 1000, set(10), 'E3'),
    linhaDeHistorico('CMP-26/021', 'EFETIVADA', '2 de 2', 'sistema', 1000, set(10), 'E3'),
    linhaDeHistorico('CMP-26/021', 'APROVADA', '1 de 2', 'correcao', 100, set(10), 'E4'),
    linhaDeHistorico('CMP-26/021', 'EFETIVADA', '2 de 2', 'correcao', 100, set(10), 'E4')
  ];
  var somaDireta = h.reduce(function (s, l) { return s + l['Valor']; }, 0);
  conferir('somar o Histórico direto daria', somaDireta, 4200);

  var r = contexto.relatorioDoMes_(h, 2026, 9);
  conferir('dois comprovantes, e não oito linhas', r.comprovantes, 2);
  conferir('um lançamento cada', r.lancamentos.length, 2);
  conferir('com os valores que andaram', r.lancamentos.map(function (l) { return l.valor; }).join(' + '), '500 + 100');
  conferirQue('o valor do comprovante errado não aparece em lugar nenhum',
    r.lancamentos.every(function (l) { return l.valor !== 1000; }));
  conferir('os PDFs de cada um', r.lancamentos.map(function (l) { return l.referencia + ': ' + l.pdfs; }).join(' | '),
    'CMP-26/020: APROVADA · PAGA · RECEBIDA | CMP-26/021: APROVADA · EFETIVADA');
  conferir('a segunda via e a correção vão para a parte das exceções',
    r.excecoes.map(function (e) { return e.referencia + ' ' + e.oQue + ' (' + e.etapas + ')'; }).join(' | '),
    'CMP-26/020 Segunda via (APROVADA) | CMP-26/021 Correção (APROVADA · EFETIVADA)');
  conferir('com o motivo escrito', r.excecoes[1].motivo, 'motivo de CMP-26/021');
});

rodar('Etapa 6: os casos em que "filtrar pela etapa 1" erraria', function () {
  var h = [
    /* A correção muda a data de mês: o comprovante muda de mês junto. */
    linhaDeHistorico('CMP-26/030', 'APROVADA', '1 de 2', 'sistema', 70, set(30), 'F1'),
    linhaDeHistorico('CMP-26/030', 'APROVADA', '1 de 2', 'correcao', 70, new Date(2026, 9, 1), 'F2'),
    /* A etapa 1 não existe no Histórico: só saiu a EFETIVADA. */
    linhaDeHistorico('CMP-26/031', 'EFETIVADA', '2 de 2', 'sistema', 31, set(12), 'F3'),
    /* O Google recusou a PAGA; ela saiu depois, sozinha, por "Corrigir e gerar
       de novo" — o caminho que a própria tela ensina. As outras duas valem. */
    linhaDeHistorico('CMP-26/032', 'APROVADA', '1 de 3', 'sistema', 32, set(13), 'F4'),
    linhaDeHistorico('CMP-26/032', 'RECEBIDA', '3 de 3', 'sistema', 32, set(13), 'F4'),
    linhaDeHistorico('CMP-26/032', 'PAGA', '2 de 3', 'correcao', 32, set(13), 'F5'),
    /* Só a segunda via chegou ao Histórico (o original é de antes dele). */
    linhaDeHistorico('CMP-26/033', 'APROVADA', '1 de 2', 'segunda-via', 33, set(14), 'F6'),
    /* A correção NO MESMO SEGUNDO do original: a hora igual não pode juntar
       as duas emissões (a bancada pegou isso no caminho de verdade). */
    linhaDeHistorico('CMP-26/035', 'APROVADA', '1 de 2', 'sistema', 350, set(15), 'MESMA HORA'),
    linhaDeHistorico('CMP-26/035', 'APROVADA', '1 de 2', 'correcao', 35, set(15), 'MESMA HORA'),
    /* Número escrito à mão: conta normal, e aparece nas exceções. */
    linhaDeHistorico('CMP-26/034', 'APROVADA', '1 de 2', 'historico-indisponivel', 34, set(2), 'F7')
  ];
  var set9 = contexto.relatorioDoMes_(h, 2026, 9), out10 = contexto.relatorioDoMes_(h, 2026, 10);
  var refs9 = set9.lancamentos.map(function (l) { return l.referencia; }).join(' ');
  conferir('setembro, em ordem de data', refs9, 'CMP-26/034 CMP-26/031 CMP-26/032 CMP-26/033 CMP-26/035');
  conferir('a correção no mesmo segundo vale, e o valor errado sai',
    set9.lancamentos[4].valor + ' · ' + set9.lancamentos[4].pdfs, '35 · APROVADA');
  conferir('o corrigido para outubro saiu de setembro...', refs9.indexOf('CMP-26/030'), -1);
  conferir('... e está em outubro', out10.lancamentos.map(function (l) { return l.referencia; }).join(), 'CMP-26/030');
  conferir('sem etapa 1 no Histórico, ele aparece assim mesmo', set9.lancamentos[1].pdfs, 'EFETIVADA');
  conferir('a etapa refeita sozinha não apaga as outras',
    set9.lancamentos[2].pdfs, 'APROVADA (antes da correção) · PAGA · RECEBIDA (antes da correção)');
  conferir('o que só tem segunda via aparece, e diz por quê',
    set9.lancamentos[3].pdfs, 'APROVADA (só segunda via no Histórico)');
  conferir('as exceções de setembro',
    set9.excecoes.map(function (e) { return e.referencia + ' ' + e.oQue; }).join(' | '),
    'CMP-26/032 Correção | CMP-26/033 Segunda via | CMP-26/034 Número escrito à mão | CMP-26/035 Correção');
  conferir('e a correção de outubro fica em outubro', out10.excecoes.map(function (e) { return e.oQue; }).join(), 'Correção');
});

rodar('Etapa 6: o lote aparece linha por linha, cada uma no seu mês', function () {
  var linhas = JSON.stringify([
    { data: '2026-09-08', documento: '127699478', beneficiario: 'JOSÉ', valor: 150 },
    { data: '2026-09-08', documento: '127698603', beneficiario: 'LETÍCIA', valor: 200 },
    { data: '2026-10-02', documento: '127699221', beneficiario: 'TAYNÃ', valor: 50 }
  ]);
  var h = [
    linhaDeHistorico('CMP-26/040', 'APROVADA', '1 de 2', 'sistema', 400, set(8), 'G1',
      { 'Lançamentos': 'Lote de 3', 'Linhas do lote': linhas }),
    /* Um lote gravado antes da coluna existir: sai inteiro, dizendo que é isso. */
    linhaDeHistorico('CMP-26/041', 'APROVADA', '1 de 2', 'sistema', 90, set(9), '',
      { 'Lançamentos': 'Lote de 2' }),
    /* E sem a coluna Emissão (linhas antigas), o palpite junta as do mesmo clique. */
    linhaDeHistorico('CMP-26/042', 'APROVADA', '1 de 2', 'sistema', 42, '09/09/2026', ''),
    linhaDeHistorico('CMP-26/042', 'EFETIVADA', '2 de 2', 'sistema', 42, '09/09/2026', '')
  ];
  var r = contexto.relatorioDoMes_(h, 2026, 9);
  conferir('as duas linhas de setembro do lote, e só elas',
    r.lancamentos.filter(function (l) { return l.referencia === 'CMP-26/040'; })
      .map(function (l) { return l.lancamento + ' ' + l.documento + ' ' + l.beneficiario + ' ' + l.valor; }).join(' | '),
    'Lote 1 de 3 127699478 JOSÉ 150 | Lote 2 de 3 127698603 LETÍCIA 200');
  conferir('a de outubro está em outubro',
    contexto.relatorioDoMes_(h, 2026, 10).lancamentos.map(function (l) { return l.lancamento + ' ' + l.valor; }).join(),
    'Lote 3 de 3 50');
  var antigo = r.lancamentos.filter(function (l) { return l.referencia === 'CMP-26/041'; })[0];
  conferir('o lote sem as linhas sai numa só, dizendo', antigo.lancamento + ' · ' + antigo.valor,
    'Lote de 2 (sem as linhas) · 90');
  var semEmissao = r.lancamentos.filter(function (l) { return l.referencia === 'CMP-26/042'; });
  conferir('sem a coluna Emissão, o mesmo clique continua um comprovante só', semEmissao.length, 1);
  conferir('com os dois PDFs, sem marca de emissão anterior', semEmissao[0].pdfs, 'APROVADA · EFETIVADA');
  conferirQue('a data escrita em texto também é lida', semEmissao[0].data instanceof Date &&
    semEmissao[0].data.getDate() === 9);
  conferir('três comprovantes em setembro', r.comprovantes, 3);
});

rodar('Etapa 6: o Histórico DE VERDADE do teste dele (24/09/2026)', function () {
  /* As linhas que ele gerou testando a Etapa 6, só com as colunas que o
     relatório lê (sem os endereços do Drive). Dois defeitos saíram daqui:
     - CMP-26/016: a correção trocou 3 etapas (entre ADMs) por 2 (mesma PIA),
       e a PAGA e a RECEBIDA antigas apareciam como se valessem;
     - CMP-26/017: uma "segunda via" saiu com outro valor e outro Nº SIGA, e o
       relatório a engolia sem dizer nada. */
  var h = JSON.parse(fs.readFileSync(path.join(raiz, 'ferramentas_de_conferencia', 'dados',
    'historico_teste_etapa6.json'), 'utf8'));
  var r = contexto.relatorioDoMes_(h, 2026, 9);
  conferir('os comprovantes e lançamentos de setembro', r.comprovantes + ' / ' + r.lancamentos.length, '8 / 11');
  function de(ref) { return r.lancamentos.filter(function (l) { return l.referencia === ref; })[0]; }
  conferir('CMP-26/016: só as etapas da versão corrigida', de('CMP-26/016').pdfs, 'APROVADA · EFETIVADA');
  conferir('e os dados da correção mais nova', de('CMP-26/016').contaOrigem + ' · ' + de('CMP-26/016').valor,
    'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE · 1234.56');
  conferir('CMP-26/015 continua com as duas que saíram (a PAGA foi recusada)', de('CMP-26/015').pdfs, 'APROVADA · RECEBIDA');
  conferir('CMP-26/017 vale o original', de('CMP-26/017').valor + ' · ' + de('CMP-26/017').numeracaoSiga,
    '1234.56 · TESTE001');
  var vias = r.excecoes.filter(function (e) { return e.referencia === 'CMP-26/017'; });
  conferir('as três segundas vias aparecem', vias.length, 3);
  conferirQue('e todas dizem que mudaram os dados (o Nº SIGA mudou já na primeira)',
    vias.every(function (e) { return /COM DADOS DIFERENTES do original/.test(e.oQue); }),
    vias.map(function (e) { return e.oQue; }).join(' | '));
  var correcoes = r.excecoes.filter(function (e) { return e.referencia === 'CMP-26/016'; });
  conferirQue('a correção não é acusada de mudar dados (corrigir é mudar)',
    correcoes.length === 2 && correcoes.every(function (e) { return e.oQue === 'Correção'; }),
    correcoes.map(function (e) { return e.oQue; }).join(' | '));
});

rodar('Etapa 6: o texto do Histórico e o do relatório falam a mesma língua', function () {
  /* O Histórico grava "segunda via de um comprovante já emitido", e não o
     código. Se alguém reescrever essa frase no 05_Gerar_PDF.gs, o relatório
     deixaria de reconhecer a segunda via — e passaria a listá-la como um
     comprovante novo. Esta conferência amarra os dois arquivos. */
  ['sistema', 'segunda-via', 'correcao', 'historico-indisponivel'].forEach(function (como) {
    conferir('"' + contexto.rotuloDaReferencia_(como) + '" é lido de volta',
      contexto.comoSaiuONumero_(contexto.rotuloDaReferencia_(como)), como);
  });
  conferir('o mês anterior a setembro', JSON.stringify(contexto.mesAnterior_(new Date(2026, 8, 24))), '{"ano":2026,"mes":8}');
  conferir('e o de janeiro é dezembro do ano anterior', JSON.stringify(contexto.mesAnterior_(new Date(2027, 0, 3))), '{"ano":2026,"mes":12}');
});

rodar('Etapa 6: do PDF emitido ao relatório — o caminho de verdade', function () {
  /* Um Histórico novo, só com o que este teste gera: as linhas dos testes de
     cima (e o da coluna trocada de lugar) não entram aqui. */
  var velho = planilha.getSheetByName('Histórico');
  if (velho) planilha.deleteSheet(velho);

  var m = JSON.parse(JSON.stringify(movMesmaPia));
  m.referencia = contexto.proximaReferencia_();
  m.data = '2026-08-10';
  var r1 = contexto.preencherEGerarPdf(m);
  conferir('saíram os 2 PDFs, sem aviso', r1.pdfs.length + ' ' + r1.avisos.join('|'), '2 ');

  var hist = linhasDoHistorico();
  conferir('o Histórico ganhou a coluna Emissão, igual nos PDFs do mesmo clique',
    hist.map(function (l) { return l['Emissão'] === hist[0]['Emitido em']; }).join(), 'true,true');
  conferir('e "Linhas do lote" vazia no lançamento único', hist[0]['Linhas do lote'], '');

  var lote = JSON.parse(JSON.stringify(movMesmaPia));
  lote.referencia = contexto.proximaReferencia_();
  lote.data = '2026-08-20';
  lote.modo = 'lote';
  lote.lancamentos = [
    { data: '2026-08-20', documento: '127699478', beneficiario: 'José', valor: 150 },
    { data: '2026-08-21', documento: '', beneficiario: 'Envelope', valor: 250.5 }
  ];
  contexto.preencherEGerarPdf(lote);
  var linhaDoLote = linhasDoHistorico().slice(-1)[0];
  conferir('o lote guarda as linhas, como saem no papel', linhaDoLote['Linhas do lote'],
    '[{"data":"2026-08-20","documento":"127699478","beneficiario":"JOSÉ","valor":150},' +
    '{"data":"2026-08-21","documento":"","beneficiario":"ENVELOPE","valor":250.5}]');

  var corrigido = JSON.parse(JSON.stringify(m));
  corrigido.referenciaOrigem = 'correcao';
  corrigido.referenciaJustificativa = 'valor digitado errado';
  corrigido.valor = 900;
  contexto.preencherEGerarPdf(corrigido);
  var via = JSON.parse(JSON.stringify(m));
  via.referenciaOrigem = 'segunda-via';
  via.referenciaJustificativa = 'o diácono perdeu a via';
  via.etapasEscolhidas = ['APROVADA'];
  contexto.preencherEGerarPdf(via);
  conferir('o Histórico tem 2 + 2 + 2 + 1 linhas', linhasDoHistorico().length, 7);

  var resposta = contexto.montarRelatorioMensal(2026, 8);
  conferir('a janela conta comprovantes e lançamentos', resposta.comprovantes + ' / ' + resposta.lancamentos, '2 / 3');
  conferirQue('e diz que houve exceções', /2 correção\(ões\), segunda\(s\) via\(s\)/.test(resposta.texto), resposta.texto);

  var aba = planilha.getSheetByName('Relatório');
  conferirQue('a aba Relatório existe', !!aba);
  var todas = aba.getRange(1, 1, aba.getLastRow(), 12).getValues();
  conferir('o título diz o mês', todas[0][0], 'Relatório mensal dos comprovantes — Agosto/2026');
  var iCab = -1;
  todas.forEach(function (l, i) { if (iCab < 0 && l[0] === 'Data' && l[1] === 'Referência') iCab = i; });
  conferir('o cabeçalho tem as 12 colunas aprovadas', todas[iCab].join(' | '),
    'Data | Referência | Nº SIGA | Lançamento | Documento / cartão | Beneficiário / finalidade da linha | ' +
    'Valor | Conta de origem | Conta de destino | Finalidade | Forma | PDFs gerados');
  var dados = todas.slice(iCab + 1, iCab + 4);
  conferir('um lançamento por linha, em ordem de data',
    dados.map(function (l) { return l[1] + ' ' + l[3] + ' ' + l[6]; }).join(' | '),
    m.referencia + ' Único 900 | ' + lote.referencia + ' Lote 1 de 2 150 | ' + lote.referencia + ' Lote 2 de 2 250.5');
  conferir('o comprovante corrigido aparece UMA vez, com o valor corrigido',
    dados.filter(function (l) { return l[1] === m.referencia; }).length, 1);
  conferir('e os PDFs dele', dados[0][11], 'APROVADA · EFETIVADA');
  conferirQue('a data é data de verdade', dados[0][0] instanceof Date && dados[0][0].getDate() === 10);
  conferir('com formato de data', aba.getRange(iCab + 2, 1).getNumberFormat(), 'dd/MM/yyyy');
  conferir('o valor é número, em reais', aba.getRange(iCab + 2, 7).getNumberFormat() + ' ' + typeof dados[0][6],
    'R$ #,##0.00 number');
  conferir('o resto é texto, formatado antes de escrever', aba.getRange(iCab + 2, 2).getNumberFormat(), '@');
  conferir('a contagem vem logo depois', todas[iCab + 5][0], '2 comprovantes, 3 lançamentos.');
  var planas = todas.map(function (l) { return l.join(' '); }).join('\n');
  conferirQue('NENHUMA soma de valores em lugar nenhum (1150,5 seria a soma)',
    planas.indexOf('1150') < 0 && !/\bTOTAL\b/i.test(planas), planas);
  conferirQue('e diz por que não soma', planas.indexOf('não soma valores') >= 0);
  conferirQue('as exceções estão no fim, com o motivo',
    planas.indexOf('Correção') > planas.indexOf('COMPROVANTES DO MÊS') &&
    planas.indexOf('valor digitado errado') >= 0 && planas.indexOf('o diácono perdeu a via') >= 0);
  conferirQue('a aba nasce protegida por aviso', aba.protecaoDaAba && aba.protecaoDaAba.aviso === true);

  contexto.montarRelatorioMensal(2026, 8);
  conferir('montar de novo não duplica a aba', planilha.getSheets().filter(function (f) {
    return /^Relatório/.test(f.getName());
  }).map(function (f) { return f.getName(); }).join(), 'Relatório');

  var vazio = contexto.montarRelatorioMensal(2026, 1);
  conferirQue('mês sem nada diz isso', /Nenhum comprovante gerado pelo app com data de Janeiro\/2026/.test(vazio.texto), vazio.texto);
  conferir('e a aba fica sem linha de dado', planilha.getSheetByName('Relatório').getRange(7, 1).getValue(),
    'Nenhum comprovante gerado pelo app com data de Janeiro/2026.');

  var estourou = '';
  try { contexto.montarRelatorioMensal(2026, 13); } catch (e) { estourou = e.message; }
  conferirQue('mês que não existe é erro dito', /Mês ou ano inválido/.test(estourou), estourou);
});

rodar('Etapa 6: o PDF do relatório, e o do comprovante continua o mesmo', function () {
  var antes = urlsPedidas.length;
  var r = contexto.gerarPdfDoRelatorio(2026, 8);
  var url = urlsPedidas[antes];
  conferirQue('o relatório sai deitado', /portrait=false/.test(url), url);
  conferirQue('ajustado à largura', /fitw=true/.test(url) && /scale=2/.test(url), url);
  conferirQue('com as páginas numeradas', /pagenum=CENTER/.test(url), url);
  conferirQue('e da aba Relatório', url.indexOf('gid=' + planilha.getSheetByName('Relatório').getSheetId()) >= 0, url);
  conferir('o nome diz o mês e o dia em que foi gerado', r.nome, 'Relatório CMP - 2026-08 - ' + hoje() + '.pdf');
  conferirQue('o arquivo foi para a pasta dos comprovantes', !!arquivoNaPasta(r.nome));
  conferirQue('e a janela recebe os endereços', /^https:/.test(r.urlArquivo) && /^https:/.test(r.urlPasta));

  /* A REGRA DO COMPROVANTE NÃO MUDOU por causa do relatório — escala 100%,
     em pé, nunca "ajustar". É o que mantém a sobreposição com o do SIGA. */
  var m = JSON.parse(JSON.stringify(movMesmaPia));
  m.referencia = contexto.proximaReferencia_();
  antes = urlsPedidas.length;
  contexto.preencherEGerarPdf(m);
  var doComprovante = urlsPedidas[antes];
  conferirQue('o comprovante continua em pé, escala 1, sem ajustar e sem número de página',
    /portrait=true/.test(doComprovante) && /fitw=false/.test(doComprovante) &&
    /scale=1(&|$)/.test(doComprovante) && /pagenum=UNDEFINED/.test(doComprovante), doComprovante);
});

rodar('Etapa 6: o menu e a janelinha do mês', function () {
  var menu = null, itens = [], abertas = [];
  var ui = contexto.SpreadsheetApp.getUi;
  contexto.SpreadsheetApp.getUi = function () {
    var u = ui();
    u.createMenu = function (nome) {
      menu = nome;
      var m = { addItem: function (rotulo, funcao) { itens.push(rotulo + ' → ' + funcao); return m; },
                addSeparator: function () { return m; }, addToUi: function () {} };
      return m;
    };
    u.showModalDialog = function (saida, titulo) { abertas.push({ html: saida.getContent(), titulo: titulo }); };
    return u;
  };
  contexto.onOpen();
  contexto.relatorioMensal();
  contexto.SpreadsheetApp.getUi = ui;

  conferir('o menu tem o nome novo', menu, 'Tesouraria • CMP p/ SIGA');
  conferirQue('e o item do relatório', itens.indexOf('Relatório mensal → relatorioMensal') >= 0, itens.join(' | '));
  conferirQue('que chama uma função que existe', typeof contexto.relatorioMensal === 'function');
  conferir('a janelinha abre com o título', abertas[0].titulo, 'Relatório mensal');

  var html = abertas[0].html;
  var mes = contexto.mesAnterior_(new Date());
  conferirQue('já no mês anterior', html.indexOf('<option value="' + mes.mes + '" selected>') >= 0);
  conferirQue('e no ano dele', html.indexOf('value="' + mes.ano + '"') >= 0);
  var script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
  var compila = '';
  try { new vm.Script(script); } catch (e) { compila = e.message; }
  conferir('o JavaScript da janelinha compila (senão ela abre muda)', compila, '');
  conferirQue('sem alert nem confirm', !/\balert\s*\(|\bconfirm\s*\(/.test(script));
  var semId = [];
  script.replace(/elem\("([^"]+)"\)/g, function (_, id) {
    if (html.indexOf('id="' + id + '"') < 0 && semId.indexOf(id) < 0) semId.push(id);
  });
  conferir('todo elem("x") tem um id="x"', semId.join(), '');
  conferirQue('ela chama as duas portas do servidor, e elas existem',
    /montarRelatorioMensal\(/.test(script) && /gerarPdfDoRelatorio\(/.test(script) &&
    typeof contexto.montarRelatorioMensal === 'function' && typeof contexto.gerarPdfDoRelatorio === 'function');
});

rodar('abrirFormularioCmi encontra o arquivo da tela', function () {
  contexto.abrirFormularioCmi();
  passou++;
});

console.log('\n' + (falhas.length ? falhas.length + ' FALHA(S) de ' + (passou + falhas.length) : 'Passaram os ' + passou) + ' testes.');
if (falhas.length) { console.log(''); falhas.forEach(function (f, i) { console.log((i + 1) + ') ' + f); }); process.exit(1); }
