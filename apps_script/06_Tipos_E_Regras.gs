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
 * A família de uma forma: ela mesma e as subformas dela.
 *
 * Permitir "SAQUE" permite as duas subformas; proibir "SAQUE" tira as duas.
 * Sem isto, a regra do Santander ("sem saque") deixaria passar DINHEIRO e
 * CHEQUE, que são exatamente as duas maneiras de sacar.
 */
function nucleoFamilia(nome, todas) {
  var alvo = String(nome || '').trim().toUpperCase();
  var familia = {};
  if (!alvo) return familia;
  familia[alvo] = true;
  (todas || []).forEach(function (f) {
    if (nucleoIgual(f.paiDaForma, alvo)) familia[String(f.nome).toUpperCase()] = true;
  });
  return familia;
}

/** As formas que se escolhem de verdade: as que não têm subforma abaixo. */
function nucleoFolhas(todas) {
  return (todas || []).filter(function (f) {
    var nome = String(f.nome).toUpperCase();
    var temFilho = false;
    (todas || []).forEach(function (o) {
      if (nucleoIgual(o.paiDaForma, nome)) temFilho = true;
    });
    return !temFilho;
  });
}

/** Quão específica é uma regra: texto de conta pesa mais que natureza. */
function nucleoEspecificidade(regra) {
  var pontos = 0;
  if (String(regra.origem || '').trim() && String(regra.origem).trim() !== '*') pontos += 1;
  if (String(regra.destino || '').trim() && String(regra.destino).trim() !== '*') pontos += 1;
  if (String(regra.origemContem || '').trim()) pontos += 2;
  if (String(regra.destinoContem || '').trim()) pontos += 2;
  return pontos;
}

/** O texto da conta contém o pedaço que a regra exige? (vazio = qualquer uma) */
function nucleoContem(pedaco, texto) {
  var alvo = String(pedaco == null ? '' : pedaco).trim().toUpperCase();
  if (!alvo) return true;
  return String(texto == null ? '' : texto).toUpperCase().indexOf(alvo) >= 0;
}

/**
 * As formas que valem entre duas contas, e o porquê de cada corte.
 *
 * `origem` e `destino` são `{ natureza, texto }`. `todas` são as formas
 * cadastradas (com `paiDaForma`); `relacoes` são as linhas do bloco REGRAS
 * ENTRE CONTAS já normalizadas.
 *
 * TRÊS COISAS DECIDEM O RESULTADO, e cada uma existe por um caso real:
 *
 * 1. **Um par sem regra é livre.** As linhas do cadastro são restrições, não
 *    permissões — é o que deixa uma conta nova funcionar sem ninguém escrever
 *    regra para ela.
 *
 * 2. **Entre as PERMISSÕES, a regra mais específica manda.** Sem isto, uma
 *    exceção seria impossível de escrever: "cartão movimenta por
 *    transferência" e "caixa recebe por saque" se cruzariam em nada, e o caso
 *    real — sacar do cartão no banco 24h e devolver em espécie à tesouraria —
 *    ficaria proibido. Regras igualmente específicas continuam se cruzando.
 *
 * 3. **As PROIBIÇÕES valem sempre, venham de onde vierem.** Uma proibição é
 *    uma subtração, e uma exceção mais específica não deve poder ressuscitar
 *    o que uma regra geral proibiu. É o que faz "nenhuma conta do Santander
 *    saca" valer mesmo quando outra regra permite saque naquele par.
 */
function nucleoFormasEntre(origem, destino, todas, relacoes, restricoesAtivas) {
  var folhas = nucleoFolhas(todas);
  var saida = { formas: folhas, motivos: [], restricoesAtivas: !!restricoesAtivas };
  if (!saida.restricoesAtivas) return saida;

  origem = origem || {};
  destino = destino || {};
  if (!origem.natureza || !destino.natureza) return saida;

  var valem = [];
  (relacoes || []).forEach(function (regra) {
    if (!regra.ativa) return;
    if (!nucleoCasaNatureza(regra.origem, origem.natureza)) return;
    if (!nucleoCasaNatureza(regra.destino, destino.natureza)) return;
    if (!nucleoContem(regra.origemContem, origem.texto)) return;
    if (!nucleoContem(regra.destinoContem, destino.texto)) return;
    valem.push(regra);
  });

  // 1) As permissões: só as mais específicas, e elas se cruzam entre si.
  var comPermissao = valem.filter(function (r) { return nucleoListaDeFormas(r.permitidas).length; });
  var maior = 0;
  comPermissao.forEach(function (r) { maior = Math.max(maior, nucleoEspecificidade(r)); });

  var permitidas = null;
  comPermissao.forEach(function (regra) {
    if (nucleoEspecificidade(regra) < maior) return;
    var deixa = {};
    nucleoListaDeFormas(regra.permitidas).forEach(function (nome) {
      var familia = nucleoFamilia(nome, todas);
      for (var f in familia) if (familia.hasOwnProperty(f)) deixa[f] = true;
    });
    if (permitidas === null) {
      permitidas = deixa;
    } else {
      var cruzado = {};
      for (var k in permitidas) if (permitidas.hasOwnProperty(k) && deixa[k]) cruzado[k] = true;
      permitidas = cruzado;
    }
    saida.motivos.push(regra.porque || ('Só ' + regra.permitidas + ' entre estas contas.'));
  });

  // 2) As proibições: todas valem, sejam gerais ou específicas.
  var proibidas = {};
  valem.forEach(function (regra) {
    var nega = nucleoListaDeFormas(regra.proibidas);
    if (!nega.length) return;
    nega.forEach(function (nome) {
      var familia = nucleoFamilia(nome, todas);
      for (var f in familia) if (familia.hasOwnProperty(f)) proibidas[f] = true;
    });
    saida.motivos.push(regra.porque || (regra.proibidas + ' não vale entre estas contas.'));
  });

  saida.formas = folhas.filter(function (f) {
    var nome = String(f.nome).toUpperCase();
    if (proibidas[nome]) return false;
    if (permitidas !== null && !permitidas[nome]) return false;
    return true;
  });
  return saida;
}

/**
 * O que vai escrito no campo "Tipo transferência" do comprovante.
 *
 *   DINHEIRO · TRANSFERENCIA ENTRE BANCOS CONTA MOVIMENTO
 *   ENTRE DEPARTAMENTOS · PIX · CARREGAMENTO DE CARTÃO
 *
 * **O tipo principal NÃO entra aqui — ele já está no título do documento.**
 * O título sai de `MOVIMENTAÇÃO INTERNA` ou `TRANSFERÊNCIA DE NUMERÁRIOS`
 * conforme as PIAs, e repetir a mesma frase duas linhas abaixo só gasta a
 * largura do campo com informação que o leitor já tem. Sobram o subtipo
 * (quando existe — só a transferência tem), a forma e a finalidade.
 *
 * Partes que faltam simplesmente não aparecem — o documento nunca sai com um
 * separador solto nem com a palavra "undefined". Numa movimentação interna
 * sem forma escolhida o campo sai em branco, e é correto: tudo o que havia
 * para dizer já está no título.
 */
function nucleoTextoDoTipo(classificacao, forma, finalidade, subforma) {
  var partes = [];
  if (classificacao && classificacao.subtipo) partes.push(classificacao.subtipo);
  if (forma) partes.push(String(forma).trim());
  if (subforma) partes.push(String(subforma).trim());
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

/**
 * Esta finalidade combina com a forma escolhida?
 *
 * A coluna "Formas que combinam", no bloco TIPOS, **vazia significa: serve
 * para qualquer forma**. É o mesmo desenho das regras entre contas — o que
 * ninguém restringiu, vale. Esconder finalidade por regra inventada seria
 * pior do que mostrar uma a mais: a pessoa não acha o que procura e não
 * descobre por quê.
 */
function nucleoFinalidadeCombina(finalidade, forma) {
  if (!finalidade) return true;
  var lista = nucleoListaDeFormas(finalidade.formas);
  if (!lista.length) return true;                 // sem restrição = serve
  if (!forma) return true;                        // sem forma escolhida, mostra tudo
  return lista.indexOf(String(forma).trim().toUpperCase()) >= 0;
}

/**
 * A natureza desta conta é uma das que o cadastro reconhece?
 *
 * Existe por uma falha que passou por baixo de tudo: a coluna Natureza ficou
 * guardando "Ativa" (um deslocamento de coluna), e como o valor **não estava
 * vazio**, nenhuma conferência reclamou. As regras entre contas simplesmente
 * pararam de valer, em silêncio, e o formulário deu bandeira verde para um
 * lançamento que devia ter travado. Conferir "não está vazio" não basta:
 * tem de ser um dos valores da lista.
 */
function nucleoNaturezaConhecida(natureza, validas) {
  var alvo = String(natureza == null ? '' : natureza).trim().toUpperCase();
  if (!alvo) return false;
  for (var i = 0; i < (validas || []).length; i++) {
    if (nucleoIgual(validas[i], alvo)) return true;
  }
  return false;
}

// ===========================================================================
// 2. A ENTREGA DO NÚCLEO PARA A TELA
// ===========================================================================

/** As funções do núcleo, na ordem em que a tela deve recebê-las. */
var FUNCOES_DO_NUCLEO = [
  nucleoIgual, nucleoClassificar, nucleoListaDeFormas,
  nucleoCasaNatureza, nucleoFormasEntre, nucleoTextoDoTipo,
  nucleoPraxeDoCartao, nucleoFinalidadeCombina, nucleoNaturezaConhecida,
  nucleoFamilia, nucleoFolhas, nucleoEspecificidade, nucleoContem
];

/** A versão deste arquivo. Sobe quando o núcleo ou a marca mudam. */
var VERSAO_DO_NUCLEO = '2026-09-23';

/**
 * AS MARCAS SÃO COMANDOS, E NÃO COMENTÁRIOS — a descoberta que custou caro.
 *
 * O servidor lê o arquivo da tela por
 * `HtmlService.createHtmlOutputFromFile(...).getContent()`, e esse método
 * **devolve o texto sem os comentários**. Enquanto as marcas eram
 * comentários, elas nunca chegavam aqui: o sistema acusava "arquivo colado
 * pela metade" num arquivo inteiro, e mandou consertar duas vezes o que não
 * estava quebrado. O que denunciou foi o padrão — o que sobreviveu à leitura
 * foi justamente a única marca escrita como comando (`VERSAO_DA_TELA`).
 *
 * Por isso, aqui e na tela, **nada que precise ser reconhecido depois pode
 * ser escrito em comentário.**
 *
 * O casamento é por expressão regular, e não por texto exato, para não
 * depender de espaço a mais ou a menos. As marcas antigas continuam aceitas,
 * para um par de arquivos meio atualizado funcionar em vez de morrer.
 */
var MARCA_DO_NUCLEO = 'var NUCLEO_DAS_REGRAS = 1;';
var MARCA_FIM_DA_TELA = 'var FIM_DA_TELA = 1;';

var PADROES_DO_NUCLEO = [
  /var\s+NUCLEO_DAS_REGRAS\s*=\s*1\s*;/,
  /\/\*\s*NUCLEO_DAS_REGRAS\s*\*\//,
  /\/\*\s*<<<\s*O\s+N\u00daCLEO DAS REGRAS ENTRA AQUI\s*>>>\s*\*\//
];

var PADROES_DE_FIM = [
  /var\s+FIM_DA_TELA\s*=\s*1\s*;/,
  /\/\*\s*FIM_DA_TELA\s*\*\//
];

/** O primeiro padrão que casar, devolvido como o texto achado (ou ''). */
function primeiroQueCasa_(texto, padroes) {
  for (var i = 0; i < padroes.length; i++) {
    var achado = padroes[i].exec(texto);
    if (achado) return achado[0];
  }
  return '';
}

/** A marca do núcleo neste texto (o trecho achado), ou ''. */
function marcaEncontrada_(texto) {
  return primeiroQueCasa_(texto, PADROES_DO_NUCLEO);
}

/** A marca de fim neste texto (o trecho achado), ou ''. */
function fimEncontrado_(texto) {
  return primeiroQueCasa_(texto, PADROES_DE_FIM);
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

  /* PRIMEIRO a colagem cortada, e só depois a versão: um arquivo cortado leva
     o número da versão junto (ele fica no alto), e conferir a versão antes
     faria o erro acusar a coisa errada. */
  if (!fimEncontrado_(texto)) {
    /* Aqui a mensagem NÃO afirma de quem é a culpa, e isso é de propósito: a
       versão anterior afirmava "você colou pela metade", o arquivo estava
       inteiro, e a pessoa foi mandada consertar o que não estava quebrado —
       duas vezes. O diagnóstico decide; a mensagem só encaminha. */
    throw new Error(
      'O fim do arquivo 04_Formulario_Tela.html não chegou até o script.\n\n' +
      'O que chegou tem ' + texto.length + ' letras e termina assim:\n"' +
      texto.slice(Math.max(0, texto.length - 60)).replace(/\n/g, ' ') + '"\n\n' +
      'Rode o menu "Tesouraria CMI → Diagnosticar o arquivo da tela": ele diz ' +
      'em números o que o script está lendo, e é ele que aponta se o problema ' +
      'é a colagem ou é o script.');
  }

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
  var montada = texto.replace(marca, function () { return codigo; });

  /* CONFERIR O RESULTADO, e não só a receita. A troca pode dar certo no papel
     e a janela sair sem as regras — e janela sem regra abre normal e não
     responde a botão nenhum, sem dizer nada. Melhor estourar aqui. */
  if (montada.indexOf('function nucleoClassificar') < 0) {
    throw new Error('As regras não entraram na janela, mesmo com a marca ' +
      'encontrada ("' + marca + '"). Rode o menu "Tesouraria CMI → Diagnosticar ' +
      'o arquivo da tela" e mande o resultado.');
  }
  return montada;
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

  var cortado = false;
  try {
    cortado = !fimEncontrado_(
      HtmlService.createHtmlOutputFromFile('04_Formulario_Tela').getContent());
  } catch (e) { cortado = true; }

  if (cortado) {
    SpreadsheetApp.getUi().alert('O arquivo da tela está INCOMPLETO',
      'O 04_Formulario_Tela.html do editor foi colado pela metade: o fim dele ' +
      'não chegou.\n\nCopie de novo pelo botão "Raw" do GitHub (a página de ' +
      'texto puro), e não pela tela que mostra o código colorido — nela, ' +
      'Ctrl+A copia só o pedaço já carregado.\n\nA última linha do arquivo ' +
      'tem de ser "</html>".', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

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

/**
 * O QUE O SERVIDOR REALMENTE LÊ do arquivo da tela — em números.
 *
 * Nasceu de dois diagnósticos errados seguidos. O sistema dizia "arquivo
 * colado pela metade", o arquivo estava inteiro no editor, e não havia jeito
 * de saber quem estava certo. O que resolveu foi comparar o que sobreviveu à
 * leitura com o que sumiu: sumiram os dois COMENTÁRIOS, sobreviveu o único
 * COMANDO.
 *
 * Esta função existe para essa comparação não depender mais de adivinhação:
 * ela conta o que chegou. "Comentários que sobreviveram: 0" responde numa
 * linha uma pergunta que custou duas rodadas.
 */
function diagnosticarArquivoDaTela() {
  var texto = '';
  var erro = '';
  try {
    texto = HtmlService.createHtmlOutputFromFile('04_Formulario_Tela').getContent();
  } catch (e) {
    erro = e.message;
  }

  if (erro) {
    SpreadsheetApp.getUi().alert('Não deu para ler o arquivo da tela', erro,
      SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  var comentarios = texto.split('/*').length - 1;
  var fim = texto.length > 90 ? texto.slice(texto.length - 90) : texto;

  var linhas = [
    'Tamanho lido: ' + texto.length + ' letras, ' +
      (texto.split('\n').length) + ' linhas',
    '',
    'Começa com <!DOCTYPE ....: ' + (texto.indexOf('<!DOCTYPE') >= 0 ? 'sim' : 'NÃO'),
    'Tem </html> no fim .......: ' + (texto.indexOf('</html>') >= 0 ? 'sim' : 'NÃO'),
    'Comentários que chegaram .: ' + comentarios,
    '',
    'VERSAO_DA_TELA ...........: ' + (versaoDaTela_(texto) || 'NÃO ACHADA'),
    'Marca do núcleo ..........: ' + (marcaEncontrada_(texto) || 'NÃO ACHADA'),
    'Marca de fim .............: ' + (fimEncontrado_(texto) || 'NÃO ACHADA'),
    '',
    'Este script (06_Tipos_E_Regras.gs): versão ' + VERSAO_DO_NUCLEO,
    '',
    'As últimas letras do que chegou:',
    fim.replace(/\n/g, ' ⏎ ')
  ];

  SpreadsheetApp.getUi().alert('Diagnóstico do arquivo da tela',
    linhas.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
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
      porque: String(r['Por quê'] || '').trim(),
      origemContem: String(r['Origem contém'] || '').trim(),
      destinoContem: String(r['Destino contém'] || '').trim()
    };
  }).filter(function (r) { return r.origem || r.destino; });
}

/** Todas as formas cadastradas, na ordem do cadastro. */
function todasAsFormas_() {
  return lerCadastro_('FORMAS').map(function (f) {
    return {
      nome: String(f.Forma || '').trim(),
      emEspecie: /^S/i.test(String(f['Em espécie?'] || '')),
      // Vazio = forma de primeiro nível; preenchido = subforma daquela.
      paiDaForma: String(f['Subforma de'] || '').trim(),
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

/** Os valores que a coluna Natureza aceita, tirados do próprio cadastro. */
function naturezasValidas_() {
  var coluna = null;
  blocoPorId_('CONTAS').colunas.forEach(function (c) {
    if (!coluna && c.nome === 'Natureza') coluna = c;
  });
  return (coluna && coluna.valores) ? coluna.valores.slice() : ['CAIXA', 'BANCO', 'ACG', 'CARTAO'];
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

/** As formas que valem entre duas naturezas (sem olhar conta específica). */
function formasEntreNaturezas_(naturezaOrigem, naturezaDestino) {
  return nucleoFormasEntre({ natureza: naturezaOrigem, texto: '' },
                           { natureza: naturezaDestino, texto: '' },
                           todasAsFormas_(), relacoesNormalizadas_(), restricoesAtivas_());
}

/** As formas que valem entre duas contas — aqui o texto da conta conta. */
function formasEntreContas_(contaOrigem, contaDestino) {
  var naturezaOrigem = naturezaDaConta_(contaOrigem);
  var naturezaDestino = naturezaDaConta_(contaDestino);
  var resposta = nucleoFormasEntre(
    { natureza: naturezaOrigem, texto: contaOrigem },
    { natureza: naturezaDestino, texto: contaDestino },
    todasAsFormas_(), relacoesNormalizadas_(), restricoesAtivas_());
  resposta.naturezaOrigem = naturezaOrigem;
  resposta.naturezaDestino = naturezaDestino;
  return resposta;
}

/** Compõe o texto do campo Tipo a partir dos três níveis. */
function textoDoTipo_(classificacao, forma, finalidade, subforma) {
  return nucleoTextoDoTipo(classificacao, forma, finalidade, subforma);
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
  // O que vale é a folha: quem escolhe SAQUE escolhe DINHEIRO ou CHEQUE.
  var escolhida = String(mov.subforma || mov.forma).trim().toUpperCase();
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
