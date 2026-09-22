export type RoomStatus = "Em cirurgia" | "Em preparo" | "Em limpeza" | "Livre" | "Em atraso";

export type Room = {
  id: string;
  name: string;
  procedure: string;
  status: RoomStatus;
  patient: string;
  record: string;
  priority: "Eletiva" | "Urgência" | "Emergência";
  scheduled: string;
  started: string;
  elapsed: string;
  team: string;
  note: string;
  milestones: string[];
  category: "Cesárea" | "Outro";
};

export const rooms: Room[] = [
  { id: "01", name: "Sala 01", procedure: "Cesárea eletiva", status: "Em cirurgia", patient: "M. S. A.", record: "******4821", priority: "Eletiva", scheduled: "09:30", started: "09:42", elapsed: "01h08", team: "Dra. A. N. · Dr. B. R.", note: "Evolução dentro do previsto", milestones: ["Admissão 08:55", "Checklist 09:20", "Anestesia 09:31", "Incisão 09:42"], category: "Cesárea" },
  { id: "02", name: "Sala 02", procedure: "Cesárea de urgência", status: "Em cirurgia", patient: "L. R. F.", record: "******9217", priority: "Urgência", scheduled: "09:30", started: "10:03", elapsed: "00h47", team: "Dra. A. N. · Dr. B. R.", note: "Hemocomponentes em avaliação", milestones: ["Admissão 09:28", "Checklist 09:43", "Anestesia 09:52", "Incisão 10:03"], category: "Cesárea" },
  { id: "03", name: "Sala 03", procedure: "Cerclagem", status: "Em preparo", patient: "C. P. M.", record: "******3044", priority: "Eletiva", scheduled: "10:30", started: "—", elapsed: "00h20", team: "Dr. H. L. · Enf. R. G.", note: "Consentimento e checklist pendentes", milestones: ["Admissão 10:12", "Identificação 10:17", "Checklist pendente"], category: "Outro" },
  { id: "04", name: "Sala 04", procedure: "Higienização", status: "Em limpeza", patient: "—", record: "—", priority: "Eletiva", scheduled: "10:47", started: "10:27", elapsed: "00h23", team: "Equipe de higienização", note: "Liberação prevista às 10:47", milestones: ["Saída 10:21", "Limpeza 10:27", "Liberação 10:47"], category: "Outro" },
  { id: "05", name: "Sala 05", procedure: "Cesárea", status: "Livre", patient: "R. B. S.", record: "******1178", priority: "Eletiva", scheduled: "11:10", started: "—", elapsed: "00h00", team: "Equipe em confirmação", note: "Próximo caso em admissão", milestones: ["Admissão em andamento", "Equipe pendente"], category: "Cesárea" },
  { id: "06", name: "Sala 06", procedure: "Cesárea eletiva", status: "Em atraso", patient: "T. A. O.", record: "******7362", priority: "Eletiva", scheduled: "10:00", started: "—", elapsed: "+00h50", team: "Dr. F. M. · Dra. C. V.", note: "Paciente ainda em preparo", milestones: ["Admissão 09:36", "Preparo em andamento", "Checklist pendente"], category: "Cesárea" },
];

export const alerts = [
  { id: 1, priority: "Crítico", origin: "Sala 02", description: "Alerta clínico registrado; hemocomponentes em avaliação.", time: "10:46", action: "Acionar protocolo assistencial" },
  { id: 2, priority: "Alto", origin: "Sala 06", description: "Atraso de 50 minutos: paciente ainda em preparo.", time: "10:42", action: "Reavaliar previsão da agenda" },
  { id: 3, priority: "Alto", origin: "Sala 03", description: "Checklist ou consentimento ainda pendente.", time: "10:35", action: "Acionar enfermagem responsável" },
  { id: 4, priority: "Médio", origin: "RPA 02", description: "Paciente apta, aguardando leito de destino.", time: "10:31", action: "Confirmar transferência" },
  { id: 5, priority: "Médio", origin: "Sala 05", description: "Equipe incompleta para procedimento das 11:10.", time: "10:25", action: "Confirmar escala" },
];