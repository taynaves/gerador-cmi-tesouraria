# Especificação de Campos — Aba "Comprovante"

**Esta versão substitui o mapa de células antigo (que era do `.xlsx`).**
O layout foi remedido a partir do comprovante que o **próprio SIGA emite**
(`docs/referencia_siga_comprovante.pdf`), porque a decisão do Taynã é que o
CMI e o comprovante do SIGA tenham a **mesma identidade visual** — a ponto de,
sobrepondo os dois, os campos iguais coincidirem.

O `.xlsx` original (`docs/modelo_visual_original.xlsx`) continua valendo como
referência de **quais campos existem**, não mais de onde eles ficam.

---

## 1. O que foi medido no comprovante do SIGA

| Item | Medida |
|---|---|
| Folha | A4 em pé (retrato), 595,28 x 841,89 pt |
| Fonte | Tahoma em tudo |
| Corpo (rótulos e valores) | 7 pt — rótulo normal, valor **negrito** |
| "CONGREGAÇÃO CRISTÃ NO BRASIL" | 8 pt negrito |
| Título | 14 pt negrito |
| Régua acima do título | 1,0 pt |
| Régua abaixo do título | 2,0 pt |
| Réguas separadoras | 1,0 pt |
| Linhas de assinatura | 0,5 pt |
| Linhas de "Nome:" / "Cargo/Ministério:" | 0,3 pt |
| Margens | ~1 cm em volta |
| Rótulos da coluna 1 | terminam em x = 98,7 pt; valores começam em 102,8 pt |
| Rótulos da coluna 2 | terminam em x = 351,9 pt; valores começam em 355,6 pt |

## 2. Como o Google Sheets exporta (medido em exportação real)

Estas três regras são a "régua de conversão" do projeto. Foi com elas que as
alturas e larguras abaixo foram calculadas:

1. **Geometria:** 1 pixel de linha/coluna = **0,75 pt** no PDF (escala Normal).
2. **Fonte:** o Sheets desenha a fonte a **0,975 x** o tamanho pedido — por
   isso o código divide os tamanhos por 0,975 antes de aplicar.
3. **Posição vertical do texto** (alinhamento "meio"):
   `topo_da_linha + (altura_da_linha − 0,975 × tamanho_da_fonte) / 2 + 1,25 pt`.

Bordas disponíveis no Sheets e o que saem no PDF: **fina = 0,75 pt**,
**média = 1,5 pt**, **grossa = 2,25 pt**. Não existe 0,3 / 0,5 / 1,0 / 2,0 pt.
Cada régua do SIGA usa a espessura mais próxima:

| Régua | No SIGA | No CMI | Diferença |
|---|---|---|---|
| Topo do título | 1,0 pt | fina (0,75) | 0,25 pt |
| Embaixo do título | 2,0 pt | **grossa (2,25)** | 0,25 pt |
| Separadores | 1,0 pt | fina (0,75) | 0,25 pt |
| Linhas de assinatura | 0,5 pt | fina (0,75) | 0,25 pt |
| Régua do rodapé | 1,0 pt | fina (0,75) | 0,25 pt |

Casar exatamente exigiria montar o PDF por HTML em vez de exportar a aba —
decisão a tomar na Etapa 5 (geração de PDF), não antes.

**Alinhamento vertical do título:** no SIGA o título é colado no topo da sua
faixa, não centralizado nela. Por isso a linha `TITULO` usa alinhamento
vertical "topo" — centralizado, o texto cairia 4,3 pt mais baixo e encostaria
na régua de baixo.

## 3. Margens de impressão / exportação

| Margem | Polegadas | Centímetros |
|---|---|---|
| Superior | 0,38 | 0,97 |
| Inferior | 0,38 | 0,97 |
| Esquerda | 0,40 | 1,02 |
| Direita | 0,35 | 0,89 |

Escala: **Normal (100%)** — nunca "ajustar à largura"/"à altura", que mudam o
tamanho da letra e quebram a sobreposição com o SIGA.

## 4. Grade de colunas — 14 colunas (A..N), 715 px = 536,25 pt

Cada limite existe por um motivo:

| Coluna | Largura (px) | Limite acumulado | Por que esse limite existe |
|---|---|---|---|
| A | 88 | 88 | recuo do texto das contas |
| B | 9 | 97 | **fim dos rótulos da coluna 1** / início dos valores |
| C | 98 | 195 | fim do valor da Referência |
| D | 47 | 242 | fim do 1º bloco de assinatura |
| E | 13 | 255 | início do 2º bloco de assinatura |
| F | 35 | 290 | fim do rótulo "numeração SIGA" |
| G | 100 | 390 | fim do valor da numeração SIGA |
| H | 44 | 434 | **fim dos rótulos da coluna 2** / início dos valores |
| I | 52 | 486 | fim do 2º bloco de assinatura |
| J | 8 | 494 | início do 3º bloco de assinatura |
| K | 26 | 520 | fim do rótulo "Nome:" / fim da coluna Beneficiário |
| L | 9 | 529 | início da linha do "Nome:" |
| M | 49 | 578 | fim do rótulo "Cargo/Ministério:" |
| N | 137 | 715 | fim da folha |

## 5. Grade de linhas

As linhas **têm nome** no código (`LINHAS`), nunca número fixo — assim
esconder ou mostrar uma linha não quebra nada. Altura útil total da folha:
**1038 px**.

| Nome da linha | Altura (px) | Conteúdo | Opcional |
|---|---|---|---|
| `CAB_1` | 13 | CONGREGAÇÃO CRISTÃ NO BRASIL · Folha 1 / 1 | |
| `CAB_2` | 12 | endereço · cidade · CNPJ da ADM | |
| `ESP_1` | 8 | régua fina (topo do título) | |
| `TITULO` | 28 | título (colado no topo) + régua grossa embaixo | |
| `ESP_2` | 6 | | |
| `IDENT_1` | 18 | Referência · numeração SIGA · Status | |
| `IDENT_2` | 18 | Data Emissão · Valor (Total) · extenso | |
| `TIPO` | 18 | Tipo | |
| `OBS` | 18 | Observação | |
| `SEP_1` | 9 | régua fina | |
| `ESP_3` | 5 | | |
| `ORIGEM_DESTINO` | 18 | Origem · Destino | |
| `CONTAS` | 18 | conta de origem · conta de destino | **sim** |
| `CNPJ` | 18 | CNPJ de origem · CNPJ de destino | |
| `SEP_2` | 8 | régua fina | |
| `TAB_CAB` | 16 | cabeçalho da tabela do lote | **sim** |
| `TAB_1` … `TAB_35` | 16 | uma linha por lançamento do lote | **sim** |
| `TAB_TOTAL` | 18 | soma do lote | **sim** |
| `ESP_ASSIN_1` | 62 | espaço da 1ª fileira + régua de assinatura | |
| `NOME_1` | 22 | nomes dos signatários 1, 2 e 3 | |
| `CARGO_1` | 19 | cargos dos signatários 1, 2 e 3 | |
| `ESP_ASSIN_2` | 57 | espaço da 2ª fileira + régua de assinatura | |
| `NOME_2` | 22 | nomes dos signatários 4 e 5 + "Nome:" do 6º | |
| `CARGO_2` | 19 | cargos dos signatários 4 e 5 + "Cargo/Ministério:" do 6º | |
| `PREENCHIMENTO` | calculada | sobra da folha — empurra o rodapé para o pé | |
| `NOTA` | 13 | nota das 3 assinaturas + régua do rodapé | |
| `RODAPE` | 12 | rodapé do formulário · (emitido em) · Folha 1 / 1 | |

`PREENCHIMENTO` é recalculada toda vez que alguma linha é escondida ou
mostrada: `1038 − (soma das linhas visíveis)`. É isso que mantém a régua e o
rodapé colados no pé da folha em qualquer combinação.

## 6. Mapa dos campos

| Campo | Rótulo (intervalo) | Valor (intervalo) | Tipo / comportamento |
|---|---|---|---|
| Referência | `A:B` da `IDENT_1` | `C` | Identificação **única** do comprovante — ver regra 2 |
| Numeração SIGA | `D:F` da `IDENT_1` | `G` | **Opcional**; a linha fica oculta no PDF se vazia |
| Status | `H` da `IDENT_1` | `I:N` | Preenchido pelo gerador conforme a etapa |
| Data Emissão | `A:B` da `IDENT_2` | `C:F` | Data (`dd/MM/yyyy`) |
| Valor / Valor Total | `G:H` da `IDENT_2` | `I:K` | Moeda. O rótulo vira **"Valor Total:"** quando é lote |
| Extenso | — | `L:N` da `IDENT_2` | Automático, caixa alta, entre parênteses |
| Tipo | `A:B` da `TIPO` | `C:N` | Lista suspensa (`cadastros/tipos_movimentacao.csv`) |
| Observação | `A:B` da `OBS` | `C:N` | Texto livre |
| Origem | `A:B` da `ORIGEM_DESTINO` | `C:F` | Lista suspensa — **só a PIA**, como no SIGA |
| Destino | `G:H` da `ORIGEM_DESTINO` | `I:N` | Lista suspensa — só a PIA |
| Conta de origem | — | `C:F` da `CONTAS` | **Opcional** (linha ocultável) |
| Conta de destino | — | `I:N` da `CONTAS` | **Opcional** (linha ocultável) |
| CNPJ origem | `A:B` da `CNPJ` | `C:F` | Automático, derivado da PIA de origem |
| CNPJ destino | `G:H` da `CNPJ` | `I:N` | Automático, derivado da PIA de destino |

## 7. Tabela do comprovante em lote

**Só aparece quando o comprovante reúne mais de um lançamento.** Em
lançamento único ela some por completo (cabeçalho, linhas e TOTAL), e o
documento fica idêntico ao do SIGA.

Em lote, aparecem **exatamente tantas linhas quantos forem os lançamentos** —
nunca sobra linha em branco. Limite de uma folha: **35 lançamentos**.

| Coluna da tabela | Intervalo | Alinhamento |
|---|---|---|
| DATA | `A:B` | centro |
| DOCUMENTO / CARTÃO | `C:F` | esquerda |
| BENEFICIÁRIO / FINALIDADE | `G:K` | esquerda |
| VALOR | `L:N` | direita |
| TOTAL (rótulo / soma) | `A:K` / `L:N` | direita |

## 8. Bloco de assinaturas

Seis posições, em duas fileiras de três. Os blocos ocupam as colunas
`A:D`, `F:I` e `K:N` — as mesmas posições das linhas de assinatura do SIGA.

| Posição | Nome | Cargo |
|---|---|---|
| 1 | `A:D` da `NOME_1` | `A:D` da `CARGO_1` |
| 2 | `F:I` da `NOME_1` | `F:I` da `CARGO_1` |
| 3 | `K:N` da `NOME_1` | `K:N` da `CARGO_1` |
| 4 | `A:D` da `NOME_2` | `A:D` da `CARGO_2` |
| 5 | `F:I` da `NOME_2` | `F:I` da `CARGO_2` |
| 6 (manual) | rótulo `K:L` + linha `M:N` da `NOME_2` | rótulo `K:M` + linha `N` da `CARGO_2` |

A régua de assinatura é a **borda inferior fina** das linhas `ESP_ASSIN_1` e
`ESP_ASSIN_2`, aplicada só nos três blocos — a mesma espessura da do SIGA.

Mínimo de 3 assinaturas para anexar no SIGA: o gerador **avisa, nunca
bloqueia**. Pode gerar com menos (ou nenhuma), deixando o espaço em branco
para caneta/carimbo.

## 9. Diferenças propositais em relação ao SIGA

| O que | No SIGA | No CMI | Por quê |
|---|---|---|---|
| Título | "Comprovante de Transferência de Numerários" | "COMPROVANTE DE MOVIMENTAÇÃO INTERNA" | é outro documento |
| 1º campo | "Número:" | "Referência:" + "numeração SIGA:" | o CMI precisa de identificação própria e única |
| Valor | "1.800,00 (UM MIL…)" em uma célula só | valor e extenso em células separadas | o extenso é calculado |
| Tabela do lote | não existe | linhas 15–49 | agrupamento de vários lançamentos |
| Contas | não mostra | linha `CONTAS`, opcional | conferência da tesouraria |
| Nota das 3 assinaturas | não existe | linha `NOTA` | exigência de anexação |
| Rodapé | "SIGA - TES01308" | "formulário interno da tesouraria…" | origem do documento |

## 10. Precisão alcançada (conferência automática)

Comparando campo a campo o PDF simulado do CMI com o PDF real do SIGA:

- 20 rótulos e valores comuns conferidos um a um: diferença de **até 2,1 pt**
  na horizontal e **1,6 pt** na vertical — menos de 0,75 mm;
- a maior diferença horizontal (2,1 pt) é do bloco alinhado à direita do
  cabeçalho (CNPJ e "Folha 1 / 1"); a largura da folha foi escolhida para
  equilibrar esse bloco com a centralização do título, que ficou a 0,8 pt;
- título: **0,8 pt** na horizontal e **0,8 pt** na vertical;
- todas as réguas: diferença de **até 0,9 pt** de posição e 0,25 pt de
  espessura (limite do Sheets, ver seção 2).

## 11. Sobre a aba "Instruções" do modelo original

O `.xlsx` original tem uma aba "Instruções" com referências de célula
desatualizadas. **Não copiar.** Este arquivo é a referência correta.
