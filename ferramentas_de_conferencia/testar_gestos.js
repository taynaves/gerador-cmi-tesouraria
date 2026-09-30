/* Os GESTOS do formulário: o que acontece quando alguém digita, sai do campo,
   clica num item ou num botão. Roda a tela de verdade num navegador de mentira
   (jsdom) com os dados de verdade vindos dos .gs.

   Instalar uma vez:  npm install jsdom --no-save
   Rodar:             node ferramentas_de_conferencia/testar_gestos.js .        */
var T = require('./testar_tela_viva.js');
var JSDOM = require('jsdom').JSDOM;

var falhas = [], passou = 0;

/* Imita o que o getContent() do Apps Script faz com o arquivo: devolve o texto
   sem os comentários. É a única maneira de a bateria pegar, aqui, a falha que
   só aparecia dentro do Google. */
function semComentarios_(texto) {
  return texto.replace(/\/\*[\s\S]*?\*\//g, '');
}
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
  /* As etapas que a tela conta agora — as mesmas que a caixa de gerar vai
     oferecer. */
  function etapasDoSeletor(janela) { return janela.etapasAgora(); }

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
  ok('as etapas viraram 2', etapasDoSeletor(j).join('→') === 'APROVADA→EFETIVADA', etapasDoSeletor(j).join('→'));

  grupo('texto que não casa com nada: fica à vista, marcado, e vira aviso');
  var ruim = digitarESair('cmbContaOrigem', 'conta que nao existe'); await T.esperar(220);
  ok('o texto continua na tela', ruim.value === 'conta que nao existe');
  ok('o campo fica marcado', ruim.classList.contains('sem-escolha'));
  ok('e a conferência avisa',
     T.avisosNaTela(j).some(function (a) { return a.indexOf('Falta escolher conta') >= 0; }));

  grupo('um lado nunca mexe no outro');
  digitarESair('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  T.escolherNoCombo(j, 'cmbForma', 'SAQUE'); await T.esperar(60);
  var destinoAntes = textoDoCombo('cmbContaDestino');
  ok('o destino não se mexeu ao trocar a origem', destinoAntes.indexOf('100.10') >= 0);

  grupo('trocar para outra PIA funciona mesmo com a PIA já mostrada no campo');
  digitarESair('cmbContaDestino', 'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE');
  await T.esperar(220);
  ok('trocou o destino para outra PIA', textoDoCombo('cmbContaDestino').indexOf('101.17') >= 0);
  ok('a origem ficou intacta', textoDoCombo('cmbContaOrigem').indexOf('101.10 - BB') >= 0);
  ok('as etapas viraram 3', etapasDoSeletor(j).join('→') === 'APROVADA→PAGA→RECEBIDA', etapasDoSeletor(j).join('→'));
  grupo('a prévia mostra a Observação como ela vai sair no papel');
  /* O sistema põe na frente o tipo de contas envolvidas. Sem esta linha na
     tela, a pessoa só descobriria isso ao abrir o PDF. */
  j.document.getElementById('observacao').value = 'Suprimento da secretaria';
  j.document.getElementById('observacao').dispatchEvent(new j.Event('input', { bubbles: true }));
  await T.esperar(120);
  ok('a prévia diz o texto inteiro',
     j.document.getElementById('previaDaObservacao').textContent ===
     'No documento, a Observação vai sair: ENTRE BANCOS. Suprimento da secretaria',
     j.document.getElementById('previaDaObservacao').textContent);

  j.document.getElementById('observacao').value = '';
  j.document.getElementById('observacao').dispatchEvent(new j.Event('input', { bubbles: true }));
  await T.esperar(120);
  ok('e sem nada digitado ainda diz o que as contas dizem',
     j.document.getElementById('previaDaObservacao').textContent ===
     'No documento, a Observação vai sair: ENTRE BANCOS.',
     j.document.getElementById('previaDaObservacao').textContent);

  grupo('escolher a PIA na mão filtra as contas daquele lado');
  T.escolherNoCombo(j, 'cmbPiaOrigem', 'PIA - SONORA'); await T.esperar(80);
  ok('a conta de origem, que era de outra PIA, saiu', textoDoCombo('cmbContaOrigem') === '');
  /* 3 desde a Etapa 7: as contas contábeis 204.9 e 201.9 deram lugar a uma
     CARTÃO DE DÉBITO por PIA (decisão dele, 30/09/2026). */
  ok('a lista de origem passou a ter só as 3 de Sonora',
     T.abrirCombo(j, 'cmbContaOrigem').length === 3, 'saiu ' + T.abrirCombo(j, 'cmbContaOrigem').length);
  ok('e o destino continua onde estava', textoDoCombo('cmbContaDestino').indexOf('101.17') >= 0);

  grupo('a PIA escrita pelo sistema filtra igual à escolhida a mão');
  /* O DEFEITO QUE ELE ACHOU: a janela reabria no último preenchimento, o campo
     dizia PIA - COXIM, e digitar `10010` na conta trazia as cinco `100.10` do
     cadastro. O campo mentia sobre o próprio efeito — dizia uma coisa e fazia
     outra, porque só filtrava quando a PIA tinha sido escolhida a mão.

     Escolher a conta é o caminho que o sistema usa para escrever a PIA, e é
     por isso que ele serve para reproduzir o caso aqui. */
  function digitarSemSair(id, texto) {
    var e = j.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j.Event('input', { bubbles: true }));
    return Array.prototype.map.call(
      j.document.querySelectorAll('#' + id + ' .combo-item'),
      function (el) { return el.querySelector('b').textContent; });
  }
  function notaDe(id) {
    var el = j.document.querySelector('#' + id + ' .combo-nota');
    return el ? el.textContent : '';
  }

  digitarESair('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE');
  await T.esperar(220);
  ok('foi o SISTEMA que escreveu a PIA', textoDoCombo('cmbPiaOrigem') === 'PIA - COXIM');

  var so10010 = digitarSemSair('cmbContaOrigem', '10010');
  ok('e ela filtra: "10010" traz uma conta, não as cinco',
     so10010.length === 1, so10010.join(' | '));
  ok('e é a de Coxim', so10010[0].indexOf('PIA-COXIM') === 0, so10010[0]);
  ok('sem nota, porque não precisou alargar', notaDe('cmbContaOrigem') === '',
     notaDe('cmbContaOrigem'));

  /* E O QUE NÃO PODE VOLTAR: o filtro que prende. Quando o que se digita não
     existe naquela PIA, a lista alarga sozinha — e DIZ que alargou. */
  var deFora = digitarSemSair('cmbContaOrigem', 'sonora 10010');
  ok('o que não existe na PIA escrita alarga a lista',
     deFora.length === 1 && deFora[0].indexOf('PIA-SONORA') === 0, deFora.join(' | '));
  ok('e a lista diz que alargou',
     notaDe('cmbContaOrigem').indexOf('outras PIAs') >= 0, notaDe('cmbContaOrigem'));
  ok('e nomeia a PIA que estava filtrando',
     notaDe('cmbContaOrigem').indexOf('PIA - COXIM') >= 0, notaDe('cmbContaOrigem'));

  /* A NOTA VEM ANTES DO RESULTADO, não depois. A lista nasce grudada no campo
     e cresce para baixo; numa janela curta é o FIM dela que a borda do modal
     corta — e foi assim que ele não viu a frase. */
  var filhos = j.document.querySelectorAll('#cmbContaOrigem .combo-lista > div');
  ok('e vem como PRIMEIRA linha da lista',
     filhos[0] && filhos[0].className === 'combo-nota',
     filhos[0] ? filhos[0].className : '(lista vazia)');

  /* E SOME quando não precisa mais: aviso que fica é aviso que se ignora. */
  digitarSemSair('cmbContaOrigem', '10010');
  ok('a nota some quando a lista não precisa alargar',
     notaDe('cmbContaOrigem') === '', notaDe('cmbContaOrigem'));

  /* Limpar a PIA no × solta o filtro e NÃO tira a conta escolhida. */
  j.document.querySelector('#cmbPiaOrigem .combo-limpar')
    .dispatchEvent(new j.Event('click', { bubbles: true }));
  await T.esperar(60);
  var todas = digitarSemSair('cmbContaOrigem', '10010');
  ok('sem PIA escrita, "10010" traz as cinco', todas.length === 5, todas.join(' | '));

  digitarESair('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE');
  await T.esperar(220);

  grupo('o número do cartão, no lançamento único');
  /* PEDIDO DELE (4.2): em lote a tabela tem a coluna DOCUMENTO / CARTÃO, mas
     em lançamento único a tabela some e o número ficava sem lugar nenhum —
     e são cartões pré-pagos corporativos, o número é obrigatório.

     O campo mora DENTRO do painel do lado, porque o cartão não é um dado
     solto: ele diz qual é a conta. `CARTÃO DE DÉBITO` existe uma vez em
     cada PIA; quem identifica o plástico é o número. */
  digitarESair('cmbContaOrigem', 'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE');
  await T.esperar(220);
  ok('sem cartão nenhum, o campo não aparece',
     campo('campoCartaoOrigem').style.display === 'none' &&
     campo('campoCartaoDestino').style.display === 'none');

  digitarESair('cmbContaDestino', 'PIA-COXIM: CARTÃO DE DÉBITO');
  await T.esperar(220);
  ok('escolhido um cartão no destino, o campo daquele lado aparece',
     campo('campoCartaoDestino').style.display !== 'none');
  ok('e o da origem continua escondido, porque ali não há cartão',
     campo('campoCartaoOrigem').style.display === 'none');
  ok('e a conferência cobra o número',
     T.avisosNaTela(j).some(function (a) { return a.indexOf('número do cartão') >= 0; }),
     T.avisosNaTela(j).join(' / '));

  /* SÓ OS CARTÕES DA ACG DO OUTRO LADO (decisão dele, 30/09/2026): a carga
     da ACG PIEDADE mostra os 16 cartões da conta 127866218 na PagCorp — o de
     viagem e o de Sonora não aparecem. */
  var listaCartoes = digitarSemSair('cmbCartaoDestino', '');
  ok('a lista do cartão tem só os 16 da ACG PIEDADE', listaCartoes.length === 16,
     listaCartoes.length + ': ' + listaCartoes.join(' | '));
  ok('e nela não está o cartão de viagem (127699478)',
     !listaCartoes.some(function (t) { return t.indexOf('127699478') >= 0; }), listaCartoes.join(' | '));
  ok('e está o 127699262, que ele tornou apto na PIEDADE',
     listaCartoes.some(function (t) { return t.indexOf('127699262') >= 0; }), listaCartoes.join(' | '));

  digitarESair('cmbCartaoDestino', '127699478');
  await T.esperar(220);
  ok('um cartão de viagem escrito à mão vira erro vermelho',
     T.avisosNaTela(j).some(function (a) { return a.indexOf('Cartão de outra conta') >= 0; }),
     T.avisosNaTela(j).join(' / '));

  digitarESair('cmbCartaoDestino', '127698421');
  await T.esperar(220);
  ok('escolhido o número, a cobrança some (e o vermelho do cartão errado também)',
     !T.avisosNaTela(j).some(function (a) {
       return a.indexOf('número do cartão') >= 0 || a.indexOf('outra conta') >= 0; }),
     T.avisosNaTela(j).join(' / '));
  ok('e a prévia diz como a conta vai sair no papel',
     campo('dicaCartaoDestino').textContent.indexOf('PIA-COXIM: CARTÃO DE DÉBITO Nº 127698421') >= 0,
     campo('dicaCartaoDestino').textContent);

  /* EM LOTE O CAMPO SOME, e some de verdade: a tabela do comprovante já tem
     a coluna do cartão, e um lote de cinco cartões diferentes não teria como
     escolher qual deles iria para a linha da conta. */
  j.document.querySelector('input[name="modo"][value="lote"]').click();
  await T.esperar(120);
  ok('em lote o campo do cartão some', campo('campoCartaoDestino').style.display === 'none');
  j.document.querySelector('input[name="modo"][value="unico"]').click();
  await T.esperar(120);
  ok('e volta ao voltar para lançamento único',
     campo('campoCartaoDestino').style.display !== 'none');

  grupo('acrescentar uma finalidade sem sair da janela');
  /* PEDIDO DELE. O botão existe para o momento em que falta a finalidade
     JUSTO na hora de preencher — e o que ele poupa é exatamente a parte que
     a pessoa erraria: a combinação, que o formulário já sabe. */
  digitarESair('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE');
  await T.esperar(220);
  digitarESair('cmbContaDestino', 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE');
  await T.esperar(220);
  T.escolherNoCombo(j, 'cmbForma', 'SAQUE'); await T.esperar(80);
  T.escolherNoCombo(j, 'cmbSubforma', 'DINHEIRO'); await T.esperar(80);

  var quantasAntes = T.abrirCombo(j, 'cmbFinalidade').length;
  ok('o painel começa fechado', campo('painelNovaFinalidade').classList.contains('oculto'));
  campo('abrirNovaFinalidade').dispatchEvent(new j.Event('click', { bubbles: true }));
  await T.esperar(80);
  ok('o link abre o painel', !campo('painelNovaFinalidade').classList.contains('oculto'));

  /* O PAINEL DIZ O QUE VAI SER GRAVADO. Sem isso a pessoa grava uma linha que
     nunca casa com nada e passa semanas sem entender por que a finalidade não
     aparece — o defeito preferido deste projeto: silencioso e plausível. */
  var explica = campo('explicaNovaFinalidade').textContent;
  ok('e mostra a combinação que está na tela',
     explica.indexOf('SAQUE') >= 0 && explica.indexOf('DINHEIRO') >= 0, explica);
  ok('inclusive a natureza das duas contas',
     explica.indexOf('BANCO → CAIXA') >= 0, explica);

  campo('novaFinalidadeNome').value = 'Repor o caixa depois do atendimento extraordinário';
  campo('salvarNovaFinalidade').dispatchEvent(new j.Event('click', { bubbles: true }));
  await T.esperar(300);

  ok('gravou e fechou o painel', campo('painelNovaFinalidade').classList.contains('oculto'));
  ok('a finalidade nova já está escolhida no campo',
     textoDoCombo('cmbFinalidade').indexOf('Repor o caixa') >= 0,
     textoDoCombo('cmbFinalidade'));
  ok('e a lista cresceu, sem fechar e abrir a janela',
     T.abrirCombo(j, 'cmbFinalidade').length === quantasAntes + 1,
     'antes ' + quantasAntes + ', agora ' + T.abrirCombo(j, 'cmbFinalidade').length);
  ok('a faixa do topo confirma, com o código',
     /F\d\d/.test(campo('faixa').textContent) && campo('faixa').className === 'ok',
     campo('faixa').textContent);

  /* O ERRO FICA DENTRO DO PAINEL, ao lado do campo que o causou: numa janela
     do HtmlService não existe alert(), e mandar o recado para a faixa do topo
     faria a pessoa perder de vista o que estava digitando. */
  campo('abrirNovaFinalidade').dispatchEvent(new j.Event('click', { bubbles: true }));
  await T.esperar(80);
  campo('novaFinalidadeNome').value = 'repor O CAIXA depois do atendimento extraordinário';
  campo('salvarNovaFinalidade').dispatchEvent(new j.Event('click', { bubbles: true }));
  await T.esperar(300);
  ok('nome repetido é recusado e o painel continua aberto',
     !campo('painelNovaFinalidade').classList.contains('oculto'));
  ok('e o recado aparece dentro do painel',
     campo('recadoNovaFinalidade').textContent.indexOf('Já existe') >= 0,
     campo('recadoNovaFinalidade').textContent);
  campo('cancelarNovaFinalidade').dispatchEvent(new j.Event('click', { bubbles: true }));
  await T.esperar(80);
  ok('cancelar fecha e limpa', campo('painelNovaFinalidade').classList.contains('oculto') &&
     campo('novaFinalidadeNome').value === '');

  grupo('o cargo só aparece quando precisa ser digitado');
  /* PEDIDO DELE: quem está no cadastro já tem cargo lá, e a própria lista o
     mostra na linha de baixo. Repetir num campo ao lado é pedir a mesma
     informação duas vezes e abrir a porta para as duas discordarem. */
  var vaga1 = j.document.getElementById('assin-TODAS-0').closest('.assin-vaga');
  var cargo1 = vaga1.querySelector('.v-cargo');
  ok('vaga vazia não mostra cargo: cargo sem nome não quer dizer nada',
     cargo1.style.display === 'none');

  digitarESair('assin-TODAS-0', 'Adalto Azevedo Pereira');
  await T.esperar(220);
  ok('escolhido um diácono do cadastro, o campo some',
     cargo1.style.display === 'none');
  ok('mas o cargo continua guardado, para ir ao papel',
     vaga1.querySelector('.v-cargo-campo').value === 'Diácono',
     vaga1.querySelector('.v-cargo-campo').value);
  ok('e a vaga passa a ocupar menos', vaga1.classList.contains('so-nome'));

  /* E VOLTA para nome de fora do cadastro — o signatário esporádico, que é
     justamente quem não tem cargo guardado em lugar nenhum. */
  digitarESair('assin-TODAS-0', 'Irmão visitante de outra localidade');
  await T.esperar(220);
  ok('nome fora do cadastro traz o campo de volta',
     cargo1.style.display !== 'none');
  ok('e em branco, porque não há cargo guardado para ele',
     vaga1.querySelector('.v-cargo-campo').value === '',
     vaga1.querySelector('.v-cargo-campo').value);

  grupo('o teclado anda pelos campos, e não pelo botão de limpar');
  /* DOIS PEDIDOS DELE. O × ficava no caminho do Tab: quem preenche seis
     assinantes de teclado passava por doze paradas inúteis. E as setas
     esquerda/direita não andavam entre campos. */
  var limpar = j.document.querySelector('#cmbContaOrigem .combo-limpar');
  ok('o botão de limpar saiu do caminho do Tab', limpar.tabIndex === -1);

  /* A PIA e a CONTA do mesmo lado estão sempre à vista e são vizinhas — por
     isso servem de par para este teste. Escolher forma/subforma seria pior:
     a subforma só aparece no SAQUE, e o teste passaria a depender disso. */
  var entradaPia = j.document.querySelector('#cmbPiaOrigem .combo-entrada');
  var entradaConta = j.document.querySelector('#cmbContaOrigem .combo-entrada');
  entradaPia.focus();
  j.document.getElementById('cmbPiaOrigem').classList.remove('aberto');
  entradaPia.dispatchEvent(new j.KeyboardEvent('keydown',
    { key: 'ArrowRight', bubbles: true }));
  await T.esperar(60);
  ok('seta para a direita leva ao campo seguinte',
     j.document.activeElement === entradaConta,
     j.document.activeElement ? j.document.activeElement.id || j.document.activeElement.className : '(nenhum)');

  j.document.getElementById('cmbContaOrigem').classList.remove('aberto');
  entradaConta.dispatchEvent(new j.KeyboardEvent('keydown',
    { key: 'ArrowLeft', bubbles: true }));
  await T.esperar(60);
  ok('e para a esquerda, ao anterior',
     j.document.activeElement === entradaPia,
     j.document.activeElement ? j.document.activeElement.id || j.document.activeElement.className : '(nenhum)');

  /* MAS NÃO COM A LISTA ABERTA: ali a pessoa está filtrando, e seta é cursor.
     Roubar a seta de quem digita seria trocar um atrito por outro pior. */
  entradaPia.focus();
  j.document.getElementById('cmbPiaOrigem').classList.add('aberto');
  entradaPia.dispatchEvent(new j.KeyboardEvent('keydown',
    { key: 'ArrowRight', bubbles: true }));
  await T.esperar(60);
  ok('com a lista aberta, a seta continua sendo cursor',
     j.document.activeElement === entradaPia);
  j.document.getElementById('cmbPiaOrigem').classList.remove('aberto');

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

  grupo('a finalidade se estreita pelos campos de cima');
  /* O que ele pediu: "conforme ter preenchido os demais campos do item 3, a
     lista das finalidades possíveis já vai sendo criada". */
  /* O grupo anterior deixou a PIA de origem travada em SONORA, e o combo de
     contas obedece a ela: sem destravar, a conta de COXIM nem aparece para
     ser escolhida — e a lista de finalidades viria inteira, por falta de
     classificação, o que parece a cascata não funcionar. */
  T.escolherNoCombo(j, 'cmbPiaOrigem', 'PIA - COXIM'); await T.esperar(120);
  digitarESair('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE');
  await T.esperar(220);
  digitarESair('cmbContaDestino', 'PIA-COXIM: 100.10'); await T.esperar(220);
  ok('as duas contas foram escolhidas',
     textoDoCombo('cmbContaOrigem').indexOf('101.10') >= 0 &&
     textoDoCombo('cmbContaDestino').indexOf('100.10') >= 0,
     textoDoCombo('cmbContaOrigem') + ' / ' + textoDoCombo('cmbContaDestino'));
  var semForma = T.abrirCombo(j, 'cmbFinalidade').length;
  ok('sem forma escolhida, a lista já é menor que as 26', semForma > 0 && semForma < 26,
     'saiu ' + semForma);

  T.escolherNoCombo(j, 'cmbForma', 'SAQUE'); await T.esperar(150);
  T.escolherNoCombo(j, 'cmbSubforma', 'CHEQUE'); await T.esperar(150);
  var comCheque = T.abrirCombo(j, 'cmbFinalidade');
  ok('com SAQUE em cheque, sobram 4', comCheque.length === 4, comCheque.join(' | '));
  ok('e são as de abastecer caixa',
     comCheque.some(function (t) { return t.indexOf('Abastecer o caixa') >= 0; }),
     comCheque.join(' | '));

  grupo('o filtro das frentes');
  j.document.getElementById('frenteMUSICA').checked = true;
  j.document.getElementById('frenteMUSICA').dispatchEvent(new j.Event('change', { bubbles: true }));
  await T.esperar(150);
  var soMusica = T.abrirCombo(j, 'cmbFinalidade');
  ok('marcando Música, a lista encurta', soMusica.length < comCheque.length,
     soMusica.join(' | '));
  ok('e sobra a do Fundo Musical',
     soMusica.some(function (t) { return t.indexOf('Fundo Musical') >= 0; }), soMusica.join(' | '));

  j.document.getElementById('frenteMUSICA').checked = false;
  j.document.getElementById('frenteMUSICA').dispatchEvent(new j.Event('change', { bubbles: true }));
  await T.esperar(150);
  ok('desmarcando, a lista volta inteira',
     T.abrirCombo(j, 'cmbFinalidade').length === comCheque.length);

  grupo('a finalidade escolhida vai para o campo Tipo, e o SIGA fica na tela');
  T.escolherNoCombo(j, 'cmbFinalidade', 'Abastecer o caixa do Fundo Musical');
  await T.esperar(150);
  ok('o campo Tipo leva a finalidade',
     j.document.getElementById('previaDoTipo').textContent.indexOf('FUNDO MUSICAL') >= 0,
     j.document.getElementById('previaDoTipo').textContent);
  /* O histórico do SIGA aparece na TELA e em lugar nenhum do papel: ele é o
     código do lançamento que este comprovante documenta, e quem está com o
     formulário aberto é quem vai lançar. */
  ok('o histórico do SIGA aparece na tela',
     j.document.getElementById('dicaHistoricos').textContent.indexOf('011 CHEQUE') >= 0,
     j.document.getElementById('dicaHistoricos').textContent);
  ok('e NÃO vai para o campo Tipo',
     j.document.getElementById('previaDoTipo').textContent.indexOf('011') < 0,
     j.document.getElementById('previaDoTipo').textContent);

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
  j2.document.getElementById('btGerar').click(); await T.esperar(60);
  j2.document.getElementById('dlgGerarEscolhidas').click(); T.passarDasBandeiras(j2); await T.esperar(600);
  ok('o PDF saiu', j2.document.getElementById('faixa').className === 'ok');
  ok('o campo já mostra a próxima', j2.document.getElementById('referencia').value === 'CMP-26/002');
  ok('e apareceu o atalho de corrigir', !!j2.document.getElementById('btCorrigir'));

  grupo('corrigir um lançamento NÃO queima número novo');
  j2.document.getElementById('btCorrigir').click(); await T.esperar(120);
  ok('voltou para o número que saiu', j2.document.getElementById('referenciaManual').value === 'CMP-26/001');
  ok('com o motivo já escrito pela escolha',
     j2.document.getElementById('motivoFixo').textContent === 'Corrigir um comprovante',
     j2.document.getElementById('motivoFixo').textContent);
  ok('e o complemento em branco, para dizer o que saiu errado',
     j2.document.getElementById('justificativaExcecao').value === '');
  vl = j2.document.getElementById('valor');
  vl.value = '350'; vl.dispatchEvent(new j2.Event('input', { bubbles: true }));
  j2.document.getElementById('btGerar').click(); await T.esperar(60);
  j2.document.getElementById('dlgGerarEscolhidas').click(); T.passarDasBandeiras(j2); await T.esperar(600);
  ok('a contagem ficou onde estava', j2.document.getElementById('referencia').value === 'CMP-26/002');
  ok('e o painel de exceção fechou sozinho',
     j2.document.getElementById('painelExcecao').classList.contains('oculto'));

  grupo('o painel de exceção: cada escolha com o seu motivo (defeito do teste da Etapa 6)');
  /* Ele escolheu "Corrigir" e a Conferência disse "Você escolheu Histórico
     perdido". O motivo agora vem da escolha, e o campo é só complemento. */
  j2.document.getElementById('abrirExcecao').click(); await T.esperar(40);
  function escolherExcecao(valor) {
    var r = j2.document.querySelector('input[name="excecao"][value="' + valor + '"]');
    r.checked = true; r.dispatchEvent(new j2.Event('change', { bubbles: true }));
  }
  var nomes = { 'segunda-via': 'Segunda via de um comprovante já emitido',
                'historico-indisponivel': 'Histórico perdido ou fora de alcance',
                'correcao': 'Corrigir um comprovante' };
  Object.keys(nomes).forEach(function (valor) {
    escolherExcecao(valor);
    var fixo = j2.document.getElementById('motivoFixo').textContent;
    var outros = Object.keys(nomes).filter(function (k) { return k !== valor; }).map(function (k) { return nomes[k]; });
    var avisos = T.avisosNaTela(j2).join(' | ') + ' ' + j2.document.getElementById('avisos').textContent;
    ok('"' + nomes[valor] + '": o motivo já vem escrito', fixo === nomes[valor], fixo);
    ok('"' + nomes[valor] + '": a Conferência não fala de outra escolha',
       outros.every(function (n) { return avisos.indexOf(n) < 0; }), avisos);
  });
  ok('não existe mais o aviso de "exceção sem motivo"',
     j2.document.getElementById('avisos').textContent.indexOf('sem motivo') < 0);
  escolherExcecao('correcao');
  var compl = j2.document.getElementById('justificativaExcecao');
  compl.value = 'valor digitado errado'; compl.dispatchEvent(new j2.Event('input', { bubbles: true }));
  ok('o que vai para o Histórico é a escolha e o complemento',
     j2.montarMovimentacao().referenciaJustificativa === 'Corrigir um comprovante — valor digitado errado',
     j2.montarMovimentacao().referenciaJustificativa);
  compl.value = ''; compl.dispatchEvent(new j2.Event('input', { bubbles: true }));
  ok('sem complemento, só a escolha', j2.montarMovimentacao().referenciaJustificativa === 'Corrigir um comprovante');
  escolherExcecao('segunda-via');
  ok('a segunda via avisa que os dados são os do original',
     /MESMOS dados do original/.test(j2.document.getElementById('dicaExcecao').textContent));
  j2.document.getElementById('voltarAoSistema').click(); await T.esperar(40);
  ok('voltando ao sistema, nada de motivo vai junto', j2.montarMovimentacao().referenciaJustificativa === '');

  grupo('na correção, a caixa roxa mostra o que mudou ANTES de gerar (teste dele)');
  /* "Alterei um lançamento… Na caixa roxa não mudou nada." A caixa só
     ficava sabendo depois de gerar. O CMP-26/001 saiu por último com 350. */
  j2.document.getElementById('abrirExcecao').click(); await T.esperar(40);
  escolherExcecao('correcao');
  var refm = j2.document.getElementById('referenciaManual');
  refm.value = 'CMP-26/001'; refm.dispatchEvent(new j2.Event('input', { bubbles: true }));
  await T.esperar(900);
  var fixo2 = j2.document.getElementById('motivoFixo');
  ok('sem mudar nada, a caixa diz que nada mudou', /nenhum dado mudou/.test(fixo2.textContent), fixo2.textContent);
  vl = j2.document.getElementById('valor');
  vl.value = '999'; vl.dispatchEvent(new j2.Event('input', { bubbles: true }));
  ok('não pergunta a cada tecla: logo depois de digitar, a caixa ainda é a de antes',
     /nenhum dado mudou/.test(fixo2.textContent), fixo2.textContent);
  await T.esperar(900);
  ok('um instante depois, a caixa diz o que mudou',
     fixo2.textContent === 'Corrigir um comprovante — corrigido: valor', fixo2.textContent);
  ok('e o que vai para o servidor continua sem a prévia (ele escreve a dele)',
     j2.montarMovimentacao().referenciaJustificativa === 'Corrigir um comprovante',
     j2.montarMovimentacao().referenciaJustificativa);
  var semPrevia = j2.google.script.run.previaDaCorrecao;
  j2.google.script.run.previaDaCorrecao = undefined;
  vl.value = '998'; vl.dispatchEvent(new j2.Event('input', { bubbles: true }));
  await T.esperar(900);
  ok('com um 07 antigo (sem a prévia), a tela não quebra',
     /corrigido: valor/.test(fixo2.textContent), fixo2.textContent);
  j2.google.script.run.previaDaCorrecao = semPrevia;

  grupo('enquanto gera, uma caixa trava o formulário, com a borda pulsando (pedido dele)');
  var caixa2 = j2.document.getElementById('dialogoCaixa');
  var dialogo2 = j2.document.getElementById('dialogo');
  j2.document.getElementById('btGerar').click(); await T.esperar(60);
  j2.document.getElementById('dlgGerarEscolhidas').click(); T.passarDasBandeiras(j2);
  ok('a caixa de "gerando" abriu na hora', !dialogo2.classList.contains('oculto') &&
     /Gerando/.test(j2.document.getElementById('dialogoTitulo').textContent),
     j2.document.getElementById('dialogoTitulo').textContent);
  ok('com a borda que pulsa', caixa2.className === 'trabalhando', caixa2.className);
  ok('sem botão nenhum para clicar', j2.document.getElementById('dialogoBotoes').children.length === 0);
  j2.document.dispatchEvent(new j2.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('e o Esc não fecha', !dialogo2.classList.contains('oculto'));
  await T.esperar(600);
  ok('quando termina, a caixa do resultado toma o lugar dela',
     !dialogo2.classList.contains('oculto') && caixa2.className === '' &&
     !/Gerando/.test(j2.document.getElementById('dialogoTitulo').textContent),
     caixa2.className + ' / ' + j2.document.getElementById('dialogoTitulo').textContent);
  j2.document.dispatchEvent(new j2.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await T.esperar(40);
  ok('e essa o Esc fecha', dialogo2.classList.contains('oculto'));

  /* O Google recusou: a caixa vermelha toma o lugar, e o formulário volta. */
  var gerarDeVerdade = d2.servidor.preencherEGerarPdf;
  d2.servidor.preencherEGerarPdf = function () { throw new Error('o Google não respondeu'); };
  j2.document.getElementById('btGerar').click(); await T.esperar(60);
  j2.document.getElementById('dlgGerarEscolhidas').click(); T.passarDasBandeiras(j2); await T.esperar(200);
  ok('deu errado: a caixa vermelha substitui a travada',
     caixa2.className === '' && j2.document.getElementById('dialogoTitulo').className === 'ruim' &&
     /Google não respondeu/.test(j2.document.getElementById('dialogoTexto').textContent),
     caixa2.className + ' / ' + j2.document.getElementById('dialogoTexto').textContent);
  ok('e os botões do formulário voltam', !j2.document.getElementById('btGerar').disabled);
  d2.servidor.preencherEGerarPdf = gerarDeVerdade;

  /* E se a tela tropeçar ao mostrar o resultado, também não fica presa. */
  var deuCertoDeVerdade = j2.deuCerto;
  j2.deuCerto = function () { throw new Error('tropeço de teste'); };
  j2.document.getElementById('dlgFechar') && j2.document.getElementById('dlgFechar').click();
  j2.document.dispatchEvent(new j2.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  j2.document.getElementById('btGerar').click(); await T.esperar(60);
  j2.document.getElementById('dlgGerarEscolhidas').click(); T.passarDasBandeiras(j2); await T.esperar(600);
  ok('um erro ao mostrar o resultado vira a caixa vermelha, e não uma caixa presa',
     caixa2.className === '' && /tropeço de teste/.test(j2.document.getElementById('dialogoTexto').textContent),
     caixa2.className + ' / ' + j2.document.getElementById('dialogoTexto').textContent);
  j2.deuCerto = deuCertoDeVerdade;

  grupo('segunda via: nenhum campo muda, e a caixa roxa oferece os dois caminhos (pedido dele)');
  /* No 2º teste, com "Segunda via" escolhida, ele mudou o valor e a tela
     deixou. Agora o gesto é barrado e a caixa explica. */
  if (dialogo2.classList.contains('oculto') === false) j2.fecharDialogo();
  if (j2.document.getElementById('painelExcecao').classList.contains('oculto')) {
    j2.document.getElementById('abrirExcecao').click(); await T.esperar(40);
  }
  escolherExcecao('correcao');
  refm = j2.document.getElementById('referenciaManual');
  refm.value = 'CMP-26/001'; refm.dispatchEvent(new j2.Event('input', { bubbles: true }));
  vl = j2.document.getElementById('valor');
  vl.value = '998'; vl.dispatchEvent(new j2.Event('input', { bubbles: true }));
  escolherExcecao('segunda-via');
  await T.esperar(900);
  var comp = j2.document.getElementById('comparacaoSegundaVia');
  ok('a caixa roxa diz que a tela é o original', comp.textContent === '✓ Os dados na tela são os do original.', comp.textContent);
  ok('os campos ficam com a cor do painel', j2.document.body.classList.contains('segunda-via'));

  vl.focus(); await T.esperar(20);
  ok('clicar no valor abre a caixa', !dialogo2.classList.contains('oculto') &&
     j2.document.getElementById('dialogoTitulo').textContent === 'Segunda via não altera nada',
     j2.document.getElementById('dialogoTitulo').textContent);
  ok('roxa, como o painel', caixa2.className === 'roxa' &&
     j2.document.getElementById('dialogoTitulo').className === 'roxo');
  ok('e o cursor não fica no campo', j2.document.activeElement !== vl);
  ok('com os dois caminhos que ele pediu, e o de voltar',
     !!j2.document.getElementById('dlgEmitirSegundaVia') && !!j2.document.getElementById('dlgMudarParaCorrecao') &&
     !!j2.document.getElementById('dlgVoltarDaSegundaVia'));
  j2.document.getElementById('dlgVoltarDaSegundaVia').click(); await T.esperar(20);
  ok('voltar fecha a caixa e continua na segunda via',
     dialogo2.classList.contains('oculto') && j2.document.querySelector('input[name="excecao"]:checked').value === 'segunda-via');

  j2.document.getElementById('rotuloModoLote').click(); await T.esperar(20);
  ok('trocar para lote também é barrado', j2.modoEscolhido() === 'unico', j2.modoEscolhido());
  j2.fecharDialogo();
  j2.document.getElementById('btLimpar').click(); await T.esperar(20);
  ok('e "Limpar o formulário" também', vl.value === '998' && !dialogo2.classList.contains('oculto'), vl.value);
  j2.fecharDialogo();
  j2.document.getElementById('justificativaExcecao').focus(); await T.esperar(20);
  ok('o complemento do motivo continua livre',
     dialogo2.classList.contains('oculto') && j2.document.activeElement.id === 'justificativaExcecao');
  refm.focus(); await T.esperar(20);
  ok('e a Referência a usar também', dialogo2.classList.contains('oculto') && j2.document.activeElement === refm);

  vl.focus(); await T.esperar(20);
  j2.document.getElementById('dlgMudarParaCorrecao').click(); await T.esperar(40);
  ok('"Mudar para Corrigir" troca a escolha',
     j2.document.querySelector('input[name="excecao"]:checked').value === 'correcao' &&
     j2.document.getElementById('rotuloCorrecao').classList.contains('marcada'));
  ok('destrava os campos', !j2.document.body.classList.contains('segunda-via'));
  ok('e devolve o cursor ao campo que ele tentou mudar', j2.document.activeElement === vl);
  vl.value = '997'; vl.dispatchEvent(new j2.Event('input', { bubbles: true }));
  await T.esperar(900);
  ok('agora a mudança vale, e a caixa roxa a mostra',
     fixo2.textContent === 'Corrigir um comprovante — corrigido: valor', fixo2.textContent);

  escolherExcecao('segunda-via'); await T.esperar(900);
  ok('segunda via com a tela diferente do original: a caixa roxa avisa, e diz o quê',
     comp.className === 'dica diferente' && /ATENÇÃO/.test(comp.textContent) && /\(valor\)/.test(comp.textContent),
     comp.textContent);
  refm.value = 'CMP-26/900'; refm.dispatchEvent(new j2.Event('input', { bubbles: true }));
  await T.esperar(900);
  ok('Referência que não está no Histórico', /não está no Histórico/.test(comp.textContent), comp.textContent);
  ok('e o motivo continua o da escolha, sem a comparação',
     j2.montarMovimentacao().referenciaJustificativa === 'Segunda via de um comprovante já emitido',
     j2.montarMovimentacao().referenciaJustificativa);

  j2.document.getElementById('data').focus(); await T.esperar(20);
  j2.document.getElementById('dlgEmitirSegundaVia').click(); await T.esperar(40);
  ok('"Emitir a segunda via como está" leva à escolha dos PDFs', !!j2.document.getElementById('dlgGerarEscolhidas'));
  j2.fecharDialogo();

  j2.document.getElementById('voltarAoSistema').click(); await T.esperar(40);
  ok('voltando ao número do sistema, destrava', !j2.document.body.classList.contains('segunda-via'));
  vl.focus(); await T.esperar(20);
  ok('e o valor se deixa mudar de novo', dialogo2.classList.contains('oculto') && j2.document.activeElement === vl);
  ok('e a comparação da segunda via some', comp.textContent === '', comp.textContent);

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
  T.escolherNoCombo(j3, 'cmbForma', 'PIX'); await T.esperar(60);
  var vl3 = j3.document.getElementById('valor');
  vl3.value = '1.800,00'; vl3.dispatchEvent(new j3.Event('input', { bubbles: true }));
  j3.document.getElementById('observacao').value = 'SUPRI SAO GABRIEL';
  T.escolherNoCombo(j3, 'assin-TODAS-0', 'Adalto'); await T.esperar(40);
  T.escolherNoCombo(j3, 'assin-TODAS-1', 'Nilson'); await T.esperar(40);
  j3.document.getElementById('btGerar').click(); await T.esperar(60);
  j3.document.getElementById('dlgGerarEscolhidas').click(); T.passarDasBandeiras(j3); await T.esperar(700);

  // Fechar e reabrir = uma janela nova, com os dados que o servidor devolve agora.
  var j4 = T.abrirTela(d3.servidor.dadosDoFormulario(), d3.servidor).window;
  await T.esperar(280);
  function texto4(id) { return j4.document.querySelector('#' + id + ' .combo-entrada').value; }

  grupo('a janela reabre como estava');
  ok('a conta de origem voltou', texto4('cmbContaOrigem').indexOf('101.10 - BB') >= 0, texto4('cmbContaOrigem'));
  ok('a conta de destino voltou', texto4('cmbContaDestino').indexOf('101.17') >= 0);
  ok('a forma voltou', texto4('cmbForma').indexOf('PIX') >= 0, texto4('cmbForma'));
  ok('a observação voltou', j4.document.getElementById('observacao').value === 'SUPRI SAO GABRIEL');
  ok('o valor voltou', j4.document.getElementById('valor').value === '1800');
  ok('os assinantes voltaram',
     j4.document.querySelector('#assin-TODAS-0 .combo-entrada').value.indexOf('Adalto') >= 0 &&
     j4.document.querySelector('#assin-TODAS-1 .combo-entrada').value.indexOf('Nilson') >= 0);
  ok('com os cargos', j4.document.querySelectorAll('.v-cargo-campo')[0].value === 'Diácono');
  ok('as etapas foram recontadas', etapasDoSeletor(j4).length === 3, etapasDoSeletor(j4).join('→'));

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
  ok('forma limpa', texto4('cmbForma') === '');
  ok('observação limpa', j4.document.getElementById('observacao').value === '');
  ok('valor limpo', j4.document.getElementById('valor').value === '');
  ok('assinantes limpos', j4.document.querySelector('#assin-TODAS-0 .combo-entrada').value === '');
  ok('data de volta para hoje', j4.document.getElementById('data').value === d3.dados.hoje);
  ok('uma linha de lote, vazia', j4.document.querySelectorAll('.lote-linha').length === 1);
  ok('e a Referência continua a mesma',
     j4.document.getElementById('referencia').value === 'CMP-26/002');

  /* =======================================================================
     A PROVA DE QUE EXISTE UMA CÓPIA SÓ DA REGRA

     A árvore de tipos e as regras entre contas moram em UM lugar:
     `06_Tipos_E_Regras.gs`. A tela precisa delas para responder na hora da
     tecla, e as recebe por injeção — o servidor lê o código-fonte das
     funções `nucleo*` e o cola dentro da janela na hora de abrir.

     Antes havia duas cópias e uma bateria que provava que concordavam. Isso
     funcionava, mas obrigava quem mexesse numa a lembrar da outra, para
     sempre. O que se prova aqui agora é mais forte: que a janela está rodando
     **o mesmo texto** que o servidor, letra por letra.
     ======================================================================= */
  grupo('a janela roda a MESMA regra do servidor, não uma cópia');
  var j5 = T.abrirTela(d.dados, d.servidor).window;
  await T.esperar(200);

  var doServidor = d.servidor.FUNCOES_DO_NUCLEO.map(function (f) { return f.name; });
  ok('o servidor declara funções de núcleo', doServidor.length > 0, doServidor.join(', '));
  ok('e todas têm nome (são declarações, não anônimas)',
     doServidor.every(function (n) { return !!n; }), doServidor.join(', '));

  var diferentes = [], ausentes = [];
  doServidor.forEach(function (nome) {
    if (typeof j5[nome] !== 'function') { ausentes.push(nome); return; }
    if (j5[nome].toString() !== d.servidor[nome].toString()) diferentes.push(nome);
  });
  ok('todas chegaram à janela', !ausentes.length, 'faltou: ' + ausentes.join(', '));
  ok('e o texto delas é IDÊNTICO ao do servidor', !diferentes.length,
     'divergiu: ' + diferentes.join(', '));

  /* O arquivo .html não pode ter regra escrita dentro dele: se tivesse, a
     injeção seria enfeite e a segunda cópia estaria de volta pela porta dos
     fundos. */
  var htmlCru = require('fs').readFileSync('apps_script/04_Formulario_Tela.html', 'utf8');
  ok('o arquivo .html não define nenhuma função do núcleo',
     !/function\s+nucleo/.test(htmlCru),
     'há "function nucleo..." escrito dentro do HTML');
  ok('e ele traz a marca onde o núcleo entra',
     !!d.servidor.marcaEncontrada_(htmlCru));
  ok('a marca que vale é ASCII puro — acento aqui é casamento que um dia falha',
     /^[\x20-\x7e]*$/.test(d.servidor.MARCA_DO_NUCLEO), d.servidor.MARCA_DO_NUCLEO);
  /* O getContent() do Apps Script devolve o arquivo SEM comentários. Uma marca
     escrita em comentário simplesmente não chega ao servidor — foi o que
     custou duas rodadas de diagnóstico errado. */
  ok('e é um COMANDO, não um comentário',
     d.servidor.MARCA_DO_NUCLEO.indexOf('/*') < 0 &&
     /^var\s/.test(d.servidor.MARCA_DO_NUCLEO), d.servidor.MARCA_DO_NUCLEO);
  ok('a marca de fim também é um comando',
     d.servidor.MARCA_FIM_DA_TELA.indexOf('/*') < 0 &&
     /^var\s/.test(d.servidor.MARCA_FIM_DA_TELA), d.servidor.MARCA_FIM_DA_TELA);
  ok('as duas sobrevivem a uma leitura que apague os comentários',
     !!d.servidor.marcaEncontrada_(semComentarios_(htmlCru)) &&
     !!d.servidor.fimEncontrado_(semComentarios_(htmlCru)));
  ok('a tela declara a versão dela', !!d.servidor.versaoDaTela_(htmlCru),
     'nenhuma versão declarada');
  ok('e ela bate com a do núcleo',
     d.servidor.versaoDaTela_(htmlCru) === d.servidor.VERSAO_DO_NUCLEO,
     'tela ' + d.servidor.versaoDaTela_(htmlCru) + ' x núcleo ' + d.servidor.VERSAO_DO_NUCLEO);

  /* Sem a marca, o servidor tem de gritar. Uma janela montada sem o núcleo
     abre normalmente e não responde a nenhum botão, sem mensagem nenhuma --
     a armadilha do HtmlService que já custou caro neste projeto. */
  var gritou = '';
  try { require('./montar_tela.js').injetar('<html><script>var a=1;</script></html>', '.'); }
  catch (e) { gritou = e.message; }
  ok('sem a marca, a montagem falha com mensagem clara',
     gritou.indexOf('marca') >= 0, gritou || 'passou calada');

  /* E a mensagem do servidor tem de dizer QUAL versão está no editor — sem
     isso, "colei o arquivo errado", "colei pela metade" e "o script está
     quebrado" parecem a mesma coisa na tela. */
  var telaVelha = '<html><script>var VERSAO_DA_TELA = \'2020-01-01\';</script></html>';
  ok('a versão é lida de dentro do HTML',
     d.servidor.versaoDaTela_(telaVelha) === '2020-01-01', d.servidor.versaoDaTela_(telaVelha));
  ok('e some quando o arquivo é antigo demais para declarar',
     d.servidor.versaoDaTela_('<html><script>var a=1;</script></html>') === '');

  /* =======================================================================
     E A REGRA, RODANDO CONTRA O CADASTRO INTEIRO

     Não é mais a comparação de duas cópias -- é a prova de que a cópia única,
     já injetada na janela, responde certo para todo par que existe de
     verdade no cadastro.
     ======================================================================= */
  grupo('a regra injetada responde certo em todo o cadastro');
  var NATUREZAS = ['CAIXA', 'BANCO', 'ACG', 'CARTAO', ''];
  var nomes = function (lista) {
    return lista.map(function (f) { return f.nome; }).join(' | ');
  };
  var difFormas = [], paresDeNatureza = 0;
  NATUREZAS.forEach(function (origem) {
    NATUREZAS.forEach(function (destino) {
      paresDeNatureza++;
      var naTela = j5.formasEntreContas({ natureza: origem, texto: '' },
                                        { natureza: destino, texto: '' });
      var noServidor = d.servidor.formasEntreNaturezas_(origem, destino);
      var par = '[' + (origem || 'vazia') + ' -> ' + (destino || 'vazia') + ']';
      if (nomes(naTela.formas) !== nomes(noServidor.formas)) {
        difFormas.push(par + ' formas: tela "' + nomes(naTela.formas) +
                       '" x servidor "' + nomes(noServidor.formas) + '"');
      }
      if (naTela.motivos.join(' // ') !== noServidor.motivos.join(' // ')) {
        difFormas.push(par + ' motivos: tela "' + naTela.motivos.join(' // ') +
                       '" x servidor "' + noServidor.motivos.join(' // ') + '"');
      }
      if (!!naTela.restricoesAtivas !== !!noServidor.restricoesAtivas) {
        difFormas.push(par + ' restrições ligadas: tela ' + naTela.restricoesAtivas +
                       ' x servidor ' + noServidor.restricoesAtivas);
      }
    });
  });
  ok('os 25 pares de natureza dão a mesma resposta dos dois lados',
     !difFormas.length, difFormas.slice(0, 4).join('\n      '));
  ok('e foram mesmo os 25 pares', paresDeNatureza === 25, 'foram ' + paresDeNatureza);

  var contasTodas = d.dados.contas;
  var difClasse = [], paresDeConta = 0;
  contasTodas.forEach(function (a) {
    contasTodas.forEach(function (b) {
      paresDeConta++;
      var naTela = j5.classificarMovimentacao(a, b);
      var noServidor = d.servidor.classificarMovimentacao_(a.texto, b.texto);
      ['tipo', 'subtipo', 'descricao', 'mesmaPia', 'mesmaAdm'].forEach(function (campo) {
        if (naTela[campo] !== noServidor[campo]) {
          difClasse.push(a.texto + '  ->  ' + b.texto + '\n        ' + campo +
                         ': tela "' + naTela[campo] + '" x servidor "' + noServidor[campo] + '"');
        }
      });
    });
  });
  ok('todos os pares de conta do cadastro se classificam igual',
     !difClasse.length, difClasse.slice(0, 3).join('\n      '));
  ok('e foram todas as contas contra todas',
     paresDeConta === contasTodas.length * contasTodas.length,
     paresDeConta + ' pares para ' + contasTodas.length + ' contas');

  var difTexto = [];
  contasTodas.slice(0, 6).forEach(function (a) {
    contasTodas.slice(0, 6).forEach(function (b) {
      ['', 'PIX', 'DINHEIRO'].forEach(function (forma) {
        ['', 'Carregamento de cartão'].forEach(function (finalidade) {
          var naTela = j5.textoDoTipo(j5.classificarMovimentacao(a, b), forma, finalidade);
          var noServidor = d.servidor.textoDoTipo_(
            d.servidor.classificarMovimentacao_(a.texto, b.texto), forma, finalidade);
          if (naTela !== noServidor) {
            difTexto.push('tela "' + naTela + '" x servidor "' + noServidor + '"');
          }
        });
      });
    });
  });
  ok('e o texto do campo Tipo sai igual dos dois lados',
     !difTexto.length, difTexto.slice(0, 3).join('\n      '));

  /* =======================================================================
     A ÁRVORE NA TELA: o tipo se deduz, a forma se filtra, a regra trava
     ======================================================================= */
  grupo('o tipo se deduz das contas, sem ninguém escolher');
  function digitar5(id, texto) {
    var e = j5.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j5.Event('input', { bubbles: true }));
    e.dispatchEvent(new j5.Event('blur', { bubbles: true }));
    return e;
  }
  var deduzido = function () { return j5.document.getElementById('tipoDeduzido').textContent; };

  ok('sem contas, o campo pede as contas', deduzido().indexOf('Escolha as duas contas') >= 0, deduzido());

  digitar5('cmbContaOrigem', 'PIA-COXIM: 100.10'); await T.esperar(220);
  digitar5('cmbContaDestino', 'PIA-COXIM: 101.10 - BB'); await T.esperar(220);
  ok('mesma PIA: movimentação interna',
     deduzido().indexOf('MOVIMENTAÇÃO INTERNA') >= 0, deduzido());

  digitar5('cmbContaDestino', 'PIA-SONORA: 101.16'); await T.esperar(220);
  ok('PIAs diferentes da mesma ADM: transferência entre departamentos',
     deduzido().indexOf('entre departamentos') >= 0, deduzido());

  digitar5('cmbContaDestino', 'PIA-COSTA: CARTÃO'); await T.esperar(220);
  ok('ADMs diferentes: transferência entre administrações',
     deduzido().indexOf('entre administrações') >= 0, deduzido());

  grupo('as regras da tesouraria, na tela');
  /* Os nomes das contas saem do próprio cadastro, e não digitados aqui: um
     texto digitado à mão envelhece, e um nome que não casa com conta nenhuma
     faria o teste "passar" sem a regra ter sido consultada uma vez sequer. */
  function contaDeNatureza(natureza, pia) {
    var achada = null;
    d.dados.contas.forEach(function (c) {
      if (achada || c.natureza !== natureza) return;
      if (pia && c.piaChave !== pia) return;
      achada = c;
    });
    if (!achada) throw new Error('o cadastro não tem conta ' + natureza + ' em ' + (pia || 'lugar nenhum'));
    return achada.texto;
  }
  function contaComoTexto(re) {
    var achada = '';
    d.dados.contas.forEach(function (c) { if (!achada && re.test(c.texto)) achada = c.texto; });
    if (!achada) throw new Error('o cadastro não tem conta casando com ' + re);
    return achada;
  }
  var oCaixa = contaComoTexto(/PIA-COXIM: 100\.10/);
  var oBB = contaComoTexto(/101\.10 - BB/);
  var oSant = contaComoTexto(/101\.12 - SANT/);
  var oCartao = contaComoTexto(/PIA-COXIM: CARTÃO DE DÉBITO/);
  var oSant2 = contaComoTexto(/101\.13 - SANT/);
  var oAcg = contaComoTexto(/PIA-COXIM: 101\.15/);

  /* O CASO QUE ELE TROUXE: dinheiro no cofre indo para a ACG. Pelas regras
     da obra isso é impossível — o caixa só movimenta por saque, a ACG só por
     PIX — e o sistema deixava passar em silêncio. */
  digitar5('cmbContaOrigem', oCaixa); await T.esperar(220);
  digitar5('cmbContaDestino', oAcg); await T.esperar(220);
  ok('caixa -> ACG: nenhuma forma é oferecida',
     T.abrirCombo(j5, 'cmbForma').length === 0, T.abrirCombo(j5, 'cmbForma').join(' | '));
  ok('e a tela diz que nenhuma forma vale',
     j5.document.getElementById('dicaForma').textContent.indexOf('0 de') >= 0 ||
     j5.document.getElementById('dicaForma').textContent.indexOf('Nenhuma') >= 0,
     j5.document.getElementById('dicaForma').textContent);

  grupo('saque pede a subforma: dinheiro ou cheque');
  digitar5('cmbContaOrigem', oBB); await T.esperar(220);
  digitar5('cmbContaDestino', oCaixa); await T.esperar(220);
  var formasBB = T.abrirCombo(j5, 'cmbForma');
  ok('banco -> caixa: só SAQUE', formasBB.join(' | ') === 'SAQUE', formasBB.join(' | '));
  ok('o campo de subforma começa escondido',
     j5.document.getElementById('campoSubforma').style.display === 'none');

  T.escolherNoCombo(j5, 'cmbForma', 'SAQUE'); await T.esperar(150);
  ok('escolhida a forma SAQUE, o campo aparece',
     j5.document.getElementById('campoSubforma').style.display !== 'none');
  var sub = T.abrirCombo(j5, 'cmbSubforma');
  ok('e oferece dinheiro e cheque', sub.length === 2 &&
     sub.indexOf('DINHEIRO') >= 0 && sub.indexOf('CHEQUE') >= 0, sub.join(' | '));
  ok('enquanto não escolher, a tela cobra',
     T.avisosNaTela(j5).some(function (a) { return a.indexOf('saque de quê') >= 0; }),
     T.avisosNaTela(j5).join(' / '));

  T.escolherNoCombo(j5, 'cmbSubforma', 'CHEQUE'); await T.esperar(150);
  ok('escolhida a subforma, o aviso some',
     !T.avisosNaTela(j5).some(function (a) { return a.indexOf('saque de quê') >= 0; }),
     T.avisosNaTela(j5).join(' / '));
  ok('e o documento leva as duas: SAQUE e CHEQUE',
     j5.document.getElementById('previaDoTipo').textContent.indexOf('SAQUE') >= 0 &&
     j5.document.getElementById('previaDoTipo').textContent.indexOf('CHEQUE') >= 0,
     j5.document.getElementById('previaDoTipo').textContent);

  grupo('o caixa como ORIGEM só sai em dinheiro');
  digitar5('cmbContaOrigem', oCaixa); await T.esperar(220);
  digitar5('cmbContaDestino', oBB); await T.esperar(220);
  T.escolherNoCombo(j5, 'cmbForma', 'SAQUE'); await T.esperar(150);
  var subSaida = T.abrirCombo(j5, 'cmbSubforma');
  ok('caixa -> banco: só dinheiro, sem cheque',
     subSaida.join(' | ') === 'DINHEIRO', subSaida.join(' | '));

  grupo('Santander não saca — não há agência na cidade');
  digitar5('cmbContaOrigem', oSant); await T.esperar(220);
  digitar5('cmbContaDestino', oBB); await T.esperar(220);
  var deSant = T.abrirCombo(j5, 'cmbForma');
  ok('SANT -> BB: sem SAQUE', deSant.indexOf('SAQUE') < 0, deSant.join(' | '));
  ok('mas com PIX e as transferências', deSant.indexOf('PIX') >= 0, deSant.join(' | '));

  grupo('a instituição das duas contas, dentro da janela');
  /* A MESMA REGRA DO SERVIDOR, rodando no navegador — é o que a injeção
     promete. Transferência bancária é transferência DENTRO de uma
     instituição; entre duas diferentes, o que existe é TED ou PIX. */
  ok('SANT -> BB: só TED e PIX, sem transferência bancária',
     deSant.join(' | ') === 'TED | PIX', deSant.join(' | '));

  digitar5('cmbContaOrigem', oSant); await T.esperar(220);
  digitar5('cmbContaDestino', oSant2); await T.esperar(220);
  ok('SANT -> SANT: a mesma instituição, então transferência bancária',
     T.abrirCombo(j5, 'cmbForma').join(' | ') === 'TRANSF. BANCÁRIA',
     T.abrirCombo(j5, 'cmbForma').join(' | '));

  digitar5('cmbContaOrigem', oBB); await T.esperar(220);
  digitar5('cmbContaDestino', oSant); await T.esperar(220);
  ok('e banco -> banco não oferece dinheiro nem cheque',
     T.abrirCombo(j5, 'cmbForma').indexOf('SAQUE') < 0,
     T.abrirCombo(j5, 'cmbForma').join(' | '));

  digitar5('cmbContaOrigem', oSant); await T.esperar(220);
  digitar5('cmbContaDestino', oBB); await T.esperar(220);

  digitar5('cmbContaDestino', oCaixa); await T.esperar(220);
  ok('e SANT -> caixa fica impossível (o caixa só recebe saque)',
     T.abrirCombo(j5, 'cmbForma').length === 0, T.abrirCombo(j5, 'cmbForma').join(' | '));

  grupo('a exceção do cartão devolvido em espécie');
  digitar5('cmbContaOrigem', oCartao); await T.esperar(220);
  digitar5('cmbContaDestino', oCaixa); await T.esperar(220);
  var doCartao = T.abrirCombo(j5, 'cmbForma');
  ok('cartão -> caixa: SAQUE, pela regra específica do par',
     doCartao.join(' | ') === 'SAQUE', doCartao.join(' | '));
  T.escolherNoCombo(j5, 'cmbForma', 'SAQUE'); await T.esperar(150);
  ok('e só em dinheiro', T.abrirCombo(j5, 'cmbSubforma').join(' | ') === 'DINHEIRO',
     T.abrirCombo(j5, 'cmbSubforma').join(' | '));

  digitar5('cmbContaDestino', oAcg); await T.esperar(220);
  ok('já cartão -> ACG é transferência bancária',
     T.abrirCombo(j5, 'cmbForma').join(' | ') === 'TRANSF. BANCÁRIA',
     T.abrirCombo(j5, 'cmbForma').join(' | '));

  grupo('conta sem Natureza no cadastro não passa calada');
  /* Sem Natureza, nenhuma regra alcança a conta: as restrições ficam ligadas
     e o lançamento passa por fora de todas elas, sem nada denunciar. O aviso
     existe para esse silêncio não acontecer.

     A conta tem de nascer sem Natureza, e não perdê-la com a janela aberta:
     apagar o dado depois que o combo já o pegou mede o teste, não o produto.
     Por isso este grupo abre uma janela própria, com um cadastro em que a
     coluna Natureza está em branco -- que é como o defeito aparece na vida
     real, quando alguém acrescenta uma conta à mão e deixa a coluna vazia. */
  var dadosCapengas = JSON.parse(JSON.stringify(d.dados));
  var contaCapenga = null;
  dadosCapengas.contas.forEach(function (c) { if (!contaCapenga && c.natureza) contaCapenga = c; });
  contaCapenga.natureza = '';

  var j6 = T.abrirTela(dadosCapengas, d.servidor).window;
  await T.esperar(200);
  function digitar6(id, texto) {
    var e = j6.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j6.Event('input', { bubbles: true }));
    e.dispatchEvent(new j6.Event('blur', { bubbles: true }));
  }

  digitar6('cmbContaOrigem', contaCapenga.texto); await T.esperar(250);
  ok('a tela avisa que aquela conta está com Natureza inválida',
     T.avisosNaTela(j6).some(function (a) { return a.indexOf('Natureza inválida') >= 0; }),
     T.avisosNaTela(j6).join(' / '));
  ok('e diz o que isso significa, não só que falta',
     j6.document.getElementById('avisos').textContent.indexOf('NENHUMA regra') >= 0);
  ok('e diz onde consertar',
     j6.document.getElementById('avisos').textContent.indexOf('recriar a aba Cadastros') >= 0);
  /* Aqui TRAVA, e é diferente dos outros avisos de propósito: com a Natureza
     fora da lista, as regras entre contas simplesmente não se aplicam àquela
     conta. Deixar passar seria dar bandeira verde a um lançamento que nenhuma
     regra conferiu — que foi exatamente o que aconteceu. */
  ok('e trava, porque sem Natureza nenhuma regra confere nada',
     j6.document.getElementById('btGerar').disabled);

  /* E uma conta com Natureza, na mesma janela, não gera aviso nenhum. */
  var contaBoa = null;
  dadosCapengas.contas.forEach(function (c) { if (!contaBoa && c.natureza) contaBoa = c; });
  digitar6('cmbContaOrigem', contaBoa.texto); await T.esperar(250);
  ok('conta com Natureza não é acusada de nada',
     !T.avisosNaTela(j6).some(function (a) { return a.indexOf('Natureza inválida') >= 0; }),
     T.avisosNaTela(j6).join(' / '));

  grupo('a praxe dos cartões avisa, e não trava');
  /* "Zerar Conta", "Transferência Débito" e "Carregamento de cartão" cabem
     dentro da mesma PIA e entre PIAs da mesma ADM. A tesouraria de Coxim
     adotou sempre o caminho interno — mas é praxe dela, não determinação da
     obra. Por isso é nota, e não regra. */
  function cartaoDe(pia) { return contaDeNatureza('CARTAO', pia); }

  /* O carregamento de cartão sai da ACG por TRANSFERÊNCIA BANCÁRIA, e não por
     PIX: é a regra específica do par ACG -> CARTAO, mais forte que a regra
     geral "a ACG movimenta por PIX". */
  digitar5('cmbContaOrigem', oAcg); await T.esperar(220);
  digitar5('cmbContaDestino', cartaoDe('PIACOXIM')); await T.esperar(220);
  ok('ACG -> cartão oferece a transferência bancária',
     T.abrirCombo(j5, 'cmbForma').join(' | ') === 'TRANSF. BANCÁRIA',
     T.abrirCombo(j5, 'cmbForma').join(' | '));
  T.escolherNoCombo(j5, 'cmbForma', 'TRANSF. BANCÁRIA'); await T.esperar(120);
  ok('e nada trava',
     !j5.document.getElementById('btGerar').disabled,
     T.avisosNaTela(j5).join(' / '));
  ok('cartão da mesma PIA: nenhuma nota de praxe',
     !T.avisosNaTela(j5).some(function (a) { return a.indexOf('praxe') >= 0; }),
     T.avisosNaTela(j5).join(' / '));

  digitar5('cmbContaDestino', cartaoDe('PIASONORA')); await T.esperar(220);
  T.escolherNoCombo(j5, 'cmbForma', 'TRANSF. BANCÁRIA'); await T.esperar(120);
  ok('cartão de outro departamento: a nota aparece',
     T.avisosNaTela(j5).some(function (a) { return a.indexOf('praxe') >= 0; }),
     T.avisosNaTela(j5).join(' / '));
  ok('e ela NÃO trava os botões', !j5.document.getElementById('btGerar').disabled);
  ok('a nota diz que é praxe, não determinação',
     j5.document.getElementById('avisos').textContent.indexOf('não') >= 0 &&
     j5.document.getElementById('avisos').textContent.indexOf('determinação') >= 0);
  ok('e diz como desligá-la',
     j5.document.getElementById('avisos').textContent.indexOf('PRAXE_CARTAO_NA_MESMA_PIA') >= 0);

  /* Outra ADM faz diferente: põe NÃO e a nota some, sem mexer em código. */
  var semPraxe = d.servidor.nucleoPraxeDoCartao(
    { piaChave: 'A', natureza: 'CARTAO' }, { piaChave: 'B', natureza: 'BANCO' }, false);
  ok('com a chave em NÃO, o núcleo não dá nota nenhuma', semPraxe === '', semPraxe);
  var comPraxe = d.servidor.nucleoPraxeDoCartao(
    { piaChave: 'A', natureza: 'CARTAO' }, { piaChave: 'B', natureza: 'BANCO' }, true);
  ok('e com SIM, dá', comPraxe.indexOf('praxe') >= 0, comPraxe);
  ok('nenhuma conta de cartão, nenhuma nota',
     d.servidor.nucleoPraxeDoCartao(
       { piaChave: 'A', natureza: 'CAIXA' }, { piaChave: 'B', natureza: 'BANCO' }, true) === '');


  console.log('\nTESTES DE FECHAR A TELA');
  var d7 = T.dadosDeVerdade();
  var j7 = T.abrirTela(d7.dados, d7.servidor).window;
  await T.esperar(240);
  var fechou = { janela: 0, aba: 0, quadro: 0 };
  j7.google.script.host.close = function () { fechou.janela++; };
  j7.close = function () { fechou.quadro++; };
  var faixa7 = j7.document.getElementById('faixa');

  grupo('na janela do Sheets quem fecha é o Google');
  j7.document.getElementById('btFechar').click(); await T.esperar(80);
  ok('fechou a janela', fechou.janela === 1);
  ok('e não pediu nada ao navegador', fechou.quadro === 0);

  grupo('na aba inteira o pedido vai para a ABA, e não para o quadro');
  /* A tela de um App da Web mora dentro de um QUADRO (iframe) na página do
     Google, e `close()` chamado ali dentro pede para fechar o quadro — que
     não é a aba. Foi esta metade do defeito que ficou de pé depois do
     primeiro conserto.

     No jsdom não existe quadro dentro de quadro: `window.top` é o próprio
     `window`. Por isso a tela pergunta quem é a aba a uma função sozinha
     (`abaDeVerdade`), e a bancada a troca por um quadro de mentira — é a
     única maneira de provar esta regra aqui. */
  var abaDeMentira = { close: function () { fechou.aba++; } };
  j7.EM_ABA_INTEIRA = true;
  j7.abaDeVerdade = function () { return abaDeMentira; };
  j7.document.getElementById('btFechar').click(); await T.esperar(80);
  ok('pediu para a ABA fechar', fechou.aba === 1);
  ok('e não chamou o google.script.host, que numa aba não existe', fechou.janela === 1);

  grupo('se o navegador recusar, a tela oferece voltar para a planilha');
  await T.esperar(400);
  ok('a faixa apareceu', faixa7.style.display === 'block' && faixa7.className === 'indo');
  ok('e não chuta o motivo', faixa7.textContent.indexOf('direto pelo endereço') < 0,
     faixa7.textContent);
  var link7 = faixa7.querySelector('a');
  ok('com o endereço da planilha, que veio do servidor',
     !!link7 && link7.getAttribute('href') === d7.dados.urlDaPlanilha, faixa7.innerHTML);
  ok('e trocando a página inteira, não o quadro',
     !!link7 && link7.getAttribute('target') === '_top');

  grupo('preencher o comprovante abre a caixa com o resultado');
  /* O BOTÃO VOLTOU A SÓ PREENCHER. Ele chegou a fechar a tela sozinho — e
     fechando não dava tempo de ler o resultado, que é o que ele foi ver. */
  function digitar7(id, texto) {
    var e = j7.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j7.Event('input', { bubbles: true }));
    e.dispatchEvent(new j7.Event('blur', { bubbles: true }));
  }
  digitar7('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE');
  await T.esperar(220);
  digitar7('cmbContaDestino', 'PIA-COXIM: 100.10'); await T.esperar(220);
  var vl7 = j7.document.getElementById('valor');
  vl7.value = '300'; vl7.dispatchEvent(new j7.Event('input', { bubbles: true }));

  var dialogo7 = j7.document.getElementById('dialogo');
  var abaAntes = fechou.aba;
  j7.document.getElementById('btPreencher').click(); await T.esperar(600);

  ok('a caixa abriu', !dialogo7.classList.contains('oculto'));
  ok('com o resultado dentro',
     j7.document.getElementById('dialogoTexto').textContent.indexOf('Título:') >= 0,
     j7.document.getElementById('dialogoTexto').textContent.slice(0, 60));
  ok('e a faixa verde continua no topo, reforçando',
     faixa7.className === 'ok' && faixa7.style.display === 'block', faixa7.className);
  ok('e a tela NÃO se fechou sozinha', fechou.aba === abaAntes);
  ok('tem o botão de gerar o PDF', !!j7.document.getElementById('dlgPdf'));
  ok('o de voltar ao formulário', !!j7.document.getElementById('dlgVoltar'));
  ok('o de fechar, com o nome do lugar onde se está',
     j7.document.getElementById('dlgFechar').textContent === 'Fechar esta aba',
     j7.document.getElementById('dlgFechar').textContent);
  ok('e os dois de salvar uma cópia em planilha',
     !!j7.document.getElementById('dlgExcel') && !!j7.document.getElementById('dlgGoogle'));

  grupo('voltar ao formulário só fecha a caixa');
  j7.document.getElementById('dlgVoltar').click(); await T.esperar(60);
  ok('a caixa fechou', dialogo7.classList.contains('oculto'));
  ok('e a tela continua aberta', fechou.aba === abaAntes);

  grupo('o Excel BAIXA para o computador e não fica no Drive');
  /* O caminho anterior salvava o .xlsx na pasta do Drive e oferecia um
     endereço de download dele — e o botão não funcionava: aquele endereço
     depende de sessão, de permissão e de um redirecionamento do Google.
     Agora os bytes voltam com a resposta e o navegador salva direto. */
  var baixados = [];
  j7.baixarAgora = function (endereco, nome) { baixados.push({ endereco: endereco, nome: nome }); };
  j7.document.getElementById('btPreencher').click(); await T.esperar(600);
  j7.document.getElementById('dlgExcel').click(); await T.esperar(600);

  ok('o arquivo foi baixado sozinho, sem ninguém clicar em mais nada',
     baixados.length === 1, JSON.stringify(baixados));
  ok('com o nome do comprovante e a extensão certa',
     baixados.length === 1 && baixados[0].nome.slice(-5) === '.xlsx',
     baixados.length ? baixados[0].nome : '(nada)');
  ok('e o endereço carrega o arquivo, não um link do Drive',
     baixados.length === 1 && baixados[0].endereco.indexOf('drive.google.com') < 0,
     baixados.length ? baixados[0].endereco.slice(0, 60) : '(nada)');
  ok('a caixa diz que ele foi baixado',
     j7.document.getElementById('dialogoTitulo').textContent === 'Excel baixado',
     j7.document.getElementById('dialogoTitulo').textContent);
  ok('e deixa claro que NÃO ficou no Drive',
     j7.document.getElementById('dialogoTexto').textContent.indexOf('NÃO ficou no Drive') >= 0,
     j7.document.getElementById('dialogoTexto').textContent);
  var linkCopia = j7.document.getElementById('dlgBaixarCopia');
  ok('o "baixar de novo" é link com download, e não um link que navega',
     !!linkCopia && linkCopia.tagName === 'A' &&
     linkCopia.getAttribute('download').slice(-5) === '.xlsx' &&
     !linkCopia.getAttribute('target'),
     linkCopia ? linkCopia.outerHTML.slice(0, 80) : '(nada)');
  /* O clique é seguro para o jsdom não tentar navegar até o arquivo (ele não
     sabe baixar nada) — o que se quer provar aqui é que a caixa fica de pé. */
  var segurarOClique = function (e) { e.preventDefault(); };
  linkCopia.addEventListener('click', segurarOClique);
  linkCopia.dispatchEvent(new j7.MouseEvent('click', { bubbles: true, cancelable: true }));
  linkCopia.removeEventListener('click', segurarOClique);
  await T.esperar(60);
  ok('o link NÃO fecha a caixa — quem baixou pode querer baixar de novo',
     !dialogo7.classList.contains('oculto'));

  grupo('a planilha do Google FICA no Drive e não baixa nada');
  var baixadosAntes = baixados.length;
  /* Os dois botões da cópia moram na caixa do preenchimento — a do resultado
     traz só o que fazer com o arquivo que acabou de sair. */
  j7.document.getElementById('btPreencher').click(); await T.esperar(600);
  j7.document.getElementById('dlgGoogle').click(); await T.esperar(600);
  ok('nada foi baixado', baixados.length === baixadosAntes);
  ok('a caixa fala do Drive',
     j7.document.getElementById('dialogoTitulo').textContent === 'Planilha salva no Drive',
     j7.document.getElementById('dialogoTitulo').textContent);
  ok('e diz que nada veio para o computador',
     j7.document.getElementById('dialogoTexto').textContent.indexOf('Nada foi baixado') >= 0,
     j7.document.getElementById('dialogoTexto').textContent);
  ok('com o link de abrir o arquivo no Drive',
     !!j7.document.getElementById('dlgAbrirCopia'));

  grupo('o fechar da caixa fecha de verdade');
  j7.document.getElementById('dlgFechar').click(); await T.esperar(80);
  ok('pediu para a aba fechar', fechou.aba === abaAntes + 1);
  ok('e a caixa saiu da frente', dialogo7.classList.contains('oculto'));

  grupo('gerar os PDFs abre a caixa com um link por PDF, a pasta e a correção');
  /* Mesma PIA: 2 etapas, e o padrão é gerar as duas de uma vez. */
  var abaAntes2 = fechou.aba;
  j7.document.getElementById('btGerar').click(); await T.esperar(60);
  j7.document.getElementById('dlgGerarEscolhidas').click(); T.passarDasBandeiras(j7); await T.esperar(1600);
  ok('a faixa verde traz um link por PDF',
     faixa7.innerHTML.indexOf('Abrir APROVADA') >= 0 && faixa7.innerHTML.indexOf('Abrir EFETIVADA') >= 0,
     faixa7.className + ' >> ' + faixa7.textContent.slice(0, 160));
  ok('e a caixa também abriu, dizendo quantos',
     j7.document.getElementById('dialogoTitulo').textContent === '2 PDFs gerados',
     j7.document.getElementById('dialogoTitulo').textContent);
  var linkPdf = j7.document.getElementById('dlgAbrirPdf');
  ok('com o link de cada PDF, de verdade',
     !!linkPdf && linkPdf.tagName === 'A' && linkPdf.getAttribute('target') === '_blank' &&
     linkPdf.textContent === 'Abrir APROVADA' &&
     !!j7.document.getElementById('dlgAbrirPdf-2') &&
     j7.document.getElementById('dlgAbrirPdf-2').textContent === 'Abrir EFETIVADA');
  ok('o texto diz onde ficaram o .md e o Histórico',
     /Arquivo de recuperação: CMP-26-\d+\.md/.test(j7.document.getElementById('dialogoTexto').textContent) &&
     j7.document.getElementById('dialogoTexto').textContent.indexOf('Registrado no Histórico: 2 linhas') >= 0,
     j7.document.getElementById('dialogoTexto').textContent);
  ok('com "Abrir a pasta"', !!j7.document.getElementById('dlgAbrirPasta'));
  ok('e com o "saiu errado?", que é o caminho de corrigir sem queimar número',
     !!j7.document.getElementById('dlgCorrigir'));
  ok('a tela ficou onde estava', fechou.aba === abaAntes2);
  j7.document.getElementById('dlgVoltar').click(); await T.esperar(60);

  grupo('aviso vermelho também abre a caixa, e a faixa vermelha continua lá');
  /* PEDIDO DELE, e pelo mesmo motivo do resultado: o botão que dispara o
     aviso fica no rodapé, e o aviso nascia no alto da tela.
     O limite é 32 lançamentos; aqui ele é encurtado para 1, senão o teste
     precisaria de 32 cliques para provar a mesma coisa. */
  j7.marcarModo('lote'); await T.esperar(60);
  j7.dados.maxLinhasLote = 1;
  j7.document.getElementById('maisUmaLinha').click(); await T.esperar(80);
  ok('a faixa vermelha apareceu',
     faixa7.className === 'erro' && faixa7.style.display === 'block', faixa7.className);
  ok('e a caixa também', !dialogo7.classList.contains('oculto'));
  ok('dizendo a mesma coisa que a faixa',
     j7.document.getElementById('dialogoTexto').textContent.indexOf('Cabem no máximo') >= 0,
     j7.document.getElementById('dialogoTexto').textContent);
  ok('com o título em vermelho',
     j7.document.getElementById('dialogoTitulo').className === 'ruim');
  ok('e um botão só, de voltar', !!j7.document.getElementById('dlgOk'));

  grupo('a tecla Esc fecha a caixa');
  j7.document.dispatchEvent(new j7.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await T.esperar(60);
  ok('a caixa fechou', dialogo7.classList.contains('oculto'));
  ok('e a faixa vermelha continua na tela, como ele pediu',
     faixa7.className === 'erro' && faixa7.style.display === 'block');

  grupo('na janela do Sheets a caixa fala de janela, e o fechar é o do Google');
  var d8 = T.dadosDeVerdade();
  var j8 = T.abrirTela(d8.dados, d8.servidor).window;
  await T.esperar(240);
  var fechouJanela8 = 0;
  j8.google.script.host.close = function () { fechouJanela8++; };
  function digitar8(id, texto) {
    var e = j8.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j8.Event('input', { bubbles: true }));
    e.dispatchEvent(new j8.Event('blur', { bubbles: true }));
  }
  digitar8('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE');
  await T.esperar(220);
  digitar8('cmbContaDestino', 'PIA-COXIM: 100.10'); await T.esperar(220);
  var vl8 = j8.document.getElementById('valor');
  vl8.value = '300'; vl8.dispatchEvent(new j8.Event('input', { bubbles: true }));
  j8.document.getElementById('btPreencher').click(); await T.esperar(600);
  ok('a caixa abriu também aqui',
     !j8.document.getElementById('dialogo').classList.contains('oculto'));
  ok('e o botão diz "Fechar a janela"',
     j8.document.getElementById('dlgFechar').textContent === 'Fechar a janela',
     j8.document.getElementById('dlgFechar').textContent);
  ok('a janela não se fechou sozinha', fechouJanela8 === 0);
  j8.document.getElementById('dlgFechar').click(); await T.esperar(80);
  ok('e fecha quando se pede', fechouJanela8 === 1);


  console.log('\nTESTES DA CAIXA DA CONFERÊNCIA');
  /* O MOVIMENTO PROIBIDO TRAVA O BOTÃO, E A EXPLICAÇÃO FICAVA ESCONDIDA no
     fim da terceira coluna — fora do campo de visão de quem está escolhendo a
     conta. Foi o caso dele: CAIXA para ACG. */
  var d9 = T.dadosDeVerdade();
  var j9 = T.abrirTela(d9.dados, d9.servidor).window;
  await T.esperar(260);
  var dialogo9 = j9.document.getElementById('dialogo');
  function digitar9(id, texto) {
    var e = j9.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j9.Event('input', { bubbles: true }));
    e.dispatchEvent(new j9.Event('blur', { bubbles: true }));
  }

  grupo('a tela não abre com caixa na cara de ninguém');
  ok('nada aberto ao montar', dialogo9.classList.contains('oculto'));

  grupo('escolher um par proibido abre a caixa');
  digitar9('cmbContaOrigem', 'PIA-COXIM: 100.10'); await T.esperar(220);
  digitar9('cmbContaDestino', 'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE');
  await T.esperar(260);
  ok('a caixa abriu', !dialogo9.classList.contains('oculto'));
  ok('dizendo o que a conferência diz',
     j9.document.getElementById('dialogoTexto').textContent.indexOf('ACG') >= 0,
     j9.document.getElementById('dialogoTexto').textContent.slice(0, 80));
  ok('em vermelho', j9.document.getElementById('dialogoTitulo').className === 'ruim');
  ok('e o botão continua travado, que é a trava de sempre',
     j9.document.getElementById('btPreencher').disabled);

  grupo('e NÃO reabre a cada tecla enquanto a quebra continua');
  j9.document.getElementById('dlgOk').click(); await T.esperar(60);
  ok('fechou ao voltar', dialogo9.classList.contains('oculto'));
  j9.document.getElementById('observacao').value = 'qualquer coisa';
  j9.document.getElementById('observacao').dispatchEvent(new j9.Event('input', { bubbles: true }));
  await T.esperar(160);
  ok('mexer noutro campo não traz a caixa de volta',
     dialogo9.classList.contains('oculto'));

  grupo('consertado o par, a próxima quebra abre de novo');
  digitar9('cmbContaDestino', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE');
  await T.esperar(260);
  ok('sem quebra, nenhuma caixa', dialogo9.classList.contains('oculto'));
  ok('e o botão destravou', !j9.document.getElementById('btPreencher').disabled);
  digitar9('cmbContaDestino', 'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE');
  await T.esperar(260);
  ok('quebrou de novo, a caixa volta', !dialogo9.classList.contains('oculto'));

  console.log('\nTESTES DA CAIXA DE ESCOLHER OS PDFs');
  var d10 = T.dadosDeVerdade();
  d10.dados.ultimo = null;
  var j10 = T.abrirTela(d10.dados, d10.servidor).window;
  await T.esperar(220);
  function digitar10(id, texto) {
    var e = j10.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j10.Event('input', { bubbles: true }));
    e.dispatchEvent(new j10.Event('blur', { bubbles: true }));
  }
  var bt10 = j10.document.getElementById('btGerar');
  var dlg10 = j10.document.getElementById('dialogo');
  function caixas10() { return j10.document.querySelectorAll('#dialogoConteudo input[type=checkbox]'); }
  function titulo10() { return j10.document.getElementById('dialogoTitulo').textContent; }
  function marcar10(valor, sim) {
    Array.prototype.forEach.call(caixas10(), function (c) {
      if (c.value === valor) { c.checked = sim; c.dispatchEvent(new j10.Event('change', { bubbles: true })); }
    });
  }

  grupo('o formulário não escolhe etapa: só mostra quantos documentos há');
  ok('o seletor de etapas saiu da tela', !j10.document.getElementById('etapaAtual'));
  var rodape10 = j10.document.getElementById('documentosNoRodape');
  ok('sem contas, o rodapé pede as contas, sem destaque',
     rodape10.classList.contains('sem-contas') && /Escolha as duas contas/.test(rodape10.textContent),
     rodape10.textContent);
  ok('e ele mora no rodapé, que fica sempre à vista',
     rodape10.parentNode === j10.document.getElementById('rodape'));

  grupo('sem contas, a caixa explica em vez de oferecer um botão que não serve');
  bt10.click(); await T.esperar(60);
  ok('a caixa abriu', !dlg10.classList.contains('oculto'));
  ok('dizendo que faltam as contas', titulo10() === 'Falta escolher as contas', titulo10());
  ok('sem marcações nem botão de gerar',
     !caixas10().length && !j10.document.getElementById('dlgGerarEscolhidas'));
  j10.document.getElementById('dlgVoltar').click(); await T.esperar(40);

  grupo('com as contas, a caixa oferece cada etapa — todas marcadas');
  digitar10('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  digitar10('cmbContaDestino', 'PIA-COSTA: ACG - AG:01 CC:128175700 - PIEDADE'); await T.esperar(220);
  ok('o rodapé diz 3 PDFs, e quais, com destaque',
     rodape10.textContent === '3 PDFs · APROVADA → PAGA → RECEBIDA' && !rodape10.classList.contains('sem-contas'),
     rodape10.textContent);
  ok('o botão termina em "…", que abre uma pergunta', bt10.textContent === 'Preencher e gerar os PDFs…', bt10.textContent);
  bt10.click(); await T.esperar(60);
  ok('a caixa pergunta quais', titulo10() === 'Quais PDFs gerar?', titulo10());
  ok('com as 3 etapas, na ordem',
     Array.prototype.map.call(caixas10(), function (c) { return c.value; }).join('→') === 'APROVADA→PAGA→RECEBIDA');
  ok('todas marcadas', Array.prototype.every.call(caixas10(), function (c) { return c.checked; }));
  var gerar10 = function () { return j10.document.getElementById('dlgGerarEscolhidas'); };
  ok('o botão diz quantos', gerar10().textContent === 'Gerar 3 PDFs', gerar10().textContent);

  grupo('desmarcar muda o botão, e nada marcado o apaga');
  marcar10('PAGA', false);
  ok('duas marcadas', gerar10().textContent === 'Gerar 2 PDFs', gerar10().textContent);
  ok('a pílula da desmarcada perde o destaque',
     !Array.prototype.filter.call(caixas10(), function (c) { return c.value === 'PAGA'; })[0]
       .parentNode.classList.contains('marcada'));
  marcar10('APROVADA', false); marcar10('RECEBIDA', false);
  ok('nenhuma: o botão se apaga', gerar10().disabled && gerar10().textContent === 'Marque ao menos uma');
  marcar10('RECEBIDA', true); marcar10('APROVADA', true);

  grupo('gerar duas quaisquer: saem só as marcadas, na ordem da movimentação');
  var naPasta10 = d10.pasta.length;
  var vl10 = j10.document.getElementById('valor');
  gerar10().click(); T.passarDasBandeiras(j10); await T.esperar(1600);
  var pdfs10 = d10.pasta.slice(naPasta10).filter(function (a) { return /\.pdf$/.test(a.nome); })
    .map(function (a) { return a.nome.replace(/^CMP-26-\d+-/, '').replace(/ - .*$/, ''); });
  ok('saíram APROVADA e RECEBIDA, sem a PAGA', pdfs10.join('→') === 'APROVADA→RECEBIDA', pdfs10.join('→'));
  ok('a caixa do resultado diz 2 PDFs', titulo10() === '2 PDFs gerados', titulo10());
  ok('e o .md saiu junto', d10.pasta.slice(naPasta10).some(function (a) { return /\.md$/.test(a.nome); }));
  j10.document.getElementById('dlgVoltar').click(); await T.esperar(60);

  grupo('a próxima caixa volta com TODAS marcadas — ela não guarda a escolha');
  bt10.click(); await T.esperar(60);
  ok('as três marcadas de novo', caixas10().length === 3 &&
     Array.prototype.every.call(caixas10(), function (c) { return c.checked; }));
  j10.document.getElementById('dlgVoltar').click(); await T.esperar(40);

  grupo('preencher põe a 1ª etapa na aba, e a caixa do preenchimento leva à escolha');
  digitar10('cmbContaDestino', 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE'); await T.esperar(220);
  vl10.value = '500'; vl10.dispatchEvent(new j10.Event('input', { bubbles: true }));
  T.escolherNoCombo(j10, 'cmbForma', 'SAQUE'); await T.esperar(60);
  T.escolherNoCombo(j10, 'cmbSubforma', 'DINHEIRO'); await T.esperar(60);
  j10.document.getElementById('btPreencher').click(); await T.esperar(600);
  ok('a caixa diz qual etapa está na aba',
     j10.document.getElementById('dialogoTexto').textContent.indexOf('Na aba está a etapa APROVADA. Ao gerar, você escolhe quais dos 2 PDFs saem') >= 0,
     j10.document.getElementById('dialogoTexto').textContent);
  ok('a aba ficou com a APROVADA', d10.servidor.abaDoComprovante_().getRange(
     d10.servidor.faixa_('O:S', 'IDENT_1')).getValue() === 'APROVADA');
  ok('o botão da caixa leva à escolha', j10.document.getElementById('dlgPdf').textContent === 'Gerar os PDFs agora…',
     j10.document.getElementById('dlgPdf').textContent);
  j10.document.getElementById('dlgPdf').click(); await T.esperar(60);
  ok('e abre a escolha, agora com 2', titulo10() === 'Quais PDFs gerar?' && caixas10().length === 2);
  marcar10('APROVADA', false);
  var naPasta10b = d10.pasta.length;
  gerar10().click(); T.passarDasBandeiras(j10); await T.esperar(1200);
  var so10 = d10.pasta.slice(naPasta10b).filter(function (a) { return /\.pdf$/.test(a.nome); });
  ok('uma só: a EFETIVADA', so10.length === 1 && /-EFETIVADA - /.test(so10[0].nome),
     so10.map(function (a) { return a.nome; }).join(' | '));
  ok('a caixa oferece a cópia em planilha, que agora não é ambígua',
     !j10.document.getElementById('dialogoExtra').classList.contains('oculto'));
  j10.document.getElementById('dlgVoltar').click(); await T.esperar(60);

  grupo('com uma regra quebrada, a caixa explica e não oferece gerar');
  var j12 = T.abrirTela(d10.servidor.dadosDoFormulario(), d10.servidor).window;
  await T.esperar(300);
  j12.regraQuebrada = true;
  j12.document.getElementById('btGerar').disabled = false;
  j12.abrirEscolhaDeEtapas(); await T.esperar(40);
  ok('a caixa diz que não dá', j12.document.getElementById('dialogoTitulo').textContent === 'Não dá para gerar o PDF agora');
  ok('sem botão de gerar', !j12.document.getElementById('dlgGerarEscolhidas'));

  grupo('pelo menu: a janela abre com a caixa de escolha por cima');
  var html13 = require('./montar_tela.js').montar('.')
    .replace('var ABRIR_NA_ESCOLHA_DO_PDF = false;', 'var ABRIR_NA_ESCOLHA_DO_PDF = true;');
  var j13 = T.abrirTelaDoHtml(html13, d10.servidor.dadosDoFormulario(), d10.servidor).window;
  await T.esperar(320);
  ok('a caixa já está aberta', !j13.document.getElementById('dialogo').classList.contains('oculto'));
  ok('perguntando quais PDFs', j13.document.getElementById('dialogoTitulo').textContent === 'Quais PDFs gerar?',
     j13.document.getElementById('dialogoTitulo').textContent);
  ok('com o formulário no último preenchimento, atrás',
     j13.document.querySelector('#cmbContaDestino .combo-entrada').value.indexOf('100.10') >= 0);

  var j11 = j12;
  grupo('uma tela nova conversando com um servidor velho (só `pdf`, sem `pdfs`)');
  /* Colar a tela e esquecer o 04_Formulario.gs não pode derrubar a janela:
     ela mostra o PDF que o servidor antigo devolve. */
  var velho = { titulo: 'X', piaOrigem: 'A', piaDestino: 'B', cnpjOrigem: '1', cnpjDestino: '2',
    valor: 10, extenso: '(DEZ REAIS)', emLote: false,
    pdf: { nome: 'CMI-VELHO.pdf', pasta: 'P', urlArquivo: 'https://x/1', urlPasta: 'https://x/p', problemas: [] } };
  j11.deuCerto(velho, true); await T.esperar(60);
  ok('a caixa abriu com o PDF do servidor velho',
     j11.document.getElementById('dialogoTitulo').textContent === 'PDF gerado' &&
     j11.document.getElementById('dlgAbrirPdf').textContent === 'Abrir o PDF',
     j11.document.getElementById('dialogoTitulo').textContent);

  grupo('Etapa 6: a janelinha do relatório mensal, clicada');
  /* A janelinha é montada como texto dentro do .gs — a armadilha de sempre:
     um erro ali abre a janela normal e nenhum botão responde, sem mensagem.
     Aqui ela roda de verdade, com o servidor de verdade atrás. */
  var d14 = T.dadosDeVerdade();
  var s14 = d14.servidor;
  var mov14 = { referencia: s14.proximaReferencia_(), referenciaOrigem: 'sistema', data: '2026-08-10',
    etapasEscolhidas: ['APROVADA', 'EFETIVADA'], status: 'APROVADA', etapaAtual: 'APROVADA',
    contaOrigem: 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE',
    contaDestino: 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE', forma: 'SAQUE', subforma: 'DINHEIRO',
    modo: 'unico', valor: 321, lancamentos: [], mesmosAssinantes: true, assinantesPorEtapa: { TODAS: [] } };
  s14.preencherEGerarPdf(mov14);
  var fechou14 = false;
  var dom14 = new JSDOM(s14.telaDoRelatorio_({ ano: 2026, mes: 8 }), { runScripts: 'dangerously',
    beforeParse: function (janela) {
      janela.google = { script: {
        host: { close: function () { fechou14 = true; } },
        run: (function () {
          var api = { _ok: null, _erro: null,
            withSuccessHandler: function (f) { api._ok = f; return api; },
            withFailureHandler: function (f) { api._erro = f; return api; } };
          ['montarRelatorioMensal', 'gerarPdfDoRelatorio'].forEach(function (nome) {
            api[nome] = function (ano, mes) {
              var ok = api._ok, erro = api._erro;
              setTimeout(function () {
                try { ok(JSON.parse(JSON.stringify(s14[nome](ano, mes)))); }
                catch (e) { erro({ message: e.message }); }
              }, 0);
            };
          });
          return api;
        })() } };
    } });
  var j14 = dom14.window, doc14 = j14.document;
  ok('abre no mês que o servidor mandou', doc14.getElementById('mes').value === '8' &&
     doc14.getElementById('ano').value === '2026');
  ok('o PDF só se gera depois de montar', doc14.getElementById('btPdf').disabled);
  doc14.getElementById('btMontar').click();
  await T.esperar(40);
  var res14 = doc14.getElementById('resultado');
  ok('montar mostra o resultado na própria janela', res14.className === 'ok' &&
     /1 comprovante, 1 lançamento\./.test(res14.textContent), res14.className + ' · ' + res14.textContent);
  ok('e libera o PDF', !doc14.getElementById('btPdf').disabled);
  ok('a aba Relatório foi montada de verdade', !!s14.SpreadsheetApp.getActive().getSheetByName('Relatório'));
  doc14.getElementById('btPdf').click();
  await T.esperar(40);
  var links14 = doc14.querySelectorAll('#links a');
  ok('o PDF traz os dois links, de verdade', links14.length === 2 &&
     links14[0].textContent === 'Abrir o PDF' && /^https:/.test(links14[0].href) &&
     links14[0].target === '_blank' && links14[1].textContent === 'Abrir a pasta',
     Array.prototype.map.call(links14, function (a) { return a.textContent + '=' + a.href; }).join(' '));
  ok('e diz o nome do arquivo', /PDF: Relatório CMP - 2026-08 - /.test(res14.textContent), res14.textContent);
  doc14.getElementById('mes').value = '9';
  doc14.getElementById('mes').dispatchEvent(new j14.Event('change'));
  ok('trocar o mês exige montar de novo antes do PDF', doc14.getElementById('btPdf').disabled);
  doc14.getElementById('ano').value = '1999';
  doc14.getElementById('btMontar').click();
  await T.esperar(40);
  ok('um erro do servidor aparece vermelho, na janela', res14.className === 'erro' &&
     /NÃO DEU CERTO/.test(res14.textContent), res14.className + ' · ' + res14.textContent);
  doc14.getElementById('btFechar').click();
  ok('fechar fecha', fechou14);

  grupo('Etapa 7 (c, f): o "Exportar…" do formulário preenche e exporta, sem gastar número');
  var d15 = T.dadosDeVerdade();
  var s15 = d15.servidor;
  s15.chamadas = [];
  var j15 = T.abrirTela(d15.dados, s15).window;
  await T.esperar(300);
  function digitar15(id, texto) {
    var e = j15.document.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j15.Event('input', { bubbles: true }));
    e.dispatchEvent(new j15.Event('blur', { bubbles: true }));
  }
  digitar15('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  digitar15('cmbContaDestino', 'PIA-COXIM: 100.10'); await T.esperar(220);
  var vl15 = j15.document.getElementById('valor');
  vl15.value = '250'; vl15.dispatchEvent(new j15.Event('input', { bubbles: true }));
  var baixados15 = [];
  j15.baixarAgora = function (endereco, nome) { baixados15.push({ endereco: endereco, nome: nome }); };
  var refAntes15 = s15.proximaReferencia_();

  ok('o botão Exportar… está no rodapé', !!j15.document.querySelector('#rodape #btExportar'));
  j15.document.getElementById('btExportar').click(); await T.esperar(60);
  ok('abre a caixa com os três jeitos',
     !!j15.document.getElementById('dlgExportarExcel') && !!j15.document.getElementById('dlgExportarGoogle') &&
     !!j15.document.getElementById('dlgExportarMd'));
  ok('e diz que a Referência NÃO é gasta, com o número',
     j15.document.getElementById('dialogoTexto').textContent.indexOf(refAntes15 + ' NÃO é gasta') >= 0,
     j15.document.getElementById('dialogoTexto').textContent);
  ok('e que sai uma aba por documento (mesma PIA: 2)',
     j15.document.getElementById('dialogoTexto').textContent.indexOf('APROVADA, EFETIVADA') >= 0,
     j15.document.getElementById('dialogoTexto').textContent);

  j15.document.getElementById('dlgExportarMd').click(); await T.esperar(700);
  var ultima15 = s15.chamadas[s15.chamadas.length - 1] || { args: [] };
  ok('o servidor recebeu o formato E a movimentação da tela',
     ultima15.nome === 'exportarDoFormulario' && ultima15.args[0] === 'md' &&
     ultima15.args[1] && ultima15.args[1].valor === 250, JSON.stringify(ultima15).slice(0, 160));
  ok('o .md foi baixado, com o nome da Referência',
     baixados15.length === 1 && baixados15[0].nome === s15.nomeDoArquivoDeRecuperacao_(refAntes15),
     JSON.stringify(baixados15.map(function (b) { return b.nome; })));
  ok('a caixa diz que foi para o computador',
     j15.document.getElementById('dialogoTitulo').textContent === '.md baixado' &&
     j15.document.getElementById('dialogoTexto').textContent.indexOf('computador') >= 0,
     j15.document.getElementById('dialogoTitulo').textContent);
  ok('a Referência continua a mesma (exportar não gasta número)', s15.proximaReferencia_() === refAntes15,
     s15.proximaReferencia_());
  ok('e a aba ficou preenchida com o que estava na tela',
     Number(s15.SpreadsheetApp.getActive().getSheetByName('Comprovante')
       .getRange(s15.faixa_('O:P', 'IDENT_2')).getValue()) === 250);

  j15.document.getElementById('btExportar').click(); await T.esperar(60);
  j15.document.getElementById('dlgExportarExcel').click(); await T.esperar(900);
  ok('o Excel também baixa, com "exportado" no nome e sem a etapa',
     baixados15.length === 2 && /exportado/.test(baixados15[1].nome) &&
     !/APROVADA|EFETIVADA/.test(baixados15[1].nome) && /\.xlsx$/.test(baixados15[1].nome),
     JSON.stringify(baixados15.map(function (b) { return b.nome; })));

  grupo('com uma regra quebrada, o Exportar… trava junto com o Preencher');
  digitar15('cmbContaDestino', 'PIA-COXIM: 101.15'); await T.esperar(260);
  digitar15('cmbContaOrigem', 'PIA-COXIM: 100.10'); await T.esperar(260);
  ok('caixa -> ACG: o Exportar… fica apagado', j15.document.getElementById('btExportar').disabled);
  j15.document.getElementById('dialogo').classList.add('oculto');

  grupo('Etapa 7 (f): "Abrir a pasta dos arquivos", na barra do topo');
  ok('o botão está na barra do topo', !!j15.document.querySelector('#barraDoTopo #btPasta'));
  j15.document.getElementById('btPasta').click(); await T.esperar(120);
  var linkPasta15 = j15.document.getElementById('dlgAbrirPasta');
  ok('abre a caixa com o link da pasta, numa aba nova',
     !!linkPasta15 && linkPasta15.tagName === 'A' && linkPasta15.href === 'https://drive.exemplo/pasta' &&
     linkPasta15.target === '_blank', linkPasta15 ? linkPasta15.outerHTML.slice(0, 120) : '(nada)');
  ok('e explica que o Explorador do Windows não abre daqui',
     j15.document.getElementById('dialogoTexto').textContent.indexOf('Explorador') >= 0);

  grupo('Etapa 7 (c): a janelinha do menu exporta a aba COMO ESTÁ');
  var baixadosMenu = [], fechouMenu = false;
  var domMenu = new JSDOM(s15.telaDaExportacao_(), { runScripts: 'dangerously',
    beforeParse: function (janela) {
      janela.HTMLAnchorElement.prototype.click = function () { if (this.download) baixadosMenu.push(this.download); };
      janela.URL.createObjectURL = function () { return 'blob:teste'; };
      janela.google = { script: {
        host: { close: function () { fechouMenu = true; } },
        run: (function () {
          var api = { _ok: null, _erro: null,
            withSuccessHandler: function (f) { api._ok = f; return api; },
            withFailureHandler: function (f) { api._erro = f; return api; },
            exportarDaAba: function (formato) {
              var ok2 = api._ok, erro2 = api._erro;
              setTimeout(function () {
                try { ok2(JSON.parse(JSON.stringify(s15.exportarDaAba(formato)))); }
                catch (e) { erro2({ message: e.message }); }
              }, 0);
            } };
          return api;
        })() } };
    } });
  var docMenu = domMenu.window.document;
  /* A ABA EDITADA À MÃO: é isso que tem de sair, e não o formulário. */
  var abaMenu = s15.SpreadsheetApp.getActive().getSheetByName('Comprovante');
  abaMenu.getRange(s15.faixa_('G:V', 'OBS')).setValue('EDITADO À MÃO NA ABA');
  docMenu.getElementById('btMd').click(); await T.esperar(60);
  var resMenu = docMenu.getElementById('resultado');
  ok('o .md da aba baixa pela janelinha', baixadosMenu.length === 1 && /\.md$/.test(baixadosMenu[0]) &&
     resMenu.className === 'ok', baixadosMenu.join(' ') + ' · ' + resMenu.textContent);
  var mdMenu = s15.exportarDaAba('md').texto;
  ok('e traz o que foi editado à mão', mdMenu.indexOf('EDITADO À MÃO NA ABA') >= 0);
  ok('e diz que veio da aba, sem PDF e sem gastar a Referência',
     /tirado da aba Comprovante/.test(mdMenu) && /Referência não foi gasta/.test(mdMenu));
  docMenu.getElementById('btGoogle').click(); await T.esperar(60);
  ok('a planilha do Google fica no Drive, com os dois links',
     docMenu.querySelectorAll('#links a').length === 2 && /Nada foi baixado/.test(resMenu.textContent),
     resMenu.textContent);
  docMenu.getElementById('btFechar').click();
  ok('fechar fecha', fechouMenu);

  var domPasta = new JSDOM(s15.telaDaPasta_('Pasta "X" <teste>', 'https://drive.exemplo/p?a=1&b=2'),
    { runScripts: 'dangerously', beforeParse: function (janela) {
      janela.google = { script: { host: { close: function () { fechouMenu = 'pasta'; } } } }; } });
  var aPasta = domPasta.window.document.getElementById('abrir');
  ok('a janelinha da pasta: o link abre numa aba nova, com o endereço intacto',
     aPasta && aPasta.href === 'https://drive.exemplo/p?a=1&b=2' && aPasta.target === '_blank',
     aPasta ? aPasta.outerHTML : '(nada)');
  ok('e um nome de pasta esquisito não quebra a página',
     domPasta.window.document.body.textContent.indexOf('Pasta "X" <teste>') >= 0);
  domPasta.window.document.getElementById('btFechar').click();
  ok('e fechar fecha', fechouMenu === 'pasta');

  grupo('Etapa 7 (m): o botão das exceções, na barra do topo, e o item de menu');
  var d16 = T.dadosDeVerdade();
  var s16 = d16.servidor;
  var mov16 = { referencia: s16.proximaReferencia_(), referenciaOrigem: 'sistema', data: '2026-09-15',
    etapasEscolhidas: ['APROVADA', 'EFETIVADA'], status: 'APROVADA', etapaAtual: 'APROVADA',
    contaOrigem: 'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE',
    contaDestino: 'PIA-COXIM: CARTÃO DE DÉBITO', cartaoDestino: '127698421',
    forma: 'TRANSF. BANCÁRIA', observacao: 'carga de teste', tipoEscrito: 'TRANSF. BANCÁRIA',
    modo: 'unico', valor: 300, lancamentos: [], mesmosAssinantes: true,
    assinantesPorEtapa: { TODAS: [{ nome: 'Adalto Azevedo Pereira', cargo: 'Diácono' }] } };
  s16.preencherEGerarPdf(mov16);
  var md16 = null;
  d16.pasta.forEach(function (a) { if (/\.md$/.test(a.nome)) md16 = a; });
  ok('(a bancada tem o .md do PDF, de verdade)', !!md16 && /```json/.test(md16.conteudo));

  var j16 = T.abrirTela(s16.dadosDoFormulario(), s16).window;
  await T.esperar(320);
  var doc16 = j16.document;
  ok('o botão está na barra do topo', !!doc16.querySelector('#barraDoTopo #btExcecoes'));
  ok('e o link "preciso de outro número" continua lá', !!doc16.getElementById('abrirExcecao'));
  doc16.getElementById('btExcecoes').click(); await T.esperar(60);
  ok('o botão abre o painel roxo', !doc16.getElementById('painelExcecao').classList.contains('oculto'));

  var html16 = require('./montar_tela.js').montar('.')
    .replace('var ABRIR_NAS_EXCECOES = false;', 'var ABRIR_NAS_EXCECOES = true;');
  ok('(a marca do menu existe na tela montada)', html16.indexOf('var ABRIR_NAS_EXCECOES = true;') >= 0);
  var j16m = T.abrirTelaDoHtml(html16, s16.dadosDoFormulario(), s16).window;
  await T.esperar(320);
  ok('pelo menu, a janela já abre com o painel aberto',
     !j16m.document.getElementById('painelExcecao').classList.contains('oculto'));

  grupo('Etapa 7 (a, b): trazer os dados de um comprovante pelo .md');
  /* O painel abriu na SEGUNDA VIA (é a escolha que vem marcada) — e trazer
     o .md tem de funcionar mesmo assim: é o sistema escrevendo nos campos,
     e não uma pessoa mudando uma segunda via. */
  ok('(o painel está na segunda via)', j16.referenciaOrigem === 'segunda-via', j16.referenciaOrigem);
  ok('o botão de trazer mora no painel', !!doc16.querySelector('#painelExcecao #btTrazerMd'));
  j16.lerArquivoMd(new j16.File([md16.conteudo], md16.nome)); await T.esperar(200);
  function entrada16(id) { return doc16.querySelector('#' + id + ' .combo-entrada'); }
  ok('a conta de origem veio', entrada16('cmbContaOrigem').value.indexOf('101.15') >= 0, entrada16('cmbContaOrigem').value);
  ok('a de destino também', entrada16('cmbContaDestino').value.indexOf('CARTÃO DE DÉBITO') >= 0);
  ok('e o CARTÃO, que o último preenchimento esquecia',
     j16.combos.cmbCartaoDestino.valor === '127698421', j16.combos.cmbCartaoDestino.valor);
  ok('o valor', doc16.getElementById('valor').value === '300', doc16.getElementById('valor').value);
  ok('a observação como foi digitada', doc16.getElementById('observacao').value === 'carga de teste',
     doc16.getElementById('observacao').value);
  ok('nenhuma caixa de "segunda via não altera nada" apareceu',
     doc16.getElementById('dialogoTitulo').textContent === 'Dados trazidos do .md',
     doc16.getElementById('dialogoTitulo').textContent);
  ok('a caixa pergunta para que: corrigir, segunda via ou comprovante novo',
     !!doc16.getElementById('dlgImportCorrigir') && !!doc16.getElementById('dlgImportSegundaVia') &&
     !!doc16.getElementById('dlgImportNovo'));
  ok('com o número do comprovante no botão',
     doc16.getElementById('dlgImportCorrigir').textContent.indexOf(mov16.referencia) >= 0);
  doc16.getElementById('dlgImportCorrigir').click(); await T.esperar(60);
  ok('corrigir abre o painel na correção, com o número do .md',
     j16.referenciaOrigem === 'correcao' && doc16.getElementById('referenciaManual').value === mov16.referencia,
     j16.referenciaOrigem + ' ' + doc16.getElementById('referenciaManual').value);
  ok('e a correção vale para QUALQUER comprovante (o texto diz)',
     /qualquer um/.test(doc16.getElementById('dicaExcecao').textContent));

  j16.lerArquivoMd(new j16.File([md16.conteudo], md16.nome)); await T.esperar(200);
  doc16.getElementById('dlgImportSegundaVia').click(); await T.esperar(60);
  ok('segunda via: o mesmo número, com a segunda via marcada',
     j16.referenciaOrigem === 'segunda-via' && doc16.getElementById('referenciaManual').value === mov16.referencia);

  j16.lerArquivoMd(new j16.File([md16.conteudo], md16.nome)); await T.esperar(200);
  doc16.getElementById('dlgImportNovo').click(); await T.esperar(60);
  ok('comprovante novo: volta ao número do sistema, com os dados',
     j16.referenciaOrigem === 'sistema' && entrada16('cmbContaOrigem').value.indexOf('101.15') >= 0);

  grupo('Etapa 7 (a): um .md tirado da aba editada — o que não casa vem em branco, marcado');
  var aba16 = s16.SpreadsheetApp.getActive().getSheetByName('Comprovante');
  aba16.getRange(s16.faixa_('P:V', 'CONTAS')).setValue('PIA-COXIM: CONTA QUE NINGUÉM CADASTROU');
  var mdAba16 = s16.exportarDaAba('md');
  j16.lerArquivoMd(new j16.File([mdAba16.texto], mdAba16.nome)); await T.esperar(200);
  ok('a conta de origem, que casa, veio', entrada16('cmbContaOrigem').value.indexOf('101.15') >= 0);
  ok('a de destino, que não casa, ficou em branco', entrada16('cmbContaDestino').value === '',
     entrada16('cmbContaDestino').value);
  ok('e marcada em vermelho', entrada16('cmbContaDestino').classList.contains('veio-sem-casar'));
  ok('a forma também (o papel não diz qual foi)', entrada16('cmbForma').classList.contains('veio-sem-casar'));
  ok('a caixa lista o que ficou em branco, com o texto do papel',
     /CONTA QUE NINGUÉM CADASTROU/.test(doc16.getElementById('dialogoTexto').textContent),
     doc16.getElementById('dialogoTexto').textContent);
  ok('a frase das contas saiu da observação (o formulário a põe sozinho)',
     doc16.getElementById('observacao').value === 'CARGA DE TESTE', doc16.getElementById('observacao').value);
  doc16.getElementById('dlgImportNovo').click(); await T.esperar(40);
  var e16 = entrada16('cmbContaDestino');
  e16.value = 'PIA-COXIM: CART'; e16.dispatchEvent(new j16.Event('input', { bubbles: true }));
  ok('mexer no campo tira a marca', !e16.classList.contains('veio-sem-casar'));

  grupo('Etapa 7 (a): um arquivo que não é do sistema não mexe em nada');
  var antes16 = entrada16('cmbContaOrigem').value;
  j16.lerArquivoMd(new j16.File(['# um texto qualquer\n\nsem bloco nenhum'], 'qualquer.md')); await T.esperar(150);
  ok('a faixa diz por quê', /NÃO DEU PARA TRAZER qualquer\.md/.test(doc16.getElementById('faixa').textContent),
     doc16.getElementById('faixa').textContent);
  ok('e os campos ficaram como estavam', entrada16('cmbContaOrigem').value === antes16);

  grupo('Etapa 7 (g): as bandeiras amarelas numa caixa, só ao gerar');
  var d17 = T.dadosDeVerdade();
  var s17 = d17.servidor;
  var j17 = T.abrirTela(s17.dadosDoFormulario(), s17).window;
  await T.esperar(320);
  var doc17 = j17.document;
  function digitar17(id, texto) {
    var e = doc17.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j17.Event('input', { bubbles: true }));
    e.dispatchEvent(new j17.Event('blur', { bubbles: true }));
  }
  doc17.getElementById('btLimpar').click(); await T.esperar(60);
  doc17.getElementById('dialogo').classList.add('oculto');
  digitar17('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  digitar17('cmbContaDestino', 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE'); await T.esperar(220);
  T.escolherNoCombo(j17, 'cmbForma', 'SAQUE'); await T.esperar(60);
  T.escolherNoCombo(j17, 'cmbSubforma', 'DINHEIRO'); await T.esperar(60);
  ok('preenchendo, nenhuma caixa abre (valor zerado e sem assinantes)',
     doc17.getElementById('dialogo').classList.contains('oculto'));
  var titulos17 = j17.bandeirasPendentes().map(function (a) { return a[1]; });
  ok('(as duas bandeiras existem)', titulos17.indexOf('Valor zerado') >= 0 &&
     titulos17.indexOf('Menos de 3 assinaturas') >= 0, titulos17.join(' | '));

  function gerar17() {
    doc17.getElementById('btGerar').click();
    doc17.getElementById('dlgGerarEscolhidas').click();
  }
  gerar17(); await T.esperar(40);
  var itens17 = function () { return doc17.querySelectorAll('#dialogoConteudo .bandeira'); };
  ok('ao gerar, a caixa das bandeiras aparece antes do PDF', itens17().length === titulos17.length,
     doc17.getElementById('dialogoTitulo').textContent);
  var ref17 = j17.referenciaEscolhida().replace(/^CMP-?/, '');
  ok('com "Gerar CMP nº X mesmo assim"', doc17.getElementById('dlgBandeiraGerar').textContent ===
     'Gerar CMP nº ' + ref17 + ' mesmo assim', doc17.getElementById('dlgBandeiraGerar').textContent);
  ok('"Voltar e corrigir" e "Ignorar tudo e gerar"',
     !!doc17.getElementById('dlgBandeiraVoltar') && !!doc17.getElementById('dlgBandeiraIgnorarTudo'));
  ok('cada aviso com "Ignorar" e "Corrigir"', Array.prototype.every.call(itens17(), function (i) {
    return i.querySelector('.b-ignorar') && i.querySelector('.b-corrigir'); }));
  var doValor17 = Array.prototype.filter.call(itens17(), function (i) {
    return i.textContent.indexOf('Valor zerado') >= 0; })[0];
  doValor17.querySelector('.b-ignorar').click();
  ok('ignorar risca o aviso e oferece desfazer', doValor17.classList.contains('ignorada') &&
     doValor17.querySelector('.b-ignorar').textContent === 'Ignorado — desfazer');
  ok('o ignorado aparece no rodapé, com o rótulo "será ignorado"',
     !!doc17.getElementById('rodapeIgnorados') &&
     doc17.getElementById('rodapeIgnorados').textContent === 'Será ignorado: Valor zerado',
     doc17.getElementById('avisosDoRodape').textContent);
  doc17.getElementById('dlgBandeiraVoltar').click(); await T.esperar(40);
  var foco17 = doc17.activeElement;
  ok('voltar leva ao primeiro NÃO ignorado — o primeiro assinante vazio',
     foco17 && foco17.classList.contains('combo-entrada') && /^assin-/.test(foco17.parentNode.id || foco17.closest('.combo').id),
     foco17 ? (foco17.closest('.combo') || {}).id : '(nada)');
  ok('com a lista dele aberta', foco17 && foco17.closest('.combo').classList.contains('aberto'),
     foco17 ? foco17.closest('.combo').className : '');
  foco17.blur();

  gerar17(); await T.esperar(40);
  ok('na próxima vez, só o que não foi ignorado', itens17().length === titulos17.length - 1 &&
     doc17.getElementById('dialogoConteudo').textContent.indexOf('Valor zerado') < 0);
  var pdfsAntes17 = d17.pasta.length;
  doc17.getElementById('dlgBandeiraIgnorarTudo').click(); await T.esperar(1200);
  ok('"Ignorar tudo e gerar" gera', d17.pasta.slice(pdfsAntes17).some(function (a) { return /\.pdf$/.test(a.nome); }));
  ok('e os dois vão para o rodapé como ignorados',
     /Valor zerado/.test(doc17.getElementById('avisosDoRodape').textContent) &&
     /Menos de 3 assinaturas/.test(doc17.getElementById('avisosDoRodape').textContent),
     doc17.getElementById('avisosDoRodape').textContent);
  doc17.getElementById('dialogo').classList.add('oculto');

  var pdfsAntes17b = d17.pasta.length;
  gerar17(); await T.esperar(1200);
  ok('com tudo ignorado, gerar vai direto, sem a caixa',
     d17.pasta.slice(pdfsAntes17b).some(function (a) { return /\.pdf$/.test(a.nome); }));
  doc17.getElementById('dialogo').classList.add('oculto');

  var vl17 = doc17.getElementById('valor');
  vl17.value = '100'; vl17.dispatchEvent(new j17.Event('input', { bubbles: true })); await T.esperar(60);
  ok('corrigido o valor, ele sai do rodapé sozinho',
     doc17.getElementById('avisosDoRodape').textContent.indexOf('Valor zerado') < 0,
     doc17.getElementById('avisosDoRodape').textContent);
  var j17b = T.abrirTela(s17.dadosDoFormulario(), s17).window;
  await T.esperar(320);
  ok('abrir a janela de novo esquece o que foi ignorado', !j17b.document.getElementById('rodapeIgnorados') &&
     j17b.bandeirasPendentes().some(function (a) { return a[1] === 'Menos de 3 assinaturas'; }));

  j17.mostrarExcecao(true); await T.esperar(40);
  ok('"Fora da sequência, de propósito" é nota, não bandeira',
     j17.avisosAgora.some(function (a) { return a[1] === 'Fora da sequência, de propósito' && a[0] === 'nota'; }) &&
     !j17.bandeirasAgora().some(function (a) { return a[1] === 'Fora da sequência, de propósito'; }));
  j17.mostrarExcecao(false);

  grupo('Etapa 7 (h): o que impede de gerar fica vermelho no rodapé até resolver');
  digitar17('cmbContaDestino', 'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE'); await T.esperar(220);
  digitar17('cmbContaOrigem', 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE'); await T.esperar(220);
  var bloqueio17 = doc17.getElementById('rodapeBloqueio');
  ok('caixa -> ACG: "Não dá para gerar" no rodapé', !!bloqueio17 &&
     /^Não dá para gerar: Este movimento não é permitido/.test(bloqueio17.textContent),
     bloqueio17 ? bloqueio17.textContent : doc17.getElementById('avisosDoRodape').textContent);
  ok('em vermelho', bloqueio17 && bloqueio17.classList.contains('bloqueio'));
  ok('e ele não é bandeira (não se ignora o que trava)',
     !j17.bandeirasAgora().some(function (a) { return /não é permitido/.test(a[1]); }));
  doc17.getElementById('dialogo').classList.add('oculto');
  bloqueio17.click(); await T.esperar(30);
  ok('clicar nele abre a caixa com a explicação',
     doc17.getElementById('dialogoTitulo').textContent === 'Não dá para gerar' &&
     !doc17.getElementById('dialogo').classList.contains('oculto'));
  doc17.getElementById('dlgOk').click();
  digitar17('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  digitar17('cmbContaDestino', 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE'); await T.esperar(220);
  ok('resolvido, some sozinho', !doc17.getElementById('rodapeBloqueio'),
     doc17.getElementById('avisosDoRodape').textContent);
  doc17.getElementById('btLimpar').click(); await T.esperar(60);
  ok('sem as contas: "Não dá para gerar: Falta escolher conta"',
     !!doc17.getElementById('rodapeBloqueio') &&
     /Falta escolher conta/.test(doc17.getElementById('rodapeBloqueio').textContent));

  grupo('Etapa 7 (h): toda faixa abre uma caixa — o azul também — e a faixa fica');
  doc17.getElementById('dialogo').classList.add('oculto');
  j17.mostrarFaixa('Um recado azul de teste.', 'indo');
  ok('a faixa azul abriu a caixa', !doc17.getElementById('dialogo').classList.contains('oculto') &&
     doc17.getElementById('dialogoTexto').textContent === 'Um recado azul de teste.');
  doc17.getElementById('dlgOk').click();
  ok('fechada a caixa, a faixa continua', doc17.getElementById('faixa').style.display === 'block' &&
     doc17.getElementById('faixa').textContent === 'Um recado azul de teste.');
  j17.abrirDialogo({ travado: true, titulo: 'Trabalhando', texto: 'aguarde', botoes: [] });
  j17.mostrarFaixa('Outro azul.', 'indo');
  ok('mas nunca por cima da caixa travada de quem está trabalhando',
     doc17.getElementById('dialogoTitulo').textContent === 'Trabalhando');
  j17.dialogoTravado = false; j17.fecharDialogo();

  grupo('Etapa 7: o lote — a data vem da linha de cima, e Enter no último valor cria a próxima');
  var d18 = T.dadosDeVerdade();
  var s18 = d18.servidor;
  var j18 = T.abrirTela(s18.dadosDoFormulario(), s18).window;
  await T.esperar(320);
  var doc18 = j18.document;
  function digitar18(id, texto) {
    var e = doc18.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j18.Event('input', { bubbles: true }));
    e.dispatchEvent(new j18.Event('blur', { bubbles: true }));
    return e;
  }
  doc18.getElementById('btLimpar').click(); await T.esperar(60);
  doc18.getElementById('dialogo').classList.add('oculto');
  digitar18('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  digitar18('cmbContaDestino', 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE'); await T.esperar(220);
  doc18.querySelector('input[name="modo"][value="lote"]').click(); await T.esperar(80);
  var l18 = function (i) { return j18.linhasDoLote[i]; };
  ok('a 1ª linha nasce com a data de emissão', l18(0).data.value === doc18.getElementById('data').value);
  l18(0).data.value = '2026-09-10'; l18(0).data.dispatchEvent(new j18.Event('input', { bubbles: true }));
  doc18.getElementById('maisUmaLinha').click(); await T.esperar(40);
  ok('a 2ª nasce com a data da 1ª', l18(1).data.value === '2026-09-10', l18(1).data.value);
  l18(1).data.value = '2026-09-12'; l18(1).data.dispatchEvent(new j18.Event('input', { bubbles: true }));
  l18(1).valor.value = '10';
  l18(0).valor.dispatchEvent(new j18.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await T.esperar(30);
  ok('Enter no valor de uma linha do MEIO não cria nada', j18.linhasDoLote.length === 2);
  l18(1).valor.dispatchEvent(new j18.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await T.esperar(30);
  ok('Enter no valor da ÚLTIMA cria a próxima', j18.linhasDoLote.length === 3, j18.linhasDoLote.length);
  ok('com a data da de cima', l18(2).data.value === '2026-09-12', l18(2).data.value);
  ok('e o cursor no documento dela', doc18.activeElement === l18(2).documento.entrada);
  l18(2).documento.entrada.blur();

  grupo('Etapa 7: data menor que a de cima vira bandeira (só ao gerar), e leva à linha');
  ok('em ordem, nenhuma bandeira de ordem',
     !j18.bandeirasAgora().some(function (a) { return a[1] === 'Datas do lote fora de ordem'; }));
  l18(2).data.value = '2026-09-05'; l18(2).data.dispatchEvent(new j18.Event('input', { bubbles: true }));
  await T.esperar(30);
  var ordem18 = j18.bandeirasAgora().filter(function (a) { return a[1] === 'Datas do lote fora de ordem'; })[0];
  ok('a linha 3 antes da 2 vira bandeira', !!ordem18 && /linha 3 \(05\/09\/2026\).*\(12\/09\/2026\)/.test(ordem18[2]),
     ordem18 ? ordem18[2] : '(nenhuma)');
  ok('e nenhuma caixa abriu enquanto se preenchia', doc18.getElementById('dialogo').classList.contains('oculto'));
  j18.focarCampoDoAviso(ordem18);
  ok('"corrigir" leva à data da linha 3', doc18.activeElement === l18(2).data);

  grupo('Etapa 7: a coluna do documento diz o que cabe nela');
  var rotulo18 = function () { return l18(0).caixa.querySelector('.rotulo-doc').textContent; };
  ok('BB -> caixa: "Documento (NF, NFC-e…)"', rotulo18() === 'Documento (NF, NFC-e…)', rotulo18());
  var lista18 = T.abrirCombo(j18, l18(0).documento.entrada.parentNode.id || l18(0).caixa.querySelector('.combo').id);
  ok('e nenhum cartão na lista', lista18.length === 0, lista18.join(' | '));
  ok('o topo da lista explica por quê',
     /só aparecem quando uma das contas é CARTÃO DE DÉBITO/.test(l18(0).caixa.querySelector('.combo').textContent));
  l18(0).documento.entrada.blur();

  var nf18 = digitar18(l18(0).caixa.querySelector('.combo').id, 'NFC-e 127698421'); await T.esperar(240);
  ok('NFC-e com número dentro passa calada', doc18.getElementById('dialogo').classList.contains('oculto'));
  digitar18(l18(0).caixa.querySelector('.combo').id, '127698421'); await T.esperar(240);
  ok('o número de um cartão do cadastro abre a caixa explicando',
     !doc18.getElementById('dialogo').classList.contains('oculto') &&
     doc18.getElementById('dialogoTitulo').textContent === 'Este cartão não entra aqui',
     doc18.getElementById('dialogoTitulo').textContent);
  ok('e a conferência mostra o vermelho, que trava',
     T.avisosNaTela(j18).some(function (a) { return a.indexOf('Cartão de outra conta') >= 0; }) &&
     doc18.getElementById('btGerar').disabled);
  doc18.getElementById('dlgOk').click();
  digitar18(l18(0).caixa.querySelector('.combo').id, 'NF 45'); await T.esperar(240);
  ok('trocado por uma NF, destrava', !doc18.getElementById('btGerar').disabled);

  digitar18('cmbContaOrigem', 'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE'); await T.esperar(220);
  digitar18('cmbContaDestino', 'PIA-COXIM: CARTÃO DE DÉBITO'); await T.esperar(220);
  ok('ACG PIEDADE -> CARTÃO DE DÉBITO: "Documento / cartão"', rotulo18() === 'Documento / cartão', rotulo18());
  var lista18b = T.abrirCombo(j18, l18(1).caixa.querySelector('.combo').id);
  ok('com os 16 cartões da conta', lista18b.length === 16, lista18b.length);
  l18(1).documento.entrada.blur();

  grupo('Etapa 7: "Suspender as restrições" — até o PDF, com sinal que não deixa dúvida');
  var d19 = T.dadosDeVerdade();
  var s19 = d19.servidor;
  s19.chamadas = [];
  var j19 = T.abrirTela(s19.dadosDoFormulario(), s19).window;
  await T.esperar(320);
  var doc19 = j19.document;
  function digitar19(id, texto) {
    var e = doc19.getElementById(id).querySelector('.combo-entrada');
    e.focus(); e.value = texto;
    e.dispatchEvent(new j19.Event('input', { bubbles: true }));
    e.dispatchEvent(new j19.Event('blur', { bubbles: true }));
  }
  doc19.getElementById('btLimpar').click(); await T.esperar(60);
  digitar19('cmbContaOrigem', 'PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE'); await T.esperar(220);
  digitar19('cmbContaDestino', 'PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE'); await T.esperar(220);
  doc19.getElementById('dialogo').classList.add('oculto');
  ok('(caixa -> ACG está travado)', doc19.getElementById('btGerar').disabled);
  ok('o botão está na barra do topo', !!doc19.querySelector('#barraDoTopo #btSuspender'));
  doc19.getElementById('btSuspender').click(); await T.esperar(30);
  ok('ao clicar, uma caixa explica antes', doc19.getElementById('dialogoTitulo').textContent === 'Suspender as restrições?' &&
     /até o PDF|quando o PDF for gerado/.test(doc19.getElementById('dialogoTexto').textContent) &&
     /MARCADO no Histórico e no \.md/.test(doc19.getElementById('dialogoTexto').textContent));
  doc19.getElementById('dlgSuspender').click(); await T.esperar(60);
  ok('a moldura listrada liga (classe no corpo da página)', doc19.body.classList.contains('restricoes-suspensas'));
  ok('a faixa presa no alto aparece, com "Religar agora"',
     !doc19.getElementById('faixaSuspensas').classList.contains('oculto') && !!doc19.getElementById('btReligar'));
  ok('o rodapé avisa', !!doc19.getElementById('rodapeSuspensas'));
  ok('o que estava travado destrava', !doc19.getElementById('btGerar').disabled);
  ok('todas as formas aparecem', T.abrirCombo(j19, 'cmbForma').length === (j19.dados.formas || []).length ||
     T.abrirCombo(j19, 'cmbForma').length > 3, T.abrirCombo(j19, 'cmbForma').join(' | '));
  doc19.querySelector('#cmbForma .combo-entrada').blur(); await T.esperar(200);
  T.escolherNoCombo(j19, 'cmbForma', 'PIX'); await T.esperar(60);
  ok('e nenhuma regra quebrada com uma forma que não valeria', !j19.regraQuebrada);

  var baixados19 = [];
  j19.baixarAgora = function (u, n) { baixados19.push(n); };
  doc19.getElementById('btExportar').click(); await T.esperar(30);
  doc19.getElementById('dlgExportarMd').click(); await T.esperar(700);
  ok('exportar NÃO religa', doc19.body.classList.contains('restricoes-suspensas'));
  var exp19 = s19.chamadas.filter(function (c) { return c.nome === 'exportarDoFormulario'; }).pop();
  ok('e a exportação leva a marca', exp19 && exp19.args[1].restricoesSuspensas === true);
  doc19.getElementById('dialogo').classList.add('oculto');

  doc19.getElementById('btGerar').click();
  doc19.getElementById('dlgGerarEscolhidas').click(); T.passarDasBandeiras(j19); await T.esperar(1600);
  var ger19 = s19.chamadas.filter(function (c) { return c.nome === 'preencherEGerarPdf'; }).pop();
  ok('o PDF foi pedido com a marca', ger19 && ger19.args[0].restricoesSuspensas === true,
     ger19 ? JSON.stringify(ger19.args[0]).slice(0, 80) : '(não pediu)');
  var hist19 = s19.lerHistorico_() || [];
  ok('e saiu, marcado no Histórico', hist19.length && hist19[hist19.length - 1]['Restrições'] === 'SUSPENSAS no formulário',
     hist19.length ? hist19[hist19.length - 1]['Restrições'] : '(vazio)');
  ok('gerado o PDF, as restrições voltam sozinhas', !doc19.body.classList.contains('restricoes-suspensas') &&
     doc19.getElementById('faixaSuspensas').classList.contains('oculto') && !doc19.getElementById('rodapeSuspensas'));
  ok('e a caixa do resultado diz isso', /Elas já foram religadas/.test(doc19.getElementById('dialogoTexto').textContent),
     doc19.getElementById('dialogoTexto').textContent.slice(-200));
  doc19.getElementById('dialogo').classList.add('oculto');
  ok('o par proibido trava de novo', j19.regraQuebrada === true);

  j19.suspenderRestricoes(true);
  doc19.getElementById('btReligar').click(); await T.esperar(40);
  ok('"Religar agora" religa', !doc19.body.classList.contains('restricoes-suspensas') && j19.regraQuebrada === true);

  var dadosSem19 = s19.dadosDoFormulario(); dadosSem19.restricoesAtivas = false;
  var j19b = T.abrirTela(dadosSem19, s19).window;
  await T.esperar(320);
  ok('com RESTRICOES_ATIVAS = NÃO, o botão nem aparece',
     j19b.document.getElementById('btSuspender').classList.contains('oculto'));

  console.log('\n' + (falhas.length ? falhas.length + ' FALHA(S) de ' + (passou + falhas.length)
                                    : 'Passaram os ' + passou) + ' testes.');
  if (falhas.length) { console.log(''); falhas.forEach(function (f, i) { console.log((i + 1) + ') ' + f); }); process.exitCode = 1; }
})().catch(function (e) {
  console.log('ESTOUROU: ' + e.message);
  console.log((e.stack || '').split('\n').slice(0, 4).join('\n'));
  process.exitCode = 1;
});
