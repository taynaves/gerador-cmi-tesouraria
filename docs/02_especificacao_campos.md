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
| Todas as réguas (título, separadores, tabela, assinaturas, rodapé) | **fina (0,75 pt)** |

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

Bordas: só existem **fina = 0,75 pt**, média = 1,5 pt e grossa = 2,25 pt.
O documento usa **fina em todas as réguas**.

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

## 4. Grade de colunas — 19 colunas (A..S), 694 px = 520,5 pt

A coluna existe só para criar um limite; o que importa é o limite acumulado.

| Coluna | Largura (px) | Limite | Para que serve esse limite |
|---|---|---|---|
| A | 11 | 11 | faixa do rodapé lateral (texto em pé) |
| B | 24 | 35 | início do 1º bloco de assinatura; borda esquerda da folha |
| C | 58 | 93 | **fim dos rótulos da coluna 1** / início dos valores |
| D | 26 | 119 | fim do rótulo "Conta:" da origem |
| E | 61 | 180 | fim do valor da Referência |
| F | 47 | 227 | fim do rótulo "numeração SIGA"; fim do 1º bloco de assinatura |
| G | 23 | 250 | início do 2º bloco de assinatura |
| H | 12 | 262 | limite DOCUMENTO \| BENEFICIÁRIO da tabela |
| I | 38 | 300 | fim do valor da numeração SIGA |
| J | 91 | 391 | **fim dos rótulos da coluna 2** |
| K | 9 | 400 | início dos valores da coluna 2 |
| L | 26 | 426 | fim do rótulo "Conta:" do destino; fim do 2º bloco de assinatura |
| M | 34 | 460 | fim do valor do campo Valor |
| N | 9 | 469 | início do extenso e do 3º bloco de assinatura |
| O | 38 | 507 | fim do rótulo "Nome:" |
| P | 9 | 516 | limite BENEFICIÁRIO \| VALOR da tabela |
| Q | 47 | 563 | fim do rótulo "Cargo/Ministério:" |
| R | 109 | 672 | fim dos blocos de assinatura |
| S | 22 | 694 | fim da folha |

## 5. Grade de linhas

As linhas **têm nome** no código (`LINHAS`), nunca número fixo — esconder ou
mostrar uma linha não quebra nada. Altura útil da folha: **1020 px**.

| Nome da linha | Altura (px) | Conteúdo | Opcional |
|---|---|---|---|
| `CAB_1` | 13 | CONGREGAÇÃO CRISTÃ NO BRASIL · Folha 1 / 1 | |
| `CAB_2` | 12 | endereço · cidade · CNPJ da ADM | |
| `ESP_1` | 4 | régua acima do título | |
| `TITULO` | 26 | título + régua embaixo | |
| `ESP_2` | 9 | | |
| `IDENT_1` | 16 | Referência · numeração SIGA · Status | |
| `IDENT_2` | 16 | Data Emissão · Valor (Total) · extenso | |
| `TIPO` | 16 | Tipo Transferência | |
| `OBS` | 16 | Observação | |
| `SEP_1` | 9 | régua | |
| `ESP_3` | 9 | | |
| `ORIGEM_DESTINO` | 16 | Origem · Destino | |
| `CONTAS` | 16 | conta de origem · conta de destino | **sim** |
| `CNPJ` | 16 | CNPJ de origem · CNPJ de destino | |
| `SEP_2` | 9 | régua (topo da tabela) | |
| `TAB_CAB` | 16 | cabeçalho da tabela do lote | **sim** |
| `TAB_1` … `TAB_33` | 15 | uma linha por lançamento do lote | **sim** |
| `TAB_TOTAL` | 16 | soma do lote | **sim** |
| `PREENCHIMENTO` | calculada | sobra da folha — fica **entre a tabela e as assinaturas** | |
| `ESP_ASSIN_1` | 91 | espaço da 1ª fileira + régua de assinatura | |
| `NOME_1` | 16 | nomes dos signatários 1, 2 e 3 | |
| `CARGO_1` | 16 | cargos dos signatários 1, 2 e 3 | |
| `ESP_ASSIN_2` | 91 | espaço da 2ª fileira + régua de assinatura | |
| `NOME_2` | 16 | nomes dos signatários 4 e 5 + "Nome:" do 6º | |
| `CARGO_2` | 16 | cargos dos signatários 4 e 5 + "Cargo/Ministério:" do 6º | |
| `ESP_RODAPE` | 30 | régua do rodapé | |
| `NOTA` | 14 | nota das 3 assinaturas, **abaixo** da régua | |

`PREENCHIMENTO` é recalculada sempre que uma linha é escondida ou mostrada:
`1020 − (soma das linhas visíveis)`. Como ela fica **antes** do bloco de
assinaturas, as assinaturas e o rodapé ficam sempre colados no pé da folha,
com ou sem tabela. Se a tabela ocupar a folha inteira (33 lançamentos), essa
linha some.

## 6. Mapa dos campos

| Campo | Rótulo (intervalo) | Valor (intervalo) | Tipo / comportamento |
|---|---|---|---|
| Referência | `B:C` da `IDENT_1` | `D:E` | Identificação **única** do comprovante — ver regra 2 |
| Numeração SIGA | `F:G` da `IDENT_1` | `H:I` | **Opcional**; some do documento se vazia |
| Status | `J` da `IDENT_1` | `L:M` | Preenchido pelo gerador conforme a etapa |
| Data Emissão | `B:C` da `IDENT_2` | `D:I` | Data (`dd/MM/yyyy`) |
| Valor / Valor Total | `J` da `IDENT_2` | `L:M` | Moeda. O rótulo vira **"Valor Total:"** quando é lote |
| Extenso | — | `O:S` da `IDENT_2` | Automático, caixa alta, entre parênteses |
| Tipo Transferência | `B:C` da `TIPO` | `D:S` | Lista suspensa; valor em 8 pt |
| Observação | `B:C` da `OBS` | `D:S` | Texto livre |
| Origem | `B:C` da `ORIGEM_DESTINO` | `D:I` | Lista suspensa — só a PIA, como no SIGA |
| Destino | `J` da `ORIGEM_DESTINO` | `L:S` | Lista suspensa — só a PIA |
| Conta de origem | `D` da `CONTAS` | `E:I` | **Opcional** (linha ocultável) |
| Conta de destino | `L` da `CONTAS` | `M:S` | **Opcional** (linha ocultável) |
| CNPJ origem | `B:C` da `CNPJ` | `D:I` | Automático, derivado da PIA de origem |
| CNPJ destino | `J` da `CNPJ` | `L:S` | Automático, derivado da PIA de destino |

## 7. Tabela do comprovante em lote

**Só aparece quando o comprovante reúne mais de um lançamento**, com
**exatamente uma linha por lançamento** — nunca sobra linha em branco.
Limite de uma folha: **33 lançamentos**.

| Coluna da tabela | Intervalo | Alinhamento |
|---|---|---|
| DATA | `B:C` | centro |
| DOCUMENTO / CARTÃO | `D:H` | esquerda |
| BENEFICIÁRIO / FINALIDADE | `I:P` | esquerda |
| VALOR | `Q:S` | direita |
| TOTAL (rótulo / soma) | `B:P` / `Q:S` | direita |

## 8. Bloco de assinaturas

Seis posições, em duas fileiras de três, nas colunas `C:F`, `H:L` e `O:R`.
A régua de assinatura é a **borda inferior fina** das linhas `ESP_ASSIN_1` e
`ESP_ASSIN_2`, em células mescladas por bloco.

| Posição | Nome | Cargo |
|---|---|---|
| 1 | `C:F` da `NOME_1` | `C:F` da `CARGO_1` |
| 2 | `H:L` da `NOME_1` | `H:L` da `CARGO_1` |
| 3 | `O:R` da `NOME_1` | `O:R` da `CARGO_1` |
| 4 | `C:F` da `NOME_2` | `C:F` da `CARGO_2` |
| 5 | `H:L` da `NOME_2` | `H:L` da `CARGO_2` |
| 6 (manual) | rótulo `O` + linha `P:R` da `NOME_2` | rótulo `O:Q` + linha `R` da `CARGO_2` |

Mínimo de 3 assinaturas: o gerador **avisa, nunca bloqueia**.

## 9. Rodapé

- A identificação do formulário ("formulário interno da tesouraria…") fica
  **em pé, na lateral esquerda** (coluna `A`, texto girado 90°).
- A nota das 3 assinaturas fica **abaixo** da régua do rodapé, alinhada à
  direita.

## 10. Título — depende da movimentação

| Situação | Título |
|---|---|
| Origem e destino na **mesma PIA** (só muda de conta) | `COMPROVANTE DE MOVIMENTAÇÃO INTERNA` |
| Origem e destino em **PIAs diferentes** | `COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS` |

É a **mesma comparação** que decide se a movimentação gera 2 ou 3 documentos
(ver `CLAUDE.md`, regra de ouro das etapas).

## 11. Diferenças propositais em relação ao comprovante do SIGA

| O que | No SIGA | No CMI |
|---|---|---|
| 1º campo | "Número:" | "Referência:" + "numeração SIGA:" |
| Valor | valor e extenso na mesma célula | células separadas (o extenso é calculado) |
| Tabela do lote | não existe | só em lote, uma linha por lançamento |
| Contas | não mostra | linha `CONTAS`, opcional |
| Nota das 3 assinaturas | não existe | abaixo da régua do rodapé |
| Rodapé | "SIGA - TES01308" | identificação do formulário, na lateral |

## 12. Sobre a aba "Instruções" do modelo original

O `.xlsx` original tem uma aba "Instruções" com referências de célula
desatualizadas. **Não copiar.** Este arquivo é a referência correta.
