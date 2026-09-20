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

Rodar de novo é seguro: a função apaga e redesenha a aba inteira do zero.
**Por isso, nunca ajuste a aba "Comprovante" à mão** — o ajuste se perde no
próximo `criarLayoutComprovante`. Mudanças de layout se pedem no código.

Depois de rodar, o menu **Tesouraria CMI** oferece duas visualizações:
"Ver como lançamento único" e "Ver como lançamento em lote (5 linhas)".

## Ajustes de impressão (Arquivo → Imprimir)

| Ajuste | Valor |
|---|---|
| Tamanho do papel | A4 |
| Orientação | Retrato |
| Escala | **Normal (100%)** |
| Margens | Personalizadas: topo 0,97 cm · base 0,97 cm · esquerda 1,02 cm · direita 0,89 cm |
| Alinhamento | Horizontal: Centro · Vertical: Acima |
| Linhas de grade | desmarcado |

"Ajustar à largura" e "ajustar à altura" mudam o tamanho da letra — não usar.

## As quatro regras do Sheets que este layout respeita

Medidas tiradas de exportações reais. Ignorá-las foi o que fez a primeira
tentativa estourar para 4 páginas:

1. 1 pixel de linha/coluna = **0,75 pt** no PDF.
2. O tamanho da fonte sai exato, mas **só aceita número inteiro** — o Apps
   Script arredonda 7,18 para 8. Nunca usar tamanho fracionado.
3. Topo do texto = `topo_da_linha + (altura − 1,25 × fonte) / 2 − 0,37 pt`.
4. Bordas só existem em 0,75 / 1,5 / 2,25 pt. O documento usa **0,75 em
   todas as réguas**.

## Decisões registradas nesta etapa

- **Referência visual:** `docs/referencia_layout_aprovado.pdf` (aprovado pelo
  Taynã), nascido do comprovante do SIGA. O código reproduz esse PDF: as 49
  réguas caem nas mesmas posições (diferença de até 0,2 pt) e os campos
  dentro de 1,8 pt.
- **Fontes:** Tahoma 6 pt no corpo, 8 pt no tipo e nos nomes dos signatários,
  7 pt na entidade, 12 pt no título.
- **Grade:** 19 colunas (A..S, 694 px) e linhas com nome. Mapa completo em
  `docs/02_especificacao_campos.md`.
- **Título automático:** movimentação dentro da mesma PIA →
  "COMPROVANTE DE MOVIMENTAÇÃO INTERNA"; entre PIAs diferentes →
  "COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS".
- **Rótulo do tipo:** "Tipo Transferência:", como no SIGA.
- **Rodapé:** identificação do formulário em pé na lateral esquerda; nota das
  3 assinaturas abaixo da régua do rodapé.
- **Tabela do lote** só aparece em lote, com uma linha por lançamento; a
  sobra da folha fica entre a tabela e as assinaturas, que ficam sempre no pé.
- **Valores preenchidos são exemplo.** Para gerar em branco, troque
  `PREENCHER_EXEMPLO` para `false`.
