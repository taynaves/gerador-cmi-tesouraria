# Contexto Institucional Resumido

Conferido em 23/09/2026. Este arquivo traz só o essencial para entender o
domínio. As regras de
negócio detalhadas do CMI estão em `01_regras_negocio.md` — não repita
nada daqui lá, nem vice-versa.

## O que é a "Piedade"

A Obra da Piedade é o departamento assistencial da Congregação Cristã no
Brasil (CCB). Cada administração regional (ADM) mantém uma ou mais "PIAs"
(pontos/postos de atendimento da Piedade), cada uma com seu próprio
conjunto de contas no plano de contas do SIGA (caixa, banco, cartão).

## O que é o SIGA

Sistema Integrado de Gestão Administrativa da CCB — é onde os lançamentos
contábeis reais são feitos e onde os comprovantes gerados por este
projeto são **anexados como prova documental**, não onde eles são gerados.
Este projeto não se conecta ao SIGA; ele só produz o PDF que depois é
anexado manualmente lá.

## Estrutura de contas usada neste projeto (visão geral)

- **Grupo 100 (CAIXA):** dinheiro físico, por finalidade (Piedade, Viagens
  Missionárias, Assembleias e Reuniões).
- **Grupo 101 (BANCOS CONTA MOVIMENTO):** contas correntes/pagamento
  (Banco do Brasil, Santander, ACG), por finalidade.
- **Grupo 204 (OUTRAS OBRIGAÇÕES):** cartão de débito vinculado à conta
  ACG.
- Cada PIA tem seu próprio subconjunto dessas contas — o código reduzido
  se repete entre PIAs (ex.: `100.10` existe em toda PIA), mas são contas
  distintas entre si. Ver `cadastros/contas_por_pia.csv`.

## Diáconos e assinatura

O corpo de diáconos da Piedade assina os comprovantes. A frequência com
que cada diácono costuma assinar (mais frequente / média / esporádica) é
só uma conveniência de ordenação nas listas suspensas — não é uma regra
de quem pode ou não assinar. Ver `cadastros/diaconos.csv`.

## Projetos irmãos já existentes (não duplicar, apenas saber que existem)

- **Gerador de CIs** — gera Comunicações Internas em `.docx`, mesma
  Secretaria da Piedade, sistema totalmente separado deste.
- **Gestor de Documentos** — mescla/divide PDFs e renomeia digitalizações
  contábeis do Drive da Secretaria. Ferramenta separada, útil de saber
  que existe caso surja sobreposição de pasta no Drive.
- **Sistema de Gestão Normativa da Piedade** — mapeamento de normas
  contábeis (NBC/ITG, CFC/CRC) e processos do SIGA. Se, no futuro, for
  preciso fundamentar alguma regra deste projeto num manual normativo,
  esse sistema já tem parte do levantamento feito — não recomeçar do
  zero sem checar lá primeiro.
