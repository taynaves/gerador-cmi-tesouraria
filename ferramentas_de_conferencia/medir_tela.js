/* MEDE A TELA NUM NAVEGADOR DE VERDADE (Chromium), e não na cabeça.
   ==================================================================

   NÃO É BATERIA, É FERRAMENTA — por isso não roda junto com as outras: ela
   precisa do playwright, que as baterias não precisam.

   Existe porque CSS não se discute, se mede. Três defeitos desta etapa só
   apareceram aqui:

   · o bloco da janela larga estava no meio do <style> e perdia para as regras
     base — e o sintoma NÃO era "não mudou nada": a coluna ficava mais ALTA;
   · o aviso de "alarguei a lista" existia, estava certo, e a borda do modal
     cortava justamente o fim da lista, que era onde ele nascia;
   · "Como o dinheiro anda" saía cortado com a coluna do meio em 300 px.

   E ela mede o que o NAVEGADOR enxerga, que não é a tela dele: com escala do
   Windows em 175%, 1920 x 1080 viram 1097 x 617.

   Instalar (as duas bibliotecas NO MESMO COMANDO — cada `--no-save` sozinho
   desinstala a anterior):

       npm install jsdom playwright --no-save

   Rodar, da raiz do projeto:

       node ferramentas_de_conferencia/medir_tela.js

   O Chromium já vem com o ambiente; se o caminho abaixo não existir, procure
   em /opt/pw-browsers.

   E LEIA O NÚMERO COMO ELE É: a medida sai com o formulário VAZIO. Escolher
   assinantes acrescenta linhas, e a tela cresce uns 70 px — o que aqui cabe
   com folga curta, na mesa dele rola. A régua diz o que cabe; quem diz o que
   serve é ele.                                                              */

var fs = require('fs'), path = require('path'), os = require('os');
var T = require(path.join(__dirname, 'testar_tela_viva.js'));
var montar = require(path.join(__dirname, 'montar_tela.js'));
var chromium = require('playwright').chromium;

var CHROME = process.env.CHROME_DA_MEDICAO ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* As medidas que interessam são as DELE: 1920 x 1080 com escala de 175%, em
   cada zoom do Chrome. A quarta é o celular. */
var MEDIDAS = [
  { nome: 'aba, zoom 100%', l: 1097, a: 491 },
  { nome: 'aba, zoom 80%', l: 1371, a: 707 },
  { nome: 'aba, zoom 67%', l: 1637, a: 845 },
  { nome: 'aba, zoom 50%', l: 1920, a: 1002 },
  { nome: 'janela do Sheets', l: 1097, a: 617 },
  { nome: 'celular', l: 390, a: 780 }
];

(async function () {
  var dados = T.dadosDeVerdade().dados;
  var html = montar.montar(path.join(__dirname, '..'));

  /* O servidor de mentira: a tela pede os dados uma vez, na abertura. */
  var falso = '<script>window.google={script:{run:(function(){var api={' +
    'withSuccessHandler:function(f){api._ok=f;return api;},' +
    'withFailureHandler:function(){return api;},' +
    'dadosDoFormulario:function(){var d=' + JSON.stringify(dados) + ';' +
    'setTimeout(function(){api._ok(d);},0);}};return api;})(),' +
    'host:{close:function(){}}}};<\/script>';
  var i = html.indexOf('<script>');
  html = html.slice(0, i) + falso + html.slice(i);

  var arquivo = path.join(os.tmpdir(), 'tela_medida.html');
  fs.writeFileSync(arquivo, html);

  var navegador = await chromium.launch({ executablePath: CHROME });
  console.log('\nMEDIDA DA TELA (o que o navegador enxerga)\n');
  for (var k = 0; k < MEDIDAS.length; k++) {
    var m = MEDIDAS[k];
    var pagina = await navegador.newPage({ viewport: { width: m.l, height: m.a } });
    await pagina.goto('file://' + arquivo);
    await pagina.waitForTimeout(900);
    var r = await pagina.evaluate(function () {
      function caixa(el) {
        var b = el.getBoundingClientRect();
        return { x: Math.round(b.left), y: Math.round(b.top), l: Math.round(b.width) };
      }
      var lados = [].map.call(document.querySelectorAll('.lado'), caixa);
      /* CAMPO CORTADO EM SILÊNCIO é pior do que rolar a tela: foi assim que
         "Referência" saiu CMP-26/ e "Etapa" saiu APRO. */
      var cortados = [].filter.call(document.querySelectorAll('input[type="text"]'),
        function (el) { return el.scrollWidth > el.clientWidth + 2 && el.value; })
        .map(function (el) { return el.id || el.className; });
      /* A ALTURA PEDIDA NÃO É `scrollHeight`: quando o conteúdo é mais
         baixo que a janela, ele devolve a altura da JANELA, e "cabe" nunca
         diz por quanto. O fundo de verdade é o pé do que foi desenhado. */
      var fundo = 0;
      [].forEach.call(document.querySelectorAll('#colunas, .coluna'),
        function (el) {
          var b = el.getBoundingClientRect();
          if (b.bottom > fundo) fundo = b.bottom;
        });
      /* O rodapé é preso embaixo (`position: fixed`): o pé DELE é sempre o
         pé da janela, e medir por ele diria "cabe" em qualquer tamanho. O que
         ele custa é a altura dele, que some por cima do formulário. */
      var pe = document.getElementById('rodape').getBoundingClientRect().height;
      fundo += pe;
      return {
        altura: Math.ceil(Math.max(fundo + window.scrollY, 0)),
        colunas: [].map.call(document.querySelectorAll('.coluna'),
          function (el) { return Math.round(el.getBoundingClientRect().width); }),
        ladoALado: lados.length === 2 && lados[0].y === lados[1].y,
        cortados: cortados
      };
    });
    var sobra = m.a - r.altura;
    console.log('  ' + m.nome + '  (' + m.l + ' x ' + m.a + ')');
    console.log('    precisa de ' + r.altura + ' px  ->  ' +
      (sobra >= 0 ? 'CABE (sobram ' + sobra + ')' : 'ROLA (faltam ' + (-sobra) + ')'));
    console.log('    colunas: ' + r.colunas.join(' | ') +
      '   origem e destino lado a lado: ' + (r.ladoALado ? 'sim' : 'NÃO'));
    if (r.cortados.length) console.log('    CAMPO CORTADO: ' + r.cortados.join(', '));
    await pagina.close();
  }
  await navegador.close();
  console.log('');
})();
