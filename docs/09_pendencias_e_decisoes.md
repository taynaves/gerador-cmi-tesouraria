# Pendências, regras novas e decisões em aberto

**Atualizado em:** 21/09/2026, depois da 1ª rodada de testes do formulário.

Este arquivo guarda o que o Taynã levantou e **ainda não foi construído**, com
detalhe suficiente para outra conversa retomar sem perguntar de novo. O que já
está pronto está em `docs/00_estado_do_projeto.md`.

---

## 1. Desempenho — resolvido em parte, medido

**O problema medido por ele:** 25 s para *Preencher o comprovante*, 56 s para
*Preencher e gerar o PDF*.

**A causa, medida e não estimada.** No Apps Script cada `getValue`,
`setValue`, `getRowHeight` ou `isRowHiddenByUser` é uma **viagem de ida e
volta pela internet**, e custa o mesmo (~70 ms) faça ela muito ou pouco. O
preenchimento fazia **192** dessas viagens e a geração do PDF, **409** — a
maioria perguntando à planilha coisas que o próprio código acabara de fazer.
A contagem está em `ferramentas_de_conferencia/` (o contador é o
`contar_idas.js`, de rascunho; a lógica está descrita aqui).

**O que foi feito, e quanto rendeu:**

| Operação | Antes | Depois |
|---|---|---|
| Abrir a janela | 18 | 12 |
| Preencher o comprovante | 192 | 52 (41 num 2º lançamento parecido) |
| Preencher e gerar o PDF | 409 | 56 |

As quatro mudanças:

1. **Visibilidade calculada, não perguntada** (`visibilidadeDoModo_`). Eram 90
   perguntas "esta linha está escondida?" por clique. O código acabara de
   esconder essas linhas — já sabia a resposta.
2. **Esconder e mostrar em blocos** (`aplicarVisibilidade_`). As 32 linhas do
   lote são vizinhas: um pedido, não 32.
3. **A soma do lote numa leitura só** (`somarLote_`). Eram até 64 viagens.
4. **Escrever só o que mudou** (`abrirEscritor_` / `fecharEscritor_`) — **ideia
   do Taynã**. Lê o bloco inteiro de uma vez (1 viagem) e escreve só as células
   diferentes. Num 2º lançamento parecido: **2 células escritas, 20 já certas**.
5. A conferência da grade antes do PDF passou a custar 2 viagens em vez de
   ~140. A medição completa continua existindo no menu **Conferir o layout
   antes de gerar**, onde a espera é esperada porque foi pedida.

**As duas saídas que ele propôs, avaliadas:**

- *"Ir preenchendo a planilha a cada campo, em silêncio"* — **não resolve, e
  piora.** O custo não é *quando* a escrita acontece: é o número de viagens.
  Escrever campo a campo faria mais viagens, não menos, e ainda escreveria na
  aba dados de um comprovante que a pessoa ainda pode abandonar. A parte boa
  dessa ideia — não reescrever o que já está igual — foi aproveitada e está no
  item 4 acima.
- *"Refazer como aplicativo web"* — **não é necessário para isto.** O que
  segurava não era o Sheets: era o jeito de conversar com ele. Um aplicativo
  web que falasse com a planilha do mesmo jeito seria igualmente lento, e
  jogaria fora o motor de layout já aprovado contra o SIGA.

**O que ainda sobra e não foi feito:** a exportação do PDF em si é uma chamada
pesada do Google (alguns segundos), fora do nosso alcance. E as ~50 viagens
restantes ainda dão margem — o próximo corte seria escrever a folha inteira
num `setValues` só, o que esbarra em células mescladas e precisa ser testado
na planilha de verdade, não no simulador.

---

## 2. Tipos de movimentação — a reestruturação que ele pediu

A lista de tipos de hoje é uma lista plana e mistura coisas de níveis
diferentes. Ele propôs três níveis, e passou as regras do cotidiano junto.
**Nada disso foi construído ainda.**

### A árvore proposta

- **Transferência (externa) de numerários** — entre departamentos ou entre
  administrações.
  - *entre departamentos* (de uma mesma administração)
  - *entre administrações* (da mesma regional ou de regional diferente, não
    importa)
- **Movimentação interna (de numerários)** — sempre **dentro do mesmo
  departamento** (mesma PIA), diferenciada pela **forma**:
  DINHEIRO · CHEQUE · TRANSF. BANCÁRIA · TRANSF. TED · TRANSF. DOC · SAQUE ·
  PIX.

### As regras do cotidiano que ele passou

| Regra | Consequência para o sistema |
|---|---|
| Contas da ACG só movimentam **entre contas**, nunca em numerário | forma "DINHEIRO" não pode valer quando um dos lados é ACG |
| Entre a ACG e outra instituição financeira, **somente PIX** | as outras formas somem quando o par é ACG ↔ banco |
| **Entre contas da ACG** a movimentação é possível | |
| Entre uma tesouraria (uma conta) e um **cartão**, possível | |
| Cartões, além de compras, fazem **transferência de retorno** à conta que os carregou, e **saque** no banco 24h | |
| **Nenhuma conta da ACG recebe dinheiro em espécie** — é uma *fintech*, não tem agência física, logo não recebe depósito | ACG nunca é destino de um lançamento em espécie |
| Cartões de **atendimento** são vinculados a uma sub-secretaria, mas **sempre recebem crédito da conta ACG da Piedade da PIA em questão** | |
| Cartões de **viagem** são vinculados à conta de viagem da PIA regional (hoje PIA-COXIM) e **sempre são carregados a partir da conta de viagens da ACG na regional** | |

**Como isso deve aparecer:** ele quer que um campo restrinja o outro, em vez
de pedir a mesma informação duas vezes — ver o item 4 abaixo.

---

## 3. Configuração das relações entre contas

Funcionalidade nova que ele pediu: um **ambiente de configuração das contas**
onde, além de cadastrar cada conta, se estabelecem **as regras de associação
entre elas** (quem pode ser origem de quem, e com que forma).

- Vir **pré-configurado** com os relacionamentos da determinação **nacional**.
- Permitir que **cada regional ajuste** as suas, porque a situação local varia.
- Ter uma **caixa de marcar para desligar as restrições**, para o caso de um
  ajuste legítimo que fira a regra.

Isso é a generalização natural das regras do item 2 — em vez de escrevê-las no
código, elas viram dados numa lista da aba Cadastros. **Recomendação:** fazer
depois que o Taynã aprovar a árvore de tipos do item 2, porque a estrutura da
tabela de relações depende dela.

---

## 4. Ajustes do formulário ainda por fazer

| # | O que | Observação |
|---|---|---|
| 4.1 | **Tipo e modo de lançamento estão redundantes**: escolher "carregamento em lote" no Tipo e "vários lançamentos" no Valor é dizer a mesma coisa duas vezes. Um campo deve restringir o outro, nos dois sentidos | pedido dele, cenário 6 |
| 4.2 | **Lançamento único de cartão** precisa de um campo para o número do cartão. Hoje, no modo único, a tabela some e não há onde informá-lo — e são cartões pré-pagos corporativos, o número é obrigatório | cenário 6i |
| 4.3 | **Gerar os 2 ou 3 PDFs de uma vez.** A janela já tem tudo o que é preciso para as três etapas; hoje sai um por clique | cenário 8g — é a 2ª parte da Etapa 5 |
| 4.4 | **Não limpar o formulário ao reabrir** — trazer os dados do último lançamento — e ganhar um **botão "Limpar"** para começar do zero de propósito | pedido dele |
| 4.5 | **Tela maximizável**, mostrando todos os campos de uma vez | a janela do Apps Script tem tamanho fixo; dá para aumentar, e há como abrir em barra lateral ou aba inteira — decidir qual |
| 4.6 | **Cartão reutilizado por outra pessoa** por tempo determinado. O cadastro precisa guardar o histórico de responsáveis, não só o atual | ver os dois `.txt` exportados do SIGA que ele enviou |

---

## 5. Correção de lançamento — **feito**

Ele levantou logo no começo: *"precisa permitir ajustar ou corrigir lançamento
equivocado, sem gerar nova referência"*.

Já funciona, e por construção: `consumirReferencia_` **só anda para a frente**,
então gerar de novo com o mesmo número não move a contagem. O que faltava era
o caminho de volta — depois de gerar, o campo já mostrava o número seguinte.
Agora a faixa verde traz o botão **"Saiu errado? Corrigir e gerar de novo com
CMP-26/00X"**, que devolve o número anterior com o motivo já escrito.

---

## 6. Contas: o que entrou e o que falta confirmar

**Entrou** (`02_Cadastros.gs`), passando de 14 para 23 contas:

- `100.10 - CAIXA OBRA DA PIEDADE` em **todas as PIAs** (era só em Coxim);
- PIA-SONORA e PIA-SÃO GABRIEL ganharam `201.9 - CARTÃO DE CRÉDITO` e
  `204.9 - CARTÃO DE DÉBITO`, completando as listas que ele mandou;
- PIA-COXIM ganhou `201.9 - CARTÃO DE CRÉDITO`, que faltava ao lado da 204.9.

**Falta confirmar com ele:**

1. **PIA-COSTA e PIA-ALCINÓPOLIS** têm `201.9` e `204.9` também? Só a `100.10`
   foi acrescentada nelas, porque ele não mandou a lista dessas duas.
2. O grupo contábil da `201.9` foi escrito como `201 - OUTRAS OBRIGAÇÕES`, por
   analogia com a `204.9`. Conferir o nome certo no plano de contas.
3. PIA-COXIM tem `100.20` (viagens) e `100.30` (assembleias) além da `100.10`.
   As outras PIAs também, ou só a `100.10`?

---

## 7. Efeito colateral conhecido das contas novas

Agora que todas as PIAs têm a `100.10`, buscar `coxim 100.10` no formulário
devolve **quatro** contas, não uma: Sonora, São Gabriel e Alcinópolis também
são da **ADM Coxim-MS**, e a busca olha a linha de baixo (grupo contábil e
ADM) além do nome da conta. Não é defeito — é a busca fazendo o que deve. Para
achar uma só, use o nome da PIA: `PIA-COXIM: 100.10`.
