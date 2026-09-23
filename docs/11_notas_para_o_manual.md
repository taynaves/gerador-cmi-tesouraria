# Notas para o manual do usuário

Não é o manual — é o caderno onde ele vai nascer. Cada seção aqui responde a
uma pergunta que o Taynã fez durante a construção, escrita para o **diácono
que nunca abriu o projeto**, e não para quem programa.

Quando o manual for escrito, estas seções viram capítulos. Até lá, servem de
resposta pronta.

---

## Acrescentar uma finalidade que não está na lista

**Quando isto acontece.** Você escolheu origem, destino, forma e subforma, e a
finalidade que você precisa não aparece. Duas coisas podem estar acontecendo,
e a linha cinza embaixo do campo diz qual:

- *"3 de 26 valem aqui"* — a finalidade existe no cadastro, mas está registrada
  para outra combinação de contas ou de forma. É caso de acrescentar **onde ela
  vale**.
- *"Nenhuma finalidade cadastrada vale para esta combinação"* — ou a finalidade
  não existe ainda, ou nenhuma foi registrada para essa combinação.

**O caminho, hoje.** Na aba **Cadastros**, duas listas trabalham juntas:

| Lista | O que guarda |
|---|---|
| **FINALIDADES** | a finalidade em si: o código (`F29`, o próximo livre), o nome curto que aparece no comprovante, o que é, as frentes, o histórico do SIGA, a fonte e os cuidados |
| **ONDE CADA FINALIDADE VALE** | uma linha para **cada combinação** em que ela pode ser usada |

Para uma finalidade **que já existe**, mas falta numa combinação: acrescente
**uma linha só** em ONDE CADA FINALIDADE VALE, com o código dela e as seis
colunas que descrevem a combinação — Tipo, Subtipo, Forma, Subforma, Origem e
Destino. As duas últimas são a **natureza** das contas (`CAIXA`, `BANCO`,
`ACG`, `CARTAO`), não o nome delas.

> **Deixe em branco o que não restringe.** Coluna vazia quer dizer "serve para
> qualquer um". Se a finalidade vale em qualquer forma, deixe Forma vazia — não
> escreva uma linha para cada forma. O mesmo vale para Origem e Destino: das
> 39 linhas de hoje, 28 restringem pelo menos um dos dois lados, e 11 não
> restringem nenhum.

Para uma finalidade **nova**: primeiro a linha em FINALIDADES (com um código
que ainda não exista), depois as linhas de onde ela vale.

**Os nomes têm de bater letra por letra** com o que está nas outras listas. Se
você escrever `TRANSFERÊNCIA BANCÁRIA` onde a lista de formas diz
`TRANSF. BANCÁRIA`, a finalidade simplesmente nunca vai aparecer — e não dá
erro nenhum. Depois de mexer, rode **Tesouraria CMI → Conferir cadastros**: ele
lista todo nome citado que não existe.

**A coluna Folha pode ficar vazia.** Ela é o código do levantamento que
originou a linha (`1.1.1`, `2.0.2.2`) e serve para rastrear até o manual da
obra. O sistema não a usa para decidir nada.

### Acrescentar uma finalidade sem sair do formulário — **existe**

Embaixo do campo Finalidade há o link **"acrescentar uma finalidade"**. Ele
abre um painel azul que pergunta só o que o sistema não tem como saber:

| O painel pergunta | O sistema preenche sozinho |
|---|---|
| Nome da finalidade (obrigatório) | O **código** — o próximo livre |
| O que é (opcional) | **Tipo** e **subtipo**, deduzidos das contas |
| Histórico no SIGA (opcional) | **Forma** e **subforma**, como estão na tela |
| Cuidados (opcional) | A **natureza das duas contas** |
| Frentes (já vêm marcadas as de cima) | A **fonte** e a data |

**O painel mostra, antes de gravar, a combinação que vai ficar valendo.** Vale
a pena conferir essa linha: se ela disser `TRANSF. BANCÁRIA` quando você queria
`PIX`, feche o painel e conserte o campo de cima. Uma linha gravada com a
combinação errada não dá erro nenhum — a finalidade simplesmente nunca aparece.

Ao gravar, a finalidade **já fica escolhida** naquele comprovante e a lista
cresce na hora, sem fechar e abrir a janela.

**A fonte dela diz que é decisão desta tesouraria, com a data.** As 26 do
projeto citam manual da obra, uma por uma; esta não veio de manual nenhum.
Quem for conferir o cadastro daqui a dois anos precisa da diferença.

**Ela vale para UMA combinação — a que estava na tela.** Para valer também em
outras, acrescente uma linha em ONDE CADA FINALIDADE VALE, na aba Cadastros,
como está descrito acima.

**E nome repetido é recusado.** A mensagem diz o porquê, e ela quase sempre
está certa: quando uma finalidade existe mas não aparece, o que falta não é
finalidade nova — é uma linha dizendo que ela vale ali também.

---

## Por que uma opção some da lista

Este sistema esconde opção por regra, nunca por acaso, e **sempre diz quantas
sobraram**. Se um campo ficou com menos opções do que você esperava, a linha
cinza embaixo dele explica. Os quatro motivos possíveis:

1. **As duas contas** — a forma tem de existir entre elas (a ACG não saca, o
   caixa só movimenta em espécie).
2. **O que a forma é** — dinheiro exige um caixa numa das pontas;
   transferência bancária exige a mesma instituição; TED e PIX exigem
   instituições diferentes.
3. **A frente marcada** — as caixinhas Piedade / Viagens / Música filtram a
   lista de finalidades. **Nenhuma marcada mostra todas.**
4. **A combinação escolhida** — a finalidade só aparece onde ela foi
   registrada.

E há uma trava só, com porta: quando nenhuma forma vale entre duas contas, o
sistema recusa o lançamento. A saída está na própria aba Cadastros, na chave
`RESTRICOES_ATIVAS` do bloco CONTROLE — é o caminho do ajuste contábil.
