import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Centro Cirúrgico Materno — Pronto Atendimento" },
    { name: "description", content: "Acompanhamento operacional dos pacientes do pronto atendimento materno." },
    { property: "og:title", content: "Centro Cirúrgico Materno — Pronto Atendimento" },
    { property: "og:description", content: "Acompanhamento operacional dos pacientes do pronto atendimento materno." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/pa" });
  },
});
