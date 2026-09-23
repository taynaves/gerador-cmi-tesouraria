# Checkpoint da Etapa 4 — o formulário

Fechado em **23/09/2026**, ao fim da Etapa 4 (o formulário em Apps Script).
Ramo: `claude/cmi-comprovante-layout-quo9wg`. Bancada: **851 conferências**
verdes (585 + 213 + 53), mais a conferência da tela e o `node --check`.

---

## 0. O que é este documento, e como se lê

Ele tem dois usos, e os dois foram pedidos:

1. **Retomar o projeto num chat limpo** — o que foi feito, por quê, o que deu
   errado e o que não se deve tentar de novo.
2. **Recriar o sistema do zero sem acesso a nenhum código.** A seção 5 é a
   regra do negócio inteira, escrita como especificação: quem tiver só este
   arquivo e os `cadastros/*.csv` consegue reconstruir o comportamento.

**A regra mora aqui; o código é uma implementação dela.** Se um dia os dois
discordarem, não escolha em silêncio: alguém mudou um sem mudar o outro, e o
conserto é reconciliar os dois — decidindo, com a tesouraria, qual dos dois
está certo.

**O que NÃO está aqui, de propósito:**

- **os dados** — contas, cartões, diáconos, formas, finalidades, CNPJs: eles
  vivem em `cadastros/*.csv`, que é a fonte da verdade, e copiá-los para cá
  criaria uma segunda verdade que envelheceria calada;
- **o mapa de células** do comprovante (qual campo mora em qual intervalo):
  está em `docs/02_especificacao_campos.md`, e é derivado — o layout é gerado
  por código a partir das medidas da seção 5.8;
- **o modo de conduzir o projeto e de falar com o Taynã**: está no `CLAUDE.md`,
  que é operacional e se lê antes de qualquer coisa.

---

## 1. O sistema em uma página

O **Comprovante de Movimentação Interna (CMI)** é o documento que a tesouraria
da Piedade (ADM Coxim-MS, CCB) anexa no SIGA para registrar dinheiro andando
**entre contas da própria obra** — caixas, bancos e cartões pré-pagos. Não é
nota fiscal, não é lançamento contábil, não é pagamento a terceiro: é o
comprovante que documenta e autentica o movimento, assinado por diáconos.

Antes, isso era preenchido à mão numa planilha Excel, célula por célula,
inclusive o valor por extenso e o nome das contas de cor. O sistema reduz isso
a poucos cliques **sem mudar a aparência do documento**, que tem de continuar
coincidindo com o comprovante que o próprio SIGA emite.

Três abas numa planilha do Google:

- **Comprovante** — só o desenho do documento, escrito por código. Ninguém
  digita nela.
- **Cadastros** — 11 listas que alimentam tudo, editáveis.
- **Histórico** — registro do que foi emitido (previsto para a Etapa 6).

E um **formulário** (uma janela dentro da planilha, e também uma aba inteira)
por onde todo o preenchimento passa.

---

## 2. A história da Etapa 4, na ordem em que aconteceu

Cada item aqui custou pelo menos uma rodada de conversa; vários custaram
várias. A ordem importa porque quase todo passo nasceu de um defeito do
anterior.

1. **A janela nasceu com os combos com filtro-ao-digitar.** É o motivo de o
   formulário existir: o Google Sheets **não filtra uma lista suspensa
   enquanto se digita** dentro da célula.
2. **A árvore de tipos e as regras entre contas** viraram um arquivo só
   (`06_Tipos_E_Regras.gs`), e a tela passou a recebê-las **injetadas** — o
   servidor cola o próprio código-fonte das funções `nucleo*` dentro do HTML.
   Sem isso, cada tecla digitada exigiria uma ida ao Google.
3. **A escrita rápida** (`00_Escrita_Rapida.gs`) juntou dezenas de escritas num
   pedido só: de 192 idas ao Google para 9.
4. **A Referência travada**, com painel de exceções (2ª via, histórico
   indisponível, correção de lançamento) e o número consumido só na geração do
   PDF.
5. **O lote**, com soma automática e uma linha por lançamento.
6. **A lista de subtipos foi aposentada** — o bloco `TIPOS` inteiro saiu,
   porque as 26 finalidades já diziam as sete espécies de movimentação, com
   fonte. Duas listas respondendo à mesma pergunta é a pior repetição: ninguém
   obriga as duas respostas a combinarem.
7. **A janela virou colunas** e depois ganhou uma **aba inteira** (`doGet`,
   publicada como App da Web), porque a escala de 175% do Windows dele fazia o
   navegador enxergar 1097 × 617 e sobravam ~400 px de altura para um
   formulário que precisa de 810.
8. **O cartão passou a ir colado na conta**, o cargo dos assinantes sumiu da
   tela, o teclado passou a andar pelos campos, e a busca de conta passou a
   achar com ou sem o ponto (`10010` encontra `100.10`).
9. **Dá para acrescentar uma finalidade sem sair do formulário**, com o painel
   preenchendo sozinho tudo o que o sistema já deduziu.
10. **O comprovante passou a sair também em planilha** — `.xlsx` para o
    computador, ou planilha do Google para a pasta do Drive.
11. **O resultado saiu da faixa do topo e foi para uma caixa de diálogo**, e
    toda mensagem verde ou vermelha passou a abrir a caixa também.

---

## 3. Os defeitos, um a um — sintoma, causa e lição

Esta é a parte que a próxima geração tem de ler inteira. Quase todos estes
defeitos **passavam verdes** em alguma conferência antes de serem achados, e
a maioria foi **o Taynã** quem encontrou.

### 3.1 O que o `getContent()` faz com os comentários

**Sintoma:** o servidor dizia que o arquivo da tela tinha chegado pela metade;
o arquivo estava inteiro no editor.
**Causa:** `HtmlService.createHtmlOutputFromFile(...).getContent()` devolve o
texto **sem comentário nenhum** — de 80 KB chegavam 63 KB. As marcas que o
servidor procurava eram comentários.
**Lição:** nada que precise ser reconhecido depois pode viver num comentário.
As marcas viraram comandos (`var NUCLEO_DAS_REGRAS = 1;`,
`var FIM_DA_TELA = 1;`). E: **nunca acuse a colagem dele sem medir antes** —
custou duas rodadas mandando consertar o que não estava quebrado.

### 3.2 A chave que se repete apaga linhas em silêncio

**Sintoma:** 7 das 11 regras entre contas sumiram do cadastro, e o sistema
passou a permitir justamente o que devia proibir.
**Causa:** o cadastro deduplica pela chave do bloco, e metade das regras
começava com `*`.
**Lição:** a chave tem de **identificar a linha** — pode ser uma coluna ou uma
lista delas. A bancada confere que nenhuma linha do projeto tem chave repetida
nem some do cadastro.

### 3.3 A coluna no meio da lista — três sintomas, um defeito

**Sintoma:** todas as contas inativas, nenhuma regra valendo, e DINHEIRO
oferecido para a ACG — com bandeira verde na conferência.
**Causa:** a coluna **Natureza** entrou no meio do bloco CONTAS. As linhas que
já estavam na aba têm uma coluna a menos, encostam à esquerda e são
completadas no fim.
**Lição:** **coluna nova vai no fim, nunca no meio** — e isso hoje é provado
por simulação, não por disciplina (a bancada monta a lista como ela era antes
da última coluna existir). E: **"não está vazio" não é conferência** — a
coluna guardava `"Ativa"`, preenchida e errada, e por não estar vazia passou
por baixo de tudo.

### 3.4 O Google converte o que parece data

**Sintoma:** a folha `1.1.1` virou `01/01/2001` na planilha dele.
**Causa:** escrever antes de formatar.
**Lição:** `setNumberFormat('@')` **antes** do `setValues`, em **todo** mundo
que escreve no cadastro — e não só no desenho do bloco. A **importação** não
formatava, e o estrago só aparecia na **recriação seguinte**: 8 linhas ficavam
com chave diferente e voltavam a ser acrescentadas. A bancada não pegava
porque ali a recriação sempre vinha antes da importação — uma dependência que
ninguém tinha declarado. Hoje o teste **apaga o formato de propósito** e
confere o passo seguinte.

### 3.5 O campo PIA dizia uma coisa e fazia outra

**Sintoma:** a janela reabria no último preenchimento, o campo dizia
`PIA - COXIM`, e digitar `10010` trazia contas de todas as PIAs.
**Causa:** um conserto anterior guardara à parte "a PIA que a PESSOA
escolheu", e o campo deixou de mandar no filtro.
**Lição:** **um significado só** — o que está escrito no campo é o que filtra,
tenha sido escrito por quem digita ou pelo sistema. E a lista **alarga sozinha
para o cadastro inteiro** quando o que se digita não existe naquela PIA,
dizendo na própria lista que alargou.

### 3.6 O caminho que não recebeu o texto

**Sintoma:** a etapa do documento parou em 2 quando devia ser 3.
**Causa:** quando a lista de um combo passou a depender do que está sendo
digitado, um dos caminhos que a lê — o de **sair do campo** — não passava o
texto adiante.
**Lição:** quando uma função ganha um parâmetro que muda o resultado, **todo**
caminho que a chama tem de passá-lo. E o sintoma apareceu **três telas
adiante** da causa.

### 3.7 O aviso que existia e ninguém via

**Sintoma:** a frase "alarguei a lista" não aparecia.
**Causa:** ela nascia no **rodapé** da lista suspensa, e numa janela de altura
fixa é o fim da lista que a borda do modal corta. O código estava certo.
**Lição:** aviso dentro de lista suspensa vai **no topo dela**. E: conferido em
Chromium de verdade, porque o simulador não desenha nada — **um aviso que não
chega é um defeito tão real quanto um cálculo errado**.

### 3.8 O bloco de CSS no meio do arquivo

**Sintoma:** as vagas de assinatura ficaram com 124 px em vez de 42, e a coluna
terminou **mais alta** do que antes do conserto.
**Causa:** o bloco da janela larga estreou no meio do `<style>`; com a mesma
força, a última regra ganha.
**Lição:** regra que sobrescreve outra vem **depois** dela. E o sintoma de um
CSS que não vale quase nunca é "não mudou nada".

### 3.9 Fechar a aba tem duas condições

**Sintoma:** o botão "Fechar esta aba" não fazia nada. Consertei uma causa, ele
relatou **o mesmo sintoma**.
**Causa:** (1) o navegador só deixa fechar aba aberta **por programa**; (2) e o
pedido tem de chegar à **aba**, não ao **quadro** — a tela de um App da Web
mora dentro de um `iframe`, e `close()` ali dentro pede para fechar o quadro.
**Lição:** quando um conserto certo não muda o sintoma, a pergunta não é "será
que ele colou o arquivo?" — é **quantas condições esse comportamento tem**.

### 3.10 O endereço `/exec` serve uma fotografia

**Sintoma:** ele colou os arquivos e os defeitos "voltaram" todos juntos.
**Causa:** a aba inteira é servida pela **implantação**, que é uma foto do
código tirada na hora de publicar. Salvar no editor muda a janela na mesma
hora e **não muda a aba**.
**Lição:** depois de mexer, **reimplantar** (Implantar → Gerenciar implantações
→ lápis → Versão: Nova versão). E, no diagnóstico: "ele testou na aba" e "ele
testou na janela" são **dois fatos diferentes**.

### 3.11 O fechar automático que engoliu o retorno

**Sintoma:** preencher fechava a tela antes de dar tempo de ler o resultado.
**Causa:** ele pediu o fechar automático e eu entreguei **sem dizer o custo**,
que dava para enxergar de antemão.
**Lição:** quando um pedido tem um custo previsível, **dizer o custo faz parte
de entregar**. Foi ele quem reparou, com razão, que devia ter sido avisado.

### 3.12 O endereço de download do Drive

**Sintoma:** o botão de baixar o `.xlsx` não fazia nada.
**Causa:** o arquivo era salvo no Drive e oferecido por `uc?export=download`,
que depende de sessão, de permissão e de um redirecionamento do Google.
**Lição:** para entregar um arquivo que o script **já tem na mão**, devolva os
bytes (base64) e deixe o navegador salvar. Medido em Chromium, inclusive
dentro de um quadro com o mesmo `sandbox` que o Google usa — que era onde
podia morrer sem aviso.

### 3.13 Testes que passavam pelo motivo errado

Três, e cada um esconderia um defeito real:

- um teste **cortava o arquivo na linha 600** e passava por coincidência; o
  CSS novo empurrou a linha da versão para além dela e ele acusou um defeito
  que não existia. Hoje o corte é medido a partir da marca, não do número;
- a importação **herdava o formato** da recriação que rodava antes (3.4);
- `offsetParent` **não existe no jsdom**: todo campo parecia escondido e o
  teste do teclado não provava nada. Trocado por uma conferência que olha do
  jeito que a tela realmente esconde as coisas.

**Lição:** teste verde não é prova. Prove o contrário pelo menos uma vez —
quebre de propósito o que ele deveria pegar e veja-o falhar.

---

## 4. O que evitar de antemão — a lista da próxima geração

Leia antes de escrever a primeira linha.

1. **Leia os arquivos do repositório antes de tocar em qualquer um.** Não
   reconstrua um arquivo de memória, nem a partir do que ele colar no chat. O
   `04_Formulario_Tela.html` tem 3.400 linhas; um arquivo "plausível" abre
   normalmente e **não responde a botão nenhum, sem mensagem de erro**.
2. **Nunca acuse a colagem dele.** Meça primeiro (há um menu de diagnóstico que
   conta o que o servidor está lendo).
3. **Coluna nova vai no fim da lista.** Sempre.
4. **Formate como texto antes de escrever** qualquer coisa que pareça data.
5. **A chave do bloco tem de identificar a linha.**
6. **Regra de negócio mora num arquivo só** (`06_Tipos_E_Regras.gs`), e a tela
   a recebe injetada. Nunca escreva regra dentro do HTML.
7. **Nada de `alert()` ou `confirm()`** dentro das janelas do Apps Script: o
   Google bloqueia, e a janela fica muda.
8. **Marca que o servidor procura é comando, nunca comentário.**
9. **Meça o layout num navegador de verdade** (`medir_tela.js`) em vez de
   discutir CSS. Três defeitos desta etapa só apareceram ali.
10. **Rode as três baterias antes de pedir teste a ele.** Elas existem porque
    o teste dele custa caro: ele cola arquivo por arquivo, um por mensagem.
11. **Uma mensagem, um passo.** Ele não é programador; diga onde clicar.
12. **Avise antes de qualquer tela de autorização do Google.**
13. **Depois de mexer na tela ou no script, reimplante** — senão a aba inteira
    continua com o código velho, calada.
14. **Quando um pedido tiver custo previsível, diga o custo antes de entregar.**
15. **Preferência de tesouraria não vira trava**: vira nota, com chave no bloco
    CONTROLE para desligar, porque outra ADM pode fazer diferente e estar
    igualmente certa.

---

## 5. A regra do negócio, inteira — para recriar do zero

Esta seção é a especificação. Quem tiver só ela e os `cadastros/*.csv`
reconstrói o comportamento do sistema.

### 5.1 O documento, e as 2 ou 3 etapas

**Uma movimentação nunca gera um comprovante. Gera 2 ou 3.**

| As duas contas | Documentos | Status de cada um |
|---|---|---|
| **mesma PIA** | 2 | `APROVADA` → `EFETIVADA` |
| **PIAs diferentes** | 3 | `APROVADA` → `PAGA` → `RECEBIDA` |

O sistema decide sozinho, comparando o **prefixo da PIA** da conta de origem
com o da conta de destino. A **mesma comparação** define o título:

- mesma PIA → `COMPROVANTE DE MOVIMENTAÇÃO INTERNA (de numerários)`
- PIAs diferentes → `COMPROVANTE DE TRANSFERÊNCIA (externa) DE NUMERÁRIOS`

**O parêntese em caixa baixa não é enfeite**: são dois tipos diferentes, e os
nomes antigos não diziam isso. Por causa dele o título é escrito **sem passar
pelo caixa-alta** que o resto do documento usa.

Antes de gerar, pergunta-se **uma vez**: "os signatários serão os mesmos em
todas as etapas?". Se sim, o mesmo conjunto em todos; se não, pede etapa por
etapa.

Número, data, valor, origem, destino, tipo e observação são **iguais nas 2 ou
3 etapas** — só o Status muda (e, opcionalmente, os assinantes). **Exceção:**
entre ADMs diferentes, o **cabeçalho institucional** também muda por etapa —
Aprovação e Pagamento saem com a ADM de origem, Recebimento com a de destino.
É quem **produz** o documento que decide o cabeçalho.

Nome do arquivo: `CMI-[referência]-[ETAPA] - [AA]_[MM]_[DD].pdf`, com a barra
da referência virando hífen.

### 5.2 O campo "Tipo Transferência" não repete o título

Ele leva só o **subtipo** (quando existe), a **forma** e a **finalidade**:

| Situação | Campo Tipo |
|---|---|
| mesma PIA | `PIX · CARREGAMENTO DE CARTÃO` |
| PIAs diferentes, mesma ADM | `ENTRE DEPARTAMENTOS · PIX` |
| ADMs diferentes | `ENTRE ADMINISTRAÇÕES · PIX` |

Numa movimentação interna sem forma escolhida, o campo sai **em branco** — e
está certo: o que havia para dizer já está no título.

**O subtipo é deduzido das contas, nunca escolhido.** O único campo escolhido
a mão é a **Finalidade**.

### 5.3 A Observação leva o tipo de contas na frente

Antes do texto digitado, o sistema escreve o **par de naturezas envolvidas**:
`ENTRE CAIXAS`, `ENTRE BANCOS`, `ENTRE CAIXA E BANCO`, `ENTRE CARTÕES`,
`ENTRE CAIXA E CARTÃO`, `ENTRE BANCO E CARTÃO`.

A ordem é **fixa** (caixa, banco, cartão): a frase descreve o **par**, não o
sentido — senão o mesmo movimento sairia descrito de dois jeitos conforme quem
paga. A **ACG entra como BANCO**: ela mora no grupo `101 - BANCOS CONTA
MOVIMENTO`, e a natureza ACG existe para as regras, não para descrever a conta
no papel. A tela mostra a frase inteira antes de gerar.

A Observação ocupa **duas linhas** com quebra de texto: em uma linha, o que
passasse de 601 px sumia do PDF sem avisar.

### 5.4 Campo vazio limpa a célula — sempre

Um comprovante **nunca** pode sair com dado do anterior. Não existe atalho que
pule o preenchimento: havia um, que pulava quando a movimentação era "a mesma
da última vez", e ele confiava numa memória em vez da folha. Bastava a folha
mudar por fora.

### 5.5 Agrupamento (o lote)

Várias movimentações podem sair num comprovante só, numa tabela. Em lançamento
único **a tabela não aparece**; em lote, ela tem **exatamente uma linha por
lançamento**, nunca uma em branco. Condições, nesta ordem:

1. mesma **etapa**;
2. mesmo **mês**;
3. mesma **origem e mesmo destino** — ou, para cartões, mesma **conta ACG** de
   um dos lados, ainda que o cartão seja diferente;
4. mesmo **tipo**.

O valor do comprovante é a **soma** das linhas, e o rótulo muda de "Valor:"
para **"Valor Total:"**.

### 5.6 As quatro coisas que decidem as formas permitidas

As três primeiras são o que **esta tesouraria decidiu** sobre um par de contas
(bloco REGRAS ENTRE CONTAS):

1. **Um par sem regra é livre.** As linhas são restrições, não permissões.
2. **Entre as permissões, a mais específica manda** (natureza vale 1 ponto por
   lado; texto de conta vale 2). Sem isso não há como escrever exceção.
3. **As proibições valem sempre**, venham de onde vierem. Uma exceção
   específica não ressuscita o que uma regra geral proibiu.

A quarta **não é decisão de ninguém** — é o que a forma **é** (bloco FORMAS):

- `Exige conta de` — pelo menos um lado tem de ser daquela natureza. `CAIXA`
  em DINHEIRO e CHEQUE: dinheiro que não passa por um caixa não é dinheiro, é
  transferência.
- `Instituições` — `MESMA` (transferência bancária é, por definição, dentro de
  uma instituição) ou `DIFERENTES` (TED e PIX existem para atravessar bancos).
  **Caixa não tem instituição, e aí a comparação não acontece** — concluir "o
  vazio é diferente de BB, então pode TED" seria inventar resposta.

Disso caem três pares **impossíveis** que ninguém escreveu como proibição:
caixa ↔ ACG, caixa ↔ SANT e cartão ↔ banco de fora.

**SAQUE é família, não forma**: tem as subformas DINHEIRO e CHEQUE, e o
formulário pede a segunda. Permitir ou proibir a família alcança as duas.

**Uma regra que pode sair sem mudar nada é repetição.** Três regras saíram
assim, e nenhuma conferência acusou — o que acusou foi tirar cada uma, refazer
o retrato dos 506 pares de contas ativas e comparar. Isso virou conferência de
toda rodada.

### 5.7 A finalidade — a quinta pergunta

Onde a movimentação acontece sai das contas; como o dinheiro anda sai da
forma; que espécie de movimentação é sai do subtipo. **O propósito só quem
lança sabe.**

As 26 finalidades e as 39 linhas de "onde cada uma vale" saíram de um
levantamento nos manuais da obra, e **cada linha cita a fonte**. Nenhuma foi
inventada. Duas coisas do desenho não se negociam:

- a comparação é pelas **quatro colunas de texto** (Tipo, Subtipo, Forma,
  Subforma), **não** pela coluna Folha — a folha é o código do levantamento e
  serve para rastrear;
- **vazio não corta, dos dois lados**: vazio na regra quer dizer "serve para
  qualquer um"; vazio no estado quer dizer "ainda não escolheram".

Dá para acrescentar uma finalidade pelo formulário. O painel pergunta só o que
o sistema não pode saber (nome, o que é, histórico, cuidados, frentes) e
preenche o resto sozinho — inclusive o **próximo código livre, contado a
partir do MAIOR que existe, nunca do total de linhas**. E **a fonte dela não é
inventada**: sai marcada como decisão desta tesouraria, com a data.

### 5.8 Identificação: dois campos com regras opostas

- **Referência** — identificação própria, **obrigatória e única**, formato
  `CMP-26/NNN`, sequencial, reiniciando a cada ano. O prefixo é dado do
  cadastro, não do código. **Nunca se repete.** É ela que amarra o PDF ao
  arquivo de recuperação.
- **Numeração SIGA** — o número do lançamento no SIGA, quando existir.
  **Opcional** (vazia, some do documento) e **pode se repetir à vontade**: uma
  nota fiscal pode justificar dois lançamentos.

A Referência **só é consumida quando o PDF é gerado** — abrir o formulário e
desistir não pode queimar um número. Segunda via não consome nada. Corrigir um
lançamento devolve o mesmo número, com o motivo registrado, e a contagem não
anda.

Validação dos dois: aceitam letras e números; **avisam, não bloqueiam**, se
houver acento ou pontuação.

### 5.9 O valor por extenso

Em caixa alta, entre parênteses, ocupando **duas linhas** com quebra de texto
(em uma linha, `99.999,99` saía cortado).

**"UM MIL", e não "MIL"** — praxe de documento de valor, não gramática de
texto corrido: o extenso existe para **travar o número**, e um extenso
começado em "MIL" deixa espaço em branco antes de si, onde se acrescenta
palavra em documento já assinado. O SIGA segue a mesma praxe.

Centavos se contam em **centavos inteiros**, nunca em ponto flutuante:
`1,005` vira `100,49999…` e arredonda para baixo.

### 5.10 O PDF

**Não se usa Arquivo → Imprimir.** Os ajustes de impressão do Sheets não ficam
guardados na planilha: ficam no navegador de cada pessoa, e o Google os
redefine sozinho, desformatando o documento em silêncio.

O PDF é pedido **por código**, com cada ajuste escrito no próprio endereço:
A4, retrato, **escala Normal (100%)**, margens em centímetros (0,97 topo e
base; 1,02 esquerda; 0,89 direita), sem linhas de grade, sem nome de planilha,
sem nome de aba, sem número de página, **sem as anotações das células**
(vinham ligadas e imprimiam uma segunda folha).

Duas medidas fazem o documento virar duas folhas, e são conferidas antes de
gerar: **694 px de largura** e **1045 px de altura**. Avisa, não bloqueia.

### 5.11 A cópia em planilha

Além do PDF, o comprovante sai em planilha, com **o mesmo nome** do PDF:

| | Onde o arquivo fica | O que não acontece |
|---|---|---|
| **Excel (.xlsx)** | no computador de quem clicou | não fica nada no Drive |
| **Planilha do Google** | na pasta do Drive, junto dos PDFs | não baixa nada |

Três decisões: a cópia é **da aba**, não da planilha inteira (senão levaria o
cadastro de contas junto); a planilha temporária **some nos dois caminhos**,
inclusive quando o Google recusa; e a cópia **não consome a Referência** —
quem queima o número é o PDF, que é o documento que vai ao SIGA.

### 5.12 Os cadastros — 11 listas, e as invariantes

`CONTAS POR PIA`, `CARTÕES PRÉ-PAGOS`, `DIÁCONOS (SIGNATÁRIOS)`, `FORMAS DE
MOVIMENTAÇÃO`, `REGRAS ENTRE CONTAS`, `FINALIDADES`, `ONDE CADA FINALIDADE
VALE`, `STATUS (ETAPAS)`, `ADMs, CNPJ E LOCALIDADES`, `ABREVIATURAS DE
BANCOS`, `CONTROLE DA NUMERAÇÃO`.

As invariantes valem para **todas**:

- **a chave identifica a linha** (uma coluna ou uma lista delas);
- **coluna nova vai no fim**, nunca no meio;
- **recriar preserva o que existe**: só acrescenta linha nova e completa
  coluna nova. **Não troca o valor de uma célula que já tem dono** — numa
  coluna em que vazio *significa* alguma coisa, escrever por cima apagaria uma
  decisão da tesouraria;
- por isso, **um valor novo do projeto não chega sozinho** a quem já tem a
  aba: ou digita na célula, ou substitui a lista pela importação;
- **só a lista `aposentadas` autoriza tirar uma linha** — fechada, escrita à
  mão, chave por chave. Nunca uma regra do tipo "tire o que o projeto não traz
  mais": isso apagaria toda conta e todo diácono cadastrado por ele;
- **formatar como texto antes de escrever**, em todo mundo que escreve;
- onde um campo tiver um conjunto fechado de valores, **declare os valores** e
  confira contra a lista.

**No texto das contas, banco entra abreviado com no máximo 6 letras** (`BB`,
`SANT`, `CEF`). Banco novo: o sistema **sugere** e **pergunta**; nunca decide
sozinho.

**Importação:** qualquer lista aceita arquivo ou texto colado, para
acrescentar ou substituir. Se uma linha estiver fora do formato, a importação
é **recusada por inteiro, nunca pela metade**. Antes de gravar, o sistema
confere se os dados parecem ser daquela lista e **pergunta** se estranhar.

### 5.13 O formulário — comportamentos obrigatórios

- **filtro-ao-digitar em todo combo**; é o motivo de ele existir;
- **o número da conta acha com ou sem o ponto** (`10010` → `100.10`); sai só o
  ponto **entre dígitos**, e nada disso chega ao papel;
- **o campo PIA filtra sempre que tem valor**, e a lista **alarga sozinha**
  para o cadastro inteiro quando o que se digita não existe naquela PIA,
  dizendo **no topo da lista** que alargou;
- **um lado nunca muda por causa do outro**;
- **reabre no último preenchimento**, com a Referência sempre nova e um botão
  de limpar;
- **o cargo do assinante só aparece quando precisa ser digitado**, e vem de
  quem foi escolhido **agora**, nunca de quem estava antes;
- **o teclado anda pelos campos** (Tab e setas ← →, estas só com a lista
  fechada), e não pelo botão de limpar;
- **o número do cartão vai colado na conta**, porque é o cartão que diz qual é
  a conta;
- **toda mensagem verde ou vermelha aparece na faixa E numa caixa de
  diálogo**; o azul de "estou fazendo" não abre caixa, porque não é resultado;
- **a conferência vermelha abre a caixa uma vez por quebra**, e nunca na
  abertura da tela;
- **a única trava do sistema é a regra entre contas** — e ela tem porta: a
  chave `RESTRICOES_ATIVAS` desliga todas. Todo o resto **avisa e deixa
  seguir**.

---

## 6. A arquitetura, e as invariantes técnicas

**A planilha "Comprovante" é só a camada de impressão.** Todo o preenchimento
passa pelo formulário, que escreve nela por trás. Decidido depois de comparar
com digitar direto nas células — e não se reabre: célula mesclada é ruim de
tocar no celular, e o Sheets não filtra lista suspensa enquanto se digita.

**Nada de AppSheet, nada de app Android, nada de montar o PDF por HTML.** Já
avaliado e descartado.

As invariantes que fazem o sistema funcionar:

1. **A regra mora num arquivo só** (`06_Tipos_E_Regras.gs`, funções `nucleo*`),
   e a tela a recebe **injetada**: o servidor lê o código-fonte dessas funções
   e o cola dentro do HTML, numa marca. Assim a tela responde na hora da tecla
   sem perguntar ao Google, **e não existe uma segunda cópia da regra**.
2. **O núcleo é ES5 puro**: nada de `SpreadsheetApp`, nada de chamar função de
   fora, nada de `=>`, `let` ou `const`. Aquele texto vai rodar no navegador.
3. **As marcas são comandos, não comentários** — o `getContent()` devolve o
   arquivo sem comentários.
4. **Os dois arquivos declaram versão** (`VERSAO_DA_TELA` e
   `VERSAO_DO_NUCLEO`, iguais de propósito): é o que faz o sistema dizer
   **qual** arquivo está atrasado, em vez de falhar longe da causa.
5. **Num App da Web não existe planilha ativa.** Cada clique é uma execução
   nova: o id da planilha fica nas **propriedades do script**, e cada porta de
   entrada abre a planilha antes de tudo.
6. **A mesma tela serve à janela e à aba inteira**, de um arquivo só — o
   servidor troca uma linha (`var EM_ABA_INTEIRA = false;`) quando serve a
   aba, e a única diferença é quem fecha.
7. **O `/exec` serve uma fotografia**: depois de mexer, reimplantar.

---

## 7. A bancada — e por que ela existe

Ela existe porque **o teste dele custa caro**: ele cola arquivo por arquivo,
uma mensagem por vez, e cada defeito que chega até ele gasta uma rodada. Hoje
são **851 conferências**:

| Comando | O que prova |
|---|---|
| `node ferramentas_de_conferencia/testar_etapa4.js .` | 585 — o formulário contra os `.gs` de verdade, célula por célula. Roda também com `--sem-sheets`, pelo caminho antigo, e tem de dar o mesmo resultado |
| `node ferramentas_de_conferencia/testar_gestos.js .` | 213 — o que acontece quando alguém digita, sai do campo, clica num item ou num botão (jsdom) |
| `node ferramentas_de_conferencia/testar_tela.js .` | 53 — a lógica da tela fora do navegador |
| `node ferramentas_de_conferencia/conferir_tela.js apps_script/04_Formulario_Tela.html /tmp` | o JavaScript compila, nenhum `alert`, todo `elem('x')` tem um `id="x"` |
| `node ferramentas_de_conferencia/medir_tela.js` | mede a tela num **Chromium de verdade**: altura pedida em cada zoom, largura das colunas, campo cortado por dentro |
| `node --check` em cada `.gs` (copiando para `.js`) | sintaxe |

Instalar uma vez: `npm install jsdom playwright --no-save` — **as duas no mesmo
comando**, senão cada `--no-save` desinstala a anterior.

**Quem testa a tela testa a tela MONTADA** (`montar_tela.js`), com o núcleo
injetado e os comentários apagados, que é o que o Google entrega. Testar o
`.html` cru deixaria passar justamente o defeito que não dá sinal nenhum.

---

## 8. O que está pronto, o que falta, o que foi decidido não fazer

**Pronto e em uso:** o layout do comprovante; a aba Cadastros com as 11 listas
e a importação; o extenso, as somas e a cadeia conta → PIA → CNPJ → título →
cabeçalho; o formulário inteiro (janela e aba); as regras entre contas; o PDF
por código; a cópia em planilha.

**Falta na Etapa 4:** a seção de Cadastros dentro do formulário; a redundância
entre tipo e modo de lançamento (4.1); o cartão reutilizado por outra pessoa
ao longo do tempo (4.6); desligar `AUTOMATISMOS_NA_PLANILHA`.

**Anotado como opção** para a versão beta ou a final: os quatro botões a mais
na barra de ações (4.7 do `docs/09_pendencias_e_decisoes.md`), já analisados e
medidos.

**A Etapa 5 é o que vem agora:** gerar os **2 ou 3 PDFs de uma vez**, um por
etapa, com o Status certo em cada um e o cabeçalho trocado no Recebimento
quando as ADMs forem diferentes; gravar no Histórico; e salvar, ao lado de
cada PDF, o **arquivo `.md` de recuperação** com os dados que o originaram.

**Etapa 6:** o Histórico e o relatório mensal.

---

## 9. Como retomar

Num chat novo e limpo, com o prompt de `PROMPT_ETAPA_5.md`. A regra que ele
fixou, e que vale daqui para a frente:

> **Cada etapa roda num chat novo e limpo. Cada uma aprende com todas as
> anteriores, e tem de ser melhor do que cada uma delas.**

E o princípio deste documento, nas palavras dele: **passar a experiência à
próxima geração — ensiná-la e orientá-la sobre quais erros deve evitar e
prevenir de antemão.**
