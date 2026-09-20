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
 *   - preenche o CNPJ a partir da PIA escolhida em Origem e Destino;
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
  listaNaCelula_(sh, faixa_('O:P', 'IDENT_1'), colunaDoCadastro_('STATUS', 'Status'));

  var pias = piasCadastradas_();
  listaNaCelula_(sh, faixa_('D:L', 'ORIGEM_DESTINO'), pias);
  listaNaCelula_(sh, faixa_('O:V', 'ORIGEM_DESTINO'), pias);

  var contas = colunaDoCadastro_('CONTAS', 'Texto que aparece na lista');
  listaNaCelula_(sh, faixa_('E:L', 'CONTAS'), contas);
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
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    if (sh.getName() !== ABA) return;

    var linhaEditada = e.range.getRow();
    var id = idDaLinha_(linhaEditada);

    if (id === 'IDENT_2' || id === 'IDENT_2B') { atualizarExtenso_(sh); }
    if (id === 'IDENT_1') { conferirReferencia_(sh, e.range); }
    if (id === 'TIPO') { avisarSentidoInvertido_(sh); }
    if (id === 'ORIGEM_DESTINO') {
      preencherCnpjPelaPia_(sh);
      atualizarTitulo_(sh);
      conferirOrigemDestino_(sh);
    }
    // Trocar a conta pode tornar origem e destino a mesma coisa.
    if (id === 'CONTAS') { conferirOrigemDestino_(sh); }
    if (id && id.indexOf('TAB_') === 0) { somarLote_(sh); }
  } catch (erro) {
    // Silêncio proposital: um erro aqui não pode travar a digitação.
  }
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

/** Soma as linhas do lote e joga no TOTAL e no campo Valor Total. */
function somarLote_(sh) {
  var total = 0, linhas = 0;
  for (var i = 1; i <= MAX_LINHAS_LOTE; i++) {
    var linha = lin_('TAB_' + i);
    if (sh.isRowHiddenByUser(linha)) continue;
    var v = Number(sh.getRange(faixa_('T:V', 'TAB_' + i)).getValue());
    if (v) { total += v; linhas++; }
  }
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

/** CNPJ da ADM a que a PIA pertence (bloco ADMs da aba Cadastros). */
function cnpjDaPia_(textoDaPia) {
  var alvo = pia_(textoDaPia);
  if (!alvo) return '';
  var achado = '';
  lerCadastro_('ADMS').forEach(function (adm) {
    if (!achado && pia_(adm.PIA) === alvo) achado = String(adm.CNPJ || '').trim();
  });
  return achado;
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
  var contaOrigem = sh.getRange(faixa_('E:L', 'CONTAS')).getValue();
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
  preencherCnpjPelaPia_(sh);
  atualizarTitulo_(sh);
  conferirOrigemDestino_(sh);
  avisarSentidoInvertido_(sh);
  SpreadsheetApp.getActive().toast('Comprovante recalculado.', 'Tesouraria CMI', 5);
}
