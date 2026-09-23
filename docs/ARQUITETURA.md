# Arquitetura — Gerador de CMI (estado atual)

> Visão arquitetural do que **existe hoje** no repositório, em diagramas
> Mermaid que o GitHub desenha sozinho. Levantado em 23/09/2026 a partir dos
> arquivos de `apps_script/`. O detalhe campo a campo está em
> [`02_mapeamento_dados_ATUAL.md`](02_mapeamento_dados_ATUAL.md), e as regras
> em [`01_regras_negocio_ATUAL.md`](01_regras_negocio_ATUAL.md).
>
> Atualizado com a Etapa 5: os 2 ou 3 PDFs num clique, o cabeçalho do
> Recebimento, a aba Histórico e o `.md` de recuperação. O que ainda não foi
> construído está só na seção 5.

---

## 1. Diagrama C4 — Nível 2 (Container)

Tudo roda dentro de **uma planilha Google com Apps Script**: não há servidor
próprio nem banco de dados de fora. A aba **Cadastros** faz o papel do banco;
a aba **Comprovante** é só a camada de impressão.

```mermaid
C4Container
  title Gerador de CMI - Container (estado atual)

  Person(diacono, "Diácono / tesoureiro", "Preenche no computador ou no celular")
  System_Ext(siga, "SIGA", "Onde o PDF é anexado")

  System_Boundary(planilha, "Planilha Google + Apps Script") {
    Container(tela, "Formulário - Tela", "HTML + JS", "04_Formulario_Tela.html")
    Container(nucleo, "Núcleo de Regras", "JS ES5 puro", "06_Tipos_E_Regras.gs - única trava")
    ContainerDb(cadastros, "Aba Cadastros", "Google Sheets", "02_Cadastros.gs - 11 blocos")
    ContainerDb(props, "Propriedades", "PropertiesService", "Última movimentação")
    Container(ctrl, "Formulário - Controlador", "Apps Script", "04_Formulario.gs")
    Container(calc, "Fórmulas e Validações", "Apps Script", "03_Formulas_Validacoes.gs")
    Container(escrita, "Escrita Rápida", "API do Sheets", "00_Escrita_Rapida.gs")
    ContainerDb(comprovante, "Aba Comprovante", "Google Sheets", "01_Layout_Comprovante.gs")
    Container(pdf, "Gerador de PDF", "Apps Script", "05_Gerar_PDF.gs")
    ContainerDb(historico, "Aba Histórico", "Google Sheets", "Uma linha por PDF")
  }

  System_Boundary(google, "Serviços do Google") {
    System_Ext(exportacao, "Exportação do Sheets", "URL /export pdf e xlsx")
    System_Ext(drive, "Google Drive", "Pasta dos PDFs e do .md")
  }

  Rel(diacono, tela, "Preenche")
  Rel(diacono, siga, "Anexa o PDF à mão")
  BiRel(tela, ctrl, "Dados e núcleo / mov", "google.script.run")
  Rel(ctrl, nucleo, "Confere a regra")
  Rel(ctrl, cadastros, "Lê listas, consome Referência")
  Rel(nucleo, cadastros, "Lê regras e finalidades")
  Rel(ctrl, props, "Guarda o mov")
  Rel(ctrl, calc, "Recalcula")
  Rel(calc, cadastros, "Lê ADMs")
  Rel(ctrl, escrita, "Enfileira")
  Rel(escrita, comprovante, "batchUpdate")
  Rel(calc, comprovante, "PIA, CNPJ, título, extenso")
  Rel(ctrl, pdf, "Pede o PDF")
  Rel(pdf, comprovante, "Lê a aba")
  Rel(pdf, exportacao, "UrlFetchApp")
  Rel(pdf, drive, "Salva os PDFs e o .md")
  Rel(pdf, historico, "Uma linha por PDF")

  UpdateRelStyle(nucleo, cadastros, $offsetX="-45", $offsetY="-25")
  UpdateRelStyle(calc, comprovante, $offsetX="40", $offsetY="-25")
  UpdateRelStyle(ctrl, pdf, $offsetX="-70", $offsetY="15")
  UpdateRelStyle(escrita, comprovante, $offsetX="-10", $offsetY="-18")
  UpdateRelStyle(pdf, comprovante, $offsetX="-5", $offsetY="-18")
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Legenda dos containers

| Container | Arquivo | Camada | O que entra | O que sai |
|---|---|---|---|---|
| Aba Cadastros | `02_Cadastros.gs` | **Fonte de dados** | Dados de fábrica, edição na aba, janela de importação, finalidade nova | Listas para a tela, o núcleo e as fórmulas; a contagem da Referência |
| Formulário (Tela) | `04_Formulario_Tela.html` | **Interface** | Dados + núcleo injetado | O objeto `mov` |
| Formulário (Controlador) | `04_Formulario.gs` | **Controlador** | `mov` | Escritas na folha (com o cabeçalho da etapa), pedido dos PDFs |
| Núcleo de Regras | `06_Tipos_E_Regras.gs` | **Lógica de negócio compartilhada** | Contas, formas, regras, finalidades (por parâmetro) | Classificação, formas permitidas, finalidades, textos, recusa |
| Fórmulas e Validações | `03_Formulas_Validacoes.gs` | Lógica de cálculo do papel | Folha + ADMs | Extenso, soma, PIA, CNPJ, título, cabeçalho, avisos |
| Escrita Rápida | `00_Escrita_Rapida.gs` | Infraestrutura | Fila de escritas | Um `batchUpdate` (ou o caminho antigo, se o serviço não estiver ligado) |
| Aba Comprovante | `01_Layout_Comprovante.gs` | **Camada de impressão** | Valores escritos | O que vai para o PDF |
| Gerador de PDF | `05_Gerar_PDF.gs` | **Camada de saída** | `mov` e a aba Comprovante | Os 2 ou 3 PDFs e o `.md` no Drive; a Referência consumida; as linhas do Histórico; `.xlsx` no computador; planilha Google no Drive |
| Aba Histórico | `05_Gerar_PDF.gs` | **Registro** | Cada PDF emitido pelo formulário | Uma linha por PDF, gravada pelo nome da coluna (base do relatório da Etapa 6) |

---

## 2. O núcleo é UMA cópia, usada em dois lugares

O ponto que o C4 não mostra bem: o Núcleo de Regras roda **no servidor e no
navegador**, e é o mesmo texto. Na hora de abrir a janela, o servidor lê o
código-fonte das funções `nucleo*` e o cola dentro do HTML, no lugar da marca
`var NUCLEO_DAS_REGRAS = 1;`.

```mermaid
flowchart LR
  subgraph servidor["Servidor (Apps Script)"]
    N["06_Tipos_E_Regras.gs<br/>funções nucleo*"]
    T["telaComAsRegras_()<br/>regrasParaATela_()"]
    TR["conferirRegraEntreContas_()<br/>a única trava"]
  end
  subgraph navegador["Navegador (janela ou aba inteira)"]
    H["04_Formulario_Tela.html<br/>marca: var NUCLEO_DAS_REGRAS = 1;"]
    C["cópia injetada<br/>das funções nucleo*"]
  end

  N -- "Function.toString()" --> T
  H -- "getContent() sem comentários" --> T
  T -- "HTML montado" --> C
  N --> TR
  C -. "filtra listas e avisa na hora da tecla" .-> H
  TR -. "recusa no servidor, mesmo se a tela falhar" .-> N
```

---

## 3. Fluxo de uma geração de PDF (sequência)

O caminho de um clique em **Preencher e gerar os PDFs…** — ou no menu
**Gerar PDF do comprovante**, que abre o formulário já na caixa de escolha —,
com as idas ao Google em ordem.

```mermaid
sequenceDiagram
  autonumber
  actor D as Diácono
  participant T as Tela<br/>(04_Formulario_Tela.html)
  participant F as Controlador<br/>(04_Formulario.gs)
  participant N as Núcleo<br/>(06_Tipos_E_Regras.gs)
  participant CA as Aba Cadastros
  participant CO as Aba Comprovante
  participant P as Gerador de PDF<br/>(05_Gerar_PDF.gs)
  participant H as Aba Histórico
  participant G as Google<br/>(exportação e Drive)

  D->>T: abre pelo menu Tesouraria CMI
  T->>F: dadosDoFormulario()
  F->>CA: lerCadastro_ (contas, cartões, diáconos, formas, regras, finalidades...)
  F-->>T: listas + próxima Referência + última movimentação
  Note over T,N: o núcleo já veio injetado no HTML
  D->>T: escolhe contas, forma, finalidade, valor, assinantes
  T->>T: nucleoClassificar, nucleoFormasEntre, nucleoFinalidadesQueValem
  D->>T: clica "Preencher e gerar os PDFs…" (ou o menu)
  T-->>D: caixa "Quais PDFs gerar?" (todas marcadas)
  D->>T: deixa marcadas uma, duas ou todas, e confirma
  T->>F: preencherEGerarPdf(mov com etapasEscolhidas)
  F->>P: emitirMovimentacao_(mov)
  P->>N: conferirRegraEntreContas_(mov)
  alt movimento ou forma proibidos e RESTRICOES_ATIVAS = SIM
    N-->>T: erro com o motivo e a porta de saída
  else permitido
    P->>P: etapasPelasContas_ ∩ etapasEscolhidas, na ordem da movimentação
    loop uma vez por etapa marcada
      P->>F: preencherComprovante(mov da etapa)
      F->>CO: fila 1: Status e assinantes da etapa, e o resto
      F->>CO: fila 2: PIA, CNPJ, título, cabeçalho de quem produz (03)
      P->>G: UrlFetchApp /export?format=pdf (de novo se vier 429)
      G-->>P: PDF
      P->>G: createFile na pasta de destino
    end
    P->>CA: consumirReferencia_ UMA vez (bloco CONTROLE)
    P->>G: .md de recuperação (cria, reescreve ou mantém)
    P->>H: uma linha por PDF
    P-->>T: resumo + um link por PDF, a pasta, o .md, o Histórico
    T-->>D: caixa de diálogo com "Abrir APROVADA" / "Abrir PAGA" / ...
  end
```

---

## 4. De onde os dados saem e para onde vão

```mermaid
flowchart TB
  csv[("cadastros/*.csv<br/>dados de fábrica")]
  imp["Janela de importação<br/>e edição da aba"]
  cad[("Aba Cadastros<br/>11 blocos")]
  ctrl{{"CONTROLE<br/>Referência, chaves"}}
  tela["Tela do formulário"]
  mov[/"objeto mov"/]
  comp[("Aba Comprovante")]
  props[("Propriedades<br/>última movimentação")]
  pdf["2 ou 3 PDFs<br/>(um por etapa)"]
  md["Arquivo .md<br/>de recuperação"]
  hist[("Aba Histórico")]
  xlsx["Cópia .xlsx"]
  gsh["Cópia planilha Google"]
  drive[("Google Drive")]
  pc[("Downloads do computador")]
  siga["SIGA"]

  csv -->|"recriar a aba"| cad
  imp --> cad
  cad --> ctrl
  cad -->|"dadosDoFormulario"| tela
  props -->|"reabre preenchido"| tela
  tela --> mov
  mov -->|"preencherComprovante"| comp
  mov --> props
  comp -->|"05_Gerar_PDF"| pdf
  comp --> xlsx
  comp --> gsh
  pdf --> drive
  gsh --> drive
  xlsx --> pc
  pdf -->|"consome uma vez"| ctrl
  mov --> md
  md --> drive
  pdf -->|"uma linha por PDF"| hist
  pdf -.->|"anexado à mão"| siga
```

---

## 5. Fora do diagrama porque ainda não existe

| O quê | Onde se encaixaria |
|---|---|
| Regras de agrupamento do lote | Núcleo de Regras |
| Reabrir um comprovante pela Referência (ler o JSON do `.md`) | Controlador ← Google Drive |
| Relatório mensal a partir do Histórico (Etapa 6) | Novo container, lendo a Aba Histórico |
