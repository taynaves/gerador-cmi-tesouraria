# Gerar o PDF sem desformatar (Etapa 5, primeira parte)

## O problema

Os ajustes de impressão do Google Sheets — **margens, orientação, escala,
linhas de grade** — **não ficam guardados na planilha**. Ficam no navegador
de cada pessoa, e o Google os redefine sozinho de tempos em tempos.

Consequências, todas já vividas:

- você ajusta tudo, gera o PDF, e dias depois está desconfigurado de novo;
- outro diácono abre a mesma planilha e imprime com os ajustes dele;
- ninguém percebe na hora: o PDF sai bonitinho, só que com a letra de outro
  tamanho ou em duas folhas.

**Não existe comando do Apps Script que trave esses ajustes.** A caixa de
impressão do Sheets simplesmente não é programável.

## A solução: parar de usar Arquivo → Imprimir

O PDF passa a ser pedido **pelo código**, com cada ajuste escrito no próprio
pedido. Menu:

> **Tesouraria CMI → Gerar PDF do comprovante**

Margem, orientação e escala passam a viver em `EXPORTACAO_PDF`, no arquivo
`apps_script/05_Gerar_PDF.gs`. Ninguém esbarra neles, e o PDF sai igual em
qualquer computador, de qualquer diácono, em qualquer dia.

| Ajuste | Valor, fixo no código |
|---|---|
| Papel | A4 |
| Orientação | Retrato |
| Escala | **Normal (100%)** (`scale=1`) |
| Margens | topo 0,97 · base 0,97 · esquerda 1,02 · direita 0,89 cm |
| Alinhamento | Horizontal Centro · Vertical Acima |
| Linhas de grade | não |
| Nome da planilha, nome da aba, número de página | não |

*"Ajustar à largura/altura" (`scale` 2, 3 ou 4) muda o tamanho da letra e
acaba com a sobreposição com o comprovante do SIGA. Nunca trocar.*

## A conferência que vem junto

Antes de gerar, o sistema mede as duas coisas que fazem o documento virar
duas folhas — e que já quebraram o layout na prática:

| Medida | Limite | O que acontece se passar |
|---|---|---|
| Largura das colunas | **694 px** | o PDF **vaza de lado** e sai em duas folhas |
| Linhas visíveis | **1045 px** | o PDF vaza para baixo |

Se alguma estiver fora, ele **mostra o que está errado e pergunta se gera
assim mesmo** — avisa, não bloqueia. Para conferir sem gerar nada:
**Tesouraria CMI → Conferir o layout antes de gerar**.

O `criarLayoutComprovante` também confere a soma das colunas e **recusa
rodar** se ela não fechar em 694 px: é erro de programação, não de uso.

## Onde o arquivo é salvo

Na **mesma pasta da planilha**, ou na pasta indicada em
`PASTA_DRIVE_PADRAO` (bloco CONTROLE da aba Cadastros — aceita tanto o ID da
pasta quanto o link inteiro copiado do Drive).

Nome: `CMI-[referência]-[ETAPA] - [AA]_[MM]_[DD].pdf`, com a barra da
referência virando hífen (`CMP-26/001` → `CMP-26-001`), porque barra em nome
de arquivo confunde o Drive.

A hora de emissão do rodapé é **carimbada no instante de gerar** — é ela que
vale no documento.

## Autorização nova, na primeira vez

Para pedir o PDF e salvar no Drive, o script precisa de duas permissões que
ele ainda não tinha. Na primeira vez o Google vai perguntar. É esperado.

## O que ainda falta na Etapa 5

- gerar os **2 ou 3 PDFs** da movimentação, um por etapa, com o Status certo;
- trocar o cabeçalho no PDF de **Recebimento** (ADM de destino);
- consumir a Referência e gravar no Histórico;
- salvar o arquivo **`.md` de recuperação** ao lado do PDF.
