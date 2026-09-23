# Regras de negócio — o que o comprovante é e como se comporta

Todas as regras abaixo foram **confirmadas com o Taynã**. Onde algo foi
deduzido por lógica e não dito por ele, está marcado
**[DEDUZIDO — confirmar]**.

Este arquivo diz **o que o sistema faz e por quê**. Onde cada coisa fica no
papel está em `02_especificacao_campos.md`; o que cada lista guarda, em
`03_aba_cadastros.md`.

---

## 1. O que é o documento

O **Comprovante de Movimentação Interna (CMI)** documenta e autentica dinheiro
andando **entre contas da própria obra** — caixas, bancos e cartões pré-pagos
da Piedade. Ele é anexado no SIGA como prova documental.

**Não é** nota fiscal, **não é** lançamento contábil e **nunca** documenta
pagamento a terceiro. Quem emite é a ADM da conta envolvida (seção 5).

## 2. Identificação — dois campos, regras opostas

### 2.1 Referência (nossa, obrigatória, única)

- Formato `CMP-[AA]/[NNN]` — **CMP** de *comprovante* —, sequencial,
  reiniciando a cada ano civil.
- O prefixo **não está no código**: é a chave `PREFIXO_REFERENCIA`, no bloco
  CONTROLE DA NUMERAÇÃO da aba Cadastros.
- **Nunca se repete.** É por ela que se recupera o comprovante depois: cada
  PDF gerado salva um arquivo `.md` com o mesmo nome (seção 19).
- **Só é consumida quando o PDF é gerado.** Abrir o formulário e desistir não
  pode queimar um número.
- **Três exceções**, todas registradas com o motivo escrito por quem usa:
  **2ª via** (não consome nada), **histórico indisponível**, e **correção de
  lançamento** (gera de novo com o mesmo número — a contagem não anda).
- Aceita letras e números; **avisa, nunca bloqueia**, se houver acento ou
  pontuação.

### 2.2 Numeração SIGA (deles, opcional, repetível)

- É o número do lançamento no SIGA, quando já existir.
- **Se vazia, some do documento** — não deixa espaço em branco.
- **Pode se repetir à vontade, sem nenhuma trava**: uma única nota fiscal pode
  justificar dois lançamentos.

## 3. Data de emissão

Escolhida no formulário, com o seletor de data do navegador; começa na data de
hoje. O rodapé do documento carrega, além dela, o carimbo
`Emitido em dd/MM/yyyy HH:mm:ss`, gravado no instante em que o PDF é gerado.

## 4. Valor e extenso

- O extenso é **calculado**, sai em **CAIXA ALTA e entre parênteses** e ocupa
  **duas linhas** — em uma linha, `99.999,99` saía cortado no PDF.
- **"UM MIL", e não "MIL"**: é praxe de documento de valor, não gramática de
  texto corrido. O extenso existe para **travar o número**, e um extenso
  começado em "MIL" deixa espaço em branco antes de si, onde se acrescenta
  palavra em documento já assinado. O SIGA usa a mesma praxe.
- Em lote, o Valor é a **soma automática** das linhas, e o rótulo do campo
  muda de "Valor:" para **"Valor Total:"**.

## 5. ADMs, CNPJ e cabeçalho

| ADM | CNPJ | Endereço | Cidade/UF | PIAs |
|---|---|---|---|---|
| ADM Coxim-MS | 03.673.233/0001-43 | Rua Joaquim Cardeal de Souza, 311 | Coxim - MS | PIA-COXIM, PIA-SONORA, PIA-SÃO GABRIEL, PIA-ALCINÓPOLIS (futura) |
| ADM Costa Rica-MS | 15.409.246/0001-99 | Rua Tercio Teixeira Machado, 759 | Costa Rica - MS | PIA-COSTA |

Endereço e CNPJ de Costa Rica conferidos no cartão CNPJ da Receita. A
inscrição estadual foi cadastrada como **ISENTO**, igual à de Coxim —
**confirmar com a ADM Costa Rica** antes do primeiro comprovante com esse
cabeçalho.

**PIA-COSTA é uma PIA só, com uma conta só** (a ACG `AG:01 CC:128175700`).
"Secretaria" e "Atendimento" são **sub-tesourarias de cartão** dentro dela no
PagCorp, não contas de origem ou destino — por isso saíram da lista CONTAS,
onde faziam escolher a coisa errada, e vivem no cadastro de cartões.

**Quem produz o documento define o cabeçalho.** Quando origem e destino são de
ADMs diferentes:

| Etapa | Cabeçalho |
|---|---|
| Aprovação | ADM de **origem** |
| Pagamento | ADM de **origem** |
| Recebimento | ADM de **destino** |

Na mesma ADM não há ambiguidade. Hoje o sistema escreve sempre o de origem; a
troca no PDF de Recebimento é trabalho da Etapa 5.

## 6. A regra central: 2 ou 3 documentos

| As duas contas | Documentos | Status |
|---|---|---|
| **mesma PIA** | 2 | `APROVADA` → `EFETIVADA` |
| **PIAs diferentes** | 3 | `APROVADA` → `PAGA` → `RECEBIDA` |

A comparação é pelo **prefixo da PIA** da conta (`PIA-COXIM:` contra
`PIA-SONORA:`), nunca pelo código da conta sozinho — `100.10` existe em toda
PIA e são contas diferentes.

Antes de gerar, pergunta-se **uma vez**: "os signatários serão os mesmos em
todas as etapas?". Número, data, valor, origem, destino, tipo e observação são
iguais nas 2 ou 3 etapas; só o Status muda — e o cabeçalho, no caso da
seção 5.

## 7. Título — sai da mesma comparação

| As duas contas | Título impresso |
|---|---|
| mesma PIA | `COMPROVANTE DE MOVIMENTAÇÃO INTERNA (de numerários)` |
| PIAs diferentes | `COMPROVANTE DE TRANSFERÊNCIA (externa) DE NUMERÁRIOS` |

**O parêntese em caixa baixa não é enfeite**: são dois tipos diferentes, e os
nomes antigos não diziam isso. Por causa dele, o título é escrito **sem passar
pelo caixa-alta** que o resto do documento usa — do contrário sairia
"(DE NUMERÁRIOS)".

## 8. O campo "Tipo Transferência" não repete o título

Ele leva o **subtipo** (quando existe), a **forma** e a **finalidade**:

| Situação | Campo Tipo |
|---|---|
| mesma PIA | `PIX · CARREGAMENTO DE CARTÃO` |
| PIAs diferentes, mesma ADM | `ENTRE DEPARTAMENTOS · PIX` |
| ADMs diferentes | `ENTRE ADMINISTRAÇÕES · PIX` |

Numa movimentação interna sem forma escolhida, **o campo sai em branco** — e
está certo: o que havia para dizer já está no título.

**O subtipo é deduzido das contas, nunca escolhido.** O rótulo do campo segue
o SIGA: "Tipo Transferência:".

## 9. A Observação leva o par de contas na frente

Antes do texto digitado, o sistema escreve o **tipo de contas envolvidas**:
`ENTRE CAIXAS`, `ENTRE BANCOS`, `ENTRE CAIXA E BANCO`, `ENTRE CARTÕES`,
`ENTRE CAIXA E CARTÃO`, `ENTRE BANCO E CARTÃO`.

- A ordem é **fixa** (caixa, banco, cartão): a frase descreve o **par**, não o
  sentido — senão o mesmo movimento sairia descrito de dois jeitos conforme
  quem paga.
- A **ACG entra como BANCO**: ela mora no grupo `101 - BANCOS CONTA
  MOVIMENTO`. A natureza ACG existe para as regras, não para descrever a conta
  no papel.
- **Deduzida, está em todos os comprovantes**; escolhida, estava só nos que
  alguém lembrasse de marcar — e às vezes marcada errado.
- A tela mostra a frase inteira antes de gerar, para ninguém descobrir isso no
  PDF.

## 10. A finalidade — a quinta pergunta, e a única escolhida

Onde a movimentação acontece sai das contas; como o dinheiro anda sai da
forma; que espécie de movimentação é sai do subtipo. **O propósito só quem
lança sabe.**

As 26 finalidades e as 39 linhas de "onde cada uma vale" saíram de um
levantamento nos manuais da obra, e **cada linha cita a fonte**. Nenhuma foi
inventada. Duas coisas do desenho não se negociam:

- a comparação é pelas **quatro colunas de texto** (Tipo, Subtipo, Forma,
  Subforma), **não** pela coluna Folha — a folha é o código do levantamento e
  serve só para rastrear;
- **vazio não corta, dos dois lados**: vazio na regra quer dizer "serve para
  qualquer um"; vazio no estado quer dizer "ainda não escolheram".

Dá para acrescentar uma finalidade pelo próprio formulário. Ela nasce marcada
como **decisão desta tesouraria, com a data** — escrever "manual" numa linha
que não veio de manual seria mentir no cadastro.

## 11. O que decide as formas permitidas

Três coisas são o que **esta tesouraria decidiu** (bloco REGRAS ENTRE CONTAS):

1. **Um par sem regra é livre.** As linhas são restrições, não permissões.
2. **Entre as permissões, a mais específica manda** (natureza vale 1 ponto por
   lado; texto de conta vale 2). Sem isso não há como escrever exceção.
3. **As proibições valem sempre.** Uma exceção específica não ressuscita o que
   uma regra geral proibiu.

A quarta **não é decisão de ninguém** — é o que a forma **é** (bloco FORMAS):

- `Exige conta de` — pelo menos um lado tem de ser daquela natureza. `CAIXA`
  em DINHEIRO e CHEQUE: dinheiro que não passa por um caixa não é dinheiro, é
  transferência.
- `Instituições` — `MESMA` (transferência bancária é, por definição, dentro de
  uma instituição) ou `DIFERENTES` (TED e PIX existem para atravessar bancos).
  **Caixa não tem instituição, e aí a comparação não acontece.**

Disso caem três pares **impossíveis** que ninguém escreveu como proibição:
caixa ↔ ACG, caixa ↔ SANT e cartão ↔ banco de fora.

**SAQUE é família, não forma**: tem as subformas DINHEIRO e CHEQUE, e o
formulário pede a segunda.

**Esta é a única trava do sistema, e ela tem porta:** a chave
`RESTRICOES_ATIVAS`, na aba Cadastros, desliga todas de uma vez — é o caminho
do ajuste financeiro ou contábil. Todo o resto do sistema avisa e deixa
seguir.

## 12. Sentido invertido

Três finalidades têm o sentido de crédito/débito **invertido** em relação ao
padrão (onde a origem é debitada e o destino creditado) — ver a coluna
`Sentido` em `cadastros/finalidades.csv`:

- **Zerar conta** (F10): a conta "origem" recebe crédito;
- **Transferência a débito** entre cartões e entre cartão e ACG (F14 e F15).

O comprovante **não faz lançamento contábil** — ele documenta. Por isso a
inversão não é automatizada; o que é **obrigatório** é avisar na tela ao
escolher uma dessas finalidades, para ninguém preencher origem e destino
trocados.

## 13. Cartões

- O número que aparece no comprovante é o **número da conta do cartão** (não o
  que está gravado no plástico), **completo, sem máscara**.
- Ele vai **colado na conta** (`204.9 - CARTÃO DE DÉBITO Nº 127884146`),
  porque é o cartão que diz **qual** é a conta: a conta contábil existe em
  todas as PIAs.
- O nome do responsável consta **como está no SIGA** — importa porque o mesmo
  cartão troca de responsável ao longo do tempo.
- Cada cartão é vinculado à conta ACG que o carrega.
- A lista é editável a qualquer momento, sem mexer em fórmula.

## 14. Agrupamento — um comprovante para várias movimentações

Serve para poupar assinaturas. Condições, todas obrigatórias:

1. **Mesma etapa** — nunca misturar Aprovação com Efetivação no mesmo lote.
   **[DEDUZIDO — confirmar]**: decorre da seção 6, mas não foi dito nessas
   palavras.
2. **Mesmo mês.**
3. **Mesma origem e mesmo destino** — exceto em cartões, onde o critério é a
   **mesma conta ACG** de um dos lados, ainda que o cartão mude de linha para
   linha.
4. **Mesmo tipo de movimentação.**

No papel: em **lançamento único a tabela não existe** — nem cabeçalho, nem
linhas, nem TOTAL, e o documento fica igual ao do SIGA. Em **lote**, aparecem
**exatamente tantas linhas quantos forem os lançamentos**, nunca uma em
branco. Cabem **32 lançamentos** numa folha.

Em lote, o campo do número do cartão some: um lote de cinco cartões diferentes
não teria como escolher qual iria para a linha da conta.

## 15. Assinaturas

- **Mínimo de 3** para o documento poder ser anexado no SIGA (nome completo,
  cargo e assinatura).
- **O PDF pode ser gerado com menos, ou com nenhum**: os espaços saem em
  branco, para caneta ou carimbo. O sistema **avisa, nunca bloqueia**.
- O documento traz uma nota lembrando o mínimo de 3.
- São **seis posições**. O assinante sai do cadastro de diáconos, e a sexta é
  de preenchimento manual, para signatário esporádico.
- Nome e cargo saem **como estão no cadastro** — são nomes próprios já
  formatados, e não passam pelo caixa-alta.
- Não há, por ora, nenhuma regra impedindo que quem recebe o valor assine.

## 16. Origem nunca é igual a Destino

É **proibido**, e o sistema avisa. A comparação é por **PIA + código da conta
juntos**, nunca só pelo código.

## 17. Caixa alta

**Todo dado preenchido sai em CAIXA ALTA** — é o padrão do SIGA e do
preenchimento manual de hoje. **Os rótulos ficam como estão escritos.** Duas
exceções: o **título** (por causa do parêntese, seção 7) e o **nome e cargo
dos signatários** (seção 15).

## 18. Identidade visual: a do SIGA

O CMI e o comprovante que o SIGA emite têm a **mesma identidade visual** —
mesma fonte (Tahoma), mesmos tamanhos, mesma espessura de linha, mesmas
margens.

**Teste de aceitação:** sobrepondo os dois documentos, os campos que existem
nos dois **coincidem**. Campos que só existem no CMI não entram no teste.

Consequência prática: o PDF sai sempre em **escala Normal (100%)** — "ajustar
à largura" ou "à altura" muda o tamanho da letra e quebra a sobreposição.

A referência aprovada é `referencia_layout_aprovado.pdf`; as medidas estão em
`02_especificacao_campos.md`.

## 19. Um arquivo de recuperação por comprovante

Todo comprovante gerado salva, **ao lado do PDF**, um arquivo `.md` com tudo o
que o originou: referência, numeração SIGA, data, valor, extenso, tipo,
observação, origem, destino, contas, CNPJs, etapa, signatários e, em lote,
todas as linhas.

Serve para **refazer ou conferir** um comprovante sem redigitar nada. O nome
é a Referência, que é única — é o que amarra o `.md` ao PDF.
*(Previsto; entra na Etapa 5.)*

## 20. Onde os arquivos são salvos

- O PDF vai para a pasta do Drive indicada em `PASTA_DRIVE_PADRAO`; se ela
  estiver vazia, para a pasta onde a planilha mora.
- **Quando o destinatário é de outra ADM**, a intenção é que o arquivo possa
  ir para uma pasta escolhida por ele, nunca misturada com os documentos do
  Taynã. *(Ainda não implementado.)*

## 21. Nomes de banco: abreviatura de até 6 letras

No texto das contas o banco entra **abreviado, com no máximo 6 letras** — 6, e
não 5, porque em alguns casos fica melhor (`SICRED`). `BANCO DO BRASIL S.A` →
**BB**; `SANTANDER` → **SANT**.

Ao cadastrar um banco novo, o sistema procura na lista, **deduz** uma
abreviatura se não achar, **mostra e pergunta**, e grava a escolha. Nunca
decide sozinho sem mostrar.

## 22. Quem usa, e em quê

Vários diáconos, em computador e eventualmente em celular. O celular é
resolvido pelo **formulário**, com campos normais em vez de células mescladas.
Pense neles como usuários finais leigos.

## 23. Relatório mensal

Previsto para a Etapa 6: um resumo por mês e por conta, para conferência com o
extrato e apoio ao Conselho Fiscal.
