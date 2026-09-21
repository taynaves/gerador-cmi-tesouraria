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
| `apps_script/02_Cadastros.gs` | 2 ✔ | Aba "Cadastros" (8 listas) e a janela de importação |
| `apps_script/03_Formulas_Validacoes.gs` | 3 ✔ | Extenso, somas, PIA/CNPJ/cabeçalho pela conta, avisos, listas suspensas |
| `apps_script/05_Gerar_PDF.gs` | 5 (parcial) | Gera o PDF com margens e orientação fixas no código |
| `apps_script/00_Escrita_Rapida.gs` | 4 ✔ | Junta dezenas de escritas num pedido só (de 192 idas ao Google para 9) |
| `apps_script/04_Formulario.gs` + `04_Formulario_Tela.html` | 4 (quase) | O formulário: combos com filtro, lote, Referência travada, reabre no último preenchimento |
| `apps_script/06_Tipos_E_Regras.gs` | 4 ✔ | A árvore de tipos e as regras entre contas — **a única trava do projeto** |
| `ferramentas_de_conferencia/` | | O simulador do Sheets e as baterias (351 conferências) |
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
- `docs/04_aba_cadastros.md` — estrutura das 8 listas.
- `docs/05_importar_dados.md` — importação, e o prompt pronto para preparar
  dados noutro chat.
- `docs/06_formulas_validacoes.md` — extenso, avisos, campos calculados.
- `docs/07_gerar_pdf.md` — por que não se usa Arquivo → Imprimir.
- `cadastros/` — fonte da verdade das listas.
- `PROMPT_ETAPA_4.md` — o texto para abrir o chat da próxima etapa.
