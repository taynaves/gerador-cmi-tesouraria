# Pacote: Gerador de CMI — Tesouraria da Piedade (v2)

## O que mudou desde a v1

- **Arquitetura:** o preenchimento deixou de ser "digitar direto na
  planilha + sidebar de busca" e passou a ser **um formulário Apps Script
  único**, que cobre filtro-ao-digitar em todos os campos e também vira a
  tela de Cadastros. Isso substitui a antiga "Fase 2 / Web App futuro" —
  não existe mais uma fase separada para celular, já está resolvido desde
  o início.
- **Cadastro de contas (`contas_por_pia.csv`):** reescrito com os códigos
  reais confirmados pela árvore da PagCorp, incluindo a observação de que
  Atendimento e Secretaria (Pia Coxim) são categorias de cartão dentro da
  mesma conta SIGA 101.15, não contas separadas. PIA-Costa entrou como
  "pendente de código SIGA".
- **Cadastro de cartões (`cartoes.csv`):** totalmente reconstruído a partir
  dos dados reais da PagCorp (42 cartões, todos os que existem hoje),
  reconciliado contra os dois arquivos de cadastro do SIGA que você
  enviou.
- **Novo arquivo `docs/03_conciliacao_cartoes.md`:** as 6 divergências
  encontradas na conciliação, cada uma como uma pergunta para você decidir
  — nada foi corrigido por conta própria.
- **Regra de cabeçalho institucional:** deixou de ser inferência — agora é
  regra confirmada. Quando Origem e Destino são de ADMs diferentes, o
  cabeçalho de cada etapa segue **quem produz aquela etapa** (Aprovação e
  Pagamento = ADM de Origem; Recebimento = ADM de Destino).
- **Regra de agrupamento:** confirmada — mesma origem e mesmo destino;
  para cartões, mesma conta ACG do lado de origem ou do lado de destino.

## Como usar

1. Extraia esta pasta inteira na **raiz** do seu projeto no Claude Code
   (substituindo os arquivos da v1, se ainda não tiver começado a construir
   nada em cima deles — se já começou, releia o CLAUDE.md com o Claude Code
   antes de continuar, para ele captar as mudanças de arquitetura).
2. Abra `PROMPT_INICIAL.md`, copie o bloco de texto e cole como primeira
   mensagem no Claude Code.
3. O `CLAUDE.md` é lido automaticamente pelo Claude Code a cada sessão —
   não precisa colar o conteúdo dele, só deixá-lo na raiz.

## O que tem aqui

```
CLAUDE.md                          → contexto e regras de ouro (lido pelo Claude Code)
PROMPT_INICIAL.md                  → texto para você colar e começar
docs/
  01_regras_negocio.md             → todas as regras de negócio validadas
  02_especificacao_campos.md       → mapa de células/fórmulas do modelo
  03_conciliacao_cartoes.md        → NOVO — divergências PagCorp x SIGA, para você decidir
  contexto_resumido.md             → contexto institucional (CCB/Piedade/SIGA)
  modelo_visual_original.xlsx      → o Excel original, como referência visual
  exemplo_preenchido_referencia.pdf → um comprovante real já preenchido, de exemplo
cadastros/
  cnpj_e_localidades.csv           → ADMs, CNPJs e PIAs
  contas_por_pia.csv               → ATUALIZADO — contas com códigos reais da PagCorp
  diaconos.csv                     → diáconos por frequência
  cartoes.csv                      → ATUALIZADO — 42 cartões reais, reconciliados
  tipos_movimentacao.csv           → tipos de movimentação, com aviso de sentido invertido
  status.csv                       → os 4 status e quando cada um se aplica
```

## Pendências que ficaram para você

- **As 6 divergências de `docs/03_conciliacao_cartoes.md`** — decidir e,
  se for o caso, corrigir no SIGA. Não bloqueia a construção.
- **PIA-Costa Rica** — falta o código reduzido do SIGA para as contas de
  Secretaria e Atendimento (já sei os números de conta da PagCorp:
  127884922 e 127884955). Assim que tiver o código SIGA, atualize
  `contas_por_pia.csv`.
- **Cartão 127699486 (Cristiane)** — está na PagCorp mas não no SIGA;
  ver item 1 da conciliação.

## Recomendação de custo/benefício

- **Colar o prompt inicial e acompanhar a etapa 1 (layout):** Sonnet 5,
  esforço médio.
- **Etapas de rotina** (Cadastros, campos simples do formulário, menu,
  agrupamento): Sonnet 5, esforço médio.
- **O formulário Apps Script em si (etapas 2–6) e a geração do PDF
  multi-etapa (etapa 9):** comece em Sonnet/médio; suba para Opus 5/esforço
  alto só se travar 2 vezes seguidas — são os dois pontos tecnicamente mais
  novos do projeto.
- **Resolver as pendências acima (decidir a conciliação, completar código
  SIGA da Costa Rica):** não precisa de IA — é decisão e digitação sua.
- **Ajustes pequenos depois de pronto** (trocar nome, incluir cartão novo):
  edite os CSVs direto, sem IA.
