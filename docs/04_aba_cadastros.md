# Aba "Cadastros" — a fonte viva das listas

Criada na Etapa 2 por `apps_script/02_Cadastros.gs`. É de onde saem **todas**
as listas do sistema: nenhuma lista fica escrita dentro do código.

## Como está organizada

Cada lista é um **bloco de colunas**, lado a lado, separados por uma coluna
estreita:

- **linha 1** — nome do bloco, colorido;
- **linha 2** — cabeçalho das colunas;
- **linha 3 em diante** — os dados.

As duas primeiras linhas ficam congeladas.

**Por que lado a lado e não uma lista embaixo da outra:** assim, acrescentar
uma linha numa lista (um cartão novo, um diácono novo) nunca empurra nem
desalinha as outras. Para incluir um registro, basta escrever na primeira
linha vazia do bloco.

## Os blocos

| Bloco | Intervalo nomeado | Origem | Registros |
|---|---|---|---|
| CONTAS POR PIA | `CAD_CONTAS` | `cadastros/contas_por_pia.csv` | 27 |
| CARTÕES PRÉ-PAGOS | `CAD_CARTOES` | `cadastros/cartoes.csv` | 42 |
| DIÁCONOS (SIGNATÁRIOS) | `CAD_DIACONOS` | `cadastros/diaconos.csv` | 11 |
| FORMAS DE MOVIMENTAÇÃO | `CAD_FORMAS` | `cadastros/formas_de_movimentacao.csv` | 6 |
| REGRAS ENTRE CONTAS | `CAD_RELACOES` | escrito no projeto | 11 |
| FINALIDADES | `CAD_FINALIDADES` | `cadastros/finalidades.csv` | 26 |
| ONDE CADA FINALIDADE VALE | `CAD_REGRAS_FINALIDADE` | `cadastros/finalidades_por_folha.csv` | 39 |
| STATUS (ETAPAS) | `CAD_STATUS` | `cadastros/status.csv` | 4 |
| ADMs, CNPJ E LOCALIDADES | `CAD_ADMS` | `cadastros/cnpj_e_localidades.csv` | 5 |
| ABREVIATURAS DE BANCOS | `CAD_BANCOS` | `cadastros/abreviaturas_bancos.csv` | 14 |
| CONTROLE DA NUMERAÇÃO | `CAD_CONTROLE` | escrito no projeto | 7 |

**O bloco TIPOS DE MOVIMENTAÇÃO não existe mais.** Ele guardava sete espécies
de movimentação e uma coluna "Entre PIAs diferentes"; as 26 FINALIDADES dizem
as sete com fonte, e o alcance (mesma PIA / outro departamento / outra ADM)
passou para as colunas `Tipo` e `Subtipo` do bloco ONDE CADA FINALIDADE VALE.
Duas listas respondendo à mesma pergunta obrigavam a pessoa a responder duas
vezes, sem nada garantindo que as duas respostas combinassem.

Cada intervalo nomeado cobre os dados **mais 200 linhas em branco**, para a
lista crescer sem precisar mexer em nada.

## Bloco CONTROLE DA NUMERAÇÃO

Guarda o estado do gerador. É daqui que sai a sugestão automática da
Referência (regra 2.1 de `01_regras_negocio.md`):

| Chave | Para que serve |
|---|---|
| `PREFIXO_REFERENCIA` | Letras que abrem a Referência — `CMP` de *comprovante* |
| `ANO_CORRENTE` | Ano de dois dígitos usado na Referência (`CMP-26/NNN`) |
| `ULTIMO_NUMERO` | Último número de Referência já gerado neste ano |
| `PROXIMA_REFERENCIA` | Sugestão para o próximo comprovante |
| `PASTA_DRIVE_PADRAO` | ID ou link da pasta do Drive onde os PDFs são salvos |

## Como as próximas etapas leem esta aba

```javascript
lerCadastro_('DIACONOS')          // lista de objetos: { Nome, Cargo, Frequência }
lerCadastro_('CONTAS')[0]['Texto que aparece na lista']
lerControle_('PROXIMA_REFERENCIA')
gravarControle_('ULTIMO_NUMERO', 7)
proximaReferencia_()              // 'CMP-26/008'
sugerirAbreviaturaBanco_('Itaú Unibanco')   // { abreviatura: 'ITAU', origem: 'cadastrada' }
```

## Abreviaturas de banco

No texto das contas o banco entra abreviado, com **no máximo 6 letras**
(`BB`, `SANT`, `CEF`…). Ao cadastrar um banco novo, o sistema procura na
lista, deduz uma abreviatura se não achar, **mostra a sugestão e pergunta se
o usuário concorda** — e grava a escolha para as próximas vezes. Regra
completa na seção 20 de `01_regras_negocio.md`. Pelo menu:
**Tesouraria CMI → Cadastrar abreviatura de banco**.

`lerCadastro_` descarta linhas em branco e usa o cabeçalho da coluna como
chave — então **renomear um cabeçalho na aba quebra a leitura**. Mudanças de
cabeçalho se pedem no código, junto com quem usa aquele campo.

## Importar dados

Qualquer bloco aceita importação de `.csv`, `.md`, `.txt` ou de dados
copiados de outra planilha, pelo menu **Tesouraria CMI → Importar dados para
os Cadastros**. Passo a passo e o prompt para preparar os dados com o
assistente: `docs/05_importar_dados.md`.

## Conferência

O menu **Tesouraria CMI → Criar / recriar a aba Cadastros** monta a aba do
zero com os dados originais do projeto. Rodar de novo **apaga edições feitas
à mão** — depois que o cadastro começar a ser usado de verdade, só rode para
voltar ao ponto de partida.
