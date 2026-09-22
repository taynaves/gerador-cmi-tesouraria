# O prompt das FINALIDADES

**Para que serve este arquivo.** O formulário do CMI já sabe deduzir *onde* a
movimentação acontece (tipo e subtipo), *como* o dinheiro anda (forma e
subforma) e *que contas* ela envolve. Falta a pergunta que nenhuma dessas
responde: **para quê**. A lista de finalidades não pode ser inventada por
quem programa — ela sai da documentação da obra e da contabilidade da CCB.

Por isso este prompt existe: o Taynã o cola num chat do projeto
**"Secretaria da Piedade — Gerador de CIs"**, que tem os manuais e os
artefatos, e traz de volta duas tabelas. Com elas na mão, a Etapa 4 ganha o
campo Finalidade encadeado.

**O que já está decidido e o prompt não deve reabrir** — está escrito dentro
dele, mas vale repetir aqui: os quatro eixos (tipo, subtipo, forma, subforma)
existem e não mudam; o que se pede é o quinto.

---

## O texto, para colar no outro chat

```
Preciso de um levantamento de FINALIDADES para o sistema de Comprovantes de
Movimentação Interna (CMI) da tesouraria da Piedade, ADM Coxim-MS.

CONSULTE, NESTA ORDEM:
1. Os manuais de contabilidade e as documentações da CCB que estão neste
   projeto.
2. Os artefatos e documentos que você mesmo já produziu neste projeto.
3. O que já foi conversado aqui sobre a rotina da tesouraria da Piedade.

Se algo não estiver em nenhuma dessas fontes, NÃO INVENTE: liste no fim, numa
seção "O QUE NÃO ENCONTREI", e diga em que documento isso provavelmente
estaria.

=====================================================================
O QUE É UMA FINALIDADE, NESTE SISTEMA
=====================================================================

Finalidade é o PROPÓSITO ou o OBJETIVO da movimentação financeira — a
resposta para "para quê esse dinheiro está sendo movido".

Ela NÃO É, e você não deve listar como finalidade:

- ONDE a movimentação acontece. O sistema já deduz isso das duas contas:
  mesma PIA = movimentação interna; PIAs diferentes da mesma ADM = entre
  departamentos; ADMs diferentes = entre administrações.
- QUE ESPÉCIE de movimentação é (o subtipo): carregamento de cartão
  pré-pago, transferência débito, zerar conta, remessa para outra
  ADM/localidade, aplicação financeira, resgate de aplicação.
- COMO o dinheiro anda (a forma e a subforma): saque (em dinheiro ou em
  cheque), transferência bancária, TED, PIX.
- QUE CONTAS estão envolvidas: "entre bancos", "entre caixas", "entre caixa
  e banco". O sistema escreve isso sozinho na Observação do comprovante.

Cinco linhas já foram retiradas da lista atual justamente por caírem nessas
quatro categorias. Se uma finalidade que você propuser puder ser deduzida das
contas, do par de PIAs ou da forma, ela não é finalidade.

EXEMPLOS DO QUE É FINALIDADE (ilustrativos — confirme ou corrija pelas
fontes): pagamento de energia elétrica da casa de oração; ajuda a ministro;
custeio de viagem missionária; compra de material de limpeza; manutenção
predial; aquisição de instrumento musical para a orquestra.

=====================================================================
O RECORTE: SÓ O QUE A PIEDADE PODE TER
=====================================================================

Esta tesouraria administra TRÊS frentes, e só elas:

- PIEDADE (a obra da piedade propriamente dita);
- VIAGENS MISSIONÁRIAS;
- MÚSICA.

NÃO INCLUA finalidades que, pela documentação interna, pertençam a outras
áreas da administração (obras e construção, manutenção do templo custeada
por outra conta, batismos, tesouraria geral, etc.) — a menos que a própria
documentação diga que a Piedade, Viagem ou Música pode custeá-las. Quando
uma finalidade for possível para uma frente e não para outra, diga isso.

Cite a FONTE de cada grupo de finalidades (manual, capítulo, artigo,
circular, ou o artefato deste projeto), para eu poder conferir.

=====================================================================
ENTREGA 1 — A LISTA, EM NÍVEIS
=====================================================================

A lista vai ser grande. Organize-a em NÍVEIS E SUBNÍVEIS, com no máximo
quatro níveis, numerados assim:

  1.        GRUPO
  1.1       subgrupo
  1.1.1     finalidade
  1.1.1.1   detalhamento (só quando for mesmo necessário)

Regras da lista:

- Cada linha tem um CÓDIGO (a numeração acima) e um NOME CURTO, de até 60
  caracteres, que é o que vai aparecer no formulário e no comprovante.
- Só os níveis mais fundos são escolhíveis. Os de cima servem para filtrar.
- Sem duplicatas: se duas frentes usam a mesma finalidade, ela aparece uma
  vez só, e a coluna de frentes diz quem pode usá-la.
- Entregue também em CSV, com as colunas:
  Codigo,Nome,Nivel,Codigo_do_pai,Frentes,Fonte,Observacao
  (Frentes = PIEDADE, VIAGEM, MUSICA, separadas por ponto e vírgula.)

=====================================================================
ENTREGA 2 — A TABELA DE RELACIONAMENTO
=====================================================================

Para CADA finalidade escolhível, diga com que combinações ela pode existir,
nos quatro eixos que o sistema já tem:

- TIPO: MOVIMENTAÇÃO INTERNA DE NUMERÁRIOS | TRANSFERÊNCIA DE NUMERÁRIOS
- SUBTIPO: Carregamento de cartao pre-pago | Transferencia Debito
  (cartao-cartao ou cartao-conta ACG) | Zerar Conta | Remessa para outra
  ADM/localidade | Aplicacao financeira | Resgate de aplicacao financeira |
  Outro (especificar na Observacao)
- FORMA: SAQUE | TRANSF. BANCÁRIA | TRANSF. TED | PIX
- SUBFORMA (só do SAQUE): DINHEIRO | CHEQUE

Use o mesmo desenho que o sistema já adota nas outras regras, e que não vai
mudar:

  * VAZIO QUER DIZER "SERVE PARA QUALQUER UM". Só escreva valores quando a
    finalidade for REALMENTE restrita — o que ninguém restringiu, vale. Uma
    lista inventada de restrições esconde a opção que a pessoa procura e ela
    não descobre por quê.
  * Restrição é lista fechada: escrever "PIX; TED" quer dizer que só essas
    duas valem.

Entregue em CSV, com as colunas:
  Codigo,Tipos,Subtipos,Formas,Subformas,Por_que,Fonte

"Por_que" é uma frase curta explicando a restrição, que o sistema mostra ao
usuário quando esconde uma opção. Deixe vazio quando não houver restrição.

=====================================================================
COMO RESPONDER
=====================================================================

1. Primeiro um resumo de UMA PÁGINA: quantos grupos, quantas finalidades,
   que fontes você usou, e o que você teve dúvida.
2. Depois a ENTREGA 1 (a lista em níveis, legível, e o CSV).
3. Depois a ENTREGA 2 (o CSV de relacionamento).
4. Por último, "O QUE NÃO ENCONTREI" e "O QUE PRECISO QUE VOCÊ CONFIRME".

Não resuma as tabelas nem corte linhas por serem muitas. Se não couber numa
resposta, entregue em partes e me diga que vai continuar.
```

---

## O que fazer com a resposta

1. Conferir o recorte com o Taynã — principalmente a coluna *Frentes*.
2. Importar a **Entrega 1** num bloco novo dos Cadastros (`FINALIDADES`),
   com as colunas do CSV. Coluna nova vai no fim; a chave é o `Codigo`.
3. Importar a **Entrega 2** num bloco `REGRAS DE FINALIDADE`, no mesmo
   desenho das REGRAS ENTRE CONTAS: vazio = livre, lista = fechada.
4. No formulário, o campo Finalidade vira um encadeamento igual ao de
   forma → subforma, com filtro pelos níveis.
