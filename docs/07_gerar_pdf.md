# Gerar o arquivo — o PDF, e a cópia em planilha

Fica em `apps_script/05_Gerar_PDF.gs`.

---

## 1. Por que não se usa Arquivo → Imprimir

Os ajustes de impressão do Google Sheets — **margens, orientação, escala,
linhas de grade** — **não ficam guardados na planilha**. Ficam no navegador de
cada pessoa, e o Google os redefine sozinho de tempos em tempos.

Consequências, todas já vividas:

- você ajusta tudo, gera o PDF, e dias depois está desconfigurado de novo;
- outro diácono abre a mesma planilha e imprime com os ajustes dele;
- **ninguém percebe na hora**: o PDF sai bonitinho, só que com a letra de
  outro tamanho, ou em duas folhas.

**Não existe comando do Apps Script que trave esses ajustes.** A caixa de
impressão do Sheets não é programável.

## 2. O PDF sai por código

> **Tesouraria CMI → Gerar PDF do comprovante** — ou, no formulário,
> **Preencher e gerar o PDF**.

Cada ajuste vai escrito no próprio pedido, e vive em `EXPORTACAO_PDF`:

| Ajuste | Valor, fixo no código |
|---|---|
| Papel | A4 |
| Orientação | Retrato |
| Escala | **Normal (100%)** (`scale=1`) |
| Margens | topo 0,97 · base 0,97 · esquerda 1,02 · direita 0,89 cm |
| Alinhamento | horizontal centro · vertical acima |
| Linhas de grade | não |
| Nome da planilha, nome da aba, número de página | não |
| **Anotações das células** | **não** (`printnotes=false`) |

**As anotações vinham ligadas por padrão**, e foi o que imprimiu um `[1]` ao
lado do extenso e uma **segunda folha inteira** só com o texto da anotação. As
anotações existem para quem edita a planilha; no comprovante não entram.

*"Ajustar à largura/altura" muda o tamanho da letra e acaba com a sobreposição
com o comprovante do SIGA. Nunca trocar.*

## 3. A diferença medida entre os dois caminhos

Exportar pelo código e imprimir pelo navegador **não dão exatamente o mesmo
PDF**. Medindo os dois lado a lado:

| | Arquivo → Imprimir | Pelo código |
|---|---|---|
| Posição das réguas | referência | **dentro de 1,2 pt** |
| Largura do documento | 526,5 pt | 528,7 pt (**+0,4%**) |
| Tamanho das letras | 6 · 7 · 8 · 12 pt | 5,85 · 6,83 · 7,8 · 11,7 pt (**×0,975**) |

**A letra sai 2,5% menor**, e nada mais muda de lugar de forma perceptível.
Não dá para compensar: o Apps Script só aceita tamanho de fonte **inteiro**, e
6 ÷ 0,975 = 6,15, que ele arredondaria para 7 — o remédio seria pior que a
doença.

É um preço pequeno e conhecido, pago em troca de o documento **nunca mais
desformatar sozinho**. Fica registrado porque foi **medido**: essa mesma
diferença de 0,975 apareceu numa exportação da Etapa 1 e, na época, foi
descartada por engano como erro de medição. Não era.

## 4. A conferência que vem antes

Antes de gerar, o sistema mede as duas coisas que fazem o documento virar duas
folhas — as duas que já quebraram o layout na prática:

| Medida | Limite | Se passar |
|---|---|---|
| Largura das colunas | **694 px** | o PDF **vaza de lado** |
| Linhas visíveis | **1045 px** | o PDF vaza para baixo |

Fora da medida, ele **mostra o que está errado e pergunta se gera assim
mesmo** — avisa, não bloqueia. Para conferir sem gerar nada: **Conferir o
layout antes de gerar**.

O `criarLayoutComprovante` é mais duro: **recusa rodar** se a soma das colunas
não fechar em 694 px. Ali é erro de programação, não de uso.

## 5. Onde o arquivo é salvo, e com que nome

Na pasta indicada em `PASTA_DRIVE_PADRAO` (bloco CONTROLE da aba Cadastros —
aceita o id ou o link inteiro copiado do Drive); vazia, na **mesma pasta da
planilha**.

O nome é `CMI-[referência]-[ETAPA] - [AA]_[MM]_[DD].pdf`. A barra da
referência vira hífen, porque barra em nome de arquivo confunde o Drive.
**A regra do nome mora num lugar só** (`nomeDoArquivoPdf_`) — a cópia em
planilha usa a mesma.

Quando fica pronto, o resultado aparece **na faixa verde e numa caixa de
diálogo**, com *Abrir o PDF*, *Abrir a pasta* e *"Saiu errado? Corrigir e
gerar de novo com CMP-26/…"* — esse último devolve o mesmo número, sem queimar
outro. São links de verdade: numa janela do Apps Script é assim que se abre
outra aba.

**Gerar o PDF consome a Referência** (menos em 2ª via). É o documento que vai
ao SIGA.

## 6. A cópia do comprovante em planilha

Além do PDF, o formulário salva o comprovante **em planilha**, com o **mesmo
nome** do PDF. Os dois caminhos terminam em **lugares diferentes**, e a tela
diz isso antes e depois:

| | Onde o arquivo fica | O que não acontece |
|---|---|---|
| **Baixar em Excel (.xlsx)** | no computador de quem clicou, na pasta Downloads | não fica nada no Drive |
| **Salvar planilha do Google na pasta** | na pasta do Drive, junto dos PDFs | não baixa nada |

O caminho é o mesmo nos dois até certo ponto: a aba **Comprovante** é copiada
para uma planilha nova, com uma aba só. No caso do Excel, essa planilha é
exportada (`export?format=xlsx`), os bytes voltam para a tela e ela vai para a
lixeira; no caso do Google, ela própria se muda para a pasta.

Quatro decisões:

- **A cópia é da ABA, não da planilha inteira.** Exportar a planilha com
  `format=xlsx` seria uma linha só — e levaria Cadastros, Histórico e o que
  mais houver. Quem pede o comprovante não está pedindo o cadastro de contas
  junto.
- **A planilha temporária some nos dois caminhos**, inclusive quando o Google
  recusa o pedido: senão cada tentativa que falha deixa um arquivo solto no
  Drive, com nome de comprovante.
- **A cópia não consome a Referência.** Quem queima o número é o PDF. Salvar
  um Excel para dar uma olhada não pode gastar o número de um comprovante que
  nunca existiu.
- **Ela não passa pela conferência da grade**, de propósito: aquelas duas
  medidas existem para o documento não virar duas folhas, e planilha não tem
  folha. As margens de impressão também não vão junto — elas não ficam
  guardadas na planilha, que é a razão de este arquivo existir.

### O `.xlsx` não passa pelo Drive

Ele chegou a ser salvo na pasta e oferecido por um endereço de download do
Drive (`uc?export=download`) — e **o botão não funcionava**. Aquele endereço
depende de sessão, de permissão e de um redirecionamento do Google que muda de
tempos em tempos: é o caminho errado para entregar um arquivo que o script
**já tem na mão**.

Hoje os bytes voltam com a resposta (`Utilities.base64Encode`), a tela remonta
o arquivo num `Blob` e o navegador salva. Medido em Chromium — inclusive
**dentro de um quadro com o mesmo `sandbox` que o Google usa**, que era onde
isso podia morrer sem aviso.

**Uma página da web não consegue abrir o Excel**, e a caixa diz isso em vez de
fingir: o arquivo vai para Downloads, e é de lá que ele abre no programa. A
planilha do Google abre direto — ali o Google é o programa.

## 7. O que ainda falta na Etapa 5

- gerar os **2 ou 3 PDFs de uma vez**, um por etapa, com o Status certo;
- **trocar o cabeçalho** no PDF de Recebimento quando as ADMs forem diferentes;
- salvar o **arquivo `.md` de recuperação** ao lado de cada PDF;
- gravar no **Histórico**.
