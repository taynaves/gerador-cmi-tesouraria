# Como os cartões são escriturados no SIGA — o que os documentos mostram

Levantado em **29/09/2026**, a pedido dele, cruzando:

- dois prints do SIGA com as setas para o detalhe de cada lançamento: a
  consulta **Cartão Viagens** e a consulta **Cartão Piedade**;
- o extrato da conta **CARTÃO DE DÉBITO** (código 2049), PIA-COXIM,
  01/08 a 30/09/2026 (SIGA TES01202);
- o **Relatório de Viagens** de 24/08 a 30/09/2026 (SIGA VIA00124);
- o **Relatório de Atendimentos** da reunião de 06/09/2026 (SIGA PIA00817 e
  PIA00702);
- o cadastro de cartões do projeto (`cadastros/cartoes.csv`).

**Ainda faltam, para fechar:** o plano de contas e o balancete (que dão o
nome de cada código) e o diário do período. O diário foi citado por ele, mas
não chegou junto com os anexos. Por isso tudo o que depende do NOME de uma
conta está marcado como **dedução**.

**Informação dele:** a despesa da viagem e o atendimento em reunião são
lançados **sozinhos** pelos módulos do SIGA. O **carregamento** dos cartões é
lançado **à mão**. No cartão da Secretaria (compras de material de consumo),
a carga e o gasto são ambos lançados à mão.

---

## 1. Os códigos que aparecem

| Código | O que é | Como se sabe |
|---|---|---|
| **10120** | 101.20 — ACG VIAGEM (CC 127865707) | É o "Cód. reduzido SIGA" dos 10 cartões de viagem no cadastro |
| **10115** | 101.15 — ACG PIEDADE (CC 127866218) | Idem, dos cartões do Atendimento e da Secretaria |
| **10010** | 100.10 — CAIXA OBRA DA PIEDADE | O mesmo padrão (100.10 → 10010) — **dedução** |
| **2049** | 204.9 — CARTÃO DE DÉBITO | O título do extrato diz "Conta CARTÃO DE DÉBITO" |
| **1047** | a conta da consulta "Cartão Viagens" (provavelmente 104.7) | É a única conta presente em todos os lançamentos daquela consulta — **dedução**; o nome vem do plano de contas |
| **1046** | a conta da consulta "Cartão Piedade" (provavelmente 104.6) | Idem |
| **3204** | despesa de viagens missionárias | Histórico 008 - ATEND.VIAGENS MISSIONAR. — **dedução** |
| **3100** | despesa de atendimento | Histórico 044 - ATENDIMENTO — **dedução** |

## 2. Viagens (cartão de viagem, módulo de viagem)

Quatro lançamentos detalhados nos prints, e todos seguem o mesmo par:

| Passo | Quem lança | Débito | Crédito | Histórico | Documento |
|---|---|---|---|---|---|
| **Carga do cartão** | à mão (Tipo Origem: CONCILIAÇÃO CARTÃO DÉBITO/CRÉDITO) | **1047** Cartão Viagens | **10120** ACG VIAGEM | 106 - COMPRA/SAQUE CARTÃO DÉBITO | "Nº" do cartão, no histórico |
| **Gasto da viagem** | sozinho (PIEDADE - DESPESA CARTÃO DE VIAGEM) | **3204** despesa | **1047** Cartão Viagens | 008 - ATEND.VIAGENS MISSIONAR. | nº do envelope ("DESPESA CARTÃO 000328") |

**A carga é por ENVELOPE, e não por cartão.** Em 12/09 o cartão 127699031
recebeu duas cargas de 220,00, uma para o envelope 000336 e outra para o
000337.

**O cartão NÃO é sempre do viajante.** O número do cartão está no relatório,
em cada envelope, e em três deles o cartão é de outra pessoa:

| Envelope | Viajante | Cartão usado | Titular do cartão (cadastro) |
|---|---|---|---|
| 000329 | Mariene Mateus da Fonseca | 127699221 | Taynã Araujo Naves |
| 000336 | Rute Ramos da Silva | 127699031 | Lindomar dos Anjos Souza |
| 000348 | Aildo Souza Gomes | 127699049 | Edinaldo Fernandes da Silva Jr. |

O print confirma o primeiro: carga de 100,00 no 127699221 em 30/08, e
despesa "DESPESA CARTÃO 000329" em 31/08.

**O relatório de viagens fecha nas três colunas** (conferido linha a linha):
- Adiantamento 3.292,25 — **inclui os envelopes cancelados** (000330, 000343,
  000346, 000347: 520,10). Não é o dinheiro que saiu.
- Devolução 1.557,00 e Despesas 2.165,15.
- Em envelope **em dinheiro**, adiantamento = devolução + despesas (000334:
  210 = 37 + 173).
- Em envelope **com cartão**, adiantamento = devolução e despesas = o gasto
  no cartão (000328: 100 / 100 / 100). O adiantamento em dinheiro é todo
  "devolvido", porque o dinheiro foi no cartão.

**Dois envelopes que valem conferir:** 000339 (despesas 220,00 com
adiantamento de 210,00) e 000338 (baixado com despesa zero e o adiantamento
todo devolvido).

## 3. Piedade — reunião de atendimento

### 3.1 Reunião de 08/08 (print Cartão Piedade)

| Passo | Débito | Crédito | Histórico | Valor |
|---|---|---|---|---|
| "ADTO REUNIÃO … VALOR INICIAL" (sozinho) | **1046** Cartão Piedade | **10010** caixa | 001 - ADTO | 4.200,00 |
| Atendimentos — diáconos | **3100** | **1046** | 044 - ATENDIMENTO | 2.000,00 |
| Atendimentos — irmãs | **3100** | **1046** | 044 - ATENDIMENTO | 2.200,00 |

A conta 1046 entra com 4.200 e sai com 4.200: termina zerada.

### 3.2 Reunião de 06/09 (extrato 2049 e relatório)

O relatório diz: "Valores carregados nos cartões de compras: 7.700,00" e
"Valor inicial em DINHEIRO": vazio. Os atendimentos foram só em cartão, um
cartão por grupo:

| Cartão | Responsável | Relatório | Extrato 2049 |
|---|---|---|---|
| 127698421 | Francisca Pereira Ribolis | 1.900,00 | 1.900,00 |
| 127698298 | Sandra Leite Teles | 1.900,00 | 1.900,00 |
| 127698694 | Kelen Adriana Carrenho Ribeiro | 2.400,00 | 2.400,00 |
| 127698702 | Rosalda Oliveira Barbosa de Paula | 600,00 | 600,00 |
| 127698850 | Andréia da Silva Ferreira | 900,00 | 900,00 |
| | **Irmãs, 11:30** | **7.700,00** | **7.700,00** |

E mais duas saídas de 1.000,00 ("… 12:31 - DIÁCONOS", documento 237), de
outra reunião do mesmo dia, cujo relatório não veio.

**No extrato 2049 só há SAÍDAS.** Nenhuma entrada, e o saldo em 30/09 é
**−9.700,00**. O módulo lançou o gasto (atendimento contra a 2049), e a carga
dos cartões — que é lançada à mão — ainda não foi lançada.

## 4. O que os documentos, juntos, dizem

1. **No SIGA, carregar um cartão NUNCA é "da ACG para a mesma ACG".** É um
   lançamento entre a **conta ACG** (a conta do banco: 101.15 ou 101.20) e uma
   **conta de cartão** (1046, 1047 ou 2049). No **banco** (PagCorp), sim, o
   dinheiro não sai da conta ACG — o cartão é um saldo dentro dela. Os dois
   jeitos de ver são verdadeiros, cada um no seu livro; o comprovante é
   anexado ao **lançamento do SIGA**, e é o livro do SIGA que ele documenta.
2. **O −9.700,00 da 2049 é exatamente o que este sistema existe para
   comprovar:** as cargas manuais que faltam — origem **101.15 ACG PIEDADE**,
   destino **204.9 CARTÃO DE DÉBITO**, uma linha por cartão (é um lote).
3. **A Piedade usou duas contas de cartão diferentes em dois meses:** 1046
   ("Cartão Piedade") em 08/08, e 2049 (CARTÃO DE DÉBITO) em 06/09. O
   cadastro do projeto só conhece a 204.9. Qual delas vale hoje é pergunta
   para ele (e para o plano de contas).
4. **O "valor inicial" de 08/08 saiu do CAIXA (10010), e não da ACG.** Os
   cartões são carregados pela ACG no banco. Se nada corrigiu isso depois, o
   caixa registra uma saída de 4.200,00 que não aconteceu em dinheiro, e a ACG
   deixa de registrar uma que aconteceu. Só o diário confirma.
5. **Cada cartão pertence a UMA conta ACG**, e o cadastro já diz qual: a
   coluna "Cód. reduzido SIGA" do cartão (10115, 10120) é o código da conta
   ACG. É por ela que a lista de cartões pode ser filtrada pela conta.
6. **Viagem: a carga é por envelope, e o cartão pode não ser do viajante.**
   Num lote de cargas de viagem, a linha é o envelope; o beneficiário é o
   viajante, que pode não ser o titular do cartão. O preenchimento automático
   do beneficiário pelo titular (que existe hoje) erraria nos três casos da
   seção 2. É a pendência 4.4 de `09_pendencias_e_decisoes.md` (cartão usado
   por outra pessoa) — e ela não é rara: é rotina.
