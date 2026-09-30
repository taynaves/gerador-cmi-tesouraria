# Cartões aptos, por conta corrente da ACG — a referência primeira

Exportados da **PagCorp** por ele (tela "Listagem de Cartões Aptos") e
entregues em **30/09/2026**, com a instrução: **"estes dados são válidos e
verificados e correspondem à referência primeira. Todos os outros dados — no
histórico ou na aba Cadastros — se divergirem, vale o que está aqui."**

Um arquivo por **conta corrente ACG** (o número está no nome do arquivo):

| Arquivo | Conta ACG | No SIGA |
|---|---|---|
| `127865707_VIAGEM_pia-coxim.csv` | 127865707 — VIAGEM | 101.20 |
| `127866218_PIEDADE_pia-coxim.csv` | 127866218 — PIEDADE (PIA COXIM) | 101.15 |
| `127884146_PIA-SONORA.csv` | 127884146 — PIA SONORA | 101.16 |
| `127884427_PIA-SAO-GABRIEL.csv` | 127884427 — PIA SÃO GABRIEL DO OESTE | 101.17 |

**Colunas que importam:** `Conta` = o número do cartão; `Apelido` = o nome
do cartão na PagCorp; `Tesouraria` = onde o cartão está pendurado na árvore da
PagCorp.

**A coluna Tesouraria nem sempre é a conta corrente.** Dentro da conta
127866218 (PIEDADE) os cartões estão em duas **sub-tesourarias**: 127866192
(ATENDIMENTO) e 128175981 (SECRETARIA). Pela regra dele, sub-tesouraria **não
é conta**: a conta corrente é a do nome do arquivo. A árvore da PagCorp (print
dele, 30/09/2026):

```
127705648 RRM - COXIM
└ 127865665 DEPARTAMENTO DOS DIÁCONOS
  ├ 127865640 PIEDADE (ADM COSTA)
  │ └ 128175700 PIA COSTA ── 127884922 SECRETARIA · 127884955 ATENDIMENTO
  └ 127865715 PIEDADE (ADM COXIM)
    ├ 127884005 PIA - COXIM
    │ ├ 127865707 VIAGEM
    │ ├ 127866218 PIEDADE (PIA COXIM) ── 127866192 ATENDIMENTO · 128175981 SECRETARIA
    │ └ 128084027 MÚSICA
    ├ 127884146 PIA - SONORA
    ├ 127884427 PIA - SÃO GABRIEL DO OESTE
    └ 128091675 PIA - ALCINÓPOLIS
127943306 RA - REGIONAL ADMINISTRATIVA ── 127943827 ADM - COXIM · 127943868 ADM - COSTA
```

**Diferenças com `cadastros/cartoes.csv`** (conferidas em 30/09/2026): os 32
cartões daqui estão todos lá, na mesma tesouraria. Lá sobram os 9 da
PIA-COSTA — para ela não veio arquivo, e ficam como estão até ele mandar.

**Uma linha acrescentada à mão, por instrução dele (30/09/2026):** o cartão
**127699262** (Dede / José Cavalcanti, ATENDIMENTO 92.62) não vinha na
listagem. Ele conferiu na PagCorp que de fato não era apto (estava no nível
acima, 127865715), **ajustou lá** e o tornou apto na conta 127866218
(PIEDADE), sub-tesouraria ATENDIMENTO (127866192). Ele pediu para acertar sem
reenviar o arquivo. A última linha do `127866218_PIEDADE_pia-coxim.csv` é
essa: saldo e final do cartão ficaram `--`, porque não vieram da PagCorp.
Na próxima exportação da PagCorp, ela é substituída pela linha verdadeira.
