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
| 1.2 | A inscrição estadual da ADM Costa Rica foi cadastrada como ISENTO, igual à de Coxim. Confirmar antes do primeiro comprovante com aquele cabeçalho — **e desde a Etapa 5 ele existe: o PDF de Recebimento de uma remessa para PIA-COSTA sai com o cabeçalho de Costa Rica** | `01_regras_negocio_OLD.md`, seção 5 |
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

**Etapa 5:** entregue — os 2 ou 3 PDFs de uma vez, o cabeçalho do
Recebimento, o `.md` e o Histórico. **Falta o teste dele na planilha.**

**Deixado de fora de propósito, e anotado:**

- **Reabrir pela Referência** (ler o JSON do `.md` de volta para o
  formulário). O arquivo já é gravado pensando nisso.
- **Quem gerou** cada PDF não vai para o Histórico: pedir o e-mail de quem
  clica exigiria uma autorização nova do Google. Se ele quiser, é uma coluna
  nova no fim e uma tela de autorização a avisar.
- **O menu "Gerar PDF do comprovante"** continua gerando um PDF do que está na
  aba, **sem Histórico e sem consumir número**: ele não sabe qual movimentação
  originou a folha. Se alguém o usar no lugar do formulário, o número não
  anda — vale perguntar a ele se o menu deve sair.
- **Corrigir no mesmo dia** gera um PDF com o mesmo nome do errado, e os dois
  ficam na pasta (o Drive aceita nomes repetidos). O Histórico diz qual é o
  mais novo.

**Etapa 6:** o Histórico e o relatório mensal por mês e por conta, para
conferência com o extrato e apoio ao Conselho Fiscal.

**Sem etapa marcada:** mandar o PDF para uma pasta escolhida pelo destinatário
de outra ADM, em vez da pasta padrão (`01_regras_negocio_OLD.md`, seção 20).

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
- **"Etapas a gerar" nasce em Todas**, e só um clique da pessoa o tira de lá.
- **Um `.md` por Referência**, não por PDF. Correção reescreve; segunda via
  mantém o do original.
- **O Histórico tem uma linha por PDF** e é gravado pelo **nome** da coluna.

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
