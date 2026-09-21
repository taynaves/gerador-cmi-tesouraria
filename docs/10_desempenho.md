# Desempenho — por que demora, e todos os caminhos para chegar ao instantâneo

**Meta do Taynã:** quase instantâneo.

**Onde estamos, medido por ele na planilha de verdade:**

| Momento | Preencher | Preencher **e gerar o PDF** |
|---|---|---|
| Antes de tudo | 25 s | 56 s |
| 1ª rodada (menos idas ao servidor) | 12 s | 29 s |
| **Com a escrita em um pedido só** | **5 s** (4 s no repetido) | **20–25 s** |

**O preenchimento está resolvido: 25 s → 5 s.** O que sobra nos 20 s do PDF é
a **exportação em si** — a chamada em que o Google monta o arquivo. Ela é
~15 s e não passa por nenhum código nosso. Os caminhos que sobram para ela
estão em §2.2, §2.4 e §3.

Este arquivo lista **todas** as opções que existem, do ajuste pequeno à troca
de plataforma, com o ganho esperado e o custo de cada uma. Nenhuma delas está
implementada além das que estão marcadas como **feito**.

---

## 1. Onde o tempo vai, de verdade

A medida mais informativa foi a do próprio Taynã: **preencher com os dados
idênticos aos do lançamento anterior demorou os mesmos 12 s** que preencher
com tudo diferente. Isso diz que o gargalo **não é a quantidade de escrita** —
é o custo fixo de cada conversa com o Google.

Um clique no formulário paga, em ordem:

| Custo | Quanto | Dá para tirar? |
|---|---|---|
| **Partida do script** — o Google carrega e interpreta os 5 arquivos `.gs` a cada execução fria | 1 a 3 s | Só parcialmente (§4.5) |
| **Ida e volta do `google.script.run`** — o pedido atravessa navegador → Google → runtime do Apps Script | 0,5 a 1,5 s por chamada | Já é uma chamada só por clique |
| **Cada operação de planilha** — `getValue`, `setValue`, `hideRows`… | 0,15 a 0,3 s **cada** | **Sim, e é aqui que está o ouro** (§2.1) |
| **A exportação do PDF** — o Google monta o arquivo | 3 a 10 s | Só trocando o jeito de gerar (§3) |

Hoje sobram ~50 operações de planilha por clique. A 0,2 s cada, são 10 s — e
é exatamente o que ele mediu.

**Já feito, e que tirou de 192 para 52 operações:** visibilidade calculada em
vez de perguntada, esconder linhas em blocos, a soma do lote numa leitura só,
a conferência da grade em 2 operações em vez de 140, e escrever só as células
que mudaram. Detalhe em `docs/09_pendencias_e_decisoes.md`, seção 1.

---

## 2. Continuando no Google Sheets

### 2.1 Serviço avançado do Sheets (`Sheets.Spreadsheets.batchUpdate`) ⭐ **FEITO**

**A maior de todas, e não mudou nada da arquitetura.**

**Resultado medido** (idas ao servidor por clique):

| Operação | Original | 1ª rodada | **Agora** |
|---|---|---|---|
| Abrir a janela | 18 | 12 | **10** |
| Preencher o comprovante | 192 | 52 | **9** |
| Preencher e gerar o PDF | 409 | 56 | **24** |

**21 vezes menos** que o ponto de partida, no botão de preencher. E mesmo com
o serviço avançado **desligado** o preenchimento caiu para 34, porque a
segunda metade da mudança não depende dele — ver abaixo.

Duas coisas entraram junto, e a segunda foi obrigatória:

1. **Uma fila só** (`00_Escrita_Rapida.gs`). Valores, visibilidade de linha e
   altura entram numa fila e vão ao Google num pedido único.
2. **Passar o valor em vez de reler.** Dentro de uma fila, ler uma célula cuja
   escrita ainda está na fila devolve o valor **antigo** — o extenso saía do
   número do comprovante anterior. Foi um defeito de verdade, pego pela
   bateria de testes. Agora cada passo do recálculo **recebe** o que precisa.
   A regra continua numa função só; muda só de onde vem o dado de entrada.

**Como se liga** (uma vez, no editor do Apps Script): **Serviços → +** →
*Google Sheets API* → **Adicionar**.

**Se não estiver ligado, nada quebra.** A fila sabe se virar: sem o serviço, ou
se o pedido falhar por qualquer motivo, ela refaz o mesmo trabalho pelo
caminho antigo. Fica lento como antes, e **funciona igual** — o resultado diz
por qual caminho foi, para não haver dúvida silenciosa. A chave
`USAR_ESCRITA_RAPIDA = false` desliga tudo sem mexer em mais nada.

A bateria de 109 conferências roda **pelos dois caminhos** e dá o mesmo
resultado: `node ferramentas_de_conferencia/testar_etapa4.js . --sem-sheets`.

---

#### Como era, para registro

O `SpreadsheetApp` que o projeto usa hoje conversa **uma operação por vez**. O
serviço avançado do Sheets fala a API de verdade do Google, onde **dezenas de
operações viajam num pedido só**: escrever valores, esconder linhas, mudar
altura, mesclar, formatar — tudo junto.

- **Ganho esperado:** de ~50 idas para **1 ou 2**. O preenchimento deve cair
  para 2–3 s (o que sobra é a partida do script e a ida do `google.script.run`).
- **Custo:** reescrever a camada que escreve na planilha. As regras de negócio
  não mudam — muda só o "como falar". É trabalho concentrado num lugar.
- **Como se liga:** no editor do Apps Script, **Serviços → +** → *Google Sheets
  API*. Não exige conta nova nem hospedagem.
- **Risco:** a API é mais verbosa e menos perdoadora; célula mesclada e índice
  de linha são 0-based lá e 1-based aqui. Precisa de teste cuidadoso — o
  simulador do projeto ajuda.

### 2.2 Um clique em vez de dois

Hoje "Preencher" e "Preencher e gerar o PDF" fazem o trabalho **duas vezes**
quando a pessoa usa os dois. Juntar num botão só, ou fazer o "Preencher"
apenas desenhar uma prévia na própria janela (sem tocar na planilha), elimina
uma execução inteira.

- **Ganho:** ~12 s no fluxo em que ele usa os dois botões.
- **Custo:** pequeno. É decisão de desenho, não de engenharia.

### 2.3 Guardar as listas em `CacheService`

`dadosDoFormulario()` lê as oito listas da aba Cadastros toda vez que a janela
abre — hoje são 6 leituras de blocos com 200+ linhas cada.

- **Ganho:** ~1 s na abertura da janela, e some a espera de "Abrindo as
  listas…".
- **Custo:** baixo. Precisa esvaziar o cache quando alguém edita os Cadastros —
  o projeto já tem `esquecerCadastros_()` para isso.

### 2.4 Encolher os intervalos nomeados

Cada lista reserva **200 linhas em branco** de folga (`LINHAS_DE_FOLGA`). Ler
CARTOES traz 211 linhas × 11 colunas = 2.321 células, das quais 42 têm dado.

- **Ganho:** poucos décimos por leitura, mas multiplica por 6.
- **Custo:** mínimo. Baixar a folga para 50 e crescer sob demanda.

### 2.5 Manter o script "quente"

O Apps Script desliga o contêiner depois de alguns minutos parado; a próxima
execução paga a partida de novo.

- **Ganho:** 1 a 3 s na primeira ação depois de um tempo parado.
- **Custo:** baixo, mas é um truque: a janela chama uma função trivial ao
  abrir, só para acordar o contêiner enquanto a pessoa ainda está digitando.
  Hoje `dadosDoFormulario()` já faz esse papel por acidente.

### 2.6 Não escrever na aba até o PDF

A aba Comprovante existe **só para virar PDF**. Se o PDF passar a ser gerado a
partir dos dados (§3.1), a escrita na planilha deixa de estar no caminho
crítico — vira um registro feito depois, ou nem isso.

- **Ganho:** tira as ~50 operações inteiras do clique.
- **Custo:** depende de §3.1.

### 2.7 Tirar os `SpreadsheetApp.flush()` desnecessários

Cada `flush()` força o Google a consolidar tudo o que está pendente. Há
quatro no caminho do preenchimento; provavelmente um basta.

- **Ganho:** décimos a 1 s.
- **Custo:** mínimo, mas exige cuidado: tirar o `flush()` errado faz a
  exportação do PDF pegar a folha antes de ela estar pronta.

---

## 3. Mudando o jeito de gerar o PDF

### 3.1 Montar o PDF a partir de HTML, e não da planilha

Hoje o PDF é a aba exportada pelo Google — uma chamada pesada (3 a 10 s) e
fora do nosso controle. A alternativa é montar o documento em HTML e convertê-lo.

- **Ganho:** os 3 a 10 s da exportação, e possivelmente a escrita na aba (§2.6).
- **Custo:** **alto, e arriscado.** O layout foi aprovado sobrepondo o PDF ao
  comprovante do SIGA, com as réguas caindo dentro de 0,2 pt. Reproduzir isso
  em HTML é refazer o trabalho mais delicado do projeto.
- **Estado:** esta opção foi **fechada** antes ("nada de montar o PDF por
  HTML" — `docs/00_estado_do_projeto.md`, seção 7). Está listada aqui porque a
  meta de velocidade é nova e pode mudar a conta. **Não reabrir sem o Taynã.**

### 3.2 Gerar os 2 ou 3 PDFs numa execução só

Já está previsto para a 2ª parte da Etapa 5. Hoje seriam 3 execuções
completas; numa só, a partida do script e o preenchimento são pagos uma vez.

- **Ganho:** ~2/3 do tempo de uma movimentação completa.
- **Custo:** já estava no plano.

---

## 4. Saindo do Apps Script

### 4.1 Web App do próprio Apps Script (`doGet`/`doPost`)

**Não resolve.** O código continua rodando no mesmo runtime, com o mesmo custo
de partida e as mesmas idas ao Sheets. Muda só onde a página é servida.

### 4.2 Aplicativo web com servidor próprio + API do Google Sheets

Uma página hospedada (Vercel, Cloud Run, o que for) falando direto com a API
do Sheets por conta de serviço.

- **Ganho:** cada operação em lote custa 200–400 ms, sem partida de script.
  **Realisticamente instantâneo** para o preenchimento.
- **Custo:** hospedagem, credenciais de serviço, e sair do "tudo dentro da
  planilha" — hoje qualquer diácono abre o Sheets e usa. Passa a haver um
  endereço, um login e alguém cuidando de um servidor.

### 4.3 Abandonar a planilha como armazenamento

Dados num banco de verdade, PDF montado no servidor. É o desenho de um
sistema, não de um gerador de documento.

- **Ganho:** o máximo possível.
- **Custo:** o máximo também. Perde-se a coisa que fez este projeto andar: o
  Taynã consegue abrir a aba Cadastros e corrigir uma conta sozinho.

---

## 5. Recomendação

**Ordem por retorno sobre esforço:**

1. **§2.1 — serviço avançado do Sheets.** Sozinha, deve levar os 12 s para
   2–3 s, sem mudar arquitetura, sem hospedagem e sem tocar nas regras de
   negócio. **É a que eu faria primeiro.**
2. **§2.2 + §3.2** — um clique em vez de dois, e os 2 ou 3 PDFs numa execução.
   Barato, e some com o pior caso (os 29 s).
3. **§2.3 + §2.4 + §2.7** — os ajustes pequenos. Somam ~2 s.
4. Só então, se ainda não estiver bom, **§4.2** — e aí é outro projeto, com
   outra conversa.

**O que NÃO fazer:** §4.1 (não ganha nada) e §3.1 sem decisão explícita dele
(joga fora o trabalho de layout já aprovado).

**Quando fazer:** decisão do Taynã — ele pediu para **terminar a versão alpha
primeiro**, com todas as regras de negócio e a arquitetura fechadas, e tratar
o desempenho depois. Este arquivo existe para que essa volta não comece do
zero.
