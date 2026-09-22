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
**uma linha só** em ONDE CADA FINALIDADE VALE, com o código dela e as quatro
colunas que descrevem a combinação — Tipo, Subtipo, Forma e Subforma.

> **Deixe em branco o que não restringe.** Coluna vazia quer dizer "serve para
> qualquer um". Se a finalidade vale em qualquer forma, deixe Forma vazia — não
> escreva uma linha para cada forma.

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

### O que ainda não existe, e ele pediu

Acrescentar pelo **próprio formulário**, no momento do preenchimento, sem abrir
a aba Cadastros: um botão ao lado do campo Finalidade que pergunte o nome e
registre a linha de "onde vale" já com a combinação que está na tela — que é
justamente a parte chata de preencher à mão. **Está por fazer.**

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
