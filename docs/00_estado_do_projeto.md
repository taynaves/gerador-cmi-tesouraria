# Estado do projeto — o ponto de retomada

**Atualizado em 23/09/2026**, com a Etapa 5 entregue para o teste dele.
Ramo de trabalho: `claude/cmi-comprovante-layout-quo9wg`.

**Este arquivo é um mapa, não um manual.** Ele diz o que existe, em que pé
está e onde cada coisa está escrita. Ele **não repete** o que já está escrito
noutro lugar — repetir é como duas explicações começam a discordar.

**Antes de escrever a primeira linha de código**, leia a seção 4 do
`13_checkpoint_etapa_4.md`: são quinze coisas a evitar, cada uma paga com pelo
menos uma rodada de conversa.

---

## 1. Em uma frase

Uma planilha do Google com um formulário em Apps Script que gera o
**Comprovante de Movimentação Interna (CMI)** da tesouraria da Piedade
(ADM Coxim-MS, CCB) — o documento que se anexa no SIGA quando dinheiro anda
entre contas da própria obra.

## 2. Em que pé está cada etapa

| Etapa | O que é | Situação |
|---|---|---|
| **1** | O layout da aba Comprovante | **Pronta e aprovada** contra o comprovante do SIGA |
| **2** | A aba Cadastros (11 listas) e a importação | **Pronta** |
| **3** | Extenso, somas, e a cadeia conta → PIA → CNPJ → título → cabeçalho | **Pronta** |
| **4** | O formulário (janela e aba inteira) | **Fechada** — falta a seção de Cadastros dentro dele e desligar `AUTOMATISMOS_NA_PLANILHA` |
| **5** | Gerar os PDFs | **Entregue, esperando o teste dele**: os 2 ou 3 PDFs de uma vez, o cabeçalho do Recebimento, o `.md` de recuperação e a aba Histórico (`07_gerar_pdf.md`, seção 5) |
| **6** | Histórico e relatório mensal | Não começada |

## 3. Os arquivos do sistema

| Arquivo | O que faz |
|---|---|
| `apps_script/01_Layout_Comprovante.gs` | Desenha a aba Comprovante e carrega o menu |
| `apps_script/02_Cadastros.gs` | A aba Cadastros e a janela de importação |
| `apps_script/03_Formulas_Validacoes.gs` | Extenso, somas, PIA/CNPJ/cabeçalho pela conta, avisos, listas suspensas |
| `apps_script/04_Formulario.gs` + `04_Formulario_Tela.html` | O formulário — o servidor e a tela |
| `apps_script/05_Gerar_PDF.gs` | Os 2 ou 3 PDFs por código, o `.md` de recuperação, o Histórico, e a cópia em planilha |
| `apps_script/06_Tipos_E_Regras.gs` | **A regra entre contas, num lugar só** — injetada na tela |
| `apps_script/00_Escrita_Rapida.gs` | Junta dezenas de escritas num pedido (de 192 idas ao Google para 9) |
| `ferramentas_de_conferencia/` | O simulador do Sheets e as baterias |

**A ordem dos nomes importa no Apps Script**: ele carrega os arquivos em ordem
alfabética, e é por isso que a escrita rápida se chama `00_`.

## 4. O que é preciso saber antes de mexer

Nada disto é opinião — cada linha custou um defeito:

- **A regra entre contas mora só no `06_Tipos_E_Regras.gs`**, e a tela a recebe
  **injetada** (o servidor cola o código-fonte das funções `nucleo*` dentro do
  HTML). Nunca escreva regra dentro da tela.
- **O que o servidor lê da tela vem sem comentário nenhum.** Marca que precisa
  ser reconhecida é comando (`var FIM_DA_TELA = 1;`), nunca comentário.
- **Num App da Web não existe planilha ativa** — o id fica nas propriedades do
  script, e cada porta de entrada abre a planilha antes de tudo.
- **O endereço `/exec` serve uma fotografia do código**, tirada ao implantar.
  Mexeu na tela ou no script? Reimplante, ou a aba continua velha, calada.
- **Coluna nova vai no fim da lista**, e **formate como texto antes de
  escrever** qualquer coisa que pareça data.
- **Avisar, nunca bloquear** — com uma exceção declarada: a regra entre contas
  trava, e tem porta (`RESTRICOES_ATIVAS`).

O porquê de cada uma, com o defeito que a originou, está no
`13_checkpoint_etapa_4.md`, seções 3 e 4.

## 5. Onde está escrito o quê

| Pergunta | Arquivo |
|---|---|
| Como conduzir o projeto e falar com o Taynã | `CLAUDE.md`, na raiz |
| O que o documento é e como se comporta | `01_regras_negocio_ATUAL.md` (o histórico está em `_OLD`) |
| De onde cada dado vem e onde é impresso | `02_mapeamento_dados_ATUAL.md` |
| O que cada lista guarda | `03_aba_cadastros.md` |
| O que falta e o que já foi decidido | `09_pendencias_e_decisoes.md` |
| A história, os defeitos e a regra inteira | `13_checkpoint_etapa_4.md` |
| Os dados (contas, cartões, diáconos, finalidades) | `cadastros/*.csv` |

## 6. Como conferir o trabalho sem depender de ele testar

**948 conferências**, e elas existem porque o teste dele custa caro: ele cola
um arquivo por mensagem, à mão. Rodar da raiz do projeto:

```
node ferramentas_de_conferencia/testar_etapa4.js  .              # 658
node ferramentas_de_conferencia/testar_etapa4.js  . --sem-sheets # as mesmas 658, pelo caminho antigo
node ferramentas_de_conferencia/testar_gestos.js  .              # 237
node ferramentas_de_conferencia/testar_tela.js    .              # 53
node ferramentas_de_conferencia/conferir_tela.js apps_script/04_Formulario_Tela.html /tmp
node ferramentas_de_conferencia/medir_tela.js                    # mede num Chromium de verdade
```

Instalar uma vez: `npm install jsdom playwright --no-save` — **as duas no
mesmo comando**, senão cada `--no-save` desinstala a anterior. E cada `.gs`
passa por `node --check` (copiando para `.js` antes).

O que cada bateria prova está no `13_checkpoint_etapa_4.md`, seção 7, e em
`ferramentas_de_conferencia/LEIA.md`.

## 7. O próximo passo

**O teste da Etapa 5 na planilha dele** (cenários 16 a 20 do
`08_cenarios_de_teste.md`). Depois dele, o checkpoint da Etapa 5 e o prompt
da Etapa 6 — que roda num chat novo e limpo. A regra que vale daqui para a
frente: **cada etapa roda num chat novo, e cada uma aprende com todas as
anteriores.**
