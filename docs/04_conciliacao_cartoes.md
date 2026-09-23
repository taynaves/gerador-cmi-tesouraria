# Cartões — o que a PagCorp diz, o que o SIGA diz, e o que falta confirmar

**A PagCorp é a fonte oficial** (é a instituição financeira); o SIGA deve
estar espelhado nela. A conciliação comparou os **64 registros** da árvore de
tesourarias da PagCorp com os dois arquivos de cadastro do SIGA que o Taynã
enviou, e o resultado está em `cadastros/cartoes.csv` — **42 cartões**, cada um
com a coluna `Consta_no_SIGA`.

**Nada disto trava o sistema.** O cadastro já é utilizável com os 42; o que
está aqui são as divergências que precisam da decisão dele — nenhuma foi
"corrigida" por conta própria, porque corrigir cadastro sem perguntar é
inventar dado.

---

## O que já foi respondido

### ✔ PIA-COSTA é uma PIA só, com uma conta só

Era a dúvida mais importante da lista. A árvore da PagCorp mostra PIA COSTA
com duas sub-tesourarias — SECRETARIA (127884922) e ATENDIMENTO (127884955) —,
e parecia que fossem duas contas correntes distintas.

**Não são.** A conta de origem e destino da PIA-COSTA é a **ACG
`AG:01 CC:128175700`**; as duas sub-tesourarias são divisões de cartão dentro
dela no PagCorp, exatamente como a conta `101.15` da PIA-COXIM, que também se
subdivide em duas sem virar duas contas.

Elas chegaram a aparecer na lista CONTAS e **faziam escolher a coisa errada** —
por isso saíram de lá e vivem no cadastro de cartões, como a conta ACG de cada
cartão.

### ✔ Todo cartão é de débito

São pré-pagos corporativos, sem crédito contratado. O arquivo `cartões viagem`
traz a coluna Tipo preenchida como "Débito" nos 9 registros; o arquivo
`cartões piedade` **não tem essa coluna** nos 13. Ao conferir esses 13 no
SIGA, garantir que o Tipo esteja marcado como Débito — o arquivo exportado não
permite confirmar isso.

---

## O que continua em aberto

### 1. Cartão de Cristiane, ausente do SIGA (conta Viagem)

`127699486` — *"Cristiane irmã da piedade (VIAGEM 94.86)"*.

Está na PagCorp, sob a conta ACG `127865707` (Viagem, SIGA `101.20`), e **não
está** na lista de cartões de viagem do SIGA (que tem 9; a PagCorp tem 10 para
essa conta).

Detalhe curioso: o "Centro Custo Cartão" dele na PagCorp é **"Viagem Costa"**,
e não "Viagem Coxim" como os outros nove — mas a conta ACG pai é a mesma de
Coxim. Um cartão de uso ligado a Costa Rica, hospedado na conta de Viagem de
Coxim.

**A pergunta:** ele deveria estar cadastrado no SIGA e foi esquecido, ou há
motivo para não entrar no CMI por enquanto?

### 2. Cartão do Taynã com rótulo "MÚSICA" e hierarquia de "Atendimento"

`127699064` — apelido *"Taynã diácono (MÚSICA 90.64)"*.

Na árvore da PagCorp, a conta pai dele é `127866192` (ATENDIMENTO — Pia
Coxim), **não** `128084027` (Música). O nome fala de Música; a organização diz
Atendimento. E ele não aparece na lista de cartões Piedade do SIGA.

**A pergunta:** o apelido está desatualizado (o cartão foi remanejado e
ninguém renomeou), ou a hierarquia da PagCorp é que está errada? A resposta
decide se ele entra no cadastro como "Atendimento" ou fica de fora até
normalizar.

### 3. Dois cartões de Secretaria ausentes do SIGA — um deles do exemplo real

`127698876` (Gerson, *"SECRETARIA 88.76"*) e `127699726` (Taynã,
*"SECRETARIA 97.26"*).

Os dois existem na PagCorp, sob a sub-tesouraria `128175981` (SECRETARIA — Pia
Coxim), que está na mesma conta SIGA `101.15` do Atendimento. **Nenhum dos
dois consta** na lista de 13 cartões enviada como cadastro do SIGA.

**E isto chama atenção:** o `127698876` é exatamente o cartão citado no
comprovante-teste real enviado no começo do projeto (*"Crédito no cartão
127698876 - Gerson colab. piedade"*). Ou seja, já foi usado num comprovante de
verdade e não está na lista oficial.

**A pergunta:** foram cadastrados sob outro código que não veio no arquivo, ou
faltam mesmo cadastrar?

### 4. Um cartão com conta pai fora do padrão — registrado, sem ação

`127699262` — *"Dede diácono (ATENDIMENTO 92.62)"*.

A conta pai dele na PagCorp é `127865715` ("Piedade (ADM Coxim)", um nível
acima de Atendimento), enquanto todos os outros cartões de Atendimento têm
`127866192`. Ele **está** corretamente listado no SIGA, na conta `101.15`.

**Não precisa de ação**: é uma inconsistência de organização dentro da própria
PagCorp. Fica registrado porque o cadastro do CMI trata esse cartão como
"Atendimento" normalmente, apesar da hierarquia diferente — e alguém que
compare as duas árvores vai estranhar.

---

## Como resolver, quando der

Atualizar `cadastros/cartoes.csv` e importar pela janela
(`05_importar_dados.md`). **Não é preciso reabrir o projeto no Claude Code**
para isso.

## E uma pendência de desenho, que não é de dado

**O mesmo cartão troca de responsável ao longo do tempo**, e o cadastro guarda
só o responsável atual. Um comprovante antigo, recuperado, sairia com o nome
de quem está com o cartão hoje — não com o de quem estava na data. Guardar o
histórico de responsáveis é o item 4.6 de `09_pendencias_e_decisoes.md`.
