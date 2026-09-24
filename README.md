# Maternidade em Foco

Crie uma aplicação web responsiva chamada “Centro Cirúrgico Materno”, em português (Brasil), para acompanhamento operacional em tempo real das salas cirúrgicas de uma maternidade.

Objetivo: fornecer um painel para a coordenação do bloco cirúrgico acompanhar salas, pacientes, procedimentos, tempos cirúrgicos, recuperação pós-anestésica, agenda e alertas operacionais.

IMPORTANTE:

- Criar apenas um protótipo funcional com dados fictícios locais/mockados.

- Não criar backend, autenticação real, banco de dados ou integrações externas nesta primeira versão.

- Não usar dados reais de pacientes.

- Usar nomes abreviados ou iniciais e prontuários mascarados.

- Interface com aparência profissional de sistema hospitalar moderno, limpa, clara e de alta legibilidade.

- Priorizar desktop, TV de gestão à vista e boa adaptação para tablet.

- Usar React, TypeScript, Tailwind CSS e componentes modernos.

- Não use excesso de gradientes, animações ou elementos decorativos. Priorize operação rápida e leitura em ambiente assistencial.

Crie as seguintes páginas acessíveis por menu lateral:

1. Dashboard — “Painel de Salas”

- Cabeçalho com título “Bloco Cirúrgico — Maternidade”, data/hora atual simulada, indicador “Atualizado há 12 segundos” e botão/ícone de alertas.

- Cards de resumo:

  - Salas totais: 6

  - Em cirurgia: 3

  - Em preparo: 1

  - Em limpeza: 1

  - Salas livres: 1

  - Ocupação: 83%

  - Procedimentos previstos: 12

  - Realizados: 5

  - Atrasados: 2

- Filtros visuais: Todas as salas, Cesáreas, Emergência, Em atraso.

- Cards grandes para seis salas cirúrgicas, mostrando:

  - Nome da sala.

  - Status colorido.

  - Paciente apenas com iniciais.

  - Prontuário mascarado, exemplo: ******4821.

  - Procedimento.

  - Prioridade: Eletiva, Urgência ou Emergência.

  - Hora prevista e hora de início.

  - Cronômetro/tempo em sala.

  - Equipe principal.

  - Marcos resumidos: admissão, checklist, anestesia, incisão, nascimento, término e saída.

  - Alertas e pendências, quando existirem.

- Criar estas situações de exemplo:

  - Sala 01: Cesárea eletiva em cirurgia desde 09:42.

  - Sala 02: Cesárea de urgência em cirurgia desde 10:03, com alerta de hemocomponentes.

  - Sala 03: Cerclagem em preparo, aguardando consentimento/checklist.

  - Sala 04: Em limpeza, com previsão de liberação.

  - Sala 05: Livre, com próximo caso programado.

  - Sala 06: Cesárea eletiva atrasada porque a paciente está em preparo.

2. Página “Detalhe da Sala”

- Ao clicar em qualquer card de sala, abrir uma página detalhada.

- Criar uma tela completa para a Sala 02 como exemplo.

- Exibir status “Em cirurgia”, paciente com dados fictícios e mascarados, idade, idade gestacional, procedimento, prioridade e alergias.

- Mostrar três cronômetros: tempo em sala, tempo de anestesia e tempo cirúrgico.

- Criar uma linha do tempo vertical com:

  - Admissão no bloco.

  - Identificação conferida.

  - Checklist de cirurgia.

  - Início da anestesia.

  - Incisão cirúrgica.

  - Nascimento.

  - Término da cirurgia.

  - Saída da sala.

  - Entrada na RPA.

- Os eventos concluídos devem ficar em verde, os pendentes em cinza e pendências em amarelo/laranja.

- Mostrar equipe atual: cirurgião, auxiliar, anestesista, instrumentador, circulante e neonatologia.

- Criar uma área “Resumo clínico autorizado”, com informações fictícias e discretas: alergias, grupo sanguíneo, jejum, consentimento, exames relevantes e precauções.

- Criar área de alertas.

- Botões visuais: “Registrar marco”, “Atualizar equipe”, “Registrar intercorrência”, “Solicitar apoio” e “Abrir prontuário”.

- Os botões podem abrir modal ou mostrar toast de demonstração, sem persistência real.

3. Página “Agenda Cirúrgica”

- Criar tabela organizada com horário, sala, procedimento, prioridade, situação, duração estimada e próxima ação.

- Adicionar chips/filtros de turno, sala e prioridade.

- Mostrar indicadores laterais ou superiores:

  - Próxima sala disponível.

  - Salas com risco de sobreposição.

  - Pacientes aptas para chamada.

  - Pacientes com pendências.

  - Vagas disponíveis na RPA.

- Destacar atrasos em laranja e urgências/emergências em vermelho.

4. Página “Recuperação Pós-Anestésica”

- Criar painel com seis leitos de RPA.

- Para cada leito, exibir: leito, iniciais da paciente, sala de origem, hora de entrada, tempo de permanência, situação e destino previsto.

- Exemplo de estados: “Monitorização ativa”, “Apta — aguardando leito”, “Dor a reavaliar” e “Disponível”.

- Exibir ocupação geral: 3 de 6 leitos ocupados.

- Usar cores discretas, sem alarmismo visual excessivo.

5. Página “Alertas”

- Listar alertas em cards/tabela com prioridade, origem, descrição, horário e ação sugerida.

- Prioridades:

  - Crítico em vermelho.

  - Alto em laranja.

  - Médio em amarelo.

- Exemplos:

  - Sala 02: alerta clínico registrado.

  - Sala 06: atraso de 50 minutos por preparo.

  - Sala 03: checklist ou consentimento pendente.

  - RPA 02: paciente apta aguardando leito.

  - Sala 05: equipe incompleta para próximo procedimento.

- Adicionar botão de “Marcar como visualizado” apenas visual/local.

6. Página “Indicadores”

- Criar dashboard com gráficos simples e cards.

- Indicadores:

  - Procedimentos programados.

  - Procedimentos concluídos.

  - Percentual de início no horário.

  - Tempo médio de cirurgia.

  - Giro médio de sala.

  - Taxa de ocupação.

  - Cancelamentos ou reagendamentos.

  - Alertas em aberto.

- Adicionar gráficos de barras ou linha para:

  - Tempo médio por sala.

  - Status das salas.

  - Motivos de atraso.

- Usar dados fictícios coerentes com a operação de uma maternidade.

PADRÃO VISUAL:

- Sidebar fixa à esquerda com ícones e os itens: Painel de Salas, Agenda Cirúrgica, Recuperação (RPA), Alertas e Indicadores.

- Cabeçalho superior discreto.

- Paleta: azul hospitalar escuro para navegação, branco/cinza claro no fundo, verde para “em cirurgia”, amarelo para “preparo”, azul claro para “limpeza”, cinza para “livre”, laranja para atraso e vermelho apenas para criticidade.

- Tipografia moderna e legível, com números e cronômetros em destaque.

- Cards com bordas suaves, sombras leves e boa separação visual.

- Use ícones consistentes para cirurgia, relógio, alerta, leito, equipe e agenda.

- Todos os textos em português brasileiro.

- Criar componentes reutilizáveis: StatusBadge, RoomCard, TimelineItem, MetricCard, AlertCard e filtros.

- Adicionar navegação funcional entre as páginas e interações simuladas.

- Incluir uma observação discreta no rodapé: “Ambiente demonstrativo — dados fictícios e mascarados”.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/863013bd-df0b-4bfb-92e7-bccc7ac88972).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
