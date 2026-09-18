# Conciliação de Cartões — PagCorp (fonte oficial) x cadastro no SIGA

Conforme solicitado: a **PagCorp é a fonte oficial** (dados da instituição
financeira). O SIGA deve estar espelhado nela. Esta conciliação comparou os
64 registros da árvore de tesourarias da PagCorp (`Dados_usuários.csv` +
imagem da hierarquia) com os dois arquivos de cadastro do SIGA enviados
(`cartões viagem` e `cartões piedade`). O resultado já está incorporado em
`cadastros/cartoes.csv` (42 cartões, coluna `Consta_no_SIGA`). Os pontos
abaixo são as divergências que precisam da sua decisão — não presumi
nenhuma correção sozinho.

## 1. Cartão de Cristiane ausente do SIGA (conta Viagem)

- **Cartão:** 127699486 — "Cristiane irmã da piedade (VIAGEM 94.86)"
- **Está na PagCorp**, sob a conta ACG 127865707 (Viagem, SIGA 10120).
- **Não está** na lista `cartões viagem - cadastro no siga.txt` (que tem
  9 cartões; a PagCorp tem 10 para essa conta).
- Detalhe curioso: o "Centro Custo Cartão" desse registro na PagCorp é
  **"Viagem Costa"**, não "Viagem Coxim" como os outros 9 — mas a conta ACG
  pai é a mesma de Coxim (127865707/10120). Ou seja, um cartão de uso
  ligado a Costa Rica está fisicamente hospedado na conta de Viagem de
  Coxim.
- **Preciso que você confirme:** este cartão deveria estar cadastrado no
  SIGA (e foi esquecido), ou existe algum motivo para ele não entrar no
  CMI por enquanto?

## 2. Cartão de Taynã com rótulo "MÚSICA" mas hierarquia de "Atendimento"

- **Cartão:** 127699064 — apelido "Taynã diácono (MÚSICA 90.64)"
- Na árvore da PagCorp, a **Conta Pai** desse cartão é 127866192
  (ATENDIMENTO — Pia Coxim), **não** 128084027 (Música).
- Ou seja, o nome do cartão fala de Música, mas ele pertence
  organizacionalmente ao Atendimento.
- Ele **não aparece** na lista de cartões Piedade do SIGA que você enviou.
- **Preciso que você confirme:** o apelido está desatualizado (o cartão foi
  remanejado de Música para Atendimento e ninguém renomeou), ou é a
  hierarquia da PagCorp que está errada? Isso decide se ele entra no
  cadastro do CMI como "Atendimento" ou fica de fora até normalizar.

## 3. Dois cartões de Secretaria (Pia Coxim) ausentes do SIGA — inclusive o do próprio exemplo real

- **Cartões:** 127698876 (Gerson, "SECRETARIA 88.76") e 127699726 (Taynã,
  "SECRETARIA 97.26")
- Ambos existem na PagCorp, vinculados à sub-tesouraria 128175981
  (SECRETARIA — Pia Coxim), que por sua vez está sob a mesma conta SIGA
  10115 (101.15) do Atendimento.
- **Nenhum dos dois consta** na lista de 13 cartões que você enviou como
  "cartões piedade - cadastro no SIGA".
- **Isto chama atenção especial:** o cartão 127698876 (Gerson) é exatamente
  o mesmo citado no comprovante-teste real que você me enviou no início
  deste projeto ("Crédito no cartão 127698876 - Gerson colab. piedade") —
  ou seja, esse cartão já foi usado num comprovante de verdade, mas não
  está na lista oficial de cadastro do SIGA que você me passou agora.
- **Preciso que você confirme:** os cartões de Secretaria foram cadastrados
  no SIGA sob outro código que não veio no arquivo enviado, ou realmente
  faltam cadastrar?

## 4. Coluna "Tipo" (Débito/Crédito) incompleta para os cartões da Piedade

- O arquivo `cartões viagem` traz a coluna Tipo preenchida como "Débito"
  para todos os 9 registros.
- O arquivo `cartões piedade` **não tem essa coluna preenchida** para
  nenhum dos 13 registros.
- Você confirmou que **todos os cartões devem ser Débito** (são pré-pagos
  corporativos, sem crédito contratado).
- **Ação sugerida:** ao lançar/conferir esses 13 cartões no SIGA, garantir
  que o campo Tipo seja marcado como Débito em todos, já que o arquivo
  exportado não permite confirmar isso pela ausência da coluna.

## 5. Cartão com "Conta Pai" fora do padrão (José Cavalcanti Costa / "Dede")

- **Cartão:** 127699262 — "Dede diácono (ATENDIMENTO 92.62)"
- Na PagCorp, sua Conta Pai é **127865715** ("Piedade (ADM Coxim)" — um
  nível acima de Atendimento), enquanto todos os outros cartões de
  Atendimento têm Conta Pai **127866192** (Atendimento propriamente dito).
- Ele **está** corretamente listado no SIGA como parte da conta 10115.
- Não acho que isso exija ação sua — é só uma pequena inconsistência de
  organização dentro da própria PagCorp — mas registrei aqui para você
  saber que o cadastro do CMI vai tratar esse cartão como "Atendimento"
  normalmente, apesar da hierarquia visual diferente.

## 6. ADM Costa Rica — contas sem código SIGA

- A árvore da PagCorp mostra claramente **PIA COSTA** com duas
  sub-tesourarias: SECRETARIA (127884922) e ATENDIMENTO (127884955),
  cada uma com cartões próprios (9 cartões ao todo).
- Diferente de Coxim (onde Atendimento e Secretaria são só categorias de
  cartão dentro de **uma única** conta SIGA 10115), em Costa Rica
  Secretaria e Atendimento **parecem ser contas correntes distintas** —
  mas você ainda não me passou os códigos reduzidos do SIGA para elas
  (nem confirmou se elas são, de fato, duas contas separadas no plano de
  contas ou uma coisa só).
- Ficaram registradas em `contas_por_pia.csv` como "Pendente de cadastro",
  para não travar a construção do restante do sistema.

---

## O que fazer com isto agora

Nenhuma dessas 6 divergências te impede de seguir construindo o CMI — o
cadastro de cartões já está completo e utilizável com os 42 registros
encontrados, todos marcados `Sim`/`NAO` na coluna `Consta_no_SIGA`. As
pendências acima são para você resolver com calma (ou levar ao responsável
pela PagCorp/SIGA) e depois só atualizar `cadastros/cartoes.csv` — sem
precisar reabrir o projeto no Claude Code para isso.
