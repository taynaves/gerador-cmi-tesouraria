# O prompt das FINALIDADES — 2ª versão

**Por que houve uma segunda versão.** A primeira trouxe de volta uma lista de
*despesas* — "alimentação do necessitado", "custeio de funeral", "vestuário" —
e nada daquilo é um CMI. O comprovante documenta **dinheiro andando entre
contas da própria obra**; pagar um fornecedor ou socorrer um irmão é outro
documento, com outra rotina. O prompt não tinha dito isso com todas as letras,
e o outro chat preencheu o silêncio com o que o manual tem de mais visível.

A correção não foi só escrever a frase que faltava. Esta versão **entrega a
árvore pronta**, gerada pelo próprio motor de regras do sistema: as 13
folhas de tipo, subtipo, forma e subforma que realmente existem hoje, com
os pares de contas de cada uma. Assim o outro chat não tem o que adivinhar —
ele preenche, não inventa. Gerar essa lista custou um script de trinta linhas;
a rodada perdida custou mais.

**Se o cadastro de contas mudar, esta árvore muda.** Ela sai de
`formasEntreContas_` rodando sobre as contas ativas. Para refazê-la, o caminho
está no fim deste arquivo.

---

## O texto, para colar no chat do projeto "Secretaria da Piedade — Gerador de CIs"

```
Preciso das FINALIDADES das movimentações do Comprovante de Movimentação
Interna (CMI) da tesouraria da Piedade, ADM Coxim-MS.

=====================================================================
LEIA ISTO PRIMEIRO — UMA TENTATIVA ANTERIOR ERROU AQUI
=====================================================================

O CMI documenta DINHEIRO ANDANDO ENTRE CONTAS DA PRÓPRIA OBRA: de um caixa
para um banco, de uma conta ACG para um cartão pré-pago, de um departamento
para outro, de uma administração para outra. Origem e destino são SEMPRE
contas da própria tesouraria.

O CMI NÃO É pagamento, NÃO É despesa, NÃO É benefício a terceiro.

Por isso NADA disto é finalidade de um CMI, e não deve aparecer na resposta:
alimentação do necessitado, vestuário, contas de consumo do atendido, custeio
de funeral, ajuda a ministro, compra de instrumento, material de escritório,
cadeira de rodas, auxílio em calamidade. Tudo isso é DESPESA — sai da conta
para um terceiro, e é documentado por outro instrumento.

Uma tentativa anterior devolveu exatamente essa lista. Se a sua resposta
tiver uma linha em que o dinheiro sai da obra, ela está errada.

A finalidade de um CMI responde: POR QUE esse dinheiro precisou mudar de
conta? Exemplos do tipo certo de resposta (confirme, corrija ou amplie pelas
fontes): abastecer o caixa para os atendimentos da semana; recolher ao banco
a sobra do caixa; carregar o cartão pré-pago do colaborador; devolver ao
banco o saldo não usado do cartão; concentrar saldo antes da prestação de
contas; aplicar sobra de caixa; resgatar aplicação para honrar compromisso;
repassar a outra administração o que lhe cabe.

=====================================================================
CONSULTE, NESTA ORDEM
=====================================================================

1. Os manuais de contabilidade e as documentações da CCB deste projeto.
2. Os artefatos que você mesmo já produziu neste projeto.
3. O que já foi conversado aqui sobre a rotina da tesouraria da Piedade.

Cite a FONTE (manual, capítulo, item, ou o artefato) de cada finalidade.
Se algo não estiver em nenhuma dessas fontes, NÃO INVENTE: ponha na seção
"O QUE NÃO ENCONTREI" e diga onde aquilo provavelmente estaria.

=====================================================================
O RECORTE: TRÊS FRENTES, E SÓ ELAS
=====================================================================

PIEDADE · VIAGENS MISSIONÁRIAS · MÚSICA.

Não inclua o que, pela documentação interna, pertence a outra área da
administração. Quando uma finalidade valer para uma frente e não para outra,
diga qual.

=====================================================================
A ÁRVORE JÁ EXISTE — VOCÊ PREENCHE, NÃO INVENTA
=====================================================================

Estas são as 13 folhas que o sistema realmente permite hoje, cobrindo 36 pares
de naturezas de conta. Elas foram geradas pelo motor de regras dele, e não
escritas à mão. Os quatro níveis são TIPO, SUBTIPO, FORMA e SUBFORMA.

1. TRANSFERÊNCIA (externa) DE NUMERÁRIOS
  1.1 ENTRE ADMs
    1.1.1 PIX   [contas: ACG -> BANCO / BANCO -> ACG]
    1.1.2 SAQUE
      1.1.2.1 CHEQUE   [contas: BANCO -> CAIXA]
      1.1.2.2 DINHEIRO   [contas: BANCO -> CAIXA / CAIXA -> BANCO / CAIXA -> CAIXA / CARTAO -> CAIXA]
    1.1.3 TRANSF. BANCÁRIA   [contas: ACG -> ACG / ACG -> CARTAO / CARTAO -> ACG / CARTAO -> CARTAO]
  1.2 ENTRE DEPARTAMENTOS
    1.2.1 PIX   [contas: ACG -> BANCO / BANCO -> ACG]
    1.2.2 SAQUE
      1.2.2.1 CHEQUE   [contas: BANCO -> CAIXA]
      1.2.2.2 DINHEIRO   [contas: BANCO -> CAIXA / CAIXA -> BANCO / CAIXA -> CAIXA / CARTAO -> CAIXA]
    1.2.3 TRANSF. BANCÁRIA   [contas: ACG -> ACG / ACG -> CARTAO / CARTAO -> ACG / CARTAO -> CARTAO]
2. MOVIMENTAÇÃO INTERNA (de numerários)
  2.0 (sem subtipo)
    2.0.1 PIX   [contas: ACG -> BANCO / BANCO -> ACG / BANCO -> BANCO]
    2.0.2 SAQUE
      2.0.2.1 CHEQUE   [contas: BANCO -> CAIXA]
      2.0.2.2 DINHEIRO   [contas: BANCO -> CAIXA / CAIXA -> BANCO / CAIXA -> CAIXA / CARTAO -> CAIXA]
    2.0.3 TED   [contas: BANCO -> BANCO]
    2.0.4 TRANSF. BANCÁRIA   [contas: ACG -> ACG / ACG -> CARTAO / BANCO -> BANCO / CARTAO -> ACG / CARTAO -> CARTAO]

Vocabulário das naturezas de conta:
  CAIXA  = grupo 100, dinheiro em mãos na tesouraria
  BANCO  = grupo 101, conta movimento (BB, Santander)
  ACG    = grupo 101 também, a fintech da obra (PagCorp)
  CARTAO = grupos 201/204, cartão pré-pago, emitido pela ACG

NÃO acrescente, remova nem renumere ramos. Se faltar uma combinação que a
documentação exige, escreva-a na seção "O QUE NÃO ENCONTREI" explicando qual
regra do sistema a estaria barrando — não a enfie na árvore.

=====================================================================
ENTREGA 1 — AS FINALIDADES DE CADA FOLHA DA ÁRVORE
=====================================================================

Para CADA folha (1.1.1, 1.1.2.1, 1.1.2.2, 1.1.3, 1.2.1, ... 2.0.4 — são 13),
entregue:

- CARACTERIZAÇÃO: em uma frase, que movimentação é essa na prática.
- QUANDO ACONTECE: a situação da rotina que a provoca.
- FINALIDADES: as razões documentadas para ela acontecer. Numere-as dentro da
  folha (ex.: 2.0.2.2.1, 2.0.2.2.2). NOME CURTO de até 60 caracteres — é o que
  vai aparecer no formulário e no comprovante.
- FRENTES: PIEDADE, VIAGEM, MUSICA (quais podem usar).
- FONTE de cada finalidade.
- CUIDADOS: o que a documentação exige nesse caso (prazo, autorização,
  assinatura, comprovação, limite de valor).

Se uma folha não tiver nenhuma finalidade documentada, diga isso — não
preencha por simetria.

Repita finalidade em folhas diferentes SÓ quando ela realmente couber nas
duas; use o mesmo nome curto, para eu poder juntá-las.

=====================================================================
ENTREGA 2 — OS DOIS CSVs
=====================================================================

CSV 1 — as finalidades, sem repetição:
  Codigo,Nome,Caracterizacao,Frentes,Fonte,Cuidados

CSV 2 — onde cada uma vale:
  Codigo_da_finalidade,Folha,Tipo,Subtipo,Forma,Subforma,Por_que

"Folha" é o código da árvore (ex.: 2.0.2.2). "Por_que" é uma frase curta que o
sistema mostra ao usuário quando a finalidade não aparece numa combinação.

=====================================================================
DECISÕES JÁ TOMADAS — NÃO REABRA
=====================================================================

Você fez nove perguntas na tentativa anterior. Ficam respondidas assim:

1. O QUE SIGNIFICA CADA TIPO. Não é rotina do SIGA. O sistema deduz das duas
   contas: mesma PIA = MOVIMENTAÇÃO INTERNA (de numerários); PIAs diferentes
   da mesma ADM = TRANSFERÊNCIA (externa), subtipo ENTRE DEPARTAMENTOS; ADMs
   diferentes = TRANSFERÊNCIA (externa), subtipo ENTRE ADMs. Ninguém escolhe
   tipo nem subtipo à mão.

2. CHEQUE NOMINAL EM REMESSA. Neste sistema CHEQUE só existe como subforma de
   SAQUE, e saque exige um caixa em uma das pontas. Logo, remessa entre ADMs
   de banco para banco não é cheque. Fica fora. Se o manual exigir o
   contrário, escreva em "O QUE NÃO ENCONTREI" — não crie forma nova.

3. e 4. GRUPO 7 E REGRA REVERSA. O problema some com a árvore acima: a
   finalidade agora é declarada POR FOLHA, e não numa lista solta que depois
   precise ser restringida. Não proponha "dispensa finalidade" nem regras ao
   contrário — preencha a folha, e deixe vazia a que não tiver finalidade
   documentada.

5. EMERGÊNCIA E CALAMIDADE. São circunstâncias de DESPESA, não de
   movimentação entre contas. Fora. O que pode entrar é a movimentação que
   uma delas provoca — por exemplo, abastecer o caixa às pressas —, e aí a
   finalidade é o abastecimento, não a calamidade.

6. SIGILO DO MINISTÉRIO. Não se aplica: nenhuma finalidade de CMI nomeia
   atendido nem beneficiário. O comprovante fala de contas.

7. INSTRUMENTO PARA QUEM. Compra de instrumento é despesa. Fora. O que entra
   é a movimentação que a antecede — por exemplo, suprir o caixa ou carregar
   o cartão da Música —, se a documentação a descrever.

8. MATERIAL DE ESCRITÓRIO. Despesa. Fora, pelo mesmo motivo.

9. CADEIRA DE RODAS E BENS MÓVEIS. Despesa ou patrimônio. Fora.

Em uma frase: das nove, sete caem porque a resposta era sobre despesa, e o
CMI não documenta despesa.

=====================================================================
COMO RESPONDER
=====================================================================

1. Um resumo de meia página: quantas folhas você conseguiu preencher, quantas
   ficaram vazias, que fontes usou.
2. A ENTREGA 1, folha por folha, na ordem da árvore.
3. A ENTREGA 2, os dois CSVs.
4. "O QUE NÃO ENCONTREI".
5. "O QUE PRECISO QUE VOCÊ CONFIRME" — só o que for mesmo decisão de
   tesouraria, não detalhe de formato.

Não resuma as tabelas nem corte linhas por serem muitas. Se não couber numa
resposta, entregue em partes e avise que vai continuar.
```

---

## Como refazer a árvore quando o cadastro mudar

A lista das 13 folhas não foi escrita à mão: ela sai de
`ferramentas_de_conferencia/listar_combinacoes.js`, que roda
`formasEntreContas_` sobre cada par de contas ativas, com o resultado reduzido a
`tipo · subtipo · forma · subforma · natureza de origem → natureza de destino`.

Repare que **ausência na árvore nem sempre é regra**: não há `BANCO → BANCO`
entre administrações porque a PIA-COSTA ainda não tem conta no BB ou no
Santander, e não porque alguma regra proíba. Quando uma conta nova entrar, a
árvore muda — e é por isso que ela se gera, em vez de se manter.

## O que fazer com a resposta

1. Conferir o recorte com o Taynã, principalmente a coluna *Frentes*.
2. Importar o CSV 1 num bloco novo dos Cadastros (`FINALIDADES`); a chave é o
   `Codigo`, e coluna nova vai no fim.
3. Importar o CSV 2 num bloco `REGRAS DE FINALIDADE`, no mesmo desenho das
   REGRAS ENTRE CONTAS: vazio = livre, lista = fechada.
4. No formulário, o campo Finalidade vira um encadeamento como o de
   forma → subforma, com filtro pelos níveis da árvore.
