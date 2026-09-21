# Ferramentas de conferência

Servem para conferir o código **antes** de pedir teste ao Taynã — é o caminho
descrito na seção 8 de `docs/00_estado_do_projeto.md`. Precisam só do Node
(nenhuma biblioteca de fora). Rodar da raiz do projeto:

```
node ferramentas_de_conferencia/conferir_tela.js  apps_script/04_Formulario_Tela.html /tmp
node ferramentas_de_conferencia/testar_etapa4.js  .
node ferramentas_de_conferencia/testar_tela.js    .
```

| Arquivo | O que faz |
|---|---|
| `mock_planilha.js` | Simulador do Google Sheets. Estoura erro em mesclagem sobreposta — metade do valor dele está aí. |
| `testar_etapa4.js` | Monta as abas com os `.gs` de verdade e roda o formulário: 76 conferências de célula (extenso, PIA, CNPJ, cabeçalho, lote, assinantes, altura da folha). |
| `conferir_tela.js` | Confere `04_Formulario_Tela.html`: o JavaScript compila, nenhum `alert`/`confirm`, tags equilibradas, todo `elem('x')` tem um `id="x"`. |
| `testar_tela.js` | Roda a lógica da tela fora do navegador: filtro-ao-digitar, leitura de valores em reais, cascata dos tipos. |

Os `.gs` também passam por `node --check` (copiando para `.js` antes).
