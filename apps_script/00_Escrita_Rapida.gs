/**
 * GERADOR DE CMI — Tesouraria da Piedade / ADM Coxim-MS
 * CAMADA DE BASE: escrever na planilha em um pedido só.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * O `SpreadsheetApp`, que o resto do projeto usa, conversa com o Google **uma
 * operação por vez**. Cada `setValue`, cada `hideRows`, cada `getValue` é uma
 * viagem de ida e volta pela internet, e custa o mesmo — 0,15 a 0,3 segundo —
 * escreva ela uma letra ou uma folha inteira. Preencher um comprovante fazia
 * ~50 dessas viagens, e era daí que vinham os 12 segundos de espera que o
 * Taynã mediu.
 *
 * A **API do Google Sheets** (o "serviço avançado") aceita dezenas de
 * operações **num pedido só**: escrever valores, esconder linhas, mudar
 * altura — tudo junto, uma viagem. É o mesmo Google, a mesma planilha, o
 * mesmo resultado; muda só o jeito de falar.
 *
 * COMO LIGAR (uma vez, no editor do Apps Script)
 *   Serviços → +  →  **Google Sheets API**  →  Adicionar.
 * Não precisa de conta nova, nem de hospedagem, nem de autorização diferente.
 *
 * SE NÃO ESTIVER LIGADO, NADA QUEBRA
 * Todo lote aqui sabe se virar sozinho: se o serviço avançado não estiver
 * disponível, ou se o pedido falhar por qualquer motivo, ele refaz o mesmo
 * trabalho pelo caminho antigo, uma operação por vez. Fica lento como antes,
 * mas **funciona igual** — e o resultado diz por qual caminho foi, para não
 * haver dúvida silenciosa.
 *
 * A CHAVE DE SEGURANÇA
 * `USAR_ESCRITA_RAPIDA = false` desliga tudo e volta ao caminho antigo, sem
 * mexer em mais nada. Existe para o caso de o caminho novo dar problema com o
 * sistema rodando: é uma palavra trocada, não uma correção de código.
 */

var USAR_ESCRITA_RAPIDA = true;

/** O serviço avançado do Sheets está ligado neste projeto? */
function escritaRapidaLigada_() {
  if (!USAR_ESCRITA_RAPIDA) return false;
  try {
    return typeof Sheets !== 'undefined' && !!Sheets && !!Sheets.Spreadsheets;
  } catch (e) {
    return false;   // `Sheets` nem existe: o serviço não foi adicionado.
  }
}

// ===========================================================================
// O LOTE
// ===========================================================================

/**
 * Abre um lote de escritas para uma aba.
 *
 * Junte tudo com `valor`, `linhas` e `altura`, e chame `enviar()` uma vez no
 * fim. Antes do `enviar()` **nada** foi para a planilha — então não leia, no
 * meio do caminho, uma célula que você acabou de pôr na fila.
 */
function novoLoteDeEscrita_(sh) {
  var lote = {
    sh: sh,
    pedidos: [],      // para a API do Sheets
    antigos: [],      // o mesmo trabalho, pelo caminho de sempre
    quantos: 0
  };

  /** Uma célula (ou o canto de uma faixa mesclada). */
  lote.valor = function (intervaloA1, valor) {
    var canto = cantoDaFaixa_(intervaloA1);
    lote.pedidos.push({
      updateCells: {
        range: umaCelula_(sh, canto.linha, canto.coluna),
        rows: [{ values: [{ userEnteredValue: comoValorDaApi_(valor) }] }],
        fields: 'userEnteredValue'
      }
    });
    lote.antigos.push(function () { sh.getRange(intervaloA1).setValue(valor); });
    lote.quantos++;
    return lote;
  };

  /** Um bloco de linhas vizinhas fica visível ou escondido. */
  lote.linhas = function (primeiraLinha, quantas, visivel) {
    if (quantas <= 0) return lote;
    lote.pedidos.push({
      updateDimensionProperties: {
        range: {
          sheetId: sh.getSheetId(),
          dimension: 'ROWS',
          startIndex: primeiraLinha - 1,
          endIndex: primeiraLinha - 1 + quantas
        },
        properties: { hiddenByUser: !visivel },
        fields: 'hiddenByUser'
      }
    });
    lote.antigos.push(function () {
      if (visivel) sh.showRows(primeiraLinha, quantas);
      else sh.hideRows(primeiraLinha, quantas);
    });
    lote.quantos++;
    return lote;
  };

  /** A altura de uma linha, em pixels. */
  lote.altura = function (linha, pixels) {
    lote.pedidos.push({
      updateDimensionProperties: {
        range: { sheetId: sh.getSheetId(), dimension: 'ROWS',
                 startIndex: linha - 1, endIndex: linha },
        properties: { pixelSize: pixels },
        fields: 'pixelSize'
      }
    });
    lote.antigos.push(function () { sh.setRowHeight(linha, pixels); });
    lote.quantos++;
    return lote;
  };

  /**
   * Manda tudo. Devolve por qual caminho foi e quantas operações levou.
   *
   * O `try` não é decoração: se a API recusar o pedido — um campo com nome
   * diferente, uma versão nova, qualquer coisa — o mesmo trabalho é refeito
   * pelo caminho antigo, e o comprovante sai. Perde-se velocidade, não o
   * trabalho de quem estava preenchendo.
   */
  lote.enviar = function () {
    if (!lote.quantos) return { caminho: 'nada', operacoes: 0 };

    if (escritaRapidaLigada_()) {
      try {
        Sheets.Spreadsheets.batchUpdate(
          { requests: lote.pedidos },
          SpreadsheetApp.getActive().getId());
        var quantos = lote.quantos;
        lote.pedidos = []; lote.antigos = []; lote.quantos = 0;
        return { caminho: 'rapido', operacoes: quantos, viagens: 1 };
      } catch (erro) {
        // Cai no caminho antigo, logo abaixo, e conta o motivo.
        lote.motivoDaQueda = String(erro && erro.message ? erro.message : erro);
      }
    }

    lote.antigos.forEach(function (fazer) { fazer(); });
    var feitos = lote.quantos;
    lote.pedidos = []; lote.antigos = []; lote.quantos = 0;
    return {
      caminho: 'antigo',
      operacoes: feitos,
      viagens: feitos,
      motivo: lote.motivoDaQueda ||
        (USAR_ESCRITA_RAPIDA ? 'o serviço avançado do Sheets não está ligado neste projeto'
                             : 'USAR_ESCRITA_RAPIDA está desligado')
    };
  };

  return lote;
}

// ===========================================================================
// A FILA COMPARTILHADA
// ===========================================================================

/**
 * O lote que está aberto neste instante, se houver.
 *
 * Existe para que funções escritas antes desta camada — as da Etapa 3, que
 * recalculam extenso, PIA, CNPJ, título e cabeçalho — entrem na mesma fila
 * sem precisar receber o lote de mão em mão por cinco níveis de chamada.
 * Elas escrevem com `porNaFolha_`, e é só.
 */
var LOTE_ABERTO = null;

/** Escreve — na fila, se houver uma aberta; direto, se não houver. */
function porNaFolha_(sh, intervaloA1, valor) {
  if (LOTE_ABERTO) { LOTE_ABERTO.valor(intervaloA1, valor); return; }
  sh.getRange(intervaloA1).setValue(valor);
}

/** Roda um trecho com uma fila aberta, e manda tudo no fim. */
function comFilaAberta_(sh, trabalho) {
  var anterior = LOTE_ABERTO;
  var lote = novoLoteDeEscrita_(sh);
  LOTE_ABERTO = lote;
  try {
    trabalho();
  } finally {
    LOTE_ABERTO = anterior;
  }
  return lote.enviar();
}

// ===========================================================================
// AUXILIARES
// ===========================================================================

/**
 * Uma célula no formato que a API entende.
 *
 * A API conta a partir do ZERO e o fim é exclusivo; o `SpreadsheetApp` conta a
 * partir do UM. Trocar os dois é o erro clássico aqui, e ele é silencioso:
 * escreve na linha de cima.
 */
function umaCelula_(sh, linha, coluna) {
  return {
    sheetId: sh.getSheetId(),
    startRowIndex: linha - 1, endRowIndex: linha,
    startColumnIndex: coluna - 1, endColumnIndex: coluna
  };
}

/**
 * Traduz um valor para o que a API do Sheets espera.
 *
 * Datas são o caso delicado: a planilha guarda data como **número de dias
 * desde 30/12/1899**, e é esse número que a API quer. Mandar o texto faria a
 * célula virar texto — e um comprovante com a data alinhada à esquerda, fora
 * do formato, é o tipo de coisa que ninguém repara até o SIGA recusar.
 */
function comoValorDaApi_(valor) {
  if (valor === '' || valor === null || valor === undefined) return {};
  if (valor instanceof Date) return { numberValue: diasDesde1899_(valor) };
  if (typeof valor === 'number') return { numberValue: valor };
  if (typeof valor === 'boolean') return { boolValue: valor };
  return { stringValue: String(valor) };
}

/**
 * O número que a planilha usa para guardar uma data.
 *
 * A conta é feita com dia, mês e ano separados, e não com a diferença entre
 * dois instantes: a diferença em milissegundos anda uma hora para trás quando
 * cruza o horário de verão, e a data cai para o dia anterior.
 */
function diasDesde1899_(data) {
  var meioDiaUtc = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate(), 12, 0, 0);
  var origem = Date.UTC(1899, 11, 30, 12, 0, 0);
  return Math.round((meioDiaUtc - origem) / 86400000);
}
