# Documentação do Gerador de comprovantes para o SIGA

Refeita em **23/09/2026**, ao fim da Etapa 4. Cada arquivo tem **um assunto**,
e nenhum repete o outro: quando duas explicações moram em dois lugares, um dia
elas discordam e ninguém sabe qual está certa.

**Se você só vai ler um arquivo**, leia o `15_checkpoint_etapa_6.md` — e ele
manda ler os anteriores. Se vai
retomar o projeto, comece pelo `00_estado_do_projeto.md`.

| Arquivo | O que tem dentro | Quando ler |
|---|---|---|
| `00_estado_do_projeto.md` | O ponto de retomada: o que existe, o que falta, o que já custou caro | Sempre, primeiro |
| `01_regras_negocio_ATUAL.md` | **Estado atual:** as regras mapeadas do código (`06_Tipos_E_Regras.gs` e cadastros) | Antes de mexer em qualquer comportamento |
| `02_mapeamento_dados_ATUAL.md` | **Estado atual:** de onde cada dado vem, por onde passa e onde é impresso | Antes de mexer no fluxo de dados |
| `ARQUITETURA.md` | **Estado atual:** diagramas Mermaid (C4 nível 2, núcleo injetado, sequência do PDF, fluxo de dados) | Para ver o sistema inteiro de uma vez |
| `01_regras_negocio_OLD.md` | *Histórico* — as regras como foram validadas com o Taynã até a Etapa 4 | Só para consultar a origem de uma decisão |
| `02_especificacao_campos_OLD.md` | *Histórico* — o papel, medido: grade, linhas, campos, fontes, réguas | Só para consultar a origem de uma medida |
| `03_aba_cadastros.md` | As 11 listas, o que cada uma guarda e as regras que protegem os dados | Ao mexer em cadastro |
| `04_conciliacao_cartoes.md` | Divergências entre o PagCorp e o SIGA, e o que ainda falta confirmar | Ao mexer em cartões |
| `05_importar_dados.md` | Como importar listas, e o prompt para preparar dados noutro chat | Ao trazer dados de fora |
| `06_formulas_validacoes.md` | Extenso, somas, a cadeia conta → PIA → CNPJ → cabeçalho, campos protegidos | Ao mexer na aba Comprovante |
| `07_gerar_pdf.md` | Por que o PDF sai por código; os 2 ou 3 PDFs de uma vez, o `.md` de recuperação, o Histórico e a cópia em planilha | Ao mexer em geração de arquivo |
| `08_cenarios_de_teste.md` | O que o Taynã testa, cenário por cenário, com o resultado esperado | Antes de pedir teste a ele |
| `09_pendencias_e_decisoes.md` | O que está em aberto, e o que foi decidido e não se reabre | Antes de propor qualquer mudança |
| `10_desempenho.md` | Onde o tempo vai, medido, e os caminhos possíveis | Se alguém reclamar de lentidão |
| `11_prompt_finalidades.md` | O prompt que levantou as 26 finalidades, para refazer o levantamento | Se as finalidades mudarem |
| `12_notas_para_o_manual.md` | Trechos prontos para o manual do usuário | Ao escrever o manual |
| `15_checkpoint_etapa_6.md` | **A Etapa 6**: o relatório mensal e o nome novo — os defeitos com causa e o que evitar | Ao retomar em chat novo, **primeiro** |
| `16_relatorio_mensal.md` | O relatório mensal: o que é (lista, não soma), a regra de contar cada comprovante uma vez, a aba e o PDF | Ao mexer no relatório ou no Histórico |
| `14_checkpoint_etapa_5.md` | **A Etapa 5**: os PDFs de uma vez, o `.md`, o Histórico — os defeitos com causa e o que evitar | Ao retomar em chat novo |
| `13_checkpoint_etapa_4.md` | **A história, os defeitos com a causa de cada um, e a regra do negócio inteira** | Ao retomar em chat novo |
| `contexto_resumido.md` | O contexto institucional (Piedade, SIGA, PIAs) | Na primeira vez |

**Arquivos que não são texto:**

| Arquivo | O que é |
|---|---|
| `referencia_layout_aprovado.pdf` | O comprovante aprovado — a referência visual do projeto |
| `referencia_siga_comprovante.pdf` | Um comprovante emitido pelo próprio SIGA, de onde saiu a aparência |
| `exemplo_preenchido_referencia.pdf` | Um exemplo real preenchido à mão, do jeito antigo |
| `modelo_visual_original.xlsx` | A planilha Excel original, que vale só por dizer **quais** campos existem |

**Os dados não moram aqui** — as listas (contas, cartões, diáconos, formas,
finalidades) vivem em `cadastros/*.csv`, que é a fonte da verdade, e na aba
Cadastros da planilha, que é a fonte viva.

**Arquivos com sufixo `_OLD` são histórico, não especificação.** O `CLAUDE_OLD.md`, na raiz, é a versão anterior do `CLAUDE.md`.

**O `CLAUDE.md`, na raiz, não é documentação do sistema** — é a instrução de
como conduzir o projeto e como falar com o Taynã. Leia antes de tudo.
