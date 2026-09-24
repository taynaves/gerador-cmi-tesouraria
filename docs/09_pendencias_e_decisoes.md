# Pendências e decisões

Refeito em 23/09/2026. Dois assuntos, e só dois:

- **o que está em aberto** — e o que falta para fechar;
- **o que foi decidido e não se reabre** — com o motivo, para ninguém propor
  de novo.

**A história de como se chegou aqui não está neste arquivo**: está no
`13_checkpoint_etapa_4.md`, seções 2 e 3. Aqui ficam só as decisões e o que
falta.

---

# PARTE 1 — O QUE ESTÁ EM ABERTO

## 1. Perguntas para o Taynã responder

Nenhuma trava o sistema; todas mudam dado ou comportamento quando ele
responder.

| # | A pergunta | Onde está o detalhe |
|---|---|---|
| 1.1 | Três divergências de cartão entre a PagCorp e o SIGA (um cartão de viagem ausente, um com rótulo de Música e hierarquia de Atendimento, dois de Secretaria ausentes — um deles o do comprovante-teste real) | `04_conciliacao_cartoes.md` |
| 1.3 | No lote, "mesma etapa" foi **deduzido**, não dito por ele | `01_regras_negocio_OLD.md`, seção 14 |
| 1.4 | Quatro folhas do levantamento ficaram **sem finalidade nenhuma**: `1.1.2.1` (cheque entre ADMs), `1.1.2.2` (dinheiro entre ADMs), `1.1.3` (**transferência bancária entre ADMs**) e `1.2.2.1` (cheque entre departamentos). A terceira incomoda: é justamente ACG → ACG de administrações diferentes. F24 (*Remeter à outra administração coletas*) **parece** caber, mas mapear é decisão dele, não dedução minha | `11_prompt_finalidades.md` |
| 1.5 | F26 restringe CAIXA → CAIXA, e o manual citado é mais largo do que isso | idem |
| 1.6 | Se `APLICACAO` virar uma natureza de conta, F17 e F18 mudam | idem |

## 2. O ambiente de contas e regras dentro do formulário — Etapa 4b

É a seção de Cadastros dentro do próprio formulário, e ele quer que seja mais
do que um cadastro: **quer que seja onde as regras vivem.** Nas palavras dele:

- cadastrar **manualmente as contas de cada PIA**;
- estabelecer as **regras de relacionamento** — que tipos de transferência, de
  envio e de recebimento cada conta pode fazer;
- vir **pré-configurado** com os relacionamentos da determinação **nacional**,
  e permitir que **cada regional ajuste** os seus;
- uma **caixa de marcar** para ligar e desligar essas restrições.

A caixa de marcar **já existe** (`RESTRICOES_ATIVAS`), e o comportamento das
duas posições está decidido:

| Ligadas | Desligadas |
|---|---|
| As listas se filtram sozinhas conforme ele preenche | As listas mostram tudo |
| **Não deixa gerar** enquanto não estiver tudo verde | Deixa gerar o que não é permitido |
| O caminho do dia a dia | O caminho do **ajuste financeiro ou contábil** |

**"Não deixa gerar" não contraria a regra de ouro do projeto** ("avisar, nunca
bloquear"): a regra existe porque bloquear faz a pessoa contornar o sistema
**por fora** — e aqui a saída está **dentro**, é a própria caixa. O bloqueio é
escolhido por quem usa, e desfeito por quem usa.

**O que falta** é a tela de edição desses cadastros dentro do formulário.

## 3. O preenchimento automático que ele pediu — e o conflito

Nas palavras dele:

> "se eu escolher movimentação interna (de numerários), se a origem for
> PIA-COXIM, o destino já vai ser preenchido automaticamente como PIA-COXIM.
> E o contrário também: se eu escolher origem e destino PIA-COXIM, o subtipo
> já será automaticamente uma transferência interna."

**A segunda metade já é o que o sistema faz** — as contas decidem o tipo.

**A primeira metade bate de frente com uma regra de ouro:** *nenhum lado pode
mudar por causa do outro*. Essa regra nasceu de um defeito real, em que trocar
a conta de origem mexia no destino e o comprovante saía com a conta de uma PIA
e o CNPJ de outra, sem ninguém perceber.

**Proposta, para ele decidir** — atender a intenção sem quebrar a regra:

- escolher "movimentação interna" **filtra** a lista de contas do outro lado
  para a PIA daquele, em vez de **escolher** por ele;
- se houver **uma única** conta possível, aí sim preencher — e mostrando que
  foi o sistema que preencheu.

**Pergunta aberta. Não implementar sem a resposta dele.**

## 4. Ajustes do formulário

| # | O que falta | De onde veio |
|---|---|---|
| 4.1 | **Tipo e modo de lançamento estão redundantes**: escolher "carregamento em lote" no tipo e "vários lançamentos" no valor é dizer a mesma coisa duas vezes. Um campo deve restringir o outro, nos dois sentidos | pedido dele |
| 4.2 | **A seção de Cadastros dentro do formulário** (é a parte 2 acima) | pedido dele |
| 4.3 | **Desligar `AUTOMATISMOS_NA_PLANILHA`** quando o formulário for o único caminho | plano da Etapa 4 |
| 4.4 | **Cartão reutilizado por outra pessoa** ao longo do tempo: o cadastro guarda só o responsável atual, e um comprovante antigo recuperado sairia com o nome errado. Precisa de histórico de responsáveis | dois `.txt` do SIGA que ele enviou |
| 4.5 | **A Observação é CLIP**: uma observação longa some no fim, no PDF, **sem avisar** — e agora o sistema gasta uns 20 caracteres dela com o par de contas. Medir a largura real e avisar na tela é o caminho; ligar o WRAP não é (quebraria a folha única) | medido |
| 4.6 | **Quatro botões a mais na barra de ações** — analisado e medido, anotado como **opção para a versão beta ou a final**. Detalhe abaixo | pedido dele, 23/09 |

### 4.6 — os quatro botões, medidos antes de decidir

Ele pediu, junto de *Fechar / Preencher o comprovante / Preencher e gerar o
PDF*, mais quatro: **Baixar em Excel (.xlsx)**, **Salvar planilha do Google na
pasta**, **Abrir a pasta padrão** e **Abrir o último PDF**.

**O espaço, medido no Chromium nos tamanhos dele** (altura do rodapé):

| | hoje | os 4 no rodapé | repartidos (2 + 2) |
|---|---|---|---|
| aba a 80% (1371) | 51 px | 51 px | **51 px** |
| janela do Sheets (1097) | 51 px | 93 px | **51 px** |
| celular (390) | 161 px | 353 px | 161 px, escondendo os dois do rodapé |

**O arranjo que custa zero no computador:** as duas ações do comprovante no
**rodapé**; os dois atalhos de arquivo na **barra do topo**, que tem espaço
sobrando e **rola junto com a página** — ao contrário do rodapé, que é preso
embaixo. No celular os dois do rodapé somem: continuam na caixa de diálogo,
que é onde fazem sentido lá.

**As duas armadilhas, e são o motivo de isto estar escrito:**

1. **Um botão de Excel no rodapé copiaria o comprovante ERRADO.** A cópia sai
   da aba como ela está, e antes de "Preencher" a aba ainda tem o comprovante
   **anterior** — sairia um arquivo com cara de certo e dado de outro
   documento, sem erro nenhum. Os dois têm de **preencher antes de copiar**, e
   o nome tem de dizer isso: *"Preencher e baixar em Excel"*, *"Preencher e
   salvar no Drive"*.
2. **"Abrir" tem de ser link, com o endereço já na mão.** Endereço que só
   chega depois do clique faz o navegador bloquear a aba como propaganda. Os
   dois endereços vêm junto com os dados, na abertura.

**Custo de abertura: zero.** O endereço da pasta se monta a partir do id que
já está em `PASTA_DRIVE_PADRAO`
(`https://drive.google.com/drive/folders/<id>`), sem perguntar nada ao Drive; o
último PDF fica numa propriedade do script, gravada quando ele é gerado. Só
quem **não** configurou a pasta paga uma ida ao Drive.

**Custo de construir:** uma rodada — ~30 linhas no `04_Formulario.gs`, ~10 no
`05_Gerar_PDF.gs`, ~50 na tela, mais os testes.

**E um efeito que ele precisa saber antes:** o "último PDF" é do **script**, e
não de quem clica. Se outro diácono gerar um PDF, o botão passa a apontar para
o dele.

## 5. O que falta nas etapas seguintes

**Etapa 5:** pronta e aprovada por ele — a caixa "Quais PDFs gerar?", o
cabeçalho do Recebimento, o `.md` e o Histórico (`14_checkpoint_etapa_5.md`).

**Deixado de fora de propósito, e anotado:**

- **Reabrir pela Referência** (ler o JSON do `.md` de volta para o
  formulário). O arquivo já é gravado pensando nisso.
- **Quem gerou** cada PDF não vai para o Histórico: pedir o e-mail de quem
  clica exigiria uma autorização nova do Google. Se ele quiser, é uma coluna
  nova no fim e uma tela de autorização a avisar.
- **Corrigir no mesmo dia** gera um PDF com o mesmo nome do errado, e os dois
  ficam na pasta (o Drive aceita nomes repetidos). O Histórico diz qual é o
  mais novo.

**Etapa 6:** construída — o relatório mensal dos comprovantes gerados
(`16_relatorio_mensal.md`) e o nome novo do sistema
(`15_checkpoint_etapa_6.md`). **Falta o teste dele na planilha.** Não é mais
relatório "por conta, para bater com o extrato": virou lista, e não soma — ver
as decisões fechadas, abaixo.

**Candidatos à Etapa 7 — ele escolhe** (nenhum foi pedido ainda):

- **Reabrir pela Referência** — ler o JSON do `.md` de volta para o
  formulário, para corrigir ou fazer segunda via sem redigitar.
- **A seção de Cadastros dentro do formulário** (a Etapa 4b, parte 2 acima).
- **As regras de agrupamento do lote** — mesma etapa, mesmo mês, mesma
  origem/destino: o lote existe, mas nada confere essas condições (hoje só o
  "mesmo mês" vira aviso).
- **O preenchimento automático do outro lado** (parte 3 acima), que depende
  de uma resposta dele.
- **Apagar os dados de teste antes da beta** — comprovantes, PDFs, `.md`,
  linhas do Histórico e a numeração (ele disse que tudo até a beta é teste).
  Sem código: é um passo a passo para ele, e precisa ser dito antes, porque
  apagar a numeração faz a próxima Referência voltar a `CMP-26/001`.

**Sem etapa marcada:** mandar o PDF para uma pasta escolhida pelo destinatário
de outra ADM, em vez da pasta padrão (`01_regras_negocio_OLD.md`, seção 20).

## 6. O teste da Etapa 6 (24/09/2026) — o que ele achou e o que pediu

### 6.1 Defeitos achados no teste

| # | O que ele viu | Causa | Situação |
|---|---|---|---|
| 6.1.1 | "A janelinha do relatório não diz nada" | **Não se repetiu.** No segundo teste, o print dele mostra a janelinha com "8 comprovantes, 11 lançamentos" | Encerrado |
| 6.1.2 | CMP-26/016: "PDFs gerados" listou `APROVADA · PAGA (antes da correção) · EFETIVADA · RECEBIDA (antes da correção)` | A correção mudou a movimentação de 3 etapas (entre ADMs) para 2 (mesma PIA). A regra juntava as etapas de todas as emissões, e a PAGA e a RECEBIDA antigas **não existem mais** no comprovante corrigido | **Consertado:** só contam as etapas da versão atual ("x de N" com o mesmo N) |
| 6.1.3 | CMP-26/017: uma **segunda via** saiu com valor, Nº SIGA e observação **diferentes** do original ("teste de correção") | A segunda via deixa redigitar tudo. O relatório (certo) a ignora, e a mudança se perde | **Em parte:** a tela avisa que a segunda via reimprime os mesmos dados, e o relatório diz "COM DADOS DIFERENTES do original". O conserto de verdade — ler os dados do `.md` — é o pedido 6.2 a (Etapa 7) |
| 6.1.4 | O comprovante (CMP-26/020, lote) saiu com as **linhas do lote vazias** — no download pelo Google **e no PDF do sistema** | **Defeito da Etapa 4, na fila de escritas** (`fecharEscritor_`): o preenchimento apaga as 32 linhas do lote e depois escreve as que existem; cada célula entrava na fila duas vezes, e a comparação era contra a folha de antes da fila. Quando o valor novo era igual ao que já estava, a escrita do valor era pulada e o apagar não. **Todo lote saía vazio do 2º PDF em diante**, e também ao preencher e depois gerar o mesmo lote | **Consertado:** a fila fica com o último valor de cada célula. A bancada fotografa o lote em cada PDF |
| 6.1.5 | O relatório em PDF quebra "TESTE001" e "Gerado em" em duas linhas | Colunas estreitas demais | **Consertado** (110 e 100 px) |
| 6.1.6 | Painel de exceção amarelo, a cor das bandeiras | — | **Consertado:** roxo, cor exclusiva |
| 6.1.7 | Escolhendo "Corrigir", a Conferência dizia "Você escolheu Histórico perdido" | O texto tinha dois casos para três escolhas | **Consertado:** o motivo vem da escolha, escrito, com um campo de complemento; o aviso "sem motivo" saiu |
| 6.1.8 | Pedido: na correção, escrever sozinho o que mudou | — | **Feito:** compara com a versão anterior da Referência no Histórico ("corrigidos: valor e data de emissão", "corrigido: signatários") |

### 6.2 Pedidos dele depois do teste (ainda não construídos)

a. **Importar os dados de um comprovante já emitido** (o `.md`) para corrigir
   — escolher o arquivo `.md` na janela. É o "reabrir pela Referência".
b. **"Corrigir um comprovante que acabou de sair" vira "Corrigir um
   comprovante"**, qualquer um.
c. **Exportar o comprovante** (menu e botão no rodapé do formulário):
   baixar em Excel, salvar planilha do Google na pasta, **baixar o `.md`** —
   sem gerar PDF. O `.md` exportado tem de poder sair **do que está na aba**,
   inclusive depois de editada à mão.
d. **Todo PDF gera também o `.md`** (já é assim; continua).
e. **Editar a aba Comprovante à mão sem restrição nenhuma, exceto o extenso
   (R7:R8)**, protegido com "mostrar um aviso antes de editar". Hoje também
   estão protegidos título, CNPJs e total do lote.
f. **Abrir a pasta dos arquivos**: item de menu e botão no formulário. Ele
   pediu que, com o Google Drive para computador instalado, abrisse o
   Explorador do Windows. **Não é possível**: uma página da web não pode
   abrir o Explorador nem uma pasta do computador (é uma trava de segurança
   do navegador), e o Drive para computador não oferece um endereço que faça
   isso. Abre no navegador.
g. **Bandeiras amarelas numa caixa ao gerar** — só ao clicar para gerar, nunca
   durante o preenchimento: cada aviso com "ignorar" ou "corrigir"; botões
   "Gerar CMP nº X mesmo assim", "Voltar e corrigir" e "Ignorar tudo e
   gerar". Ao voltar, o cursor vai para o primeiro campo não ignorado, com a
   lista aberta. Os ignorados ficam no rodapé com o rótulo "será ignorado".
   As marcações de ignorar somem ao fechar ou abrir a janela.
h. **Toda faixa (de cima e de baixo) abre uma caixa**, e a informação **fica
   na faixa** depois de fechar a caixa. O vermelho que impede (ex.: "Falta
   escolher as contas") fica vermelho até ser resolvido; o que se resolve
   some do rodapé. (Ele escreveu um título "LOTE:" antes deste pedido — a
   confirmar se havia algo sobre o lote.)
i. **Layout:** a seção 2 (origem e destino) à direita da seção 1.
j. **Pastas no Drive por tipo** (PDF, planilhas, `.md`…) e uma pasta
   **Lixeira**. Na correção, os arquivos da versão anterior que **mudaram**
   ganham "OLD" no começo do nome e vão para a Lixeira; os que não mudaram
   ficam. **A conta que ele pediu antes de criar a regra:** a mudança parcial
   **existe**. Tudo o que é comum às etapas (data, valor, contas, tipo,
   observação, lote, Nº SIGA) muda todos os PDFs; mas **o assinante de uma
   etapa** (quando "não são os mesmos") muda só o PDF daquela etapa, e a
   correção pode gerar **só uma etapa**. Então a regra certa é: vai para a
   Lixeira o PDF de cada etapa **refeita** na correção, **mais** o de cada
   etapa que **deixou de existir** (o caso do CMP-26/016, de 3 para 2); o
   `.md` é sempre refeito. E se a correção mudar um dado comum e refizer só
   algumas etapas, as outras ficam com dado velho — isso vira aviso.
k. **"Mostrar notas" nunca pode aparecer ativo** ao imprimir/baixar pelo
   Google. **A caixa de impressão do Google não é programável** (seção 1 do
   `07_gerar_pdf.md`). O que se pode fazer é **não ter anotação nenhuma** na
   aba Comprovante — sem nota, não há o que imprimir. Hoje o extenso e os
   avisos usam anotação.

---

# PARTE 2 — DECISÕES FECHADAS, QUE NÃO SE REABREM

## Arquitetura

- **Nada de AppSheet, nada de app Android nativo.** Avaliado e descartado: o
  layout do comprovante, com células mescladas e extenso ao lado do valor, é
  mais fiel e mais barato de manter numa planilha do que recriado num app de
  formulários.
- **Nada de montar o PDF por HTML.** Ele já disse que está bom assim.
- **Todo o preenchimento passa pelo formulário.** A aba Comprovante é a camada
  de impressão; ninguém digita nela.
- **O PDF sai por código, nunca por Arquivo → Imprimir.** O motivo está em
  `07_gerar_pdf.md`, e é medido.
- **Não existe "Fase 2" de Web App para celular** — o formulário já resolve o
  celular. A aba inteira existe por causa do **tamanho da tela**, não do
  celular.

## Regras do documento

- **A comparação das PIAs decide tudo**: 2 ou 3 documentos, o título e o
  subtipo. Nada disso é escolhido.
- **O bloco TIPOS foi aposentado.** As 26 finalidades diziam as sete espécies
  com fonte; duas listas respondendo à mesma pergunta é a pior repetição.
- **O alcance (mesma PIA / outro departamento / outra ADM) mora nas colunas
  `Tipo` e `Subtipo`** do bloco ONDE CADA FINALIDADE VALE — não numa coluna
  "Entre PIAs diferentes" com quatro valores.
- **A comparação das finalidades é pelas quatro colunas de texto, não pela
  Folha.** A folha é o código do levantamento: amarrar o sistema a ela seria
  depender de um esquema que ninguém mantém.
- **Vazio não corta, dos dois lados.**
- **Um par de contas sem regra é livre.** As linhas são restrições, não
  permissões.
- **O tipo de contas envolvidas vai na Observação, deduzido.** Escolhido,
  estava só nos comprovantes em que alguém lembrasse de marcar — e às vezes
  errado.
- **Campo vazio limpa a célula, sempre.** Não existe atalho que pule o
  preenchimento: havia um, e ele confiava numa memória em vez da folha.
- **"UM MIL", e não "MIL".**
- **A Referência só é consumida ao gerar o PDF** — e uma vez por
  movimentação, por mais PDFs que saiam.
- **Quais PDFs gerar se escolhe numa caixa que abre ao gerar** — pelo botão,
  pela aba ou pelo menu. Todas vêm marcadas, sempre; a caixa não guarda a
  escolha. O formulário não escolhe etapa, e "Preencher" põe a 1ª na aba.
- **O menu "Gerar PDF do comprovante" passa pela emissão de verdade** (abre o
  formulário na caixa de escolha). Não existe mais PDF sem Histórico.
- **Um `.md` por Referência**, não por PDF. Correção reescreve; segunda via
  mantém o do original.
- **O Histórico tem uma linha por PDF** e é gravado pelo **nome** da coluna.
- **O relatório da Etapa 6 NÃO é contábil nem financeiro** — mudança de
  rumo dele, em 23/09/2026. Alguns comprovantes passam a ser gerados
  **direto pelo SIGA**; com dois lugares de geração, somar só o que saiu do
  app daria um número que parece saldo e não é. **Não se escreve soma por
  conta, saldo, "entradas/saídas" nem lista do que "ainda não andou".**
  O relatório é **a lista dos comprovantes que o app gerou**, com os dados
  de cada um e **cada linha de lote à parte** — para responder "este
  lançamento financeiro já teve comprovante gerado pelo app?".
  As decisões anteriores de soma por conta, de "o que já andou" e das três
  primeiras partes do relatório saíram por isso (estão no histórico do Git).
- **Cada comprovante aparece UMA vez, pela Referência** — não uma vez por
  PDF. Não pela etapa 1: a correção deixa a linha errada no Histórico, e a
  etapa 1 pode nem ter saído. **Segunda via não repete o comprovante**;
  **na correção valem os dados da emissão mais nova** — se a correção mudou
  a data de mês, o comprovante muda de mês junto.
- **O relatório sai numa aba E em PDF**: a aba "Relatório" é refeita a cada
  pedido, protegida por aviso, e dela sai o PDF. O PDF do relatório não
  segue as regras do comprovante (pode ter várias folhas e ajustar à
  largura). Não pede autorização nova do Google.
- **O lote aparece linha por linha**, e não pelo total: é a linha do lote
  que se procura. Para isso o Histórico ganha uma coluna **no fim** com as
  linhas do lote — e só os comprovantes emitidos depois dela têm o detalhe.
- **Correções e segundas vias do mês** aparecem numa parte própria, só
  informativa.
- **As colunas do relatório, uma linha por lançamento** (aprovadas por ele):
  Data · Referência · Nº SIGA · Lançamento (Único / Lote n de N) ·
  Documento / cartão · Beneficiário / finalidade da linha · Valor · Conta
  de origem · Conta de destino · Finalidade · Forma · PDFs gerados. Em
  ordem de data; no fim, só a **contagem** (comprovantes e lançamentos),
  **nunca a soma dos valores**.
- **Tudo o que foi gerado até o início da versão beta é teste e será
  apagado** — comprovantes, lotes, PDFs e linhas do Histórico. Por isso não
  se constrói nada para recuperar o detalhe de lote dos comprovantes
  antigos.
- **O mês é o da Data de emissão impressa no comprovante**, não o do dia em
  que o PDF foi gerado (datado 30/09 e gerado 02/10 é de setembro); no lote,
  a data de cada linha. **Escolhe-se pelo menu** "Tesouraria • CMP p/ SIGA → Relatório
  mensal", numa janelinha que já vem no mês anterior.

- **O nome do sistema muda** (decidido por ele em 24/09/2026): "CMI" só
  dizia um dos dois documentos, e o sistema também gera o de Transferência
  de numerários.

  | Onde | Antes | Agora |
  |---|---|---|
  | Nome do sistema | Gerador de CMI | **Gerador de comprovantes para o SIGA** |
  | Menu na planilha | Tesouraria CMI | **Tesouraria • CMP p/ SIGA** |
  | Nome do PDF | `CMI-CMP-26-001-APROVADA - 26_09_23.pdf` | `CMP-26-001-APROVADA - 26_09_23.pdf` |
  | Arquivo de recuperação | `CMI-CMP-26-001.md` | `CMP-26-001.md` |

  "CMP" é a mesma sigla do começo da Referência — não uma segunda sigla. **Os
  nomes internos não mudam** (a marca das proteções, a chave da última
  movimentação guardada): trocá-los faria o sistema deixar de reconhecer o
  que já existe na planilha dele.

## Dados confirmados por ele

- **A inscrição estadual da ADM Costa Rica é ISENTO**, igual à de Coxim —
  confirmado em 23/09/2026. Era a pendência 1.2; o cadastro já trazia esse
  valor, e nada no código mudou.

## Cadastros

- **A chave identifica a linha; coluna nova vai no fim; formatar como texto
  antes de escrever.**
- **Recriar preserva o que existe** e **não troca célula que já tem dono**.
- **Só a lista `aposentadas` autoriza tirar uma linha.**
- **As sub-tesourarias de cartão não são contas** e saíram da lista CONTAS.

## Conduta

- **Avisar, nunca bloquear** — com uma exceção declarada, a regra entre
  contas, que tem porta.
- **Preferência de tesouraria não vira trava**: vira nota, com chave para
  desligar, porque outra ADM pode fazer diferente e estar igualmente certa.
- **Nunca acusar a colagem dele sem medir.**
- **Cada etapa roda num chat novo**, e cada uma tem de aprender com todas as
  anteriores.

## Uma decisão sobre o próprio cadastro, que vale reler

**Uma regra que pode sair sem mudar nada é repetição do que outra coisa já
diz.** Três regras entre contas saíram assim — e **nenhuma conferência
acusou**, porque todas continuavam dando a resposta certa. O que acusou foi
tirar cada uma, refazer o retrato dos 506 pares de contas ativas e comparar.
Isso virou conferência de toda rodada.
