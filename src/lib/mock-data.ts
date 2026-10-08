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

export type Alert = { id: number; priority: "Crítico" | "Alto" | "Médio"; origin: string; description: string; time: string; action: string };

export type Meta = { geradoEm: string; fonte: string; mascarado: boolean };

export type Resumo = {
  salasTotais: number; emCirurgia: number; emPreparo: number; emLimpeza: number; livres: number;
  ocupacao: number; previstos: number; realizados: number; atrasados: number;
};

export type AgendaItem = { horario: string; sala: string; procedimento: string; prioridade: Priority; situacao: string; duracao: string; proximaAcao: string };
export type Agenda = {
  itens: AgendaItem[];
  indicadores: { proximaSalaDisponivel: string; riscoSobreposicao: number; aptasChamada: number; comPendencias: number; vagasRpa: number; leitosRpa: number };
};

export type RpaBed = { bed: string; patient: string; origin: string; enter: string; stay: string; state: string; dest: string; occupied: boolean };
export type Rpa = { disponivel: boolean; leitos: RpaBed[] };

export type Indicadores = {
  programados: number; concluidos: number; inicioNoHorario: number; tempoMedioCirurgia: string; giroMedioSala: string;
  taxaOcupacao: number; reagendamentos: number; alertasAbertos: number;
  tempoPorSala: { name: string; minutos: number }[];
  motivosAtraso: { name: string; valor: number }[];
  ocupacaoTurno: { hora: string; ocupacao: number }[];
};

export type Painel = { meta: Meta; resumo: Resumo; salas: Room[]; agenda: Agenda; rpa: Rpa; alertas: Alert[]; indicadores: Indicadores };

export type TimelineState = "done" | "pending" | "attention";
export type RoomDetail = Room & {
  idade?: string; idadeGestacional?: string; alergias?: string;
  timeline: { time: string; title: string; state: TimelineState; detail: string }[];
  equipe: { role: string; name: string }[];
};
export type SalaResponse = { meta: Meta; sala: RoomDetail };
