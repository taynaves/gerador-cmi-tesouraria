/* MONTA A TELA COMO O SERVIDOR A MONTA.
   O arquivo 04_Formulario_Tela.html sozinho não é a janela: as regras de
   tipos entram nele na hora de abrir, vindas do 06_Tipos_E_Regras.gs (ver o
   cabeçalho daquele arquivo). Quem testa a tela tem de testar a tela MONTADA
   -- é a armadilha do CLAUDE.md: HTML gerado com erro de sintaxe abre
   normalmente e não funciona nenhum botão, sem mensagem nenhuma.
   Este módulo faz aqui o mesmo que `telaComAsRegras_` faz no Google. */
var fs = require('fs'), vm = require('vm'), path = require('path');

/** Carrega o 06_Tipos_E_Regras.gs num contexto solto e devolve o que ele expõe. */
function regras(raiz) {
  var ctx = { console: console, String: String, Number: Number, Object: Object,
              Array: Array, RegExp: RegExp, Math: Math, JSON: JSON, Error: Error };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(raiz || '.', 'apps_script', '06_Tipos_E_Regras.gs'), 'utf8'),
                  ctx, { filename: '06_Tipos_E_Regras.gs' });
  return ctx;
}

/** Cola o núcleo dentro de um HTML já lido. */
function injetar(html, raiz) {
  var ctx = regras(raiz);
  if (html.indexOf(ctx.MARCA_DO_NUCLEO) < 0) {
    throw new Error('a tela está sem a marca "' + ctx.MARCA_DO_NUCLEO + '" — o núcleo não tem onde entrar');
  }
  var codigo = ctx.regrasParaATela_();
  return html.replace(ctx.MARCA_DO_NUCLEO, function () { return codigo; });
}

/** A tela montada, do jeito que o Google a entrega ao navegador. */
function montar(raiz) {
  var html = fs.readFileSync(path.join(raiz || '.', 'apps_script', '04_Formulario_Tela.html'), 'utf8');
  return injetar(html, raiz);
}

module.exports = { montar: montar, injetar: injetar, regras: regras };
