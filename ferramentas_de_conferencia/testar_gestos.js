/* Os GESTOS do formulário: o que acontece quando alguém digita, sai do campo,
   clica num item ou num botão. Roda a tela de verdade num navegador de mentira
   (jsdom) com os dados de verdade vindos dos .gs.

   Instalar uma vez:  npm install jsdom --no-save
   Rodar:             node ferramentas_de_conferencia/testar_gestos.js .        */
var T = require('./testar_tela_viva.js');

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

  grupo('a cascata dos subtipos segue as contas escolhidas');
  ok('mesma PIA: 6 subtipos', T.abrirCombo(j, 'cmbTipo').length === 6,
     'saiu ' + T.abrirCombo(j, 'cmbTipo').length);
  ok('e o subtipo só de outra ADM fica de fora',
     !T.abrirCombo(j, 'cmbTipo').some(function (t) { return t.indexOf('Remessa para outra ADM') >= 0; }));
  ok('e o de dentro da mesma PIA está lá',
     T.abrirCombo(j, 'cmbTipo').some(function (t) { return t.indexOf('Aplicacao financeira') >= 0; }));

  grupo('texto que não casa com nada: fica à vista, marcado, e vira aviso');
  var ruim = digitarESair('cmbContaOrigem', 'conta que nao existe'); await T.esperar(220);
  ok('o texto continua na tela', ruim.value === 'conta que nao existe');
  ok('o campo fica marcado', ruim.classList.contains('sem-escolha'));
  ok('e a conferência avisa',
     T.avisosNaTela(j).some(function (a) { return a.indexOf('Falta escolher conta') >= 0; }));

  grupo('um lado nunca mexe no outro');
  digitarESair('cmbContaOrigem', 'PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE'); await T.esperar(220);
  T.escolherNoCombo(j, 'cmbTipo', 'Aplicacao financeira'); await T.esperar(60);
  var destinoAntes = textoDoCombo('cmbContaDestino');
  ok('o destino não se mexeu ao trocar a origem', destinoAntes.indexOf('100.10') >= 0);

  grupo('trocar para outra PIA funciona mesmo com a PIA já mostrada no campo');
  digitarESair('cmbContaDestino', 'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE');
  await T.esperar(220);
  ok('trocou o destino para outra PIA', textoDoCombo('cmbContaDestino').indexOf('101.17') >= 0);
  ok('a origem ficou intacta', textoDoCombo('cmbContaOrigem').indexOf('101.10 - BB') >= 0);
  ok('as etapas viraram 3', campo('etapaAtual').options.length === 3);
  /* A CONTAGEM SOZINHA NÃO PROVA NADA AQUI: as duas listas já tiveram o mesmo
     tamanho, e um teste que só conta continuaria verde mesmo se a cascata
     parasse de trocar de lista. Por isso conta E olha o conteúdo. */
  ok('outro departamento da MESMA ADM: 4 subtipos',
     T.abrirCombo(j, 'cmbTipo').length === 4, 'saiu ' + T.abrirCombo(j, 'cmbTipo').length);
  ok('o de dentro da mesma PIA saiu',
     !T.abrirCombo(j, 'cmbTipo').some(function (t) { return t.indexOf('Aplicacao financeira') >= 0; }));
  /* E A REMESSA NÃO ENTRA: PIA-COXIM e PIA-SÃO GABRIEL são departamentos da
     MESMA administração, e remessa é entre administrações. Era isto que a
     coluna não sabia dizer enquanto só tinha "Sim". */
  ok('e a Remessa para outra ADM também não, porque a ADM é a mesma',
     !T.abrirCombo(j, 'cmbTipo').some(function (t) { return t.indexOf('Remessa para outra ADM') >= 0; }),
     T.abrirCombo(j, 'cmbTipo').join(' | '));

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

  grupo('trocar para outra ADM traz a Remessa de volta');
  digitarESair('cmbContaDestino', 'PIA-COSTA: 100.10 - CAIXA OBRA DA PIEDADE');
  await T.esperar(220);
  ok('o destino trocou para a outra ADM', textoDoCombo('cmbContaDestino').indexOf('PIA-COSTA') >= 0,
     textoDoCombo('cmbContaDestino'));
  ok('agora a Remessa está na lista',
     T.abrirCombo(j, 'cmbTipo').some(function (t) { return t.indexOf('Remessa para outra ADM') >= 0; }),
     T.abrirCombo(j, 'cmbTipo').join(' | '));

  // Volta ao destino de antes, que os testes seguintes esperam.
  digitarESair('cmbContaDestino', 'PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE');
  await T.esperar(220);

  grupo('o subtipo que deixou de combinar NÃO é apagado — vira aviso');
  ok('o subtipo continua escolhido', textoDoCombo('cmbTipo').indexOf('Aplicacao') >= 0,
     textoDoCombo('cmbTipo'));
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
  T.escolherNoCombo(j3, 'cmbTipo', 'Outro (especificar na Observacao)'); await T.esperar(60);
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
  ok('o tipo voltou', texto4('cmbTipo').indexOf('Outro') >= 0, texto4('cmbTipo'));
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

  digitar5('cmbContaDestino', 'PIA-COSTA: 201.9'); await T.esperar(220);
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
  var oCartao = contaComoTexto(/PIA-COXIM: 204\.9/);
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

  console.log('\n' + (falhas.length ? falhas.length + ' FALHA(S) de ' + (passou + falhas.length)
                                    : 'Passaram os ' + passou) + ' testes.');
  if (falhas.length) { console.log(''); falhas.forEach(function (f, i) { console.log((i + 1) + ') ' + f); }); process.exitCode = 1; }
})().catch(function (e) {
  console.log('ESTOUROU: ' + e.message);
  console.log((e.stack || '').split('\n').slice(0, 4).join('\n'));
  process.exitCode = 1;
});
