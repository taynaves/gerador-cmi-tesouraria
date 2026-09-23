# A aba "Cadastros" — a fonte viva das listas

Criada por `apps_script/02_Cadastros.gs`. É de onde saem **todas** as listas do
sistema: nenhuma lista fica escrita dentro do código do formulário.

---

## 1. Como está organizada

Cada lista é um **bloco de colunas**, lado a lado, separados por uma coluna
estreita:

- **linha 1** — o nome do bloco, colorido;
- **linha 2** — o cabeçalho das colunas;
- **linha 3 em diante** — os dados.

As duas primeiras linhas ficam congeladas.

**Lado a lado, e não uma lista embaixo da outra**, porque assim acrescentar uma
linha numa lista nunca empurra nem desalinha as outras. Para incluir um
registro, escreva na primeira linha vazia do bloco.

Cada intervalo nomeado cobre os dados **mais 200 linhas em branco**, para a
lista crescer sem mexer em nada.

## 2. Os 11 blocos

| Bloco | Intervalo | Vem de | Registros |
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
| CONTROLE DA NUMERAÇÃO | `CAD_CONTROLE` | escrito no projeto | 8 |

**O bloco TIPOS DE MOVIMENTAÇÃO não existe mais.** Ele guardava sete espécies
de movimentação e uma coluna "Entre PIAs diferentes"; as 26 FINALIDADES dizem
as sete **com fonte**, e o alcance (mesma PIA / outro departamento / outra ADM)
passou para as colunas `Tipo` e `Subtipo` do bloco ONDE CADA FINALIDADE VALE.
Duas listas respondendo à mesma pergunta obrigavam a pessoa a responder duas
vezes, sem nada garantindo que as duas respostas combinassem.

## 3. As regras que protegem os dados

Valem para **todos** os blocos, e cada uma nasceu de um estrago:

- **A chave identifica a linha.** O cadastro deduplica pela chave do bloco
  (uma coluna, ou uma lista de colunas). Chave repetida **apaga linhas em
  silêncio**: aconteceu nas REGRAS ENTRE CONTAS, onde 7 das 11 sumiram porque
  metade começa com `*` — e o sistema passou a permitir justamente o que devia
  proibir.
- **Coluna nova vai no fim, nunca no meio.** Acrescentar no meio desalinha, em
  silêncio, todas as linhas que já estavam na aba: elas ficam com uma coluna a
  menos, encostam à esquerda e são completadas no fim.
- **Formatar como texto antes de escrever.** O Google converte o que parece
  data: a folha `1.1.1` virou `01/01/2001`. Depois de convertido não adianta
  mais. Vale para **todo mundo que escreve** no cadastro — inclusive a
  importação, que não formatava e reintroduzia 8 linhas na recriação seguinte.
- **"Não está vazio" não é conferência.** Uma coluna guardava `"Ativa"`,
  preenchida e errada, e por não estar vazia passou por baixo de tudo. Onde um
  campo tem um conjunto fechado de valores, os valores são declarados e
  conferidos contra a lista.

## 4. O que a recriação faz — e o que ela NÃO faz

**Tesouraria CMI → Criar / recriar a aba Cadastros.**

| Ela faz | Ela não faz |
|---|---|
| Acrescenta as linhas do projeto que faltam | **Não apaga o que você cadastrou** |
| Completa uma **coluna nova** que esteja vazia em todas as linhas | **Não troca o valor de uma célula que já tem dono** |
| Desentorta linhas desalinhadas por coluna no meio | |
| Tira as linhas listadas em `aposentadas` | Não tira nada além delas |
| Refaz a aparência da aba | |

**Recriar preserva o que existe.** Isso é o que impede a recriação de apagar o
trabalho de quem editou a aba à mão — e tem uma consequência que precisa ser
dita, em vez de prometida: **quando o projeto passa a dar um valor a uma
célula que na sua aba está vazia, aquilo não chega sozinho.** Ou você digita
na célula, ou substitui a lista pela janela de importação.

Não trocar o valor é decisão, não limitação: numa coluna em que vazio
*significa* alguma coisa (em *Formas que combinam*, vazio quer dizer "serve
para qualquer forma"), escrever por cima apagaria uma decisão da tesouraria
para impor a do projeto.

**A lista `aposentadas` é a única coisa que autoriza tirar uma linha** —
fechada, escrita à mão, chave por chave. Nunca uma regra do tipo "tire o que o
projeto não traz mais": isso apagaria toda conta e todo diácono cadastrados
por você. O DOC, extinto pelo Banco Central, saiu assim. O que sai aparece na
janela, em SAIU, com o nome.

## 5. O bloco CONTROLE DA NUMERAÇÃO

Guarda o estado do gerador e as chaves que ligam e desligam comportamento:

| Chave | Para que serve |
|---|---|
| `PREFIXO_REFERENCIA` | As letras que abrem a Referência — `CMP` de *comprovante* |
| `ANO_CORRENTE` | O ano de dois dígitos usado na Referência (`CMP-26/NNN`) |
| `ULTIMO_NUMERO` | O último número já gerado neste ano |
| `PROXIMA_REFERENCIA` | A sugestão para o próximo comprovante |
| `PASTA_DRIVE_PADRAO` | Id ou link da pasta do Drive onde os PDFs são salvos |
| `RESTRICOES_ATIVAS` | `SIM`: as regras entre contas filtram as listas e travam o que não é permitido. `NÃO`: tudo liberado — é o caminho do ajuste financeiro ou contábil |
| `PRAXE_CARTAO_NA_MESMA_PIA` | Praxe local: o cartão é carregado pela tesouraria do próprio departamento. **Não trava — só mostra uma nota.** É preferência, não determinação: outra ADM põe `NÃO` e a nota some |
| `URL_TELA_CHEIA` | Endereço do App da Web, para abrir o formulário numa aba inteira. Vazio: o link nem aparece |

## 6. Como o código lê esta aba

```javascript
lerCadastro_('DIACONOS')          // [{ Nome, Cargo, Frequência }, ...]
lerCadastro_('CONTAS')[0]['Texto que aparece na lista']
lerControle_('PROXIMA_REFERENCIA')
gravarControle_('ULTIMO_NUMERO', 7)
proximaReferencia_()              // 'CMP-26/008'
sugerirAbreviaturaBanco_('Itaú Unibanco')   // { abreviatura: 'ITAU', origem: 'cadastrada' }
```

`lerCadastro_` descarta linhas em branco e usa **o cabeçalho da coluna como
chave** — então **renomear um cabeçalho na aba quebra a leitura**. Mudança de
cabeçalho se pede no código, junto com quem usa aquele campo.

## 7. Conferir e importar

- **Tesouraria CMI → Conferir cadastros** confere as listas e mostra o que
  está solto — inclusive toda **forma citada em outra lista que não existe no
  bloco FORMAS**. Um nome que nunca casa não estoura em lugar nenhum: a opção
  só some da tela, sem explicação. Por isso tem de dar para ver.
- **Tesouraria CMI → Importar dados para os Cadastros** aceita `.csv`, `.md`,
  `.txt`, `.tsv` ou dados colados. Passo a passo em `05_importar_dados.md`.
- **Tesouraria CMI → Cadastrar abreviatura de banco** faz o caminho da
  seção 21 de `01_regras_negocio.md`.
