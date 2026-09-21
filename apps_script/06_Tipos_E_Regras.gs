/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * A ÁRVORE DE TIPOS E AS REGRAS ENTRE CONTAS.
 *
 * O PROBLEMA QUE ISTO RESOLVE
 * A lista de tipos era uma lista plana de 14 linhas que misturava três
 * perguntas diferentes: **onde** a movimentação acontece, **para quê** ela
 * serve, e **como** o dinheiro anda. Escolher entre 14 coisas de níveis
 * diferentes é lento e é fácil de errar.
 *
 * A ÁRVORE, EM TRÊS NÍVEIS
 *
 *   1. TIPO      — Movimentação interna  |  Transferência de numerários
 *   2. SUBTIPO   — (só na transferência)  entre departamentos | entre administrações
 *   3. FORMA     — DINHEIRO · CHEQUE · TRANSF. BANCÁRIA · TED · DOC · SAQUE · PIX
 *
 * **Os dois primeiros níveis não se escolhem: eles se deduzem das contas.**
 *   - mesma PIA nos dois lados            -> MOVIMENTAÇÃO INTERNA
 *   - PIAs diferentes, mesma ADM          -> TRANSFERÊNCIA, entre departamentos
 *   - ADMs diferentes                     -> TRANSFERÊNCIA, entre administrações
 *
 * É a mesma comparação que já decide se a movimentação gera 2 ou 3 documentos
 * e qual título o comprovante leva. Deixá-la também decidir o tipo é o que
 * impede o comprovante de dizer uma coisa no título e outra no campo Tipo.
 *
 * Sobra a FORMA — e mesmo ela costuma sobrar só uma ou duas, depois das
 * regras entre contas.
 *
 * AS REGRAS ENTRE CONTAS
 * Vivem na aba Cadastros, no bloco REGRAS ENTRE CONTAS, e falam de
 * **naturezas** (CAIXA, BANCO, ACG, CARTAO), não de contas específicas: "a
 * ACG nunca recebe espécie" é uma regra sobre a natureza.
 *
 * Duas coisas importam no desenho:
 *   - **um par sem regra é livre.** As linhas são restrições, não permissões;
 *     o cadastro nasce só com o que foi realmente determinado;
 *   - a chave `RESTRICOES_ATIVAS`, no bloco CONTROLE, desliga todas de uma
 *     vez. É o caminho do ajuste financeiro ou contábil, que é justamente
 *     quando a exceção acontece.
 */

// ===========================================================================
// 1. O TIPO E O SUBTIPO, DEDUZIDOS DAS CONTAS
// ===========================================================================

var TIPOS_DE_MOVIMENTACAO = {
  interna: 'MOVIMENTAÇÃO INTERNA DE NUMERÁRIOS',
  transferencia: 'TRANSFERÊNCIA DE NUMERÁRIOS'
};

var SUBTIPOS_DE_TRANSFERENCIA = {
  entreDepartamentos: 'entre departamentos',
  entreAdministracoes: 'entre administrações'
};

/**
 * Onde esta movimentação acontece, a partir das duas contas.
 *
 * Devolve `{ tipo, subtipo, mesmaPia, mesmaAdm, descricao }`. Enquanto faltar
 * uma das contas, devolve tudo vazio — deduzir com meio dado é adivinhar.
 */
function classificarMovimentacao_(contaOrigem, contaDestino) {
  var vazio = { tipo: '', subtipo: '', mesmaPia: false, mesmaAdm: false, descricao: '' };
  if (!contaOrigem || !contaDestino) return vazio;

  var piaOrigem = pia_(piaDaConta_(contaOrigem));
  var piaDestino = pia_(piaDaConta_(contaDestino));
  if (!piaOrigem || !piaDestino) return vazio;

  var admOrigem = admDeUmaConta_(contaOrigem);
  var admDestino = admDeUmaConta_(contaDestino);
  var mesmaPia = piaOrigem === piaDestino;
  var mesmaAdm = !!admOrigem && admOrigem === admDestino;

  if (mesmaPia) {
    return {
      tipo: TIPOS_DE_MOVIMENTACAO.interna,
      subtipo: '',
      mesmaPia: true,
      mesmaAdm: mesmaAdm,
      descricao: TIPOS_DE_MOVIMENTACAO.interna
    };
  }

  var subtipo = mesmaAdm ? SUBTIPOS_DE_TRANSFERENCIA.entreDepartamentos
                         : SUBTIPOS_DE_TRANSFERENCIA.entreAdministracoes;
  return {
    tipo: TIPOS_DE_MOVIMENTACAO.transferencia,
    subtipo: subtipo,
    mesmaPia: false,
    mesmaAdm: mesmaAdm,
    descricao: TIPOS_DE_MOVIMENTACAO.transferencia + ' — ' + subtipo
  };
}

/** A ADM a que uma conta pertence, pelo cadastro de CONTAS. */
function admDeUmaConta_(textoDaConta) {
  var conta = contaCadastrada_(textoDaConta);
  return conta ? String(conta.ADM || '').trim() : '';
}

/** A natureza de uma conta: CAIXA, BANCO, ACG ou CARTAO. */
function naturezaDaConta_(textoDaConta) {
  var conta = contaCadastrada_(textoDaConta);
  return conta ? String(conta.Natureza || '').trim().toUpperCase() : '';
}

/** O registro de uma conta no cadastro, pelo texto que aparece na lista. */
function contaCadastrada_(textoDaConta) {
  var alvo = String(textoDaConta || '').trim().toUpperCase();
  if (!alvo) return null;
  var achado = null;
  lerCadastro_('CONTAS').forEach(function (c) {
    if (achado) return;
    if (String(c['Texto que aparece na lista'] || '').trim().toUpperCase() === alvo) achado = c;
  });
  return achado;
}

// ===========================================================================
// 2. AS FORMAS QUE VALEM ENTRE DUAS CONTAS
// ===========================================================================

/** As restrições estão ligadas? (chave RESTRICOES_ATIVAS, no CONTROLE) */
function restricoesAtivas_() {
  var valor = String(lerControle_('RESTRICOES_ATIVAS') || 'SIM').trim().toUpperCase();
  return valor !== 'NAO' && valor !== 'NÃO' && valor !== 'FALSE' && valor !== '';
}

/** Todas as formas cadastradas, na ordem do cadastro. */
function todasAsFormas_() {
  return lerCadastro_('FORMAS').map(function (f) {
    return {
      nome: String(f.Forma || '').trim(),
      emEspecie: /^S/i.test(String(f['Em espécie?'] || '')),
      observacao: String(f['Observação'] || '').trim()
    };
  }).filter(function (f) { return f.nome; });
}

/** Separa "PIX, TED" numa lista, em caixa alta. */
function listaDeFormas_(texto) {
  return String(texto || '').split(/[;,]/)
    .map(function (t) { return t.trim().toUpperCase(); })
    .filter(function (t) { return t; });
}

/**
 * As formas que valem entre duas contas, e o porquê de cada corte.
 *
 * Devolve `{ formas, permitidas, proibidas, motivos, restricoesAtivas }`.
 * `formas` é o que deve aparecer na lista; `motivos` explica, em português, o
 * que foi cortado e por qual regra — é o que a tela mostra quando a pessoa
 * escolheu uma forma que deixou de valer.
 *
 * Com as restrições desligadas, `formas` é a lista inteira e os motivos vêm
 * vazios: nada é escondido, nada é travado.
 */
function formasEntreContas_(contaOrigem, contaDestino) {
  var naturezaOrigem = naturezaDaConta_(contaOrigem);
  var naturezaDestino = naturezaDaConta_(contaDestino);
  var resposta = formasEntreNaturezas_(naturezaOrigem, naturezaDestino);
  resposta.naturezaOrigem = naturezaOrigem;
  resposta.naturezaDestino = naturezaDestino;
  return resposta;
}

/**
 * O mesmo, já a partir das naturezas — é por aqui que a bateria compara este
 * arquivo com a cópia que vive dentro da tela.
 *
 * A tela precisa da mesma regra do lado dela para responder na hora da tecla
 * (ver a seção 3b de `04_Formulario_Tela.html`). Duas cópias só se sustentam
 * se houver como provar que dizem a mesma coisa; esta função é a porta de
 * entrada idêntica à de lá, e `testar_gestos.js` percorre todos os pares de
 * natureza por ela.
 */
function formasEntreNaturezas_(naturezaOrigem, naturezaDestino) {
  var todas = todasAsFormas_();
  var resposta = {
    formas: todas,
    motivos: [],
    restricoesAtivas: restricoesAtivas_()
  };
  if (!resposta.restricoesAtivas) return resposta;
  if (!naturezaOrigem || !naturezaDestino) return resposta;

  var permitidas = null;     // null = ninguém restringiu ainda
  var proibidas = {};

  lerCadastro_('RELACOES').forEach(function (regra) {
    if (!/^S/i.test(String(regra.Ativa || 'Sim'))) return;
    if (!casaNatureza_(regra['Natureza de origem'], naturezaOrigem)) return;
    if (!casaNatureza_(regra['Natureza de destino'], naturezaDestino)) return;

    var deixa = listaDeFormas_(regra['Formas permitidas']);
    var nega = listaDeFormas_(regra['Formas proibidas']);
    var porque = String(regra['Por quê'] || '').trim();

    if (deixa.length) {
      // Duas listas fechadas se cruzam: o que vale é o que está nas duas.
      permitidas = (permitidas === null) ? deixa : permitidas.filter(function (f) {
        return deixa.indexOf(f) >= 0;
      });
      resposta.motivos.push(porque || ('Entre ' + naturezaOrigem + ' e ' +
        naturezaDestino + ', só ' + deixa.join(', ') + '.'));
    }
    if (nega.length) {
      nega.forEach(function (f) { proibidas[f] = porque || 'regra do cadastro'; });
      resposta.motivos.push(porque || (nega.join(', ') + ' não vale entre ' +
        naturezaOrigem + ' e ' + naturezaDestino + '.'));
    }
  });

  resposta.formas = todas.filter(function (f) {
    var nome = f.nome.toUpperCase();
    if (proibidas[nome]) return false;
    if (permitidas !== null && permitidas.indexOf(nome) < 0) return false;
    return true;
  });
  return resposta;
}

/** `*` vale para qualquer natureza; o resto compara em caixa alta. */
function casaNatureza_(daRegra, daConta) {
  var alvo = String(daRegra || '').trim().toUpperCase();
  if (!alvo || alvo === '*' || alvo === 'QUALQUER') return true;
  return alvo === String(daConta || '').trim().toUpperCase();
}

// ===========================================================================
// 3. O QUE VAI ESCRITO NO CAMPO "TIPO TRANSFERÊNCIA" DO COMPROVANTE
// ===========================================================================

/**
 * Compõe o texto do campo Tipo a partir dos três níveis.
 *
 *   MOVIMENTAÇÃO INTERNA DE NUMERÁRIOS · DINHEIRO
 *   TRANSFERÊNCIA DE NUMERÁRIOS — ENTRE DEPARTAMENTOS · PIX
 *
 * A finalidade, quando escolhida, entra depois da forma:
 *   TRANSFERÊNCIA DE NUMERÁRIOS — ENTRE DEPARTAMENTOS · PIX · CARREGAMENTO DE CARTAO
 *
 * Partes que faltam simplesmente não aparecem — o documento nunca sai com um
 * separador solto nem com a palavra "undefined".
 */
function textoDoTipo_(classificacao, forma, finalidade) {
  var partes = [];
  if (classificacao && classificacao.descricao) partes.push(classificacao.descricao);
  if (forma) partes.push(String(forma).trim());
  if (finalidade) partes.push(String(finalidade).trim());
  return partes.join(' · ').toUpperCase();
}

// ===========================================================================
// 4. A TRAVA DE VERDADE
// ===========================================================================

/**
 * Recusa uma movimentação que quebre uma regra entre contas.
 *
 * A tela já trava os botões antes de chegar aqui — mas aquilo é a cara
 * amável da regra, não a regra. Quem vale é esta função: ela roda no
 * servidor, no caminho por onde TUDO passa, e não depende de nenhum
 * JavaScript da janela ter sido carregado.
 *
 * Este é o **único** ponto do projeto que bloqueia em vez de avisar, e ele só
 * bloqueia porque a saída está do lado de dentro: `RESTRICOES_ATIVAS`, no
 * bloco CONTROLE DA NUMERAÇÃO da aba Cadastros. Quem precisa do ajuste
 * financeiro ou contábil desliga a chave, faz o lançamento e liga de volta.
 * Bloquear sem porta é o que faz a pessoa contornar o sistema por fora.
 */
function conferirRegraEntreContas_(mov) {
  if (!restricoesAtivas_()) return;
  if (!mov || !mov.contaOrigem || !mov.contaDestino || !mov.forma) return;

  var permitidas = formasEntreContas_(mov.contaOrigem, mov.contaDestino);
  var escolhida = String(mov.forma).trim().toUpperCase();
  var cabe = permitidas.formas.some(function (f) {
    return f.nome.toUpperCase() === escolhida;
  });
  if (cabe) return;

  throw new Error(
    'Esta forma não é permitida entre estas contas.\n\n' +
    '"' + mov.forma + '" não vale de ' + (permitidas.naturezaOrigem || '?') +
    ' para ' + (permitidas.naturezaDestino || '?') + '.\n' +
    (permitidas.motivos.length ? permitidas.motivos.join('\n') + '\n' : '') +
    (permitidas.formas.length
      ? '\nO que vale aqui: ' + permitidas.formas.map(function (f) { return f.nome; }).join(', ') + '.'
      : '\nNenhuma forma vale entre estas duas contas.') +
    '\n\nSe este lançamento é um ajuste e precisa sair assim mesmo, ponha NÃO ' +
    'na chave RESTRICOES_ATIVAS, no bloco CONTROLE DA NUMERAÇÃO da aba Cadastros.');
}
