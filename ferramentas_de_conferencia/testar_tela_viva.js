/* Roda a TELA de verdade, num navegador de mentira (jsdom), com os dados de
   verdade vindos dos .gs. É o que faltava: até aqui dava para testar as
   funções soltas da tela, mas não o que acontece quando alguém clica.
   Instalar uma vez:  npm install jsdom --no-save            */
var fs=require('fs'), vm=require('vm'), path=require('path');
var { JSDOM } = require('jsdom');
var M=require(path.resolve(__dirname,'mock_planilha.js'));

/* ---- 1. os dados, tirados dos .gs com o simulador da planilha ---------- */
function dadosDeVerdade() {
  var planilha=new M.Planilha(), propriedades={}, copias=[], lixo=[];
  /* A pasta guarda os arquivos (PDFs e o .md de recuperação) — a emissão
     procura o .md pelo nome antes de gravar, e uma pasta que não soubesse
     procurar faria o .md virar aviso em toda geração. */
  var naPasta=[];
  function arquivo(nome,conteudo){var a={nome:nome,conteudo:conteudo,id:'ARQUIVO-'+(naPasta.length+1)};
    a.getUrl=function(){return 'https://drive.exemplo/'+a.id;};a.getId=function(){return a.id;};
    a.getName=function(){return a.nome;};a.setContent=function(t){a.conteudo=t;return a;};
    naPasta.push(a);return a;}
  var pasta={getName:function(){return 'Pasta de teste';},
    getUrl:function(){return 'https://drive.exemplo/pasta';},
    createFile:function(b,c){return typeof b==='string'?arquivo(b,c):arquivo(b.nome,'%PDF');},
    getFilesByName:function(n){var achados=naPasta.filter(function(a){return a.nome===n;});
      return {hasNext:function(){return achados.length>0;},next:function(){return achados.shift();}};}};
  var ctx={console:console,JSON:JSON,Math:Math,Date:Date,Number:Number,String:String,
    Object:Object,Array:Array,RegExp:RegExp,isFinite:isFinite,Error:Error,setTimeout:setTimeout,
    SpreadsheetApp:{getActive:function(){return planilha;},getActiveSpreadsheet:function(){return planilha;},
      flush:function(){},
      /* A planilha temporária da cópia em Excel/Google. */
      create:function(nome){var nova=new M.Planilha();nova.idDoArquivo='COPIA-'+(copias.length+1);
        nova.nomeDoArquivo=nome;nova.insertSheet('Página1');copias.push(nova);return nova;},
      getUi:function(){return {alert:function(){},ButtonSet:{OK:'OK'},Button:{OK:'OK'}};},
      newDataValidation:function(){var b={requireValueInList:function(){return b;},setAllowInvalid:function(){return b;},
        setHelpText:function(){return b;},build:function(){return {};}};return b;},
      WrapStrategy:{CLIP:'CLIP',WRAP:'WRAP',OVERFLOW:'OVERFLOW'},BorderStyle:{SOLID:'S',SOLID_MEDIUM:'M',SOLID_THICK:'T'},
      ProtectionType:{RANGE:'RANGE'}},
    Utilities:{base64Encode:function(bytes){return Buffer.from(bytes).toString('base64');},
      sleep:function(){},
      formatDate:function(d,f,fmt){var dd=('0'+d.getDate()).slice(-2),mm=('0'+(d.getMonth()+1)).slice(-2),a=d.getFullYear();
      var hh=('0'+d.getHours()).slice(-2),mi=('0'+d.getMinutes()).slice(-2),ss=('0'+d.getSeconds()).slice(-2);
      return fmt.replace('yyyy',a).replace('dd',dd).replace('MM',mm).replace('yy',String(a).slice(-2))
        .replace('HH',hh).replace('mm',mi).replace('ss',ss);}},
    PropertiesService:{getDocumentProperties:function(){return {setProperty:function(k,v){propriedades[k]=v;},
      getProperty:function(k){return propriedades[k]||null;}};}},
    HtmlService:{
      createHtmlOutput:function(texto){return {conteudo:texto,setWidth:function(){return this;},
        setHeight:function(){return this;},getContent:function(){return this.conteudo;}};},
      createHtmlOutputFromFile:function(nome){
        var texto=fs.readFileSync(path.join('apps_script',nome+'.html'),'utf8');
        return {setWidth:function(){return this;},setHeight:function(){return this;},
                getContent:function(){return texto;}};}},
    /* O PDF não é baixado nem salvo: o que interessa aqui é o caminho, não o
       arquivo. Sem estes simulacros, "gerar o PDF" estoura e o teste acusa
       defeito no lugar errado. */
    DriveApp:{
      getFileById:function(id){
        var achada=null; copias.forEach(function(c){ if(c.getId()===id) achada=c; });
        if(achada) return {getUrl:function(){return 'https://docs.exemplo/'+achada.getId();},
          moveTo:function(pasta){achada.pastaFinal=pasta.getName();return this;},
          setTrashed:function(){lixo.push(achada.getId());return this;}};
        return {getParents:function(){return {hasNext:function(){return false;}};}};},
      getRootFolder:function(){return pasta;},
      getFolderById:function(){throw new Error('MOCK: pasta indicada nao existe no teste');}},
    UrlFetchApp:{fetch:function(){return {getResponseCode:function(){return 200;},
      getBlob:function(){return {setName:function(n){return {nome:n};},
        getBytes:function(){return [80,75,3,4];}};}};}},
    ScriptApp:{getOAuthToken:function(){return 't';}},
    Sheets: M.servicoSheetsDeMentira(planilha)};
  vm.createContext(ctx);
  ['00_Escrita_Rapida','01_Layout_Comprovante','02_Cadastros','03_Formulas_Validacoes','04_Formulario','05_Gerar_PDF','06_Tipos_E_Regras','07_Relatorio_Mensal']
    .forEach(function(n){ vm.runInContext(fs.readFileSync(path.join('apps_script',n+'.gs'),'utf8'),ctx,{filename:n+'.gs'}); });
  ctx.criarAbaCadastros(); ctx.criarLayoutComprovante();
  return { dados: ctx.dadosDoFormulario(), servidor: ctx, pasta: naPasta };
}

/* ---- 2. a tela, dentro do jsdom ---------------------------------------- */
function abrirTela(dados, servidor) {
  /* A tela montada, com o núcleo das regras injetado pelo servidor. */
  return abrirTelaDoHtml(require(path.resolve(__dirname,'montar_tela.js')).montar('.'), dados, servidor);
}

/* A mesma, a partir de um HTML já montado — para testar as trocas de uma
   linha que o servidor faz (aba inteira, aberta pelo menu). */
function abrirTelaDoHtml(html, dados, servidor) {
  var dom=new JSDOM(html,{ runScripts:'dangerously', pretendToBeVisual:true,
    beforeParse:function(janela){
      janela.google={ script:{
        run:(function(){
          var api={ _ok:null, _erro:null,
            withSuccessHandler:function(f){api._ok=f;return api;},
            withFailureHandler:function(f){api._erro=f;return api;},
            dadosDoFormulario:function(){ setTimeout(function(){ api._ok(JSON.parse(JSON.stringify(dados))); },0); },
            preencherComprovante:function(mov){ chamarServidor(api,'preencherComprovante',mov); },
            preencherEGerarPdf:function(mov){ chamarServidor(api,'preencherEGerarPdf',mov); },
            acrescentarFinalidadeDoFormulario:function(pedido){
              chamarServidor(api,'acrescentarFinalidadeDoFormulario',pedido); },
            salvarCopiaDoFormulario:function(formato){
              chamarServidor(api,'salvarCopiaDoFormulario',formato); } };
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

module.exports={ dadosDeVerdade, abrirTela, abrirTelaDoHtml, esperar, digitarNoCombo, abrirCombo,
                 escolherNoCombo, avisosNaTela };
