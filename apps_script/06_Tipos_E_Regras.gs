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
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE ARQUIVO TEM UM "NÚCLEO" (seção 1)
 *
 * A tela precisa da mesma regra do lado dela: deduzir o tipo a cada conta
 * escolhida tem de ser instantâneo, e perguntar ao Google a cada tecla
 * devolveria a lentidão que este projeto acabou de tirar.
 *
 * A primeira solução foi escrever a regra duas vezes — aqui e dentro do
 * `04_Formulario_Tela.html` — e provar por teste que as duas diziam o mesmo.
 * Funcionava, mas era um acordo com o problema, não a solução dele: qualquer
 * regra nova nasceria precisando ser escrita em dois lugares, para sempre.
 *
 * **Agora existe uma cópia só, e é esta.** As funções `nucleo*` abaixo não
 * tocam na planilha: recebem dados prontos e devolvem a resposta. Na hora de
 * abrir o formulário, `regrasParaATela_()` lê o **código-fonte delas** e o
 * servidor o injeta dentro da janela (ver `telaComAsRegras_` e
 * `abrirFormularioCmi`). A tela não tem regra própria: ela recebe esta, a
 * cada vez que abre.
 *
 * Consequência prática: para mudar uma regra, mexa **só aqui**. A janela pega
 * a versão nova na próxima vez que for aberta, sem ninguém copiar nada.
 *
 * Consequência para quem for mexer no núcleo:
 *   - só pode usar JavaScript puro — nada de `SpreadsheetApp`, `Utilities`,
 *     `lerCadastro_` ou qualquer coisa que só exista no servidor, porque esse
 *     mesmo texto vai rodar dentro do navegador;
 *   - não pode chamar funções de fora do núcleo, pelo mesmo motivo. O que o
 *     núcleo precisar, recebe por parâmetro;
 *   - nada de funções em flecha (`=>`) nem `let`/`const` — o núcleo é lido
 *     como texto e colado na página, e o estilo do projeto é ES5.
 */

// ===========================================================================
// 1. O NÚCLEO — a única cópia das regras, compartilhada com a tela
// ===========================================================================

var TIPOS_DE_MOVIMENTACAO = {
  interna: 'MOVIMENTAÇÃO INTERNA DE NUMERÁRIOS',
  transferencia: 'TRANSFERÊNCIA DE NUMERÁRIOS'
};

var SUBTIPOS_DE_TRANSFERENCIA = {
  entreDepartamentos: 'entre departamentos',
  entreAdministracoes: 'entre administrações'
};

/** Compara dois textos do cadastro ignorando caixa e espaços das pontas. */
function nucleoIgual(a, b) {
  return String(a == null ? '' : a).trim().toUpperCase() ===
         String(b == null ? '' : b).trim().toUpperCase();
}

/**
 * Onde a movimentação acontece, pelas duas contas.
 *
 * `origem` e `destino` são `{ piaChave, adm }`. `arvore` traz os quatro
 * textos (interna, transferencia, entreDepartamentos, entreAdministracoes).
 * Enquanto faltar uma das contas devolve tudo vazio — deduzir com meio dado
 * é adivinhar.
 */
function nucleoClassificar(origem, destino, arvore) {
  var vazio = { tipo: '', subtipo: '', descricao: '', mesmaPia: false, mesmaAdm: false };
  if (!origem || !destino) return vazio;
  if (!origem.piaChave || !destino.piaChave) return vazio;

  var mesmaPia = nucleoIgual(origem.piaChave, destino.piaChave);
  var mesmaAdm = !!String(origem.adm || '').trim() && nucleoIgual(origem.adm, destino.adm);

  if (mesmaPia) {
    return { tipo: arvore.interna, subtipo: '', descricao: arvore.interna,
             mesmaPia: true, mesmaAdm: mesmaAdm };
  }
  var subtipo = mesmaAdm ? arvore.entreDepartamentos : arvore.entreAdministracoes;
  return {
    tipo: arvore.transferencia,
    subtipo: subtipo,
    descricao: arvore.transferencia + ' — ' + subtipo,
    mesmaPia: false,
    mesmaAdm: mesmaAdm
  };
}

/** Separa "PIX, TED" numa lista, em caixa alta. */
function nucleoListaDeFormas(texto) {
  return String(texto == null ? '' : texto).split(/[;,]/)
    .map(function (t) { return t.trim().toUpperCase(); })
    .filter(function (t) { return t; });
}

/** `*` (ou vazio, ou "QUALQUER") vale para qualquer natureza. */
function nucleoCasaNatureza(daRegra, daConta) {
  var alvo = String(daRegra == null ? '' : daRegra).trim().toUpperCase();
  if (!alvo || alvo === '*' || alvo === 'QUALQUER') return true;
  return alvo === String(daConta == null ? '' : daConta).trim().toUpperCase();
}

/**
 * As formas que valem entre duas naturezas, e o porquê de cada corte.
 *
 * `todas` são as formas cadastradas (`{ nome, ... }`); `relacoes` são as
 * linhas do bloco REGRAS ENTRE CONTAS já normalizadas
 * (`{ origem, destino, permitidas, proibidas, ativa, porque }`).
 *
 * Devolve `{ formas, motivos, restricoesAtivas }`. Um par sem nenhuma regra é
 * **livre**: as linhas do cadastro são restrições, não permissões. Com as
 * restrições desligadas nada é escondido e nenhum motivo é inventado.
 */
function nucleoFormasEntre(naturezaOrigem, naturezaDestino, todas, relacoes, restricoesAtivas) {
  var saida = { formas: todas || [], motivos: [], restricoesAtivas: !!restricoesAtivas };
  if (!saida.restricoesAtivas) return saida;
  if (!naturezaOrigem || !naturezaDestino) return saida;

  var permitidas = null;   // null = ninguém restringiu ainda
  var proibidas = {};

  (relacoes || []).forEach(function (regra) {
    if (!regra.ativa) return;
    if (!nucleoCasaNatureza(regra.origem, naturezaOrigem)) return;
    if (!nucleoCasaNatureza(regra.destino, naturezaDestino)) return;

    var deixa = nucleoListaDeFormas(regra.permitidas);
    var nega = nucleoListaDeFormas(regra.proibidas);

    if (deixa.length) {
      // Duas listas fechadas se cruzam: o que vale é o que está nas duas.
      permitidas = (permitidas === null) ? deixa : permitidas.filter(function (f) {
        return deixa.indexOf(f) >= 0;
      });
      saida.motivos.push(regra.porque || ('Entre ' + naturezaOrigem + ' e ' +
        naturezaDestino + ', só ' + deixa.join(', ') + '.'));
    }
    if (nega.length) {
      nega.forEach(function (f) { proibidas[f] = true; });
      saida.motivos.push(regra.porque || (nega.join(', ') + ' não vale entre ' +
        naturezaOrigem + ' e ' + naturezaDestino + '.'));
    }
  });

  saida.formas = (todas || []).filter(function (f) {
    var nome = String(f.nome).toUpperCase();
    if (proibidas[nome]) return false;
    if (permitidas !== null && permitidas.indexOf(nome) < 0) return false;
    return true;
  });
  return saida;
}

/**
 * O que vai escrito no campo "Tipo transferência" do comprovante.
 *
 *   MOVIMENTAÇÃO INTERNA DE NUMERÁRIOS · DINHEIRO
 *   TRANSFERÊNCIA DE NUMERÁRIOS — ENTRE DEPARTAMENTOS · PIX · CARREGAMENTO DE CARTÃO
 *
 * Partes que faltam simplesmente não aparecem — o documento nunca sai com um
 * separador solto nem com a palavra "undefined".
 */
function nucleoTextoDoTipo(classificacao, forma, finalidade) {
  var partes = [];
  if (classificacao && classificacao.descricao) partes.push(classificacao.descricao);
  if (forma) partes.push(String(forma).trim());
  if (finalidade) partes.push(String(finalidade).trim());
  return partes.join(' · ').toUpperCase();
}

/**
 * A praxe dos cartões — **um lembrete, nunca uma trava.**
 *
 * "Zerar Conta", "Transferência Débito" e "Carregamento de cartão" podem
 * acontecer dentro da mesma PIA ou entre PIAs da mesma ADM: as duas coisas
 * existem. A tesouraria de Coxim adotou fazer sempre pelo caminho interno —
 * entre a tesouraria do departamento e os cartões dele — porque assim o
 * controle fica mais simples.
 *
 * **Isso é preferência de uma tesouraria, não determinação da obra.** Outra
 * administração pode fazer diferente e estar igualmente certa. Por isso não
 * virou regra no bloco REGRAS ENTRE CONTAS (aquilo bloqueia): virou esta nota,
 * que aparece, explica e deixa seguir. Quem não a quiser põe NÃO na chave
 * `PRAXE_CARTAO_NA_MESMA_PIA` e ela some.
 *
 * Repara que ela olha a **natureza** CARTAO, e não o texto da finalidade
 * escolhida: quem carrega um cartão pode escrever qualquer coisa no campo de
 * finalidade, mas a conta de cartão é a conta de cartão.
 */
function nucleoPraxeDoCartao(origem, destino, ligada) {
  if (!ligada || !origem || !destino) return '';
  if (!nucleoIgual(origem.natureza, 'CARTAO') && !nucleoIgual(destino.natureza, 'CARTAO')) return '';
  if (!origem.piaChave || !destino.piaChave) return '';
  if (nucleoIgual(origem.piaChave, destino.piaChave)) return '';

  return 'Aqui a praxe é o cartão ser movimentado pela tesouraria do PRÓPRIO ' +
         'departamento, e estas duas contas são de departamentos diferentes. ' +
         'Nada impede o lançamento — isto é praxe desta tesouraria, não ' +
         'determinação. Para a nota não aparecer mais, ponha NÃO na chave ' +
         'PRAXE_CARTAO_NA_MESMA_PIA, na aba Cadastros.';
}

// ===========================================================================
// 2. A ENTREGA DO NÚCLEO PARA A TELA
// ===========================================================================

/** As funções do núcleo, na ordem em que a tela deve recebê-las. */
var FUNCOES_DO_NUCLEO = [
  nucleoIgual, nucleoClassificar, nucleoListaDeFormas,
  nucleoCasaNatureza, nucleoFormasEntre, nucleoTextoDoTipo,
  nucleoPraxeDoCartao
];

/** A versão deste arquivo. Sobe quando o núcleo ou a marca mudam. */
var VERSAO_DO_NUCLEO = '2026-09-22';

/**
 * As marcas aceitas dentro do HTML, onde o núcleo é colado.
 *
 * A primeira é a que vale. As outras ficam só para um par de arquivos meio
 * atualizado continuar funcionando em vez de morrer.
 *
 * **A marca é ASCII puro, de propósito.** A primeira versão dela trazia a
 * palavra "NÚCLEO", com acento, e casar dois arquivos por um texto acentuado
 * é pedir para que um dia eles deixem de casar por causa de codificação — que
 * é justamente o tipo de falha que não dá pista nenhuma de onde veio. A marca
 * antiga é escrita aqui com `\u00da` pelo mesmo motivo: para este arquivo não
 * depender de como foi salvo.
 */
var MARCAS_DO_NUCLEO = [
  '/* NUCLEO_DAS_REGRAS */',
  '/* <<< O N\u00daCLEO DAS REGRAS ENTRA AQUI >>> */'
];

/** Qual das marcas aceitas está neste texto (ou '' se nenhuma). */
function marcaEncontrada_(texto) {
  for (var i = 0; i < MARCAS_DO_NUCLEO.length; i++) {
    if (texto.indexOf(MARCAS_DO_NUCLEO[i]) >= 0) return MARCAS_DO_NUCLEO[i];
  }
  return '';
}

/** A versão declarada dentro do HTML da tela, se houver. */
function versaoDaTela_(texto) {
  var achado = /VERSAO_DA_TELA\s*=\s*'([^']*)'/.exec(texto);
  return achado ? achado[1] : '';
}

/**
 * O código-fonte do núcleo, pronto para ser colado dentro da janela.
 *
 * `Function.prototype.toString()` devolve o texto da função como ela foi
 * escrita. É isso que faz existir uma cópia só: a tela não recebe uma
 * tradução da regra, recebe a regra.
 */
function regrasParaATela_() {
  var pedacos = ['/* Injetado por regrasParaATela_() — a fonte é 06_Tipos_E_Regras.gs.',
                 '   NÃO edite aqui: qualquer mudança some na próxima abertura. */'];
  FUNCOES_DO_NUCLEO.forEach(function (f) { pedacos.push(f.toString()); });
  return pedacos.join('\n\n');
}

/**
 * Monta o HTML da janela com o núcleo já dentro.
 *
 * Se a marca não estiver no arquivo, isto **estoura aqui**, de propósito. O
 * silêncio seria pior: uma janela sem o núcleo abre normalmente e não
 * funciona nenhum botão, sem mensagem nenhuma — a armadilha já conhecida do
 * `HtmlService` (ver CLAUDE.md).
 */
function telaComAsRegras_() {
  var texto = HtmlService.createHtmlOutputFromFile('04_Formulario_Tela').getContent();
  var marca = marcaEncontrada_(texto);

  if (!marca) {
    /* A mensagem diz QUAL versão está no editor. Sem isso, a pessoa fica sem
       saber se colou o arquivo errado, se colou pela metade, ou se o defeito
       é do script — e as três coisas parecem iguais na tela. */
    var versao = versaoDaTela_(texto);
    throw new Error(
      'A tela que está no editor não é a que este script espera.\n\n' +
      (versao
        ? 'No editor: 04_Formulario_Tela.html da versão ' + versao + '.'
        : 'O 04_Formulario_Tela.html do editor é anterior a 22/09/2026 — ' +
          'ele nem declara versão.') + '\n' +
      'Este script (06_Tipos_E_Regras.gs) é da versão ' + VERSAO_DO_NUCLEO + '.\n\n' +
      'COMO CONSERTAR: abra o arquivo 04_Formulario_Tela.html no editor, clique ' +
      'dentro dele, aperte Ctrl+A e depois Delete para apagar TUDO, cole o ' +
      'arquivo do GitHub e salve.\n\n' +
      'Para ter certeza de que colou inteiro: a primeira linha tem de ser ' +
      '"<!DOCTYPE html>" e a última tem de ser "</html>".');
  }

  // A troca é feita por função, e não por texto: num texto de substituição,
  // `$&` e `$1` têm significado especial, e o código do núcleo passaria a
  // depender de nunca conter um cifrão. Por função, o texto entra como está.
  var codigo = regrasParaATela_();
  return texto.replace(marca, function () { return codigo; });
}

/**
 * O que está no editor, de cada arquivo que declara versão.
 *
 * Existe porque colar arquivo por arquivo, por várias mensagens, faz perder a
 * conta do que já foi atualizado — e um arquivo velho no meio de arquivos
 * novos costuma falhar longe de onde está a causa.
 */
function conferirVersoesDosArquivos() {
  var tela = '';
  try {
    tela = versaoDaTela_(HtmlService.createHtmlOutputFromFile('04_Formulario_Tela').getContent());
  } catch (e) {
    tela = '(não deu para ler: ' + e.message + ')';
  }

  var linhas = [
    '06_Tipos_E_Regras.gs  ......  ' + VERSAO_DO_NUCLEO,
    '04_Formulario_Tela.html  ...  ' + (tela || 'sem versão declarada (arquivo antigo)')
  ];

  var iguais = tela === VERSAO_DO_NUCLEO;
  SpreadsheetApp.getUi().alert(
    iguais ? 'Os arquivos estão na mesma versão' : 'ATENÇÃO: os arquivos estão em versões diferentes',
    linhas.join('\n') + '\n\n' +
    (iguais
      ? 'Pode usar o formulário normalmente.'
      : 'Cole de novo, pelo GitHub, o arquivo que estiver atrasado. Abra o ' +
        'arquivo no editor, Ctrl+A, Delete, cole e salve.'),
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// ===========================================================================
// 3. OS ATALHOS DO SERVIDOR — leem o cadastro e chamam o núcleo
// ===========================================================================

/** Os quatro textos da árvore, do jeito que o núcleo os espera. */
function arvoreDeTipos_() {
  return {
    interna: TIPOS_DE_MOVIMENTACAO.interna,
    transferencia: TIPOS_DE_MOVIMENTACAO.transferencia,
    entreDepartamentos: SUBTIPOS_DE_TRANSFERENCIA.entreDepartamentos,
    entreAdministracoes: SUBTIPOS_DE_TRANSFERENCIA.entreAdministracoes
  };
}

/** As regras do cadastro, com os nomes de campo que o núcleo usa. */
function relacoesNormalizadas_() {
  return lerCadastro_('RELACOES').map(function (r) {
    return {
      origem: String(r['Natureza de origem'] || '').trim(),
      destino: String(r['Natureza de destino'] || '').trim(),
      permitidas: String(r['Formas permitidas'] || '').trim(),
      proibidas: String(r['Formas proibidas'] || '').trim(),
      fonte: String(r['Origem da regra'] || '').trim(),
      ativa: /^S/i.test(String(r.Ativa || 'Sim')),
      porque: String(r['Por quê'] || '').trim()
    };
  }).filter(function (r) { return r.origem || r.destino; });
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

/** As restrições estão ligadas? (chave RESTRICOES_ATIVAS, no CONTROLE) */
function restricoesAtivas_() {
  var valor = String(lerControle_('RESTRICOES_ATIVAS') || 'SIM').trim().toUpperCase();
  return valor !== 'NAO' && valor !== 'NÃO' && valor !== 'FALSE' && valor !== '';
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

/** A ADM a que uma conta pertence. */
function admDeUmaConta_(textoDaConta) {
  var conta = contaCadastrada_(textoDaConta);
  return conta ? String(conta.ADM || '').trim() : '';
}

/** A natureza de uma conta: CAIXA, BANCO, ACG ou CARTAO. */
function naturezaDaConta_(textoDaConta) {
  var conta = contaCadastrada_(textoDaConta);
  return conta ? String(conta.Natureza || '').trim().toUpperCase() : '';
}

/** Uma conta do jeito que o núcleo a espera: `{ piaChave, adm, natureza }`. */
function contaParaONucleo_(textoDaConta) {
  var conta = contaCadastrada_(textoDaConta);
  if (!conta) return null;
  return { piaChave: pia_(conta.PIA),
           adm: String(conta.ADM || '').trim(),
           natureza: String(conta.Natureza || '').trim().toUpperCase() };
}

/** A nota da praxe dos cartões está ligada? */
function praxeDoCartaoLigada_() {
  var valor = String(lerControle_('PRAXE_CARTAO_NA_MESMA_PIA') || 'SIM').trim().toUpperCase();
  return valor !== 'NAO' && valor !== 'NÃO' && valor !== 'FALSE' && valor !== '';
}

/** Onde esta movimentação acontece, a partir das duas contas. */
function classificarMovimentacao_(contaOrigem, contaDestino) {
  return nucleoClassificar(contaParaONucleo_(contaOrigem),
                           contaParaONucleo_(contaDestino),
                           arvoreDeTipos_());
}

/** As formas que valem entre duas naturezas. */
function formasEntreNaturezas_(naturezaOrigem, naturezaDestino) {
  return nucleoFormasEntre(naturezaOrigem, naturezaDestino, todasAsFormas_(),
                           relacoesNormalizadas_(), restricoesAtivas_());
}

/** As formas que valem entre duas contas. */
function formasEntreContas_(contaOrigem, contaDestino) {
  var naturezaOrigem = naturezaDaConta_(contaOrigem);
  var naturezaDestino = naturezaDaConta_(contaDestino);
  var resposta = formasEntreNaturezas_(naturezaOrigem, naturezaDestino);
  resposta.naturezaOrigem = naturezaOrigem;
  resposta.naturezaDestino = naturezaDestino;
  return resposta;
}

/** Compõe o texto do campo Tipo a partir dos três níveis. */
function textoDoTipo_(classificacao, forma, finalidade) {
  return nucleoTextoDoTipo(classificacao, forma, finalidade);
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
