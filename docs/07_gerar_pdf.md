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

> **Tesouraria • CMP p/ SIGA → Gerar PDF do comprovante** — ou, no formulário,
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

## 5. Os 2 ou 3 PDFs de uma vez — e a caixa de escolher quais

> **Pelo menu, pela janela ou pela aba inteira: o mesmo caminho.** O botão
> **Preencher e gerar os PDFs…** (e o menu **Tesouraria • CMP p/ SIGA → Gerar PDF do
> comprovante**) abre uma caixa que pergunta **quais PDFs gerar**.

A caixa mostra uma marcação por etapa — `APROVADA → EFETIVADA` na mesma PIA,
`APROVADA → PAGA → RECEBIDA` entre PIAs diferentes — **todas marcadas**, e
um botão que diz quantos vão sair (*Gerar 3 PDFs*, *Gerar 2 PDFs*…). Dá para
gerar **uma, duas quaisquer ou todas**. Cada PDF sai com o **Status** da sua
etapa e com os **assinantes** dela (quando a resposta ao "são os mesmos?"
foi não). Pedido dele, depois de testar a primeira versão.

Três decisões da caixa:

- **Todas vêm marcadas, sempre, e ela não guarda a escolha da vez
  anterior.** A primeira versão tinha um seletor no formulário que lembrava
  a escolha, e ele caía numa armadilha: a janela abria sem contas, ficava
  marcada a única etapa que existia, e quando as contas chegavam saía **um**
  PDF em vez de três. Desmarcar é um gesto de propósito, feito na hora.
- **Nada marcado apaga o botão** ("Marque ao menos uma"): gerar zero PDFs não
  é escolha.
- **Sem as duas contas, ou com uma regra entre contas quebrada, a caixa
  explica** em vez de oferecer um botão que o servidor recusaria.

**A ordem é a da movimentação**, não a das marcações: marcar RECEBIDA e
APROVADA gera a APROVADA primeiro. E etapa que não existe na movimentação
(PAGA numa mesma PIA) é **erro dito**, não zero PDFs calados.

**O formulário não escolhe etapa**: o **rodapé** mostra quantos a
movimentação tem ("**3 PDFs** · APROVADA → PAGA → RECEBIDA"), destacado, do
lado oposto aos botões — pedido dele: num lugar que chame a atenção, e o
rodapé é o único sempre à vista. **Preencher o comprovante** põe na aba a
**1ª etapa** — é o custo, dito a ele: para ver outra etapa, só gerando o PDF
dela.

**O menu mudou de comportamento.** Antes, "Gerar PDF do comprovante" fazia
um PDF do que estivesse na aba, **sem Histórico, sem `.md` e sem consumir
número** — um caminho paralelo que deixava a numeração para trás. Agora ele
abre o formulário (no último preenchimento, com a Referência de agora) com a
caixa por cima, e dali o caminho é o mesmo do botão. O nome da função
(`gerarPdfDoComprovante`) não mudou, para o menu, que mora no
`01_Layout_Comprovante.gs`, não precisar ser colado de novo.

**Quem conta as etapas é o servidor**, pelas contas (`etapasDaMovimentacao_`),
e não a tela. A tela conta do lado dela só para mostrar.

**Cada etapa passa pelo preenchimento inteiro.** Seria mais rápido trocar só
o Status entre um PDF e outro — e seria o atalho que o projeto já tirou uma
vez: confiar no que "deve estar" na folha. Custa pouco, porque a escrita só
grava as células que mudaram.

### O cabeçalho do Recebimento

**Quem produz o documento decide o cabeçalho** (`ladoDoCabecalho_`, no
`04_Formulario.gs`): Aprovação e Pagamento com a ADM de origem, Recebimento
com a de destino. Na mesma ADM os dois dão o mesmo cabeçalho, e a regra não
precisa perguntar se as ADMs são diferentes.

Ela vale no **preenchimento**, e não só no PDF: "Preencher o comprovante" com
"Só RECEBIDA" mostra na aba o cabeçalho que o PDF vai ter. Se a PIA de
destino não estiver no bloco ADMs, o cabeçalho não tem o que escrever — e a
caixa do resultado **avisa**, em vez de deixar passar o da origem calado.

### Quando o Google recusa

O endereço de exportação responde **"muitos pedidos" (429)** quando os PDFs
vêm em sequência rápida — e agora eles vêm. O pedido **espera 2 s e tenta de
novo** (até 3 vezes) no 429 e nos erros 5xx; um 403 ou 404 não melhora
esperando, e não é repetido.

**Uma etapa recusada não derruba as outras.** O que saiu fica na pasta e no
Histórico, a caixa diz qual faltou, e o caminho para gerar só ela é "Corrigir
e gerar de novo" + deixar marcada só a PAGA na caixa de gerar. Quando **nenhum** sai, o erro sobe inteiro e
nada é gasto.

### Onde, com que nome, e a Referência

Na pasta indicada em `PASTA_DRIVE_PADRAO` (bloco CONTROLE da aba Cadastros —
aceita o id ou o link inteiro copiado do Drive); vazia, na **mesma pasta da
planilha**.

O nome é `[referência]-[ETAPA] - [AA]_[MM]_[DD].pdf` — `CMP-26-001-APROVADA -
26_09_23.pdf` —, com a data do dia em que foi gerado. Até a Etapa 6 começava
com `CMI-`, a sigla antiga do sistema, que saiu com o nome novo. A barra da referência vira hífen, porque barra em nome de
arquivo confunde o Drive. **A regra do nome mora num lugar só**
(`nomeDoArquivoPdf_`) — a cópia em planilha usa a mesma.

**A Referência é consumida UMA vez**, por mais PDFs que saiam: as etapas são o
mesmo comprovante. Basta um PDF ter saído para o número estar usado. Segunda
via não consome nada.

Quando fica pronto, o resultado aparece **na faixa verde e numa caixa de
diálogo**, com um link por PDF (*Abrir APROVADA*, *Abrir PAGA*…), *Abrir a
pasta* e *"Saiu errado? Corrigir e gerar de novo com CMP-26/…"*. O cabeçalho
só é dito quando **muda** de um PDF para outro — é o que se confere no papel.

**Compatibilidade entre arquivos colados em momentos diferentes:** o servidor
continua devolvendo o formato antigo (`pdf`, um só) junto do novo (`pdfs`), e
a tela lê os dois. Uma tela nova com um `04_Formulario.gs` velho mostra o PDF
que saiu; um servidor novo com uma tela velha gera o que ela sabe pedir
(`todasAsEtapas`, da primeira versão desta etapa, ou só `etapaAtual`).
Arquivo atrasado piora a tela — não a derruba.

## 5b. O arquivo de recuperação (.md)

Ao lado dos PDFs fica `CMP-26-001.md`: tudo o que originou o comprovante,
para **refazer ou conferir sem redigitar nada**. Em cima, para gente ler (os
documentos com a hora e o cabeçalho de cada um, a identificação, o valor, o
lote, origem e destino, os assinantes); no fim, **o JSON da movimentação**,
do jeito que o formulário a montou — é esse bloco que um futuro "reabrir pela
Referência" vai ler.

**Um arquivo por Referência, e não um por PDF.** As etapas são o mesmo
comprovante, e o nome é a Referência: três arquivos com o mesmo nome na mesma
pasta seriam três respostas para a mesma pergunta.

Quando o arquivo **já existe**, depende de por que o número se repetiu:

| Caso | O que acontece com o .md | Por quê |
|---|---|---|
| Correção | **reescrito** | a recuperação tem de refazer o certo, não o errado |
| Segunda via | **mantido o do original** | a via reimprime; se fosse preenchida diferente, reescrever apagaria a única cópia dos dados do original |
| Outros (só uma etapa refeita, histórico perdido) | reescrito | é o comprovante de agora |

Ele é gravado como `text/plain`, e não `text/markdown`: o Drive aceita o
primeiro em qualquer conta, e um tipo recusado derrubaria a gravação.

## 5c. O Histórico

A aba **Histórico** nasce sozinha, no primeiro PDF, **protegida por aviso**
(o Google pergunta "tem certeza?" antes de deixar editar à mão). **Uma linha
por PDF emitido** — é o que foi emitido, e uma etapa pode ser refeita
sozinha. **Filtrar pela etapa 1 não dá uma linha por comprovante** — a
correção deixa a linha errada lá, e a etapa 1 pode nem ter saído. Quem conta
cada comprovante uma vez é o relatório mensal (`16_relatorio_mensal.md`).

As colunas: Emitido em, Referência, Etapa, Etapa nº, Como saiu o número,
Motivo da exceção, Numeração SIGA, Data de emissão, Título, Tipo
Transferência, Finalidade, Forma, Conta de origem, PIA de origem, Conta de
destino, PIA de destino, Cabeçalho (ADM), Lançamentos, Valor, Extenso,
Observação, Assinantes, Arquivo PDF, Endereço do PDF, Arquivo de recuperação,
e — desde a Etapa 6, no fim — **Linhas do lote** (as linhas do lote em JSON) e
**Emissão** (a hora do 1º PDF do clique, a mesma em todos os PDFs dele). As
duas existem para o relatório mensal: ver `16_relatorio_mensal.md`, seção 5.

Duas regras que vêm de defeitos já pagos nos Cadastros, aplicadas **de
antemão**:

- **A linha é gravada pelo NOME da coluna, não pela posição.** Coluna movida
  continua recebendo o seu valor; coluna que falta volta **no fim**. É a
  armadilha da coluna no meio, que custou três sintomas nos Cadastros.
- **O formato vem antes do valor.** Tudo é texto, menos **Data de emissão**
  (data) e **Valor** (número) — os dois que o relatório mensal vai somar.
  Sem isso, uma Numeração SIGA `1.2.3` viraria 01/02/2003.

**"Emitido em" é LIDO da folha**, e não calculado de novo: o Histórico tem de
dizer a mesma hora que está impressa no PDF.

**O .md e o Histórico avisam, nunca derrubam.** Os PDFs já estão na pasta
quando eles são gravados; um erro ali vira um aviso na caixa, e o
comprovante continua emitido.

**Todo PDF passa por aqui**, inclusive o que se pede pelo menu (seção 5):
não existe mais caminho que gere PDF sem Histórico e sem consumir número.

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

## 7. O que fica para depois

- **Reabrir pela Referência**: ler o JSON do `.md` de volta para o
  formulário. O arquivo já é gravado pensando nisso.
- ~~O relatório mensal~~ — feito na Etapa 6: `16_relatorio_mensal.md`. O PDF
  dele é o único que não segue as regras do comprovante (sai deitado e
  ajustado à largura), e o pedido do comprovante continua o mesmo.
- **Quem gerou** cada PDF não é registrado: pedir o e-mail de quem clica
  exigiria uma autorização nova do Google.
