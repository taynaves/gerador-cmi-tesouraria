# apps_script/ — o código que roda dentro da planilha

Cada arquivo aqui é colado dentro da planilha do Google, em **Extensões →
Apps Script**, um por vez. Eles convivem no **mesmo projeto**: o menu está no
`01_Layout_Comprovante` e chama funções de todos os outros.

**Ao acrescentar um arquivo, crie um novo — nunca substitua o anterior.** E o
Apps Script carrega os arquivos em **ordem alfabética**, que é por que a
escrita rápida se chama `00_`.

| Arquivo | O que faz |
|---|---|
| `00_Escrita_Rapida.gs` | Junta dezenas de escritas num pedido só. Não é etapa: é a camada que as outras usam |
| `01_Layout_Comprovante.gs` | Desenha a aba "Comprovante" e **carrega o menu** |
| `02_Cadastros.gs` | A aba "Cadastros" (11 listas) e a janela de importação |
| `03_Formulas_Validacoes.gs` | Extenso, somas, PIA/CNPJ/cabeçalho pela conta, avisos, listas suspensas |
| `04_Formulario.gs` + `04_Formulario_Tela.html` | O formulário — o servidor e a tela |
| `05_Gerar_PDF.gs` | O PDF por código, e a cópia do comprovante em planilha |
| `06_Tipos_E_Regras.gs` | **A regra entre contas**, num lugar só — injetada na tela |

O ponto de retomada do projeto está em `docs/00_estado_do_projeto.md`; a
documentação inteira, em `docs/README.md`.

---

## Como colar cada arquivo

**Script (`.gs`):** painel **Arquivos** → **+** → **Script** → dê o nome
**sem a extensão** (`02_Cadastros`) → cole o conteúdo → salve.

**A tela (`.html`):** **+** → **HTML** → nome `04_Formulario_Tela` → **apague
o modelo que vem escrito** → cole → salve.

**Os dois arquivos da Etapa 4 não podem ter o mesmo nome.** O editor recusa
("já existe um arquivo com este nome") mesmo com um sendo Script e o outro
HTML — a extensão não conta como diferença. Daí o `_Tela`. O nome está escrito
dentro do `04_Formulario.gs`, em
`createHtmlOutputFromFile('04_Formulario_Tela')`: renomear um exige mudar o
outro.

**Depois de colar, recarregue a planilha (F5)** — é o recarregamento que traz
o menu novo.

## Três coisas que já custaram uma rodada cada

**1. A tela é um arquivo HTML de verdade, e não texto montado dentro do
`.gs`.** As janelas das etapas 2 e 3 juntam pedaços de texto para formar a
página, e isso custou caro duas vezes: uma aspa fora do lugar e a janela abre
com **todos os botões mortos, sem nenhuma mensagem de erro**. Num arquivo
`.html` o que está escrito é o que roda, e o próprio editor aponta o erro.

**2. O que o servidor lê da tela vem sem comentário nenhum.** De um arquivo de
80 KB chegam 63 KB, e **zero** comentários. Marca que precisa ser reconhecida
depois é **comando** (`var FIM_DA_TELA = 1;`), nunca comentário.

**3. A aba inteira serve uma fotografia.** Se você mexeu no script e vai
testar na **aba inteira** (`doGet`), **reimplante antes**: Implantar →
Gerenciar implantações → lápis → Versão: **Nova versão** → Implantar. O
endereço não muda. A janela dentro da planilha muda na hora; a aba, não — e
sem isso os dois lados diagnosticam o defeito errado.

## Ligar o serviço avançado do Sheets (faz o formulário voar)

No editor, painel da esquerda: **Serviços → +** → **Google Sheets API** →
**Adicionar**. Uma vez só, e **não pede autorização nova**.

Com ele ligado, preencher um comprovante custa **9 idas ao Google em vez de
192**. Sem ele o sistema funciona igual, só mais devagar — a fila cai sozinha
no caminho antigo. Detalhe em `docs/10_desempenho.md`.

## Publicar a aba inteira (uma vez na vida)

**Implantar → Nova implantação → engrenagem → App da Web.** "Executar como:
Eu"; "Quem pode acessar": quem você decidir. Copie o endereço que termina em
`/exec` e cole na aba Cadastros, bloco CONTROLE, linha `URL_TELA_CHEIA`.

**Enquanto essa linha estiver vazia, o menu nem oferece a aba inteira** —
oferecer um caminho que não existe é pior do que não oferecer nenhum.

O passo a passo também está escrito **dentro do próprio menu**
(`abrirFormularioEmAbaInteira`), porque é uma vez na vida: quem for fazer isso
daqui a um ano não vai lembrar de procurar na documentação.

## Conferir o código antes de colar na planilha

```
node ferramentas_de_conferencia/testar_etapa4.js  .              # 585
node ferramentas_de_conferencia/testar_etapa4.js  . --sem-sheets # as mesmas, pelo caminho antigo
node ferramentas_de_conferencia/testar_gestos.js  .              # 213
node ferramentas_de_conferencia/testar_tela.js    .              # 53
node ferramentas_de_conferencia/conferir_tela.js apps_script/04_Formulario_Tela.html /tmp
node ferramentas_de_conferencia/medir_tela.js                    # mede num Chromium de verdade
```

Instalar uma vez: `npm install jsdom playwright --no-save` — **as duas no
mesmo comando**.

As duas primeiras linhas rodam **a mesma bateria pelos dois caminhos de
escrita**. Se derem resultados diferentes, a fila está escrevendo diferente do
`SpreadsheetApp` — e é isso que não pode acontecer.

## Duas advertências sobre rodar os menus

**"Recriar layout do Comprovante" redesenha a aba do zero.** Por isso **nunca
ajuste a aba Comprovante à mão**: o ajuste se perde. Mudança de layout se pede
no código.

**"Criar / recriar a aba Cadastros" NÃO apaga o que você cadastrou.** Ela
acrescenta o que falta, completa coluna nova, desentorta linha desalinhada e
tira só o que está na lista de aposentadas. **Não escreve por cima de célula
que já tem dono** — e a consequência disso está em `docs/03_aba_cadastros.md`,
seção 4.

## No celular

**Abra a planilha pelo navegador**, não pelo aplicativo do Google Planilhas: o
aplicativo não roda menus nem janelas de Apps Script. Pelo Chrome funciona, e
a tela vira uma coluna só abaixo de 760 px.
