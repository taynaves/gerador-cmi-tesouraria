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

Quando o arquivo fica pronto abre uma janela com **três botões**: *Abrir o
PDF*, *Abrir a pasta* e *Fechar*. Numa janela comum do Sheets o endereço sai
como texto morto — dá para ler e não dá para clicar —, por isso esta é uma
janela de página, onde os dois primeiros são links de verdade.

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
| **Anotações das células** | **não** (`printnotes=false`) |

**As anotações vinham ligadas por padrão** e foi o que imprimiu um `[1]` ao
lado do valor por extenso e uma **segunda folha inteira** só com o texto da
anotação. As anotações existem para quem edita a planilha; no comprovante não
entram. As linhas de grade já estavam desligadas desde o começo.

*"Ajustar à largura/altura" (`scale` 2, 3 ou 4) muda o tamanho da letra e
acaba com a sobreposição com o comprovante do SIGA. Nunca trocar.*

## Uma diferença medida entre os dois caminhos

Exportar pelo código e imprimir pelo navegador **não dão exatamente o mesmo
PDF**. Medindo os dois lado a lado:

| | Arquivo → Imprimir | Pelo código |
|---|---|---|
| Posição das réguas | referência | **dentro de 1,2 pt** |
| Largura do documento | 526,5 pt | 528,7 pt (**+0,4%**) |
| Tamanho das letras | 6 · 7 · 8 · 12 pt | 5,85 · 6,83 · 7,8 · 11,7 pt (**×0,975**) |

Ou seja: **a letra sai 2,5% menor**, e nada mais muda de lugar de forma
perceptível. Não dá para compensar: o Apps Script só aceita tamanho de fonte
inteiro, e 6 ÷ 0,975 = 6,15, que ele arredondaria para 7 — o remédio seria
pior que a doença.

É um preço pequeno e conhecido, pago em troca de o documento **nunca mais
desformatar sozinho**. Fica registrado aqui porque foi medido, não estimado:
essa diferença de 0,975 é a mesma que apareceu numa exportação lá da Etapa 1
e que, na época, foi descartada por engano como erro de medição. Não era.

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

---

## Salvar o comprovante em planilha (Excel ou Google)

Além do PDF, o formulário salva o comprovante **em planilha**, na mesma pasta
e com o mesmo nome do PDF (`salvarCopiaDoComprovante_`, no mesmo arquivo):

| Escolha | O que é salvo |
|---|---|
| **Excel (.xlsx)** | um arquivo `.xlsx` na pasta |
| **Planilha do Google** | uma planilha do Google na pasta |

O caminho é o mesmo nos dois: a aba **Comprovante** é copiada para uma
planilha nova, com uma aba só. No caso do Excel, essa planilha é exportada
(`export?format=xlsx`) e vai para a lixeira em seguida; no caso do Google, ela
própria se muda para a pasta.

Três coisas decididas aqui:

- **A cópia é da ABA, e não da planilha inteira.** Exportar a planilha com
  `format=xlsx` seria uma linha só — e levaria Cadastros, Histórico e o que
  mais houver. Quem pede o comprovante não está pedindo o cadastro de contas
  junto.
- **A planilha temporária some nos dois caminhos**, inclusive quando o Google
  recusa o pedido: senão cada tentativa que falha deixa um arquivo solto no
  Drive, com nome de comprovante.
- **A cópia não consome a Referência.** Quem queima o número é o PDF, que é o
  documento que vai ao SIGA. A cópia serve para editar, conferir ou arquivar.

E ela **não passa pela conferência da grade** (os 694 × 1045 px): aquelas
medidas existem para o documento não virar duas folhas, e planilha não tem
folha. As margens de impressão também não vão junto — elas não ficam guardadas
na planilha, que é a razão de este arquivo existir.
