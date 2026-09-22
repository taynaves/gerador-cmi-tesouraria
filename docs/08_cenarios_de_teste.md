# Cenários de teste do formulário (Etapa 4)

**Para que serve:** conferir o formulário com dados escolhidos de propósito,
de um jeito em que **cada conferência que falha aponta uma peça só**. Se algo
der errado, me diga apenas o código — por exemplo *"3b falhou"* — e eu já sei
onde procurar, sem precisar adivinhar.

**Antes de começar:** os cenários usam contas e cartões que já estão na sua
aba Cadastros. Nenhum deles gera PDF, **menos o cenário 8** — os outros param
no botão *Preencher o comprovante*, que só escreve na aba. Nada é enviado a
lugar nenhum e nada é apagado do seu Drive.

**Como olhar o resultado:** depois de clicar em *Preencher o comprovante*,
a faixa verde no topo da janela resume o que foi escrito. Para ver o
documento, feche a janela e olhe a aba **Comprovante**.

**Os números deste arquivo foram calculados contra o seu cadastro de verdade**
(**27 contas**, 42 cartões, 14 tipos, 11 diáconos), não estimados.

> **Mudou desde a 1ª rodada:** as contas passaram de 14 para **27** — a `100.10`
> entrou em todas as PIAs, e Sonora, São Gabriel, Costa e Alcinópolis ganharam
> `201.9 - CARTÃO DE CRÉDITO` e `204.9 - CARTÃO DE DÉBITO`. Só Coxim tem `100.20`
> e `100.30`, porque contas de viagem e de música só existem na PIA da sede da
> regional. Os números dos cenários 3d, 4c e 4g foram refeitos por causa disso.

---

## Cenário 1 — A conta manda: PIA, CNPJ, título e cabeçalho saem dela

*Isola a cadeia conta → PIA → CNPJ → título → cabeçalho, dentro da mesma PIA.*

**Preencha:**

| Campo | Valor |
|---|---|
| Origem → Conta | `PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE` |
| Destino → Conta | `PIA-COXIM: 100.10 - CAIXA OBRA DA PIEDADE` |
| Tipo | `Transferencia interna entre Caixa e Banco` |
| Valor | `300` |

**Confira:**

| | O que tem de acontecer |
|---|---|
| **1a** | Ao escolher cada conta, o campo **PIA logo acima se preenche sozinho** com `PIA - COXIM`. Você não digita PIA nenhuma. |
| **1b** | Abaixo de cada conta aparece uma linha cinza: `PIA - COXIM · ADM Coxim-MS · SIGA 101.10` (e `SIGA 100.10` no destino). |
| **1c** | O seletor **"Etapa que vai ser impressa agora"** passa a mostrar **2 opções**: `APROVADA (1 de 2)` e `EFETIVADA (2 de 2)`. |
| **1d** | Ao pé da tela, em verde: *"Esta movimentação gera 2 documentos: APROVADA → EFETIVADA."* |
| **1e** | Depois de *Preencher o comprovante*, a faixa verde diz **Título: COMPROVANTE DE MOVIMENTAÇÃO INTERNA**. |
| **1f** | Na mesma faixa, os dois CNPJ são `03.673.233/0001-43`. |
| **1g** | Na aba Comprovante, o valor por extenso é **`(TREZENTOS REAIS)`**. |

**Se falhar:** 1a → a conta não está preenchendo a PIA · 1c/1d → a comparação
que decide 2 ou 3 documentos · 1e → a regra do título · 1f → a ligação
PIA → ADM → CNPJ · 1g → o valor por extenso.

---

## Cenário 2 — PIAs diferentes: 3 documentos e outro título

*Isola a mesma comparação, agora no caso oposto. Só muda o destino.*

**Preencha** (pode aproveitar o cenário 1 e trocar **só o destino**):

| Campo | Valor |
|---|---|
| Origem → Conta | `PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE` |
| Destino → Conta | `PIA-SÃO GABRIEL: 101.17 - ACG - AG:01 CC:127884427 - PIEDADE` |
| Tipo | `Transferencia entre departamentos - entre bancos` |
| Valor | `1800` |

**Confira:**

| | O que tem de acontecer |
|---|---|
| **2a** | O seletor de etapa passa a mostrar **3 opções**: `APROVADA (1 de 3)`, `PAGA (2 de 3)`, `RECEBIDA (3 de 3)`. |
| **2b** | A faixa verde diz **Título: COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS**. |
| **2c** | O extenso é **`(UM MIL E OITOCENTOS REAIS)`** — com o "UM" na frente, como manda a praxe do documento de valor. |
| **2d** | Os dois CNPJ continuam `03.673.233/0001-43` (São Gabriel é da mesma ADM Coxim). |

**Se falhar:** 2a → a contagem de etapas · 2b → a regra do título · 2c → o
`DIZER_UM_ANTES_DE_MIL` · 2d → a tabela de ADMs do cadastro.

---

## Cenário 3 — Um lado nunca mexe no outro

*A regra que mais custou caro no projeto. Este cenário só existe para ela.*

**Partindo do cenário 2 já preenchido na tela**, faça **uma coisa de cada vez**
e, entre uma e outra, olhe o lado que você **não** tocou:

| | O que fazer, e o que tem de acontecer |
|---|---|
| **3a** | Troque **só a conta de origem** para `PIA-COXIM: 100.20 - CAIXA VIAGENS MISSIONÁRIAS`. O bloco **DESTINO** tem de ficar **exatamente igual**: mesma conta, mesma PIA, mesma linha cinza. Nada pisca, nada esvazia. |
| **3b** | Agora troque **só a conta de destino** para `PIA-SONORA: 101.16 - ACG - AG:01 CC:127884146 - PIEDADE`. O bloco **ORIGEM** tem de ficar intacto, ainda em `100.20`. |
| **3c** | Escreva `sonora` no campo **PIA da origem** e escolha `PIA - SONORA`. Como a conta de origem (`100.20`) é de outra PIA, **ela é apagada** — e só ela, e a lista passa a ter as **4** contas de Sonora. O destino não se mexe. |
| **3d** | Clique no **×** do campo PIA da origem. A lista de contas da origem volta a ter as **27** contas; o destino continua onde estava. |

**Se falhar:** qualquer um dos quatro → os dois lados estão compartilhando
estado. É o defeito mais grave possível aqui, porque produz comprovante com a
conta de uma PIA e o CNPJ de outra, sem ninguém perceber.

---

## Cenário 4 — O filtro enquanto se digita

*Isola a busca. É o motivo de o formulário existir.*

Digite no campo **Conta de origem** e conte quantas linhas aparecem na lista
(sem escolher nenhuma):

| | Digite | Tem de aparecer |
|---|---|---|
| **4a** | `coxim sant` | **3** contas: 101.12, 101.13 e 101.14 |
| **4b** | `sant coxim` | **as mesmas 3** — a ordem das palavras não importa |
| **4c** | `caixa obra` | **5** contas: a `100.10 - CAIXA OBRA DA PIEDADE` de cada uma das 5 PIAs |
| **4d** | `sao gabriel` (sem acento) | **1** conta: `PIA-SÃO GABRIEL: 101.17` — o acento não atrapalha |
| **4e** | `127884427` | **1** conta: a mesma 101.17 — dá para buscar pelo número |
| **4f** | `sanduiche` | *"Nada na lista com esse texto."* |
| **4g** | `coxim 101` | **11** contas. Parece demais e está certo: Sonora, São Gabriel e Alcinópolis também são da **ADM Coxim-MS**, e o grupo contábil delas é `101 - BANCOS CONTA MOVIMENTO`. A busca olha a linha cinza de baixo também, não só o nome da conta |
| **4j** | Digite `PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE` e saia do campo com **Tab**, sem clicar na lista | A conta **fica escolhida**, a PIA se preenche e a lista de tipos filtra. Era exatamente isto que falhava antes |
| **4k** | Digite `conta que nao existe` e saia com Tab | O texto **continua à vista**, o campo fica com borda amarela, e a conferência avisa que falta escolher conta. Não apaga em silêncio |

Agora no **modo lote**, no campo **Documento / cartão** da primeira linha:

| | Digite | Tem de aparecer |
|---|---|---|
| **4h** | `sandra` | **1** cartão: `127698298`, com *"Sandra irmã da piedade"* embaixo |
| **4i** | `tayna` (sem til) | **4** cartões — o til não atrapalha |

**Se falhar:** 4b → a busca está exigindo a ordem · 4d/4i → a busca está
presa ao acento · 4e → a busca não olha o número · 4h → a lista de cartões
não chegou na tela.

---

## Cenário 5 — A cascata dos tipos

*Isola o filtro que usa a coluna "Entre PIAs diferentes" do cadastro.*

| | O que fazer | Tem de acontecer |
|---|---|---|
| **5a** | Com a tela recém-aberta (nenhuma conta escolhida), clique no campo **Tipo** | Aparecem os **14** tipos, e a dica diz *"A lista se ajusta depois que as duas contas forem escolhidas"* |
| **5b** | Monte o **cenário 1** (as duas contas em PIA-COXIM) e clique no campo Tipo | Aparecem **10** tipos. A dica vira *"Mostrando os tipos que valem dentro da mesma PIA"* |
| **5c** | Ainda no 5b, procure `Transferencia entre departamentos - entre bancos` | **Não está na lista** — é um tipo só para PIAs diferentes |
| **5d** | Monte o **cenário 2** (PIAs diferentes) e clique no campo Tipo | Aparecem **9** tipos, e a dica vira *"...entre PIAs diferentes"* |
| **5e** | Ainda no 5d, procure `Transferencia entre bancos CONTA MOVIMENTO` | **Não está na lista** — é um tipo só para a mesma PIA |
| **5f** | Escolha um tipo no 5d e depois troque o destino para uma conta de PIA-COXIM | O tipo escolhido **continua lá, não é apagado**, e aparece um aviso amarelo: *"O tipo não combina com as contas escolhidas"* |

**Se falhar:** 5b/5d com número errado → a leitura da coluna "Entre PIAs
diferentes" · **5f com o tipo apagado** → a tela está limpando campo por conta
própria, que é o contrário da regra de avisar sem bloquear.

---

## Cenário 6 — Lote de cartões: uma linha por lançamento e a soma

*Isola o modo lote, a soma e o rótulo "Valor Total:".*

**Preencha:**

| Campo | Valor |
|---|---|
| Origem → Conta | `PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE` |
| Destino → Conta | `PIA-COXIM: 204.9 - CARTÃO DE DÉBITO` |
| Tipo | `Carregamento de cartao pre-pago` |
| Valor | marque **Vários lançamentos (lote)** |

Três linhas (use o botão **+ Acrescentar lançamento**):

| Data | Documento / cartão | Beneficiário | Valor |
|---|---|---|---|
| 10/09/2026 | `127698298` | (deixe o formulário preencher) | `300` |
| 10/09/2026 | `127698421` | (deixe o formulário preencher) | `250,50` |
| 11/09/2026 | `127698603` | (deixe o formulário preencher) | `449,50` |

**Confira:**

| | O que tem de acontecer |
|---|---|
| **6a** | Ao escolher cada cartão, o campo **Beneficiário se preenche sozinho** com o nome do titular |
| **6b** | O total ao pé do lote mostra **`Total: R$ 1.000,00`** |
| **6c** | Na aba Comprovante, a tabela tem **exatamente 3 linhas**, sem nenhuma linha em branco sobrando |
| **6d** | O rótulo do campo de valor virou **`Valor Total:`** (não `Valor:`) |
| **6e** | O extenso é **`(UM MIL REAIS)`** — a soma, não o valor de nenhuma linha |
| **6f** | O título é `COMPROVANTE DE MOVIMENTAÇÃO INTERNA` (as duas contas são de PIA-COXIM) |
| **6g** | Troque a data da 3ª linha para `10/10/2026`. Aparece aviso amarelo: *"O lote mistura meses diferentes"* — e o botão **continua funcionando** |
| **6h** | Desfaça o 6g. Apague duas linhas pelo **×** e deixe só a primeira. A tabela na aba passa a ter **1 linha**, e o total é `R$ 300,00` |
| **6i** | Volte para **Um lançamento só** e preencha `500`. Na aba, a tabela **some inteira** — rótulos, linhas e TOTAL — e não sobra resto do lote anterior |

**Se falhar:** 6b/6e → a soma · 6c/6h → quantas linhas ficam visíveis ·
6d → a troca do rótulo · **6i com sobra do lote aparecendo** → a limpeza da
tabela antes de escrever.

---

## Cenário 7 — Os avisos avisam, e nunca travam

*Isola a regra "avisar, nunca bloquear". Todos estes têm de deixar você seguir.*

| | O que fazer | Tem de acontecer |
|---|---|---|
| **7a** | Escolha a **mesma conta** nos dois lados | Aviso **vermelho**: *"Origem e destino são a mesma conta"*. Os dois botões do rodapé **continuam clicáveis** |
| **7b** | Clique em *Preencher o comprovante* mesmo assim | Funciona. O comprovante é escrito na aba |
| **7c** | Escolha o tipo `Zerar Conta` | Aviso amarelo: *"este tipo tem o sentido invertido"*, explicando que a origem recebe crédito |
| **7d** | Escolha `Transferencia Debito (cartao-cartao ou cartao-conta ACG)` | O mesmo aviso. São só esses dois tipos no cadastro |
| **7e** | Deixe todos os assinantes em branco | Aviso amarelo: *"Menos de 3 assinaturas"* |
| **7e2** | Escolha `Adalto Azevedo Pereira` no 1º espaço e abra a lista do 2º | **Adalto não aparece mais.** Quem já assina sai da lista dos outros espaços |
| **7e3** | Escreva o nome dele à mão no 2º espaço mesmo assim | Aviso **vermelho**: *"O mesmo assinante em mais de um espaço"*. E três repetições do mesmo nome **não** tiram o aviso de "menos de 3 assinaturas" — a conta é de pessoas, não de linhas |
| **7f** | Preencha assim mesmo e olhe a aba | Os seis espaços de assinatura saem **em branco**, para caneta ou carimbo |
| **7g** | Deixe o valor zerado | Aviso amarelo: *"Valor zerado"* |
| **7h** | Corrija tudo (contas diferentes, tipo normal, 3 assinantes, valor preenchido) | Os avisos somem e sobra **um só, verde**: *"Tudo conferido"* |

**Se falhar:** qualquer botão que **desabilite** → a regra de nunca bloquear
foi quebrada · 7h que não fica verde → sobrou um aviso disparando à toa.

---

## Cenário 8 — Assinantes por etapa (e o PDF)

*Isola a pergunta única dos signatários e a geração do arquivo. **Este gera PDF.***

**Preencha** o cenário 2 (PIAs diferentes, 3 etapas) e depois:

| | O que fazer | Tem de acontecer |
|---|---|---|
| **8a** | Em *Quem assina*, escolha `Não, mudam por etapa` | Aparecem **3 blocos**: *Assinantes da etapa APROVADA*, *da etapa PAGA* e *da etapa RECEBIDA* |
| **8b** | No bloco APROVADA, escolha `Adalto Azevedo Pereira` no 1º espaço | O campo **Cargo se preenche sozinho** com `Diácono` |
| **8c** | No bloco RECEBIDA, escolha `Taynã Araujo Naves` no 1º espaço | Idem |
| **8d** | Volte para `Sim, os mesmos` e depois para `Não` de novo | Os nomes que você escolheu **não se perdem** |
| **8e** | No 6º espaço, escreva um nome que **não está na lista**, por exemplo `Fulano de Tal`, e escreva o cargo à mão | Aceita. É o espaço do signatário esporádico |
| **8f** | Deixe a etapa em `APROVADA (1 de 3)` e clique em **Preencher e gerar o PDF** | A faixa fica azul (*"pedindo o PDF ao Google…"*) e depois verde, com dois links: **Abrir o PDF** e **Abrir a pasta** |
| **8g** | Abra o PDF | **Uma página só**, na horizontal do papel A4, com o nome do 1º assinante da etapa APROVADA |
| **8h** | Olhe o nome do arquivo | `CMI-` + a Referência com traço no lugar da barra + `-APROVADA - ` + a data de hoje. Ex.: `CMI-CMP-26-001-APROVADA - 26_09_21.pdf` |
| **8i** | Volte à janela e troque a etapa para `PAGA (2 de 3)`, depois *Preencher e gerar o PDF* de novo | Sai um 2º PDF, com Status `PAGA` e o assinante daquela etapa — e **com a mesma Referência** do primeiro |

**Se falhar:** 8a → a contagem de etapas não chegou nos assinantes · 8d → os
nomes estão se perdendo na troca · 8g com **duas páginas** → o layout saiu da
medida (me diga, é do cenário 9 do arquivo de estado) · 8i com Referência
diferente → o consumo do número está errado.

---

## Cenário 9 — A Referência não se digita

*Isola a regra nova: a Referência é gerada pelo sistema, e as duas exceções
custam um clique a mais e um motivo por escrito.*

| | O que fazer | Tem de acontecer |
|---|---|---|
| **9a** | Abra o formulário e tente **clicar e digitar** no campo Referência | **Não deixa.** O campo é cinza e travado, e embaixo diz *"Gerada pelo sistema"* |
| **9b** | Gere um PDF (cenário 8f) e olhe o campo Referência de novo | Ele já mostra o **número seguinte**. O número só é consumido quando o PDF sai — abrir o formulário e desistir não queima número |
| **9c** | Clique em **preciso de outro número** | Abre um painel amarelo com duas opções: *Segunda via* e *Histórico perdido* |
| **9d** | Com *Segunda via* marcada, escreva `CMP-26/001` e **deixe o motivo em branco** | Aviso amarelo: *"Exceção sem motivo escrito"* |
| **9e** | Escreva o motivo, por exemplo `2ª via — o diácono perdeu o comprovante do envelope` | O aviso do 9d some. Sobra um avisando que o documento vai sair fora da sequência, **de propósito** |
| **9f** | Gere o PDF | Sai com `CMP-26/001`, e o campo do sistema **continua no mesmo número de antes** — segunda via não consome número nenhum |
| **9g** | Clique em **Voltar para a referência do sistema** | O painel fecha e o campo volta ao número gerado |
| **9h** | Abra o painel de novo e marque *Histórico perdido ou fora de alcance*. Escreva `CMP-26/050` e um motivo | Depois de gerar, a contagem **se acerta por ele**: a próxima passa a ser `CMP-26/051` |

**Se falhar:** 9a com o campo editável → a trava não entrou · 9b com o número
parado → o consumo não aconteceu · 9f com o número andando → a segunda via
está consumindo, que é justamente o que ela não pode fazer.

---

## Cenário 10 — Cabeçalho de outra ADM

*Isola a troca do cabeçalho institucional. Só a PIA-COSTA é de outra ADM.*

| Campo | Valor |
|---|---|
| Origem → Conta | `PIA-COSTA: ACG - AG:01 CC:128175700 - PIEDADE` |
| Destino → Conta | `PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE` |
| Tipo | `Remessa para outra ADM/localidade` |
| Valor | `2500` |

| | O que tem de acontecer |
|---|---|
| **10a** | A linha cinza da origem diz `PIA - COSTA · ADM Costa Rica-MS` |
| **10b** | A faixa verde mostra CNPJ de origem `15.409.246/0001-99` e de destino `03.673.233/0001-43` — **diferentes** |
| **10c** | Na aba Comprovante, o cabeçalho no alto mostra `COSTA RICA - MS`, `RUA TERCIO TEIXEIRA MACHADO , 759` e `CNPJ 15.409.246/0001-99` — é a **ADM de origem**, que é quem aprova e quem paga |
| **10d** | São 3 etapas (`APROVADA → PAGA → RECEBIDA`) |

**Se falhar:** 10c mostrando Coxim → o cabeçalho não está seguindo a origem.

> **O que ainda não dá para testar:** o PDF de **RECEBIDA** deveria sair com o
> cabeçalho da **ADM de destino** (Coxim), e não da origem. A função que faz
> isso já existe e está testada, mas quem a chama por etapa é a segunda parte
> da Etapa 5, que ainda não foi construída. Por enquanto as três etapas saem
> com o cabeçalho da origem.

---

## Cenário 11 — Recriar os Cadastros não destrói nada

*Isola a diferença entre **criar** e **recriar**. Faça depois de já ter gerado
pelo menos um PDF, para o contador não estar no zero.*

| | O que fazer | Tem de acontecer |
|---|---|---|
| **11a** | Anote a Referência que o formulário mostra agora (ex.: `CMP-26/004`) | |
| **11b** | Na aba Cadastros, escreva uma conta nova na primeira linha vazia do bloco CONTAS: PIA `PIA-TESTE`, e no *Texto que aparece na lista* escreva `PIA-TESTE: 999.9 - CONTA DE MENTIRA` | |
| **11c** | Menu **Tesouraria CMI → Criar / recriar a aba Cadastros** | Aparece uma faixa dizendo quantos registros foram **mantidos** e qual é a próxima Referência |
| **11d** | Abra o formulário | A Referência é **a mesma** que você anotou em 11a — não voltou para `CMP-26/001` |
| **11e** | Procure `PIA-TESTE` no campo de conta | **A conta de mentira continua lá.** Recriar não apaga o que você cadastrou |
| **11f** | Procure `caixa obra` | **5** contas: a `100.10` de cada PIA. As novidades do projeto entraram junto com o que já existia |
| **11g** | Apague a linha `PIA-TESTE` da aba Cadastros quando terminar | |

**Se falhar:** 11d com a Referência zerada → recriar está destruindo o
controle da numeração, que é o defeito que gera documento com número repetido
no SIGA · 11e sem a conta → recriar está apagando cadastro feito à mão ·
11f com menos de 5 → a junção do que existia com o que o projeto traz está
descartando linhas demais (a "chave" de cada lista).

---

## Se algo der errado

Me diga **só o código** (*"5f falhou"*, *"6c saiu com 5 linhas"*) e, se der,
o que apareceu na tela. Cada cenário acima foi montado para que a resposta a
essa pergunta seja uma peça só do código — não preciso que você investigue.

Se a janela abrir e **nenhum botão funcionar, sem mensagem nenhuma**, é a
armadilha conhecida do `HtmlService`: me avise e eu procuro no JavaScript da
tela, não no resto.
