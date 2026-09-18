# apps_script/ — o código que roda dentro da planilha

Cada arquivo `.gs` aqui é uma **etapa** do projeto. Eles são colados dentro da
planilha do Google (menu **Extensões → Apps Script**), um por vez, na ordem.

| Arquivo | Etapa | O que faz |
|---|---|---|
| `01_Layout_Comprovante.gs` | 1 | Desenha a aba "Comprovante" (só o visual) |

## Etapa 1 — como usar

1. Abra a planilha no Google Sheets.
2. Menu **Extensões → Apps Script**.
3. Apague o conteúdo do arquivo `Código.gs` e cole o conteúdo de
   `01_Layout_Comprovante.gs`.
4. Salve (ícone do disquete) e rode a função `criarLayoutComprovante`.
5. Na primeira vez o Google pede autorização — é esperado (ver as instruções
   passo a passo na conversa).

Rodar de novo é seguro: a função apaga e redesenha a aba inteira do zero.

## Decisões registradas nesta etapa

- **Medidas.** Larguras de coluna, alturas de linha, mesclagens, fontes e
  bordas foram extraídas célula a célula do
  `docs/modelo_visual_original.xlsx`, não estimadas.
- **Orientação: retrato (em pé), não paisagem.** O
  `docs/02_especificacao_campos.md` (seção 6) diz "paisagem", mas tanto o
  `.xlsx` original quanto o `docs/exemplo_preenchido_referencia.pdf` (A4
  595x842pt, 1 página) são **retrato**. O layout foi construído com 790px de
  largura total, que é a largura do modelo e cabe em A4 retrato.
- **Tabela de detalhamento (linhas 15–48) e linha de TOTAL (49)** não existem
  no modelo em Excel — são a área livre que o
  `docs/02_especificacao_campos.md` (seção 4) manda usar para o comprovante
  agrupado. 33 linhas de lançamento, dentro do limite de "30–35" previsto.
- **Valores preenchidos são exemplo**, iguais aos do modelo original, para
  permitir conferência lado a lado. Para gerar em branco, troque
  `PREENCHER_EXEMPLO` para `false` no início do arquivo.
