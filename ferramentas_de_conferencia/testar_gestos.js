/* Os GESTOS do formulário: o que acontece quando alguém digita, sai do campo,
   clica num item ou num botão. Roda a tela de verdade num navegador de mentira
   (jsdom) com os dados de verdade vindos dos .gs.

   Instalar uma vez:  npm install jsdom --no-save
   Rodar:             node ferramentas_de_conferencia/testar_gestos.js .        */
var T = require('./testar_tela_viva.js');

var falhas = [], passou = 0;
function ok(oque, condicao, detalhe) {
  if (condicao) { passou++; return; }
  falhas.push(oque + (detalhe ? '\n      ' + detalhe : ''));
}
function grupo(nome) { console.log('  · ' + nome); }

(async function () {
  var d = T.dadosDeVerdade();
  var j = T.abrirTela(d.dados, d.servidor).window;
  await T.esperar(200);

  function digitarESair(id, texto) {
    var e = j.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j.Event('input', { bubbles: true }));
    e.dispatchEvent(new j.Event('blur', { bubbles: true }));
    return e;
  }
  function campo(id) { return j.document.getElementById(id); }
  function textoDoCombo(id) { return j.document.querySelector('#' + id + ' .combo-entrada').value; }

  console.log('\nTESTES DOS GESTOS');

  grupo('digitar e sair do campo escolhe, como clicar na lista');
  var o = digitarESair('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE');
  await T.esperar(220);
  ok('o texto não é apagado ao sair do campo', o.value.indexOf('101.10 - BB') >= 0, o.value);
  ok('a escolha valeu (sem a marca de "não escolhido")', !o.classList.contains('sem-escolha'));
  ok('a PIA daquele lado se preencheu', textoDoCombo('cmbPiaOrigem') === 'PIA - COXIM');

  grupo('um pedaço que só casa com uma conta também escolhe');
  digitarESair('cmbContaDestino', 'PIA-COXIM: 100.10'); await T.esperar(220);
  ok('achou a conta pelo pedaço', textoDoCombo('cmbContaDestino').indexOf('100.10 - CAIXA') >= 0);
  ok('as etapas viraram 2', campo('etapaAtual').options.length === 2);

  grupo('a cascata dos tipos segue as contas escolhidas');
  ok('mesma PIA: 10 tipos', T.abrirCombo(j, 'cmbTipo').length === 10,
     'saiu ' + T.abrirCombo(j, 'cmbTipo').length);
  ok('e o tipo só de PIAs diferentes fica de fora',
     !T.abrirCombo(j, 'cmbTipo').some(function (t) { return t.indexOf('departamentos - entre bancos') >= 0; }));

  grupo('texto que não casa com nada: fica à vista, marcado, e vira aviso');
  var ruim = digitarESair('cmbContaOrigem', 'conta que nao existe'); await T.esperar(220);
  ok('o texto continua na tela', ruim.value === 'conta que nao existe');
  ok('o campo fica marcado', ruim.classList.contains('sem-escolha'));
  ok('e a conferência avisa',
     T.avisosNaTela(j).some(function (a) { return a.indexOf('Falta escolher conta') >= 0; }));

  grupo('um lado nunca mexe no outro');
  digitarESair('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  T.escolherNoCombo(j, 'cmbTipo', 'Transferencia interna entre Caixa e Banco'); await T.esperar(60);
  var destinoAntes = textoDoCombo('cmbContaDestino');
  ok('o destino não se mexeu ao trocar a origem', destinoAntes.indexOf('100.10') >= 0);

  grupo('trocar para outra PIA funciona mesmo com a PIA já mostrada no campo');
  digitarESair('cmbContaDestino', 'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE');
  await T.esperar(220);
  ok('trocou o destino para outra PIA', textoDoCombo('cmbContaDestino').indexOf('101.17') >= 0);
  ok('a origem ficou intacta', textoDoCombo('cmbContaOrigem').indexOf('101.10 - BB') >= 0);
  ok('as etapas viraram 3', campo('etapaAtual').options.length === 3);
  ok('e os tipos viraram 9', T.abrirCombo(j, 'cmbTipo').length === 9,
     'saiu ' + T.abrirCombo(j, 'cmbTipo').length);

  grupo('o tipo que deixou de combinar NÃO é apagado — vira aviso');
  ok('o tipo continua escolhido', textoDoCombo('cmbTipo').indexOf('Caixa e Banco') >= 0);
  ok('e aparece o aviso de incompatibilidade',
     T.avisosNaTela(j).some(function (a) { return a.indexOf('não combina') >= 0; }));

  grupo('escolher a PIA na mão filtra as contas daquele lado');
  T.escolherNoCombo(j, 'cmbPiaOrigem', 'PIA - SONORA'); await T.esperar(80);
  ok('a conta de origem, que era de outra PIA, saiu', textoDoCombo('cmbContaOrigem') === '');
  ok('a lista de origem passou a ter só as 4 de Sonora',
     T.abrirCombo(j, 'cmbContaOrigem').length === 4, 'saiu ' + T.abrirCombo(j, 'cmbContaOrigem').length);
  ok('e o destino continua onde estava', textoDoCombo('cmbContaDestino').indexOf('101.17') >= 0);

  grupo('o mesmo assinante não pode ocupar dois espaços');
  T.escolherNoCombo(j, 'assin-TODAS-0', 'Adalto'); await T.esperar(60);
  var lista2 = T.abrirCombo(j, 'assin-TODAS-1');
  ok('quem já assina sai da lista dos outros espaços',
     !lista2.some(function (n) { return n.indexOf('Adalto') >= 0; }));
  ok('e os outros 10 continuam disponíveis', lista2.length === 10, 'saiu ' + lista2.length);
  var v2 = j.document.getElementById('assin-TODAS-1').querySelector('.combo-entrada');
  v2.focus(); v2.value = 'Adalto Azevedo Pereira';
  v2.dispatchEvent(new j.Event('input', { bubbles: true }));
  v2.dispatchEvent(new j.Event('blur', { bubbles: true }));
  await T.esperar(220);
  ok('e repetir à mão vira aviso vermelho',
     T.avisosNaTela(j).some(function (a) { return a.indexOf('erro') === 0 && a.indexOf('mesmo assinante') >= 0; }));

  console.log('\nTESTES DA REFERÊNCIA');
  var j2 = T.abrirTela(T.dadosDeVerdade().dados, d.servidor).window;
  var d2 = T.dadosDeVerdade();
  j2 = T.abrirTela(d2.dados, d2.servidor).window;
  await T.esperar(200);
  function digitar2(id, texto) {
    var e = j2.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j2.Event('input', { bubbles: true }));
    e.dispatchEvent(new j2.Event('blur', { bubbles: true }));
  }
  digitar2('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  digitar2('cmbContaDestino', 'PIA-COXIM: 100.10'); await T.esperar(220);
  var vl = j2.document.getElementById('valor');
  vl.value = '300'; vl.dispatchEvent(new j2.Event('input', { bubbles: true }));

  grupo('a Referência é gerada e o campo é travado');
  ok('o campo mostra CMP-26/001', j2.document.getElementById('referencia').value === 'CMP-26/001');
  ok('e não deixa digitar', j2.document.getElementById('referencia').hasAttribute('readonly'));

  grupo('gerar o PDF consome o número e oferece a correção');
  j2.document.getElementById('btGerar').click(); await T.esperar(600);
  ok('o PDF saiu', j2.document.getElementById('faixa').className === 'ok');
  ok('o campo já mostra a próxima', j2.document.getElementById('referencia').value === 'CMP-26/002');
  ok('e apareceu o atalho de corrigir', !!j2.document.getElementById('btCorrigir'));

  grupo('corrigir um lançamento NÃO queima número novo');
  j2.document.getElementById('btCorrigir').click(); await T.esperar(120);
  ok('voltou para o número que saiu', j2.document.getElementById('referenciaManual').value === 'CMP-26/001');
  ok('com o motivo já escrito',
     j2.document.getElementById('justificativaExcecao').value.indexOf('CMP-26/001') >= 0);
  vl = j2.document.getElementById('valor');
  vl.value = '350'; vl.dispatchEvent(new j2.Event('input', { bubbles: true }));
  j2.document.getElementById('btGerar').click(); await T.esperar(600);
  ok('a contagem ficou onde estava', j2.document.getElementById('referencia').value === 'CMP-26/002');
  ok('e o painel de exceção fechou sozinho',
     j2.document.getElementById('painelExcecao').classList.contains('oculto'));

  console.log('\nTESTES DE ABRIR NO ÚLTIMO PREENCHIMENTO');
  var d3 = T.dadosDeVerdade();
  var j3 = T.abrirTela(d3.dados, d3.servidor).window;
  await T.esperar(220);
  function digitar3(id, texto) {
    var e = j3.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j3.Event('input', { bubbles: true }));
    e.dispatchEvent(new j3.Event('blur', { bubbles: true }));
  }
  digitar3('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  digitar3('cmbContaDestino', 'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE'); await T.esperar(220);
  T.escolherNoCombo(j3, 'cmbTipo', 'Transferencia entre departamentos - entre bancos'); await T.esperar(60);
  var vl3 = j3.document.getElementById('valor');
  vl3.value = '1.800,00'; vl3.dispatchEvent(new j3.Event('input', { bubbles: true }));
  j3.document.getElementById('observacao').value = 'SUPRI SAO GABRIEL';
  T.escolherNoCombo(j3, 'assin-TODAS-0', 'Adalto'); await T.esperar(40);
  T.escolherNoCombo(j3, 'assin-TODAS-1', 'Nilson'); await T.esperar(40);
  j3.document.getElementById('btGerar').click(); await T.esperar(700);

  // Fechar e reabrir = uma janela nova, com os dados que o servidor devolve agora.
  var j4 = T.abrirTela(d3.servidor.dadosDoFormulario(), d3.servidor).window;
  await T.esperar(280);
  function texto4(id) { return j4.document.querySelector('#' + id + ' .combo-entrada').value; }

  grupo('a janela reabre como estava');
  ok('a conta de origem voltou', texto4('cmbContaOrigem').indexOf('101.10 - BB') >= 0, texto4('cmbContaOrigem'));
  ok('a conta de destino voltou', texto4('cmbContaDestino').indexOf('101.17') >= 0);
  ok('o tipo voltou', texto4('cmbTipo').indexOf('entre bancos') >= 0);
  ok('a observação voltou', j4.document.getElementById('observacao').value === 'SUPRI SAO GABRIEL');
  ok('o valor voltou', j4.document.getElementById('valor').value === '1800');
  ok('os assinantes voltaram',
     j4.document.querySelector('#assin-TODAS-0 .combo-entrada').value.indexOf('Adalto') >= 0 &&
     j4.document.querySelector('#assin-TODAS-1 .combo-entrada').value.indexOf('Nilson') >= 0);
  ok('com os cargos', j4.document.querySelectorAll('.v-cargo-campo')[0].value === 'Diácono');
  ok('as etapas foram recontadas', j4.document.getElementById('etapaAtual').options.length === 3);

  grupo('mas a Referência vem SEMPRE nova');
  ok('não repetiu o número já usado',
     j4.document.getElementById('referencia').value === 'CMP-26/002',
     j4.document.getElementById('referencia').value);
  ok('e a barra do topo avisa de onde veio',
     j4.document.getElementById('avisoDoUltimo').textContent.indexOf('último preenchimento') >= 0);

  grupo('o botão Limpar zera tudo, menos a Referência');
  j4.document.getElementById('btLimpar').click(); await T.esperar(150);
  ok('origem limpa', texto4('cmbContaOrigem') === '');
  ok('destino limpo', texto4('cmbContaDestino') === '');
  ok('tipo limpo', texto4('cmbTipo') === '');
  ok('observação limpa', j4.document.getElementById('observacao').value === '');
  ok('valor limpo', j4.document.getElementById('valor').value === '');
  ok('assinantes limpos', j4.document.querySelector('#assin-TODAS-0 .combo-entrada').value === '');
  ok('data de volta para hoje', j4.document.getElementById('data').value === d3.dados.hoje);
  ok('uma linha de lote, vazia', j4.document.querySelectorAll('.lote-linha').length === 1);
  ok('e a Referência continua a mesma',
     j4.document.getElementById('referencia').value === 'CMP-26/002');

  console.log('\n' + (falhas.length ? falhas.length + ' FALHA(S) de ' + (passou + falhas.length)
                                    : 'Passaram os ' + passou) + ' testes.');
  if (falhas.length) { console.log(''); falhas.forEach(function (f, i) { console.log((i + 1) + ') ' + f); }); process.exitCode = 1; }
})().catch(function (e) {
  console.log('ESTOUROU: ' + e.message);
  console.log((e.stack || '').split('\n').slice(0, 4).join('\n'));
  process.exitCode = 1;
});
