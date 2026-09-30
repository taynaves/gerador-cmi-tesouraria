# Como os cartões são escriturados no SIGA — o que os documentos mostram

Levantado em **29/09/2026**, a pedido dele, cruzando **oito documentos** da
PIA-COXIM:

| Documento | SIGA | Período |
|---|---|---|
| Plano de contas | TES01714 | — |
| Balancete auxiliar | CTB01902 | 24/08 a 30/09/2026 |
| Livro diário auxiliar | CTB00902 | 24/08 a 30/09/2026 |
| Extrato da conta CARTÃO DE DÉBITO (2049) | TES01202 | 01/08 a 30/09/2026 |
| Relatório de viagens | VIA00124 | 24/08 a 30/09/2026 |
| Relatório de atendimentos da reunião de 06/09 | PIA00817 / PIA00702 | 06/09/2026 |
| Prints: consulta Cartão Viagens e Cartão Piedade, com o detalhe | — | 08/08 a 12/09/2026 |
| O cadastro de cartões do projeto | `cadastros/cartoes.csv` | — |

**Como se confere:** o diário foi somado conta por conta e bate com o
balancete **em todas as contas que envolvem dinheiro** (10010, 10020, 10110,
10115, 10120, 1044, 1047, 2049, 3100, 3204). Os números abaixo não são
estimativa.

**Informação dele:** a despesa de viagem e o atendimento em reunião são
lançados **sozinhos** pelos módulos do SIGA. A **carga** dos cartões é
lançada **à mão**. No cartão da Secretaria (compras de material), carga e
gasto são os dois lançados à mão (nenhum no período). O cartão de crédito
(2019, 2017) está zerado.

---

## 1. As contas, com o nome do plano de contas

O "código reduzido" do SIGA é o código do plano sem o ponto (`204 9` → 2049 →
204.9, que é como o cadastro do projeto escreve).

| Reduzido | Código | Nome no plano | Grupo | Papel nos cartões |
|---|---|---|---|---|
| 10110 | — | BANCO DO BRASIL AG 0552 CC 16.020-2 | Bancos | De onde sai o dinheiro para as ACG |
| **10115** | — | ACG … AG 0001 (PIEDADE, CC 127866218) | Bancos | A conta ACG da Piedade |
| **10120** | — | ACG … AG 0001 (VIAGEM, CC 127865707) | Bancos | A conta ACG de Viagens |
| 10161 | — | ACG … (sem movimento) | Bancos | **Não está no cadastro do projeto** |
| **1047** | 1.1.2.01.08 | ADIANTAMENTOS P/VIAGENS - CARTÃO DE CRÉDITO | Ativo — adiantamentos | **A "conta do cartão" de VIAGEM** |
| 1046 | 1.1.2.01.07 | ADIANTAMENTOS P/REUNIÕES DE ATENDIMENTOS | Ativo — adiantamentos | Adiantamento de reunião (em 08/08: dinheiro do caixa) |
| 1044 | 1.1.2.01.05 | ADIANTAMENTOS P/VIAGENS MISSIONÁRIAS | Ativo — adiantamentos | O envelope de viagem **em dinheiro** |
| **2049** | 2.1.5.01.05 | CARTÃO DE DÉBITO | Passivo — outras obrigações | **A "conta do cartão" da PIEDADE** |
| 2019 / 2017 | 2.1.1.02.02 / .04 | CARTÃO DE CRÉDITO / CARTÃO DE CRÉDITO - VIAGENS | Passivo | Zeradas |
| 3100 | 3.1.2.01.01 | ATENDIMENTOS REALIZADOS EM REUNIÃO | Despesa | O gasto da reunião |
| 3204 | 3.1.3.01.05 | DESPESAS COM VIAGENS NACIONAIS | Despesa | O gasto da viagem |
| 21012 | 2.3.3.01.12 | TRANSF. DEFINITIVA ENTRE DEPARTAMENTOS | Patrimônio | O lado de Coxim quando ela supre OUTRA PIA |
| 10310 · 10320 · 10360 | — | SANTANDER (aplicações financeiras, grupo 103) | Aplicações | **Não estão no cadastro** (ver pendência 1.6) |

**O nome de 1047 diz "CARTÃO DE CRÉDITO", e ela é usada para o cartão de
débito pré-pago de viagem.** Os cartões são todos de débito
(`04_conciliacao_cartoes.md`). É o nome da conta no plano nacional, e não um
erro de lançamento.

## 2. O caminho do dinheiro, em três degraus

```
                 à mão (TRANSF.VLR)          à mão (COMPRA/SAQUE…)         sozinho (módulo)
BB 10110  ──────────────────────►  ACG  ──────────────────────►  conta do cartão  ──────────►  despesa
                                   10120 (Viagem)                1047 (Viagem)                 3204
                                   10115 (Piedade)               2049 (Piedade)                3100
```

### 2.1 Viagens — os três degraus estão lançados

| Degrau | Débito | Crédito | Histórico | No período |
|---|---|---|---|---|
| BB → ACG VIAGEM | 10120 | 10110 | TRANSF.VLR … SUPRIMENTO / SUPRIR CONTA ACG PARA AT. VIAGENS VIA CARTÃO | 1.200,00 (29/08) + 1.160,00 (12/09) = **2.360,00** |
| **ACG → cartão** (a carga) | **1047** | **10120** | COMPRA/SAQUE CARTÃO DÉBITO Nº *cartão* | 12 cargas, **1.600,00** |
| cartão → despesa | 3204 | 1047 | ATEND.VIAGENS MISSIONAR. - DESPESA CARTÃO *envelope* | 9 despesas, **1.370,00** |

Saldo da 1047 em 30/09: **230,00** (confere com o balancete). A carga é
**uma por envelope**: o cartão 127699031 recebeu duas de 220,00 no mesmo dia,
para os envelopes 000336 e 000337.

**Envelope a envelope** (carga × despesa na 1047):

| Envelope | Viajante | Cartão (titular) | Carga | Despesa | Sobra na 1047 |
|---|---|---|---|---|---|
| 000328 | José Cavalcanti | 127699478 (o próprio) | 100 | 100 | 0 |
| 000329 | Mariene | 127699221 (**Taynã**) | 100 | 100 | 0 |
| 000336 | Rute Ramos | 127699031 (**Lindomar**) | 220 | 220 | 0 |
| 000337 | Lindomar | 127699031 (o próprio) | 220 | 220 | 0 |
| 000338 | Mariene | 127699718 (a própria) | 100 | **—** | **+100** |
| 000339 | Edinaldo | 127699049 (o próprio) | 210 + 10 + **10** | 220 | **+10** |
| 000340 | Edinaldo | 127699049 (o próprio) | 210 | 210 | 0 |
| 000341 | José Cavalcanti | 127699478 | 100 | 100 | 0 |
| 000342 | José Cavalcanti | 127699478 | 100 | 100 | 0 |
| 000344 | João Torquato | 127700326 (o próprio) | **—** | 100 | **−100** |
| 000348 | Aildo | 127699049 (**Edinaldo**) | 220 | (aguardando prestação de contas) | +220 |
| | | | **1.600** | **1.370** | **230** |

Os envelopes **em dinheiro** (000320 a 000335) passam pela 1044 e pelo caixa
10020 (adiantamento, despesa, devolução) e nunca tocam na 1047. No relatório
de viagens, o envelope com cartão aparece com adiantamento igual à devolução.
Isso é só a forma do relatório: no diário não existe devolução nenhuma
desses envelopes.

### 2.2 Piedade — falta o degrau do meio

| Degrau | Débito | Crédito | Histórico | No período |
|---|---|---|---|---|
| BB → ACG PIEDADE | 10115 | 10110 | TRANSF.VLR PIX / SUPRIR CONTA CARTÃO PAGCORP / SUPRIMENTO CONTA BANCO CARTÕES / … | 2.000 (29/08) + 7.700 (06/09) + 2.000 (06/09) + 900 (08/09) + 20.000 (14/09) = **32.600,00** |
| **ACG → cartão** (a carga) | **2049** | **10115** | — | **NENHUM LANÇAMENTO** |
| cartão → despesa | 3100 | 2049 | ATENDIMENTO CONF. REUNIÃO … CARTÃO: *número* | 7.700 (irmãs, 5 cartões) + 2.000 (diáconos) = **9.700,00** |

Consequências, as duas no balancete:
- a **10115 tem 32.600,00** e **nenhuma saída** no período — mas 9.700,00 já
  foram para os cartões na PagCorp e gastos;
- a **2049 tem 9.700,00 de saldo credor** (o extrato mostra −9.700,00): o
  gasto foi lançado, e a carga, que é lançada à mão, não foi.

**Os valores do suprimento batem com as reuniões:** em 06/09, BB → ACG
PIEDADE de **7.700,00** ("suprimento conta banco cartões") e de **2.000,00**
("suprir conta cartão PagCorp") — exatamente as reuniões das irmãs (11:30) e
dos diáconos (12:31) daquele dia.

**Os cinco cartões das irmãs** (diário, extrato e relatório dizem o mesmo):
127698421 Francisca 1.900 · 127698298 Sandra 1.900 · 127698694 Kelen 2.400 ·
127698702 Rosalda 600 · 127698850 Andréia 900.

**Os dois lançamentos dos diáconos (2 × 1.000,00) saíram com "CARTÃO:" em
branco** no histórico. O SIGA não registrou em que cartão foi.

### 2.3 A reunião de 08/08 (print), fora do período dos relatórios

D 1046 / C 10010 (caixa) "ADTO … VALOR INICIAL" 4.200,00, e depois D 3100 /
C 1046. É o caminho de **reunião com valor inicial em dinheiro**, pela conta
de adiantamento de reunião (1046), sem cartão. Em setembro a 1046 ficou
parada, e a reunião usou a 2049. **A confirmar com ele:** a reunião de 08/08
foi em dinheiro?

## 3. O que isso responde para o sistema — e a decisão dele

**A decisão dele (30/09/2026), que corrige a leitura desta seção:** 204.9 e
104.7 são **rótulos contábeis** — classificam o movimento conforme o plano de
contas. **O comprovante registra o movimento financeiro entre contas
FINANCEIRAS**, e não entre contas contábeis. Então:

| Movimento | Origem (conta financeira) | Destino (conta financeira) | Como o SIGA classifica |
|---|---|---|---|
| Carga de cartão de **viagem** | PIA-COXIM: 101.20 - ACG - AG:01 CC:127865707 - VIAGEM | um ou mais **cartões** daquela conta, cada um pelo número | D 1047 / C 10120 |
| Carga de cartão da **Piedade** | PIA-COXIM: 101.15 - ACG - AG:01 CC:127866218 - PIEDADE | um ou mais **cartões** daquela conta | D 2049 / C 10115 |
| Devolução do cartão | o cartão | a conta ACG dele | o inverso |

- **A 104.7 não entra no cadastro** (resposta dele).
- **Cada cartão pertence a UMA conta corrente ACG**, e a referência primeira é
  a listagem de cartões aptos da PagCorp, em
  `cadastros/pagcorp_cartoes_aptos/` — acima do histórico e da aba Cadastros.
  Sub-tesouraria (Atendimento, Secretaria) não é conta.
- **Na lista de contas entra um item "CARTÃO DE DÉBITO"**, sem conta contábil
  do SIGA. Quando um lado do par é uma conta ACG cadastrada e o outro é CARTÃO
  DE DÉBITO, aparece uma lista com **só os cartões daquela conta**.
- **Um item só, sem PIA** (decisão dele, 01/10/2026 — um por PIA era
  redundância): a PIA do cartão é a da conta do outro lado.
- **Saque** (01/10/2026): só o cartão da **Piedade** saca, e só para o caixa
  **100.10** (Obra da Piedade). Cartão de viagem não saca; nenhum cartão saca
  para o caixa de viagens nem para o de assembleias e reuniões; ninguém
  deposita em cartão. No cadastro: coluna "Cartões podem sacar" das contas
  ACG, e a regra CARTAO → CAIXA com "Destino contém" 100.10.

Continuam valendo, da análise:

1. **Viagem: a linha do lote é o envelope, e o viajante nem sempre é o
   titular do cartão** (3 de 11 envelopes). O preenchimento automático do
   beneficiário pelo titular (que existe hoje) erraria nesses três. A
   pendência 4.4 (cartão usado por outra pessoa) não é rara: é rotina.
2. **A transferência para outra PIA** (Sonora 2.900; São Gabriel 1.800) sai
   do BB contra a **21012** no livro de Coxim. A de São Gabriel, de
   06/09/2026, 1.800,00, é a do comprovante do SIGA que serviu de modelo ao
   layout (`referencia_siga_comprovante.pdf`).

**A conferência contábil** (os achados da seção 4, e os do próximo mês) mora
**fora deste projeto**, pedido dele: o prompt está em
`18_prompt_conferencia_siga.md`.

## 4. O que os documentos mostram que está pendente no SIGA

Não são defeitos do sistema: são achados do cruzamento, para a tesouraria
conferir.

| # | O quê | Valor | O comprovante que documentaria |
|---|---|---|---|
| 1 | Cargas dos cartões da Piedade de 06/09 não lançadas (2049 credora, 10115 sem saída) | 9.700,00 | Lote 101.15 ACG → 204.9 CARTÃO DE DÉBITO, uma linha por cartão (irmãs); os dos diáconos, com os números a descobrir |
| 2 | Envelope 000338 (Mariene): carga de 100,00 sem despesa; o relatório diz "devolvido", o diário não tem devolução | 100,00 parados na 1047 | Devolução 104.7 → 101.20 ACG VIAGEM, se o dinheiro ainda está no cartão |
| 3 | Duas cargas de 10,00 no cartão 127699049 em 13/09 (87609 e 87613), e o envelope 000339 só precisava de uma | 10,00 a mais na 1047 | Devolução, ou conferir se foi lançamento em duplicidade |
| 4 | Envelope 000344 (João Torquato): despesa de 100,00 no cartão 127700326 sem carga lançada | 100,00 faltando na 1047 | Carga 101.20 → 104.7 no cartão 127700326 |
| 5 | Os 2 × 1.000,00 dos diáconos (06/09) sem número de cartão no SIGA | — | — |

A soma confere: +100 (item 2) +10 (item 3) −100 (item 4) +220 (envelope
000348, aguardando prestação de contas) = **230,00**, o saldo da 1047.
