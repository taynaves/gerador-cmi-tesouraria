# Checkpoint da Etapa 7A — o formulário e o menu

**30/09/2026.** A Etapa 7 foi dividida em duas entregas (decisão dele,
29/09/2026): a **7A**, este checkpoint, e a **7B** (pedidos j e l — pastas por
tipo, Lixeira e "OLD"; um arquivo por pedido), que vem depois do teste desta.
Os pedidos e as decisões, palavra por palavra, estão em
`09_pendencias_e_decisoes.md`, seção 6.2.

Soma-se aos checkpoints 13, 14 e 15 — não os substitui.

---

## 1. O que a 7A entrega

| Pedido | O que ficou | Onde |
|---|---|---|
| **a** | Painel roxo → "Trazer os dados de um comprovante (.md)…": o navegador lê o arquivo, o núcleo entende o bloco do fim (do formulário ou da aba) e o que não casa com o cadastro volta **em branco e marcado**. Depois: corrigir, segunda via ou comprovante novo | `nucleoComprovanteDoArquivo` (06), `importarTextoDoMd` (tela) |
| **b** | "Corrigir um comprovante" vale para **qualquer** um: trazendo o `.md` dele | tela |
| **c** | "Exportar…" no rodapé (preenche e exporta: Excel, planilha do Google com uma aba por etapa, `.md`) e o menu "Exportar o comprovante da aba" (a aba como está; o `.md` lido do papel) | `08_Exportar.gs` (**arquivo novo**) |
| **d** | Todo PDF continua gerando o `.md`; o exportado vai para o computador | 05, 08 |
| **e** | A aba livre para editar à mão; **só o extenso** protegido (por aviso) | `protegerCalculados_` (01) |
| **f** | "Abrir a pasta dos arquivos": botão na barra do topo e item de menu — abre no navegador (o Explorador do Windows não é alcançável de uma página) | 08, tela |
| **g** | As bandeiras numa caixa **ao gerar**: ignorar / corrigir por item; "Gerar CMP nº X mesmo assim", "Voltar e corrigir", "Ignorar tudo e gerar"; ignorados no rodapé até fechar a janela | tela |
| **h** | Toda faixa abre caixa (a azul também); o que trava fica vermelho no rodapé ("Não dá para gerar: …") até resolver | tela |
| **i** | As seções uma abaixo da outra, na largura toda; medido preenchido em Chromium | tela, `medir_tela.js` |
| **k** | A aba sem anotação nenhuma; os avisos da aba vão para o canto da tela; a planilha antiga se arruma sozinha no 1º preenchimento | 01, 03, 04 |
| **m** | "Corrigir, segunda via ou outro número": botão na barra do topo e item de menu que abre a janela com o painel aberto; o link continua | 01, 04, tela |
| Cartões (P5) | Um "PIA-X: CARTÃO DE DÉBITO" por PIA; 204.9/201.9 aposentadas; cada cartão só com a sua conta ACG (PagCorp); coluna nova "Sub-tesourarias PagCorp"; a trava do cartão faz parte das restrições | 02, 06, tela |
| Lote (P6) | Data da linha de cima; Enter no último valor cria a próxima; data fora de ordem é bandeira; a coluna diz se cabe cartão | tela |
| Suspender (P6) | Botão que desliga as restrições até o PDF ou fechar a janela; moldura listrada, faixa com "Religar agora", aviso no rodapé; o PDF sai marcado (Histórico, coluna **Restrições**, e `.md`) | tela, 05, 06 |

**1.333 conferências verdes** (859 do servidor, pelos dois caminhos de
escrita; 421 de gestos; 53 da tela), e cada recurso novo foi **quebrado de
propósito** para ver a bateria acusar (seção 3).

---

## 2. Os defeitos que apareceram na construção — com a causa

1. **A caixa que explica o cartão fora do lugar sumia.** Ela abria no
   `aoEscolher` da coluna do lote e, logo depois, a conferência abria a caixa
   vermelha curta ("Cartão de outra conta") **por cima** — a caixa é uma só, e
   a última chamada vence. *Causa:* ordem. A explicação agora abre **depois**
   de `atualizarTotalDoLote()`.
2. **Uma bandeira de proteção que não protegia nada.** A importação do `.md`
   ganhou uma bandeira `importando` para "passar pela trava da segunda via".
   Quebrada de propósito, a bateria não acusou: a trava da segunda via barra
   **gestos** (foco e clique), e escrever nos campos por código nunca os
   dispara. *Causa:* código escrito para um risco que não existia. Saiu, e o
   comentário diz por quê.
3. **Exportar guardava a etapa errada como "último preenchimento".** Cada
   `preencherComprovante` guarda a cópia da sua etapa; a exportação preenche
   todas, e a janela reabriria com a última. *Causa:* o `emitirMovimentacao_`
   tinha esse cuidado e a exportação não herdou. Achado na releitura.
4. **Na janela do Sheets dele (1097 px), a conta mais comprida cortava**
   ("…CC:127884427 - PIE") e os assinantes saíam cinco por linha, com o nome
   cortado. A régua media a tela **vazia**, e vazio nada corta. *Causa:*
   medir o caso fácil. `medir_tela.js` agora preenche com o caso mais largo e
   fotografa (`--foto`).
5. **O simulador limpava só a primeira célula** (`clearNote`) — uma aba com
   anotação passaria como limpa. Corrigido no `mock_planilha.js` antes de
   escrever a conferência do pedido k.
6. **A frase das contas não saía da Observação** de um `.md` da aba quando uma
   das contas não casava com o cadastro (ela era refeita a partir das contas).
   *Causa:* depender do dado que justamente pode faltar. Agora sai pelo
   formato das seis frases possíveis.
7. **Testes esperando 40 ms depois de sair de um campo.** O combo confirma o
   texto escrito 150 ms depois do `blur`; o teste olhava antes. Esperar
   ≥ 220 ms.

---

## 3. O que evitar de antemão (soma-se à seção 4 do checkpoint 13)

- **Aviso novo na conferência leva o 4º elemento** — o campo a que "Corrigir"
  leva (`'cmbForma'`, `'lote'`, `'assinantes'`…). Sem ele, "Voltar e corrigir"
  não vai a lugar nenhum.
- **O que trava entra em `bloqueios`.** Senão vira bandeira — e bandeira se
  ignora. Travar e ignorar não podem valer para o mesmo aviso.
- **Caixa aberta dentro de `aoEscolher`, antes da conferência, é substituída
  pela caixa da conferência.** Abra depois.
- **Nenhum `setNote` na aba Comprovante.** A impressão do Google imprime.
- **Coluna nova no Histórico e nos Cadastros: no fim.** ("Restrições" e
  "Sub-tesourarias PagCorp" estão no fim.)
- **A planilha dele não troca célula que já tem dono.** Por isso o cartão
  casa também pelo **código SIGA** (a conta pai antiga do 127699262 continua
  lá); e o que é novo só chega com **"Criar / recriar a aba Cadastros"**.
- **Suspender não é uma terceira exceção:** é porta da mesma trava
  (`conferirRegraEntreContas_`), como a chave `RESTRICOES_ATIVAS`.
- **Medir preenchido.** CSS se mede em Chromium, com o caso mais largo.
- **Quebre de propósito o que acabou de escrever.** Foi o que achou o item 2
  da seção anterior.

---

## 4. A entrega (arquivos que mudaram desde a Etapa 6)

`01_Layout_Comprovante.gs`, `02_Cadastros.gs`, `03_Formulas_Validacoes.gs`,
`04_Formulario.gs`, `04_Formulario_Tela.html`, `05_Gerar_PDF.gs`,
`06_Tipos_E_Regras.gs` e o **novo** `08_Exportar.gs`. Não mudaram:
`00_Escrita_Rapida.gs`, `07_Relatorio_Mensal.gs`.

Depois de colar: **F5**, **Conferir versões dos arquivos** (as três linhas em
`2026-09-30a`), **Criar / recriar a aba Cadastros**, e — se for testar na aba
inteira — **reimplantar**. Os cenários de teste são o 24 a 31 de
`08_cenarios_de_teste.md`.
