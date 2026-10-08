// Tipos de domínio compartilhados com a maternidade-api (somente tipos, sem dados).
export type RoomStatus = "Em cirurgia" | "Em preparo" | "Em limpeza" | "Livre" | "Em atraso";
export type Priority = "Eletiva" | "Urgência" | "Emergência";

export type Room = {
  id: string;
  name: string;
  procedure: string;
  status: RoomStatus;
  patient: string;
  record: string;
  priority: Priority;
  scheduled: string;
  started: string;
  elapsed: string;
  team: string;
  note: string;
  milestones: string[];
  category: "Cesárea" | "Outro";
};

export type Alert = { id: string; priority: "Crítico" | "Alto" | "Médio"; origin: string; description: string; time: string; action: string };

export type Meta = { geradoEm: string; fonte: string; mascarado: boolean };

export type Resumo = {
  salasTotais: number; emCirurgia: number; emPreparo: number; emLimpeza: number; livres: number; emAtraso: number;
  ocupacaoPct: number; procedimentosPrevistos: number; realizados: number; atrasados: number;
  dataReferencia: string; horaReferencia: string;
};

export type Turno = "Manhã" | "Tarde" | "Noite";
export type AgendaLinha = { id: string; horario: string; sala: string; salaId: string; procedimento: string; prioridade: Priority; situacao: string; duracao: string; proximaAcao: string; paciente: string; turno: Turno };
export type Agenda = {
  linhas: AgendaLinha[];
  indicadores: { proximaSalaDisponivel: { sala: string; hora: string }; salasComRiscoDeSobreposicao: number; aptasParaChamada: number; comPendencias: number; vagasRpa: { livres: number; total: number } };
};

export type RpaBed = { bed: string; patient: string; origin: string; enter: string; stay: string; state: string; dest: string; occupied: boolean };
export type Rpa = { disponivel: boolean; ocupados: number; total: number; ocupacaoPct: number; leitos: RpaBed[] };

export type Indicadores = {
  cards: { programados: number; concluidos: number; inicioNoHorarioPct: number; tempoMedioCirurgiaMin: number; giroMedioSalaMin: number; taxaOcupacaoPct: number; reagendamentos: number; alertasEmAberto: number };
  tempoMedioPorSala: { name: string; minutos: number | null }[];
  statusSalas: { name: string; total: number }[];
  ocupacaoPorHora: { hora: string; ocupacao: number }[];
  motivosAtraso: { name: string; valor: number }[];
  observacoes: { inicioNoHorario: string };
};

export type Painel = { meta: Meta; resumo: Resumo; salas: Room[]; agenda: Agenda; rpa: Rpa; alertas: Alert[]; indicadores: Indicadores };

export type TimelineState = "done" | "pending" | "attention";
export type RoomDetail = Room & {
  emSalaMin: number; pendencias: string[]; casoId: string; previstoInicioISO: string;
  linhaDoTempo: { titulo: string; horario: string; estado: TimelineState }[];
  equipe: { papel: string; nome: string }[];
};
export type SalaResponse = { meta: Meta; sala: RoomDetail };
export type PainelResult = Painel & { atualizadoEm: string };
export type SalaResult = (SalaResponse & { atualizadoEm: string }) | { naoEncontrada: true };

// ---- Pronto Atendimento (payload.pa) ----
export type CorRisco = "Vermelho" | "Laranja" | "Amarelo" | "Verde" | "Azul" | "Sem cor";
export type PorCor = Record<CorRisco, number>;
export type PaPaciente = {
  id: string; senha: string; atendimento: string; paciente: string; especialidade: string; fila: string; origem: string;
  cor: CorRisco; situacao: string; grupo: "aguardando" | "em-curso" | "finalizado";
  chegada: string; classifInicio: string; classifFinal: string; chamadaMedica: string; atendMedInicio: string; alta: string;
  esperaClassifMin: number | null; esperaAtendMin: number | null; tempoTotalMin: number | null;
  esperaClassif: string; esperaAtendMed: string; tempoTotal: string;
  slaMin: number | null; foraSla: boolean; excessoMin: number;
};
export type Pa = {
  meta?: { geradoEm?: string; fonte?: string; mascarado?: boolean }; disponivel: boolean;
  totais: { total: number; aguardando: number; emCurso: number; finalizados: number; foraSla: number; porCor: PorCor };
  limites: Partial<Record<CorRisco, number>>;
  especialidades: { especialidade: string; total: number; porCor: PorCor; foraSla: number }[];
  pacientes: PaPaciente[];
};
export type PaResult = { aguardando: true; atualizadoEm: string } | { aguardando: false; pa: Pa; atualizadoEm: string };
