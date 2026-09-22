/* NÃO É BATERIA, É FERRAMENTA. Lista todas as combinações de tipo, subtipo,
   forma e subforma que o sistema realmente permite, perguntando ao próprio
   motor de regras — par de contas por par de contas, sobre o cadastro ativo.

       node ferramentas_de_conferencia/listar_combinacoes.js .

   Existe porque escrever essa lista à mão para pedir a alguém que a preencha
   é convidar a resposta errada: foi assim que uma rodada inteira voltou com
   finalidades de DESPESA num sistema que só documenta movimentação entre
   contas próprias (ver docs/10_prompt_finalidades.md).

   E porque a lista ENVELHECE: falta "BANCO -> BANCO entre administrações" não
   porque alguma regra proíba, e sim porque a PIA-COSTA ainda não tem conta no
   BB ou no Santander. Quando a conta entrar, a árvore muda. Por isso ela se
   gera, em vez de se manter. */
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

contexto.criarLayoutComprovante();
contexto.criarAbaCadastros();
contexto.esquecerCadastros_();

var contas = contexto.lerCadastro_('CONTAS').filter(function (c) {
  return /^ATIVA/i.test(String(c.Status || ''));
});

/* Cada par ORDENADO de contas ativas, porque o sentido importa: o caixa como
   origem só sai em dinheiro, e como destino recebe cheque também. */
var vistos = {}, achados = [];
contas.forEach(function (a) {
  contas.forEach(function (b) {
    var ta = String(a['Texto que aparece na lista']);
    var tb = String(b['Texto que aparece na lista']);
    if (ta === tb) return;
    var cl = contexto.classificarMovimentacao_(ta, tb);
    if (!cl.tipo) return;
    var r = contexto.formasEntreContas_(ta, tb);
    r.formas.forEach(function (f) {
      // O que se escolhe é a FOLHA; quem tem pai vira "pai + subforma".
      var pai = String(f.paiDaForma || '');
      var forma = pai || f.nome;
      var subforma = pai ? f.nome : '';
      var chave = [cl.tipo, cl.subtipo, forma, subforma, r.naturezaOrigem, r.naturezaDestino].join(' | ');
      if (vistos[chave]) return;
      vistos[chave] = true;
      achados.push({ tipo: cl.tipo, subtipo: cl.subtipo || '(sem subtipo)',
                     forma: forma, subforma: subforma,
                     de: r.naturezaOrigem, para: r.naturezaDestino });
    });
  });
});

var NUMERO = {};
NUMERO['TRANSFER\u00caNCIA (externa) DE NUMER\u00c1RIOS|entre administra\u00e7\u00f5es'] = ['1.1', 'ENTRE ADMs'];
NUMERO['TRANSFER\u00caNCIA (externa) DE NUMER\u00c1RIOS|entre departamentos'] = ['1.2', 'ENTRE DEPARTAMENTOS'];
NUMERO['MOVIMENTA\u00c7\u00c3O INTERNA (de numer\u00e1rios)|(sem subtipo)'] = ['2.0', '(sem subtipo)'];

var arvore = {}, ordemDosRamos = [];
achados.forEach(function (a) {
  var num = NUMERO[a.tipo + '|' + a.subtipo];
  if (!num) throw new Error('Combinacao de tipo/subtipo sem numero: ' + a.tipo + ' / ' + a.subtipo);
  var ramo = num[0];
  if (!arvore[ramo]) { arvore[ramo] = { nome: num[1], tipo: a.tipo, formas: {} }; ordemDosRamos.push(ramo); }
  var f = arvore[ramo].formas;
  if (!f[a.forma]) f[a.forma] = {};
  var chaveSub = a.subforma || '-';
  if (!f[a.forma][chaveSub]) f[a.forma][chaveSub] = [];
  f[a.forma][chaveSub].push(a.de + ' -> ' + a.para);
});

function unicosOrdenados(lista) {
  var visto = {}, saida = [];
  lista.forEach(function (x) { if (!visto[x]) { visto[x] = true; saida.push(x); } });
  return saida.sort();
}

var linhas = [], folhas = 0;
['1', '2'].forEach(function (raiz) {
  var ramos = ordemDosRamos.filter(function (r) { return r.charAt(0) === raiz; }).sort();
  if (!ramos.length) return;
  linhas.push(raiz + '. ' + arvore[ramos[0]].tipo);
  ramos.forEach(function (ramo) {
    linhas.push('  ' + ramo + ' ' + arvore[ramo].nome);
    Object.keys(arvore[ramo].formas).sort().forEach(function (forma, i) {
      var cod = ramo + '.' + (i + 1);
      var subs = arvore[ramo].formas[forma];
      var chaves = Object.keys(subs).sort();
      if (chaves.length === 1 && chaves[0] === '-') {
        linhas.push('    ' + cod + ' ' + forma + '   [contas: ' +
                    unicosOrdenados(subs['-']).join(' / ') + ']');
        folhas++;
        return;
      }
      linhas.push('    ' + cod + ' ' + forma);
      chaves.forEach(function (sub, j) {
        linhas.push('      ' + cod + '.' + (j + 1) + ' ' + sub + '   [contas: ' +
                    unicosOrdenados(subs[sub]).join(' / ') + ']');
        folhas++;
      });
    });
  });
});

console.log(linhas.join('\n'));
console.log('\n' + folhas + ' folhas, de ' + achados.length + ' combinacoes com as contas.');
