# Fórmulas, validações e valor por extenso (Etapa 3)

Implementado em `apps_script/03_Formulas_Validacoes.gs`. É o que dá vida à
aba "Comprovante", que até a Etapa 1 era só desenho.

**Princípio:** tudo aqui é **automático ou é aviso**. Nada bloqueia o
usuário. A tesouraria tem exceção para quase tudo, e bloquear faria o
usuário contornar o sistema por fora — o que é pior do que o erro.

---

## O que acontece sozinho

| Quando você… | O sistema… |
|---|---|
| digita o **Valor** | escreve o **valor por extenso** ao lado |
| preenche uma linha do **lote** | soma as linhas, põe o total no campo Valor Total e refaz o extenso |
| escolhe a **Origem** ou o **Destino** | preenche os **dois CNPJs** pela PIA e troca o **título** conforme seja mesma PIA ou PIAs diferentes |
| escolhe **Origem = Destino** | avisa (regra 11) |
| escolhe um **tipo de sentido invertido** | avisa que origem recebe crédito e destino é debitado (regra 7) |
| digita uma **Referência** com acento ou símbolo | avisa (regra 2) |

Os avisos aparecem de duas formas: uma **mensagem passageira no rodapé da
tela** e uma **anotação na própria célula** (o cantinho laranja), que fica lá
até o problema ser resolvido.

## Valor por extenso

`numeroPorExtenso(valor)` devolve em CAIXA ALTA e entre parênteses.
Funciona também como fórmula na planilha: `=numeroPorExtenso(A1)`.

| Valor | Sai assim |
|---|---|
| 300 | `(TREZENTOS REAIS)` |
| 1.800 | `(UM MIL E OITOCENTOS REAIS)` |
| 1.250,10 | `(UM MIL E DUZENTOS E CINQUENTA REAIS E DEZ CENTAVOS)` |
| 1.000.000 | `(UM MILHÃO DE REAIS)` |
| 1,01 | `(UM REAL E UM CENTAVO)` |
| 0 | `(ZERO REAIS)` |

Detalhes que a função trata:

- singular e plural (`UM REAL` / `DOIS REAIS`, `UM CENTAVO` / `DOIS CENTAVOS`);
- `CEM` sozinho e `CENTO E …` quando tem resto;
- `DE REAIS` em milhão e bilhão redondos (`DOIS MILHÕES DE REAIS`), mas não
  quando há resto (`UM MILHÃO E QUINHENTOS MIL REAIS`);
- **arredondamento de centavos em conta inteira**: `1,005` em ponto flutuante
  vira `100,49999…` e arredondaria para baixo; a função corrige e devolve
  `UM REAL E UM CENTAVO`.

**"UM MIL" ou "MIL"?** O padrão é **`UM MIL`**, porque é assim que o
comprovante do SIGA escreve (`UM MIL E OITOCENTOS REAIS`). Para escrever
`MIL E OITOCENTOS`, troque `DIZER_UM_ANTES_DE_MIL` para `false` no começo do
arquivo — é a única linha a mudar.

**Bateria de testes:** menu **Tesouraria CMI → Testar o valor por extenso**
roda 29 casos (redondos, com centavos, acima de mil, milhão, zero e os dois
casos de arredondamento) e mostra o resultado na tela.

## Listas suspensas

Menu **Tesouraria CMI → Aplicar listas suspensas no Comprovante**. Põe listas
em Tipo, Status, Origem, Destino e nas duas contas, alimentadas pela aba
Cadastros.

São todas do tipo **"mostrar aviso"**: aceitam um valor fora da lista e só
marcam a célula. É a **segunda camada de segurança** — o caminho normal de
preenchimento é o formulário (Etapa 4), e a lista existe para quem editar a
aba direto, por engano ou por necessidade.

Rodar de novo depois de mexer nos Cadastros **atualiza as listas**.

## Menu da Etapa 3

| Item | Para quê |
|---|---|
| Aplicar listas suspensas no Comprovante | (re)cria as listas a partir dos Cadastros |
| Sugerir próxima referência | escreve a próxima referência livre (`CMP-26/NNN`) sem consumi-la |
| Recalcular o comprovante | refaz extenso, soma, CNPJ, título e avisos de uma vez |
| Testar o valor por extenso | roda a bateria de testes |

## Uma decisão de projeto que vale conhecer

O gatilho que reage às edições (`onEdit`) **engole os próprios erros de
propósito**: um defeito ali não pode travar quem está digitando. O efeito
colateral é que, se algo quebrar, o comportamento some em silêncio.

Por isso existe o **Recalcular o comprovante**: ele faz exatamente as mesmas
contas, mas **sem engolir erro nenhum**. Se alguma coisa parar de funcionar
sozinha, rode esse item — ele mostra a mensagem de erro de verdade.
