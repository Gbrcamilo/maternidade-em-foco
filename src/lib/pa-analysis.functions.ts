import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { aggregateSchema } from "./pa-analysis-schema";

export const analyzePa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => aggregateSchema.parse(input))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const apiKey = process.env["LOVABLE_API_KEY"];
    const { generateOperationalSummary } = await import("./pa-analysis.server");
    return generateOperationalSummary(data, apiKey, getRequest());
  });