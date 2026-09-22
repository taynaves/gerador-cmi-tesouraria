# Pendências, regras novas e decisões em aberto

**Atualizado em:** 21/09/2026, depois da 1ª rodada de testes do formulário.

Este arquivo guarda o que o Taynã levantou e **ainda não foi construído**, com
detalhe suficiente para outra conversa retomar sem perguntar de novo. O que já
está pronto está em `docs/00_estado_do_projeto.md`.

---

## 1. Desempenho — resolvido em parte, medido

**O problema medido por ele:** 25 s para *Preencher o comprovante*, 56 s para
*Preencher e gerar o PDF*.

**A causa, medida e não estimada.** No Apps Script cada `getValue`,
`setValue`, `getRowHeight` ou `isRowHiddenByUser` é uma **viagem de ida e
volta pela internet**, e custa o mesmo (~70 ms) faça ela muito ou pouco. O
preenchimento fazia **192** dessas viagens e a geração do PDF, **409** — a
maioria perguntando à planilha coisas que o próprio código acabara de fazer.
A contagem está em `ferramentas_de_conferencia/` (o contador é o
`contar_idas.js`, de rascunho; a lógica está descrita aqui).

**O que foi feito, e quanto rendeu:**

| Operação | Antes | Depois |
|---|---|---|
| Abrir a janela | 18 | 12 |
| Preencher o comprovante | 192 | 52 (41 num 2º lançamento parecido) |
| Preencher e gerar o PDF | 409 | 56 |

**O que o Taynã mediu depois disso:** 12 s para preencher e 29 s para gerar o
PDF — melhor, e ainda longe do instantâneo que ele quer. A medida mais
informativa foi dele: **preencher com dados idênticos aos do lançamento
anterior levou os mesmos 12 s** que preencher com tudo diferente. Isso mostra
que o que sobra **não é a quantidade de escrita**, e sim o custo fixo de cada
conversa com o Google. Todos os caminhos para atacar isso estão em
**`docs/10_desempenho.md`** — inclusive o maior deles, o serviço avançado do
Sheets, que junta dezenas de operações num pedido só.

As quatro mudanças:

1. **Visibilidade calculada, não perguntada** (`visibilidadeDoModo_`). Eram 90
   perguntas "esta linha está escondida?" por clique. O código acabara de
   esconder essas linhas — já sabia a resposta.
2. **Esconder e mostrar em blocos** (`aplicarVisibilidade_`). As 32 linhas do
   lote são vizinhas: um pedido, não 32.
3. **A soma do lote numa leitura só** (`somarLote_`). Eram até 64 viagens.
4. **Escrever só o que mudou** (`abrirEscritor_` / `fecharEscritor_`) — **ideia
   do Taynã**. Lê o bloco inteiro de uma vez (1 viagem) e escreve só as células
   diferentes. Num 2º lançamento parecido: **2 células escritas, 20 já certas**.
5. A conferência da grade antes do PDF passou a custar 2 viagens em vez de
   ~140. A medição completa continua existindo no menu **Conferir o layout
   antes de gerar**, onde a espera é esperada porque foi pedida.

**As duas saídas que ele propôs, avaliadas:**

- *"Ir preenchendo a planilha a cada campo, em silêncio"* — **não resolve, e
  piora.** O custo não é *quando* a escrita acontece: é o número de viagens.
  Escrever campo a campo faria mais viagens, não menos, e ainda escreveria na
  aba dados de um comprovante que a pessoa ainda pode abandonar. A parte boa
  dessa ideia — não reescrever o que já está igual — foi aproveitada e está no
  item 4 acima.
- *"Refazer como aplicativo web"* — **não é necessário para isto.** O que
  segurava não era o Sheets: era o jeito de conversar com ele. Um aplicativo
  web que falasse com a planilha do mesmo jeito seria igualmente lento, e
  jogaria fora o motor de layout já aprovado contra o SIGA.

**O que ainda sobra e não foi feito:** a exportação do PDF em si é uma chamada
pesada do Google (alguns segundos), fora do nosso alcance. E as ~50 viagens
restantes ainda dão margem — o próximo corte seria escrever a folha inteira
num `setValues` só, o que esbarra em células mescladas e precisa ser testado
na planilha de verdade, não no simulador.

---

## 2. Tipos de movimentação — **FEITO**

A lista de tipos era uma lista plana e misturava coisas de níveis diferentes.
Ele propôs três níveis, e passou as regras do cotidiano junto. Está
construído: `apps_script/06_Tipos_E_Regras.gs` no servidor, a seção 3b de
`04_Formulario_Tela.html` na tela, os blocos **FORMAS** e **REGRAS ENTRE
CONTAS** na aba Cadastros, e a coluna **Natureza** nas 27 contas.

**O que mudou em relação ao que ele propôs — e por quê:** os dois primeiros
níveis deixaram de ser escolha. Tipo e subtipo agora se **deduzem** das duas
contas, e o campo aparece tracejado, sem digitação:

| As duas contas | O que o sistema escreve |
|---|---|
| mesma PIA | MOVIMENTAÇÃO INTERNA DE NUMERÁRIOS |
| PIAs diferentes, mesma ADM | TRANSFERÊNCIA DE NUMERÁRIOS — entre departamentos |
| ADMs diferentes | TRANSFERÊNCIA DE NUMERÁRIOS — entre administrações |

É a **mesma comparação** que já decidia se saem 2 ou 3 documentos e qual
título o comprovante leva. Deixá-la decidir também o tipo é o que impede o
comprovante de dizer uma coisa no título e outra no campo Tipo — o que seria
possível enquanto o tipo fosse escolhido à mão.

Sobrou para escolher a **forma** (as 7: DINHEIRO · CHEQUE · TRANSF. BANCÁRIA ·
TED · DOC · SAQUE · PIX) — e mesmo ela costuma sobrar em uma ou duas, depois
das regras entre contas. O campo de finalidade (o antigo "tipo") continua lá,
opcional, e entra depois da forma no texto do documento:

```
MOVIMENTAÇÃO INTERNA DE NUMERÁRIOS · PIX
TRANSFERÊNCIA DE NUMERÁRIOS — ENTRE DEPARTAMENTOS · PIX · CARREGAMENTO DE CARTÃO
```

### A decisão de desenho que mais importa: um par sem regra é livre

As linhas do bloco REGRAS ENTRE CONTAS são **restrições, não permissões**. O
cadastro nasce só com as quatro regras que ele realmente determinou; tudo o
que ninguém proibiu continua valendo. O contrário — exigir uma linha de
permissão para cada par — daria 16 pares de natureza a preencher antes de o
sistema servir para alguma coisa, e qualquer esquecimento viraria um bloqueio
sem explicação.

### As regras falam de natureza, não de conta

"A ACG nunca recebe espécie" é uma regra sobre a **natureza** ACG, não sobre a
conta 101.15. Por isso cada conta ganhou a coluna Natureza (CAIXA · BANCO ·
ACG · CARTAO) e as regras se escrevem entre naturezas, com `*` valendo para
qualquer uma. Uma conta nova da ACG já nasce obedecendo, sem ninguém escrever
regra nenhuma para ela.

### A única trava do projeto — e a porta que ela tem

Todo o resto deste sistema **avisa e não bloqueia**. Esta é a exceção, porque
ele pediu, e ela só se sustenta porque a saída está do lado de dentro: a chave
`RESTRICOES_ATIVAS`, no bloco CONTROLE DA NUMERAÇÃO da aba Cadastros. Em
**SIM**, as listas filtram e os botões travam; em **NÃO**, tudo passa — é o
caminho do ajuste financeiro ou contábil. O aviso que trava diz o nome da
chave e onde ela fica: uma parede sem porta é o que faz a pessoa lançar por
fora do sistema.

A trava mora no **servidor** (`conferirRegraEntreContas_`), no caminho por
onde todo preenchimento passa. A tela trava os botões antes disso, mas aquilo
é a cara amável da regra, não a regra.

### Uma cópia só da regra — resolvido por injeção

A tela precisa responder na hora da tecla; perguntar ao Google a cada letra
devolveria a lentidão que acabou de sair do projeto. A primeira solução foi
escrever a regra duas vezes e **provar por teste** que as duas diziam o mesmo.
Funcionava, mas era um acordo com o problema: toda regra nova nasceria
precisando ser escrita em dois lugares, para sempre.

**Agora existe uma cópia só.** As funções `nucleo*` do `06_Tipos_E_Regras.gs`
não tocam na planilha — recebem dados prontos. Na hora de abrir o formulário,
`regrasParaATela_()` lê o **código-fonte delas** (`Function.prototype.toString()`)
e o servidor o cola dentro do HTML, onde está a marca
`<<< O NÚCLEO DAS REGRAS ENTRA AQUI >>>`. A janela não tem regra própria: só
adaptadores que pegam o que está nos campos e entregam ao núcleo.

O que a bateria prova mudou junto, e ficou mais forte: não que duas cópias
concordam, mas que **a janela está rodando o mesmo texto do servidor, letra
por letra** (`toString()` dos dois lados comparados), que o arquivo `.html`
**não define nenhuma função de núcleo**, e que a montagem **estoura com
mensagem clara** se a marca sumir. Conferido por mutação: escrevendo uma regra
dentro do HTML, a bateria acusa; mudando o separador só no servidor, a janela
passa a usar o novo sem ninguém copiar nada.

### "Zerar Conta", "Transferência Débito" e "Carregamento de cartão" — respondido

Nas palavras dele:

> "Elas podem ocorrer tanto internamente, dentro da mesma pia, ou
> externamente, entre pias da mesma adm. Mas estabelecemos uma pratica interna
> de sempre ser uma transação interna, entre a tesouraria do departamento e os
> seus cartões, para facilitar o controle. É uma preferencia da nossa
> tesouraria, e não uma determinação. Outra administração pode adotar de
> maneira diferente."

Duas consequências, e a segunda é a que importa para o desenho:

1. **São finalidades, não tipos.** Ficam no terceiro nível, opcional, com
   "Entre PIAs diferentes = Indiferente" — que é como já estavam cadastradas.
   Quem decide se a movimentação é interna ou externa continuam sendo as
   contas, não o rótulo escolhido.
2. **A praxe de Coxim não podia virar regra.** Uma linha em REGRAS ENTRE
   CONTAS bloqueia, e o que ele descreveu não é proibição: é o jeito de uma
   tesouraria, que outra pode não seguir. Virou `nucleoPraxeDoCartao` — uma
   **nota** que aparece quando um lado é conta de CARTAO e as duas contas são
   de PIAs diferentes, explica que é praxe e não determinação, e deixa gerar.
   Some pondo NÃO em `PRAXE_CARTAO_NA_MESMA_PIA`, na aba Cadastros.

   A nota olha a **natureza CARTAO**, e não o texto da finalidade: quem
   carrega um cartão pode escrever qualquer coisa no campo de finalidade, mas
   a conta de cartão é a conta de cartão.

### Conta sem Natureza — o silêncio que faltava fechar

Um print do Taynã levantou a dúvida de se a coluna Natureza estava alinhada
com os dados. Estava — mas a conferência escrita para tirar a dúvida achou
outra coisa: **não havia nada garantindo que cabeçalho e linhas de cada lista
tivessem a mesma largura.** Se um bloco ganhasse coluna num lugar só, todo
valor escorregaria uma casa e o cadastro passaria a mentir em silêncio
("Natureza" mostrando "Ativa"). Agora a bateria confere as dez listas, linha
por linha.

E, no caminho, apareceu um buraco de verdade: uma conta **sem Natureza**
preenchida não é alcançada por regra nenhuma. As restrições continuam
ligadas, a lista de formas aparece inteira, e nada denuncia que aquele
lançamento passou por fora de tudo. Agora o formulário avisa, dizendo o que
isso significa e onde consertar — avisa, não trava, porque a conta pode ser
legítima e estar só à espera de cadastro.

### A coluna no meio da lista — três sintomas, um defeito

A coluna **Natureza** foi acrescentada no MEIO do bloco CONTAS. Ao recriar, as
linhas que já estavam na aba tinham uma coluna a menos: foram encostadas à
esquerda e completadas no fim, e tudo da Natureza em diante andou uma casa.
`"Ativa"` virou a Natureza; a Natureza real sumiu.

Daí saíram três queixas que pareciam três problemas:

1. todas as contas e PIAs aparecendo como **(inativa)**;
2. as **formas não sendo filtradas** pelas contas;
3. **DINHEIRO oferecido para a ACG** — e a conferência dando bandeira verde.

O que deixou isso passar por baixo de tudo foi a conferência da Natureza testar
apenas se o campo estava **preenchido**. `"Ativa"` está preenchido. Hoje a
coluna declara os valores que aceita, e a conferência compara com a lista — é
isso que permite **provar** o desalinhamento em vez de suspeitar dele.

`consertarDeslocamento_` desentorta ao recriar, e só quando o conserto **se
prova**: desloca de volta, confere se encaixa e desfaz se não encaixar. Para
uma conta cadastrada à mão, que o projeto não conhece, a Natureza fica **em
branco** em vez de errada — e aí o formulário trava e manda preencher. Chutar
seria inventar dado de tesouraria.

**Regra que ficou:** coluna nova vai no fim da lista, nunca no meio.

### O campo Tipo não repete o título — decidido olhando o documento gerado

> "movimentação interna de numerários é o tipo principal. Já está no título,
> não precisa especificar no tipo de transferência: fica redundante. deixar
> apenas os sub tipos e subsubtipos, a forma e a finalidade"

O comprovante saía com `COMPROVANTE DE MOVIMENTAÇÃO INTERNA` no título e
`MOVIMENTAÇÃO INTERNA DE NUMERÁRIOS · DINHEIRO · TRANSFERENCIA ENTRE BANCOS`
duas linhas abaixo. `nucleoTextoDoTipo` passou a compor **subtipo · forma ·
finalidade**, sem o tipo principal. O campo tracejado da tela continua
mostrando a dedução inteira, porque ali ele serve para conferir que o sistema
entendeu as contas — não é o que vai para o papel.

### As regras de forma por natureza de conta — passadas por ele, 23/09

| Situação | Formas |
|---|---|
| CAIXA como origem | saque em **dinheiro** |
| CAIXA como destino | saque em **dinheiro** ou em **cheque** |
| ACG ↔ ACG, ACG ↔ cartão, cartão ↔ cartão | **transf. bancária** (é a transferência interna à mesma instituição) |
| ACG ↔ banco (outra instituição) | **PIX** |
| ACG com CAIXA | **impossível** — a ACG não movimenta espécie nem cheque |
| CARTÃO | **transf. bancária** |
| CARTÃO → CAIXA (exceção) | saque em **dinheiro** (devolução na prestação de contas) |
| BANCO | todas — **menos SAQUE nas contas Santander** (sem agência na cidade) |

Consequências que caem sozinhas dessas regras, e conferidas na bancada:
`caixa → ACG` fica **impossível** (era o caso que ele trouxe), `SANT → caixa`
também (o caixa só recebe saque, e o Santander não saca), e `banco → banco`
continua aceitando tudo.

As regras da ACG foram **reformuladas por ele em 23/09**, e a dedução que eu
tinha marcado como "CONFIRMAR" virou regra dita: dentro da ACG (contas, seus
cartões, e entre cartões) é **transferência bancária**; ACG com banco de outra
instituição é **PIX**. A regra "ACG sempre PIX" deixou de existir.

Repare no desenho: a impossibilidade entre ACG e caixa não é uma linha que
diz "proibido" — ela **cai sozinha** de duas regras verdadeiras (a ACG não
movimenta em espécie nem cheque; o caixa só movimenta por saque). Regra que
se deduz de outras não precisa ser mantida em dia.

### Quebrei a própria regra da coluna, e o teste que impede a terceira vez

A coluna *Formas que combinam* entrou no **meio** do bloco TIPOS — a mesma
falha da Natureza, cometida logo depois de eu escrever a regra no CLAUDE.md.
Nas abas que já existiam, a Observação escorregou para dentro da coluna das
formas, e a tela passou a anunciar **"0 de 9 combinam com PIX"**: como aquele
texto não é nome de forma nenhuma, toda finalidade parecia restrita.

A coluna foi para o fim — e isso, sozinho, **conserta a aba de quem já tinha
recriado**: as linhas antigas, completadas com um vazio no fim, encaixam
exatamente na ordem nova.

O que ficou de permanente é o teste: para cada lista, a bateria monta a aba
como ela era antes da última coluna existir, recria, e exige que nenhum valor
tenha mudado de coluna. Regra escrita não impediu a segunda vez; teste
impede a terceira.

### O aviso que mentia sobre o campo Tipo

"Sem tipo de transferência — o campo Tipo vai sair em branco" aparecia quando
a **finalidade** estava vazia. Mas a finalidade é opcional, e o campo Tipo
passou a ser composto (subtipo · forma · subforma · finalidade): com PIX
escolhido, o campo saía preenchido e o aviso continuava dizendo que sairia
vazio. Agora o aviso olha **o texto que vai mesmo para o papel**, e só fala
quando ele é realmente vazio.

### O que continua em aberto

- **Quais finalidades combinam com quais formas.** O mecanismo está pronto — a
  coluna *Formas que combinam*, no bloco TIPOS. **Resolvido:** ele passou a
  tabela finalidade por finalidade, e ela está preenchida. Só *Outro
  (especificar na Observacao)* fica vazia — vazia quer dizer "serve para
  qualquer forma", e ali é de propósito.
- Se a **forma** também se aplica às transferências externas ou só às internas.
  Hoje se aplica às duas, que é o que o campo Tipo do SIGA mostra.
- ~~A lista de finalidades ainda tem linhas que repetem o que a árvore já
  deduz.~~ **Resolvido:** ele confirmou que as três "Transferencia entre
  departamentos - ..." não servem, e elas foram aposentadas. O que elas
  carregavam — *entre bancos* / *entre caixas* / *entre caixa e banco* — ele
  quer que apareça na **observação**; falta acertar em qual (ver abaixo).
- ~~Onde entra o "tipo de contas envolvidas".~~ **Resolvido:** é a
  **Observação do comprovante**, escrita pelo sistema a partir das duas
  contas. Ver a seção 9b do `00_estado_do_projeto.md`.
- ~~A Remessa para outra ADM restrita a TED e PIX.~~ **Resolvido:** ele mandou
  acrescentar TRANSF. BANCÁRIA, porque a remessa entre ADMs acontece de conta
  ACG para conta ACG — mesma instituição.
- ~~A coluna *Entre PIAs diferentes* só sabia dizer Sim / Não / Indiferente.~~
  **Resolvido:** ganhou o quarto valor `Só entre ADMs`, e a regra mudou-se
  para o núcleo (`nucleoTipoCabe`).
- **EM ABERTO (pequeno):** a célula da Observação é CLIP. Uma observação longa
  some no fim, no PDF, sem avisar — e agora o sistema gasta uns 20 caracteres
  dela com a frase deduzida. Medir a largura real e avisar na tela é o
  caminho; ligar o WRAP não é (quebraria a folha única).
- As regras da tabela abaixo que **não viraram linha** no cadastro: as de
  cartão de atendimento e de viagem falam de qual conta carrega qual cartão —
  isso é vínculo entre contas específicas, não entre naturezas, e cabe no
  ambiente de contas do item 3.

### Por que dividir, nas palavras dele

> "listar tudo pronto e acabado vai resultar em uma grande lista. Dividindo,
> fica mais rápido. Sem contar que eu posso registrar apenas o tipo, como por
> exemplo 'transferência (externa) de numerários', e só! Todo o resto poderá
> ser gerado automaticamente (ou pelo menos ter as opções filtradas,
> escolhendo uma dentre poucas)."

Ou seja: **o tipo sozinho já basta para emitir**. Subtipo e forma são
refinamentos opcionais, e quando as contas escolhidas só permitem um caminho,
o sistema resolve sem perguntar.

### A árvore proposta

- **Transferência (externa) de numerários** — entre departamentos ou entre
  administrações.
  - *entre departamentos* (de uma mesma administração)
  - *entre administrações* (da mesma regional ou de regional diferente, não
    importa)
- **Movimentação interna (de numerários)** — sempre **dentro do mesmo
  departamento** (mesma PIA), diferenciada pela **forma**:
  SAQUE (com as subformas DINHEIRO e CHEQUE) · TRANSF. BANCÁRIA ·
  TED · PIX.

  O **DOC saiu**: foi extinto pelo Banco Central e não existe mais para
  escolher. Quem já tem a aba Cadastros criada não fica com ele: a linha está
  na lista `aposentadas` do bloco FORMAS, e recriar a aba a tira, dizendo na
  janela que tirou.

### As regras do cotidiano que ele passou

| Regra | Consequência para o sistema |
|---|---|
| Contas da ACG só movimentam **entre contas**, nunca em numerário | **no cadastro:** `ACG \| *` proíbe DINHEIRO |
| Entre a ACG e outra instituição financeira, **somente PIX** | **no cadastro:** `ACG \| BANCO` e `BANCO \| ACG` permitem só PIX |
| **Entre contas da ACG** a movimentação é possível | |
| Entre uma tesouraria (uma conta) e um **cartão**, possível | |
| Cartões, além de compras, fazem **transferência de retorno** à conta que os carregou, e **saque** no banco 24h | |
| **Nenhuma conta da ACG recebe dinheiro em espécie** — é uma *fintech*, não tem agência física, logo não recebe depósito | **no cadastro:** `* \| ACG` proíbe DINHEIRO |
| Cartões de **atendimento** são vinculados a uma sub-secretaria, mas **sempre recebem crédito da conta ACG da Piedade da PIA em questão** | |
| Cartões de **viagem** são vinculados à conta de viagem da PIA regional (hoje PIA-COXIM) e **sempre são carregados a partir da conta de viagens da ACG na regional** | |

**Como isso aparece:** o campo Forma mostra só o que sobrou, e uma linha
embaixo dele diz quantas de quantas valem ali e por quê.

---

## 3. O ambiente de contas e as regras de relacionamento — **a próxima etapa**

É a Etapa 4b: a seção de Cadastros dentro do formulário, que ele quer que seja
mais do que um cadastro — quer que seja **onde as regras vivem**.

### O que ele pediu, nas palavras dele

- Cadastrar **manualmente as contas de cada PIA**.
- Estabelecer as **regras de relacionamento**: que **tipos de transferência,
  tipos de envio e tipos de recebimento** cada conta pode fazer.
- Vir **pré-configurado** com os relacionamentos da determinação **nacional**,
  e permitir que **cada regional ajuste** os seus, porque a situação local
  varia.
- Uma **caixa de marcar para ligar e desligar** essas restrições.

### O comportamento das duas posições da caixa

| Restrições **ligadas** | Restrições **desligadas** |
|---|---|
| As listas suspensas vão se **filtrando sozinhas** conforme ele preenche — economiza o tempo de procurar | As listas mostram tudo |
| **Não deixa gerar** o comprovante nem o PDF enquanto não estiver tudo verde | Deixa gerar situações não permitidas |
| O caminho do dia a dia | O caminho do **ajuste financeiro ou contábil**, que é quando a exceção acontece |

**Sobre "não deixa gerar":** isso parece contrariar a regra de ouro do
projeto ("avisar, nunca bloquear"), mas não contraria — a regra existe porque
*bloquear faz o usuário contornar o sistema por fora*. Aqui a saída está
**dentro** do sistema: é a própria caixa de marcar. O bloqueio é escolhido por
quem usa, e desfeito por quem usa.

### Como a tabela de relações deve ficar

Um bloco novo na aba Cadastros, uma linha por par permitido:

| Coluna | Para que serve |
|---|---|
| Conta de origem (ou grupo: "qualquer ACG", "qualquer caixa") | quem pode mandar |
| Conta de destino (ou grupo) | quem pode receber |
| Tipo / subtipo / forma permitida | o que pode ser feito entre as duas |
| Origem da regra | `nacional` (veio pré-configurada) ou `local` (a regional criou) |
| Ativa | para desligar uma linha sem apagá-la |

As regras da seção 2 deste arquivo (ACG nunca recebe espécie, ACG ↔ banco só
PIX, etc.) são as **linhas pré-configuradas** dessa tabela. Elas saem do
código e viram dado — que é o que permite cada regional ajustar sem programar.

---

## 3b. O preenchimento automático que ele pediu — **e o conflito a resolver**

Ele descreveu o comportamento que quer:

> "se eu escolher movimentação interna (de numerários), se a origem for
> PIA-COXIM, o destino já vai ser preenchido automaticamente como PIA-COXIM.
> E o contrário também: se eu escolher origem e destino PIA-COXIM, o subtipo
> já será automaticamente uma transferência interna, e os subsubtipos ficarão
> restritos a este."

A segunda metade (as contas decidem o tipo) **não tem conflito nenhum** e é a
direção que o projeto já segue.

A primeira metade (o tipo preenche o outro lado) **bate de frente com uma
regra de ouro**: *"nenhum lado pode mudar por causa do outro"*. Essa regra não
é capricho — ela nasceu de um defeito real, em que trocar a conta de origem
mexia no destino e o comprovante saía com a conta de uma PIA e o CNPJ de
outra, sem ninguém perceber.

**Proposta, para ele decidir:** manter a regra e atender a intenção por outro
caminho —

- escolher "movimentação interna" **filtra** a lista de contas do destino para
  a PIA da origem (e vice-versa), em vez de **escolher** a conta por ele;
- se houver **uma única** conta possível naquela PIA, aí sim preencher, e
  mostrando que foi o sistema que preencheu.

Assim ele ganha a economia de procura que quer, e nunca aparece no documento
uma conta que ele não escolheu. **Pergunta aberta — não implementar sem a
resposta dele.**

---

## 4. Ajustes do formulário ainda por fazer

| # | O que | Observação |
|---|---|---|
| 4.1 | **Tipo e modo de lançamento estão redundantes**: escolher "carregamento em lote" no Tipo e "vários lançamentos" no Valor é dizer a mesma coisa duas vezes. Um campo deve restringir o outro, nos dois sentidos | pedido dele, cenário 6 |
| 4.2 | **Lançamento único de cartão** precisa de um campo para o número do cartão. Hoje, no modo único, a tabela some e não há onde informá-lo — e são cartões pré-pagos corporativos, o número é obrigatório | cenário 6i |
| 4.3 | **Gerar os 2 ou 3 PDFs de uma vez.** A janela já tem tudo o que é preciso para as três etapas; hoje sai um por clique | cenário 8g — é a 2ª parte da Etapa 5 |
| 4.4 | ~~**Não limpar o formulário ao reabrir**~~ **FEITO**. A janela reabre com o último preenchimento; a Referência vem sempre nova, e o painel de exceção não volta. Botão **Limpar o formulário** na barra do topo | pedido dele |
| 4.5 | **Tela maximizável**, mostrando todos os campos de uma vez | a janela do Apps Script tem tamanho fixo; dá para aumentar, e há como abrir em barra lateral ou aba inteira — decidir qual |
| 4.6 | **Cartão reutilizado por outra pessoa** por tempo determinado. O cadastro precisa guardar o histórico de responsáveis, não só o atual | ver os dois `.txt` exportados do SIGA que ele enviou |

---

## 5. Correção de lançamento — **feito**

Ele levantou logo no começo: *"precisa permitir ajustar ou corrigir lançamento
equivocado, sem gerar nova referência"*.

Já funciona, e por construção: `consumirReferencia_` **só anda para a frente**,
então gerar de novo com o mesmo número não move a contagem. O que faltava era
o caminho de volta — depois de gerar, o campo já mostrava o número seguinte.
Agora a faixa verde traz o botão **"Saiu errado? Corrigir e gerar de novo com
CMP-26/00X"**, que devolve o número anterior com o motivo já escrito.

---

## 5b. Criar × recriar a aba Cadastros — **feito**

Ele apontou: recriar os Cadastros zerava o contador da Referência, e *"quando
o sistema estiver rodando, isso é um problema"*.

O problema era maior do que o contador: recriar também apagaria as contas que
ele vai cadastrar à mão no ambiente da seção 3. As duas coisas foram
resolvidas juntas:

- **Criar** (a aba não existe): nasce com as listas do projeto, contador no zero.
- **Recriar** (a aba existe): reconstrói a estrutura e **devolve tudo o que já
  estava lá** — contas cadastradas à mão, correções de texto, cartões que
  trocaram de responsável e o controle da numeração. Só então acrescenta as
  linhas novas do projeto que ainda não existiam. A mensagem ao fim diz quantos
  registros foram mantidos e qual é a próxima Referência.

**Um defeito antigo apareceu junto:** a comparação do que "já existe" era
sempre pela primeira coluna. Em CONTAS a primeira coluna é a **PIA**, que se
repete onze vezes — dez das onze contas de PIA-COXIM teriam sumido. Cada lista
agora declara qual coluna a identifica (`chave`), e a **importação de dados
tinha exatamente a mesma armadilha**, também corrigida.

---

## 6. Contas: o que entrou e o que falta confirmar

**Entrou** (`02_Cadastros.gs`), passando de 14 para 23 contas:

- `100.10 - CAIXA OBRA DA PIEDADE` em **todas as PIAs** (era só em Coxim);
- PIA-SONORA e PIA-SÃO GABRIEL ganharam `201.9 - CARTÃO DE CRÉDITO` e
  `204.9 - CARTÃO DE DÉBITO`, completando as listas que ele mandou;
- PIA-COXIM ganhou `201.9 - CARTÃO DE CRÉDITO`, que faltava ao lado da 204.9.

**Respondido por ele e já aplicado** (as contas passaram para **27**):

1. PIA-COSTA e PIA-ALCINÓPOLIS **também têm** `201.9` e `204.9`. Entraram.
2. O grupo contábil da `201.9` é mesmo `201 - OUTRAS OBRIGAÇÕES`.
3. **Só Coxim tem `100.20` e `100.30`.**

**A regra por trás disso, que ele explicou e que vale para o cadastro inteiro:**

> Todas as PIAs, de todas as ADMs e de todas as regionais, têm a **mesma
> codificação simplificada do plano de contas**. O que varia é se a conta foi
> criada ou não. Nenhuma administração ou ponto de atendimento pode ter ativa
> uma conta de **viagem** ou de **música** que não seja na PIA da **ADM sede da
> regional** — nas outras, elas não estão ativas nem cadastradas.

Isso está escrito como comentário no próprio `02_Cadastros.gs`, ao lado da
lista de contas, para não se perder.

---

## 7. Efeito colateral conhecido das contas novas

Agora que todas as PIAs têm a `100.10`, buscar `coxim 100.10` no formulário
devolve **quatro** contas, não uma: Sonora, São Gabriel e Alcinópolis também
são da **ADM Coxim-MS**, e a busca olha a linha de baixo (grupo contábil e
ADM) além do nome da conta. Não é defeito — é a busca fazendo o que deve. Para
achar uma só, use o nome da PIA: `PIA-COXIM: 100.10`.
