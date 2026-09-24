# Fórmulas, validações e o valor por extenso

O que a **aba Comprovante** faz sozinha, sem o formulário: escreve o extenso,
soma o lote, e refaz a cadeia conta → PIA → CNPJ → título → cabeçalho quando
alguém edita uma célula à mão.

Fica em `apps_script/03_Formulas_Validacoes.gs`.

---

## 1. O que acontece sozinho

Ao editar uma célula da aba Comprovante (gatilho `onEdit`):

| Você mexe em | O sistema refaz |
|---|---|
| Valor | o **extenso**, ao lado |
| uma linha da tabela do lote | a **soma** e o extenso dela |
| a conta de origem ou de destino | a **PIA**, o **CNPJ**, o **título** e o **cabeçalho** daquele lado |

**Isto é uma segunda camada de segurança, não o caminho principal.** O
caminho principal é o formulário: ninguém deveria digitar na aba. Estes
automatismos existem para quem abrir a aba e editar por engano.

Quando o formulário passar a ser o único caminho, a chave
`AUTOMATISMOS_NA_PLANILHA` (no alto do arquivo) desliga tudo isto de uma vez.
Está pendente, e é o último item da Etapa 4.

**`onEdit` engole erro de propósito** — um gatilho que estoura atrapalha quem
está digitando. Por isso existe o menu **Recalcular o comprovante**, que faz
exatamente o mesmo **e mostra o erro**. Quando algo "não acontece sozinho",
rode por ele para ver o motivo.

## 2. O valor por extenso

`numeroPorExtenso(valor)`. Sai em **CAIXA ALTA e entre parênteses**, e também
funciona como fórmula na planilha: `=numeroPorExtenso(A1)`.

### "UM MIL", e não "MIL"

Decidido pela praxe do documento de valor, não pela gramática do texto
corrido. Em texto corrido se escreve *mil reais*; em cheque, recibo, contrato
ou comprovante se escreve **um mil**, porque o extenso existe para **travar o
número** — e um extenso que começa em "MIL" deixa espaço em branco antes de
si, onde se acrescenta palavra em documento já assinado.

É a mesma razão do caixa alta e dos parênteses. O SIGA segue a mesma praxe
(`(UM MIL E OITOCENTOS REAIS)`), e os dois documentos são arquivados lado a
lado. Para mudar, a constante `DIZER_UM_ANTES_DE_MIL`.

### Centavos se contam em centavos

Nunca em ponto flutuante: `1,005` vira `100,49999…` e arredonda para baixo. O
código conta em **centavos inteiros**, com uma folga de `+1e-6` para o erro de
representação.

### Duas linhas

O extenso ocupa **duas linhas mescladas, com quebra de texto**. Em uma linha
só, `99.999,99` saía cortado no PDF — e cortado em silêncio, que é o pior
jeito.

### A bateria

Menu **Tesouraria • CMP p/ SIGA → Testar o valor por extenso**: 29 conferências —
redondos, centavos, acima de mil, milhão, zero e arredondamento.

## 3. A conta manda em tudo

Quem preenche escolhe a **conta**; a PIA, o CNPJ, o título e o cabeçalho são
consequência. A cadeia está descrita em `02_especificacao_campos.md`, seção
6.1.

Duas coisas que nasceram de defeitos reais:

- **A lista CONTAS é a fonte da verdade da PIA.** O sistema só deduz a PIA
  pelo texto (o que vem antes do dois-pontos) quando não acha a conta na
  lista — e, se o que sobrar não começar com "PIA", **não escreve nada e
  avisa**. Antes ele escrevia o palpite: uma conta fora da lista virava a
  "PIA" `101.17 - ACG - AG`, nenhuma ADM casava, e **o cabeçalho congelava**.
- **Um lado nunca mexe no outro.** Trocar a conta de origem mudava o destino,
  e o comprovante saía com a conta de uma PIA e o CNPJ de outra.

## 4. Campos calculados: protegidos por aviso

Cinco não se digitam — **extenso, título, os dois CNPJs e o total do lote**.
Todos têm proteção do tipo **aviso**: o Google pergunta "tem certeza?" e, se
houver motivo, deixa seguir. **Avisar, nunca bloquear** — e o script continua
escrevendo neles normalmente.

O extenso ainda ganha uma **anotação na célula** explicando por que não se
digita ali: um comprovante com o número dizendo uma coisa e o extenso dizendo
outra é exatamente o que a conferência da tesouraria procura.

Repor: **Tesouraria • CMP p/ SIGA → Proteger os campos calculados** (acontece sozinho ao
recriar o layout e ao aplicar as listas suspensas).

## 5. Listas suspensas na própria aba

**Tesouraria • CMP p/ SIGA → Aplicar listas suspensas no Comprovante** põe validação de
dados nas células de origem, destino, contas e status, lendo da aba Cadastros.

Sempre do tipo **"mostrar aviso"**, nunca "rejeitar entrada": é a mesma regra
de ouro, e rejeitar entrada impediria o próprio script de escrever ali.

O Sheets **não filtra uma lista suspensa nativa enquanto se digita** dentro da
célula — isso só existe no Excel 365, e é o motivo de o formulário existir.

## 6. O menu Tesouraria • CMP p/ SIGA, inteiro

| Item | O que faz |
|---|---|
| Preencher comprovante (formulário) | Abre o formulário numa janela |
| Preencher em uma aba inteira | Abre o formulário numa aba do navegador |
| Conferir versões dos arquivos | Diz se a tela e o núcleo das regras estão na mesma versão |
| Diagnosticar o arquivo da tela | Conta o que o servidor está lendo do arquivo da tela |
| Gerar PDF do comprovante | Gera o PDF do que está na aba |
| Conferir o layout antes de gerar | Confere as duas medidas que quebram a página |
| Recriar layout do Comprovante | Redesenha a aba |
| Ver como lançamento único / em lote | Mostra a aba nos dois modos |
| Criar / recriar a aba Cadastros | Ver `03_aba_cadastros.md`, seção 4 |
| Conferir cadastros | Confere as listas e mostra o que está solto |
| Cadastrar abreviatura de banco | O caminho da seção 21 de `01_regras_negocio.md` |
| Importar dados para os Cadastros | Ver `05_importar_dados.md` |
| Aplicar listas suspensas no Comprovante | Seção 5 acima |
| Sugerir próxima referência | Escreve a próxima Referência na célula |
| Recalcular o comprovante | O mesmo que o `onEdit`, **mostrando o erro** |
| Proteger os campos calculados | Seção 4 acima |
| Testar o valor por extenso | As 29 conferências |
