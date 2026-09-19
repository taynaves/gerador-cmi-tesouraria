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
- Formato `INT-[AA]/[NNN]`, sequencial, reiniciando todo início de ano civil.
  O sistema sugere o próximo automaticamente (último gerado guardado na aba
  Cadastros).
- **Nunca se repete.** É por ela que se recupera o comprovante depois: cada
  comprovante gerado salva um arquivo `.md` com todos os dados, nomeado pela
  Referência (ver regra 16).
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

| ADM | CNPJ | PIAs |
|---|---|---|
| ADM Coxim-MS | 03.673.233/0001-43 | PIA-COXIM, PIA-SONORA, PIA-SÃO GABRIEL, PIA-ALCINÓPOLIS (futura, inativa) |
| ADM Costa Rica-MS | 15.409.246/0001-99 | a definir — a ADM terá mais 1 ou 2 pontos de atendimento (PIAs) futuramente |

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

## 7. Tipos de movimentação e "sentido invertido"

Ver `cadastros/tipos_movimentacao.csv` para a lista completa. Dois tipos
têm o sentido de crédito/débito **invertido** em relação ao padrão do
formulário (onde normalmente Origem é debitada e Destino é creditada):

- **Zerar Conta:** a conta "Origem" recebe crédito; a conta "Destino" é
  debitada.
- **Transferência Débito** (cartão↔cartão ou cartão↔conta ACG): mesma
  inversão.

O comprovante **não faz lançamento contábil** — ele só documenta. Por
isso, não é preciso automatizar contabilmente essa inversão. **É
obrigatório**, porém, mostrar um aviso na tela ao escolher um desses dois
tipos, lembrando que o sentido é invertido, para evitar preencher Origem/
Destino trocados por engano.

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
  em celular. Ver a limitação técnica sobre preenchimento em celular no
  `CLAUDE.md` (motivo da Fase 2 / Web App futuro).

## 14. Relatório mensal

- Incluir uma aba-resumo por mês e por conta, para conferência com o
  extrato/balancete e apoio ao Conselho Fiscal.

## 15. Identidade visual: igual à do SIGA

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
- As medidas e a precisão já alcançada estão em
  `docs/02_especificacao_campos.md`.
- Consequência prática: o PDF é sempre gerado em **escala Normal (100%)**,
  nunca "ajustar à largura" ou "à altura" — essas opções mudam o tamanho da
  letra e quebram a sobreposição.

## 16. Arquivo de recuperação (.md) por comprovante

- **Todo comprovante gerado salva também um arquivo `.md`** com todos os
  dados que o originaram (referência, numeração SIGA, data, valor, extenso,
  tipo, observação, origem, destino, contas, CNPJs, etapa/status,
  signatários e, em lote, todas as linhas do lote).
- Serve para **recuperar ou refazer** um comprovante sem redigitar nada.
- O arquivo é nomeado pela **Referência** (regra 2.1), que é única — é o que
  amarra o `.md` ao PDF correspondente.
- Fica na mesma pasta do Drive do PDF gerado (ver regra 12).

## 17. Contas de origem e destino (linha opcional)

- Abaixo de Origem e Destino existe uma linha com a **conta envolvida de cada
  lado** (ex.: `Conta: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE`).
- O SIGA mostra só a PIA; a conta é um acréscimo nosso, para conferência da
  tesouraria.
- **É opcional:** quem preenche pode deixar a linha oculta.
- **Antes de gerar o PDF, avisar** se esse campo estiver vazio ou oculto —
  aviso, nunca bloqueio.
