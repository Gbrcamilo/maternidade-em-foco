import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Maternidade em Foco — Pronto Atendimento" },
    { name: "description", content: "Acompanhamento agregado do pronto atendimento materno, sem identificação de pacientes." },
    { property: "og:title", content: "Maternidade em Foco — Pronto Atendimento" },
    { property: "og:description", content: "Acompanhamento agregado do pronto atendimento materno, sem identificação de pacientes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/pa" });
  },
});
