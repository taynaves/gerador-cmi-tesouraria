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

| Bloco | Intervalo nomeado | Origem | Registros iniciais |
|---|---|---|---|
| CONTAS POR PIA | `CAD_CONTAS` | `cadastros/contas_por_pia.csv` | 15 |
| CARTÕES PRÉ-PAGOS | `CAD_CARTOES` | `cadastros/cartoes.csv` | 42 |
| DIÁCONOS (SIGNATÁRIOS) | `CAD_DIACONOS` | `cadastros/diaconos.csv` | 11 |
| TIPOS DE MOVIMENTAÇÃO | `CAD_TIPOS` | `cadastros/tipos_movimentacao.csv` | 11 |
| STATUS (ETAPAS) | `CAD_STATUS` | `cadastros/status.csv` | 4 |
| ADMs, CNPJ E LOCALIDADES | `CAD_ADMS` | `cadastros/cnpj_e_localidades.csv` | 5 |
| CONTROLE DA NUMERAÇÃO | `CAD_CONTROLE` | novo nesta etapa | 4 |

Cada intervalo nomeado cobre os dados **mais 200 linhas em branco**, para a
lista crescer sem precisar mexer em nada.

## Bloco CONTROLE DA NUMERAÇÃO

Guarda o estado do gerador. É daqui que sai a sugestão automática da
Referência (regra 2.1 de `01_regras_negocio.md`):

| Chave | Para que serve |
|---|---|
| `ANO_CORRENTE` | Ano de dois dígitos usado na Referência (`INT-26/NNN`) |
| `ULTIMO_NUMERO` | Último número de Referência já gerado neste ano |
| `PROXIMA_REFERENCIA` | Sugestão para o próximo comprovante |
| `PASTA_DRIVE_PADRAO` | ID ou link da pasta do Drive onde os PDFs são salvos |

## Como as próximas etapas leem esta aba

```javascript
lerCadastro_('DIACONOS')          // lista de objetos: { Nome, Cargo, Frequência }
lerCadastro_('CONTAS')[0]['Texto que aparece na lista']
lerControle_('PROXIMA_REFERENCIA')
```

`lerCadastro_` descarta linhas em branco e usa o cabeçalho da coluna como
chave — então **renomear um cabeçalho na aba quebra a leitura**. Mudanças de
cabeçalho se pedem no código, junto com quem usa aquele campo.

## Conferência

O menu **Tesouraria CMI → Criar / recriar a aba Cadastros** monta a aba do
zero com os dados originais do projeto. Rodar de novo **apaga edições feitas
à mão** — depois que o cadastro começar a ser usado de verdade, só rode para
voltar ao ponto de partida.
