# Desempenho — onde o tempo vai, medido

**Meta dele:** quase instantâneo. **Decisão dele:** terminar a versão alpha
primeiro, com as regras e a arquitetura fechadas, e tratar o desempenho
depois. Este arquivo existe para que essa volta não comece do zero.

---

## 1. Onde estamos — medido por ele, na planilha de verdade

| Momento | Preencher | Preencher **e gerar o PDF** |
|---|---|---|
| Antes de tudo | 25 s | 56 s |
| Depois de reduzir as idas ao servidor | 12 s | 29 s |
| **Com a escrita num pedido só** | **5 s** | **~24 s** |

**O preenchimento está resolvido: 25 s → 5 s.** O que sobra é a **exportação
do PDF em si** — a chamada em que o Google monta o arquivo. A conta fecha:
24 s ≈ 5 s de preenchimento + **~19 s de exportação**, que não passa por
nenhuma linha de código nosso.

**Dentro do Google Sheets, ~19 s para exportar este documento é o piso.**

## 2. Por que demorava

A medida mais informativa foi dele: **preencher com dados idênticos aos do
lançamento anterior demorou os mesmos 12 s** que preencher com tudo diferente.
Ou seja, o gargalo **não era a quantidade de escrita** — era o custo fixo de
cada conversa com o Google.

| Custo | Quanto | Dá para tirar? |
|---|---|---|
| Partida do script (o Google carrega os arquivos `.gs` a cada execução fria) | 1 a 3 s | Só parcialmente |
| Ida e volta do `google.script.run` | 0,5 a 1,5 s **por chamada** | Já é uma chamada por clique |
| **Cada operação de planilha** (`getValue`, `setValue`, `hideRows`…) | 0,15 a 0,3 s **cada** | **Era aqui que estava o ouro** |
| A exportação do PDF | ~19 s | Só trocando o jeito de gerar |

## 3. O que já foi feito

- **A escrita rápida** (`00_Escrita_Rapida.gs`): junta dezenas de escritas num
  pedido só — **de 192 idas ao Google para 9**. É a que trouxe os 12 s para
  5 s.
- Visibilidade **calculada** em vez de perguntada; esconder linhas **em
  blocos**; a soma do lote **numa leitura só**; a conferência da grade em
  **2 operações em vez de 140**; e escrever **só as células que mudaram**
  (`fecharEscritor_`).
- A chave `USAR_ESCRITA_RAPIDA` desliga tudo isso e volta ao caminho antigo —
  e a bancada roda **as mesmas 585 conferências pelos dois caminhos**, para
  provar que desligar não muda nada além da velocidade.

**O que NÃO foi feito, e não deve ser tentado de novo:** havia um atalho que
**pulava o preenchimento** quando a movimentação era "a mesma da última vez".
Ele foi **removido**: confiava numa memória do que fora preenchido em vez da
folha, e bastava a folha mudar por fora para o PDF sair com dado de outro
documento. **Correção vale mais do que as poucas idas que ele poupava.**

## 4. O que ainda dá para ganhar, sem trocar de plataforma

| Caminho | Ganho esperado | Custo |
|---|---|---|
| **Gerar os 2 ou 3 PDFs numa execução só** (já previsto na Etapa 5) | Uma movimentação inteira passa de ~72 s para ~30 s | Baixo — é trabalho já planejado |
| Reduzir o que resta de operações de planilha | Segundos | Baixo, e decrescente |
| **Montar o PDF por HTML** | Tira os ~19 s | **Decisão fechada: não.** Joga fora o layout aprovado contra o SIGA |

**O melhor retorno que resta dentro da planilha é o primeiro** — e ele vem de
graça com a Etapa 5.

## 5. O plano dele para depois do beta — e o requisito que manda nele

Registrado por ele em 21/09/2026:

> "ao final, depois de concluir a versão alpha, depois de criar e usar a
> versão beta, iremos construir tudo em servidor próprio, utilizando uma opção
> gratuita de banco de dados, como o firebase. **Mas atenção! Cada regional,
> ou cada ADM, irá utilizar uma conta firebase e uma conta drive diferente.
> Não podemos misturar dados!**"

**A separação não é preferência: é requisito.** Ela decide a arquitetura
inteira daquela versão, e precisa estar decidida **antes da primeira linha de
código** — separar depois é muito mais caro do que nascer separado.

| Implicação | Por quê |
|---|---|
| **Uma instância por ADM**, não uma instância com um campo "regional" | Um campo que separa é um campo que alguém esquece no filtro. Contas separadas não têm como vazar uma na outra |
| Cada uma com **seu banco e seu Drive** | O PDF assinado é documento daquela tesouraria. Não pode nem transitar por pasta de outra |
| **O código é um só**; o que muda é a configuração | Senão vira um sistema por ADM, e nenhum deles recebe correção |
| A configuração (credenciais, pasta, CNPJ, PIAs) fica **fora do código** | É o que permite uma ADM nova entrar sem programador |
| **Nenhuma tela tem seletor de "qual regional"** | Se existe o seletor, existe o erro de deixá-lo errado |

**A pergunta de desenho daquela versão:** a transferência **entre ADMs** tem,
por definição, dois lados em duas instâncias, e o comprovante de Recebimento
sai com o cabeçalho da ADM de destino. Como as duas instâncias conversam — ou
se não conversam, e o PDF simplesmente vai para a pasta que o destinatário
indicar, como `01_regras_negocio.md` já prevê — é a primeira coisa a decidir.
