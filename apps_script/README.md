# apps_script/ — o código que roda dentro da planilha

Cada arquivo `.gs` aqui é uma **etapa** do projeto. Eles são colados dentro da
planilha do Google (menu **Extensões → Apps Script**), um por vez, na ordem.

| Arquivo | Etapa | O que faz |
|---|---|---|
| `01_Layout_Comprovante.gs` | 1 | Desenha a aba "Comprovante" (só o visual) |
| `02_Cadastros.gs` | 2 | Monta a aba "Cadastros" com todas as listas do sistema |
| `03_Formulas_Validacoes.gs` | 3 | Extenso, somas, CNPJ automático, avisos e listas suspensas |
| `04_Formulario.gs` + `04_Formulario_Tela.html` | 4 | O formulário: por onde todo o preenchimento passa |
| `05_Gerar_PDF.gs` | 5 (1ª parte) | Gera o PDF com margens e orientação fixas no código |

Os arquivos convivem no **mesmo projeto do Apps Script**: o menu está no
arquivo 01 e chama funções dos outros. Ao acrescentar uma etapa, crie um
arquivo novo (não substitua o anterior).

**A Etapa 4 tem dois arquivos**, e é a única que tem: um Script (`.gs`, o
lado que fala com a planilha) e um HTML (a tela). O ponto de retomada do
projeto inteiro está em `docs/00_estado_do_projeto.md`.

## Etapa 2 — como usar

1. No editor do Apps Script, painel **Arquivos**, clique no **+** →
   **Script** e dê o nome `02_Cadastros`.
2. Cole o conteúdo de `02_Cadastros.gs` e salve.
3. Menu **Tesouraria CMI → Criar / recriar a aba Cadastros**.

A estrutura da aba está em `docs/04_aba_cadastros.md`. Rodar de novo apaga
edições feitas à mão na aba.

Para atualizar uma lista sem digitar linha por linha: **Tesouraria CMI →
Importar dados para os Cadastros**. Aceita **arquivo** (`.csv`, `.txt`,
`.md`, `.tsv`, lido no próprio navegador) ou **texto colado** (CSV, Markdown
ou copiado de outra planilha). Detalhes e o prompt para preparar os dados com
o assistente em `docs/05_importar_dados.md`.

## Etapa 3 — como usar

1. No editor do Apps Script, **+** → **Script**, nome `03_Formulas_Validacoes`.
2. Cole o conteúdo do arquivo e salve.
3. Atualize o `01_Layout_Comprovante` (o menu ganhou cinco itens novos).
4. Na planilha: **Tesouraria CMI → Recriar layout do Comprovante** (a grade
   mudou: são 22 colunas agora) e depois **Aplicar listas suspensas no
   Comprovante**.

Detalhes em `docs/06_formulas_validacoes.md`. Se algum automatismo parar de
funcionar em silêncio, rode **Recalcular o comprovante** — ele faz as mesmas
contas mostrando os erros.

**Campos calculados protegidos:** extenso, título, os dois CNPJs e o total do
lote avisam antes de serem editados à mão ("tem certeza?"). Avisa, não trava.
Repor: **Tesouraria CMI → Proteger os campos calculados**.

## Etapa 1 — como usar

1. Abra a planilha no Google Sheets.
2. Menu **Extensões → Apps Script**.
3. Apague o conteúdo do arquivo `Código.gs` e cole o conteúdo de
   `01_Layout_Comprovante.gs`.
4. Salve (ícone do disquete) e rode a função `criarLayoutComprovante`.

Rodar de novo é seguro: a função apaga e redesenha a aba inteira do zero.
**Por isso, nunca ajuste a aba "Comprovante" à mão** — o ajuste se perde no
próximo `criarLayoutComprovante`. Mudanças de layout se pedem no código.

Depois de rodar, o menu **Tesouraria CMI** oferece duas visualizações:
"Ver como lançamento único" e "Ver como lançamento em lote (5 linhas)".

## Etapa 4 — o formulário

São **dois** arquivos, e os nomes importam.

1. **+** → **Script**, nome `04_Formulario`. Cole `04_Formulario.gs`.
2. **+** → **HTML**, nome `04_Formulario_Tela`. Apague o modelo que vem
   escrito e cole `04_Formulario_Tela.html`.
3. Atualize o `01_Layout_Comprovante` (o menu ganhou o item do formulário,
   no topo).
4. Salve e **recarregue a planilha** (F5) — é o recarregamento que traz o
   menu novo.
5. **Tesouraria CMI → Preencher comprovante (formulário)**.

**Os dois arquivos não podem ter o mesmo nome.** O editor do Apps Script
recusa ("Já existe um arquivo com este nome") mesmo quando um é Script e o
outro é HTML — a extensão não conta como diferença. Daí o `_Tela`. O nome
está escrito em `abrirFormularioCmi()`, na chamada
`createHtmlOutputFromFile('04_Formulario_Tela')`: renomear um exige mudar o
outro.

**A tela é um arquivo HTML de verdade, e não texto montado dentro do `.gs`.**
As janelas das etapas anteriores juntam pedaços de texto para formar a
página, e isso já custou caro duas vezes: uma aspa fora do lugar e a janela
abre com todos os botões mortos, sem nenhuma mensagem de erro. Num arquivo
`.html` nada é gerado — o que está escrito é o que roda, e o próprio editor
do Apps Script aponta o erro.

O que o formulário faz:

- **Filtro enquanto se digita** em todo campo de escolha (tipo, PIA, conta,
  cartão, diácono). Busca por pedaços em qualquer ordem e sem depender de
  acento: "coxim 101" acha
  `PIA-COXIM: 101.10 - BB - AG:0552 CC:16.020-2 - PIEDADE`.
- **Cascata:** a PIA filtra as contas daquele lado; as duas PIAs juntas
  filtram os tipos, pela coluna "Entre PIAs diferentes" do cadastro.
- **Nenhum lado mexe no outro.** Só a lista de tipos depende dos dois.
- **A conta manda:** escolher a conta preenche a PIA daquele lado, e dela
  saem CNPJ, título e cabeçalho.
- **Lançamento único e lote** na mesma tela. Em lote, uma linha por
  lançamento (de 1 a 32) e soma automática.
- **As seis vagas de assinatura**, com a pergunta única "os signatários serão
  os mesmos em todas as etapas?". Se não forem, um bloco por etapa.
- **Conferência que avisa e nunca bloqueia**, num painel ao pé da tela.
- **Gera o PDF sem sair da janela.**

**No celular, abra a planilha pelo navegador**, não pelo aplicativo do Google
Planilhas: o aplicativo não roda menus nem janelas de Apps Script. Pelo
Chrome funciona, e a tela vira uma coluna só abaixo de 760 px.

O formulário **não tem regra própria**: ele chama as funções da Etapa 3
(`numeroPorExtenso`, `somarLote_`, `preencherPiaPelaConta_`,
`atualizarCabecalho_`…) e as da Etapa 5 para o PDF. Não existe uma segunda
versão dessas contas que possa discordar da primeira.

Cada preenchimento fica guardado na planilha
(`PropertiesService`, chave `CMI_ULTIMA_MOVIMENTACAO`), com os assinantes de
cada etapa — é de lá que a Etapa 5 vai tirar os 2 ou 3 PDFs.

### A Referência não se digita

A Referência é **gerada pelo sistema** e o campo é travado — é ela que amarra
o comprovante ao Histórico, e número digitado à mão é número que pode repetir
sem ninguém ver. Ela é **consumida quando o PDF sai**, nunca quando o
formulário abre, e **uma vez só por movimentação**, embora a movimentação
gere 2 ou 3 PDFs com o mesmo número. A sequência recomeça no 1 a cada ano
civil.

Duas exceções existem, atrás do link *"preciso de outro número"*:

| Exceção | O que faz | Consome número? |
|---|---|---|
| **Segunda via** de um comprovante já emitido | Sai com a MESMA Referência do original | Não |
| **Histórico perdido ou fora de alcance** | Número escrito à mão; se for maior que o último, a contagem se acerta por ele | Sim, se for maior |

As duas pedem o **motivo por escrito**, que fica guardado com a movimentação e
vai para o Histórico. O que impede isso de virar rotina não é bloqueio — é o
preço: no caminho normal não se digita nada.

**Ainda falta nesta etapa:** a seção de Cadastros dentro do formulário e o
desligamento do `AUTOMATISMOS_NA_PLANILHA`.

### Cenários de teste

`docs/08_cenarios_de_teste.md` tem 10 cenários com dados escolhidos para que
**cada conferência que falha aponte uma peça só** do código. Os números deles
foram calculados contra o cadastro de verdade, não estimados.

## Conferir o código antes de colar na planilha

`ferramentas_de_conferencia/` roda as três baterias de teste descritas na
seção 8 de `docs/00_estado_do_projeto.md`. Só precisa do Node:

```
node ferramentas_de_conferencia/testar_etapa4.js .
node ferramentas_de_conferencia/conferir_tela.js apps_script/04_Formulario_Tela.html /tmp
node ferramentas_de_conferencia/testar_tela.js .
```

## Etapa 5 (primeira parte) — gerar o PDF sem desformatar

1. No editor do Apps Script, **+** → **Script**, nome `05_Gerar_PDF`.
2. Cole o conteúdo de `05_Gerar_PDF.gs` e salve.
3. Atualize o `01_Layout_Comprovante` (o menu ganhou dois itens no topo).
4. Na planilha: **Tesouraria CMI → Gerar PDF do comprovante**. Na primeira
   vez o Google pede duas permissões novas.

**Não use mais Arquivo → Imprimir.** Os ajustes de impressão do Sheets não
ficam guardados na planilha — ficam no navegador de cada pessoa, e o Google
os redefine sozinho. Agora margem, orientação e escala vivem em
`EXPORTACAO_PDF`, dentro do `05_Gerar_PDF.gs`. Detalhe em
`docs/07_gerar_pdf.md`.

| Ajuste | Valor (fixo no código) |
|---|---|
| Tamanho do papel | A4 |
| Orientação | Retrato |
| Escala | **Normal (100%)** |
| Margens | topo 0,97 cm · base 0,97 cm · esquerda 1,02 cm · direita 0,89 cm |
| Alinhamento | Horizontal: Centro · Vertical: Acima |
| Linhas de grade | desmarcado |

"Ajustar à largura" e "ajustar à altura" mudam o tamanho da letra — não usar.

## As quatro regras do Sheets que este layout respeita

Medidas tiradas de exportações reais. Ignorá-las foi o que fez a primeira
tentativa estourar para 4 páginas:

1. 1 pixel de linha/coluna = **0,75 pt** no PDF.
2. O tamanho da fonte sai exato, mas **só aceita número inteiro** — o Apps
   Script arredonda 7,18 para 8. Nunca usar tamanho fracionado.
3. Topo do texto = `topo_da_linha + (altura − 1,25 × fonte) / 2 − 0,37 pt`.
4. Bordas só existem em 0,75 / 1,5 / 2,25 pt. O documento usa **2,25 nas duas
   réguas do título e 0,75 nas demais**.
5. **Altura mínima de linha:** `fonte × 1,667 + 4,7` px (6 pt = 15 px ·
   7 pt = 16 px · 8 pt = 18 px · 12 pt = 25 px). Linha mais baixa que isso o
   Sheets estica sozinho na exportação — foi o que quebrou a página na
   primeira tentativa. O código aplica o mínimo automaticamente.
6. **Altura útil da folha: 1045 px**, validada em exportação real. Acima de
   ~1048 px o Sheets quebra em duas páginas.

## Decisões registradas nesta etapa

- **Referência visual:** `docs/referencia_layout_aprovado.pdf` (aprovado pelo
  Taynã), nascido do comprovante do SIGA. O código reproduz esse PDF: as 49
  réguas caem nas mesmas posições (diferença de até 0,2 pt) e os campos
  dentro de 1,8 pt.
- **Fontes:** Tahoma 6 pt no corpo, 8 pt no tipo e nos nomes dos signatários,
  7 pt na entidade, 12 pt no título.
- **Caixa alta em todo dado preenchido**; rótulos como escritos, no padrão do
  SIGA. Exceção: nome e cargo dos signatários, que vêm do cadastro.
- **Régua e nota do rodapé coladas no pé da página** (altura útil 1045 px).
- **A conta manda:** escolher a conta preenche a PIA, o CNPJ, o título e o
  cabeçalho (endereço, cidade e CNPJ da ADM) daquele lado.
- **Grade:** 22 colunas (A..V, 694 px) e linhas com nome. Mapa completo em
  `docs/02_especificacao_campos.md`. A antiga coluna C virou quatro (C+D+E+F,
  mesma soma de 58 px) para o campo Conta caber; o bloco da direita ficou como
  estava.
- **Extenso em duas linhas** (`IDENT_2` + `IDENT_2B`, mescladas, com quebra de
  texto): em uma linha só, valores como 99.999,99 saíam cortados. Os 16 px
  vieram da tabela do lote, que passou de 33 para 32 lançamentos.
- **Título automático:** movimentação dentro da mesma PIA →
  "COMPROVANTE DE MOVIMENTAÇÃO INTERNA"; entre PIAs diferentes →
  "COMPROVANTE DE TRANSFERÊNCIA DE NUMERÁRIOS".
- **Rótulo do tipo:** "Tipo Transferência:", como no SIGA.
- **Rodapé:** identificação do formulário em pé na lateral esquerda; abaixo da
  régua, `Emitido em dd/MM/yyyy HH:mm:ss` à esquerda e a nota das 3
  assinaturas à direita — como no SIGA.
- **Tabela do lote** só aparece em lote, com uma linha por lançamento; a
  sobra da folha fica entre a tabela e as assinaturas, que ficam sempre no pé.
- **Valores preenchidos são exemplo.** Para gerar em branco, troque
  `PREENCHER_EXEMPLO` para `false`.
- **Campos calculados protegidos por aviso:** extenso, título, CNPJs e total
  do lote. O Google pergunta antes de deixar editar à mão; ninguém fica
  travado, e o script continua escrevendo neles.
