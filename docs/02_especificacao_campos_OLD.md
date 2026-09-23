# Especificação de campos — a aba "Comprovante"

**A referência visual é `referencia_layout_aprovado.pdf`**, aprovado pelo
Taynã e nascido do comprovante que o próprio SIGA emite
(`referencia_siga_comprovante.pdf`). **Toda a grade abaixo foi medida nesses
dois PDFs**, não estimada — e conferida contra o código em 23/09/2026.

O `.xlsx` original vale só como referência de **quais campos existem**, nunca
de onde eles ficam. A aba "Instruções" dele tem células desatualizadas: não
copiar.

---

## 1. Fontes e réguas

| Item | Medida |
|---|---|
| Folha | A4 em pé, uma página |
| Fonte | Tahoma em tudo |
| Rótulos e valores | **6 pt** — rótulo normal, valor negrito |
| Tipo Transferência e nomes dos signatários | **8 pt** |
| CONGREGAÇÃO CRISTÃ NO BRASIL | **7 pt** negrito |
| Título | **12 pt** negrito |
| Réguas do título (acima e abaixo) | **grossa, 2,25 pt** |
| Demais réguas | **fina, 0,75 pt** |

O Sheets só tem três espessuras: fina (0,75), média (1,5) e grossa (2,25). O
SIGA usa 2,0 pt no título; 2,25 é a mais próxima que existe.

## 2. A régua de conversão do Sheets para o PDF

Cinco regras medidas em exportação real. É com elas que o layout é calculado —
e foi por ignorá-las que a primeira tentativa estourou para quatro páginas:

1. **Geometria:** 1 pixel de linha ou coluna = **0,75 pt** no PDF, em escala
   Normal.
2. **Fonte:** sai exatamente no tamanho pedido, mas o Apps Script só aceita
   **número inteiro e arredonda para cima** — pedir 7,18 vira 8. **Nunca usar
   tamanho fracionado.**
3. **Posição vertical do texto** (alinhamento "meio"):
   `topo_da_linha + (altura_da_linha − 1,25 × tamanho_da_fonte) / 2 − 0,37 pt`
   — conferido em cinco campos do PDF aprovado, com erro de 0,01 pt.
4. **Recuo do texto dentro da célula:** 3,5 px (2,625 pt) de cada lado.
5. **Altura mínima da linha:** o Sheets estica sozinho qualquer linha mais
   baixa que `fonte × 1,667 + 4,7` px — 6 pt = 15 px · 7 pt = 16 px ·
   8 pt = 18 px · 12 pt = 25 px. Foi por ignorar isso que oito linhas
   cresceram 17 px na exportação e empurraram o documento para uma segunda
   página. `alturaDaLinha_` já aplica o mínimo, então nada cresce sozinho.

## 3. Ajustes de impressão

**Não se usa Arquivo → Imprimir** — esses ajustes não ficam guardados na
planilha. Detalhe e motivo em `07_gerar_pdf.md`.

| Ajuste | Valor, fixo no código |
|---|---|
| Papel | A4 |
| Orientação | Retrato |
| Escala | **Normal (100%)** |
| Margens | topo 0,97 · base 0,97 · esquerda 1,02 · direita 0,89 cm |
| Alinhamento | horizontal: centro · vertical: acima |
| Linhas de grade | desligadas |
| Anotações das células | **desligadas** — vinham ligadas e imprimiam uma segunda folha |

## 4. A grade de colunas — 22 colunas (A..V), 694 px

A coluna existe só para criar um limite; o que importa é o acumulado.
**Passar de 694 px não quebra a página na altura: vaza na largura**, e o PDF
sai em duas folhas do mesmo jeito. Ao alargar uma coluna, estreite outra na
mesma medida — o código confere a soma e estoura se não bater.

| Coluna | px | Limite | Para que serve o limite |
|---|---|---|---|
| A | 11 | 11 | faixa do rodapé lateral (texto em pé) |
| B | 24 | 35 | início do 1º bloco de assinatura; borda esquerda |
| C | 15 | 50 | fim dos rótulos "Origem:" e "CNPJ:" |
| D | 14 | 64 | fim do rótulo "Conta:" |
| E | 15 | 79 | início do valor da conta de origem |
| F | 14 | 93 | fim dos rótulos do bloco de cima |
| G | 26 | 119 | início dos valores do bloco de cima |
| H | 61 | 180 | fim do valor da Referência |
| I | 47 | 227 | fim do rótulo "numeração SIGA"; fim do 1º bloco de assinatura |
| J | 23 | 250 | início do 2º bloco de assinatura |
| K | 12 | 262 | limite DOCUMENTO \| BENEFICIÁRIO da tabela |
| L | 38 | 300 | fim dos valores da coluna 1 |
| M | 87 | 387 | fim dos rótulos da coluna 2 e do valor da conta de origem |
| N | 9 | 396 | início dos valores da coluna 2 |
| O | 26 | 422 | fim do rótulo "Conta:" do destino; fim do 2º bloco |
| P | 38 | 460 | fim do campo Valor — 38 px porque `R$ 999.999,99` não cabia em 34 |
| Q | 9 | 469 | início do extenso e do 3º bloco de assinatura |
| R | 38 | 507 | fim do rótulo "Nome:" |
| S | 9 | 516 | limite BENEFICIÁRIO \| VALOR da tabela |
| T | 47 | 563 | fim do rótulo "Cargo/Ministério:" |
| U | 109 | 672 | fim dos blocos de assinatura |
| V | 22 | 694 | fim da folha |

**Os dois lados não são simétricos, e isso é de propósito.** À esquerda os
rótulos terminam colados no valor, e o campo Conta vai até a coluna M: a linha
da conta é a mais comprida do documento e não tem nada à direita dela, então
avança sobre a faixa dos rótulos do destino sem atrapalhar. À direita o rótulo
termina em M e o valor vai até V.

**A antiga coluna C (58 px) foi dividida em quatro** — C+D+E+F = 15+14+15+14 =
58. A soma é a mesma, então nada mais se moveu; o que se ganhou foram limites
intermediários para o campo Conta começar mais à esquerda, porque
`101.17 - ACG - AG:01 CC:127884427 - PIEDADE` estourava o espaço antigo.

## 5. A grade de linhas — altura útil 1045 px

As linhas **têm nome** no código (`LINHAS`), nunca número fixo: esconder ou
mostrar uma não quebra nada. **1045 px** foi validado em exportação real — é
o que mantém a régua e a nota colados no pé da página. Acima de ~1048 px o
Sheets quebra em duas.

| Linha | px | Fonte | Conteúdo | Opcional |
|---|---|---|---|---|
| `CAB_1` | 16 | 7 | CONGREGAÇÃO CRISTÃ NO BRASIL · Folha 1/1 | |
| `CAB_2` | 15 | 6 | endereço · cidade · CNPJ da ADM | |
| `ESP_1` | 4 | | régua acima do título | |
| `TITULO` | 28 | 12 | título + régua embaixo (28 px afastam os acentos da régua) | |
| `ESP_2` | 9 | | | |
| `IDENT_1` | 16 | 6 | Referência · numeração SIGA · Status | |
| `IDENT_2` | 16 | 6 | Data Emissão · Valor (Total) · extenso | |
| `IDENT_2B` | 16 | 6 | 2ª linha do extenso, mesclada com a de cima | |
| `TIPO` | 18 | 8 | Tipo Transferência | |
| `OBS` | **32** | 6 | Observação — **duas linhas, com quebra de texto** | |
| `SEP_1` | 9 | | régua | |
| `ESP_3` | 9 | | | |
| `ORIGEM_DESTINO` | 16 | 6 | Origem · Destino | |
| `CONTAS` | 16 | 6 | conta de origem · conta de destino | **sim** |
| `CNPJ` | 16 | 6 | CNPJ de origem · CNPJ de destino | |
| `SEP_2` | 9 | | régua (topo da tabela) | |
| `TAB_CAB` | 16 | 6 | cabeçalho da tabela do lote | **sim** |
| `TAB_1` … `TAB_32` | 15 | 6 | uma linha por lançamento (criadas na montagem) | **sim** |
| `TAB_TOTAL` | 16 | 6 | soma do lote | **sim** |
| `PREENCHIMENTO` | calculada | | a sobra da folha | |
| `ESP_ASSIN_1` | 91 | | espaço da 1ª fileira + régua de assinatura | |
| `NOME_1` | 18 | 8 | signatários 1, 2 e 3 | |
| `CARGO_1` | 18 | 8 | cargos dos signatários 1, 2 e 3 | |
| `ESP_ASSIN_2` | 91 | | espaço da 2ª fileira + régua | |
| `NOME_2` | 18 | 8 | signatários 4 e 5 + "Nome:" do 6º | |
| `CARGO_2` | 18 | 8 | cargos dos 4 e 5 + "Cargo/Ministério:" do 6º | |
| `ESP_RODAPE` | 30 | | régua do rodapé | |
| `NOTA` | 15 | 6 | nota das 3 assinaturas, **abaixo** da régua | |

**`PREENCHIMENTO` é a sobra, e fica ANTES das assinaturas:**
`1045 − (soma das linhas visíveis)`, recalculada sempre que uma linha é
escondida ou mostrada. É por isso que as assinaturas e o rodapé ficam sempre
colados no pé da folha, com ou sem tabela. Com a tabela cheia (32
lançamentos), ela some.

**Por que a `OBS` tem 32 px e a `IDENT_2B` existe:** os dois campos não cabiam
em uma linha. O extenso de `99.999,99` tem quase o dobro da largura
disponível, e a Observação passou a carregar o par de contas na frente — o que
passasse de 601 px sumia do PDF **sem avisar**. Os dois ganharam duas linhas
mescladas com **quebra de texto** ("ajustar", nunca "cortar"), e os pixels a
mais saíram de `PREENCHIMENTO`, não da folha.

## 6. O mapa dos campos

| Campo | Rótulo | Valor | Comportamento |
|---|---|---|---|
| Referência | `B:F` da `IDENT_1` | `G:H` | Identificação única |
| Numeração SIGA | `I:J` da `IDENT_1` | `K:L` | Opcional; some se vazia |
| Status | `M` da `IDENT_1` | `O:P` | Escrito pelo gerador, conforme a etapa |
| Data Emissão | `B:F` da `IDENT_2` | `G:L` | `dd/MM/yyyy` |
| Valor / Valor Total | `M` da `IDENT_2` | `O:P` | Moeda; o rótulo muda em lote |
| Extenso | — | `R:V` de `IDENT_2`+`IDENT_2B` | **Calculado**, alinhado ao topo |
| Tipo Transferência | `B:F` da `TIPO` | `G:V` | 8 pt |
| Observação | `B:F` da `OBS` | `G:V` | Duas linhas; leva o par de contas na frente |
| Origem | `B:C` da `ORIGEM_DESTINO` | `D:L` | **Vem da conta escolhida** |
| Destino | `M` da `ORIGEM_DESTINO` | `O:V` | **Vem da conta escolhida** |
| Conta de origem | `B:D` da `CONTAS` | `E:M` | Opcional (linha ocultável) |
| Conta de destino | `O` da `CONTAS` | `P:V` | Opcional |
| CNPJ origem | `B:C` da `CNPJ` | `D:L` | **Calculado** pela PIA de origem |
| CNPJ destino | `M` da `CNPJ` | `O:V` | **Calculado** pela PIA de destino |
| Emitido em | — | `B:K` da `NOTA` | `Emitido em dd/MM/yyyy HH:mm:ss` |

### 6.1 A conta manda: conta → PIA → CNPJ → título → cabeçalho

Quem preenche escolhe a **conta**; a PIA é consequência. Ao trocar a conta de
um lado, o sistema refaz, em cadeia:

1. **a PIA** daquele lado, procurando a conta na lista CONTAS e, só se não
   achar, deduzindo pelo que vem antes do dois-pontos;
2. **o CNPJ**, pela ADM a que a PIA pertence;
3. **o título** (mesma PIA ou PIAs diferentes);
4. **o cabeçalho institucional** — endereço, cidade e CNPJ da ADM.

Foi um defeito real: trocar a conta para uma PIA de outra ADM deixava o
comprovante com a conta de uma ADM e o CNPJ e o cabeçalho de outra.

### 6.2 Campos calculados — protegidos por aviso

Cinco não se digitam: **extenso, título, os dois CNPJs e o total do lote**.
Todos têm proteção **do tipo aviso**: o Google pergunta "tem certeza?" e, se
houver motivo, deixa seguir — **avisar e nunca bloquear**. O script continua
escrevendo neles, e o extenso é reescrito por cima na próxima mexida no Valor.

O extenso ainda ganha uma **anotação na célula** explicando por que não se
digita ali: um comprovante com o número dizendo uma coisa e o extenso outra é
exatamente o que a conferência da tesouraria procura.

Repor as proteções: **Tesouraria CMI → Proteger os campos calculados**
(acontece sozinho ao recriar o layout).

## 7. A tabela do lote

Só aparece com mais de um lançamento, com **exatamente uma linha por
lançamento**. Cabem **32** numa folha (eram 33 antes da segunda linha do
extenso).

Em lançamento único **some tudo** — rótulos, linhas, TOTAL e as bordas do
campo do total. Não fica vestígio: o documento fica igual ao do SIGA.

| Coluna | Intervalo | Alinhamento |
|---|---|---|
| DATA | `B:F` | centro |
| DOCUMENTO / CARTÃO | `G:K` | esquerda |
| BENEFICIÁRIO / FINALIDADE | `L:S` | esquerda |
| VALOR | `T:V` | direita |
| TOTAL (rótulo / soma) | `B:S` / `T:V` | direita |

## 8. O bloco de assinaturas

Seis posições, em duas fileiras de três. A régua é a **borda inferior fina**
das linhas `ESP_ASSIN_1` e `ESP_ASSIN_2`.

| Posição | Nome | Cargo |
|---|---|---|
| 1 | `C:I` da `NOME_1` | `C:I` da `CARGO_1` |
| 2 | `K:O` da `NOME_1` | `K:O` da `CARGO_1` |
| 3 | `R:U` da `NOME_1` | `R:U` da `CARGO_1` |
| 4 | `C:I` da `NOME_2` | `C:I` da `CARGO_2` |
| 5 | `K:O` da `NOME_2` | `K:O` da `CARGO_2` |
| 6 (manual) | rótulo `R` + linha `S:U` da `NOME_2` | rótulo `R:T` + linha `U` da `CARGO_2` |

## 9. O rodapé

- A identificação do formulário fica **em pé, na lateral esquerda** (coluna
  `A`, texto girado 90°), terminando **acima** da régua.
- **Abaixo** da régua, na linha `NOTA`: à esquerda o `Emitido em …`; à direita
  a nota das 3 assinaturas.

## 10. As diferenças propositais em relação ao SIGA

| O que | No SIGA | No CMI |
|---|---|---|
| 1º campo | "Número:" | "Referência:" + "numeração SIGA:" |
| Valor | valor e extenso na mesma célula | células separadas (o extenso é calculado) |
| Tabela do lote | não existe | só em lote, uma linha por lançamento |
| Contas | não mostra | linha `CONTAS`, opcional |
| Nota das 3 assinaturas | não existe | abaixo da régua do rodapé |
| Rodapé | "SIGA - TES01308" | identificação do formulário, na lateral |
