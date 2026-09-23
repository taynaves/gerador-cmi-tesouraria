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
function conferirQue(oque, condicao, detalhe) {
  if (condicao) { passou++; return; }
  falhas.push(oque + (detalhe ? '\n      ' + detalhe : ''));
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

rodar('o número da conta acha com ou sem o ponto', function () {
  /* PEDIDO DELE, e o motivo é o tempo: o número do plano de contas se decora
     pelos dígitos, e parar para digitar o ponto em cada busca é atrito num
     campo usado dezenas de vezes por dia.

     Vale para os dois lados, origem e destino, porque é o MESMO combo — e
     o texto da conta no papel não muda: isto é comparação de busca. */
  var caixa = 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE';
  var bb = 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE';

  conferir('"10010" acha 100.10',  ctx.casa('10010', caixa), true);
  conferir('"100.10" continua achando', ctx.casa('100.10', caixa), true);
  conferir('"10110" acha 101.10',  ctx.casa('10110', bb), true);
  conferir('"coxim 10110" junto com palavra', ctx.casa('coxim 10110', bb), true);

  /* E O QUE NÃO PODE ACONTECER: o ponto some só ENTRE DÍGITOS. Tirar todos
     juntaria pedaços separados da linha e inventaria casamento onde não há. */
  conferir('"10010" não acha a conta 101.10', ctx.casa('10010', bb), false);
  conferir('"05521" não junta AG:0552 com o que vem depois',
    ctx.casa('05521', bb), false);

  /* Duas passadas: `1.1.1` precisa delas, porque a primeira consome `1.1`. */
  conferir('três dígitos separados por ponto',
    ctx.semPontosEntreDigitos('1.1.1'), '111');
  conferir('ponto fora de dígito fica',
    ctx.semPontosEntreDigitos('TRANSF. BANCÁRIA'), 'TRANSF. BANCÁRIA');
});

rodar('a Observação leva o tipo de contas envolvidas', function () {
  function frase(a, b) {
    return ctx.nucleoContasEnvolvidas({ natureza: a }, { natureza: b });
  }
  conferir('caixa com caixa', frase('CAIXA', 'CAIXA'), 'ENTRE CAIXAS');
  conferir('banco com banco', frase('BANCO', 'BANCO'), 'ENTRE BANCOS');
  conferir('cartão com cartão', frase('CARTAO', 'CARTAO'), 'ENTRE CARTÕES');
  conferir('caixa com banco', frase('CAIXA', 'BANCO'), 'ENTRE CAIXA E BANCO');

  /* A ACG é conta do grupo 101 - BANCOS CONTA MOVIMENTO: no papel ela é
     banco. A natureza ACG existe para as REGRAS (não saca, não compensa
     cheque), não para descrever a conta. */
  conferir('a ACG entra como banco', frase('ACG', 'BANCO'), 'ENTRE BANCOS');
  conferir('e a ACG com um caixa também', frase('ACG', 'CAIXA'), 'ENTRE CAIXA E BANCO');

  /* A FRASE DESCREVE O PAR, NÃO O SENTIDO: trocar origem por destino não pode
     mudar o texto, senão o mesmo movimento sai descrito de dois jeitos. */
  conferir('a ordem não depende de quem paga', frase('BANCO', 'CAIXA'), 'ENTRE CAIXA E BANCO');
  conferir('nem com cartão', frase('CARTAO', 'CAIXA'), 'ENTRE CAIXA E CARTÃO');
  conferir('nem entre banco e cartão', frase('CARTAO', 'BANCO'), 'ENTRE BANCO E CARTÃO');
  conferir('faltando uma conta, não inventa frase', frase('CAIXA', ''), '');

  function obs(a, b, digitada) {
    return ctx.nucleoObservacaoDoDocumento({ natureza: a }, { natureza: b }, digitada);
  }
  conferir('a frase vem na frente do que foi digitado',
    obs('CAIXA', 'BANCO', 'Sangria do dia'), 'ENTRE CAIXA E BANCO. Sangria do dia');
  conferir('sem nada digitado, sai só a frase',
    obs('CAIXA', 'BANCO', ''), 'ENTRE CAIXA E BANCO.');
  conferir('sem as contas, sai só o que foi digitado',
    obs('CAIXA', '', 'Sangria do dia'), 'Sangria do dia');
  conferir('e a frase não se repete quando ele já a escreveu',
    obs('CAIXA', 'BANCO', 'entre caixa e banco, sangria'), 'entre caixa e banco, sangria');
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
