# ESTADO DO PROJETO — ponto de retomada

**Para que serve este arquivo:** permitir que uma conversa nova retome o
projeto sem reler o histórico e **sem repetir erro já pago**. Quem ler este
arquivo, mais o `CLAUDE.md` e os `docs/` citados aqui, consegue reconstruir o
sistema inteiro do zero e continuar de onde parou.

**Atualizado em:** 21/09/2026
**Etapas 1, 2, 3 prontas e aprovadas. Etapa 5 começada (o PDF já sai por
código). Etapa 4 (o formulário) entregue e em teste pelo Taynã — falta nela
a seção de Cadastros e o desligamento do `AUTOMATISMOS_NA_PLANILHA`.**

---

## 1. Em uma frase

Gerador do **Comprovante de Movimentação Interna (CMI)** da tesouraria da
Piedade (ADM Coxim-MS, CCB), feito como **planilha Google + Apps Script**, com
aparência igual à do comprovante que o próprio SIGA emite.

Quem usa: **Taynã** (responsável, **não é programador**) e outros diáconos, no
computador e no celular. Como conduzir está no `CLAUDE.md` e é para levar a
sério: **uma etapa de cada vez**, dizendo onde clicar, avisando antes de cada
tela de autorização do Google, e **terminando toda mensagem com a
recomendação de modelo e esforço** para a etapa seguinte.

---

## 2. O que já existe

| Etapa | Arquivo | Situação |
|---|---|---|
| 1 — Layout da aba Comprovante | `apps_script/01_Layout_Comprovante.gs` | **aprovada** |
| 2 — Aba Cadastros + importação | `apps_script/02_Cadastros.gs` | **aprovada** |
| 3 — Fórmulas, validações, extenso | `apps_script/03_Formulas_Validacoes.gs` | **aprovada** |
| 5 — Geração do PDF | `apps_script/05_Gerar_PDF.gs` | **parcial e aprovada**: um PDF, com os ajustes fixos no código. Falta o multi-etapa |
| 4 — Formulário (`HtmlService`) | `apps_script/04_Formulario.gs` + `04_Formulario_Tela.html` | **entregue, em teste**. Falta a seção de Cadastros e desligar `AUTOMATISMOS_NA_PLANILHA` |
| 6 — Histórico e relatório mensal | — | a construir |

**Dois arquivos na Etapa 4, e os nomes não podem ser iguais:** o editor do
Apps Script recusa dois arquivos com o mesmo nome mesmo quando um é Script e
o outro é HTML ("Já existe um arquivo com este nome"). Daí `04_Formulario` e
`04_Formulario_Tela`. O nome da tela está escrito em `abrirFormularioCmi()`.

**A tela é um arquivo `.html` de verdade, não texto montado dentro do `.gs`.**
As janelas das etapas 2 e 5 montam o HTML juntando strings; esta não. A
armadilha do JavaScript gerado (janela abre, botões mortos, nenhum erro) deixa
de existir quando nada é gerado.

Os `.gs` convivem **no mesmo projeto do Apps Script**, dentro da planilha
(**Extensões → Apps Script**). O menu está no arquivo 01 e chama funções dos
outros. Não existe arquivo `04_`: esse número é do formulário, ainda por fazer.

### O menu "Tesouraria CMI" hoje

Gerar PDF do comprovante · Conferir o layout antes de gerar · Recriar layout
do Comprovante · Ver como lançamento único · Ver como lançamento em lote ·
Criar/recriar a aba Cadastros · Conferir cadastros · Cadastrar abreviatura de
banco · Importar dados para os Cadastros · Aplicar listas suspensas no
Comprovante · Sugerir próxima referência · Recalcular o comprovante · Proteger
os campos calculados · Testar o valor por extenso.

### As abas

- **Comprovante** — só o layout de impressão, desenhado por código. **Ninguém
  digita nela**; o caminho normal é o formulário.
- **Cadastros** — a fonte viva das listas, em **11 blocos lado a lado**
  (CONTAS, CARTOES, DIACONOS, FORMAS, RELACOES, FINALIDADES,
  REGRAS_FINALIDADE, STATUS, ADMS, BANCOS, CONTROLE), cada um virando um
  intervalo nomeado `CAD_*`. Lado a lado, e não empilhados, para que
  acrescentar uma linha numa lista nunca desloque outra.
- **Histórico** — ainda não existe; vem na Etapa 6.

---

## 3. As regras de negócio que mandam em tudo

Detalhe completo em `docs/01_regras_negocio.md`. O que não pode ser esquecido:

1. **Uma movimentação gera 2 ou 3 documentos**, nunca um. Mesma PIA → 2
   (`APROVADA` → `EFETIVADA`); PIAs diferentes → 3 (`APROVADA` → `PAGA` →
   `RECEBIDA`). A decisão é automática, comparando o prefixo da PIA de origem
   com o do destino.
2. **A mesma comparação decide o título:** mesma PIA →
   `COMPROVANTE DE MOVIMENTAÇÃO INTERNA`; PIAs diferentes →
   `COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS`.
3. **É a ORIGEM que dita o cabeçalho** — é ela quem aprova e quem paga. Mudar
   o destino nunca muda o cabeçalho. A única exceção é o PDF de
   **Recebimento**, produzido pela outra ADM: `atualizarCabecalho_(sh, 'destino')`.
4. **A conta é o dado de entrada, a PIA é consequência.** Trocar a conta de um
   lado refaz a PIA, o CNPJ, o título e o cabeçalho **só daquele lado** —
   mexer na origem nunca pode mexer no destino. Nunca tratar a PIA como campo
   digitado, e nunca escrever no campo da PIA um palpite que não seja uma PIA.
5. **PIAs diferentes = transferência entre departamentos**, e ADMs diferentes
   = entre administrações — os dois deduzidos das contas, nunca escolhidos. A
   natureza do par (entre bancos, entre caixas, entre caixa e banco, entre
   cartões…) é escrita na frente da **Observação**, em todo comprovante. O
   alcance de cada finalidade vem das colunas `Tipo` e `Subtipo` do bloco
   ONDE CADA FINALIDADE VALE; a coluna "Entre PIAs diferentes" saiu junto com
   o bloco TIPOS.
6. **Agrupamento (lote):** só agrupa mesma etapa + mesmo mês + mesma
   origem/destino (ou mesma conta ACG, no caso de cartões) + mesmo tipo. O
   valor vira a **soma** e o rótulo vira **"Valor Total:"**. Em lançamento
   único **a tabela some inteira** — rótulos, linhas, TOTAL e as bordas do
   campo do total.
7. **Dois campos de identificação, com regras opostas:** *Referência*
   (`CMP-26/NNN`, própria, obrigatória, **única**, sequencial por ano) e
   *numeração SIGA* (opcional, **pode repetir**, some do documento se vazia).
   **A Referência nunca é sugestão e nunca se digita:** o sistema gera, e é
   aquela. Ela é **consumida quando o PDF sai**, não quando o formulário abre
   — e uma vez só por movimentação, embora a movimentação gere 2 ou 3 PDFs
   com o mesmo número. A sequência **recomeça no 1 a cada ano civil**
   (`virarOAnoSePreciso_`). O Histórico (Etapa 6) tem de guardar a Referência
   de **todos** os comprovantes gerados.
   Duas exceções, e só duas, ambas registradas com motivo por escrito:
   **segunda via** de um comprovante já emitido (sai com a MESMA Referência e
   **não consome número**) e **histórico perdido ou fora de alcance** (número
   escrito à mão; se for maior que o último, a contagem se acerta por ele).
   `consumirReferencia_` só anda para a frente, de propósito — é o que
   permite as duas exceções sem estragar a sequência de quem vem depois. O
   que impede a exceção de virar hábito não é trava: é o preço (abrir o
   painel, escolher o motivo, escrevê-lo) contra um caminho normal em que
   não se digita nada.
8. **Todo dado preenchido sai em CAIXA ALTA**; rótulos, não. Exceção: nome e
   cargo dos signatários.
9. **Avisar, nunca bloquear.** Vale para validações, listas suspensas,
   importação, proteção de células e conferência antes do PDF. A tesouraria
   tem exceção para quase tudo, e bloquear faz o usuário contornar o sistema
   por fora — pior que o erro.
10. **Cada comprovante gerado salva um `.md` ao lado do PDF**, nomeado pela
    Referência, com tudo que o originou. *(Ainda por fazer, na Etapa 5.)*

---

## 4. A régua de conversão Sheets → PDF (medida, não estimada)

**Este é o capital técnico do projeto.** Ignorar qualquer uma destas regras já
quebrou o layout na prática.

1. **1 pixel** de linha/coluna = **0,75 pt** no PDF.
2. A **fonte sai no tamanho pedido**, mas o Apps Script só aceita **inteiro e
   arredonda para cima**: pedir 7,18 vira 8. *Nunca* usar tamanho fracionado —
   foi o que estourou o documento para 4 páginas.
3. Topo do texto (alinhamento "meio") =
   `topo_da_linha + (altura − 1,25 × fonte) / 2 − 0,37 pt`.
4. Recuo do texto na célula: **3,5 px (2,625 pt)** de cada lado.
5. **Altura mínima de linha = `fonte × 1,667 + 4,7` px** (6 pt = 15 px ·
   7 pt = 16 · 8 pt = 18 · 12 pt = 25). Linha mais baixa que isso o Sheets
   **estica sozinho na exportação** — foi assim que 8 linhas cresceram 17 px e
   jogaram o documento para a segunda página. `alturaDaLinha_()` aplica o mínimo.
6. **Altura útil da folha = 1045 px.** Acima de ~1048 px quebra em duas páginas.
7. **Largura útil da folha = 694 px.** Passar disso não quebra para baixo:
   **vaza de lado**, e o PDF sai em duas folhas do mesmo jeito. Ao alargar uma
   coluna, estreite outra na mesma medida — `criarLayoutComprovante` recusa
   rodar se a soma não fechar.
8. **Exportar por código e imprimir pelo navegador não dão o mesmo PDF.**
   Medidos lado a lado: as réguas caem dentro de 1,2 pt e a largura difere
   0,4%, mas **a letra sai a 0,975 do tamanho pedido** na exportação por
   código (6 vira 5,85; 12 vira 11,7). Não dá para compensar — o Apps Script
   só aceita fonte inteira, e 6 ÷ 0,975 = 6,15 viraria 7. **O Taynã aceitou**
   essa diferença em troca de o documento nunca mais desformatar sozinho.
   *(Esse 0,975 já tinha aparecido na Etapa 1 e foi descartado como erro de
   medição. Não era.)*

Bordas existem só em **0,75 / 1,5 / 2,25 pt**. O documento usa **2,25 nas duas
réguas do título** (o SIGA usa 2,0; 2,25 é a mais próxima) e **0,75 no resto**.

**Impressão: não se ajusta em Arquivo → Imprimir.** Esses ajustes não ficam
guardados na planilha — ficam no navegador de cada pessoa, e o Google os
redefine sozinho. Nenhum comando do Apps Script os trava. O PDF sai por
**Tesouraria CMI → Gerar PDF do comprovante**, que escreve cada ajuste no
pedido feito ao Google (`EXPORTACAO_PDF`, em `05_Gerar_PDF.gs`): A4, retrato,
Normal (100%), margens 0,97/0,97/1,02/0,89 cm, Centro/Acima, sem linhas de
grade e **sem as anotações das células**. Detalhe em `docs/07_gerar_pdf.md`.

---

## 5. O layout hoje

Mapa completo, célula por célula, em `docs/02_especificacao_campos.md`.
**Não decore referência de célula**: o layout é gerado por código, as linhas
têm nome (`lin_('IDENT_2')`) e o mapa vive naquele documento.

- **22 colunas (A..V), 694 px.** A antiga coluna C (58 px) foi dividida em
  quatro (C+D+E+F = 15+14+15+14) para o campo **Conta** caber.
- **Os dois blocos não são simétricos, de propósito:** à esquerda os rótulos
  terminam colados no valor (C e D) e a conta vai até M; à direita o rótulo vai
  até M e o valor até V (esse lado já tinha espaço).
- **As larguras de M (87) e P (38) andam juntas:** P precisou de 38 px para
  `R$ 999.999,99` caber, e M cedeu os 4 px para a soma continuar em 694.
- **O extenso ocupa duas linhas mescladas** (`IDENT_2` + `IDENT_2B`, `R:V`),
  com quebra de texto e **alinhado ao topo**: em uma linha só, `99.999,99`
  saía cortado.
- **A tabela do lote cabe 32 lançamentos** (eram 33 antes da 2ª linha do extenso).
- `PREENCHIMENTO` é uma linha de sobra recalculada a cada mudança
  (`1045 − linhas visíveis`), **entre a tabela e as assinaturas** — é ela que
  mantém assinaturas e rodapé colados no pé da folha.
- **Campos calculados protegidos por aviso:** extenso, título, os dois CNPJs e
  o total do lote.

---

## 6. Armadilhas já pagas — não repetir

| Armadilha | O que acontece | Como se resolve |
|---|---|---|
| Tamanho de fonte fracionado | o Apps Script arredonda para cima; tudo cresce ~14% e o PDF vira 4 páginas | só tamanho inteiro |
| Linha mais baixa que o mínimo da fonte | o Sheets estica na exportação, em silêncio, e quebra a página | `alturaDaLinha_()` |
| Somar mais de 694 px de largura | o PDF **vaza de lado** e sai em duas folhas — nada a ver com a altura | ao alargar uma coluna, estreitar outra na mesma medida |
| `alert()` / `confirm()` dentro de `HtmlService` | o Google **bloqueia**; a janela abre e nada acontece | falar só com elementos da própria página |
| Erro de sintaxe no JS **gerado** da janela | a janela abre, **nenhum botão funciona e nenhum erro aparece** | gerar o HTML e rodar `node --check` no que foi gerado |
| `\n` cru dentro de string JS no HTML gerado | quebra o `<script>` inteiro (causa real do caso acima) | escapar `\\n` |
| Mostrar um endereço dentro de `ui.alert` | sai como texto morto: dá para ler, não dá para clicar | janela de página com `<a target="_blank">`; JavaScript só para fechar |
| Exportar o PDF com as anotações ligadas | `printnotes` vem ligado: sai um `[1]` ao lado do extenso e uma **segunda folha** só com o texto da anotação | `printnotes=false` |
| Ajustar a impressão em Arquivo → Imprimir | os ajustes não ficam na planilha; o Google os redefine e o PDF desformata **em silêncio** | gerar o PDF por código |
| Importar para a lista errada | passava em silêncio | conferência em duas camadas (regras fixas por lista + perfil dominante das colunas) e confirmação antes de gravar |
| Centavos em ponto flutuante | `1,005` vira `100,49999…` e arredonda para baixo | contar em **centavos inteiros** com `+1e-6` |
| Mesclar a faixa errada | o cabeçalho saiu 20 pt fora do centro | conferir por sobreposição contra o PDF de referência |
| Tratar a PIA como campo digitado | a conta ia para uma ADM e o CNPJ/cabeçalho ficavam na outra | a conta manda: PIA, CNPJ, título e cabeçalho vêm dela |
| Escrever no campo da PIA um palpite tirado do texto da conta | uma conta fora da lista virava a "PIA" `101.17 - ACG - AG`, nenhuma ADM casava e **o cabeçalho congelava** | só escrever se começar com "PIA"; senão, avisar e não escrever nada |
| Refazer os dois lados a cada edição | trocar a conta de origem mudava o destino sozinho | agir só no lado editado (`ladoEditado_`) |
| Dados de exemplo fora do formato do cadastro | a busca falhava, o palpite entrava e a cadeia toda quebrava | o exemplo tem de ser um texto que **existe** na lista |
| Dados provisórios ficando na lista de escolha | as sub-tesourarias de cartão de Costa Rica apareciam como conta de origem/destino | sub-tesouraria de cartão não é conta; vive no cadastro de cartões |
| `onEdit` com `try/catch` mudo | um defeito some sem deixar rastro | existe o **Recalcular o comprovante**, que faz o mesmo **sem engolir erro** |
| Mock que devolve o objeto errado | tudo "parece quebrado" e o erro real fica escondido | conferir o simulador antes de acusar o código |

---

## 7. Decisões fechadas — não reabrir

- **Nada de AppSheet, nem app Android nativo.** Já avaliado e descartado.
- **Nada de montar o PDF por HTML.** O Taynã já disse que está bom assim.
- **Nada de "Fase 2" de Web App para celular.** O formulário já resolve o
  celular. Um link público fora do Sheets só se ele pedir, como projeto à parte.
- **Ninguém digita na aba Comprovante.** O preenchimento é pelo formulário. A
  lista suspensa na célula é só segunda camada de segurança.
- **A planilha não deve ter regra própria depois que o formulário existir.**
  Decisão do Taynã: como é sempre o formulário que preenche, regra na aba só
  gera mudança silenciosa. A constante `AUTOMATISMOS_NA_PLANILHA` em
  `03_Formulas_Validacoes.gs` desliga tudo de uma vez; as funções continuam
  lá, para o formulário chamar. **Ligar essa chave em false faz parte da
  entrega da Etapa 4.**
- **Não reaproveitar o `ci_generator.py`** do projeto das CIs.
- **Referência usa o prefixo `CMP`**, e ele é um dado da aba Cadastros
  (`PREFIXO_REFERENCIA`), não do código.
- **Abreviatura de banco: até 6 letras**, sugerida pelo sistema e
  **confirmada pelo usuário** — nunca decidida sozinha.
- **Extenso escreve "UM MIL"**, pela praxe do documento de valor (o extenso
  existe para travar o número; começar em "MIL" deixa espaço em branco antes
  de si). Constante `DIZER_UM_ANTES_DE_MIL`.
- **A letra sai 2,5% menor** na exportação por código, e isso foi aceito.

---

## 8. Como conferir o trabalho sem depender do Taynã testar

Este caminho pegou quase todos os defeitos antes de ele ver. Os arquivos são
de rascunho e ficam fora do repositório — vale recriá-los:

1. **`mock2.js`** — simulador do `SpreadsheetApp` em Node: roda o
   `01_Layout_Comprovante.gs` de verdade e grava o layout resultante em JSON
   (larguras, alturas, mesclagens, bordas, valores). **Ele estoura erro em
   mesclagem sobreposta e em coluna fora da grade** — é metade do valor.
2. **`render.py`** (pymupdf + a fonte Tahoma) — desenha esse JSON aplicando a
   régua da seção 4. Sai um PDF quase igual ao que o Sheets exporta.
3. **Sobreposição** contra `docs/referencia_layout_aprovado.pdf`, comparando a
   posição das réguas horizontais. Na última conferência, as do título e as do
   rodapé caíram na mesma posição, e só os dois separadores do bloco
   origem/destino desceram 12 pt — exatamente a segunda linha do extenso.
4. **`mock_etapa3.js`** — simulador das três abas com os `.gs` juntos, para
   testar extenso, soma do lote, PIA/CNPJ/cabeçalho pela conta, título e
   avisos. Usa um `onEdit` **que mostra o erro**, porque o de produção engole
   de propósito.
5. **`mock_janela.js`** — gera o HTML de uma janela `HtmlService` e confere:
   aspas equilibradas, tags balanceadas, todo `onclick` e todo `<script>`
   compilando (`new Function`), e **nenhum `alert`/`confirm`**.
6. **`node --check`** em cada `.gs` (copiando para `.js` antes).
7. **Medir o PDF de verdade** que o Taynã devolve: `pymupdf` dá a posição de
   cada régua e o tamanho de cada fonte. Foi assim que apareceram a segunda
   folha das anotações e o fator 0,975.

---

## 9. A Etapa 4 — o formulário

É o **coração da arquitetura**: é por ele que tudo passa a ser preenchido. Um
modal/sidebar em `HtmlService`, aberto pelo menu.

Precisa ter:

- **Filtro-ao-digitar em todo combo** (tipo, origem, destino, conta, diácono,
  cartão). É o motivo de o formulário existir: o Sheets **não filtra lista
  suspensa enquanto se digita** dentro da célula.
- **Filtro em cascata:** escolhida a PIA de um lado, a lista de **contas**
  daquele lado mostra só as daquela PIA. Escolhidas as duas PIAs, a lista de
  **tipos** mostra só os que a coluna "Entre PIAs diferentes" permite.
- **Nunca mudar um lado por causa do outro.** A única exceção admitida pelo
  Taynã seria uma conta cujas movimentações fossem exclusivamente com uma
  segunda conta, e só com ela — não existe nenhuma assim hoje, então **não
  construir isso agora**.
- **Lançamento único e lote** na mesma tela, uma linha por lançamento e soma
  automática.
- **Sugestão da próxima Referência**, sem consumir o número (quem consome é a
  geração do PDF).
- **Uma pergunta única antes de gerar:** "os signatários serão os mesmos em
  todas as etapas?" Se sim, o mesmo conjunto em todos os PDFs; se não, pede
  etapa por etapa.
- **Seção de Cadastros** dentro do próprio formulário, para quem não vai abrir
  a planilha.
- **Funcionar bem no celular** (campos de formulário normais, nada de tocar em
  célula mesclada).
- **Zero `alert()` / `confirm()`** — ver a tabela de armadilhas.
- Ao final, **desligar `AUTOMATISMOS_NA_PLANILHA`**.

### O que já está de pé no formulário

- Combos com filtro-ao-digitar, em cascata, e **um lado nunca mexe no outro**.
- Lançamento único e lote na mesma tela, com soma automática.
- **Referência gerada pelo sistema e travada**, com painel de exceções
  (2ª via, histórico indisponível, correção de lançamento).
- **Reabre no último preenchimento**, com botão Limpar no topo.
- Assinantes sem repetição: escolhido um, ele some dos outros campos.
- **A árvore de tipos** — ver a seção 9b.

Ainda falta: a seção de Cadastros dentro do formulário (o *ambiente de contas
e regras*, item 3 do `09_pendencias_e_decisoes.md`), o campo de cartão no
lançamento único e desligar `AUTOMATISMOS_NA_PLANILHA`.

---

## 9b. A árvore de tipos e as regras entre contas

**Tipo e subtipo não se escolhem: deduzem-se das duas contas** — a mesma
comparação que decide se saem 2 ou 3 documentos e qual título o comprovante
leva. Sobra escolher a **forma** (SAQUE — com as subformas DINHEIRO e CHEQUE —,
TRANSF. BANCÁRIA, TED e PIX), e mesmo ela costuma sobrar em uma ou duas.
O **DOC saiu**: foi extinto pelo Banco Central.

| As duas contas | Tipo deduzido |
|---|---|
| mesma PIA | MOVIMENTAÇÃO INTERNA DE NUMERÁRIOS |
| PIAs diferentes, mesma ADM | TRANSFERÊNCIA — entre departamentos |
| ADMs diferentes | TRANSFERÊNCIA — entre administrações |

As regras entre contas falam de **naturezas** (CAIXA · BANCO · ACG · CARTAO),
não de contas específicas, e vivem no bloco REGRAS ENTRE CONTAS da aba
Cadastros. **Um par sem regra é livre:** as linhas são restrições, não
permissões.

**DUAS COISAS DIFERENTES CORTAM UMA FORMA, e confundi-las custou tempo.** O
bloco REGRAS ENTRE CONTAS guarda o que **esta tesouraria decidiu** sobre um par
("não há agência do Santander na cidade" — regra LOCAL, que outra ADM não tem).
O bloco FORMAS guarda o que a forma **é**, em duas colunas:

| Coluna de FORMAS | O que quer dizer |
|---|---|
| `Exige conta de` | pelo menos um dos dois lados tem de ser conta daquela natureza. `CAIXA` em DINHEIRO e CHEQUE: dinheiro que não passa por um caixa não é dinheiro, é transferência. |
| `Instituições` | `MESMA` (transferência bancária é, por definição, dentro de uma instituição) ou `DIFERENTES` (TED e PIX existem para atravessar bancos). |

A segunda coluna precisou de um dado novo: a **Instituição** de cada conta
(`BB`, `SANT`, `ACG`), no fim do bloco CONTAS. Os **cartões levam `ACG`** — o
cartão pré-pago é emitido pela ACG/PagCorp e vive dentro dela, e é por isso que
carregar cartão é transferência bancária e não PIX. **Caixa não tem
instituição**, e aí a comparação simplesmente não acontece: concluir "o vazio é
diferente de BB, então pode TED" seria inventar resposta a partir de um dado
que não existe.

Três pares ficam **impossíveis**, e nenhum deles foi escrito como proibição —
todos caem do cruzamento das regras que o Taynã deu. Vale conferir antes de
"consertar" algum deles:

- **caixa ↔ ACG** — o caixa só movimenta por saque, e a ACG não saca;
- **caixa ↔ SANT** — o caixa só movimenta por saque, e nenhuma conta Santander
  saca (regra local, sem agência na cidade);
- **cartão ↔ banco de fora** — o cartão só faz transferência bancária, que
  exige a mesma instituição. Quem precisa disso devolve para a conta ACG e de
  lá manda.

### A finalidade — a quinta pergunta

Onde a movimentação acontece sai das contas; como o dinheiro anda sai da forma;
que espécie de movimentação é sai do subtipo. **O propósito só quem lança
sabe** — e é a única das cinco perguntas que o sistema não deduz.

Dois blocos novos nos Cadastros: **FINALIDADES** (26 linhas, com o que é, as
frentes, o histórico do SIGA, a fonte e os cuidados) e **ONDE CADA FINALIDADE
VALE** (39 linhas). Os dados vieram de um levantamento nos manuais da obra,
feito no projeto das CIs — ver `docs/10_prompt_finalidades.md`, que também
conta por que a primeira tentativa voltou errada.

Na tela, o campo **Finalidade** estreita sozinho conforme os campos de cima:
26 sem contas escolhidas, 19 com as contas, 9 com SAQUE em dinheiro, 4 com
SAQUE em cheque. As três caixinhas (Piedade / Viagens / Música) filtram por
frente, e **nenhuma marcada mostra todas** — lista vazia por filtro esquecido
seria pior do que a lista inteira.

Três decisões, para não reabrir:

1. **A comparação é pelas quatro colunas de texto**, não pela coluna Folha. A
   folha é o código do levantamento e serve para rastrear a linha até a fonte.
2. **Vazio não corta, dos dois lados** — na regra quer dizer "serve para
   qualquer um"; no estado quer dizer "ainda não escolheram".
3. **Os históricos do SIGA ficam na tela**, nunca no papel. O comprovante não é
   o lançamento; quem está com o formulário aberto é quem vai lançar.

### Renomear uma linha do cadastro deixa referências para trás

"TRANSF. TED" virou `TED` (o T de TED já é *transferência*). Renomear é trocar
a chave da linha: a antiga entra em `aposentadas`, a nova vem do projeto — mas
**as citações a ela em outras listas ficam como estavam**, porque recriar não
troca valor de célula que já tem dono. A Remessa continuou pedindo
"TRANSF. TED" na coluna *Formas que combinam*, e um nome que nunca casa não dá
erro: a finalidade só some da tela quando TED é escolhido.

Como não dá para consertar sozinho, passou a dar para ver: o menu **Conferir
cadastros** lista as formas citadas que não existem, dizendo qual nome e em que
linha (`referenciasSoltas_`). Vale para *Formas que combinam* e para as duas
colunas de forma das REGRAS ENTRE CONTAS — onde um nome errado faria uma
**proibição** deixar de valer, que é pior.

### A Observação leva o tipo de contas envolvidas

**Cinco subtipos saíram por descreverem as contas em vez do propósito**: as
três "Transferência entre departamentos - ..." e, uma rodada depois,
"Transferencia entre bancos CONTA MOVIMENTO" e "Transferencia interna entre
Caixa e Banco". Com a Observação dizendo o par sozinha, mantê-los fazia o
campo Tipo repetir, duas linhas acima, o que a Observação já dizia. Sobraram
sete, e todos respondem "que espécie de movimentação é" — não "que contas".

**A FINALIDADE DE VERDADE ainda não existe.** O campo que a tela chamava de
Finalidade passou a se chamar **Subtipo**, porque é o que ele sempre foi. A
pergunta "para quê" — pagamento de energia, ajuda a ministro, custeio de
viagem — vai nascer do levantamento de `docs/10_prompt_finalidades.md`, feito
no projeto das CIs, onde estão os manuais. Depois dele: um bloco `FINALIDADES`
em níveis, um bloco `REGRAS DE FINALIDADE` no mesmo desenho das regras entre
contas, e um campo encadeado no formulário.

A lista de finalidades tinha três linhas — "Transferencia entre departamentos -
entre bancos / entre caixas / entre caixa e banco" — que **repetiam o que a
árvore já deduz**. Elas saíram (o Taynã confirmou que não servem), mas a
informação ficou: agora o sistema escreve `ENTRE CAIXA E BANCO.` na frente da
Observação do documento, e o que a pessoa digitou vem depois.

A troca vale a pena por um motivo só: **deduzida, a frase está em todos os
comprovantes; escolhida, estava só nos que alguém lembrasse de marcar.**

Três decisões de desenho, para não reabrir:

1. **A frase descreve o par, não o sentido.** Ordem fixa — caixa, banco,
   cartão. Do contrário o mesmo movimento sairia descrito de dois jeitos
   conforme quem paga e quem recebe. A finalidade antiga já dizia isso na
   observação dela: "caixa de um departamento para o banco de outro (ou o
   contrário)".
2. **A ACG entra como BANCO.** Grupo `101 - BANCOS CONTA MOVIMENTO`, igual ao
   BB e ao Santander — e é assim que o próprio Taynã a trata ao dizer que
   remessa para outra ADM é "entre bancos". A natureza ACG existe para as
   REGRAS (a fintech não saca, não compensa cheque).
3. ~~A célula da Observação é CLIP.~~ **Resolvido:** ela passou a ocupar
   duas linhas (`px: 32`) e a ajustar o texto. Os 16 px saíram de
   `PREENCHIMENTO`, a sobra da folha — a página continua uma só, e a bateria
   exige a altura exata para provar. O texto abaixo fica como registro do
   raciocínio:

   **A célula da Observação era CLIP, não WRAP** (`campo_`, em
   `01_Layout_Comprovante.gs`): texto que passa da largura some no PDF em
   silêncio. São 601 px em corpo 6 — largo, mas a frase come uns 20
   caracteres. Se um dia isso incomodar, o caminho é medir e avisar na tela,
   nunca ligar o WRAP (a linha tem 16 px e a folha tem de caber em uma só).

Três coisas para não reabrir:

1. **Esta é a única trava do projeto** — todo o resto avisa e não bloqueia.
   Ela só se sustenta porque tem porta: a chave `RESTRICOES_ATIVAS` no bloco
   CONTROLE. O próprio aviso que trava diz o nome da chave e onde ela fica.
2. **A trava mora no servidor** (`conferirRegraEntreContas_`), não na tela. A
   tela desabilita os botões antes, mas aquilo é a cara amável da regra.
3. **A regra existe em UM arquivo só: `06_Tipos_E_Regras.gs`.** A tela
   precisa dela para responder na hora da tecla, e a recebe por **injeção**:
   na hora de abrir a janela, o servidor lê o código-fonte das funções
   `nucleo*` (com `Function.prototype.toString()`) e o cola dentro do HTML, na
   marca `<<< O NÚCLEO DAS REGRAS ENTRA AQUI >>>`. Para mudar uma regra, mexa
   **só ali** — a janela pega a versão nova na próxima abertura.

   Quem mexer no núcleo respeita três limites, porque aquele texto vai rodar
   dentro do navegador: nada de `SpreadsheetApp` ou de qualquer coisa só do
   servidor; nada de chamar função de fora do núcleo (o que precisar, recebe
   por parâmetro); e ES5 — nada de `=>`, `let` ou `const`.

   A marca é **ASCII puro** e os dois arquivos declaram versão
   (`VERSAO_DA_TELA` / `VERSAO_DO_NUCLEO`, iguais de propósito): o menu
   **Conferir versões dos arquivos** e a mensagem de erro dizem qual está
   atrasado. A primeira marca trazia "NÚCLEO" com acento — casar dois
   arquivos por texto acentuado é falha esperando acontecer, e sem pista
   nenhuma de onde veio.

   **O `getContent()` do Apps Script devolve o arquivo SEM os comentários.**
   Medido: 80 KB de arquivo viram 63 KB lidos, com **zero** comentários. Por
   isso as marcas são **comandos** (`var NUCLEO_DAS_REGRAS = 1;`,
   `var FIM_DA_TELA = 1;`) e não comentários — enquanto foram comentários,
   nunca chegaram ao servidor, e o sistema acusou colagem pela metade num
   arquivo inteiro, duas vezes. `montar_tela.js` apaga os comentários antes de
   montar, para a bateria testar a tela que o Google entrega de verdade.

   **A colagem pela metade tem detecção própria.** A marca `/* FIM_DA_TELA */`
   fecha o `<script>` da tela, e o servidor confere se ela chegou. Foi uma
   falha real: a página do GitHub carrega o código aos poucos, `Ctrl+A` copiou
   metade do arquivo, e como o número da versão fica no alto, ele chegou junto
   — o erro acusou "versão errada" e mandou consertar o que não estava
   quebrado. Por isso a ordem das conferências é: **primeiro se o arquivo
   está inteiro, depois a versão.** E a marca do núcleo foi para o alto do
   arquivo (declaração de função vale no bloco inteiro), para "marca não
   encontrada" significar "arquivo errado" e nada mais.

   **Quem testa a tela testa a tela MONTADA.** `ferramentas_de_conferencia/montar_tela.js`
   faz fora do Google o mesmo que `telaComAsRegras_` faz dentro. É a armadilha
   conhecida: HTML gerado com erro de sintaxe abre normalmente e não responde
   a botão nenhum, sem mensagem.

4. **A praxe dos cartões é nota, não regra.** "Zerar Conta", "Transferência
   Débito" e "Carregamento de cartão" acontecem tanto dentro da mesma PIA
   quanto entre PIAs da mesma ADM. A tesouraria de Coxim adotou fazer sempre
   pelo caminho interno — mas é **preferência dela, não determinação da
   obra**, e outra ADM pode fazer diferente. Por isso não virou linha em
   REGRAS ENTRE CONTAS (aquilo bloqueia): virou `nucleoPraxeDoCartao`, que
   aparece, explica e deixa seguir, e some com a chave
   `PRAXE_CARTAO_NA_MESMA_PIA` em NÃO.

---

Depois dela: **o resto da Etapa 5** (os 2 ou 3 PDFs com o Status de cada um, o
cabeçalho da ADM de destino no Recebimento, o consumo da Referência, a pasta
do Drive e o `.md` de recuperação) e a **Etapa 6** (aba Histórico e relatório
mensal).

---

## 10. Pendências de dados

- **Inscrição estadual da ADM Costa Rica** foi cadastrada como `ISENTO`, igual
  à de Coxim, porque o cartão CNPJ não traz IE. **Confirmar** antes de emitir
  o primeiro comprovante com esse cabeçalho.
- **Código reduzido do SIGA** da conta da PIA-COSTA (ACG 128175700) e da
  PIA-ALCINÓPOLIS ainda não foi informado.
- Vários cartões estão marcados como **"verificar/incluir no SIGA"** no
  `cadastros/cartoes.csv`.

---

## 11. Modelo e esforço sugeridos

| Etapa | Modelo | Esforço |
|---|---|---|
| 4 — Formulário | Opus | **Alto** |
| 5 — resto dos PDFs multi-etapa | Opus | **Alto** |
| 6 — Histórico e relatório | Opus | Médio |
| Ajuste pontual / conferência | Opus | Médio |

---

## 12. Onde está cada coisa

| Arquivo | Conteúdo |
|---|---|
| `CLAUDE.md` | como conduzir o projeto e falar com o Taynã; regras de ouro |
| `docs/00_estado_do_projeto.md` | **este arquivo** |
| `docs/01_regras_negocio.md` | as regras validadas com ele |
| `docs/02_especificacao_campos.md` | grade, mapa de células, impressão |
| `docs/03_conciliacao_cartoes.md` | cartões pré-pagos |
| `docs/04_aba_cadastros.md` | estrutura dos 10 blocos |
| `docs/05_importar_dados.md` | como importar + **o prompt pronto** para preparar dados noutro chat |
| `docs/06_formulas_validacoes.md` | extenso, avisos, listas, campos protegidos |
| `docs/07_gerar_pdf.md` | por que não se usa Arquivo → Imprimir, e como o PDF sai |
| `docs/08_cenarios_de_teste.md` | **10 cenários de teste do formulário**, com os números conferidos contra o cadastro; cada conferência que falha aponta uma peça só |
| `apps_script/06_Tipos_E_Regras.gs` | a árvore de tipos e as regras entre contas — **a única trava do projeto** |
| `docs/09_pendencias_e_decisoes.md` | o que o Taynã levantou: o que já foi construído (desempenho, correção de lançamento, árvore de tipos) e o que falta — o ambiente de relações entre contas |
| `docs/10_desempenho.md` | **por que demora e todos os caminhos para o instantâneo**, do ajuste pequeno à troca de plataforma |
| `ferramentas_de_conferencia/` | simulador do Sheets e as baterias de teste da seção 8, prontas para rodar (`node ferramentas_de_conferencia/testar_etapa4.js .`) |
| `docs/referencia_siga_comprovante.pdf` | o comprovante emitido pelo SIGA |
| `docs/referencia_layout_aprovado.pdf` | **a referência visual do projeto** |
| `cadastros/*.csv` | contas, cartões, diáconos, tipos, status, ADMs, abreviaturas |
| `PROMPT_ETAPA_4.md` | o texto para abrir o chat da próxima etapa |

**Manter em dia:** sempre que uma lista dos Cadastros ganhar ou perder coluna,
atualizar o prompt de `docs/05_importar_dados.md` e a contagem em
`docs/04_aba_cadastros.md`.
