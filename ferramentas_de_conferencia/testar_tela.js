/* Testa a lógica da tela (o JavaScript de 04_Formulario.html) fora do
   navegador: o filtro-ao-digitar, a leitura de valores em reais, a cascata
   de tipos e a contagem de etapas. Nada aqui toca no DOM. */
var fs = require('fs'), vm = require('vm'), path = require('path');
var raiz = process.argv[2];
/* A tela MONTADA, com as regras do 06_Tipos_E_Regras.gs já dentro — é o que
   o navegador recebe. O arquivo .html cru não roda sozinho. */
var html = require('./montar_tela.js').montar(raiz);
var codigo = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1];

/* Stubs mínimos: o código termina chamando comecar(), que pede os dados ao
   servidor. O stub aceita o pedido e nunca responde — a tela não é montada,
   e sobram só as funções, que é o que queremos testar. */
var ctx = {
  console: console, Math: Math, Number: Number, String: String, Object: Object,
  Array: Array, RegExp: RegExp, JSON: JSON, isFinite: isFinite, Date: Date,
  setTimeout: setTimeout,
  document: { getElementById: function () { return null; }, querySelector: function () { return null; },
              querySelectorAll: function () { return []; }, createElement: function () { return {}; } },
  window: { scrollTo: function () {} },
  google: { script: { run: { withSuccessHandler: function () { return this; },
                             withFailureHandler: function () { return this; },
                             dadosDoFormulario: function () {} },
                      host: { close: function () {} } } }
};
vm.createContext(ctx);
vm.runInContext(codigo, ctx, { filename: '04_Formulario.html <script>' });

var falhas = [], passou = 0;
function conferir(oque, obtido, esperado) {
  if (String(obtido) === String(esperado)) { passou++; return; }
  falhas.push(oque + '\n      saiu: ' + JSON.stringify(obtido) + '   esperado: ' + JSON.stringify(esperado));
}
function rodar(nome, fn) { try { fn(); console.log('  · ' + nome); } catch (e) { falhas.push(nome + ' ESTOUROU: ' + e.message); } }

console.log('\nTESTES DA TELA');

rodar('ler valor em reais escrito de qualquer jeito', function () {
  conferir('1800',        ctx.paraNumero('1800'), 1800);
  conferir('1.800,00',    ctx.paraNumero('1.800,00'), 1800);
  conferir('1800,50',     ctx.paraNumero('1800,50'), 1800.5);
  conferir('1800.50',     ctx.paraNumero('1800.50'), 1800.5);
  conferir('1.800',       ctx.paraNumero('1.800'), 1800);
  conferir('R$ 1.234.567,89', ctx.paraNumero('R$ 1.234.567,89'), 1234567.89);
  conferir('0,01',        ctx.paraNumero('0,01'), 0.01);
  conferir('vazio',       ctx.paraNumero(''), 0);
  conferir('só letras',   ctx.paraNumero('abc'), 0);
  conferir('1.234.567',   ctx.paraNumero('1.234.567'), 1234567);
});

rodar('escrever valor em reais como o Brasil escreve', function () {
  conferir('1800',    ctx.emReais(1800), 'R$ 1.800,00');
  conferir('0',       ctx.emReais(0), 'R$ 0,00');
  conferir('0,5',     ctx.emReais(0.5), 'R$ 0,50');
  conferir('1000000', ctx.emReais(1000000), 'R$ 1.000.000,00');
  conferir('999,99',  ctx.emReais(999.99), 'R$ 999,99');
  conferir('1,005 arredonda como o extenso', ctx.emReais(1.005), 'R$ 1,01');
});

rodar('filtro enquanto se digita: acha por pedaços, em qualquer ordem', function () {
  var conta = 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE';
  conferir('"coxim 101"',      ctx.casa('coxim 101', conta), true);
  conferir('"101 coxim" (ordem trocada)', ctx.casa('101 coxim', conta), true);
  conferir('"COXIM" com acento no alvo', ctx.casa('sao', 'PIA-SÃO GABRIEL: 101.17 - ACG'), true);
  conferir('"são" sem acento no alvo',  ctx.casa('são', 'PIA-SAO GABRIEL'), true);
  conferir('"piedade bb"',     ctx.casa('piedade bb', conta), true);
  conferir('"sonora" não acha', ctx.casa('sonora', conta), false);
  conferir('vazio acha tudo',  ctx.casa('', conta), true);
  conferir('espaços só',       ctx.casa('   ', conta), true);
});

rodar('a cascata dos tipos usa a coluna "Entre PIAs diferentes"', function () {
  ctx.dados = { tipos: [
    { nome: 'Entre departamentos', entrePias: 'Sim', invertido: false, observacao: '' },
    { nome: 'Entre bancos da mesma PIA', entrePias: 'Não', invertido: false, observacao: '' },
    { nome: 'Carregamento de cartão', entrePias: 'Indiferente', invertido: false, observacao: '' }
  ] };
  var iguais = ctx.tiposCompativeis('PIACOXIM', 'PIACOXIM').map(function (t) { return t.nome; });
  var diferentes = ctx.tiposCompativeis('PIACOXIM', 'PIASONORA').map(function (t) { return t.nome; });
  var indefinido = ctx.tiposCompativeis('PIACOXIM', '').map(function (t) { return t.nome; });
  conferir('mesma PIA', iguais.join(' | '), 'Entre bancos da mesma PIA | Carregamento de cartão');
  conferir('PIAs diferentes', diferentes.join(' | '), 'Entre departamentos | Carregamento de cartão');
  conferir('faltando um lado, mostra tudo', indefinido.length, 3);
});

rodar('"Não" com acento e sem acento valem a mesma coisa', function () {
  ctx.dados = { tipos: [{ nome: 'X', entrePias: 'NAO', invertido: false, observacao: '' }] };
  conferir('NAO sem acento, mesma PIA', ctx.tiposCompativeis('A', 'A').length, 1);
  conferir('NAO sem acento, PIAs diferentes', ctx.tiposCompativeis('A', 'B').length, 0);
});

rodar('ler o número de dentro da Referência, do lado da tela', function () {
  conferir('CMP-26/007', ctx.numeroDaReferencia('CMP-26/007'), 7);
  conferir('CMP-26/051', ctx.numeroDaReferencia('CMP-26/051'), 51);
  conferir('com espaço no fim', ctx.numeroDaReferencia('CMP-26/012 '), 12);
  conferir('sem barra', ctx.numeroDaReferencia('656'), 0);
  conferir('vazio', ctx.numeroDaReferencia(''), 0);
  conferir('nulo', ctx.numeroDaReferencia(null), 0);
  // A mesma conta que o servidor faz: os dois lados precisam concordar, senão
  // o aviso da segunda via dispara em hora errada.
  conferir('ano diferente, mesmo número', ctx.numeroDaReferencia('CMP-25/007'), 7);
});

console.log('\n' + (falhas.length ? falhas.length + ' FALHA(S) de ' + (passou + falhas.length) : 'Passaram os ' + passou) + ' testes.');
if (falhas.length) { console.log(''); falhas.forEach(function (f, i) { console.log((i + 1) + ') ' + f); }); process.exit(1); }
