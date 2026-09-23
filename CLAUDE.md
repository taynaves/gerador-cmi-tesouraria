# CLAUDE.md — Gerador de Comprovantes de Movimentação Interna (CMI)
Secretaria/Tesouraria da Piedade — ADM Coxim-MS (CCB)

---

## QUEM VAI USAR ISTO

**Taynã** é o responsável pelo projeto, mas **não é programador** e tem dificuldade
com projetos técnicos. Ele já concluiu outros projetos parecidos guiado passo a
passo (o Gerador de CIs, o Gestor de Documentos em Apps Script). O padrão que
funcionou nesses projetos e que você deve repetir aqui:

- **Uma etapa de cada vez.** Nunca liste 10 passos e peça para ele fazer tudo.
  Peça uma ação, espere a confirmação ("feito" / "apareceu isso aqui" / cole um
  print), só então vá para a próxima.
- **Zero jargão sem explicação.** Se precisar dizer "Apps Script", explique em
  uma frase o que é, na primeira vez.
- **Diga exatamente onde clicar.** "Vá em Extensões → Apps Script" em vez de
  "abra o editor de scripts".
- **Assuma que algo vai dar errado.** Antes de cada etapa que mexe em
  permissões, autorização do Google, ou publicação, avise o que aparecerá na
  tela para ele não abortar por achar que é erro.
- Outros diáconos além do Taynã também vão usar a planilha (computador e,
  eventualmente, celular). Pense neles como usuários finais leigos, não
  como um segundo desenvolvedor.

---

## O QUE ESTE PROJETO FAZ

Gera o **Comprovante de Movimentação Interna (CMI)** — o documento que a
tesouraria da Piedade anexa no SIGA para registrar transferências entre
contas/caixas/cartões da própria obra da Piedade (não é nota fiscal, nem
lançamento contábil — é o comprovante que documenta e autentica o
movimento, com assinatura de diáconos).

**Por que existe:** hoje isso é preenchido numa planilha Excel manualmente,
célula por célula, incluindo escrever o valor por extenso à mão e procurar o
nome de contas/diáconos de cor. É lento e sujeito a erro. O objetivo é reduzir
isso a poucos cliques, mantendo a aparência **idêntica** ao modelo oficial.

**Identidade visual (decidida e aprovada na Etapa 1):** a referência de
aparência não é mais o `.xlsx`, e sim `docs/referencia_layout_aprovado.pdf`,
nascido do comprovante que o **próprio SIGA emite**
(`docs/referencia_siga_comprovante.pdf`). Mesma fonte, mesmos tamanhos, mesma
espessura de linha, mesmas margens — a ponto de, sobrepondo os dois, os campos
comuns coincidirem. O PDF sai sempre em **escala Normal (100%)**; "ajustar à
largura/altura" muda o tamanho da letra e quebra a sobreposição.

**Não é:** um sistema contábil, um substituto do SIGA, ou um app de
aprovação/workflow com login. É um gerador de documento, como o Gerador de CIs.

---

## REGRA DE OURO: A LÓGICA DE ETAPAS (2 ou 3 documentos por movimentação)

Esta é a regra mais importante do projeto — releia antes de programar
qualquer coisa relacionada a Status ou geração de PDF.

Uma "movimentação" nunca gera **um** comprovante. Ela gera **2 ou 3**,
dependendo de quem participa:

| Situação | Documentos gerados | Status de cada um |
|---|---|---|
| Origem e destino são da **mesma PIA** | 2 | `APROVADA` → `EFETIVADA` |
| Origem e destino são de **PIAs diferentes** (ex.: PIA-COXIM → PIA-SONORA) | 3 | `APROVADA` → `PAGA` → `RECEBIDA` |

O sistema decide sozinho comparando o **prefixo da PIA** da conta de origem
com o da conta de destino (ver `docs/02_especificacao_campos.md`).

**A mesma comparação define o título do documento:**
- mesma PIA (2 etapas) → `COMPROVANTE DE MOVIMENTAÇÃO INTERNA`
- PIAs diferentes (3 etapas) → `COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS`

Antes de gerar, pergunte uma única vez: **"Os signatários serão os mesmos em
todas as etapas?"**
- Se sim → usa o mesmo conjunto de assinantes em todos os PDFs.
- Se não → pede os assinantes etapa por etapa.

O botão "Gerar PDF" produz **um arquivo por etapa**, cada um com:
- O `Status` correto já preenchido no documento.
- O nome de arquivo identificando a etapa: `CMI-[nº]-[ETAPA] - [AA]_[MM]_[DD].pdf`
  (ex.: `CMI-INT004-APROVACAO - 26_09_18.pdf`).

O número do documento, a data, o valor, a origem, o destino, o tipo e a
observação são **os mesmos nas 2 ou 3 etapas** — só o Status e (opcionalmente)
os assinantes mudam. **Exceção importante:** quando Origem e Destino são de
ADMs diferentes, o **cabeçalho institucional** também muda por etapa —
Aprovação e Pagamento saem com os dados da ADM de Origem, e Recebimento
sai com os dados da ADM de Destino (ver `docs/01_regras_negocio.md`,
seção 5, para o detalhe completo). É "quem produz o documento" que decide
qual cabeçalho aparece nele.

---

**O campo "Tipo Transferência" NÃO repete o tipo principal** — ele já está no
título do documento. O campo leva só o **subtipo** (quando existe: só a
transferência tem), a **forma** e a **finalidade**:

| Situação | Título (já diz o tipo) | Campo Tipo Transferência |
|---|---|---|
| mesma PIA | COMPROVANTE DE MOVIMENTAÇÃO INTERNA (de numerários) | `PIX · CARREGAMENTO DE CARTÃO` |
| PIAs diferentes, mesma ADM | COMPROVANTE DE TRANSFERÊNCIA (externa) DE NUMERÁRIOS | `ENTRE DEPARTAMENTOS · PIX` |
| ADMs diferentes | COMPROVANTE DE TRANSFERÊNCIA (externa) DE NUMERÁRIOS | `ENTRE ADMINISTRAÇÕES · PIX` |

**O parêntese em caixa baixa não é descuido, e não é enfeite.** São dois tipos
diferentes, e os nomes antigos não diziam isso. Por causa dele, o título é
escrito no papel **sem passar pelo caixa-alta** que o resto do documento usa
(`val_`, `maiuscula_`) — do contrário sairia "(DE NUMERÁRIOS)". Há conferência
disso.

Numa movimentação interna sem forma escolhida o campo sai **em branco**, e
está certo: tudo o que havia para dizer já está no título. Na tela, o campo
tracejado continua mostrando a dedução inteira — ele é conferência, não é o
que vai para o papel.

**A LISTA DE SUBTIPOS FOI APOSENTADA — o bloco `TIPOS` não existe mais.** Ele
guardava sete espécies de movimentação (carregamento de cartão, suprimento de
caixa, zerar conta…), e **as 26 finalidades dizem as sete, com fonte e com as
39 linhas de onde cada uma vale.** Duas listas respondendo à mesma pergunta é o
pior tipo de repetição: a pessoa preenchia duas vezes, e nada obrigava as duas
respostas a combinarem. Saíram junto `nucleoTipoCabe`,
`nucleoFinalidadeCombina`, `tipoCabeNasContas_` e o campo Subtipo da janela.

Restou UM campo escolhido a mão — a **Finalidade** —, e o "subtipo" que ainda
aparece no papel (`ENTRE DEPARTAMENTOS`, `ENTRE ADMINISTRAÇÕES`) é **deduzido
das contas**, nunca escolhido. Quando alguém disser "subtipo" ou "finalidade"
neste projeto, confirme de qual dos dois se trata: o deduzido ou o escolhido.

**A FINALIDADE É A QUINTA PERGUNTA, E A ÚNICA QUE O SISTEMA NÃO DEDUZ.** Onde a
movimentação acontece sai das contas; como o dinheiro anda sai da forma; que
espécie de movimentação é sai do subtipo. **O propósito só quem lança sabe.**
As 26 finalidades e as 39 linhas de onde cada uma vale saíram de um
levantamento nos manuais da obra, feito no projeto das CIs
(`docs/10_prompt_finalidades.md`), e cada linha cita a fonte — **nenhuma foi
inventada aqui.**

A primeira tentativa daquele levantamento voltou com **despesas** (alimentação
do necessitado, custeio de funeral), e nada daquilo é CMI: o comprovante
documenta dinheiro andando entre contas da própria obra, nunca pagamento a
terceiro. A culpa foi do prompt, que não disse a frase. A 2ª versão diz — e
entrega a árvore das combinações pronta, gerada por
`ferramentas_de_conferencia/listar_combinacoes.js`, para o outro chat preencher
em vez de inventar.

Duas coisas do desenho que não se negociam:

- **A comparação é pelas quatro colunas de texto** (Tipo, Subtipo, Forma,
  Subforma) do bloco ONDE CADA FINALIDADE VALE, **não pela coluna Folha**. A
  folha (`1.1.1`, `2.0.2.2`) é o código do levantamento e serve para rastrear;
  amarrar o sistema àquela numeração seria depender de um esquema que ele não
  conhece e que ninguém mantém.
- **Vazio não corta, dos dois lados.** Vazio na regra quer dizer "serve para
  qualquer um"; vazio no estado quer dizer "ainda não escolheram". Sem a
  segunda metade, não ter escolhido forma esvaziava a lista inteira e a cascata
  parecia quebrada.

**Os históricos do SIGA (`032 TRANSF.VLR`) aparecem na TELA e em lugar nenhum
do papel.** Eles são o código do lançamento que o comprovante documenta, e quem
está com o formulário aberto é justamente quem vai lançar. O comprovante não é
o lançamento.

**A Observação ocupa DUAS linhas e ajusta o texto** (`px: 32`, `quebra: true`).
Em uma linha só ela cortava: o que passasse dos 601 px sumia do PDF sem avisar.
Os 16 px a mais não vêm da folha — saem de `PREENCHIMENTO`, a sobra que
`sobraDaFolha_` recalcula a cada modo, e a bateria exige a altura exata da
página para provar isso.

**A OBSERVAÇÃO TAMBÉM NÃO É SÓ O QUE FOI DIGITADO.** Na frente dela o sistema
escreve o **tipo de contas envolvidas** — `ENTRE CAIXAS`, `ENTRE BANCOS`,
`ENTRE CAIXA E BANCO`, `ENTRE CARTÕES`, `ENTRE CAIXA E CARTÃO`,
`ENTRE BANCO E CARTÃO` —, que é a informação que o comprovante perdeu quando
as três finalidades "Transferência entre departamentos - ..." foram
aposentadas por repetirem o que a árvore já deduz. **Deduzida, ela está em
todos os comprovantes; escolhida, estava só nos que alguém lembrasse de
marcar, e às vezes marcada errado.** A frase descreve o **par**, não o
sentido: a ordem é fixa (caixa, banco, cartão), senão o mesmo movimento sairia
descrito de dois jeitos conforme quem paga. A **ACG entra como BANCO** — ela
mora no grupo `101 - BANCOS CONTA MOVIMENTO`; a natureza ACG existe para as
regras, não para descrever a conta no papel. A tela mostra a frase inteira
antes de gerar (`previaDaObservacao`), para ninguém descobrir isso no PDF.

**CAMPO VAZIO LIMPA A CÉLULA — sempre.** Um comprovante nunca pode sair com
dado do comprovante anterior. Por isso **não existe atalho que pule o
preenchimento**: havia um, que pulava quando a movimentação era "a mesma da
última vez", e ele confiava numa memória do que fora preenchido em vez da
folha — bastava a folha mudar por fora para o PDF sair com dado de outro
documento. O barato já vem de `fecharEscritor_`, que lê o bloco numa viagem
só e grava apenas as células diferentes.

### As três coisas que decidem as formas permitidas

1. **Um par sem regra é livre** — as linhas são restrições, não permissões.
2. **Entre as PERMISSÕES, a mais específica manda** (natureza vale 1 ponto por
   lado, texto de conta vale 2). Sem isso não haveria como escrever exceção: a
   devolução em espécie de um cartão ao caixa cairia no cruzamento vazio entre
   "cartão movimenta por transferência" e "caixa recebe por saque".
3. **As PROIBIÇÕES valem sempre**, venham de onde vierem — uma exceção
   específica não ressuscita o que uma regra geral proibiu. É o que faz
   "nenhuma conta Santander saca" valer mesmo onde outra regra permite saque.

**O ALCANCE — mesma PIA, outro departamento, outra ADM — hoje se escreve nas
colunas `Tipo` e `Subtipo` do bloco ONDE CADA FINALIDADE VALE**, e não numa
coluna "Entre PIAs diferentes" com quatro valores. Aquela coluna existia no
bloco `TIPOS`, e o quarto valor (`Só entre ADMs`) nasceu porque "Sim" queria
dizer "PIAs diferentes" — o que inclui dois departamentos da MESMA
administração, onde remessa não existe. Com as colunas do bloco novo a
distinção deixa de precisar de valor especial: a *Remessa para outra
ADM/localidade* diz `entre administrações` no Subtipo e pronto. **Vale a
mesma comparação de sempre** — `nucleoSimples` de um lado e do outro, de
modo que "ENTRE ADMINISTRACOES" digitado sem acento na aba continue valendo;
e **vazio não corta**, dos dois lados. Há conferência dos dois.

**O nome de uma forma não repete o que ela já é.** "TRANSF. TED" dizia duas
vezes a mesma coisa — o T de TED é *transferência* —, e virou `TED`. O nome
por extenso foi para a coluna Observação do bloco FORMAS, onde explica sem
ocupar a largura do campo. Renomear uma linha é trocar a chave dela: a antiga
entra em `aposentadas`, a nova vem do projeto, e **as referências a ela em
outras listas não se consertam sozinhas** (a Remessa citava "TRANSF. TED" na
coluna *Formas que combinam*) — ver a regra do "valor que já tem dono", mais
abaixo. Como não dá para consertar sozinho, tem de dar para VER: o menu
**Conferir cadastros** agora lista toda forma citada em outra lista que não
existe no bloco FORMAS (`referenciasSoltas_`). Um nome que nunca casa não
estoura em lugar nenhum — a opção só some da tela, sem explicação.

**SAQUE é família, não forma.** Saque sozinho é ambíguo — pode ser espécie ou
cheque descontado —, então ele tem duas subformas (DINHEIRO e CHEQUE) e o
formulário pede a segunda. Permitir/proibir a família alcança as duas.

**E há uma quarta coisa, que NÃO é regra de relacionamento.** As três acima são
o que **esta tesouraria decidiu** sobre um par de contas. O bloco FORMAS guarda
o que a forma **é**, em duas colunas, e nenhuma ADM pode decidir diferente
porque não é decisão:

- `Exige conta de` — pelo menos um dos lados tem de ser conta daquela natureza.
  `CAIXA` em DINHEIRO e CHEQUE: dinheiro que não passa por um caixa não é
  dinheiro, é transferência. Escrito como proibição no outro bloco, isso
  custaria uma linha por par sem caixa, e a próxima natureza entraria furando
  a regra em silêncio.
- `Instituições` — `MESMA` (transferência bancária é, por definição, dentro de
  uma instituição) ou `DIFERENTES` (TED e PIX existem para atravessar bancos).
  Depende da coluna **Instituição** das contas (`BB`, `SANT`, `ACG`; os
  **cartões levam ACG**, porque o cartão pré-pago vive dentro da ACG/PagCorp).
  **Caixa não tem instituição, e aí a comparação não acontece** — concluir "o
  vazio é diferente de BB, então pode TED" seria inventar resposta a partir de
  um dado que não existe.

Disso caem três pares **impossíveis** que ninguém escreveu como proibição —
caixa ↔ ACG, caixa ↔ SANT e cartão ↔ banco de fora. Confira antes de
"consertar" algum deles.

**REDUNDÂNCIA NÃO SE LÊ, SE MEDE.** Três regras entre contas — ACG→ACG,
ACG→CARTÃO e CARTÃO→ACG, todas permitindo TRANSF. BANCÁRIA — **saíram por não
dizerem mais nada**: quando a coluna `Instituições` nasceu, transferência
bancária passou a exigir a mesma instituição por definição, e os cartões levam
ACG. Nenhuma conferência acusou, porque todas continuavam dando a resposta
certa. O que acusou foi tirar cada regra, refazer o retrato dos 506 pares de
contas ativas e comparar — e isso agora é conferência de toda rodada. **Uma
regra que pode sair sem mudar nada é repetição do que outra coisa já diz.**

**E O GOOGLE CONVERTE O QUE PARECE DATA.** A coluna `Folha` guarda "1.1.1", e
na planilha dele isso virou 01/01/2001 — a janela do recriar passou a listar
`F23 → Mon Jan 01 2001`. O conserto é formatar a área como TEXTO **antes** de
escrever (`setNumberFormat('@')` em `desenharBloco_`); depois não adianta, o
valor já foi convertido. E o simulador aprendeu a converter igual, senão um
defeito destes passa verde na bancada para sempre.

---

## REGRA DE OURO: AGRUPAMENTO (COMPROVANTE PARA VÁRIAS MOVIMENTAÇÕES)

Para poupar assinaturas, várias movimentações **da mesma natureza** podem
sair num único comprovante, numa tabela (ver especificação de campos). Em
**lançamento único a tabela não aparece**; em lote, ela mostra **exatamente
uma linha por lançamento**, nunca uma linha em branco. As condições para
agrupar, nesta ordem:

1. **Mesma etapa** (todas em Aprovação, ou todas em Efetivação, etc. — nunca
   misturar etapas num mesmo lote).
2. **Mesmo mês** (a data de cada lançamento cai no mesmo mês/ano).
3. **Mesma origem E mesmo destino** — ou, no caso de cartões, **mesma conta
   ACG do lado de origem OU do lado de destino**, mesmo que o cartão
   individual (o "destino" específico) seja diferente. Ex.: um lote pode
   reunir 5 carregamentos de cartões diferentes, desde que todos saiam da
   mesma conta ACG.
4. **Mesmo tipo de movimentação.**

O valor total do comprovante (célula do Valor / extenso) é a **soma
automática** das linhas do lote, e o rótulo do campo muda de "Valor:" para
**"Valor Total:"**.

---

## MÓDULOS DO PROJETO — O QUE JÁ EXISTE

**Leia `docs/00_estado_do_projeto.md` antes de qualquer coisa.** É o ponto de
retomada: o que está pronto, as regras medidas, as armadilhas já pagas, as
decisões fechadas e o que falta.

| Arquivo | Etapa | O que é |
|---|---|---|
| `apps_script/01_Layout_Comprovante.gs` | 1 ✔ | Desenha a aba "Comprovante" e carrega o menu |
| `apps_script/02_Cadastros.gs` | 2 ✔ | Aba "Cadastros" (11 listas) e a janela de importação |
| `apps_script/03_Formulas_Validacoes.gs` | 3 ✔ | Extenso, somas, PIA/CNPJ/cabeçalho pela conta, avisos, listas suspensas |
| `apps_script/05_Gerar_PDF.gs` | 5 (parcial) | Gera o PDF com margens e orientação fixas no código |
| `apps_script/00_Escrita_Rapida.gs` | 4 ✔ | Junta dezenas de escritas num pedido só (de 192 idas ao Google para 9) |
| `apps_script/04_Formulario.gs` + `04_Formulario_Tela.html` | 4 (quase) | O formulário: combos com filtro, lote, Referência travada, reabre no último preenchimento |
| `apps_script/06_Tipos_E_Regras.gs` | 4 ✔ | A árvore de tipos e as regras entre contas — **a única trava do projeto** |
| `ferramentas_de_conferencia/` | | O simulador do Sheets e as baterias (704 conferências) |
| `docs/01_regras_negocio.md` | | Todas as regras validadas com o Taynã |
| `docs/02_especificacao_campos.md` | | Célula por célula: grade, campos, impressão |
| `cadastros/*.csv` | | A fonte da verdade das listas |
| `docs/contexto_resumido.md` | | Contexto institucional já levantado — não repita perguntas respondidas ali |

Não tente reaproveitar o `ci_generator.py` do projeto das CIs — são sistemas
diferentes (aquele gera `.docx` de ofício; este gera `.pdf` de comprovante
financeiro a partir de uma planilha).

---

## ARQUITETURA (decidida, não abrir para debate)

**A planilha "Comprovante" é só a camada de impressão/PDF. Ninguém digita
nela diretamente.** Todo o preenchimento — número, data, valor, tipo,
origem, destino, itens do lote, assinantes — acontece por um **formulário
Apps Script** (um modal/sidebar em `HtmlService`), aberto pelo menu
customizado "Tesouraria CMI". O formulário escreve os valores na planilha
por trás e, quando o Taynã confirma, dispara a geração do(s) PDF(s).

Por quê essa escolha, e não digitar direto nas células (decisão tomada
depois de avaliar as duas):

| | Digitar direto na planilha | Formulário Apps Script (escolhido) |
|---|---|---|
| Uso no celular | Ruim (células mescladas são difíceis de tocar) | Bom (campos de formulário normais) |
| Filtro-ao-digitar em TODOS os campos (tipo, origem, destino, diácono, cartão) | Precisaria de sidebar separada por campo | Nativo — um único campo de busca por combo, com JS |
| Tela de Cadastros (contas, diáconos, cartões) | Editar a aba diretamente | Uma seção própria do mesmo formulário, mais segura contra erro de digitação |
| Complexidade de construção | Menor | Maior — mas ainda dentro do que o Apps Script resolve bem |
| Risco de quebrar o layout do PDF por edição manual acidental | Alto (célula mesclada) | Baixo (usuário nunca edita a célula) |

Estrutura de abas por trás do formulário:
- **"Comprovante"** — só o layout visual exato do modelo, escrito pelo
  script; tratar como "somente leitura" para o usuário final.
- **"Cadastros"** — a fonte viva das listas (contas, diáconos, cartões,
  tipos, status), editável tanto pela aba diretamente (para o Taynã) quanto
  pela seção "Cadastros" do formulário (para qualquer colaborador, sem
  precisar abrir a planilha).
- **"Histórico"** — registro automático de cada comprovante emitido.

**Geração de PDF: resolvida, e não por Arquivo → Imprimir.** Os ajustes de
impressão do Sheets (margens, orientação, escala) **não ficam guardados na
planilha** — ficam no navegador de cada pessoa, e o Google os redefine
sozinho, desformatando o documento em silêncio. Nenhum comando do Apps
Script trava isso. Por isso o PDF é pedido **por código**, com cada ajuste
escrito no próprio pedido (`EXPORTACAO_PDF`, em `apps_script/05_Gerar_PDF.gs`),
pelo menu **Tesouraria CMI → Gerar PDF do comprovante**. Antes de gerar, o
sistema confere as duas medidas que fazem o documento virar duas folhas —
694 px de largura e 1045 px de altura — e avisa (sem bloquear) se saíram da
medida, e a janela do resultado traz botões de verdade para abrir o PDF, abrir
a pasta ou fechar. **As anotações das células ficam de fora do PDF**
(`printnotes=false`): vinham ligadas por padrão e imprimiam uma segunda folha.
Detalhe em `docs/07_gerar_pdf.md`, inclusive a diferença medida de 0,975 no
tamanho da letra entre exportar por código e imprimir pelo navegador.

**Não existe mais uma "Fase 2" separada de Web App para celular** — o
formulário Apps Script já resolve o uso no celular desde a Fase 1. Se, no
futuro, o Taynã quiser um link público fora do Sheets (`doGet`/`doPost`
publicado como Web App), trate isso como um novo projeto à parte, só se
ele pedir.

Não proponha AppSheet nem reescrever isso como app Android nativo — já foi
avaliado e descartado para este caso (o layout do comprovante, com células
mescladas e extenso ao lado do valor, é mais fiel e mais barato de manter
numa planilha do que recriado num app de formulários externo).

---

## A REGRA MORA NUM LUGAR SÓ — E A JANELA A RECEBE INJETADA

A árvore de tipos e as regras entre contas vivem **exclusivamente** em
`apps_script/06_Tipos_E_Regras.gs`, nas funções `nucleo*`. A tela precisa
delas para responder na hora da tecla (perguntar ao Google a cada letra
devolveria a lentidão que o projeto acabou de tirar), e as recebe por
**injeção**: `regrasParaATela_()` lê o código-fonte dessas funções com
`Function.prototype.toString()` e o servidor o cola dentro do HTML, na marca
`/* <<< O NÚCLEO DAS REGRAS ENTRA AQUI >>> */`.

Três consequências que não se negociam:

1. **Para mudar uma regra, mexa só no `06_Tipos_E_Regras.gs`.** Nunca escreva
   regra dentro do `04_Formulario_Tela.html` — a bateria acusa, e a cópia
   duplicada some na abertura seguinte de qualquer jeito.
2. **O núcleo é JavaScript puro e ES5.** Nada de `SpreadsheetApp`, `Utilities`
   ou `lerCadastro_` lá dentro; nada de chamar função de fora do núcleo (o que
   precisar, recebe por parâmetro); nada de `=>`, `let` ou `const`. Aquele
   texto vai rodar dentro do navegador.
3. **NADA que precise ser reconhecido depois pode ser escrito em comentário.**
   O `HtmlService.createHtmlOutputFromFile(...).getContent()` — que é como o
   servidor lê a tela — **devolve o texto SEM os comentários**. Foi medido:
   de um arquivo de 80 KB, chega 63 KB e **zero** comentários. As marcas são
   comandos (`var NUCLEO_DAS_REGRAS = 1;`, `var FIM_DA_TELA = 1;`), e
   `montar_tela.js` apaga os comentários antes de montar, para a bateria
   testar a tela que o Google realmente entrega. Custou duas rodadas de
   diagnóstico errado, acusando o Taynã de colar pela metade um arquivo
   inteiro.
4. **A marca é ASCII puro, e os dois arquivos declaram versão.** Casar dois
   arquivos por um texto acentuado é pedir para um dia deixarem de casar por
   codificação — falha que não dá pista de onde veio. Sempre que a tela e o
   núcleo mudarem juntos, **suba `VERSAO_DA_TELA` e `VERSAO_DO_NUCLEO`**, que
   são iguais de propósito: é o que faz o menu **Conferir versões dos
   arquivos** e a mensagem de erro dizerem QUAL arquivo está atrasado.
5. **Quem testa a tela testa a tela MONTADA**, via
   `ferramentas_de_conferencia/montar_tela.js`. Testar o `.html` cru deixaria
   passar o defeito que não dá sinal nenhum (ver a armadilha do `HtmlService`
   mais abaixo).

**A CHAVE DE UMA LISTA TEM DE IDENTIFICAR A LINHA.** O cadastro deduplica por
`bloco.chave`, e uma chave que se repete **apaga linhas em silêncio**. Mordeu
duas vezes: em CONTAS (a 1ª coluna é a PIA, que repete 11×) e nas REGRAS ENTRE
CONTAS, onde **7 das 11 regras sumiram** porque metade começa com `*` — e o
sistema passou a permitir justamente o que devia proibir. A chave pode ser um
número **ou uma lista** de colunas (`chave: [0, 1, 7, 8]`), e a bateria confere
que nenhuma linha do projeto tem chave repetida nem some do cadastro.

**COLUNA NOVA VAI NO FIM DA LISTA, NUNCA NO MEIO** — e agora isso é
**provado por simulação**, não por disciplina: a bateria monta cada lista como
ela era antes da última coluna existir, recria, e exige que todo valor tenha
ficado na coluna certa. Foi escrito depois de eu quebrar a regra duas vezes,
a segunda logo depois de escrevê-la. Acrescentar uma coluna no
meio de um bloco dos Cadastros desalinha, em silêncio, todas as linhas que já
estavam na aba: elas têm uma coluna a menos, são encostadas à esquerda e
completadas no fim. Aconteceu com a coluna **Natureza** no bloco CONTAS, e
produziu **três sintomas que pareciam três problemas** — todas as contas
inativas, nenhuma regra entre contas valendo, e DINHEIRO oferecido para a ACG,
com bandeira verde na conferência. Hoje `consertarDeslocamento_` desentorta ao
recriar (e a janela do recriar diz quantas linhas desentortou), mas a regra
continua valendo: **coluna nova vai no fim.**

**E UMA COLUNA NOVA NO FIM AINDA NÃO CHEGA SOZINHA A QUEM JÁ TEM A ABA.**
Recriar **preserva** o que existe — é o que impede a recriação de apagar o
trabalho de quem editou a aba à mão. Só que, por isso, a coluna nova nasce
**vazia** em todas as linhas de quem já tinha a lista: a regra existe no
projeto e não vale para ninguém, sem nenhum sinal. `completarColunaNova_`
resolve, e a detecção não adivinha — só é considerada nova a coluna que está
vazia em **todas** as linhas, e o valor vem da linha do projeto com a mesma
chave. Quem esvaziou uma célula de propósito esvaziou de propósito.

**E uma linha que o projeto deixou de trazer fica lá para sempre**, pelo mesmo
motivo: o DOC, extinto pelo Banco Central, continuaria oferecido como forma. A
lista `aposentadas` de cada bloco é a **única** coisa que autoriza a recriação
a tirar uma linha — fechada, escrita à mão, chave por chave, nunca uma regra
do tipo "tire o que o projeto não traz mais" (isso apagaria toda conta e todo
diácono cadastrado pelo Taynã). O que sai aparece na janela, em SAIU, com o
nome.

**E RECRIAR NÃO TROCA O VALOR DE UMA CÉLULA QUE JÁ TEM DONO** — só acrescenta
linha nova e completa coluna nova. Não deve trocar: numa coluna em que vazio
*significa* alguma coisa (em *Formas que combinam*, vazio quer dizer "serve
para qualquer forma"), escrever por cima apagaria uma decisão da tesouraria
para impor a do projeto. A consequência é real e tem de ser dita a ele em vez
de prometida: quando o projeto passa a dar um valor a uma célula que na aba
dele está vazia, **aquilo não chega sozinho** — ou ele digita na célula, ou
substitui a lista pela janela de importação. Há conferência provando os dois
lados.

E a lição que veio junto: **"não está vazio" não é conferência.** A coluna
guardava `"Ativa"` — preenchida e errada —, e por não estar vazia passou por
baixo de tudo. Onde um campo tiver um conjunto fechado de valores, declare-os
(`{ nome: "Natureza", valores: [...] }`) e confira contra a lista: é isso que
permite **provar** o desalinhamento, e não só suspeitar dele.

**NUNCA ACUSE A COLAGEM DELE SEM PROVA.** Duas rodadas foram perdidas assim:
o sistema dizia "você colou pela metade", o arquivo estava inteiro no editor, e
a mensagem mandava consertar o que não estava quebrado. Quando um arquivo
"parecer" incompleto, **meça antes de afirmar** — o menu **Tesouraria CMI →
Diagnosticar o arquivo da tela** conta o que o servidor está lendo (tamanho,
linhas, comentários que chegaram, cada marca). Mensagem de erro descreve o que
foi medido e encaminha para o diagnóstico; não atribui culpa.

O `06_Tipos_E_Regras.gs` confere o fim do arquivo pela marca
`var FIM_DA_TELA = 1;`, que **tem de continuar sendo a última linha do
`<script>`**.

E uma regra de conduta sobre entregar arquivos: **o Taynã cola um arquivo por
vez, ao longo de várias mensagens.** Antes de pedir que ele cole, confira no
histórico do Git **quais arquivos realmente mudaram** (`git log -1 --format=%h
-- <arquivo>`) e peça só esses — pedir um arquivo que não mudou gasta o tempo
dele e mina a confiança no que você pede. E, quando algo falhar por
incompatibilidade entre arquivos, a mensagem tem de dizer **qual** está
atrasado: "colei o errado", "colei pela metade" e "o script quebrou" parecem a
mesma coisa na tela.

E uma regra de conduta que veio junto: **preferência de uma tesouraria não
vira trava.** Quando o Taynã descrever uma praxe local ("aqui a gente sempre
faz assim"), pergunte se é determinação da obra ou jeito da casa. Se for jeito
da casa, vira **nota** — que aparece, explica e deixa seguir — com uma chave
no bloco CONTROLE para desligá-la, porque outra ADM pode fazer diferente e
estar igualmente certa. O caso resolvido assim foi a praxe dos cartões
(`nucleoPraxeDoCartao` / `PRAXE_CARTAO_NA_MESMA_PIA`).

---

## FILTRO-AO-DIGITAR (resolvido pela arquitetura acima)

O Google Sheets **não filtra uma lista suspensa nativa enquanto a pessoa
digita** dentro da célula (isso só existe no Excel 365) — por isso a
decisão de mover todo o preenchimento para o formulário Apps Script: nele,
um campo de busca com JavaScript filtra a lista normalmente, em qualquer
combo (tipo, origem, destino, diácono, cartão), sem depender da limitação
do Sheets. Ainda assim, mantenha uma validação de dados nativa na própria
célula da planilha (lista + "mostrar aviso", nunca "rejeitar entrada") como
uma segunda camada de segurança, para o caso de alguém abrir a aba
diretamente e editar por engano.

**O NÚMERO DA CONTA ACHA COM OU SEM O PONTO** — `10010` encontra `100.10`. O
número do plano de contas se decora pelos dígitos, e parar para digitar o
ponto num campo usado dezenas de vezes por dia é atrito puro. Sai **só o
ponto entre dígitos** (`semPontosEntreDigitos`): tirar todos juntaria
`AG:0552` com o que vem depois e inventaria casamento onde não há. **Nada
disso chega ao papel** — é comparação de busca, e o texto da conta continua
como está cadastrado.

**O CAMPO PIA FILTRA SEMPRE QUE TEM VALOR, E A LISTA ALARGA SOZINHA.** Este
campo já produziu duas armadilhas opostas, e as duas por tentar decidir entre
filtrar e mostrar:

1. Escolher uma conta escrevia a PIA no campo, e dali em diante **nenhuma
   conta de outra PIA era achada naquele lado** — o filtro tinha sido posto
   pelo sistema, não por quem digita.
2. O conserto de então foi guardar à parte "a PIA que a PESSOA escolheu" e
   soltar o filtro ao escolher uma conta. Aí o campo passou a **dizer uma
   coisa e fazer outra**: a janela reabria no último preenchimento, o campo
   dizia `PIA - COXIM`, e digitar `10010` trazia as cinco `100.10`. Foi o
   Taynã quem achou.

Nenhuma das duas era o desenho certo, porque as duas escolhiam um lado de um
par que não precisa ser escolhido. Hoje há **um significado só** — o que está
escrito no campo é o que filtra, tenha sido escrito pela pessoa ou pelo
sistema — e `contasParaBusca` **alarga a lista para o cadastro inteiro quando
o que se digita não existe naquela PIA**, dizendo na lista que alargou.
Alargar calado seria a armadilha 1 de novo, ao contrário.

E a lição de mecânica que veio junto: quando a lista de um combo passa a
depender do que está sendo digitado, **todo** caminho que a lê tem de passar
o texto adiante. Faltou um — o de sair do campo (`itemDoTextoEscrito`) — e o
sintoma não foi "não achou": foi a etapa do documento parar em 2 quando devia
ser 3, três telas adiante.

**AVISO DENTRO DE UMA LISTA SUSPENSA VAI NO TOPO DELA.** A frase do "alarguei"
nasceu no rodapé da lista, e ele não a viu: a janela do Apps Script tem
**altura fixa**, a lista é posicionada por cima de tudo, e numa tela curta é o
**fim** dela que a borda do modal corta. Embaixo do campo também não serve —
a lista aberta passa por cima. O topo da lista é a única parte que nunca
some: ela nasce grudada no campo e cresce para baixo. Conferido em Chromium
de verdade, não só no simulador; o código estava certo e era **o aviso que
não chegava**, que é um defeito tão real quanto o outro.

---

## VALOR POR EXTENSO — FEITO NA ETAPA 3

`numeroPorExtenso(valor)` em `apps_script/03_Formulas_Validacoes.gs`, com
gatilho `onEdit` que escreve o resultado ao lado do valor, em caixa alta e
entre parênteses. Também funciona como fórmula: `=numeroPorExtenso(A1)`.

**"UM MIL", não "MIL"** — decidido pela praxe do documento de valor, não pelo
SIGA. Em texto corrido a gramática dispensa o "um" (*mil reais*); em cheque,
recibo, contrato ou comprovante a praxe é "um mil", porque o extenso existe
para **travar o número** e um extenso começado em "MIL" deixa espaço em branco
antes de si — onde se acrescenta palavra em documento já assinado. É a mesma
razão do caixa alta e dos parênteses. O SIGA segue a mesma praxe
(`(UM MIL E OITOCENTOS REAIS)`) e os dois documentos são arquivados lado a
lado. Para mudar, a constante `DIZER_UM_ANTES_DE_MIL`.

**O extenso ocupa duas linhas mescladas, com quebra de texto** — em uma linha
só, `99.999,99` saía cortado no PDF.

**Campos calculados são protegidos por aviso** (extenso, título, os dois CNPJs
e o total do lote): o Google pergunta "tem certeza?" antes de deixar editar à
mão. Avisa, não bloqueia — e o script continua escrevendo neles.

Bateria de 29 testes no menu (**Testar o valor por extenso**), cobrindo
redondos, centavos, acima de mil, milhão, zero e arredondamento. Detalhes em
`docs/06_formulas_validacoes.md`.

As células exatas estão em `docs/02_especificacao_campos.md` — **não decore
referências de célula, o layout é gerado por código e o mapa de células vive
naquele documento.**

---

## IDENTIFICAÇÃO DO DOCUMENTO — DOIS CAMPOS, REGRAS OPOSTAS

Não é um campo só. São dois (ver `docs/01_regras_negocio.md`, seção 2):

- **Referência** — identificação **própria, obrigatória e única** de cada
  comprovante, formato `CMP-26/NNN` (CMP de *comprovante*), sequencial,
  reiniciando a cada ano; o sistema sugere a próxima automaticamente. O
  prefixo é um dado da aba Cadastros (`PREFIXO_REFERENCIA`), não do código. **Nunca se repete** — é ela que
  amarra o PDF ao arquivo `.md` de recuperação.
- **Numeração SIGA** — o número do lançamento/comprovante no SIGA, quando já
  existir. **Opcional**: se vazio, some do documento. **Pode se repetir à
  vontade — nenhuma trava de duplicidade** (uma NFC-e pode justificar dois
  lançamentos).

Validação dos dois: aceitar letras e números, **avisar (não bloquear)** se
houver acento, pontuação ou caractere especial
(`-/?;:.,'"@#$%¨&*()_+=§`´{[ª}]º~^°<>`). Não há quantidade fixa de dígitos.

## NOMES DE BANCO: ABREVIATURA DE ATÉ 6 LETRAS

No texto das contas, banco entra **abreviado, com no máximo 6 letras**
(`BB`, `SANT`, `CEF`…). A lista fica na aba Cadastros, bloco *ABREVIATURAS
DE BANCOS*, e é editável.

Quando alguém cadastrar um banco que ainda não está lá, o sistema
**sugere** a abreviatura (pela lista, ou deduzindo do nome) e **pergunta se
concorda**; se não concordar, pede a abreviatura desejada e grava no
cadastro. Nunca decide sozinho sem mostrar.

## IMPORTAÇÃO DE DADOS PARA OS CADASTROS

Qualquer lista da aba Cadastros aceita importação pela janela **Tesouraria
CMI → Importar dados para os Cadastros**, de duas formas: **escolhendo um
arquivo** (`.csv`, `.txt`, `.md`, `.tsv` — lido no próprio navegador, sem
subir para o Drive e sem autorização nova) ou **colando o texto** (CSV,
Markdown ou copiado de outra planilha). Dá para **acrescentar** (ignorando repetidos) ou
**substituir a lista inteira**; se alguma linha estiver fora do formato, a
importação é recusada por inteiro, nunca pela metade.

**Antes de gravar**, o sistema confere se os dados parecem ser daquela lista
— por regras fixas de cada lista e comparando a "cara" de cada coluna com os
registros que já existem. Se estranhar, **pergunta antes de gravar** e só
segue com a confirmação do usuário (avisa, não manda). O resultado aparece
numa faixa colorida grudada no topo da janela.

**Armadilha do Apps Script, aprendida na prática:** dentro das janelas do
`HtmlService` o Google **bloqueia `alert()` e `confirm()`**. Toda a
comunicação com o usuário tem de ser feita com elementos da própria página.
E quando o JavaScript da janela tem erro de sintaxe, ela abre normalmente mas
**nenhum botão funciona e nenhum erro aparece** — ao montar uma janela, gere
o HTML e confira a sintaxe do que foi gerado, não só a do arquivo `.gs`.

Quando os dados vierem de outro lugar, o caminho é pedir ao assistente num
chat novo para arrumá-los no formato certo. **O prompt pronto para esse chat
está em `docs/05_importar_dados.md`** — mantenha-o atualizado sempre que uma
lista ganhar ou perder coluna.

## RECUPERAÇÃO: UM .md POR COMPROVANTE GERADO

Todo comprovante gerado salva, ao lado do PDF, um arquivo `.md` com todos os
dados que o originaram, nomeado pela Referência. Serve para refazer ou
conferir um comprovante sem redigitar nada. Detalhe na seção 16 de
`docs/01_regras_negocio.md`.

---

## COMO ENTREGAR UMA ETAPA AO TAYNÃ

O ritmo que funcionou nas etapas 1 a 3 e vale repetir:

1. **Construa e confira você mesmo antes de pedir teste.** Há um caminho de
   simulação descrito no `docs/00_estado_do_projeto.md`, seção 8, que pegou
   quase todos os defeitos antes de ele ver.
2. **Uma mensagem, um passo.** "Cole este arquivo, salve, rode isto,
   me diga o que aconteceu." Espere a resposta.
3. **Avise antes de toda tela de autorização do Google**, dizendo o que vai
   aparecer, para ele não abortar achando que é erro.
4. **Termine toda mensagem dizendo qual modelo e qual esforço** ele deve
   escolher para continuar.
5. Quando ele relatar um defeito, procure a **causa**, não o sintoma: várias
   vezes três sintomas diferentes eram um só defeito.

---

## LEIA TAMBÉM

- `docs/00_estado_do_projeto.md` — **o ponto de retomada; comece por ele.**
- `docs/01_regras_negocio.md` — todas as regras validadas (etapas, tipos,
  assinaturas, compartilhamento no Drive).
- `docs/02_especificacao_campos.md` — mapa de células e fórmulas.
- `docs/03_conciliacao_cartoes.md` — cartões pré-pagos.
- `docs/04_aba_cadastros.md` — estrutura das 11 listas.
- `docs/05_importar_dados.md` — importação, e o prompt pronto para preparar
  dados noutro chat.
- `docs/06_formulas_validacoes.md` — extenso, avisos, campos calculados.
- `docs/07_gerar_pdf.md` — por que não se usa Arquivo → Imprimir.
- `cadastros/` — fonte da verdade das listas.
- `PROMPT_ETAPA_4.md` — o texto para abrir o chat da próxima etapa.
