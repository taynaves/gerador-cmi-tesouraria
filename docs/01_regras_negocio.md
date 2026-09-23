# Regras de Negócio — Gerador de CMI

Todas as regras abaixo foram confirmadas diretamente com Taynã (Secretaria
da Piedade — Regional Coxim-MS). Onde uma regra foi inferida por lógica e
não confirmada literalmente, está marcado **[INFERÊNCIA — confirmar]**.

---

## 1. Identidade do documento

- **Nome:** Comprovante de Movimentação Interna (CMI).
- **Emitente:** conforme a ADM/CNPJ da conta de Origem (ver seção 5).
- **Não é** nota fiscal nem lançamento contábil — documenta e autentica o
  movimento para anexação no SIGA.

## 2. Identificação do documento — dois campos distintos

Atualizado depois da primeira conferência visual. São **dois campos
separados**, com regras opostas:

### 2.1. Referência (obrigatória, única, nossa)

- É a identificação **própria e exclusiva** de cada comprovante gerado.
- Formato `CMP-[AA]/[NNN]` — **CMP** de *comprovante* —, sequencial,
  reiniciando todo início de ano civil. O sistema sugere o próximo
  automaticamente (último gerado guardado na aba Cadastros).
- O prefixo **não está no código**: é a chave `PREFIXO_REFERENCIA` do bloco
  CONTROLE DA NUMERAÇÃO, na aba Cadastros. Trocar as letras é editar a aba.
- **Nunca se repete.** É por ela que se recupera o comprovante depois: cada
  comprovante gerado salva um arquivo `.md` com todos os dados, nomeado pela
  Referência (ver regra 18).
- Aceita letras e números; avisar (nunca bloquear) se houver acento,
  pontuação ou caractere especial.

### 2.2. Numeração SIGA (opcional, deles)

- É o número do lançamento no SIGA, ou o número do comprovante que o próprio
  SIGA gerou para aquela operação — quando já existir.
- **Opcional.** Se preenchido, aparece no comprovante; se vazio, **fica
  oculto** no PDF, sem deixar espaço em branco.
- **Reuso permitido, sem nenhuma trava de duplicidade:** o mesmo número do
  SIGA pode aparecer em mais de um comprovante (ex.: uma única NFC-e usada
  para justificar dois lançamentos do mesmo envelope de viagem).

## 3. Data de emissão

- Seletor de calendário nativo do Google Sheets (validação de dados tipo
  "Data"; um duplo clique na célula já abre o calendário).
- Atalho de conveniência: um botão "Hoje" no menu customizado, que preenche
  a data atual na célula ativa.

## 4. Valor e extenso

- Valor digitado na célula mesclada do campo Valor.
- O extenso aparece automaticamente, **em caixa alta e entre parênteses**,
  na área reservada ao lado (ver especificação de campos), no padrão do
  modelo oficial: `(TREZENTOS REAIS)`.
- Em comprovante agrupado, o Valor é a **soma automática** de todas as
  linhas do lote, e o extenso reflete essa soma. Nesse caso o **rótulo do
  campo muda de "Valor:" para "Valor Total:"** — em lançamento único
  continua "Valor:".

## 5. CNPJ e ADM

| ADM | CNPJ | Endereço | Cidade / UF | PIAs |
|---|---|---|---|---|
| ADM Coxim-MS | 03.673.233/0001-43 | RUA JOAQUIM CARDEAL DE SOUZA , 311 | COXIM - MS | PIA-COXIM, PIA-SONORA, PIA-SÃO GABRIEL, PIA-ALCINÓPOLIS (futura, inativa) |
| ADM Costa Rica-MS | 15.409.246/0001-99 | RUA TERCIO TEIXEIRA MACHADO , 759 | COSTA RICA - MS | PIA-COSTA (sub-tesourarias de cartão: Secretaria e Atendimento) |

Endereço e CNPJ da ADM Costa Rica conferidos no **cartão CNPJ da Receita**
(emitido em 01/07/2026). A inscrição estadual foi cadastrada como **ISENTO**,
igual à de Coxim — **confirmar com a ADM Costa Rica** antes de emitir o
primeiro comprovante com esse cabeçalho.

**PIA-COSTA é uma PIA só, com uma conta só.** A conta de origem/destino da
PIA-COSTA é a **ACG AG:01 CC:128175700** (confirmada pelo Taynã).
"Secretaria" (127884922) e "Atendimento" (127884955) são duas
sub-tesourarias de cartão dentro dela no PagCorp, não contas de
origem/destino — exatamente como a conta 101.15 da PIA-COXIM, que também se
subdivide em duas no PagCorp sem virar duas contas.

Por isso as duas sub-tesourarias **saíram da lista CONTAS**: apareciam no
campo Conta e faziam escolher a coisa errada. Elas continuam onde importam,
no cadastro de cartões, como conta ACG de cada cartão.

- **Regra confirmada — "quem produz o documento" define o cabeçalho:**
  quando Origem e Destino são de ADMs diferentes, o cabeçalho institucional
  (endereço, CNPJ, "CONGREGAÇÃO CRISTÃ NO BRASIL") de cada etapa segue a
  ADM que **produz aquela etapa**, não sempre a Origem:
  - Etapa **APROVAÇÃO** → dados da **ADM de Origem**.
  - Etapa **PAGAMENTO** → dados da **ADM de Origem**.
  - Etapa **RECEBIMENTO** → dados da **ADM de Destino**.
  - Quando Origem e Destino são da mesma ADM (fluxo de 2 etapas), o
    cabeçalho é sempre o dessa ADM, sem ambiguidade.
  - Isso significa que, no fluxo de 3 etapas entre ADMs diferentes, os 2
    primeiros PDFs saem com o cabeçalho de uma ADM e o terceiro com o
    cabeçalho da outra — implemente a troca de cabeçalho por etapa, não só
    o Status.
- **Como isso já funciona na aba Comprovante (Etapa 3):** trocar a **conta**
  de um lado refaz em cadeia a PIA, o CNPJ, o título e o cabeçalho daquele
  lado. O cabeçalho segue a **ADM de origem** por padrão
  (`atualizarCabecalho_(sh)`); a Etapa 5 vai chamar
  `atualizarCabecalho_(sh, 'destino')` no PDF de Recebimento.

## 6. A regra central: 2 ou 3 documentos por movimentação

Ver `CLAUDE.md` para a tabela completa. Resumo:

- **Origem e destino na mesma PIA** → 2 documentos: `APROVADA` → `EFETIVADA`.
- **Origem e destino em PIAs diferentes** → 3 documentos: `APROVADA` →
  `PAGA` → `RECEBIDA`.
- A comparação é pelo **prefixo de PIA** da conta (ex.: `PIA-COXIM:` vs
  `PIA-SONORA:`), não pelo código da conta isoladamente.
- Antes de gerar: perguntar se os signatários são os mesmos em todas as
  etapas. Se não, coletar por etapa.
- O botão "Gerar PDF" produz um arquivo por etapa, com o Status certo e o
  nome de arquivo identificando a etapa.

## 7. Alcance da movimentação e "sentido invertido"

### 7.1. PIAs diferentes = transferência entre departamentos

**Quando a PIA de origem e a de destino são diferentes, a movimentação é uma
transferência entre departamentos** — e, quando as ADMs também diferem, entre
administrações. **Nada disso é escolhido: as duas contas já dizem.** É a mesma
comparação que decide o título do documento e o número de etapas.

A natureza do par de contas — **entre bancos**, **entre caixas**, **entre
caixa e banco**, **entre cartões**, **entre caixa e cartão**, **entre banco e
cartão** — também é deduzida, e vai escrita na frente da **Observação**, em
todo comprovante. Antes ela era um tipo que alguém marcava na lista: estava
só nos comprovantes em que alguém lembrasse de marcar, e às vezes marcada
errado.

O alcance de cada **finalidade** vem das colunas `Tipo` e `Subtipo` do bloco
ONDE CADA FINALIDADE VALE: é por elas que a *Remessa para outra
ADM/localidade* só aparece entre administrações, e não entre dois
departamentos da mesma ADM. A antiga coluna "Entre PIAs diferentes" saiu
junto com o bloco TIPOS. **A restrição vive no núcleo das regras
(`06_Tipos_E_Regras.gs`), não na planilha e não na tela.**

### 7.2. Sentido invertido

Ver `cadastros/finalidades.csv`, coluna **Sentido**. Três finalidades têm o
sentido de crédito/débito **invertido** em relação ao padrão do formulário
(onde normalmente Origem é debitada e Destino é creditada) — as marcadas
`INVERTIDO`:

- **Zerar conta** (F10): a conta "Origem" recebe crédito; a conta "Destino" é
  debitada.
- **Transferência a débito** entre cartões e entre cartão e conta ACG
  (F14 e F15): mesma inversão.

O comprovante **não faz lançamento contábil** — ele só documenta. Por
isso, não é preciso automatizar contabilmente essa inversão. **É
obrigatório**, porém, mostrar um aviso na tela ao escolher uma dessas
finalidades, lembrando que o sentido é invertido, para evitar preencher
Origem/Destino trocados por engano.

## 8. Cartões

- O número que aparece no comprovante é o **número da conta do cartão**
  (não o número gravado no plástico do Mastercard) — sai **completo**, sem
  máscara.
- O nome do responsável pelo cartão pode (e deve) constar, **exatamente
  como cadastrado no SIGA** — importante porque o mesmo cartão pode trocar
  de responsável ao longo do tempo.
- **A lista de cartões e responsáveis precisa ser editável a qualquer
  momento**, sem mexer em fórmulas — fica na aba/arquivo Cadastros
  (`cadastros/cartoes.csv` é o ponto de partida; a aba Cadastros na
  planilha é a fonte viva depois de construída).
- Cada cartão está vinculado a uma conta ACG (a que o carrega/drena).

## 9. Agrupamento (comprovante único para várias movimentações)

Condições, todas obrigatórias:

1. **Mesma etapa** (nunca misturar Aprovação com Efetivação, por exemplo,
   no mesmo lote). **[INFERÊNCIA — confirmar com o Taynã na primeira
   sessão de construção]** — decorre logicamente da regra 6, mas não foi
   dita nessas palavras.
2. **Mesmo mês** — a data de cada lançamento cai no mesmo mês/ano.
3. **Mesma origem e mesmo destino** — **exceto** no caso de crédito/débito
   de cartões: aí o critério é **mesma conta ACG do lado de origem OU do
   lado de destino**, mesmo que o cartão específico (o "destino"
   individual) mude de linha para linha.
4. **Mesmo tipo de movimentação.**

O Valor total é a soma automática das linhas do lote (ver seção 4).

**Como a tabela aparece no documento (definido na conferência visual):**

- Em **lançamento único**, a tabela **não existe** no comprovante — nem
  cabeçalho, nem linhas, nem TOTAL. O documento fica idêntico ao do SIGA.
- Em **lote**, aparecem **exatamente tantas linhas quantos forem os
  lançamentos**. Nenhuma linha em branco, nunca.
- Limite de uma folha: 35 lançamentos. Acima disso, gerar "Folha 2 / 2".

## 10. Assinaturas

- **Obrigatório 3 assinaturas** para o documento poder ser anexado no
  SIGA (nome completo + cargo/função + assinatura).
- **O PDF pode ser gerado com menos (ou nenhum) assinante preenchido.**
  Nesse caso, o espaço de nome/cargo fica em branco no documento impresso,
  para preenchimento manual à caneta ou carimbo.
- Incluir uma nota de rodapé no PDF lembrando o mínimo de 3 assinaturas
  necessário para anexação no SIGA.
- Seleção de assinante: escolher entre os diáconos cadastrados
  (`cadastros/diaconos.csv`), com opção de inserir manualmente nome e
  cargo quando for um signatário esporádico, fora da lista.
- Não há, por ora, nenhuma outra regra (ex.: impedir que quem recebe o
  valor também assine) — pode surgir no futuro; deixar a estrutura fácil
  de estender.

## 11. Origem ≠ Destino

- É **proibido** que a conta de Origem e a conta de Destino sejam a mesma.
- Exibir um alerta claro ao tentar salvar/gerar com Origem = Destino.
- A comparação correta é por **localidade (PIA) + código da conta juntos**,
  nunca só pelo código — o mesmo código de conta (ex.: `10010` — CAIXA
  OBRA DA PIEDADE) existe em mais de uma PIA e são contas diferentes entre
  si.

## 12. Compartilhamento dos PDFs gerados

Dois modos, escolhidos no momento de gerar:

- **(A) Colaborador da PIA-Coxim:** o PDF vai para a pasta padrão do
  projeto no Drive do Taynã, organizada por PIA de origem (em nome do
  arquivo ou em subpasta — decidir na construção, o que for mais simples
  de manter).
- **(B) Destinatário de outra ADM:** o PDF vai para uma **pasta do Drive
  escolhida por esse destinatário** — nunca misturada com os documentos
  do Taynã. Ele informa o link/ID da pasta de destino no momento de gerar
  (ou ela fica salva no cadastro daquela ADM/pessoa, para reuso).

## 13. Usuários e dispositivos

- Vários colaboradores vão usar o sistema, em computador e eventualmente
  em celular. **O celular é resolvido pelo formulário da Etapa 4**, com
  campos normais em vez de células mescladas — não há "Fase 2" nem Web App
  publicado no plano. Um link público fora do Sheets só se o Taynã pedir, e
  como projeto à parte. Ver `CLAUDE.md`, seção ARQUITETURA.

## 14. Relatório mensal

- Incluir uma aba-resumo por mês e por conta, para conferência com o
  extrato/balancete e apoio ao Conselho Fiscal.

## 15. Título do documento — depende da movimentação

Confirmado pelo Taynã na conferência visual da Etapa 1:

| Situação | Título impresso |
|---|---|
| Origem e destino na **mesma PIA** (só muda de conta) | `COMPROVANTE DE MOVIMENTAÇÃO INTERNA` |
| Origem e destino em **PIAs diferentes** | `COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS` |

A comparação é a **mesma** que decide se a movimentação gera 2 ou 3
documentos (regra 6): prefixo da PIA da conta de origem contra o da conta de
destino. Ou seja: todo comprovante de 2 etapas leva o título de movimentação
interna, e todo comprovante de 3 etapas leva o de transferência de numerários.

O rótulo do campo de tipo também segue o SIGA: **"Tipo Transferência:"**.

## 16. Caixa alta nos dados

- **Todo dado preenchido sai em CAIXA ALTA** no documento — é o padrão do
  SIGA e do preenchimento manual de hoje.
- **Os rótulos ficam como estão escritos** ("Data Emissão:", "Tipo
  Transferência:", "Observação:"), também seguindo o SIGA.
- **Exceção:** nome e cargo dos signatários saem como estão no cadastro de
  diáconos — são nomes próprios já formatados.

## 17. Identidade visual: igual à do SIGA

Decisão tomada na conferência visual da Etapa 1, comparando o CMI gerado com
um comprovante real emitido pelo SIGA
(`docs/referencia_siga_comprovante.pdf`):

- O CMI e o comprovante do SIGA devem ter a **mesma identidade visual** —
  mesma fonte (Tahoma), mesmos tamanhos de letra, mesma espessura de linha,
  mesmas margens e o mesmo espaçamento entre linhas.
- **Teste de aceitação:** sobrepondo os dois documentos, os campos que
  existem nos dois (cabeçalho institucional, título, Status, Data Emissão,
  Valor, Tipo, Observação, Origem, Destino, CNPJ, réguas separadoras, linhas
  de assinatura e régua do rodapé) têm que **coincidir**. Campos que só
  existem no CMI não entram no teste.
- A referência aprovada é `docs/referencia_layout_aprovado.pdf`; as medidas
  estão em `docs/02_especificacao_campos.md`.
- Consequência prática: o PDF é sempre gerado em **escala Normal (100%)**,
  nunca "ajustar à largura" ou "à altura" — essas opções mudam o tamanho da
  letra e quebram a sobreposição.

## 18. Arquivo de recuperação (.md) por comprovante

- **Todo comprovante gerado salva também um arquivo `.md`** com todos os
  dados que o originaram (referência, numeração SIGA, data, valor, extenso,
  tipo, observação, origem, destino, contas, CNPJs, etapa/status,
  signatários e, em lote, todas as linhas do lote).
- Serve para **recuperar ou refazer** um comprovante sem redigitar nada.
- O arquivo é nomeado pela **Referência** (regra 2.1), que é única — é o que
  amarra o `.md` ao PDF correspondente.
- Fica na mesma pasta do Drive do PDF gerado (ver regra 12).

## 19. Contas de origem e destino (linha opcional)

- Abaixo de Origem e Destino existe uma linha com a **conta envolvida de cada
  lado** (ex.: `Conta: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE`).
- O SIGA mostra só a PIA; a conta é um acréscimo nosso, para conferência da
  tesouraria.
- **É opcional:** quem preenche pode deixar a linha oculta.
- **Antes de gerar o PDF, avisar** se esse campo estiver vazio ou oculto —
  aviso, nunca bloqueio.

## 20. Nomes de banco: abreviatura de até 6 letras

- No texto das contas, o nome do banco entra **abreviado, com no máximo
  6 letras** — 6 e não 5 porque em alguns casos fica melhor (`SICRED`). Aplicado aos existentes: `BANCO DO BRASIL S.A` → **BB**,
  `SANTANDER` → **SANT**.
- A lista de abreviaturas fica na aba Cadastros, bloco *ABREVIATURAS DE
  BANCOS* (`cadastros/abreviaturas_bancos.csv` é o ponto de partida), e é
  editável a qualquer momento.
- **Ao cadastrar um banco novo**, o sistema:
  1. procura o banco na lista;
  2. se não achar, **deduz** uma abreviatura (primeira palavra significativa
     com até 6 letras; senão as iniciais; senão as 6 primeiras letras);
  3. **mostra a sugestão e pergunta se o usuário concorda**;
  4. se ele não concordar, **pede a abreviatura desejada** (recusando mais de
     6 letras) e grava no cadastro para as próximas vezes.
- O sistema nunca escolhe a abreviatura sozinho sem mostrar ao usuário.
