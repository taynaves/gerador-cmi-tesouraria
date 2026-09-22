# Importar dados para os Cadastros

A aba Cadastros aceita **importação de dados** em qualquer uma das suas
listas — de um arquivo `.csv`, `.md`, `.txt`, ou de dados copiados de outra
planilha. Serve tanto para acrescentar registros novos quanto para substituir
uma lista inteira.

---

## Como importar (na planilha)

1. Menu **Tesouraria CMI → Importar dados para os Cadastros**.
2. Escolha **qual lista** você quer atualizar.
3. Escolha o que fazer com o que já está lá:
   - **Acrescentar ao fim da lista** — mantém o que existe e junta o novo.
     Registros repetidos (mesma primeira coluna) são ignorados e listados no
     resumo;
   - **Substituir a lista inteira** — apaga o que existe e põe só o novo.
4. Ponha os dados na janela, de um dos dois jeitos:
   - **Escolher arquivo** — pega um `.csv`, `.txt`, `.md` ou `.tsv` do seu
     computador. O conteúdo aparece na caixa de texto para você **conferir
     antes de importar**, com o nome do arquivo e quantas linhas vieram.
     *(Arquivo do Excel `.xlsx` não serve: no Excel, use
     **Arquivo → Salvar como → CSV**.)*
   - **Colar** direto na caixa de texto.
5. Clique em **Importar**.

O arquivo é lido **no seu computador**, pelo próprio navegador — não é
enviado para o Drive nem para lugar nenhum, e não exige autorização nova do
Google. Se os acentos vierem quebrados (arquivo salvo pelo Excel antigo), a
janela percebe e lê de novo na codificação certa, sozinha.

**O resultado aparece numa faixa colorida grudada no topo da janela** —
verde quando deu certo, vermelha quando não deu, amarela quando o sistema
quer confirmar alguma coisa. A faixa fica fixa no topo mesmo que a janela
role, então não some de vista.

*(Por que não uma janelinha do navegador: o Google bloqueia `alert` e
`confirm` dentro das janelas do Apps Script. Se o código depender deles, o
botão simplesmente não funciona e nenhuma mensagem aparece — foi exatamente
o que aconteceu na primeira versão.)*

A janela aceita três formatos, e descobre sozinha qual é:

| Formato | Como se parece |
|---|---|
| CSV | `PIA-COXIM,ADM Coxim-MS,100 - CAIXA,...` (vírgula; aspas se o texto tiver vírgula dentro) |
| Copiado de planilha | colunas separadas por tabulação — é só copiar e colar |
| Tabela de Markdown | `\| PIA \| ADM \| Grupo \|` com a linha de traços embaixo |

Se a primeira linha for o cabeçalho das colunas, ela é **ignorada
automaticamente**. Linhas em branco são descartadas. Se alguma linha tiver
mais colunas do que a lista comporta, **nada é gravado** e a janela diz
exatamente qual linha está errada — nunca importa pela metade.

---

## A conferência antes de gravar

O erro mais fácil de cometer aqui é **escolher a lista errada no passo 1** —
e é o mais difícil de perceber depois, porque o cadastro fica corrompido em
silêncio. Por isso, antes de gravar qualquer coisa, o sistema confere se os
dados **parecem mesmo ser daquela lista**, de duas maneiras:

1. **Regras fixas de cada lista**, nas colunas que identificam o registro:

   | Lista | O que é exigido |
   |---|---|
   | CONTAS | a PIA começa com "PIA"; o texto da lista tem dois-pontos |
   | CARTÕES | o nº da conta do cartão é só números; a PIA começa com "PIA" |
   | DIÁCONOS | o nome tem pelo menos nome e sobrenome |
   | TIPOS | o tipo é uma descrição, não uma palavra só |
   | STATUS | é APROVADA, PAGA, RECEBIDA ou EFETIVADA |
   | ADMs | o CNPJ está no formato 00.000.000/0000-00 e a PIA começa com "PIA" |
   | BANCOS | a abreviatura tem até 6 letras, sem espaço |
   | CONTROLE | a chave é MAIÚSCULA com underline |

2. **Comparação com o que já está na lista.** O sistema olha a "cara" de cada
   coluna nos registros existentes (número, código, CNPJ, nome de PIA, texto)
   e avisa quando o dado novo tem cara diferente — por exemplo, um número de
   cartão caindo na coluna onde o resto são nomes de PIA.

Quando encontra alguma coisa, aparece dentro da janela um quadro amarelo com
a lista do que estranhou e dois botões — **Importar assim mesmo** e
**Cancelar**. **Nada é gravado até você escolher.** Se você confirmar, importa
do mesmo jeito — porque exceção legítima existe, e o sistema avisa, não manda.

Essa conferência **não substitui olhar a lista escolhida no passo 1**: ela
pega o caso grosseiro, não todos.

---

## Como preparar os dados com o assistente

Quando os dados vierem de outro lugar (um extrato, uma lista do SIGA, uma
planilha antiga, uma mensagem de WhatsApp), o caminho mais rápido é pedir ao
assistente para arrumar o texto no formato certo.

**Abra um chat novo, anexe o arquivo (ou cole os dados) e mande o prompt
abaixo.** O que voltar é o texto que você cola na janela de importação.

### Prompt para copiar

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

### CARTÕES PRÉ-PAGOS  (`CARTOES`)

Colunas, nesta ordem: `Nº conta do cartão` · `Titular (PagCorp)` · `PIA` · `Sub-tesouraria` · `Conta pai PagCorp` · `Cód. reduzido SIGA` · `Nome conforme SIGA` · `Consta no SIGA?` · `Tipo de cartão` · `Status` · `Observação`

### DIÁCONOS (SIGNATÁRIOS)  (`DIACONOS`)

Colunas, nesta ordem: `Nome` · `Cargo` · `Frequência`

### TIPOS DE MOVIMENTAÇÃO  (`TIPOS`)

Colunas, nesta ordem: `Tipo de movimentação` · `Sentido crédito/débito` · `Entre PIAs diferentes` · `Observação` · `Formas que combinam`

**Entre PIAs diferentes** aceita `Sim` (só vale entre PIAs diferentes, como as
transferências entre departamentos), `Não` (só dentro da mesma PIA) ou
`Indiferente` (serve nos dois casos).

**Formas que combinam** vazio quer dizer "serve para qualquer forma". Preenchido
(ex.: `TRANSF. BANCÁRIA; PIX`), a finalidade só aparece quando a forma escolhida
está na lista.

### FORMAS DE MOVIMENTAÇÃO  (`FORMAS`)

Colunas, nesta ordem: `Forma` · `Em espécie?` · `Observação` · `Subforma de` · `Exige conta de` · `Instituições`

**Subforma de** vazio = forma de primeiro nível; preenchido = esta linha é
subforma daquela (DINHEIRO e CHEQUE são subformas de SAQUE).
**Exige conta de** vazio = não exige nada; `CAIXA` = pelo menos um dos dois
lados tem de ser conta de caixa.
**Instituições** vazio = tanto faz; `MESMA` = só dentro da mesma instituição;
`DIFERENTES` = só entre instituições distintas.

### REGRAS ENTRE CONTAS  (`RELACOES`)

Colunas, nesta ordem: `Natureza de origem` · `Natureza de destino` · `Formas permitidas` · `Formas proibidas` · `Origem da regra` · `Ativa` · `Por quê` · `Origem contém` · `Destino contém`

As naturezas aceitas são `CAIXA`, `BANCO`, `ACG`, `CARTAO` e `*` (qualquer uma).
**Um par sem nenhuma regra é livre:** as linhas são restrições, não permissões.

### STATUS (ETAPAS)  (`STATUS`)

Colunas, nesta ordem: `Status` · `Quando usar` · `Etapa da sequência`

### ADMs, CNPJ E LOCALIDADES  (`ADMS`)

Colunas, nesta ordem: `ADM` · `CNPJ` · `Endereço` · `Cidade / UF` · `Inscrição estadual` · `PIA` · `Status da PIA`

**Endereço e cidade vão separados de propósito:** o cabeçalho do comprovante usa
o endereço à esquerda e a cidade no centro. Endereço é só o logradouro e o
número (`RUA JOAQUIM CARDEAL DE SOUZA , 311`); cidade é `CIDADE - UF`
(`COXIM - MS`).

### ABREVIATURAS DE BANCOS  (`BANCOS`)

Colunas, nesta ordem: `Nome do banco` · `Abreviatura` · `Observação`

### CONTROLE DA NUMERAÇÃO  (`CONTROLE`)

Colunas, nesta ordem: `Chave` · `Valor` · `Para que serve`

Observações sobre os dados:
- CONTAS: o campo `Texto que aparece na lista` é o que o usuário vê ao
  escolher origem e destino. Padrão: `PIA-NOME: 101.10 - BB - AG:0000
  CC:00000-0 - PIEDADE`.
- CARTÕES: o número que vale é o da conta do cartão, completo, sem máscara.
- DIÁCONOS: nome completo como assina; cargo normalmente "Diácono".
- CONTROLE: só quatro chaves fixas — PREFIXO_REFERENCIA, ANO_CORRENTE,
  ULTIMO_NUMERO, PROXIMA_REFERENCIA, PASTA_DRIVE_PADRAO. Nunca acrescentar
  chave nova sem combinar antes.
```

---

## Por que assim, e não lendo o arquivo direto

O Apps Script até consegue ler um arquivo do Drive, mas aí o sistema teria de
adivinhar de qual lista são os dados, em que ordem estão as colunas e o que
fazer com o que já existe — três chances de errar em silêncio. Colando o
texto, **você vê o que está mandando** e a janela mostra o que foi feito,
registro por registro. Se algo estiver errado, ela recusa a importação
inteira em vez de gravar pela metade.
