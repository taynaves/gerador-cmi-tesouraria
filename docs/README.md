# Documentação do Gerador de CMI

Refeita em **23/09/2026**, ao fim da Etapa 4. Cada arquivo tem **um assunto**,
e nenhum repete o outro: quando duas explicações moram em dois lugares, um dia
elas discordam e ninguém sabe qual está certa.

**Se você só vai ler um arquivo**, leia o `13_checkpoint_etapa_4.md`. Se vai
retomar o projeto, comece pelo `00_estado_do_projeto.md`.

| Arquivo | O que tem dentro | Quando ler |
|---|---|---|
| `00_estado_do_projeto.md` | O ponto de retomada: o que existe, o que falta, o que já custou caro | Sempre, primeiro |
| `01_regras_negocio.md` | As regras validadas com o Taynã — o que o documento é e como se comporta | Antes de mexer em qualquer comportamento |
| `02_especificacao_campos.md` | O papel, medido: grade, linhas, campos, fontes, réguas | Ao mexer no layout ou no PDF |
| `03_aba_cadastros.md` | As 11 listas, o que cada uma guarda e as regras que protegem os dados | Ao mexer em cadastro |
| `04_conciliacao_cartoes.md` | Divergências entre o PagCorp e o SIGA, e o que ainda falta confirmar | Ao mexer em cartões |
| `05_importar_dados.md` | Como importar listas, e o prompt para preparar dados noutro chat | Ao trazer dados de fora |
| `06_formulas_validacoes.md` | Extenso, somas, a cadeia conta → PIA → CNPJ → cabeçalho, campos protegidos | Ao mexer na aba Comprovante |
| `07_gerar_pdf.md` | Por que o PDF sai por código, e a cópia em planilha | Ao mexer em geração de arquivo |
| `08_cenarios_de_teste.md` | O que o Taynã testa, cenário por cenário, com o resultado esperado | Antes de pedir teste a ele |
| `09_pendencias_e_decisoes.md` | O que está em aberto, e o que foi decidido e não se reabre | Antes de propor qualquer mudança |
| `10_desempenho.md` | Onde o tempo vai, medido, e os caminhos possíveis | Se alguém reclamar de lentidão |
| `11_prompt_finalidades.md` | O prompt que levantou as 26 finalidades, para refazer o levantamento | Se as finalidades mudarem |
| `12_notas_para_o_manual.md` | Trechos prontos para o manual do usuário | Ao escrever o manual |
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

**O `CLAUDE.md`, na raiz, não é documentação do sistema** — é a instrução de
como conduzir o projeto e como falar com o Taynã. Leia antes de tudo.
