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
4. **Cole os dados** na caixa e clique em **Importar**.

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

Colunas, nesta ordem: `PIA` · `ADM` · `Grupo cont\u00e1bil` · `C\u00f3d. SIGA` · `Conta PagCorp` · `Texto que aparece na lista` · `Status` · `Observa\u00e7\u00e3o`

### CART\u00d5ES PR\u00c9-PAGOS  (`CARTOES`)

Colunas, nesta ordem: `N\u00ba conta do cart\u00e3o` · `Titular (PagCorp)` · `PIA` · `Sub-tesouraria` · `Conta pai PagCorp` · `C\u00f3d. reduzido SIGA` · `Nome conforme SIGA` · `Consta no SIGA?` · `Tipo de cart\u00e3o` · `Status` · `Observa\u00e7\u00e3o`

### DI\u00c1CONOS (SIGNAT\u00c1RIOS)  (`DIACONOS`)

Colunas, nesta ordem: `Nome` · `Cargo` · `Frequ\u00eancia`

### TIPOS DE MOVIMENTA\u00c7\u00c3O  (`TIPOS`)

Colunas, nesta ordem: `Tipo de movimenta\u00e7\u00e3o` · `Sentido cr\u00e9dito/d\u00e9bito` · `Observa\u00e7\u00e3o`

### STATUS (ETAPAS)  (`STATUS`)

Colunas, nesta ordem: `Status` · `Quando usar` · `Etapa da sequ\u00eancia`

### ADMs, CNPJ E LOCALIDADES  (`ADMS`)

Colunas, nesta ordem: `ADM` · `CNPJ` · `Endere\u00e7o` · `PIA` · `Status da PIA`

### ABREVIATURAS DE BANCOS  (`BANCOS`)

Colunas, nesta ordem: `Nome do banco` · `Abreviatura` · `Observa\u00e7\u00e3o`

### CONTROLE DA NUMERA\u00c7\u00c3O  (`CONTROLE`)

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
