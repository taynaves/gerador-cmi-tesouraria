# Especificação de Campos — Aba "Comprovante"

**Referência visual do projeto:** `docs/referencia_layout_aprovado.pdf` — o
comprovante que o Taynã aprovou, nascido do comprovante que o próprio SIGA
emite (`docs/referencia_siga_comprovante.pdf`). Toda a grade abaixo foi
**medida nesses dois PDFs**, não estimada.

O `.xlsx` original (`docs/modelo_visual_original.xlsx`) continua valendo como
referência de **quais campos existem**, não mais de onde eles ficam.

---

## 1. Fontes e réguas do layout aprovado

| Item | Medida |
|---|---|
| Folha | A4 em pé (retrato), uma página |
| Fonte | Tahoma em tudo |
| Rótulos e valores | **6 pt** — rótulo normal, valor negrito |
| Tipo Transferência e nomes dos signatários | **8 pt** |
| CONGREGAÇÃO CRISTÃ NO BRASIL | **7 pt** negrito |
| Título | **12 pt** negrito |
| Réguas do título (acima e abaixo) | **grossa (2,25 pt)** nas duas |
| Demais réguas (separadores, tabela, assinaturas, rodapé) | **fina (0,75 pt)** |
| Caixa | **dados sempre em CAIXA ALTA**; rótulos como escritos, no padrão do SIGA |

## 2. Como o Google Sheets exporta (medido em exportação real)

Estas quatro regras são a "régua de conversão" do projeto. É com elas que o
layout é calculado — e foi por ignorá-las que a primeira tentativa estourou
para 4 páginas:

1. **Geometria:** 1 pixel de linha/coluna = **0,75 pt** no PDF (escala Normal).
2. **Fonte:** sai **exatamente** no tamanho pedido — mas o Apps Script só
   aceita **número inteiro** e arredonda para cima: pedir 7,18 vira 8.
   *Nunca* usar tamanho fracionado.
3. **Posição vertical do texto** (alinhamento "meio"):
   `topo_da_linha + (altura_da_linha − 1,25 × tamanho_da_fonte) / 2 − 0,37 pt`
   — conferido em 5 campos do PDF aprovado, erro de 0,01 pt.
4. **Recuo do texto dentro da célula:** 3,5 px (2,625 pt) de cada lado.
5. **Altura mínima de linha:** o Sheets estica sozinho qualquer linha mais
   baixa que `fonte × 1,667 + 4,7` pixels — 6 pt = 15 px · 7 pt = 16 px ·
   8 pt = 18 px · 12 pt = 25 px. Foi por ignorar isso que 8 linhas cresceram
   17 px na exportação e empurraram o documento para uma segunda página. O
   código já aplica esse mínimo (`alturaDaLinha_`), então nada cresce sozinho.

Bordas: só existem **fina = 0,75 pt**, média = 1,5 pt e **grossa = 2,25 pt**.
O documento usa **grossa nas duas réguas do título** (o SIGA usa 2,0 pt; 2,25
é a mais próxima que existe) e **fina em todas as outras**.

## 3. Ajustes de impressão / exportação

| Ajuste | Valor |
|---|---|
| Papel | A4 |
| Orientação | Retrato |
| Escala | **Normal (100%)** |
| Margens | Personalizadas: topo 0,97 cm · base 0,97 cm · esquerda 1,02 cm · direita 0,89 cm |
| Alinhamento | Horizontal: Centro · Vertical: Acima |
| Linhas de grade | desmarcado |

"Ajustar à largura"/"à altura" mudam o tamanho da letra — nunca usar.

## 4. Grade de colunas — 22 colunas (A..V), 694 px = 520,5 pt

A coluna existe só para criar um limite; o que importa é o limite acumulado.

A antiga coluna C (58 px, onde ficavam todos os rótulos da esquerda) foi
**dividida em quatro** — C+D+E+F = 15+14+15+14 = 58 px. A soma é a mesma, então
**nada mais no documento se moveu**; o que se ganhou foram limites
intermediários para o campo **Conta** começar mais à esquerda. Ele não cabia:
`101.17 - ACG - AG:01 CC:127884427 - PIEDADE` estourava o espaço antigo.

| Coluna | Largura (px) | Limite | Para que serve esse limite |
|---|---|---|---|
| A | 11 | 11 | faixa do rodapé lateral (texto em pé) |
| B | 24 | 35 | início do 1º bloco de assinatura; borda esquerda da folha |
| C | 15 | 50 | **fim dos rótulos "Origem:" e "CNPJ:"** |
| D | 14 | 64 | **fim do rótulo "Conta:"** (recuado à direita, como no SIGA) |
| E | 15 | 79 | início do valor da conta de origem |
| F | 14 | 93 | **fim dos rótulos do bloco de cima** (Referência, Data Emissão, Tipo, Observação) |
| G | 26 | 119 | início dos valores do bloco de cima |
| H | 61 | 180 | fim do valor da Referência |
| I | 47 | 227 | fim do rótulo "numeração SIGA"; fim do 1º bloco de assinatura |
| J | 23 | 250 | início do 2º bloco de assinatura |
| K | 12 | 262 | limite DOCUMENTO \| BENEFICIÁRIO da tabela |
| L | 38 | 300 | **fim dos valores da coluna 1** (origem, conta, CNPJ) |
| M | 91 | 391 | **fim dos rótulos da coluna 2** (destino) |
| N | 9 | 400 | início dos valores da coluna 2 |
| O | 26 | 426 | fim do rótulo "Conta:" do destino; fim do 2º bloco de assinatura |
| P | 34 | 460 | fim do valor do campo Valor |
| Q | 9 | 469 | início do extenso e do 3º bloco de assinatura |
| R | 38 | 507 | fim do rótulo "Nome:" |
| S | 9 | 516 | limite BENEFICIÁRIO \| VALOR da tabela |
| T | 47 | 563 | fim do rótulo "Cargo/Ministério:" |
| U | 109 | 672 | fim dos blocos de assinatura |
| V | 22 | 694 | fim da folha |

**Os dois blocos não são simétricos, e isso é de propósito.** À esquerda os
rótulos terminam colados no valor (C e D), para o campo Conta ir até a coluna L.
À direita o rótulo termina na coluna M e o valor vai até V — o lado do destino
já tinha espaço de sobra e ficou como no layout aprovado.

## 5. Grade de linhas

As linhas **têm nome** no código (`LINHAS`), nunca número fixo — esconder ou
mostrar uma linha não quebra nada.

**Altura útil da folha: 1045 px** — validada em exportação real. É ela que
mantém a régua e a nota do rodapé coladas no pé da página. Acima de ~1048 px
o Sheets quebra em duas páginas; não aumentar sem testar.

Cada linha com texto tem a fonte anotada no código, e a altura nunca fica
abaixo do mínimo daquela fonte (regra 5 da seção 2).

| Nome da linha | Altura (px) | Conteúdo | Opcional |
|---|---|---|---|
| `CAB_1` | 16 | CONGREGAÇÃO CRISTÃ NO BRASIL · Folha 1 / 1 | |
| `CAB_2` | 15 | endereço · cidade · CNPJ da ADM | |
| `ESP_1` | 4 | régua acima do título | |
| `TITULO` | 28 | título + régua embaixo (28 px afasta os acentos da régua) | |
| `ESP_2` | 9 | | |
| `IDENT_1` | 16 | Referência · numeração SIGA · Status | |
| `IDENT_2` | 16 | Data Emissão · Valor (Total) · extenso (1ª linha) | |
| `IDENT_2B` | 16 | **2ª linha do extenso** — a célula é mesclada com a de cima | |
| `TIPO` | 18 | Tipo Transferência | |
| `OBS` | 16 | Observação | |
| `SEP_1` | 9 | régua | |
| `ESP_3` | 9 | | |
| `ORIGEM_DESTINO` | 16 | Origem · Destino | |
| `CONTAS` | 16 | conta de origem · conta de destino | **sim** |
| `CNPJ` | 16 | CNPJ de origem · CNPJ de destino | |
| `SEP_2` | 9 | régua (topo da tabela) | |
| `TAB_CAB` | 16 | cabeçalho da tabela do lote | **sim** |
| `TAB_1` … `TAB_32` | 15 | uma linha por lançamento do lote | **sim** |
| `TAB_TOTAL` | 16 | soma do lote | **sim** |
| `PREENCHIMENTO` | calculada | sobra da folha — fica **entre a tabela e as assinaturas** | |
| `ESP_ASSIN_1` | 91 | espaço da 1ª fileira + régua de assinatura | |
| `NOME_1` | 18 | nomes dos signatários 1, 2 e 3 | |
| `CARGO_1` | 18 | cargos dos signatários 1, 2 e 3 | |
| `ESP_ASSIN_2` | 91 | espaço da 2ª fileira + régua de assinatura | |
| `NOME_2` | 18 | nomes dos signatários 4 e 5 + "Nome:" do 6º | |
| `CARGO_2` | 18 | cargos dos signatários 4 e 5 + "Cargo/Ministério:" do 6º | |
| `ESP_RODAPE` | 30 | régua do rodapé | |
| `NOTA` | 15 | nota das 3 assinaturas, **abaixo** da régua | |

`PREENCHIMENTO` é recalculada sempre que uma linha é escondida ou mostrada:
`1045 − (soma das linhas visíveis)`. Como ela fica **antes** do bloco de
assinaturas, as assinaturas e o rodapé ficam sempre colados no pé da folha,
com ou sem tabela. Se a tabela ocupar a folha inteira (33 lançamentos), essa
linha some.

**Por que existe a linha `IDENT_2B`:** o valor por extenso não cabia em uma
linha só. Em `99.999,99` ele vira
`(NOVENTA E NOVE MIL E NOVECENTOS E NOVENTA E NOVE REAIS E NOVENTA E NOVE CENTAVOS)`
— quase o dobro da largura disponível — e saía **cortado** no PDF. A célula do
extenso passou a ocupar `IDENT_2` + `IDENT_2B` mescladas, com **quebra de
texto** ("ajustar", não "exceder" nem "cortar"). Os 16 px vieram da tabela do
lote, que caiu de 33 para 32 lançamentos; a folha continua com 1045 px e o
rodapé continua colado no pé.

## 6. Mapa dos campos

| Campo | Rótulo (intervalo) | Valor (intervalo) | Tipo / comportamento |
|---|---|---|---|
| Referência | `B:F` da `IDENT_1` | `G:H` | Identificação **única** do comprovante — ver regra 2 |
| Numeração SIGA | `I:J` da `IDENT_1` | `K:L` | **Opcional**; some do documento se vazia |
| Status | `M` da `IDENT_1` | `O:P` | Preenchido pelo gerador conforme a etapa |
| Data Emissão | `B:F` da `IDENT_2` | `G:L` | Data (`dd/MM/yyyy`) |
| Valor / Valor Total | `M` da `IDENT_2` | `O:P` | Moeda. O rótulo vira **"Valor Total:"** quando é lote |
| Extenso | — | `R:V` de `IDENT_2`+`IDENT_2B` | **Calculado.** Duas linhas mescladas, com quebra de texto |
| Tipo Transferência | `B:F` da `TIPO` | `G:V` | Lista suspensa; valor em 8 pt |
| Observação | `B:F` da `OBS` | `G:V` | Texto livre |
| Origem | `B:C` da `ORIGEM_DESTINO` | `D:L` | Lista suspensa — só a PIA, como no SIGA |
| Destino | `M` da `ORIGEM_DESTINO` | `O:V` | Lista suspensa — só a PIA |
| Conta de origem | `B:D` da `CONTAS` | `E:L` | **Opcional** (linha ocultável) |
| Conta de destino | `O` da `CONTAS` | `P:V` | **Opcional** (linha ocultável) |
| CNPJ origem | `B:C` da `CNPJ` | `D:L` | **Calculado** a partir da PIA de origem |
| CNPJ destino | `M` da `CNPJ` | `O:V` | **Calculado** a partir da PIA de destino |
| Emitido em | — | `B:K` da `NOTA` | Automático: `Emitido em dd/MM/yyyy HH:mm:ss`, carimbado ao gerar |

### 6.1. Campos calculados — protegidos por aviso

Cinco campos não são digitados: **extenso, título, os dois CNPJs e o total do
lote**. Todos ganham uma **proteção do tipo aviso** (`protect()` +
`setWarningOnly(true)`): quem tentar editar à mão recebe do Google um
"tem certeza?" e, se tiver motivo, segue — é a mesma escolha de sempre neste
projeto, **avisar e nunca bloquear**. O script continua escrevendo neles
normalmente, e o extenso é **reescrito por cima** na próxima mexida no Valor.

O extenso ganha ainda uma **anotação na célula** explicando por que não se
digita ali: um comprovante com o número dizendo uma coisa e o extenso dizendo
outra é exatamente o que a conferência da tesouraria procura.

Repor as proteções: **Tesouraria CMI → Proteger os campos calculados** (também
acontece sozinho ao recriar o layout e ao aplicar as listas suspensas).

## 7. Tabela do comprovante em lote

**Só aparece quando o comprovante reúne mais de um lançamento**, com
**exatamente uma linha por lançamento** — nunca sobra linha em branco.
Limite de uma folha: **32 lançamentos** (eram 33 antes da 2ª linha do extenso).

Em lançamento único **some tudo**: os rótulos das colunas (DATA,
DOCUMENTO/CARTÃO, BENEFICIÁRIO/FINALIDADE, VALOR), as linhas da tabela, o
rótulo TOTAL e as duas bordas do campo do total. Não fica nenhum vestígio —
o documento fica igual ao do SIGA.

| Coluna da tabela | Intervalo | Alinhamento |
|---|---|---|
| DATA | `B:F` | centro |
| DOCUMENTO / CARTÃO | `G:K` | esquerda |
| BENEFICIÁRIO / FINALIDADE | `L:S` | esquerda |
| VALOR | `T:V` | direita |
| TOTAL (rótulo / soma) | `B:S` / `T:V` | direita |

## 8. Bloco de assinaturas

Seis posições, em duas fileiras de três, nas colunas `C:I`, `K:O` e `R:U`.
A régua de assinatura é a **borda inferior fina** das linhas `ESP_ASSIN_1` e
`ESP_ASSIN_2`, em células mescladas por bloco.

| Posição | Nome | Cargo |
|---|---|---|
| 1 | `C:I` da `NOME_1` | `C:I` da `CARGO_1` |
| 2 | `K:O` da `NOME_1` | `K:O` da `CARGO_1` |
| 3 | `R:U` da `NOME_1` | `R:U` da `CARGO_1` |
| 4 | `C:I` da `NOME_2` | `C:I` da `CARGO_2` |
| 5 | `K:O` da `NOME_2` | `K:O` da `CARGO_2` |
| 6 (manual) | rótulo `R` + linha `S:U` da `NOME_2` | rótulo `R:T` + linha `U` da `CARGO_2` |

Mínimo de 3 assinaturas: o gerador **avisa, nunca bloqueia**.

## 9. Caixa alta

- **Todo dado preenchido no documento sai em CAIXA ALTA** — referência,
  numeração SIGA, status, tipo, observação, origem, destino, contas, CNPJ,
  extenso e o título.
- **Os rótulos não**: ficam como estão escritos ("Data Emissão:", "Tipo
  Transferência:", "Observação:"), no padrão do SIGA.
- **Exceção:** nome e cargo dos signatários saem como estão no cadastro de
  diáconos, porque são nomes próprios já formatados (regra do `CLAUDE.md`).

## 10. Rodapé

- A identificação do formulário ("formulário interno da tesouraria…") fica
  **em pé, na lateral esquerda** (coluna `A`, texto girado 90°), terminando
  **acima** da régua do rodapé.
- **Abaixo** da régua do rodapé, na linha `NOTA`, ficam duas informações, como
  no SIGA:
  - à esquerda (`B:K`): **`Emitido em dd/MM/yyyy HH:mm:ss`** — a data e hora
    em que o comprovante foi gerado. Na Etapa 1 é o momento em que a aba foi
    montada; a partir da Etapa 5 é carimbada no instante em que o PDF é
    gerado, que é a data que vale no documento.
  - à direita (`L:V`): a nota das 3 assinaturas.
- A nota das 3 assinaturas fica **abaixo** da régua do rodapé, alinhada à
  direita.

## 11. Título — depende da movimentação

| Situação | Título |
|---|---|
| Origem e destino na **mesma PIA** (só muda de conta) | `COMPROVANTE DE MOVIMENTAÇÃO INTERNA` |
| Origem e destino em **PIAs diferentes** | `COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS` |

É a **mesma comparação** que decide se a movimentação gera 2 ou 3 documentos
(ver `CLAUDE.md`, regra de ouro das etapas).

## 12. Diferenças propositais em relação ao comprovante do SIGA

| O que | No SIGA | No CMI |
|---|---|---|
| 1º campo | "Número:" | "Referência:" + "numeração SIGA:" |
| Valor | valor e extenso na mesma célula | células separadas (o extenso é calculado) |
| Tabela do lote | não existe | só em lote, uma linha por lançamento |
| Contas | não mostra | linha `CONTAS`, opcional |
| Nota das 3 assinaturas | não existe | abaixo da régua do rodapé |
| Rodapé | "SIGA - TES01308" | identificação do formulário, na lateral |

## 13. Sobre a aba "Instruções" do modelo original

O `.xlsx` original tem uma aba "Instruções" com referências de célula
desatualizadas. **Não copiar.** Este arquivo é a referência correta.
