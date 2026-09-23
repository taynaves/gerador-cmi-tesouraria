# Checkpoint da Etapa 5 — os PDFs da movimentação

Fechado em **23/09/2026**, com a Etapa 5 **testada e aprovada pelo Taynã** na
planilha dele (CMP-26/014 e CMP-26/015). Ramo:
`claude/cmi-comprovante-layout-quo9wg`. Bancada: **965 conferências** verdes
(667 do servidor, 245 de gestos, 53 da tela), mais a conferência da tela e o
`node --check` de cada `.gs`.

---

## 0. O que é este documento, e como se lê

É a continuação do `13_checkpoint_etapa_4.md`, **não a substituição dele**.
Aquele tem a história das etapas 1 a 4, os defeitos daquela época e, na seção
5, a regra do negócio inteira até ali. Este tem o que a Etapa 5 acrescentou.
Os dois juntos, mais `01_regras_negocio_ATUAL.md` e os `cadastros/*.csv`,
bastam para recriar o sistema sem o código.

**Leia primeiro a seção 4** — o que evitar de antemão. É a lista que a
próxima geração confere antes de entregar qualquer coisa.

---

## 1. O que a Etapa 5 entregou, em uma página

Antes, o formulário gerava **um** PDF por clique, da etapa escolhida, sempre
com o cabeçalho da origem, sem arquivo de recuperação e sem registro. Agora:

- **Gerar abre uma caixa: "Quais PDFs gerar?"** — uma marcação por etapa
  (`APROVADA → EFETIVADA` na mesma PIA; `APROVADA → PAGA → RECEBIDA` entre
  PIAs diferentes), **todas marcadas**, e o botão diz quantos saem. Dá para
  gerar uma, duas quaisquer ou todas. A mesma caixa pelo botão da janela,
  pela aba inteira e pelo menu **Gerar PDF do comprovante**.
- **Cada PDF** sai com o **Status** e os **assinantes** da sua etapa, e o de
  **Recebimento** com o **cabeçalho da ADM de destino** (quem produz o
  documento decide o cabeçalho).
- **A Referência é consumida uma vez** por movimentação, por mais PDFs que
  saiam.
- **Ao lado dos PDFs**, um arquivo de recuperação `CMI-CMP-26-NNN.md` — um por
  Referência — com tudo o que originou o comprovante e, no fim, o JSON da
  movimentação.
- **Aba Histórico**, criada sozinha: uma linha por PDF emitido.
- **O menu deixou de ser um caminho à parte**: antes gerava um PDF sem
  Histórico e sem consumir número.
- **A tela**: sem o buraco em branco da janela do Sheets; "3 PDFs · APROVADA
  → PAGA → RECEBIDA" no rodapé; a Conferência atravessando as duas colunas.

Arquivos que mudaram: `04_Formulario.gs`, `05_Gerar_PDF.gs`,
`04_Formulario_Tela.html`. **Os outros cinco não foram tocados** — inclusive
o menu, que mora no `01_Layout_Comprovante.gs`: a função que ele chama
(`gerarPdfDoComprovante`) manteve o nome e mudou por dentro.

---

## 2. A história, na ordem em que aconteceu

1. **Os 2 ou 3 PDFs num clique**, com um seletor "Etapas a gerar" no
   formulário que nascia em "Todas". Aprovado no primeiro teste (CMP-26/014).
2. **No meio do trabalho, a documentação foi reorganizada noutra sessão**: um
   `CLAUDE.md` novo ("só o que existe hoje"), os documentos de regra viraram
   `_ATUAL` (estado atual) e `_OLD` (histórico). O push foi recusado. O
   código não tinha sido tocado lá; a reconciliação foi pôr o código por
   cima e reescrever a documentação da etapa na estrutura nova.
3. **Ele pediu a escolha numa caixa**, "pelo menu, pela janela ou pela aba,
   independentemente", com uma, duas quaisquer ou todas. O seletor saiu do
   formulário; o menu passou a abrir o formulário já com a caixa.
4. **Ele pediu todos os arquivos numa mensagem só**, cada um com o seu passo
   a passo. Está no `CLAUDE.md`, seção 5.
5. **Ele apontou um buraco em branco** na janela do Sheets e pediu a contagem
   de PDFs num lugar que chamasse a atenção. A tela virou uma grade com
   áreas; a contagem foi para o rodapé.
6. **Ele pediu a Conferência de um lado ao outro.** Virou um pedaço próprio
   da grade.

---

## 3. Os defeitos, um a um — sintoma, causa e lição

### 3.1 A bateria verde com o `.md` e o Histórico quebrados

**Sintoma:** a primeira rodada da bateria do servidor passou inteira — 585
de 585 — com o código novo que grava o `.md` e o Histórico.
**Causa:** a pasta de mentira dos testes não sabia procurar arquivo pelo nome
(`getFilesByName`) e o simulador não conhecia `setNumberFormats`. As duas
gravações estouravam, a emissão as tratava como **aviso** (de propósito: elas
nunca podem derrubar um PDF já emitido), e nenhuma conferência olhava o
aviso.
**Lição:** quando o código transforma falha em aviso, **o teste tem de exigir
zero avisos** numa emissão normal — senão "avisar, nunca bloquear" vira
"falhar calado". E simulacro tem de **guardar** o que recebe (nome, conteúdo,
reescritas), não só aceitar a chamada. Foi a lição 3.13 da Etapa 4 voltando
por outro caminho: **teste verde não é prova; prove o contrário**. Cada regra
nova desta etapa foi quebrada de propósito, e a bateria acusou cada uma.

### 3.2 O seletor que ficaria preso numa etapa só

**Sintoma (achado antes de chegar a ele):** a janela abre sem contas, só
existe a APROVADA, o seletor a marca; quando as contas chegam e aparecem três
etapas, a APROVADA continua marcada e sai **um** PDF em vez de três.
**Causa:** o seletor guardava a escolha anterior e a respeitava enquanto ela
ainda existisse.
**Lição:** escolha que o sistema faz "em nome da pessoa" não pode ficar
valendo quando o contexto muda. A primeira correção foi lembrar só a escolha
feita à mão; a definitiva veio do pedido dele: a caixa **não guarda escolha
nenhuma** — todas vêm marcadas, sempre, e desmarcar é um gesto feito na hora.

*Observação não investigada:* num print do primeiro teste o seletor mostrava
`APROVADA (1 de 1)` e o botão dizia "os 2 PDFs". Pode ter sido em momentos
diferentes. O seletor saiu antes de se apurar.

### 3.3 O menu que gerava PDF por fora da numeração

**Sintoma:** o item **Gerar PDF do comprovante** gerava um PDF do que
estivesse na aba — sem Histórico, sem `.md` e **sem consumir a Referência**.
Quem usasse o menu no lugar do formulário deixaria a contagem para trás, e o
próximo comprovante sairia com um número já impresso.
**Causa:** o menu é da Etapa 1, de antes de existir numeração; ninguém o
revisitou quando a Referência passou a ser consumida só no formulário.
**Lição:** todo caminho que produz o documento tem de passar pela **mesma**
emissão. Hoje o menu abre o formulário já na caixa de escolha. E para mudar o
que o menu faz sem obrigar a colar o arquivo do menu, **mantém-se o nome da
função e muda-se o corpo**.

### 3.4 O buraco em branco — que já existia

**Sintoma:** na janela do Sheets dele (1097 px), um espaço vazio grande
embaixo da primeira coluna.
**Causa:** a tela usava `flex-wrap`. Sem largura para três colunas (menos de
~1320 px), a terceira descia **inteira** para uma linha própria; a primeira
coluna é mais curta que a segunda, e o que sobrava embaixo dela ficava
vazio. O defeito era da Etapa 4.
**Por que ninguém viu antes:** `medir_tela.js` mede a **altura** e a largura
das colunas com o formulário **vazio**. Nenhum dos dois números denuncia um
buraco. Foi a **foto da página inteira**, com as contas escolhidas, que
mostrou.
**Lição:** para layout, **olhe a foto**, não só os números — e com o
formulário preenchido como ele usa. Hoje `#colunas` é uma grade com áreas:
`"c1 c2" "c3 c2" "c4 c4"` em duas colunas, `"c1 c2 c3" "c1 c2 c4"` em três.

### 3.5 A documentação reorganizada no meio da etapa

**Sintoma:** o push foi recusado; o `CLAUDE.md` que eu tinha editado já não
existia com aquele conteúdo, e os documentos que eu atualizara tinham virado
`_OLD`.
**Causa:** outra sessão reescreveu a documentação enquanto esta trabalhava.
**Lição:** antes de encerrar, **busque o ramo** (`git fetch`) e veja o que
mudou. Arquivos `_OLD` são histórico — não se editam. A reconciliação certa
foi: código por cima (ninguém tinha mexido nele) e a documentação reescrita
**no estilo novo**, que descreve só o que existe.

---

## 4. O que evitar de antemão — a lista da próxima geração

Soma-se à lista da seção 4 do `13_checkpoint_etapa_4.md`, que continua
valendo inteira.

1. **Entregue todos os arquivos numa mensagem só**, cada um com o link do
   Raw, onde clicar e como conferir que colou inteiro — e o teste depois.
   Pedido dele.
2. **Falha que vira aviso exige teste que exija zero avisos.** Senão ela
   passa calada para sempre.
3. **Simulacro guarda o que recebe.** Um Drive de mentira que só diz "ok" não
   prova nada.
4. **Quebre de propósito cada regra nova** e veja a bateria acusar, antes de
   pedir teste a ele.
5. **Olhe a foto da tela, preenchida**, nos tamanhos dele (1097 × 617 na
   janela; 1371 a 80% na aba) — não só os números do `medir_tela.js`.
6. **Todo caminho que produz o documento passa pela mesma emissão.** Não
   crie um segundo.
7. **Escolha que o sistema faz pela pessoa não pode sobreviver a uma mudança
   de contexto.** Na dúvida, não guarde a escolha.
8. **Mude o corpo, mantenha o nome** quando o chamador mora num arquivo que
   não precisa ser colado de novo.
9. **Mantenha compatibilidade entre arquivos colados em momentos
   diferentes**: o servidor ainda aceita `todasAsEtapas` e `etapaAtual`, e
   devolve `pdf` junto de `pdfs`. Arquivo atrasado piora a tela, não a
   derruba.
10. **Busque o ramo antes de encerrar.** Outra sessão pode ter mexido.
11. **`_OLD` é histórico.** Não se edita; a verdade de hoje está no
    `CLAUDE.md` e nos `_ATUAL`.

---

## 5. A regra do negócio que a Etapa 5 acrescentou

Especificação — junto com a seção 5 do `13_checkpoint_etapa_4.md` e o
`01_regras_negocio_ATUAL.md` (seção 10, R-EMI-1 a R-EMI-9).

### 5.1 Quais PDFs saem

- Gerar abre a caixa **"Quais PDFs gerar?"**: uma marcação por etapa da
  movimentação, **todas marcadas** a cada abertura, e um botão com a contagem
  ("Gerar 2 PDFs"). Nada marcado apaga o botão.
- A caixa **não abre a escolha** — explica — quando falta uma das contas, ou
  quando uma regra entre contas está quebrada.
- As etapas são **conferidas no servidor, pelas contas**. Saem **na ordem da
  movimentação**, não na das marcações. Etapa marcada que não existe é
  ignorada; se nenhuma existe, é erro dito.
- **Cada etapa passa pelo preenchimento inteiro** — nada de trocar só o
  Status entre um PDF e outro.
- **Preencher o comprovante** põe na aba a **1ª etapa**. Para ver outra, só
  gerando o PDF dela. Custo dito a ele antes.
- O rodapé mostra quantos PDFs a movimentação tem, e quais.

### 5.2 O cabeçalho

Quem **produz** o documento decide: Aprovação, Pagamento e Efetivação com a
ADM de **origem**; Recebimento com a de **destino**. Vale no preenchimento
também. Se a PIA do cabeçalho não estiver no bloco ADMs, a caixa do resultado
avisa.

### 5.3 A Referência

Consumida **uma vez**, depois dos PDFs, se **ao menos um** saiu. Segunda via
não consome. Correção não anda a contagem (é o mesmo número).

### 5.4 Quando o Google recusa

O pedido do PDF espera 2 s × a tentativa e repete, até 3 vezes, em 429 e 5xx.
Uma etapa recusada **não derruba as outras**: a caixa diz qual faltou e como
gerar só ela. Se **nenhuma** sai, o erro sobe inteiro e nada é gasto nem
registrado.

### 5.5 O arquivo de recuperação

`CMI-CMP-26-NNN.md`, na pasta dos PDFs, **um por Referência**. Em cima, para
gente ler: documentos com hora e cabeçalho de cada um, identificação, valor,
lote, origem e destino, assinantes. No fim, o **JSON da movimentação**.
Existindo, **correção reescreve**; **segunda via mantém o do original**;
os outros casos reescrevem. Gravado como `text/plain`.

### 5.6 O Histórico

Aba `Histórico`, criada no primeiro PDF, protegida por aviso. **Uma linha por
PDF**, gravada **pelo nome da coluna** (coluna que falta volta no fim).
**Formato antes do valor**: tudo texto, menos **Data de emissão** (data) e
**Valor** (número). "Emitido em" é **lido do carimbo impresso**.
Colunas: Emitido em, Referência, Etapa, Etapa nº, Como saiu o número, Motivo
da exceção, Numeração SIGA, Data de emissão, Título, Tipo Transferência,
Finalidade, Forma, Conta de origem, PIA de origem, Conta de destino, PIA de
destino, Cabeçalho (ADM), Lançamentos, Valor, Extenso, Observação,
Assinantes, Arquivo PDF, Endereço do PDF, Arquivo de recuperação.

### 5.7 Avisar, nunca derrubar

O `.md` e o Histórico são gravados **depois** dos PDFs. Falha neles vira
**aviso** na caixa do resultado; o comprovante continua emitido.

---

## 6. O que ficou de fora de propósito

| O quê | Por quê |
|---|---|
| **Reabrir pela Referência** (ler o JSON do `.md`) | Não foi pedido. O arquivo já é gravado pensando nisso |
| **Quem gerou** cada PDF | Pedir o e-mail de quem clica exige uma autorização nova do Google |
| **Corrigir no mesmo dia** deixa dois PDFs com o mesmo nome na pasta | O Drive aceita nomes repetidos; o Histórico diz qual é o mais novo. Apagar o errado sozinho seria destrutivo |
| **Relatório mensal** | É a Etapa 6 |

E uma pendência que **agora pesa**: a inscrição estadual da ADM Costa Rica
está como **ISENTO** sem confirmação. Desde esta etapa, o PDF de Recebimento
de uma remessa para a PIA-COSTA imprime esse cabeçalho
(`09_pendencias_e_decisoes.md`, 1.2).

---

## 7. Como retomar

Num chat novo e limpo, com o texto de `PROMPT_ETAPA_6.md`. A regra dele, que
vale daqui para a frente:

> **Cada etapa roda num chat novo e limpo. Cada uma aprende com todas as
> anteriores, e tem de ser melhor do que cada uma delas.**
