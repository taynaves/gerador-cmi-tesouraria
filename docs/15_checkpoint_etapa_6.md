# Checkpoint da Etapa 6 — o relatório mensal, e o nome novo

Fechado em **24/09/2026**, com a Etapa 6 **construída e conferida na
bancada** — o teste dele na planilha é o próximo passo (cenários 21 a 23 de
`08_cenarios_de_teste.md`). Ramo: `claude/cmi-comprovante-layout-quo9wg`.
Bancada: **1.124 conferências** verdes (768 do servidor, pelos dois caminhos
de escrita; 303 de gestos; 53 da tela), depois dos consertos do teste dele, a conferência da tela e o
`node --check` de cada `.gs`.

---

## 0. O que é este documento, e como se lê

É a continuação do `14_checkpoint_etapa_5.md` e do `13_checkpoint_etapa_4.md`,
**não a substituição deles**. O 13 tem a regra do negócio inteira até a Etapa
4; o 14, o que a Etapa 5 acrescentou; este, o que a Etapa 6 acrescentou. Os
três juntos, mais `01_regras_negocio_ATUAL.md`, `16_relatorio_mensal.md` e os
`cadastros/*.csv`, bastam para recriar o sistema sem o código.

**Leia primeiro a seção 4** — o que evitar de antemão.

---

## 1. O que a Etapa 6 entregou, em uma página

- **O relatório mensal** (`07_Relatorio_Mensal.gs`, arquivo novo). Menu
  **Relatório mensal** → janelinha com o mês (já no anterior) → **Montar o
  relatório** refaz a aba **Relatório**; **Gerar o PDF do relatório** salva o
  PDF na pasta dos comprovantes, deitado e ajustado à largura.
- **Uma linha por lançamento**, cada linha de lote à parte, e **cada
  comprovante uma vez**, pela Referência. Colunas: Data, Referência, Nº SIGA,
  Lançamento, Documento / cartão, Beneficiário / finalidade da linha, Valor,
  Conta de origem, Conta de destino, Finalidade, Forma, PDFs gerados.
- **Conta, nunca soma.** No fim, "N comprovantes, M lançamentos"; depois, as
  correções, segundas vias e números escritos à mão, só para conferência.
- **Duas colunas novas no fim do Histórico:** *Linhas do lote* (JSON) e
  *Emissão* (a hora do 1º PDF do clique).
- **O nome novo:** *Gerador de comprovantes para o SIGA*; menu
  **Tesouraria • CMP p/ SIGA**; PDF `CMP-26-001-APROVADA - 26_09_23.pdf` e
  `.md` `CMP-26-001.md`, sem o `CMI-` na frente.

Arquivos que mudaram: **todos os `.gs` menos o `00_Escrita_Rapida.gs`**, a
tela (uma mensagem com o nome do menu) e o arquivo novo `07`. O `00` teve o
cabeçalho trocado e **desfeito de propósito**: um comentário só não vale uma
colagem a mais para ele.

---

## 2. A história, na ordem em que aconteceu

1. **Ler antes de tudo — e a cópia local estava atrasada.** O prompt mandava
   ler `14_checkpoint_etapa_5.md` e os `_ATUAL`, e eles não estavam no disco:
   o clone começou antes do último envio. Um `git fetch` + `git pull` trouxe
   tudo. Sem isso, a etapa começaria com o `CLAUDE.md` velho.
2. **A regra da contagem, primeiro.** Lendo o `05_Gerar_PDF.gs`, o comentário
   dizia "quem quiser somar por movimentação filtra pela etapa 1". Estava
   errado, e a primeira pergunta a ele foi essa: **contar pela Referência**,
   segunda via nunca, correção vale a mais nova. Aprovado.
3. **O que já andou.** Proposta: o que não andou vai para uma lista à parte.
   Ele aprovou e corrigiu a premissa: **na mesma PIA, EFETIVADA = PAGA +
   RECEBIDA**, um ato só; o meio-termo só existe entre PIAs.
4. **Aba e PDF**, **as quatro partes**, **o mês pela data do comprovante,
   escolhido pelo menu** — uma pergunta por mensagem, cada resposta gravada no
   `09_pendencias_e_decisoes.md` e enviada ao GitHub na hora.
5. **A virada.** Na sexta pergunta, ele informou que **alguns comprovantes
   serão gerados direto pelo SIGA**: com dois lugares de geração, relatório
   contábil é inviável. O relatório virou **lista dos comprovantes gerados**,
   com o lote linha por linha, para saber se um lançamento já teve
   comprovante pelo app. Saíram a soma por conta e a regra do "já andou";
   ficaram a aba + PDF, o mês, o lote linha por linha e as exceções.
6. **Tudo antes da beta é teste** e será apagado — por isso nada se construiu
   para recuperar lotes antigos.
7. **O nome.** "CMI" só dizia um dos dois documentos. Ele propôs
   "Comprovantes para o SIGA" e "cmpv p/ SIGA"; a ressalva foi que "cmpv"
   pedia explicação e que "CMP" já é o começo da Referência; ele fechou em
   **Gerador de comprovantes para o SIGA** e **Tesouraria • CMP p/ SIGA**.
8. **Construção**, com a bancada escrita junto, e cada regra nova quebrada de
   propósito (seção 3.4).

---

## 3. Os defeitos, um a um — sintoma, causa e lição

### 3.1 A mesma hora juntou o comprovante errado com o corrigido

**Sintoma:** na bancada, o relatório mostrou o comprovante corrigido com o
valor **errado** (1.800 em vez de 900).
**Causa:** a primeira regra de "mesma emissão" era só a coluna *Emissão*, que
é uma hora **em segundos**. A bancada gerou a correção no mesmo segundo do
original: as duas emissões viraram uma, e a linha mais nova do grupo era a do
comprovante errado.
**Lição:** uma chave de agrupamento com resolução menor que o intervalo entre
os eventos junta o que não devia. Uma pessoa não clica tão rápido — mas a
regra não pode depender disso. Hoje "a mesma emissão" exige a mesma hora
**e** o mesmo jeito de sair o número, o mesmo motivo e nenhuma etapa
repetida. E o teste do mesmo segundo ficou na bancada, em forma pura.

### 3.2 O comentário que ensinava a regra errada

**Sintoma (achado lendo, antes de qualquer código):** o `05_Gerar_PDF.gs` e o
`07_gerar_pdf.md` diziam "quem quiser uma linha por movimentação filtra pela
etapa 1".
**Causa:** escrito na Etapa 5, pensando no caso comum, sem pensar na correção
nem na etapa recusada.
**Lição:** **comentário é especificação que ninguém testa.** Ele foi corrigido
nos dois lugares, e a regra certa virou código com conferência — inclusive o
caso "etapa 1 não existe" e o caso "a correção deixa a linha errada".

### 3.3 A cópia local atrasada

**Sintoma:** os arquivos que o prompt mandava ler não existiam no disco.
**Causa:** o clone da sessão foi feito antes do último envio da Etapa 5.
**Lição:** **`git fetch` e `git pull` ANTES de ler**, e não só antes de
encerrar (a lição 10 do checkpoint 5 dizia só "antes de encerrar"). Está no
`CLAUDE.md`, seção 5.

### 3.3b O lote que saía vazio — um defeito da Etapa 4, achado no teste da 6

**Sintoma:** o CMP-26/020 (lote) saiu com a tabela vazia e o total preenchido
— no download pelo Google **e** no PDF do sistema.
**Causa:** a fila de escritas (`fecharEscritor_`) compara cada célula com uma
foto da folha tirada **antes** da fila. O preenchimento apaga as 32 linhas do
lote e depois escreve as que existem, então cada célula do lote entrava na
fila duas vezes: `''` e o valor. Quando o valor era igual ao da foto (o mesmo
lote, uma etapa depois; ou preencher e depois gerar), a escrita do valor era
pulada como "já está certa" — e o apagar, não. **Todo lote saía vazio do 2º
PDF em diante.**
**Por que ninguém viu em duas etapas:** a bancada conferia o lote **na folha,
depois de um preenchimento**, e nunca **no PDF da 2ª etapa**. A foto que ela
tirava de cada PDF tinha Status, cabeçalho e assinante — não o lote.
**Lição:** **uma otimização que pula trabalho precisa ser testada no segundo
passo, não no primeiro.** E a foto de cada PDF agora leva o lote.

### 3.4 As onze quebras de propósito

Cada regra nova foi quebrada numa cópia do projeto, e a bancada acusou todas:

| Quebra | Falhas |
|---|---|
| segunda via conta como comprovante | 4 |
| vale a emissão mais antiga | 12 |
| filtrar pela etapa 1 | 6 |
| emissão só pela hora (o defeito 3.1) | 5 |
| Histórico sem as linhas do lote | 4 |
| lote todo na data do comprovante | 2 |
| o comprovante passa a sair "ajustado à largura" | 1 |
| uma linha de TOTAL no relatório | 2 |
| erro de sintaxe na janelinha | 1 do servidor + 7 de gestos |
| menu sem o item do relatório | 1 |
| o texto da segunda via reescrito no `05` | 11 |

A última merece nota: o relatório reconhece a segunda via pelo **texto** que o
Histórico grava ("segunda via de um comprovante já emitido"). Reescrever essa
frase no `05` faria o relatório listar a via como comprovante novo — por isso
há conferência que amarra os dois arquivos.

### 3.5 Duas coisas da bancada

- **Um teste de gesto pediu o mês 13** numa lista que não tem 13: o `select`
  fica sem escolha e o script da janelinha estourava ao ler o rótulo. Não
  acontece de verdade, mas a janelinha passou a se defender (e o teste usa um
  ano inválido, que é o erro possível).
- **O playwright procura um navegador que não está instalado.** Script próprio
  tem de passar `executablePath: '/opt/pw-browsers/chromium'`, como o
  `medir_tela.js` faz. Está no `CLAUDE.md`, seção 4.

### 3.6 O 2º teste dele: a caixa roxa calada, e o simulacro que mentia

- **"Na caixa roxa não mudou nada."** O que a correção mudou era escrito só
  **na geração** — e estava certo: os `.md` do teste (`CMP-26-021`,
  `CMP-26-022`) dizem "corrigidos: valor e lançamentos do lote" e
  "corrigidos: data de emissão e valor". O defeito era de **quando**, não de
  **o quê**. Hoje a caixa pergunta ao servidor enquanto ele corrige
  (`previaDaCorrecao`), pela mesma comparação da geração, e a bancada confere
  que a prévia e o registro dizem a mesma coisa.
- **A caixa travada de "Gerando…"** só sai quando outra toma o lugar dela.
  Um erro da tela ao mostrar o resultado a deixaria presa, sem botão. A rede
  (`try` no retorno) foi escrita — e **a quebra de propósito não acusou**: o
  simulacro do `google.script.run` mandava o erro de **dentro** do
  `withSuccessHandler` para o `withFailureHandler`, coisa que o Google não
  faz. O simulacro foi corrigido; sem a rede, a bancada agora estoura.

### 3.7 O 3º teste: a segunda via que deixava mudar o valor

Com "Segunda via" escolhida, ele mudou o valor, e a tela deixou. Pedido
dele: travar tudo, e uma caixa roxa com dois caminhos (emitir como está, ou
virar correção). A trava é **pelo gesto** — um ouvinte só, na fase de
captura, para foco, clique, `mousedown` e tecla —, e não campo a campo:
campo novo já nasce travado. Conferida no jsdom **e com clique e Tab de
verdade no Chromium** (o jsdom não é um navegador; o foco pelo clique só
existe no de verdade). Oito quebras de propósito, oito acusadas.

A trava segura o que **já estava** na tela, que pode não ser o original —
o `.md` ainda não é lido de volta (pedido a, Etapa 7). Por isso a caixa roxa
também diz se a tela é o original, pela mesma comparação da correção.

---

## 4. O que evitar de antemão — a lista da próxima geração

Soma-se às listas dos checkpoints 13 (seção 4) e 14 (seção 4), que continuam
valendo inteiras.

1. **`git fetch` e `git pull` antes de ler qualquer coisa.** O disco pode
   estar atrasado em relação ao que ele mandou ler.
2. **Comentário que ensina regra é especificação sem teste.** Ao ler um,
   desconfie; ao escrever um, prove a regra com conferência.
3. **Chave de agrupamento tem de distinguir o que não é a mesma coisa.** Hora
   em segundos não separa dois eventos no mesmo segundo; junte a ela o que
   diferencia os eventos.
4. **Quando o pedido dele mudar de rumo no meio, registre a virada e o
   motivo**, e retire as decisões que caíram — não deixe duas versões
   convivendo no `09`. Foi feito na hora, antes de continuar perguntando.
5. **Relatório que não pode somar não soma nem "sem querer"**: há conferência
   que procura TOTAL e a soma dos valores na aba.
6. **Um texto gravado que outro arquivo lê de volta precisa de conferência que
   amarre os dois** (o "Como saiu o número").
7. **Nome visível muda; nome interno que reconhece o que já existe, não**
   (`MARCA_PROTECAO`, `CHAVE_MOVIMENTACAO`). Mudar a marca das proteções
   deixaria cada campo com duas.
8. **Mudança só de comentário num arquivo que não precisa ser colado se
   desfaz** — ela custa uma colagem a ele e não muda nada.
9. **Otimização que pula trabalho ("só grava o que mudou") se testa na
   repetição**: o mesmo lote duas vezes, a 2ª etapa, preencher e depois
   gerar. Foi assim que o lote vazio passou por três etapas.
10. **Texto que nomeia uma escolha mora num lugar só** (`NOMES_DAS_EXCECOES`):
    escrito à mão em cada aviso, a Conferência disse "Histórico perdido" para
    quem escolheu "Corrigir".
11. **Janela montada como texto dentro do `.gs`** (a do relatório) tem de ter a
   sintaxe conferida **e** ser clicada num navegador de mentira; foi o que
   pegou a quebra 3.4 em sete lugares.
12. **Simulacro tem de errar como o original erra.** Um simulacro mais
    "gentil" que o Google (que desvia um erro para o lugar certo) esconde
    justamente o defeito que a quebra de propósito procura. Se a quebra não
    acusar, desconfie primeiro do simulacro.
13. **Tudo o que só aparece depois de gerar, ele vai procurar antes.** Se a
    tela vai escrever algo sozinha, mostre enquanto ele preenche.

---

## 5. A regra do negócio que a Etapa 6 acrescentou

Especificação — junto com `16_relatorio_mensal.md` (o detalhe) e o
`01_regras_negocio_ATUAL.md` (seção 11, R-REL-MES-1 a 10).

### 5.1 O relatório

- É a **lista** dos comprovantes gerados **por este app** num mês. **Não soma**:
  há comprovante gerado direto no SIGA. Conta comprovantes e lançamentos.
- **Uma linha por lançamento**: único = 1; lote = uma por linha do lote.
- O **mês** é o da data impressa no comprovante; no lote, a de cada linha. Um
  comprovante entra no mês se alguma linha dele cair ali.
- Escolhe-se pelo menu, numa janelinha que já vem no mês anterior.
- Sai numa **aba** (refeita a cada pedido, protegida por aviso) e em **PDF**
  (deitado, ajustado à largura, páginas numeradas, na pasta dos comprovantes,
  `Relatório CMP - AAAA-MM - AA_MM_DD.pdf`, refeito antes de exportar). Não
  pede autorização nova.

### 5.2 Cada comprovante uma vez

- Pela **Referência**, nunca pela etapa 1.
- **Segunda via** não repete; aparece só nas exceções. Comprovante com **só**
  segunda via no Histórico aparece, marcado.
- **Correção:** valem os dados da emissão mais nova — inclusive a data.
- **PDFs gerados:** todas as etapas que saíram, em ordem; a que não saiu na
  emissão mais nova leva *(antes da correção)* ou *(emissão anterior)*.
- **Mesma emissão:** linhas seguidas com a mesma *Emissão*, o mesmo "Como saiu
  o número", o mesmo motivo, sem etapa repetida.

### 5.3 O Histórico

Duas colunas no fim: *Linhas do lote* (JSON: data `aaaa-mm-dd`, documento e
beneficiário em caixa alta, valor) e *Emissão* (a hora do 1º PDF do clique).
Coluna que falta volta no fim sozinha.

### 5.4 O nome

| Onde | Antes | Agora |
|---|---|---|
| Sistema | Gerador de CMI | Gerador de comprovantes para o SIGA |
| Menu | Tesouraria CMI | Tesouraria • CMP p/ SIGA |
| PDF | `CMI-CMP-26-001-APROVADA - 26_09_23.pdf` | `CMP-26-001-APROVADA - 26_09_23.pdf` |
| Recuperação | `CMI-CMP-26-001.md` | `CMP-26-001.md` |
| Título da janela / aba do formulário | Comprovante de Movimentação Interna | Gerador de comprovantes para o SIGA |

Os nomes internos `MARCA_PROTECAO` e `CHAVE_MOVIMENTACAO` continuam com "CMI"
(seção 4, item 7). O repositório e o ramo também.

---

## 6. O que ficou de fora de propósito

| O quê | Por quê |
|---|---|
| Soma, saldo, entradas/saídas por conta | Há comprovante gerado direto no SIGA |
| Recuperar as linhas dos lotes antigos | Tudo antes da beta é teste e será apagado |
| Filtro por PIA | Deixou de fazer sentido com a lista, e não foi pedido |
| Apagar sozinho o PDF de relatório anterior | Destrutivo; o nome leva o dia, e o mais novo se reconhece |

**Uma consequência a dizer a ele antes da beta:** os `.md` passaram a se
chamar `CMP-26-001.md`. Uma segunda via de um comprovante **de teste** feito
antes desta etapa não acha o `.md` antigo (`CMI-…`) e cria outro. Como tudo
antes da beta será apagado, não há efeito real.

---

## 7. Como retomar

1. **Primeiro, o teste dele** da Etapa 6 (cenários 21 a 23). Se algo falhar,
   procure a causa — e lembre de perguntar se ele testou na janela ou na aba
   inteira (a aba precisa ser reimplantada).
2. Depois, num chat novo e limpo, com o texto de `PROMPT_ETAPA_7.md`. Os
   candidatos à Etapa 7 estão em `09_pendencias_e_decisoes.md`, seção 5 —
   **quem escolhe é ele**.

> **Cada etapa roda num chat novo e limpo. Cada uma aprende com todas as
> anteriores, e tem de ser melhor do que cada uma delas.**
