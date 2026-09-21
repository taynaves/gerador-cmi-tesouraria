/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * ETAPA 3: fórmulas, validações e o valor por extenso.
 *
 * O QUE ESTE ARQUIVO FAZ
 * Dá vida à aba "Comprovante", que até aqui era só desenho. Tudo aqui é
 * automático ou é aviso — nada bloqueia o usuário:
 *
 *   - escreve o VALOR POR EXTENSO assim que o valor é digitado;
 *   - soma sozinho as linhas do lote e joga o total no campo Valor Total;
 *   - tira a PIA da CONTA escolhida, e dela o CNPJ e o cabeçalho
 *     (endereço, cidade e CNPJ da ADM de origem);
 *   - avisa quando Origem e Destino são a mesma coisa (regra 11);
 *   - avisa quando o tipo escolhido tem o sentido invertido (regra 7);
 *   - avisa quando a Referência tem acento ou caractere especial (regra 2);
 *   - troca o título conforme a movimentação seja dentro da mesma PIA ou
 *     entre PIAs diferentes;
 *   - põe listas suspensas nas células, como segunda camada de segurança
 *     para quem editar a aba direto (o caminho normal é o formulário).
 *
 * POR QUE AVISO E NÃO BLOQUEIO
 * A tesouraria tem exceção para quase tudo. Bloquear faria o usuário
 * contornar o sistema por fora, que é pior do que o erro. Por isso as
 * validações são do tipo "mostrar aviso", e os alertas aparecem como
 * mensagem passageira no rodapé da tela e como anotação na célula.
 */

// ===========================================================================
// 1. VALOR POR EXTENSO
// ===========================================================================

/**
 * "UM MIL E OITOCENTOS" ou "MIL E OITOCENTOS"?
 *
 * Em texto corrido, a gramática pede "mil reais" — o "um" é dispensável.
 * Em DOCUMENTO DE VALOR, a praxe é a oposta e é ela que vale aqui: cheques,
 * recibos, contratos e notas escrevem "um mil", porque o extenso existe para
 * travar o número, e um extenso que começa por "MIL" deixa espaço em branco
 * antes de si — o lugar clássico onde se acrescenta uma palavra depois de
 * assinado. É a mesma razão por que o extenso vem entre parênteses e em caixa
 * alta. O comprovante do próprio SIGA segue essa praxe ("UM MIL E OITOCENTOS
 * REAIS"), e os dois documentos são arquivados lado a lado — divergir deles
 * pareceria erro na conferência.
 *
 * Por isso o padrão é true. Trocar para false passa tudo a escrever "MIL".
 */
var DIZER_UM_ANTES_DE_MIL = true;

/**
 * A planilha mexe em células sozinha?
 *
 * Quem vai preencher o comprovante é o formulário da Etapa 4, não a aba. A
 * aba só existe para imprimir. Quando o formulário estiver pronto, trocar
 * esta constante para **false** faz a planilha parar de escrever qualquer
 * coisa por conta própria — nenhuma mudança silenciosa, nenhuma surpresa.
 *
 * Por enquanto fica true, para dar para conferir o comportamento digitando
 * direto na aba. As funções continuam existindo nos dois casos: é delas que
 * o formulário vai se servir.
 */
var AUTOMATISMOS_NA_PLANILHA = true;

var UNIDADES = ['', 'UM', 'DOIS', 'TRÊS', 'QUATRO', 'CINCO', 'SEIS', 'SETE', 'OITO', 'NOVE'];
var DEZ_A_DEZENOVE = ['DEZ', 'ONZE', 'DOZE', 'TREZE', 'QUATORZE', 'QUINZE',
                      'DEZESSEIS', 'DEZESSETE', 'DEZOITO', 'DEZENOVE'];
var DEZENAS = ['', '', 'VINTE', 'TRINTA', 'QUARENTA', 'CINQUENTA',
               'SESSENTA', 'SETENTA', 'OITENTA', 'NOVENTA'];
var CENTENAS = ['', 'CENTO', 'DUZENTOS', 'TREZENTOS', 'QUATROCENTOS', 'QUINHENTOS',
                'SEISCENTOS', 'SETECENTOS', 'OITOCENTOS', 'NOVECENTOS'];
var ESCALAS = [['', ''], ['MIL', 'MIL'], ['MILHÃO', 'MILHÕES'],
               ['BILHÃO', 'BILHÕES'], ['TRILHÃO', 'TRILHÕES']];

/** Um grupo de até três dígitos (1 a 999) por extenso. */
function grupoPorExtenso_(n) {
  if (n === 100) return 'CEM';
  var partes = [], centena = Math.floor(n / 100), resto = n % 100;
  if (centena) partes.push(CENTENAS[centena]);
  if (resto) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(DEZ_A_DEZENOVE[resto - 10]);
    else {
      var d = Math.floor(resto / 10), u = resto % 10;
      partes.push(u ? DEZENAS[d] + ' E ' + UNIDADES[u] : DEZENAS[d]);
    }
  }
  return partes.join(' E ');
}

/** Um número inteiro por extenso, de zero a trilhões. */
function inteiroPorExtenso_(inteiro) {
  if (inteiro === 0) return 'ZERO';
  var grupos = [], restante = inteiro;
  while (restante > 0) { grupos.push(restante % 1000); restante = Math.floor(restante / 1000); }

  var partes = [];
  for (var i = grupos.length - 1; i >= 0; i--) {
    var g = grupos[i];
    if (!g) continue;
    if (i === 0) partes.push(grupoPorExtenso_(g));
    else if (i === 1) partes.push(g === 1 ? (DIZER_UM_ANTES_DE_MIL ? 'UM MIL' : 'MIL')
                                          : grupoPorExtenso_(g) + ' MIL');
    else partes.push(grupoPorExtenso_(g) + ' ' + (g === 1 ? ESCALAS[i][0] : ESCALAS[i][1]));
  }
  return partes.join(' E ');
}

/**
 * Valor em reais por extenso, em CAIXA ALTA e entre parênteses:
 *   300      -> (TREZENTOS REAIS)
 *   1800     -> (UM MIL E OITOCENTOS REAIS)
 *   1250,10  -> (UM MIL E DUZENTOS E CINQUENTA REAIS E DEZ CENTAVOS)
 *   1000000  -> (UM MILHÃO DE REAIS)
 *
 * Também funciona como fórmula na planilha: =numeroPorExtenso(A1)
 */
function numeroPorExtenso(valor) {
  // Conta em centavos inteiros desde o começo: 1,005 em ponto flutuante vira
  // 100,49999… e arredondaria para baixo. O 1e-6 corrige isso.
  var totalCentavos = Math.round(Math.abs(Number(valor) || 0) * 100 + 1e-6);
  var inteiro = Math.floor(totalCentavos / 100);
  var centavos = totalCentavos % 100;

  var partes = [];
  if (inteiro > 0 || centavos === 0) {
    // "DE REAIS" só em milhão/bilhão redondo: UM MILHÃO DE REAIS.
    var ligacao = (inteiro >= 1000000 && inteiro % 1000000 === 0) ? ' DE ' : ' ';
    partes.push(inteiroPorExtenso_(inteiro) + ligacao + (inteiro === 1 ? 'REAL' : 'REAIS'));
  }
  if (centavos > 0) {
    partes.push(inteiroPorExtenso_(centavos) + ' ' + (centavos === 1 ? 'CENTAVO' : 'CENTAVOS'));
  }
  return '(' + partes.join(' E ') + ')';
}

/** Bateria de testes do extenso — item de menu, mostra o resultado na tela. */
function testarValorPorExtenso() {
  var casos = [
    [0, '(ZERO REAIS)'], [0.01, '(UM CENTAVO)'], [0.5, '(CINQUENTA CENTAVOS)'],
    [1, '(UM REAL)'], [1.01, '(UM REAL E UM CENTAVO)'], [2, '(DOIS REAIS)'],
    [10, '(DEZ REAIS)'], [11, '(ONZE REAIS)'], [15, '(QUINZE REAIS)'],
    [21, '(VINTE E UM REAIS)'], [100, '(CEM REAIS)'], [101, '(CENTO E UM REAIS)'],
    [199, '(CENTO E NOVENTA E NOVE REAIS)'], [300, '(TREZENTOS REAIS)'],
    [1000, '(UM MIL REAIS)'], [1001, '(UM MIL E UM REAIS)'], [1100, '(UM MIL E CEM REAIS)'],
    [1800, '(UM MIL E OITOCENTOS REAIS)'],
    [1250.1, '(UM MIL E DUZENTOS E CINQUENTA REAIS E DEZ CENTAVOS)'],
    [2000, '(DOIS MIL REAIS)'], [10000, '(DEZ MIL REAIS)'], [100000, '(CEM MIL REAIS)'],
    [1000000, '(UM MILHÃO DE REAIS)'], [2000000, '(DOIS MILHÕES DE REAIS)'],
    [1500000, '(UM MILHÃO E QUINHENTOS MIL REAIS)'],
    [1000000.5, '(UM MILHÃO DE REAIS E CINQUENTA CENTAVOS)'],
    [99.99, '(NOVENTA E NOVE REAIS E NOVENTA E NOVE CENTAVOS)'],
    [1.005, '(UM REAL E UM CENTAVO)'], [0.999, '(UM REAL)']
  ];
  var falhas = [];
  casos.forEach(function (c) {
    var obtido = numeroPorExtenso(c[0]);
    if (obtido !== c[1]) falhas.push(c[0] + '\n   saiu:      ' + obtido + '\n   esperado:  ' + c[1]);
  });

  var ui = SpreadsheetApp.getUi();
  if (falhas.length) {
    ui.alert('Valor por extenso — ' + falhas.length + ' de ' + casos.length + ' com diferença',
      falhas.join('\n\n'), ui.ButtonSet.OK);
  } else {
    ui.alert('Valor por extenso',
      'Os ' + casos.length + ' testes passaram.\n\nExemplos:\n' +
      '300 → ' + numeroPorExtenso(300) + '\n' +
      '1.800 → ' + numeroPorExtenso(1800) + '\n' +
      '1.250,10 → ' + numeroPorExtenso(1250.1) + '\n' +
      '1.000.000 → ' + numeroPorExtenso(1000000), ui.ButtonSet.OK);
  }
}

// ===========================================================================
// 2. LISTAS SUSPENSAS NA ABA COMPROVANTE
// ===========================================================================

/**
 * Põe listas suspensas nas células de Tipo, Origem, Destino, Status e contas,
 * alimentadas pela aba Cadastros. Todas do tipo "mostrar aviso": aceitam um
 * valor fora da lista, só marcam a célula. Rodar de novo é seguro.
 */
function aplicarValidacoes() {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA);
  if (!sh) throw new Error('A aba "' + ABA + '" ainda não existe. Rode "Recriar layout do Comprovante" antes.');

  listaNaCelula_(sh, faixa_('G:V', 'TIPO'), colunaDoCadastro_('TIPOS', 'Tipo de movimentação'));
  listaNaCelula_(sh, faixa_('O:S', 'IDENT_1'), colunaDoCadastro_('STATUS', 'Status'));

  var pias = piasCadastradas_();
  listaNaCelula_(sh, faixa_('D:L', 'ORIGEM_DESTINO'), pias);
  listaNaCelula_(sh, faixa_('O:V', 'ORIGEM_DESTINO'), pias);

  var contas = colunaDoCadastro_('CONTAS', 'Texto que aparece na lista');
  listaNaCelula_(sh, faixa_('E:M', 'CONTAS'), contas);
  listaNaCelula_(sh, faixa_('P:V', 'CONTAS'), contas);

  // Na mesma passada, repõe o aviso nos campos que o sistema calcula.
  protegerCalculados_(sh);

  SpreadsheetApp.getActive().toast(
    'Listas suspensas aplicadas, e os campos calculados protegidos por aviso.',
    'Tesouraria CMI', 6);
}

/** Aplica uma lista suspensa que avisa, mas não rejeita. */
function listaNaCelula_(sh, intervalo, valores) {
  if (!valores.length) return;
  var regra = SpreadsheetApp.newDataValidation()
    .requireValueInList(valores, true)
    .setAllowInvalid(true)
    .setHelpText('Escolha um item da lista. Valor fora da lista é aceito, mas confira antes de gerar.')
    .build();
  sh.getRange(intervalo).setDataValidation(regra);
}

/** Todos os valores de uma coluna de uma lista da aba Cadastros, sem repetir. */
function colunaDoCadastro_(idBloco, nomeDaColuna) {
  var vistos = {}, saida = [];
  lerCadastro_(idBloco).forEach(function (item) {
    var v = String(item[nomeDaColuna] || '').trim();
    if (v && !vistos[v]) { vistos[v] = true; saida.push(v); }
  });
  return saida;
}

/** PIAs cadastradas, escritas como aparecem no documento ("PIA - COXIM"). */
function piasCadastradas_() {
  var vistos = {}, saida = [];
  lerCadastro_('CONTAS').forEach(function (conta) {
    var pia = String(conta.PIA || '').trim().toUpperCase();
    if (!pia || vistos[pia]) return;
    vistos[pia] = true;
    saida.push(pia.replace(/^PIA\s*-?\s*/, 'PIA - '));
  });
  return saida;
}

// ===========================================================================
// 3. REAÇÕES ÀS EDIÇÕES (gatilho automático)
// ===========================================================================

/**
 * Roda sozinho a cada edição na planilha. Só age na aba Comprovante, e
 * nunca deixa um erro atrapalhar quem está digitando — daí o try/catch.
 */
function onEdit(e) {
  try {
    if (!AUTOMATISMOS_NA_PLANILHA) return;
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    if (sh.getName() !== ABA) return;

    var id = idDaLinha_(e.range.getRow());
    var lado = ladoEditado_(e.range.getColumn());

    if (id === 'IDENT_2' || id === 'IDENT_2B') { atualizarExtenso_(sh); }
    if (id === 'IDENT_1') { conferirReferencia_(sh, e.range); }
    if (id === 'TIPO') { avisarSentidoInvertido_(sh); }
    if (id === 'ORIGEM_DESTINO') { reagirAOrigemEDestino_(sh); }
    // A CONTA é que manda: dela sai a PIA, e da PIA saem o CNPJ e o cabeçalho.
    // **Só do lado que foi editado** — mexer na origem não pode mexer no
    // destino, nem o contrário.
    if (id === 'CONTAS') {
      preencherPiaPelaConta_(sh, lado);
      reagirAOrigemEDestino_(sh);
    }
    if (id && id.indexOf('TAB_') === 0) { somarLote_(sh); }
  } catch (erro) {
    // Silêncio proposital: um erro aqui não pode travar a digitação.
  }
}

/**
 * De que lado do comprovante está a célula editada.
 *
 * As células são mescladas, e o Sheets devolve sempre a primeira coluna da
 * mesclagem: origem começa em D (4) ou E (5), destino em O (15) ou P (16).
 * A coluna 14 é o meio de ninguém, então a divisa cai ali.
 */
function ladoEditado_(coluna) {
  return coluna < 14 ? 'origem' : 'destino';
}

/** Tudo o que muda quando a origem ou o destino mudam. */
function reagirAOrigemEDestino_(sh) {
  preencherCnpjPelaPia_(sh);
  atualizarTitulo_(sh);
  atualizarCabecalho_(sh);
  conferirOrigemDestino_(sh);
}

/** Nome da linha da aba Comprovante a partir do número da linha. */
function idDaLinha_(numero) {
  if (!MAPA_LINHAS || !Object.keys(MAPA_LINHAS).length) montarLinhas_();
  for (var id in MAPA_LINHAS) {
    if (MAPA_LINHAS[id] === numero) return id;
  }
  return '';
}

/**
 * Escreve o extenso ao lado do valor — sempre por cima do que estiver lá.
 * Se alguém digitou à mão (o Google avisa antes, mas deixa), a próxima
 * mexida no Valor devolve o texto certo.
 */
function atualizarExtenso_(sh) {
  var valor = sh.getRange(faixa_('O:P', 'IDENT_2')).getValue();
  var celula = sh.getRange(faixaMulti_('R:V', 'IDENT_2', 'IDENT_2B'));
  celula.setValue(valor === '' || valor === null ? '' : numeroPorExtenso(valor));
}

/**
 * Soma as linhas do lote e joga no TOTAL e no campo Valor Total.
 *
 * **Uma leitura só.** Antes eram até 64 idas ao Google: para cada uma das 32
 * linhas, uma pergunta "esta linha está escondida?" e outra "quanto vale?".
 * Agora o bloco inteiro dos valores vem de uma vez (`getValues`) e a soma é
 * feita aqui dentro.
 *
 * Some tudo o que estiver escrito, inclusive em linha escondida — e isso é
 * seguro porque **quem esconde uma linha do lote apaga o que havia nela**:
 * o formulário limpa as 32 linhas antes de escrever. Uma linha escondida com
 * valor dentro era justamente como um total antigo voltava a aparecer.
 */
function somarLote_(sh) {
  var primeira = lin_('TAB_1');
  var valores = sh.getRange('T' + primeira + ':V' + lin_('TAB_' + MAX_LINHAS_LOTE)).getValues();

  var total = 0, linhas = 0;
  valores.forEach(function (linha) {
    var v = Number(linha[0]);
    if (v) { total += v; linhas++; }
  });
  if (!linhas) return;

  sh.getRange(faixa_('T:V', 'TAB_TOTAL')).setValue(total);
  sh.getRange(faixa_('O:P', 'IDENT_2')).setValue(total);
  atualizarExtenso_(sh);
}

/** Preenche o CNPJ de cada lado a partir da PIA escolhida. */
function preencherCnpjPelaPia_(sh) {
  var origem = sh.getRange(faixa_('D:L', 'ORIGEM_DESTINO')).getValue();
  var destino = sh.getRange(faixa_('O:V', 'ORIGEM_DESTINO')).getValue();
  sh.getRange(faixa_('D:L', 'CNPJ')).setValue(cnpjDaPia_(origem));
  sh.getRange(faixa_('O:V', 'CNPJ')).setValue(cnpjDaPia_(destino));
}

/**
 * Escreve a PIA de cada lado a partir da CONTA escolhida.
 *
 * Quem preenche o comprovante escolhe a conta, não a PIA — a PIA é
 * consequência. Antes, trocar a conta não mexia em mais nada, e o comprovante
 * saía com a conta de uma PIA e o CNPJ de outra.
 */
function preencherPiaPelaConta_(sh, qualLado) {
  var lados = {
    origem: { conta: faixa_('E:M', 'CONTAS'), pia: faixa_('D:L', 'ORIGEM_DESTINO') },
    destino: { conta: faixa_('P:V', 'CONTAS'), pia: faixa_('O:V', 'ORIGEM_DESTINO') }
  };
  var alvos = qualLado ? [lados[qualLado]] : [lados.origem, lados.destino];

  alvos.forEach(function (lado) {
    if (!lado) return;
    var celulaConta = sh.getRange(lado.conta);
    var conta = celulaConta.getValue();
    if (!conta) { celulaConta.clearNote(); return; }

    var nome = piaDaConta_(conta);
    if (!nome) {
      // Antes daqui saía lixo: "101.17 - ACG - AG" ia parar no campo da PIA,
      // e a partir daí nenhuma ADM era encontrada e o cabeçalho congelava.
      avisar_(celulaConta, 'CONTA FORA DA LISTA',
        'Esta conta não está na lista CONTAS dos Cadastros, então a PIA, o CNPJ e o ' +
        'cabeçalho não foram preenchidos. Escolha uma conta da lista, ou cadastre esta.');
      return;
    }
    celulaConta.clearNote();
    sh.getRange(lado.pia).setValue(piaEscrita_(nome));
  });
}

/**
 * A PIA de uma conta. Procura o texto exato na lista CONTAS dos Cadastros —
 * é a fonte da verdade. Só se não achar, deduz pelo que vem antes do
 * dois-pontos ("PIA-COXIM: 101.10 - ..." -> "PIA-COXIM").
 */
function piaDaConta_(textoDaConta) {
  var alvo = String(textoDaConta || '').trim().toUpperCase();
  if (!alvo) return '';
  var achado = '';
  lerCadastro_('CONTAS').forEach(function (conta) {
    var texto = String(conta['Texto que aparece na lista'] || '').trim().toUpperCase();
    if (!achado && texto && texto === alvo) achado = String(conta.PIA || '').trim();
  });
  if (achado) return achado;

  // Palpite pelo texto, e só se o resultado for mesmo uma PIA. Sem esta
  // trava, "101.17 - ACG - AG:01 CC:..." virava a "PIA" "101.17 - ACG - AG".
  var palpite = alvo.indexOf(':') >= 0 ? alvo.split(':')[0].trim() : '';
  return /^PIA\b/.test(palpite) ? palpite : '';
}

/** A PIA como o documento escreve: "PIA-COXIM" vira "PIA - COXIM". */
function piaEscrita_(nome) {
  return String(nome || '').trim().toUpperCase().replace(/^PIA\s*-?\s*/, 'PIA - ');
}

/** O registro da ADM a que a PIA pertence (bloco ADMs da aba Cadastros). */
function admDaPia_(textoDaPia) {
  var alvo = pia_(textoDaPia);
  if (!alvo) return null;
  var achado = null;
  lerCadastro_('ADMS').forEach(function (adm) {
    if (!achado && pia_(adm.PIA) === alvo) achado = adm;
  });
  return achado;
}

/** CNPJ da ADM a que a PIA pertence. */
function cnpjDaPia_(textoDaPia) {
  var adm = admDaPia_(textoDaPia);
  return adm ? String(adm.CNPJ || '').trim() : '';
}

/**
 * Cabeçalho institucional — endereço, cidade e CNPJ da ADM.
 *
 * Regra do projeto (regras de negócio, seção 5): é a ADM de quem PRODUZ o
 * documento que aparece no cabeçalho. **É a ORIGEM que dita o cabeçalho** —
 * ela é quem aprova e quem paga. Mudar o DESTINO nunca muda o cabeçalho.
 *
 * A única exceção é o PDF de RECEBIMENTO, na Etapa 5, que é produzido pela
 * outra ADM: ele vai chamar esta mesma função com 'destino'.
 */
function atualizarCabecalho_(sh, lado) {
  var celulaPia = (lado === 'destino') ? faixa_('O:V', 'ORIGEM_DESTINO')
                                       : faixa_('D:L', 'ORIGEM_DESTINO');
  var adm = admDaPia_(sh.getRange(celulaPia).getValue());
  if (!adm) return;

  var maiuscula = function (v) { return String(v || '').trim().toUpperCase(); };
  var ie = maiuscula(adm['Inscrição estadual']);

  sh.getRange(faixa_('B:I', 'CAB_2')).setValue(maiuscula(adm['Endereço']));
  sh.getRange(faixa_('J:Q', 'CAB_2')).setValue(maiuscula(adm['Cidade / UF']));
  sh.getRange(faixa_('R:V', 'CAB_2')).setValue(
    'CNPJ ' + maiuscula(adm.CNPJ) + (ie ? ' - IE ' + ie : ''));
}

/** Troca o título conforme origem e destino estejam na mesma PIA ou não. */
function atualizarTitulo_(sh) {
  var origem = sh.getRange(faixa_('D:L', 'ORIGEM_DESTINO')).getValue();
  var destino = sh.getRange(faixa_('O:V', 'ORIGEM_DESTINO')).getValue();
  if (!origem || !destino) return;
  sh.getRange(faixa_('B:V', 'TITULO')).setValue(tituloDoComprovante_(origem, destino));
}

/** Regra 11: origem e destino não podem ser a mesma coisa. */
function conferirOrigemDestino_(sh) {
  var origem = sh.getRange(faixa_('D:L', 'ORIGEM_DESTINO'));
  var destino = sh.getRange(faixa_('O:V', 'ORIGEM_DESTINO'));
  var contaOrigem = sh.getRange(faixa_('E:M', 'CONTAS')).getValue();
  var contaDestino = sh.getRange(faixa_('P:V', 'CONTAS')).getValue();

  var mesmaPia = pia_(origem.getValue()) && pia_(origem.getValue()) === pia_(destino.getValue());
  var mesmaConta = String(contaOrigem).trim() !== '' &&
                   String(contaOrigem).trim() === String(contaDestino).trim();

  if (mesmaPia && (mesmaConta || (!contaOrigem && !contaDestino))) {
    avisar_(destino, 'ORIGEM E DESTINO IGUAIS',
      'A conta de origem não pode ser a mesma do destino. Confira antes de gerar o comprovante.');
  } else {
    destino.clearNote();
  }
}

/** Regra 7: dois tipos invertem o sentido de crédito e débito. */
function avisarSentidoInvertido_(sh) {
  var celula = sh.getRange(faixa_('G:V', 'TIPO'));
  var tipo = String(celula.getValue() || '').toUpperCase();
  if (!tipo) { celula.clearNote(); return; }

  var invertido = false;
  lerCadastro_('TIPOS').forEach(function (t) {
    var nome = String(t['Tipo de movimentação'] || '').toUpperCase();
    var sentido = String(t['Sentido crédito/débito'] || '').toUpperCase();
    if (nome && tipo.indexOf(nome) >= 0 && sentido.indexOf('INVERTIDO') >= 0) invertido = true;
  });

  if (invertido) {
    avisar_(celula, 'ATENÇÃO: SENTIDO INVERTIDO',
      'Neste tipo, a ORIGEM recebe crédito e o DESTINO é debitado — o contrário do normal. ' +
      'Confira se origem e destino não estão trocados.');
  } else {
    celula.clearNote();
  }
}

/** Regra 2: avisar (nunca bloquear) sobre caracteres estranhos na Referência. */
function conferirReferencia_(sh, editada) {
  var celula = sh.getRange(faixa_('G:H', 'IDENT_1'));
  if (editada.getRow() !== celula.getRow()) return;

  var texto = String(celula.getValue() || '');
  if (!texto) { celula.clearNote(); return; }

  if (/[^A-Za-z0-9\-\/]/.test(texto)) {
    avisar_(celula, 'REFERÊNCIA COM CARACTERE ESPECIAL',
      'A referência tem acento, pontuação ou símbolo. O SIGA aceita, mas o padrão é só ' +
      'letras e números (exemplo: CMP-26/001). Confira se é isso mesmo.');
  } else {
    celula.clearNote();
  }
}

/** Mostra o aviso no rodapé da tela e deixa anotado na própria célula. */
function avisar_(celula, titulo, mensagem) {
  celula.setNote(titulo + '\n\n' + mensagem);
  SpreadsheetApp.getActive().toast(mensagem, titulo, 8);
}

// ===========================================================================
// 4. REFERÊNCIA DO PRÓXIMO COMPROVANTE
// ===========================================================================

/**
 * Escreve a próxima Referência livre no comprovante, sem consumir o número —
 * quem consome é a geração do PDF, na Etapa 5.
 */
function sugerirProximaReferencia() {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA);
  if (!sh) throw new Error('A aba "' + ABA + '" ainda não existe.');
  var proxima = proximaReferencia_();
  sh.getRange(faixa_('G:H', 'IDENT_1')).setValue(proxima);
  SpreadsheetApp.getActive().toast('Referência sugerida: ' + proxima, 'Tesouraria CMI', 5);
}

/** Recalcula tudo de uma vez — útil depois de mexer nos Cadastros. */
function recalcularComprovante() {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA);
  if (!sh) throw new Error('A aba "' + ABA + '" ainda não existe.');
  somarLote_(sh);
  atualizarExtenso_(sh);
  preencherPiaPelaConta_(sh);
  preencherCnpjPelaPia_(sh);
  atualizarTitulo_(sh);
  atualizarCabecalho_(sh);
  conferirOrigemDestino_(sh);
  avisarSentidoInvertido_(sh);
  SpreadsheetApp.getActive().toast('Comprovante recalculado.', 'Tesouraria CMI', 5);
}
