# Painel público do pronto atendimento — resumo para o encarregado (DPO)

Documento para apoiar a aprovação da exibição pública de números. Não substitui o parecer do encarregado nem um RIPD.

## O que o painel público mostra
- Totais: pessoas aguardando, em atendimento e já atendidas, e total no pronto atendimento.
- Contagem por classificação de risco (cor).
- Tempo de espera: **maior** tempo e tempo **médio**, no geral, por cor e por especialidade, comparados ao tempo previsto.
- Contagem por especialidade (nome da categoria e números).
- Horário da última atualização.

## O que nunca sai do servidor para o painel público
Nome, iniciais, CPF, prontuário, número de atendimento ou senha, idade, sexo, município, diagnóstico, sala, profissional, horários individuais e qualquer linha de paciente. O servidor lê o registro completo, calcula só agregados e devolve uma lista fixa de campos numéricos (`src/lib/pa-public-summary.ts`). O banco não é legível pelo navegador (RLS sem política de leitura).

## Decisão sobre grupos pequenos (1 a 4 pessoas)
- Estado atual (16/10/2026): **números exatos**, por decisão do responsável pela unidade.
- Chave: `SUPPRESS_SMALL_COUNTS` em `src/lib/pa-public-summary.ts`. Com `true`, grupos de 1 a 4 aparecem como "Poucas pessoas" e o maior tempo por grupo só aparece com 5 ou mais pessoas.
- Risco: em grupos muito pequenos, quem está na sala de espera pode associar um número ou um tempo a uma pessoa (por exemplo, "1 pessoa em Emergência" ou "maior espera da especialidade X" com 1 pessoa). Os dados não têm identificador, mas o risco de reidentificação por contexto existe.
- Mitigações já aplicadas: sem nomes ou identificadores, sem horários individuais, maior tempo por grupo apenas para 2 ou mais pessoas, página sem indexação em buscadores, atualização frequente (dados do momento).

## Pontos para o encarregado decidir
1. Manter números exatos ou voltar a ocultar grupos de 1 a 4.
2. Manter a abertura por especialidade (pode aumentar o risco em especialidades com poucos atendimentos).
3. Confirmar que "espera atual" (do atendimento até o médico) é a regra desejada para o maior tempo de espera.

| Decisão | Responsável | Data | Observações |
|---|---|---|---|
| Números exatos de 1 a 4 | | | |
| Abertura por especialidade | | | |
