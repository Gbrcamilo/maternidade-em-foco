import { ChevronDown } from "lucide-react";

const ITEMS: { q: string; a: string }[] = [
  { q: "Por que alguém que chegou depois foi atendido antes?", a: "Aqui o atendimento segue a gravidade de cada caso, avaliada pela equipe de saúde, e não a ordem de chegada. Casos mais graves passam na frente para que recebam cuidado mais rápido." },
  { q: "O que significam as cores?", a: "Vermelho é emergência, laranja é muito urgente, amarelo é urgente, verde é pouco urgente e azul é não urgente. A cor é definida na classificação de risco feita pela equipe." },
  { q: "O tempo de espera mostrado é uma promessa?", a: "Não. É uma informação do momento: o maior tempo que alguém está esperando agora e o tempo previsto para cada nível de urgência. Ele pode mudar quando chegam casos mais graves." },
  { q: "E se eu me sentir pior enquanto espero?", a: "Avise imediatamente a equipe de classificação ou a recepção. Sua situação será reavaliada." },
  { q: "Quando devo ligar para o SAMU?", a: "Em situações graves em que a pessoa não deve se deslocar por conta própria, ligue 192. Para casos de emergência, não espere." },
  { q: "Meu nome aparece neste painel?", a: "Não. O painel mostra apenas totais e médias do atendimento. Nenhum nome ou dado pessoal é exibido." },
];

/** Perguntas frequentes em lista expansível, usando elementos nativos (funciona sem JavaScript e com leitor de tela). */
export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="space-y-3 border-t border-border pt-6">
      <h2 id="faq-title" className="text-xl font-bold sm:text-2xl">Perguntas frequentes</h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border-2 border-border bg-card shadow-card">
        {ITEMS.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold sm:text-base">
              {item.q}
              <ChevronDown aria-hidden className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-4 pb-4 text-sm leading-6 text-muted-foreground sm:text-base">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
