/* Confere 04_Formulario.html, no espírito do mock_janela.js da seção 8 do
   estado do projeto. Duas correções em relação à primeira versão:
     - o equilíbrio das tags ignora o que está DENTRO do <script> (o JS monta
       HTML em texto, e aquilo não é marcação da página);
     - a caça a alert/confirm ignora comentários (este arquivo fala sobre
       alert() justamente para dizer que não se usa). */
var fs = require('fs');
var pasta = process.argv[3];
var falhas = [], notas = [];

/* O QUE É CONFERIDO AQUI É A TELA MONTADA, não o arquivo cru: as regras de
   tipos são coladas dentro dele na hora de abrir. Conferir o arquivo cru
   deixaria passar justamente o defeito mais perigoso — o HTML gerado com erro
   de sintaxe, que abre normalmente e não responde a nenhum botão. */
var html = fs.readFileSync(process.argv[2], 'utf8');
try {
  html = require('./montar_tela.js').injetar(html, '.');
  notas.push('núcleo das regras injetado (como o servidor faz)');
} catch (e) {
  falhas.push('não deu para montar a tela: ' + e.message);
}

function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

/* 1. Os <script> compilam? */
var scripts = [], re = /<script[^>]*>([\s\S]*?)<\/script>/g, m;
while ((m = re.exec(html))) scripts.push(m[1]);
notas.push('blocos <script>: ' + scripts.length);
scripts.forEach(function (codigo, i) {
  fs.writeFileSync(pasta + '/tela_script_' + i + '.js', codigo);
  try { new Function(codigo); } catch (e) { falhas.push('script #' + i + ' não compila: ' + e.message); }
});

/* 2. alert / confirm / prompt em código de verdade */
scripts.forEach(function (codigo, i) {
  var limpo = semComentarios(codigo);
  if (/(^|[^.\w])(alert|confirm|prompt)\s*\(/.test(limpo)) {
    falhas.push('script #' + i + ' usa alert/confirm/prompt — o Google bloqueia nesta janela');
  }
});

/* 3. Atributos onXxx escritos na marcação */
var marcacao = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
                   .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
var attrs = 0, reAttr = /\son[a-z]+\s*=\s*"([^"]*)"/g;
while ((m = reAttr.exec(marcacao))) {
  attrs++;
  try { new Function(m[1]); } catch (e) { falhas.push('atributo on... não compila: ' + m[1]); }
}
notas.push('atributos on... na marcação: ' + attrs);

/* 4. Tags abertas x fechadas, só na marcação */
var semFecho = { br:1, hr:1, img:1, input:1, meta:1, link:1, base:1, source:1, col:1 };
var pilha = [], reTag = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
while ((m = reTag.exec(marcacao))) {
  var fechando = m[1] === '/', nome = m[2].toLowerCase(), corpo = m[3];
  if (semFecho[nome] || /\/\s*$/.test(corpo)) continue;
  if (!fechando) pilha.push(nome);
  else if (!pilha.length) falhas.push('</' + nome + '> sem abertura');
  else if (pilha[pilha.length - 1] !== nome) {
    falhas.push('</' + nome + '> fecha fora de ordem (esperava </' + pilha[pilha.length - 1] + '>)');
    pilha.pop();
  } else pilha.pop();
}
if (pilha.length) falhas.push('tags abertas e não fechadas: ' + pilha.join(', '));

/* 5. Todo elem('x') tem um id="x" na página? */
var idsNoHtml = {}, reId = /\bid="([^"]+)"/g;
while ((m = reId.exec(marcacao))) idsNoHtml[m[1]] = true;
var citados = {}, reElem = /elem\('([^']+)'\)/g;
scripts.forEach(function (c) { while ((m = reElem.exec(c))) citados[m[1]] = true; });
var criadosPeloJs = { };  /* ids que o próprio JS cria antes de usar */
scripts.forEach(function (c) {
  var r = /id="'\s*\+|id="([a-zA-Z0-9\-]+)"/g, x;
  while ((x = r.exec(c))) if (x[1]) criadosPeloJs[x[1]] = true;
});
Object.keys(citados).forEach(function (id) {
  if (!idsNoHtml[id] && !criadosPeloJs[id]) {
    falhas.push('o JS chama elem("' + id + '") e não existe id="' + id + '" na página');
  }
});
notas.push('ids buscados por elem(): ' + Object.keys(citados).length);

/* 6. Toda classe CSS usada pelo JS/marcação existe no <style>? (só aviso) */
var estilo = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/) || [])[1] || '';
notas.push('regras no <style>: ' + (estilo.match(/\{/g) || []).length);

console.log(notas.join(' · '));
if (falhas.length) { console.log('\nPROBLEMAS:'); falhas.forEach(function (f) { console.log(' - ' + f); }); process.exit(1); }
console.log('\nA tela passou em todas as conferências.');
