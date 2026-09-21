/* Roda a TELA de verdade, num navegador de mentira (jsdom), com os dados de
   verdade vindos dos .gs. É o que faltava: até aqui dava para testar as
   funções soltas da tela, mas não o que acontece quando alguém clica.
   Instalar uma vez:  npm install jsdom --no-save            */
var fs=require('fs'), vm=require('vm'), path=require('path');
var { JSDOM } = require('jsdom');
var M=require(path.resolve(__dirname,'mock_planilha.js'));

/* ---- 1. os dados, tirados dos .gs com o simulador da planilha ---------- */
function dadosDeVerdade() {
  var planilha=new M.Planilha(), propriedades={};
  var ctx={console:console,JSON:JSON,Math:Math,Date:Date,Number:Number,String:String,
    Object:Object,Array:Array,RegExp:RegExp,isFinite:isFinite,Error:Error,setTimeout:setTimeout,
    SpreadsheetApp:{getActive:function(){return planilha;},getActiveSpreadsheet:function(){return planilha;},
      flush:function(){},getUi:function(){return {alert:function(){},ButtonSet:{OK:'OK'},Button:{OK:'OK'}};},
      newDataValidation:function(){var b={requireValueInList:function(){return b;},setAllowInvalid:function(){return b;},
        setHelpText:function(){return b;},build:function(){return {};}};return b;},
      WrapStrategy:{CLIP:'CLIP',WRAP:'WRAP'},BorderStyle:{SOLID:'S',SOLID_MEDIUM:'M',SOLID_THICK:'T'},
      ProtectionType:{RANGE:'RANGE'}},
    Utilities:{formatDate:function(d,f,fmt){var dd=('0'+d.getDate()).slice(-2),mm=('0'+(d.getMonth()+1)).slice(-2),a=d.getFullYear();
      return fmt.replace('yyyy',a).replace('dd',dd).replace('MM',mm).replace('yy',String(a).slice(-2));}},
    PropertiesService:{getDocumentProperties:function(){return {setProperty:function(k,v){propriedades[k]=v;},
      getProperty:function(k){return propriedades[k]||null;}};}},
    HtmlService:{createHtmlOutputFromFile:function(){return {setWidth:function(){return this;},setHeight:function(){return this;}};}},
    /* O PDF não é baixado nem salvo: o que interessa aqui é o caminho, não o
       arquivo. Sem estes simulacros, "gerar o PDF" estoura e o teste acusa
       defeito no lugar errado. */
    DriveApp:{
      getFileById:function(){return {getParents:function(){return {hasNext:function(){return false;}};}};},
      getRootFolder:function(){return {getName:function(){return 'Pasta de teste';},
        getUrl:function(){return 'https://drive.exemplo/pasta';},
        createFile:function(){return {getUrl:function(){return 'https://drive.exemplo/arquivo';}};}};},
      getFolderById:function(){throw new Error('MOCK: pasta indicada nao existe no teste');}},
    UrlFetchApp:{fetch:function(){return {getResponseCode:function(){return 200;},
      getBlob:function(){return {setName:function(n){return {nome:n};}};}};}},
    ScriptApp:{getOAuthToken:function(){return 't';}},
    Sheets: M.servicoSheetsDeMentira(planilha)};
  vm.createContext(ctx);
  ['00_Escrita_Rapida','01_Layout_Comprovante','02_Cadastros','03_Formulas_Validacoes','04_Formulario','05_Gerar_PDF']
    .forEach(function(n){ vm.runInContext(fs.readFileSync(path.join('apps_script',n+'.gs'),'utf8'),ctx,{filename:n+'.gs'}); });
  ctx.criarAbaCadastros(); ctx.criarLayoutComprovante();
  return { dados: ctx.dadosDoFormulario(), servidor: ctx };
}

/* ---- 2. a tela, dentro do jsdom ---------------------------------------- */
function abrirTela(dados, servidor) {
  var html=fs.readFileSync(path.join('apps_script','04_Formulario_Tela.html'),'utf8');
  var dom=new JSDOM(html,{ runScripts:'dangerously', pretendToBeVisual:true,
    beforeParse:function(janela){
      janela.google={ script:{
        run:(function(){
          var api={ _ok:null, _erro:null,
            withSuccessHandler:function(f){api._ok=f;return api;},
            withFailureHandler:function(f){api._erro=f;return api;},
            dadosDoFormulario:function(){ setTimeout(function(){ api._ok(JSON.parse(JSON.stringify(dados))); },0); },
            preencherComprovante:function(mov){ chamarServidor(api,'preencherComprovante',mov); },
            preencherEGerarPdf:function(mov){ chamarServidor(api,'preencherEGerarPdf',mov); } };
          function chamarServidor(api,nome,mov){
            var ok=api._ok, erro=api._erro;
            setTimeout(function(){
              try { ok(JSON.parse(JSON.stringify(servidor[nome](mov)))); }
              catch(e){ erro({message:e.message}); }
            },0);
          }
          return api;
        })(),
        host:{ close:function(){} } } };
      janela.HTMLElement.prototype.scrollIntoView=function(){};
      janela.scrollTo=function(){};
    }});
  return dom;
}

/* ---- 3. gestos ---------------------------------------------------------- */
function esperar(ms){ return new Promise(function(r){ setTimeout(r,ms||30); }); }

/** Digita num combo e devolve as linhas que aparecem na lista. */
function digitarNoCombo(janela, idDoCombo, texto) {
  var caixa=janela.document.getElementById(idDoCombo);
  var entrada=caixa.querySelector('.combo-entrada');
  entrada.focus();
  entrada.value=texto;
  entrada.dispatchEvent(new janela.Event('input',{bubbles:true}));
  return Array.prototype.map.call(caixa.querySelectorAll('.combo-item'),
    function(el){ return el.querySelector('b').textContent; });
}

/** Abre a lista de um combo sem digitar nada (como um clique no campo). */
function abrirCombo(janela, idDoCombo) {
  var caixa=janela.document.getElementById(idDoCombo);
  var entrada=caixa.querySelector('.combo-entrada');
  entrada.dispatchEvent(new janela.Event('focus',{bubbles:true}));
  return Array.prototype.map.call(caixa.querySelectorAll('.combo-item'),
    function(el){ return el.querySelector('b').textContent; });
}

/** Escolhe um item da lista, como um clique do mouse. */
function escolherNoCombo(janela, idDoCombo, textoProcurado) {
  var caixa=janela.document.getElementById(idDoCombo);
  var entrada=caixa.querySelector('.combo-entrada');
  entrada.focus();
  entrada.value=textoProcurado;
  entrada.dispatchEvent(new janela.Event('input',{bubbles:true}));
  var itens=caixa.querySelectorAll('.combo-item');
  if(!itens.length) throw new Error('nada na lista de "'+idDoCombo+'" para "'+textoProcurado+'"');
  var ev=new janela.MouseEvent('mousedown',{bubbles:true,cancelable:true});
  itens[0].dispatchEvent(ev);
  return itens[0].querySelector('b').textContent;
}

function avisosNaTela(janela){
  return Array.prototype.map.call(janela.document.querySelectorAll('#avisos .aviso'),
    function(el){ return el.className.replace('aviso ','')+': '+el.querySelector('b').textContent; });
}

module.exports={ dadosDeVerdade, abrirTela, esperar, digitarNoCombo, abrirCombo,
                 escolherNoCombo, avisosNaTela };
