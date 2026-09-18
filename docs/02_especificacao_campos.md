# Especificação de Campos — Aba "Comprovante"

Baseado na inspeção direta do arquivo `Comprovante_de_Movimentacao_Interna.xlsx`
(incluído neste pacote como referência visual — **não editar o original,
copiar antes**). Todas as referências de célula abaixo são as do arquivo
original; use-as como planta baixa para recriar a aba no Google Sheets.

---

## 1. Cabeçalho institucional (fixo, não editável pelo usuário)

| Célula (mesclagem) | Conteúdo |
|---|---|
| `A1:J1` | (livre/logo, se houver) |
| `M1:AB1` | `CONGREGAÇÃO CRISTÃ NO BRASIL` |
| `AK1:AT1` | `Folha 1 / 1` |
| `A2:J2` | `RUA JOAQUIM CARDEAL DE SOUZA , 311` |
| `M2:AB2` | `COXIM - MS` |
| `AI2:AT2` | `CNPJ 03.673.233/0001-43 - IE ISENTO` |
| `A4:AT4` | `COMPROVANTE DE MOVIMENTAÇÃO INTERNA` (título) |
| `A68:AT68` | ` formulário interno da tesouraria da piedade da ADM local de Coxim, MS` (rodapé) |

O endereço, CNPJ e nome da ADM no cabeçalho devem trocar dinamicamente
conforme a ADM da conta de Origem (ver `01_regras_negocio.md`, seção 5) —
manter os textos de cada ADM cadastrados, não *hardcoded* só para Coxim.

## 2. Bloco de identificação (linhas 6–9)

| Campo | Rótulo (célula) | Valor (célula/mesclagem) | Tipo / comportamento |
|---|---|---|---|
| Número | `A6` "Número:" | `G6` | Texto livre — ver regras de numeração |
| Status | `Q6` "Status:" | `X6` | Lista suspensa: `APROVADA`, `PAGA`, `RECEBIDA`, `EFETIVADA` — preenchida automaticamente pelo gerador conforme a etapa, mas editável manualmente |
| Data Emissão | `A7` "Data Emissão:" | `G7` | Data, com seletor de calendário nativo |
| Valor | `Q7` "Valor:" | `X7:AD7` (mesclada) | Numérico (moeda). Ao editar, dispara o cálculo do extenso |
| Extenso do valor | — | `AE7:AT7` (mesclada) | Somente leitura — preenchido automaticamente, caixa alta, entre parênteses |
| Tipo | `A8` "Tipo:" | `G8:AT8` (mesclada) | Lista suspensa — ver `cadastros/tipos_movimentacao.csv` |
| Observação | `A9` "Observação" | `G9:AT9` (mesclada) | Texto livre |

## 3. Bloco Origem / Destino (linhas 12–13)

| Campo | Rótulo | Valor | Tipo |
|---|---|---|---|
| Origem | `A12` "Origem:" | `G12:V12` (mesclada) | Lista suspensa (contas por PIA) |
| Destino | `W12` "Destino:" | `Y12:AT12` (mesclada) | Lista suspensa (contas por PIA) |
| CNPJ (origem) | `A13` "CNPJ:" | `G13` | Automático, derivado da PIA escolhida em Origem |
| CNPJ (destino) | `W13` "CNPJ:" | `Y13` | Automático, derivado da PIA escolhida em Destino |

**Validação obrigatória:** Origem e Destino não podem ser a mesma
combinação PIA+conta. Alerta claro se isso ocorrer (ver regra 11).

Ao escolher um Tipo de movimentação marcado como "sentido invertido"
(Zerar Conta / Transferência Débito), exibir aviso lembrando que, nesse
tipo, Origem recebe crédito e Destino é debitado.

## 4. Tabela de detalhamento (linhas ~14–54) — NOVO, para o comprovante agrupado

O modelo original deixa essas linhas livres. Nelas, construir uma tabela
para permitir agrupar várias movimentações da mesma natureza num único
comprovante (ver regra 9). Colunas sugeridas:

| Coluna | Conteúdo |
|---|---|
| Data | Data de cada lançamento individual (todas no mesmo mês) |
| Documento/Cartão | Número do documento de origem daquele lançamento (SIGA, NFC-e, nº do cartão) |
| Beneficiário/Finalidade | Texto livre curto |
| Valor | Valor individual daquele lançamento |

Quando há mais de uma linha preenchida na tabela, o campo Valor do
cabeçalho (`X7`) passa a ser a **soma automática** dessas linhas, e o
extenso acompanha a soma. Quando há só uma linha (ou nenhuma), o
comprovante funciona como hoje — valor único, digitado direto em `X7`.

Se o lote ultrapassar a capacidade da página (na prática, algo perto de
30–35 linhas, a confirmar visualmente durante a construção), gerar
"Folha 2 / 2" reaproveitando o cabeçalho institucional, em vez de travar.

## 5. Bloco de assinaturas (linhas 55–65)

| Assinante | Nome (célula) | Cargo (célula) |
|---|---|---|
| 1 | `C56` | `C57` |
| 2 | `N56` | `N57` |
| 3 | `AD56` | `AD57` |
| 4 | `C64` | `C65` |
| 5 | `N64` | `N65` |
| 6 (manual) | `AD64` rótulo "Nome:" / valor ao lado | `AD65` rótulo "Cargo/Ministério:" / valor ao lado |

Cada posição: lista suspensa com os diáconos cadastrados
(`cadastros/diaconos.csv`), com opção de digitar manualmente nome e cargo
para signatário esporádico fora da lista.

Mínimo de 3 preenchidos para o botão "Gerar PDF" **não bloquear**, apenas
avisar; permitir gerar mesmo com 0 preenchidos, deixando o espaço em
branco no PDF final para caneta/carimbo. Incluir nota de rodapé no PDF:
"Necessário no mínimo 3 assinaturas (nome completo, cargo e assinatura)
para anexação no SIGA."

## 6. Formatação a preservar (do modelo original)

- Números digitados em **maiúsculas**, como no padrão SIGA (aplicar
  `UPPER()` automaticamente onde fizer sentido, ex. em Observação e nos
  campos de texto livre — evitar aplicar em nomes próprios que já vêm
  formatados do cadastro de diáconos).
- Valores em **negrito** no documento final.
- Layout em orientação paisagem, largura até a coluna `AT`.

## 7. Sobre a aba "Instruções" do modelo original

O arquivo original tem uma aba "Instruções" com referências de célula
desatualizadas (aponta para `E6`, `P6`, `P7`, `P12` — que não existem na
aba "Comprovante" real, cujas células são `G6`, `X6`, `X7`, `Y12`). **Não
copiar essa aba para o novo projeto.** Se quiser uma aba de ajuda, gerar
uma nova, com as referências corretas listadas acima.
