> **ARQUIVO HISTÓRICO.** Ele conta como o projeto estava quando foi escrito,
> e é guardado por isso. **Não é o estado de hoje** — para o que vale agora,
> veja `docs/00_estado_do_projeto.md`, `docs/13_checkpoint_etapa_4.md` e
> `PROMPT_ETAPA_5.md`.

# PROMPT INICIAL — cole isto no Claude Code para começar

Copie o texto do bloco abaixo (tudo, do "Olá" até o fim) e cole como sua
primeira mensagem no Claude Code, dentro da pasta deste projeto.

---

```
Olá! Vamos construir juntos o "Gerador de Comprovantes de Movimentação
Interna (CMI)" da Tesouraria da Piedade — Regional Coxim-MS.

Antes de qualquer coisa, leia o arquivo CLAUDE.md na raiz deste projeto.
Ele explica quem eu sou, o que o projeto faz, e duas regras de negócio
que são o coração do sistema (a lógica de 2 ou 3 documentos por
movimentação, e as condições de agrupamento). Leia também os arquivos
dentro de docs/ e cadastros/ antes de escrever qualquer código.

Contexto importante sobre mim: não sou programador e tenho dificuldade
com projetos técnicos. Preciso que você:
- Me guie uma etapa de cada vez, nunca uma lista longa de passos.
- Espere eu confirmar que uma etapa funcionou antes de seguir para a
  próxima.
- Explique em uma frase qualquer termo técnico na primeira vez que
  aparecer.
- Diga exatamente onde clicar (nomes de menus reais do Google Sheets/
  Apps Script), não descrições genéricas.
- Avise antes de etapas que pedem autorização/permissão do Google, para
  eu não estranhar as telas que vão aparecer.

Importante sobre a arquitetura (já decidida, não precisa validar comigo de
novo): ninguém vai digitar direto na planilha. A aba "Comprovante" é só a
camada de impressão/PDF. Todo o preenchimento acontece por um formulário
Apps Script (modal/sidebar em HtmlService), aberto pelo menu "Tesouraria
CMI" — inclusive o cadastro de contas/diáconos/cartões, que também terá
uma seção própria dentro desse mesmo formulário. Veja o detalhe completo
em CLAUDE.md, seção "ARQUITETURA".

Também já revisei o cadastro de cartões com você: leia
docs/cadastros/cartoes.csv (42 cartões, já reconciliados contra o SIGA) e
docs/04_conciliacao_cartoes.md (6 divergências encontradas, que eu vou
resolver com calma — não precisam travar a construção).

Quero que a primeira etapa seja: construir só o layout visual da aba
"Comprovante" no Google Sheets, replicando fielmente a estrutura descrita
em docs/02_especificacao_campos.md (baseada no modelo .xlsx oficial que
está junto no pacote). Sem fórmulas, sem validação, sem formulário ainda —
só o layout, para eu conferir visualmente antes de irmos para a próxima
etapa.

Depois disso, seguiremos nesta ordem (uma de cada vez, cada uma só depois
de eu confirmar a anterior):
1. Aba "Cadastros" (a fonte de dados viva) com as listas de
   cadastros/*.csv
2. Estrutura básica do formulário Apps Script (abrir um modal vazio pelo
   menu "Tesouraria CMI", só para validar que o encanamento funciona)
3. Campos do formulário: número, data, valor (com extenso automático),
   tipo, observação
4. Campos de Origem/Destino no formulário, com busca/filtro, e o alerta
   de origem = destino
5. Campo de assinantes no formulário (busca de diácono + opção de digitar
   manualmente)
6. Seção "Cadastros" dentro do próprio formulário (adicionar/editar conta,
   diácono, cartão sem abrir a planilha)
7. Lógica de 2 ou 3 etapas por movimentação, incluindo a troca de
   cabeçalho por ADM produtora (a regra de ouro do CLAUDE.md)
8. Comprovante agrupado (várias movimentações num só documento)
9. Geração do PDF (um arquivo por etapa, nomenclatura automática)
10. Aba "Histórico" e resumo mensal
11. Compartilhamento no Drive (duas pastas: colaboradores da PIA-Coxim
    e destinatários de outras ADMs)

Pode começar pela etapa 1 (o layout da aba Comprovante)?
```

---

## Depois de colar

O Claude Code vai começar pela aba visual. Quando ele terminar, **abra a
planilha e compare célula por célula com o `.xlsx` original** antes de
dizer "pode seguir". Pequenos ajustes de layout são muito mais baratos de
corrigir agora do que depois de já haver fórmulas em cima.

**Recomendação de modelo/esforço para esta sessão inteira no Claude Code:**
Sonnet, esforço médio, para a maior parte das etapas. Dois pontos onde vale
subir para Opus/esforço alto se travar 2 vezes seguidas: a etapa 2–6 (o
formulário Apps Script propriamente dito, por ser a parte tecnicamente mais
nova do projeto) e a etapa 9 (geração do PDF com 2–3 arquivos por execução,
trocando cabeçalho por etapa). O resto do fluxo é rotina e não deve exigir
mais que Sonnet/médio.
