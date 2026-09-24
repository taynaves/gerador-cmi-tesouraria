# Importar dados para os Cadastros

Menu **Tesouraria • CMP p/ SIGA → Importar dados para os Cadastros**. Serve para
qualquer uma das 11 listas.

---

## 1. Como importar

1. Escolha a **lista** de destino.
2. Traga os dados de um destes dois jeitos:
   - **escolhendo um arquivo** (`.csv`, `.txt`, `.md`, `.tsv`) — ele é lido
     **no próprio navegador**, não sobe para o Drive e não pede autorização
     nova;
   - **colando o texto** — CSV, tabela em Markdown, ou dados copiados de
     outra planilha.
3. Escolha o que fazer com o que já existe:
   - **Acrescentar** — entram só os registros novos; os repetidos são
     ignorados;
   - **Substituir a lista inteira** — apaga o que está lá e põe o que veio.
4. Confira o que a janela mostra e confirme.

**Se alguma linha estiver fora do formato, a importação é recusada por
inteiro** — nunca pela metade. Meia lista importada é pior do que nenhuma:
ninguém sabe onde parou.

## 2. A conferência antes de gravar

Antes de escrever qualquer coisa, o sistema confere se os dados **parecem ser
daquela lista**, de duas maneiras:

- **regras fixas de cada lista** — uma lista de contas tem de ter algo com
  cara de PIA na primeira coluna, um CNPJ tem de ter 14 dígitos, e assim por
  diante;
- **a "cara" de cada coluna** comparada com os registros que já existem.

Se estranhar, **pergunta antes de gravar** — avisa, não manda. O resultado
aparece numa faixa colorida no topo da janela, registro por registro.

**Isso pega o caso grosseiro, não todos.** Ele existe para impedir o erro que
acontece de verdade: importar a lista certa no lugar errado.

## 3. Uma armadilha que já mordeu

A importação **não formatava a área como texto antes de escrever**, e o Google
converte o que parece data: a folha `1.1.1` virava `01/01/2001`. O estrago era
**indireto** — a importação parecia certa, e só na **recriação seguinte** as 8
linhas convertidas voltavam a ser acrescentadas, porque a chave não casava
mais.

Está consertado, e a bancada apaga o formato de propósito antes de importar
para provar que continua consertado. Se um dia alguém escrever um caminho novo
de escrita no cadastro: **formate como texto antes**, sempre.

## 4. Como preparar os dados com o assistente

Quando os dados vierem de outro lugar (um extrato, uma lista do SIGA, uma
planilha antiga, uma mensagem), o caminho mais rápido é pedir a um assistente
para arrumar o texto no formato certo.

**Abra um chat novo, anexe o arquivo (ou cole os dados) e mande o prompt
abaixo.** O que voltar é o texto que você cola na janela de importação.

**Mantenha este prompt atualizado** sempre que uma lista ganhar ou perder
coluna — ele é a única cópia das colunas fora do código.

### O prompt, para copiar

```
Preciso preparar dados para importar na aba "Cadastros" do meu Gerador de
Comprovantes (CMI) da Tesouraria da Piedade — ADM Coxim-MS.

O que eu quero importar: [DESCREVA AQUI — ex.: "cartões novos", "três
diáconos", "as contas da ADM Costa Rica"]

Os dados estão: [ANEXADOS NO ARQUIVO] ou [COLADOS ABAIXO]

REGRAS DA RESPOSTA — siga à risca:

1. Identifique para qual das listas abaixo os dados vão, e me diga qual é.
2. Devolva UM ÚNICO bloco de código em CSV (separado por vírgula), com as
   colunas EXATAMENTE na ordem da lista escolhida, SEM a linha de cabeçalho.
3. Se algum campo contiver vírgula, coloque o campo entre aspas duplas.
4. Não invente dados. Campo que eu não informei fica vazio (duas vírgulas
   seguidas). Se faltar algo importante, escreva a lista do que faltou
   DEPOIS do bloco de código — nunca dentro dele.
5. Nomes de banco entram abreviados, no máximo 6 letras (BB, SANT, CEF,
   ITAU, BRAD, SICRED, SICOOB, INTER, NUBANK, BANRIS). Se aparecer um banco
   fora dessa lista, sugira a abreviatura e me pergunte se concordo antes de
   usar.
6. Me diga no fim se eu devo importar como ACRESCENTAR ou SUBSTITUIR.

AS LISTAS E SUAS COLUNAS:

### CONTAS POR PIA  (`CONTAS`)

Colunas, nesta ordem: `PIA` · `ADM` · `Grupo contábil` · `Cód. SIGA` · `Conta PagCorp` · `Texto que aparece na lista` · `Natureza` · `Status` · `Observação` · `Instituição`

O `Texto que aparece na lista` é o que se vê ao escolher origem e destino.
Padrão: `PIA-NOME: 101.10 - BB - AG:0000 CC:00000-0 - PIEDADE`.
`Natureza` só aceita CAIXA, BANCO, ACG ou CARTAO. `Instituição` é BB, SANT ou
ACG — caixa não tem instituição, e fica vazia.

### CARTÕES PRÉ-PAGOS  (`CARTOES`)

Colunas, nesta ordem: `Nº conta do cartão` · `Titular (PagCorp)` · `PIA` · `Sub-tesouraria` · `Conta pai PagCorp` · `Cód. reduzido SIGA` · `Nome conforme SIGA` · `Consta no SIGA?` · `Tipo de cartão` · `Status` · `Observação`

O número que vale é o da CONTA do cartão, completo, sem máscara.

### DIÁCONOS (SIGNATÁRIOS)  (`DIACONOS`)

Colunas, nesta ordem: `Nome` · `Cargo` · `Frequência`

Nome completo, como a pessoa assina; cargo normalmente "Diácono".

### FORMAS DE MOVIMENTAÇÃO  (`FORMAS`)

Colunas, nesta ordem: `Forma` · `Em espécie?` · `Observação` · `Subforma de` · `Exige conta de` · `Instituições`

`Subforma de` vazio = forma de primeiro nível; preenchido = esta linha é
subforma daquela (DINHEIRO e CHEQUE são subformas de SAQUE).
`Exige conta de` vazio = não exige nada; CAIXA = pelo menos um dos dois lados
tem de ser conta de caixa.
`Instituições` vazio = tanto faz; MESMA = só dentro da mesma instituição;
DIFERENTES = só entre instituições distintas.

### REGRAS ENTRE CONTAS  (`RELACOES`)

Colunas, nesta ordem: `Natureza de origem` · `Natureza de destino` · `Formas permitidas` · `Formas proibidas` · `Origem da regra` · `Ativa` · `Por quê` · `Origem contém` · `Destino contém`

Naturezas aceitas: CAIXA, BANCO, ACG, CARTAO e * (qualquer uma).
UM PAR SEM NENHUMA REGRA É LIVRE: as linhas são restrições, não permissões.

### FINALIDADES  (`FINALIDADES`)

Colunas, nesta ordem: `Código` · `Finalidade` · `O que é` · `Frentes` · `Históricos SIGA` · `Fonte` · `Cuidados` · `Sentido`

`Frentes` aceita PIEDADE, VIAGEM e MUSICA, separadas por ponto e vírgula —
vazio seria ambíguo, toda finalidade pertence a pelo menos uma frente.
`Históricos SIGA` é o código do lançamento, como `032 TRANSF.VLR`.
`Fonte` é de onde a finalidade saiu: cite o manual. Nunca escreva "manual"
numa linha que não veio de manual.

### ONDE CADA FINALIDADE VALE  (`REGRAS_FINALIDADE`)

Colunas, nesta ordem: `Código da finalidade` · `Folha` · `Tipo` · `Subtipo` · `Forma` · `Subforma` · `Históricos SIGA` · `Por quê` · `Origem` · `Destino`

VAZIO QUER DIZER "SERVE PARA QUALQUER UM": linha com `Forma` vazia vale para
toda forma. `Folha` (1.1.1, 2.0.2.2) é o código do levantamento e serve para
rastrear — não é por ela que o sistema compara.
`Origem` e `Destino` recebem a NATUREZA da conta de cada lado, e só quando a
finalidade for mesmo restrita àquele lado. Uma natureza por lado — se vale de
banco OU de ACG, deixe vazio.

### STATUS (ETAPAS)  (`STATUS`)

Colunas, nesta ordem: `Status` · `Quando usar` · `Etapa da sequência`

### ADMs, CNPJ E LOCALIDADES  (`ADMS`)

Colunas, nesta ordem: `ADM` · `CNPJ` · `Endereço` · `Cidade / UF` · `Inscrição estadual` · `PIA` · `Status da PIA`

Endereço e cidade vão separados de propósito: o cabeçalho usa o endereço à
esquerda e a cidade no centro. Endereço é logradouro e número
(`RUA JOAQUIM CARDEAL DE SOUZA , 311`); cidade é `CIDADE - UF` (`COXIM - MS`).

### ABREVIATURAS DE BANCOS  (`BANCOS`)

Colunas, nesta ordem: `Nome do banco` · `Abreviatura` · `Observação`

### CONTROLE DA NUMERAÇÃO  (`CONTROLE`)

Colunas, nesta ordem: `Chave` · `Valor` · `Para que serve`

As chaves são fixas: PREFIXO_REFERENCIA, ANO_CORRENTE, ULTIMO_NUMERO,
PROXIMA_REFERENCIA, PASTA_DRIVE_PADRAO, RESTRICOES_ATIVAS,
PRAXE_CARTAO_NA_MESMA_PIA e URL_TELA_CHEIA. NUNCA acrescente chave nova sem
combinar antes — o sistema não lê chave que ele não conhece.
```

## 5. Por que colar, e não ler o arquivo do Drive

O Apps Script até consegue ler um arquivo do Drive. Só que aí o sistema teria
de **adivinhar** de qual lista são os dados, em que ordem estão as colunas e o
que fazer com o que já existe — três chances de errar em silêncio.

Colando o texto, **você vê o que está mandando**, a janela mostra o que foi
feito registro por registro, e o que estiver fora do formato derruba a
importação inteira em vez de gravar meia lista.
