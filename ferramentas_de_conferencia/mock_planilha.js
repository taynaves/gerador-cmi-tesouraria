/* Simulador do Google Sheets em Node, no espírito do mock_etapa3.js.
   Só precisa ser fiel no que o projeto usa de verdade. Onde ele não sabe
   responder, ESTOURA ERRO em vez de devolver algo plausível — mock que
   devolve o objeto errado esconde o defeito real (armadilha já paga). */

function letraParaNumero(letras) {
  var n = 0;
  for (var i = 0; i < letras.length; i++) n = n * 26 + (letras.charCodeAt(i) - 64);
  return n;
}
function numeroParaLetra(n) {
  var s = '';
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function lerA1(a1) {
  var m = String(a1).match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);
  if (!m) throw new Error('MOCK: não sei ler o endereço "' + a1 + '"');
  var c1 = letraParaNumero(m[1]), r1 = Number(m[2]);
  var c2 = m[3] ? letraParaNumero(m[3]) : c1, r2 = m[4] ? Number(m[4]) : r1;
  return { linha: Math.min(r1, r2), coluna: Math.min(c1, c2),
           nLinhas: Math.abs(r2 - r1) + 1, nColunas: Math.abs(c2 - c1) + 1 };
}

function Folha(nome, id) {
  this.nome = nome; this.id = id;
  this.celulas = {};        /* "linha,coluna" -> { valor, nota, formato } */
  this.larguras = {}; this.alturas = {};
  this.escondidas = {};
  this.maxLinhas = 1000; this.maxColunas = 26;
  this.mesclagens = [];
  this.protecoes = [];
  this.quebra = {};         /* "linha,coluna" -> 'WRAP' | 'CLIP' | 'OVERFLOW' */
}
Folha.prototype.chave = function (l, c) { return l + ',' + c; };
Folha.prototype.celula = function (l, c) {
  var k = this.chave(l, c);
  if (!this.celulas[k]) this.celulas[k] = { valor: '', nota: '', formato: '' };
  return this.celulas[k];
};
Folha.prototype.getName = function () { return this.nome; };
Folha.prototype.setName = function (n) { this.nome = n; return this; };
Folha.prototype.getSheetId = function () { return this.id; };
Folha.prototype.getMaxColumns = function () { return this.maxColunas; };
Folha.prototype.getMaxRows = function () { return this.maxLinhas; };
Folha.prototype.insertColumnsAfter = function (dep, q) { this.maxColunas += q; return this; };
Folha.prototype.deleteColumns = function (ini, q) { this.maxColunas -= q; return this; };
Folha.prototype.insertRowsAfter = function (dep, q) { this.maxLinhas += q; return this; };
Folha.prototype.deleteRows = function (ini, q) { this.maxLinhas -= q; return this; };
Folha.prototype.setColumnWidth = function (c, px) { this.larguras[c] = px; return this; };
Folha.prototype.getColumnWidth = function (c) { return this.larguras[c] || 100; };
Folha.prototype.setRowHeight = function (l, px) { this.alturas[l] = px; return this; };
Folha.prototype.getRowHeight = function (l) { return this.alturas[l] || 21; };
/* hideRows(linha) esconde uma; hideRows(linha, quantas) esconde o bloco.
   A segunda forma é a que o projeto usa para não mandar 32 pedidos ao Google
   um por um — o simulador tem de falar as duas, senão acusa defeito onde
   não há (armadilha "mock que devolve o objeto errado"). */
Folha.prototype.hideRows = function (l, quantas) {
  for (var i = 0; i < (quantas || 1); i++) this.escondidas[l + i] = true;
  return this;
};
Folha.prototype.showRows = function (l, quantas) {
  for (var i = 0; i < (quantas || 1); i++) delete this.escondidas[l + i];
  return this;
};
Folha.prototype.isRowHiddenByUser = function (l) { return !!this.escondidas[l]; };
Folha.prototype.setHiddenGridlines = function () { return this; };
Folha.prototype.setFrozenRows = function () { return this; };
Folha.prototype.setActiveSelection = function () { return this; };
Folha.prototype.getProtections = function () { return this.protecoes.slice(); };
Folha.prototype.getRange = function (a, b, c, d) {
  if (typeof a === 'string') { var p = lerA1(a); return new Faixa(this, p.linha, p.coluna, p.nLinhas, p.nColunas); }
  return new Faixa(this, a, b, c === undefined ? 1 : c, d === undefined ? 1 : d);
};

function Faixa(folha, linha, coluna, nLinhas, nColunas) {
  this.folha = folha; this.linha = linha; this.coluna = coluna;
  this.nLinhas = nLinhas; this.nColunas = nColunas;
}
Faixa.prototype.getRow = function () { return this.linha; };
Faixa.prototype.getColumn = function () { return this.coluna; };
Faixa.prototype.getNumRows = function () { return this.nLinhas; };
Faixa.prototype.getNumColumns = function () { return this.nColunas; };
Faixa.prototype.getSheet = function () { return this.folha; };
Faixa.prototype.getA1Notation = function () {
  return numeroParaLetra(this.coluna) + this.linha + ':' +
         numeroParaLetra(this.coluna + this.nColunas - 1) + (this.linha + this.nLinhas - 1);
};
Faixa.prototype.merge = function () {
  /* Mesclagem sobreposta é erro de verdade no Sheets — e foi um dos defeitos
     que o simulador do projeto pegou antes do Taynã ver. */
  var minha = this;
  this.folha.mesclagens.forEach(function (m) {
    var cruza = !(minha.linha + minha.nLinhas <= m.linha || m.linha + m.nLinhas <= minha.linha ||
                  minha.coluna + minha.nColunas <= m.coluna || m.coluna + m.nColunas <= minha.coluna);
    var igual = m.linha === minha.linha && m.coluna === minha.coluna &&
                m.nLinhas === minha.nLinhas && m.nColunas === minha.nColunas;
    if (cruza && !igual) {
      throw new Error('MOCK: mesclagem sobreposta em ' + minha.getA1Notation() +
        ' com ' + numeroParaLetra(m.coluna) + m.linha);
    }
  });
  this.folha.mesclagens.push({ linha: this.linha, coluna: this.coluna, nLinhas: this.nLinhas, nColunas: this.nColunas });
  return this;
};
/**
 * O GOOGLE CONVERTE SOZINHO O QUE PARECE DATA, e o simulador tem de converter
 * também — senão um defeito real passa verde aqui para sempre.
 *
 * Foi o que aconteceu: a coluna Folha das regras de finalidade guarda "1.1.1"
 * e "2.0.2.2", e na planilha de verdade "1.1.1" virou 01/01/2001. A janela do
 * recriar passou a listar `F23 → Mon Jan 01 2001 GMT-0300`, e a rastreabilidade
 * da linha até a fonte foi embora. Aqui a bateria não via nada.
 *
 * A conversão só acontece quando a célula NÃO está formatada como texto ('@').
 * É por isso que `desenharBloco_` formata a área antes de escrever: depois não
 * adianta, o valor já foi convertido.
 *
 * SÓ O PADRÃO DE DATA é imitado, e de propósito. O Google também converte
 * outras coisas, mas a evidência que temos — a aba dele — mostra "100.10"
 * intacto na coluna do código SIGA. Imitar uma conversão contra a evidência
 * seria trocar um defeito real por um inventado.
 */
var PARECE_DATA = /^\s*\d{1,2}\.\d{1,2}\.\d{1,4}\s*$/;

Folha.prototype.guardar = function (l, c, valor) {
  var cel = this.celula(l, c);
  if (typeof valor === 'string' && cel.formato !== '@' && PARECE_DATA.test(valor)) {
    var p = valor.trim().split('.');
    var ano = Number(p[2]);
    if (ano < 100) ano += 2000;
    cel.valor = new Date(ano, Number(p[1]) - 1, Number(p[0]));
    return;
  }
  cel.valor = valor;
};

Faixa.prototype.setValue = function (v) { this.folha.guardar(this.linha, this.coluna, v); return this; };
Faixa.prototype.getValue = function () { return this.folha.celula(this.linha, this.coluna).valor; };
Faixa.prototype.setValues = function (m) {
  for (var i = 0; i < this.nLinhas; i++)
    for (var j = 0; j < this.nColunas; j++)
      this.folha.guardar(this.linha + i, this.coluna + j, m[i][j]);
  return this;
};
Faixa.prototype.getValues = function () {
  var saida = [];
  for (var i = 0; i < this.nLinhas; i++) {
    var linha = [];
    for (var j = 0; j < this.nColunas; j++) linha.push(this.folha.celula(this.linha + i, this.coluna + j).valor);
    saida.push(linha);
  }
  return saida;
};
Faixa.prototype.clearContent = function () {
  for (var i = 0; i < this.nLinhas; i++)
    for (var j = 0; j < this.nColunas; j++) this.folha.celula(this.linha + i, this.coluna + j).valor = '';
  return this;
};
Faixa.prototype.setNote = function (t) { this.folha.celula(this.linha, this.coluna).nota = t; return this; };
Faixa.prototype.getNote = function () { return this.folha.celula(this.linha, this.coluna).nota; };
Faixa.prototype.clearNote = function () { this.folha.celula(this.linha, this.coluna).nota = ''; return this; };
/* O FORMATO VALE PARA A FAIXA INTEIRA, e não só para a primeira célula. A
   versão antiga marcava só a de cima: uma faixa formatada como texto passava
   no teste com a primeira célula certa e as outras ao deus-dará — que é
   exatamente o defeito que o formato de texto existe para evitar. */
Faixa.prototype.setNumberFormat = function (f) {
  for (var l = 0; l < this.nLinhas; l++) {
    for (var c = 0; c < this.nColunas; c++) {
      this.folha.celula(this.linha + l, this.coluna + c).formato = f;
    }
  }
  return this;
};
Faixa.prototype.getNumberFormat = function () {
  return this.folha.celula(this.linha, this.coluna).formato || '';
};
Faixa.prototype.getCell = function (l, c) { return new Faixa(this.folha, this.linha + l - 1, this.coluna + c - 1, 1, 1); };
Faixa.prototype.offset = function (dl, dc, nl, nc) {
  return new Faixa(this.folha, this.linha + dl, this.coluna + dc,
    nl === undefined ? this.nLinhas : nl, nc === undefined ? this.nColunas : nc);
};
Faixa.prototype.protect = function () {
  var p = {
    descricao: '', aviso: false,
    setDescription: function (d) { p.descricao = d; return p; },
    getDescription: function () { return p.descricao; },
    setWarningOnly: function (v) { p.aviso = v; return p; },
    remove: function () { var i = this.folha.protecoes.indexOf(p); if (i >= 0) this.folha.protecoes.splice(i, 1); }.bind(this)
  };
  this.folha.protecoes.push(p);
  return p;
};
['setFontFamily','setFontSize','setFontWeight','setFontColor','setHorizontalAlignment',
 'setVerticalAlignment','setBorder','setBackground','setTextRotation',
 'setDataValidation'].forEach(function (nome) {
  Faixa.prototype[nome] = function () { return this; };
});

/* A QUEBRA DE TEXTO NÃO É ENFEITE: é a diferença entre um texto longo descer
   para a segunda linha e sumir do PDF sem avisar. O simulador guarda o valor
   por célula para a bateria poder conferir. Guardar é barato; não guardar
   deixa passar um defeito que só aparece no papel de alguém. */
Faixa.prototype.setWrapStrategy = function (estrategia) {
  for (var l = 0; l < this.nLinhas; l++) {
    for (var c = 0; c < this.nColunas; c++) {
      this.folha.quebra[this.folha.chave(this.linha + l, this.coluna + c)] = String(estrategia);
    }
  }
  return this;
};
Faixa.prototype.getWrapStrategy = function () {
  return this.folha.quebra[this.folha.chave(this.linha, this.coluna)] || 'CLIP';
};

function Planilha() {
  this.folhas = []; this.proximoId = 1; this.nomeados = {}; this.fuso = 'America/Campo_Grande';
  this.avisos = [];
}
Planilha.prototype.getId = function () { return 'PLANILHA-DE-TESTE'; };
Planilha.prototype.getSpreadsheetTimeZone = function () { return this.fuso; };
Planilha.prototype.getSheetByName = function (n) {
  for (var i = 0; i < this.folhas.length; i++) if (this.folhas[i].nome === n) return this.folhas[i];
  return null;
};
Planilha.prototype.insertSheet = function (nome, posicao) {
  var f = new Folha(nome, this.proximoId++);
  if (posicao === undefined) this.folhas.push(f); else this.folhas.splice(posicao, 0, f);
  return f;
};
Planilha.prototype.deleteSheet = function (f) {
  var i = this.folhas.indexOf(f); if (i >= 0) this.folhas.splice(i, 1);
  /* Apagar a aba deixa os intervalos nomeados dela apontando para o nada. */
  var planilha = this;
  Object.keys(this.nomeados).forEach(function (nome) {
    if (planilha.nomeados[nome] && planilha.nomeados[nome].folha === f) {
      planilha.nomeados[nome].zumbi = true;
    }
  });
};
/* No Sheets de verdade, `setNamedRange` com um nome que já existe NÃO
   substitui: cria um segundo com o mesmo nome. O simulador imita isso, senão
   esconde justamente o defeito que esse comportamento causa. */
Planilha.prototype.setNamedRange = function (nome, faixa) {
  if (this.nomeados[nome] && this.nomeados[nome].zumbi) {
    throw new Error('MOCK: já existe um intervalo nomeado "' + nome +
      '" apontando para uma aba apagada. Remova os antigos antes de criar os novos.');
  }
  this.nomeados[nome] = faixa;
};
Planilha.prototype.getNamedRanges = function () {
  var planilha = this;
  return Object.keys(this.nomeados).map(function (nome) {
    return {
      getName: function () { return nome; },
      getRange: function () { return planilha.nomeados[nome]; },
      remove: function () { delete planilha.nomeados[nome]; }
    };
  });
};
Planilha.prototype.getRangeByName = function (nome) { return this.nomeados[nome] || null; };
Planilha.prototype.toast = function (msg, titulo) { this.avisos.push((titulo || '') + ': ' + msg); };

/* -------------------------------------------------------------------------
   O SERVIÇO AVANÇADO DO SHEETS, de mentira.

   Aplica os mesmos pedidos que o `00_Escrita_Rapida.gs` monta, sobre o mesmo
   modelo de planilha. Serve para duas coisas:
     - rodar a bateria inteira pelo caminho novo e conferir que as células
       terminam com exatamente os mesmos valores do caminho antigo;
     - contar as viagens (um `batchUpdate` é UMA, não importa quantos pedidos
       vão dentro).

   O que ele NÃO prova: que o formato do pedido é o que o Google espera. Isso
   só a planilha de verdade diz — e é por isso que o `enviar()` sabe cair no
   caminho antigo sozinho. */
function servicoSheetsDeMentira(planilha, aoChamar) {
  function folhaPorId(id) {
    for (var i = 0; i < planilha.folhas.length; i++) {
      if (planilha.folhas[i].id === id) return planilha.folhas[i];
    }
    throw new Error('MOCK: não existe aba com sheetId ' + id);
  }
  /* No Sheets de verdade, um número escrito numa célula formatada como data
     VIRA uma data: `getValue()` devolve um Date, não o número. O simulador
     precisa fazer o mesmo, senão a folha fica com o número cru e o teste
     acusa diferença onde não há. */
  function dataDoNumero(serial) {
    var ms = Date.UTC(1899, 11, 30, 12, 0, 0) + Math.round(serial) * 86400000;
    var utc = new Date(ms);
    return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  }
  function ehFormatoDeData(formato) { return /[dmy]/i.test(String(formato || '')) && /\//.test(String(formato || '')); }

  function valorDoPedido(v, celula) {
    if (!v || !Object.keys(v).length) return '';
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.numberValue !== undefined) {
      return ehFormatoDeData(celula.formato) ? dataDoNumero(v.numberValue) : v.numberValue;
    }
    if (v.boolValue !== undefined) return v.boolValue;
    throw new Error('MOCK: não sei ler userEnteredValue ' + JSON.stringify(v));
  }
  return {
    Spreadsheets: {
      batchUpdate: function (corpo, idDaPlanilha) {
        if (aoChamar) aoChamar();
        if (!corpo || !corpo.requests) throw new Error('MOCK: batchUpdate sem requests');
        if (idDaPlanilha !== planilha.getId()) throw new Error('MOCK: id de planilha errado');

        corpo.requests.forEach(function (pedido, i) {
          if (pedido.updateCells) {
            var p = pedido.updateCells, f = folhaPorId(p.range.sheetId);
            if (p.fields !== 'userEnteredValue') throw new Error('MOCK: fields inesperado em updateCells');
            var linhas = p.rows || [];
            for (var li = 0; li < linhas.length; li++) {
              var vals = linhas[li].values || [];
              for (var ci = 0; ci < vals.length; ci++) {
                var alvo = f.celula(p.range.startRowIndex + 1 + li,
                                    p.range.startColumnIndex + 1 + ci);
                alvo.valor = valorDoPedido(vals[ci].userEnteredValue, alvo);
              }
            }
            return;
          }
          if (pedido.updateDimensionProperties) {
            var d = pedido.updateDimensionProperties, fd = folhaPorId(d.range.sheetId);
            if (d.range.dimension !== 'ROWS') throw new Error('MOCK: só sei mexer em ROWS');
            for (var r = d.range.startIndex; r < d.range.endIndex; r++) {
              if (d.fields === 'hiddenByUser') {
                if (d.properties.hiddenByUser) fd.escondidas[r + 1] = true;
                else delete fd.escondidas[r + 1];
              } else if (d.fields === 'pixelSize') {
                fd.alturas[r + 1] = d.properties.pixelSize;
              } else {
                throw new Error('MOCK: fields inesperado em updateDimensionProperties: ' + d.fields);
              }
            }
            return;
          }
          throw new Error('MOCK: pedido nº ' + i + ' não reconhecido: ' + Object.keys(pedido).join(','));
        });
        return { replies: [] };
      }
    }
  };
}

module.exports = { Planilha: Planilha, Folha: Folha, Faixa: Faixa, lerA1: lerA1,
                   numeroParaLetra: numeroParaLetra,
                   servicoSheetsDeMentira: servicoSheetsDeMentira };
