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

   DESDE A ETAPA 7 (pedido i) as seções ficam UMA ABAIXO DA OUTRA, na largura
   toda — a tela rola, de propósito. Então a régua não pergunta mais "cabe
   sem rolar?": pergunta se cada seção ocupa a largura toda e se algum campo
   PREENCHIDO sai cortado. Ela preenche o formulário com o caso mais largo
   (a conta de nome mais comprido, cartão, lote e seis assinantes) antes de
   medir.

   Com `--foto`, guarda uma fotografia de cada medida (PNG) na pasta dada
   pela variável FOTOS_DA_MEDICAO (ou na pasta temporária do sistema).      */

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
  /* A JANELA DO SHEETS A 80% NO PRINT DELE (01/10/2026): uns 930 px por dentro. */
  { nome: 'janela do Sheets a 80%', l: 930, a: 560 },
  { nome: 'celular', l: 390, a: 780 },
  /* DEITADO (pedido dele, 01/10/2026): é assim que ele quer preencher pelo
     celular — mais largura, menos corte. A altura é pouca, e é o rodapé
     preso embaixo que come o que sobra. */
  { nome: 'celular deitado', l: 844, a: 390 },
  { nome: 'celular deitado (Android)', l: 915, a: 412 }
];

(async function () {
  var dados = T.dadosDeVerdade().dados;
  var comFoto = process.argv.indexOf('--foto') >= 0;
  var pastaDasFotos = process.env.FOTOS_DA_MEDICAO || os.tmpdir();
  /* A conta de nome mais comprido do cadastro: é ela que corta primeiro. */
  var maisComprida = dados.contas.slice().sort(function (a, b) { return b.texto.length - a.texto.length; })[0].texto;
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
    /* PREENCHIDA, e não vazia: vazio nenhum campo corta. */
    await pagina.evaluate(function (conta) {
      function escolher(id, texto) {
        var e = document.querySelector('#' + id + ' .combo-entrada');
        e.focus(); e.value = texto;
        e.dispatchEvent(new Event('input', { bubbles: true }));
        e.dispatchEvent(new Event('blur', { bubbles: true }));
      }
      escolher('cmbContaOrigem', 'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE');
      escolher('cmbContaDestino', conta);
      document.getElementById('observacao').value = 'CARGA DOS CARTÕES DE ATENDIMENTO DA SEMANA';
      document.getElementById('observacao').dispatchEvent(new Event('input', { bubbles: true }));
    }, maisComprida);
    await pagina.waitForTimeout(400);
    await pagina.evaluate(function () {
      document.querySelector('input[name="modo"][value="lote"]').click();
      window.maisUmaLinhaDoLote(); window.maisUmaLinhaDoLote();
      window.linhasDoLote.forEach(function (l, i) {
        l.beneficiario.value = 'IRMÃ DA PIEDADE DO ATENDIMENTO ' + (i + 1);
        l.valor.value = '1.250,00';
      });
      var nomes = window.dados.diaconos.map(function (d) { return d.nome; });
      document.querySelectorAll('#assinantes .combo-entrada, .assin-vaga .combo-entrada').forEach(function (e, i) {
        if (!nomes[i]) return;
        e.value = nomes[i];
        e.dispatchEvent(new Event('input', { bubbles: true }));
        e.dispatchEvent(new Event('blur', { bubbles: true }));
      });
    });
    await pagina.waitForTimeout(400);
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
        .map(function (el) { var c = el.closest('.combo'); return el.id || (c ? c.id : el.className); });
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
      var alturaDoRodape = Math.round(pe);
      fundo += pe;
      var janela = document.documentElement.clientWidth;
      return {
        altura: Math.ceil(Math.max(fundo + window.scrollY, 0)),
        secoes: [].map.call(document.querySelectorAll('section'),
          function (el) { return Math.round(el.getBoundingClientRect().width); }),
        janela: janela,
        ladoALado: lados.length === 2 && lados[0].y === lados[1].y,
        rolaDeLado: document.documentElement.scrollWidth > janela + 1,
        rodape: alturaDoRodape,
        cortados: cortados
      };
    });
    var sobra = m.a - r.altura;
    console.log('  ' + m.nome + '  (' + m.l + ' x ' + m.a + ')');
    console.log('    precisa de ' + r.altura + ' px  ->  ' +
      (sobra >= 0 ? 'CABE (sobram ' + sobra + ')' : 'ROLA (faltam ' + (-sobra) + ')'));
    var naLarguraToda = r.secoes.every(function (l) { return l >= r.janela - 2; });
    console.log('    seções: ' + r.secoes.length + ', ' +
      (naLarguraToda ? 'todas na largura toda (' + r.janela + ' px)' : 'LARGURAS DIFERENTES: ' + r.secoes.join(' | ')) +
      '   origem e destino lado a lado: ' + (r.ladoALado ? 'sim' : 'não'));
    if (r.rolaDeLado) console.log('    ROLA PARA O LADO — algo passou da largura');
    console.log('    o rodapé preso embaixo ocupa ' + r.rodape + ' px de ' + m.a +
      ' (' + Math.round(100 * r.rodape / m.a) + '% da altura)');
    console.log('    ' + (r.cortados.length ? 'CAMPO CORTADO: ' + r.cortados.join(', ') : 'nenhum campo preenchido cortado'));
    if (comFoto) {
      var foto = path.join(pastaDasFotos, 'tela_' + m.l + 'x' + m.a + '.png');
      await pagina.screenshot({ path: foto, fullPage: true });
      console.log('    foto: ' + foto);
    }
    await pagina.close();
  }
  await navegador.close();
  console.log('');
})();
