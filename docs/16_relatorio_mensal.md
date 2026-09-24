# O relatório mensal dos comprovantes gerados

Fica em `apps_script/07_Relatorio_Mensal.gs`. Menu **Tesouraria • CMP p/ SIGA
→ Relatório mensal**. Construído na Etapa 6 (24/09/2026), com cada decisão
tomada com o Taynã, uma pergunta por vez.

---

## 1. O que ele é — e o que ele não é

**É a lista dos comprovantes que este app gerou num mês**, com os dados de
cada um e **cada linha de lote à parte**. Serve para responder uma pergunta:
*"este lançamento financeiro já teve o comprovante gerado pelo app, ou não?"*

**Não é relatório contábil nem financeiro.** Começou como um resumo por conta
(entradas, saídas, saldo) para bater com o extrato, e mudou no meio da etapa,
por decisão dele: **alguns comprovantes passam a ser gerados direto pelo
SIGA**. Com dois lugares de geração, somar só os que saíram daqui daria um
número com cara de saldo que não é saldo. Por isso:

- **não existe soma de valores em lugar nenhum** — só a contagem
  (*"3 comprovantes, 7 lançamentos"*);
- o próprio relatório diz isso no alto, para ninguém procurar o total.

Uma bateria confere que não aparece nem "TOTAL" nem a soma dos valores na aba.

## 2. Como se usa

1. **Tesouraria • CMP p/ SIGA → Relatório mensal.** Abre uma janelinha com o
   **mês e o ano**, que já vem no **mês anterior** — o relatório é de
   fechamento. Troque se quiser outro.
2. **Montar o relatório** refaz a aba **Relatório** com aquele mês e mostra,
   na própria janelinha, quantos comprovantes e lançamentos entraram.
3. **Gerar o PDF do relatório** (só depois de montar; trocar o mês exige
   montar de novo) refaz a aba e salva o PDF **na pasta dos comprovantes**,
   com botões para abrir o PDF e a pasta.

Para achar um lançamento na aba: **Ctrl+F** pelo valor, pelo cartão ou pelo
Nº SIGA.

## 3. O que cada linha mostra

**Uma linha por lançamento**: o comprovante único ocupa uma; o lote de 5
ocupa 5. Colunas, aprovadas por ele:

| Coluna | De onde vem |
|---|---|
| Data | Data impressa no comprovante; no lote, a data **de cada linha** |
| Referência | `CMP-26/NNN` |
| Nº SIGA | Numeração SIGA, se houver |
| Lançamento | `Único`, ou `Lote 2 de 5` |
| Documento / cartão | Só no lote: a coluna DOCUMENTO / CARTÃO da linha |
| Beneficiário / finalidade da linha | Só no lote |
| Valor | O valor do lançamento (número, em reais) |
| Conta de origem / Conta de destino | Como saem no papel, com o nº do cartão colado |
| Finalidade, Forma | As do comprovante |
| PDFs gerados | As etapas que saíram: `APROVADA · PAGA · RECEBIDA` |

A coluna **PDFs gerados** é o que mostra se um comprovante ficou pela metade
(só a APROVADA saiu, por exemplo) — sem calcular nada.

No fim da lista, a contagem. Depois, a parte **só informativa**:
**Correções, segundas vias e números escritos à mão**, com a Referência, o
que foi, quando, quais PDFs e o motivo escrito. Ela existe para o Conselho
Fiscal ver as exceções sem abrir o Histórico; nada nela repete comprovante.

## 4. A regra: cada comprovante uma vez

**O Histórico tem uma linha POR PDF, e não por comprovante.** Um comprovante
entre PIAs deixa três linhas; uma correção deixa as do errado e as do certo;
uma segunda via repete o comprovante. Listar o Histórico direto mostraria o
mesmo comprovante várias vezes, com valores diferentes.

A regra, decidida com ele:

1. **Cada comprovante aparece uma vez, pela Referência** — não uma vez por
   PDF.
2. **Não pela etapa 1.** A documentação antiga dizia "filtre pela etapa 1", e
   estava errada nos dois sentidos: a correção deixa a linha errada lá (a
   etapa 1 sai duas vezes), e a etapa 1 pode nem ter saído (o Google recusou a
   APROVADA; alguém gerou só a EFETIVADA).
3. **A segunda via não repete o comprovante** — é reimpressão de um que já está
   listado. Aparece só nas exceções.
4. **Na correção valem os dados da emissão mais nova.** Se a correção mudou a
   data de mês, o comprovante muda de mês junto.
5. **"PDFs gerados" junta todas as etapas que saíram — da versão atual** —,
   marcando as de uma emissão anterior. Uma etapa de uma emissão com outro
   total ("2 de 3" contra "1 de 2") é de outro comprovante e não conta: no
   teste dele, a correção do CMP-26/016 passou de 3 etapas para 2, e a PAGA
   e a RECEBIDA antigas apareciam como se valessem. Exemplo: `APROVADA (antes da correção) · PAGA · RECEBIDA (antes da
   correção)`. É por isso que a regra 4 fala dos **dados** e não dos PDFs: o
   caminho que a própria tela ensina para gerar só a etapa que o Google
   recusou é *"Corrigir e gerar de novo"* com ela só marcada — e aí as outras
   continuam valendo.
6. **A segunda via que mudou os dados** (no teste, o CMP-26/017 saiu com
   outro valor e outro Nº SIGA) continua não valendo, e a exceção diz
   **"COM DADOS DIFERENTES do original"**.
7. **Um comprovante só com segunda via no Histórico** (o original é de antes
   dele) aparece, com a marca *(só segunda via no Histórico)*.

A tabela que ele aprovou, e que a bancada prova:

| Linha | Referência | Etapa | Como saiu | Valor | Entra? |
|---|---|---|---|---|---|
| 1–3 | CMP-26/020 | APROVADA, PAGA, RECEBIDA | sistema | 500 | ✔ uma vez |
| 4 | CMP-26/020 | APROVADA | segunda via | 500 | ✘ reimpressão |
| 5–6 | CMP-26/021 | APROVADA, EFETIVADA | sistema | 1.000 | ✘ saiu errado |
| 7–8 | CMP-26/021 | APROVADA, EFETIVADA | correção | 100 | ✔ a mais nova |

Somar o Histórico daria R$ 4.200,00. O relatório lista **dois** comprovantes,
de 500 e de 100 — e não soma.

### O que é "a mesma emissão"

Para saber quais linhas saíram **juntas** (e separar o comprovante errado do
corrigido, que têm a mesma Referência), o Histórico ganhou a coluna
**Emissão**: a hora do 1º PDF do clique, igual em todos os PDFs dele. Mas a
hora é contada em **segundos**, e **a hora sozinha não basta** — a bancada
gerou uma correção no mesmo segundo do original, e as duas viraram uma
emissão só, com o valor errado valendo. Hoje "a mesma emissão" é: linhas
**seguidas** da mesma Referência, com a mesma Emissão, o mesmo jeito de sair
o número, o mesmo motivo e **sem etapa repetida**.

Linhas gravadas antes da coluna existir (sem Emissão) seguem o resto da regra,
que é o mesmo palpite.

### O mês

É o da **Data de emissão impressa no comprovante**, não o do dia em que o PDF
foi gerado: datado 30/09 e gerado 02/10 é de **setembro**. No lote vale a data
de cada linha — um comprovante entra no mês se **alguma** linha dele cair no
mês, e as exceções vão para o mês do comprovante.

## 5. As duas colunas novas do Histórico

No fim, como toda coluna nova (`05_Gerar_PDF.gs`, `COLUNAS_DO_HISTORICO`):

| Coluna | O que guarda |
|---|---|
| **Linhas do lote** | As linhas do lote em JSON — data (`aaaa-mm-dd`), documento, beneficiário (os dois em caixa alta, como no papel) e valor. Vazia no lançamento único |
| **Emissão** | A hora do 1º PDF daquele clique |

Quem já tem a aba recebe as duas sozinho: coluna que falta volta no fim. Um
lote gravado antes delas sai no relatório numa linha só, com o total:
`Lote de 3 (sem as linhas)`. Como tudo o que foi gerado até a beta é teste e
será apagado, **não se construiu nada para recuperar as linhas dos lotes
antigos** — decisão dele.

## 6. A aba e o PDF

- **A aba Relatório é refeita do zero a cada pedido** e nasce **protegida por
  aviso**: anotação feita à mão nela some no próximo pedido. Formato antes do
  valor, como em todo lugar: Data é data, Valor é número em reais, o resto é
  texto.
- **O PDF não segue as regras do comprovante.** Sai **deitado** (são 12
  colunas), **ajustado à largura**, com as **páginas numeradas**, e com
  quantas folhas o mês pedir. As regras do comprovante — uma folha, escala
  100%, nunca "ajustar" — existem para ele coincidir com o do SIGA; o
  relatório não tem com o que coincidir. **E o pedido do comprovante continua
  o mesmo**: `urlDeExportacao_` só muda com o parâmetro que o relatório passa,
  e a bancada confere os dois.
- **Nome:** `Relatório CMP - 2026-09 - 26_09_24.pdf` — o mês e o dia em que
  foi gerado. Gerar de novo não apaga o anterior: pelo nome se sabe qual é o
  mais novo.
- **Refaz antes de exportar, sempre**: o PDF tem de ser do mês que está na
  janela, e não do que ficou na aba de um pedido anterior.
- **Não pede autorização nova do Google**: usa os mesmos serviços que o PDF do
  comprovante já usa.

## 7. O que ficou de fora

| O quê | Por quê |
|---|---|
| Soma, saldo, entradas/saídas por conta | Há comprovante gerado direto no SIGA (decisão dele, 24/09/2026) |
| Recuperar as linhas dos lotes gravados antes da coluna nova | Tudo antes da beta é teste e será apagado |
| Filtro por PIA na janelinha | Deixou de fazer sentido quando o relatório virou lista, e não foi pedido |
| Quem gerou cada comprovante | Pedir o e-mail de quem clica exige autorização nova do Google |
