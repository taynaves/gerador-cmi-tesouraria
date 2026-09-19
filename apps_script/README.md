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

## Conferência do PDF (escala e margens)

Para a sobreposição com o comprovante do SIGA bater, exportar **sempre**
assim (Arquivo → Imprimir):

| Ajuste | Valor |
|---|---|
| Tamanho do papel | A4 |
| Orientação | Retrato |
| Escala | **Normal (100%)** |
| Margens | Personalizadas: topo 0,97 cm · base 0,97 cm · esquerda 1,02 cm · direita 0,89 cm |
| Linhas de grade | desmarcado |

"Ajustar à largura" e "ajustar à altura" mudam o tamanho da letra e quebram
a sobreposição — não usar.

## Decisões registradas nesta etapa

- **A referência visual é o comprovante do SIGA**
  (`docs/referencia_siga_comprovante.pdf`), não mais o `.xlsx`. Fonte Tahoma
  7 pt no corpo, 8 pt na entidade, 14 pt no título; réguas finas; margem de
  ~1 cm. Precisão alcançada: até 1,2 pt de diferença nos campos comuns.
- **Orientação retrato**, A4, uma folha.
- **A grade tem 14 colunas (A..N) e linhas com nome**, não mais 46 colunas
  fixas — cada limite de coluna existe para encaixar um campo na posição do
  SIGA. Mapa completo em `docs/02_especificacao_campos.md`.
- **A tabela do lote só aparece em lote**, com uma linha por lançamento.
- **Referência** (única) e **numeração SIGA** (opcional) são campos
  diferentes, com regras opostas de duplicidade.
- **Valores preenchidos são exemplo** — os do comprovante real do SIGA, para
  permitir a sobreposição. Para gerar em branco, troque `PREENCHER_EXEMPLO`
  para `false`; para usar o título do CMI em vez do título do SIGA, troque
  `MODO_SOBREPOSICAO_SIGA` para `false`.
