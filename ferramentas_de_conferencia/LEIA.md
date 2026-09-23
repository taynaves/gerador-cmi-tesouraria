# Ferramentas de conferência

Servem para conferir o código **antes** de pedir teste ao Taynã — é o caminho
descrito na seção 8 de `docs/00_estado_do_projeto.md`. As baterias precisam só
do Node; as duas últimas linhas abaixo são as que pedem biblioteca de fora.
Rodar da raiz do projeto:

```
node ferramentas_de_conferencia/conferir_tela.js  apps_script/04_Formulario_Tela.html /tmp
node ferramentas_de_conferencia/testar_etapa4.js  .
node ferramentas_de_conferencia/testar_tela.js    .
npm install jsdom playwright --no-save   # uma vez só, E AS DUAS NO MESMO
                                        # COMANDO: cada --no-save sozinho
                                        # desinstala a anterior
node ferramentas_de_conferencia/testar_gestos.js  .
node ferramentas_de_conferencia/medir_tela.js       # só quando mexer no CSS
```

| Arquivo | O que faz |
|---|---|
| `mock_planilha.js` | Simulador do Google Sheets. Estoura erro em mesclagem sobreposta — metade do valor dele está aí. |
| `testar_etapa4.js` | Monta as abas com os `.gs` de verdade e roda o formulário: 76 conferências de célula (extenso, PIA, CNPJ, cabeçalho, lote, assinantes, altura da folha). |
| `conferir_tela.js` | Confere `04_Formulario_Tela.html`: o JavaScript compila, nenhum `alert`/`confirm`, tags equilibradas, todo `elem('x')` tem um `id="x"`. |
| `testar_tela.js` | Roda a lógica da tela fora do navegador: filtro-ao-digitar, leitura de valores em reais, cascata das finalidades. |
| `testar_tela_viva.js` | Abre a tela de verdade num navegador de mentira (jsdom), com os dados de verdade vindos dos `.gs`. É a base do arquivo abaixo. |
| `montar_tela.js` | **Não é bateria, é peça.** Monta a tela como o servidor a monta — com as regras do `06_Tipos_E_Regras.gs` injetadas dentro. As três baterias da tela passam por ele: testar o arquivo `.html` cru deixaria passar justamente o defeito que não dá sinal nenhum. |
| `listar_combinacoes.js` | **Não é bateria, é ferramenta.** Lista as combinações de tipo · subtipo · forma · subforma que o sistema realmente permite, perguntando ao motor de regras par de contas por par. Gerou a árvore de `docs/11_prompt_finalidades.md` — escrever aquilo à mão foi o que custou uma rodada inteira. |
| `medir_tela.js` | **Não é bateria, é ferramenta** (precisa do playwright). Abre a tela num Chromium de verdade e mede: quanta altura ela pede em cada zoom do Chrome, a largura de cada coluna, se origem e destino ficaram lado a lado e se algum campo está cortando o texto por dentro. Três defeitos desta etapa só apareceram aqui — e um deles era um aviso que existia, estava certo, e era cortado pela borda do modal. **CSS não se discute, se mede.** |
| `testar_gestos.js` | **Os gestos**: digitar, sair do campo, clicar num item, clicar num botão. Foi ele que achou o defeito de sair do campo com Tab — que sozinho produzia cinco sintomas diferentes. É também onde vive **a prova de que a regra tem uma cópia só**: confere que as funções `nucleo*` que rodam na janela têm o texto IDÊNTICO ao do servidor, que o arquivo `.html` não define nenhuma delas, e que a montagem estoura se a marca sumir. |

Os `.gs` também passam por `node --check` (copiando para `.js` antes).
