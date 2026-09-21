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
Folha.prototype.hideRows = function (l) { this.escondidas[l] = true; return this; };
Folha.prototype.showRows = function (l) { delete this.escondidas[l]; return this; };
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
Faixa.prototype.setValue = function (v) { this.folha.celula(this.linha, this.coluna).valor = v; return this; };
Faixa.prototype.getValue = function () { return this.folha.celula(this.linha, this.coluna).valor; };
Faixa.prototype.setValues = function (m) {
  for (var i = 0; i < this.nLinhas; i++)
    for (var j = 0; j < this.nColunas; j++)
      this.folha.celula(this.linha + i, this.coluna + j).valor = m[i][j];
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
Faixa.prototype.setNumberFormat = function (f) { this.folha.celula(this.linha, this.coluna).formato = f; return this; };
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
 'setVerticalAlignment','setWrapStrategy','setBorder','setBackground','setTextRotation',
 'setDataValidation'].forEach(function (nome) {
  Faixa.prototype[nome] = function () { return this; };
});

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
};
Planilha.prototype.setNamedRange = function (nome, faixa) { this.nomeados[nome] = faixa; };
Planilha.prototype.getRangeByName = function (nome) { return this.nomeados[nome] || null; };
Planilha.prototype.toast = function (msg, titulo) { this.avisos.push((titulo || '') + ': ' + msg); };

module.exports = { Planilha: Planilha, Folha: Folha, Faixa: Faixa, lerA1: lerA1, numeroParaLetra: numeroParaLetra };
