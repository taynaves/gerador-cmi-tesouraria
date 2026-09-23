# Cenários de teste — o que pedir ao Taynã, e o que tem de acontecer

Refeito em 23/09/2026, contra o formulário como ele está hoje.

**Antes de pedir qualquer teste a ele, rode as baterias** (`00_estado_do_projeto.md`,
seção 6). O teste dele custa caro: ele cola um arquivo por mensagem, à mão.
Estes cenários são para o que a bancada **não** consegue provar — a planilha
de verdade, o Drive de verdade, o navegador dele.

**Se ele for testar na aba inteira, lembre-o de reimplantar antes** (Implantar
→ Gerenciar implantações → lápis → Versão: Nova versão). Sem isso a aba serve
a versão velha, calada — e os dois vão diagnosticar o defeito errado.

---

## 1. A conta manda: PIA, CNPJ, título e cabeçalho saem dela

**Fazer:** escolher origem `PIA-COXIM: 100.10` e destino `PIA-COXIM: 101.10`.

**Tem de acontecer:**
- os campos de PIA dos dois lados se preenchem sozinhos;
- o título fica `COMPROVANTE DE MOVIMENTAÇÃO INTERNA (de numerários)`;
- a conferência diz **2 documentos** (`APROVADA → EFETIVADA`);
- o cabeçalho traz o CNPJ da ADM Coxim.

## 2. PIAs diferentes: 3 documentos e outro título

**Fazer:** trocar o destino para `PIA-SONORA: 100.10`.

**Tem de acontecer:**
- o título vira `COMPROVANTE DE TRANSFERÊNCIA (externa) DE NUMERÁRIOS`;
- a conferência diz **3 documentos** (`APROVADA → PAGA → RECEBIDA`);
- o campo Tipo mostra `ENTRE DEPARTAMENTOS` junto da forma.

## 3. Um lado nunca mexe no outro

**Fazer:** com os dois lados preenchidos, trocar só a conta de origem.

**Tem de acontecer:** o destino fica **exatamente** como estava — texto, PIA e
tudo. Se ele mexer, é o defeito que fazia o comprovante sair com a conta de
uma PIA e o CNPJ de outra.

## 4. A busca acha com e sem o ponto

**Fazer:** digitar `10010` no campo de conta. Depois `100.10`.

**Tem de acontecer:** os dois trazem as mesmas contas. E o texto que fica no
campo é o **cadastrado**, com ponto — a busca sem ponto é só para procurar.

## 5. O campo PIA filtra, e a lista alarga sozinha

**Fazer:** com `PIA - COXIM` no campo PIA da origem, digitar o número de uma
conta que só existe em outra PIA.

**Tem de acontecer:** a lista **alarga para o cadastro inteiro** e diz isso
**na primeira linha da lista**, em amarelo. Alargar calado seria pior do que
não alargar.

## 6. O movimento proibido trava, e explica

**Fazer:** origem `PIA-COXIM: 100.10` (CAIXA) e destino uma conta **ACG**.

**Tem de acontecer:**
- a Conferência mostra a faixa vermelha explicando que de CAIXA para ACG não
  vale forma nenhuma, e por quê;
- **uma caixa de diálogo abre com o mesmo texto** — uma vez por quebra, não a
  cada tecla;
- os botões de preencher e de gerar ficam **desligados**;
- a mensagem diz como destravar (`RESTRICOES_ATIVAS`), porque a trava tem
  porta.

## 7. Lote: uma linha por lançamento, e a soma

**Fazer:** marcar "Vários lançamentos", acrescentar três linhas com valores
diferentes, preencher e gerar o PDF.

**Tem de acontecer:**
- o rótulo do campo vira **"Valor Total:"**;
- no PDF, a tabela tem **exatamente três linhas**, nenhuma em branco;
- o total é a soma, e o extenso é o do total;
- **o campo do número do cartão some** no modo lote.

## 8. Os avisos avisam, e não travam

**Fazer:** preencher sem escolher forma, com menos de três assinantes, e com o
valor zerado.

**Tem de acontecer:** três avisos amarelos na Conferência, e **os botões
continuam funcionando**. Só a regra entre contas trava.

## 9. A Referência não se digita

**Fazer:** tentar editar o campo Referência. Depois clicar em *"preciso de
outro número"*.

**Tem de acontecer:**
- o campo é somente leitura, e o Tab passa direto por ele;
- o painel de exceções abre com os três motivos (2ª via, histórico
  indisponível, correção), e **exige o motivo escrito**;
- **gerar o PDF consome o número**; preencher não; **salvar uma cópia em
  planilha não**.

## 10. Corrigir sem queimar número

**Fazer:** gerar um PDF e clicar em *"Saiu errado? Corrigir e gerar de novo
com CMP-26/0XX"*.

**Tem de acontecer:** o formulário volta com **o mesmo número** e o motivo já
escrito; gerar de novo **não move a contagem**.

## 11. O resultado aparece onde se está olhando

**Fazer:** preencher o comprovante.

**Tem de acontecer:**
- a faixa verde no topo **e** uma caixa de diálogo no meio da tela;
- a caixa traz *Gerar o PDF agora*, *Voltar ao formulário*, *Fechar*, e os
  dois de levar o comprovante em planilha;
- **a tela não se fecha sozinha** — ela já fez isso, e engolia o retorno.

## 12. Excel e planilha do Google terminam em lugares diferentes

**Fazer:** clicar em *Baixar em Excel*, depois em *Salvar planilha do Google
na pasta*.

**Tem de acontecer:**
- o `.xlsx` cai na pasta **Downloads do computador**, e **não** aparece no
  Drive;
- a planilha do Google aparece **na pasta dos PDFs**, e **nada** é baixado;
- as duas caixas dizem qual é qual.

## 13. A aba inteira, e o fechar

**Fazer:** menu → *Preencher em uma aba inteira* → botão *Abrir o
formulário*. Na aba, clicar em *Fechar esta aba*.

**Tem de acontecer:** a aba fecha e o navegador volta para a planilha. Se ela
tiver sido aberta por um favorito, **não fecha** — e aí a tela oferece o link
de voltar para a planilha, sem chutar a causa.

## 14. Recriar os Cadastros não destrói nada

**Fazer:** acrescentar uma conta à mão na aba Cadastros, mudar o valor de uma
célula do projeto, e rodar **Criar / recriar a aba Cadastros**.

**Tem de acontecer:**
- a conta acrescentada **continua lá**;
- a célula alterada **continua alterada** — recriar não escreve por cima de
  quem já tem dono;
- a janela diz **o que entrou e o que saiu**, com nome;
- rodando duas vezes seguidas, a segunda diz que **nada entrou nem saiu**.

## 15. Importar não estraga a recriação seguinte

**Fazer:** importar `ONDE CADA FINALIDADE VALE` com "substituir", conferir
39 registros — e **rodar a recriação em seguida**.

**Tem de acontecer:** a recriação diz que **nada foi acrescentado**. Se
aparecerem 8 linhas novas, é a armadilha do formato de data voltando
(`05_importar_dados.md`, seção 3) — e ela não aparece onde é feita.

---

# Etapa 5 — os PDFs da movimentação

**Antes:** conferir que `PASTA_DRIVE_PADRAO` aponta para uma pasta de teste,
ou aceitar que os PDFs caiam na pasta da planilha. Cada cenário deixa 2 ou 3
PDFs e um `.md` lá.

## 16. Mesma PIA: a caixa oferece 2, e saem os 2 — ✔ testado 23/09

**Fazer:** origem `PIA-COXIM: 101.10 - BB…`, destino `PIA-COXIM: 100.10 -
CAIXA…`, forma SAQUE → DINHEIRO, valor 300, três assinantes. Clicar
**Preencher e gerar os PDFs…**.

**Tem de acontecer:**
- o campo **Documentos** mostra **2 PDFs**;
- abre a caixa **Quais PDFs gerar?**, com APROVADA e EFETIVADA **marcadas** e
  o botão **Gerar 2 PDFs**;
- confirmando: a caixa diz **2 PDFs gerados**, com *Abrir APROVADA* e *Abrir
  EFETIVADA*; na pasta, os dois PDFs e **um** `CMI-CMP-26-NNN.md`;
- a Referência andou **um** número; a aba **Histórico** ganhou **duas** linhas.

*(A primeira versão, com o seletor no formulário, passou neste cenário com o
CMP-26/014. A caixa veio depois, a pedido dele.)*

## 17. Entre ADMs: 3 PDFs, e o Recebimento com o cabeçalho de Costa Rica

**Fazer:** origem `PIA-COXIM: 101.10 - BB…`, destino `PIA-COSTA: ACG…`, forma
PIX. Responder **"Não, mudam por etapa"** e pôr um assinante diferente em cada
etapa. Gerar com as três marcadas.

**Tem de acontecer:**
- saem **3 PDFs**; a caixa diz que o de RECEBIDA tem o **cabeçalho da ADM
  Costa Rica-MS**;
- no papel: APROVADA e PAGA com o endereço e o CNPJ de **Coxim**; RECEBIDA
  com os de **Costa Rica** (`15.409.246/0001-99`);
- cada PDF com o **seu** assinante; no Histórico, a coluna *Cabeçalho (ADM)*.

## 18. Duas quaisquer, e a correção

**Fazer:** logo depois do 17, **Saiu errado? Corrigir…**, gerar e, na caixa,
**desmarcar a PAGA**.

**Tem de acontecer:** saem **APROVADA e RECEBIDA**, nessa ordem; o número
**não** anda; o `.md` é o **mesmo arquivo**, reescrito; o Histórico ganha
duas linhas com *correção…* e o motivo. Desmarcando tudo, o botão se apaga.

## 19. Segunda via não apaga o original

**Fazer:** *preciso de outro número* → **Segunda via**, com o número do
cenário 16 e um motivo. Gerar.

**Tem de acontecer:** os PDFs saem; o número não anda; a caixa diz que o
arquivo de recuperação **foi mantido o do original**; o Histórico registra
*segunda via…* com o motivo.

## 20. Pelo menu, o mesmo caminho

**Fazer:** fechar o formulário e usar **Tesouraria CMI → Gerar PDF do
comprovante**.

**Tem de acontecer:** abre o formulário **no último preenchimento**, com a
Referência nova e a caixa **Quais PDFs gerar?** por cima. Gerando dali, o
Histórico e o `.md` saem igual ao botão — o menu não é mais um caminho à
parte.

**Se testar na aba inteira: reimplante antes** (Implantar → Gerenciar
implantações → lápis → Versão: Nova versão).

---

## Se algo der errado

1. **Em qual dos dois ele estava — a janela ou a aba?** São versões
   diferentes: a janela serve o código salvo; a aba serve a última
   implantação.
2. **Nunca acuse a colagem sem medir.** O menu *Diagnosticar o arquivo da
   tela* conta o que o servidor está lendo.
3. **Procure a causa, não o sintoma.** Neste projeto, três sintomas
   diferentes já foram um defeito só — mais de uma vez.
