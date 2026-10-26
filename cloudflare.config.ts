import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "poker-trainer",
    compatibilityDate: "2026-10-25",
    observability: {
      enabled: true,
      traces: {
        enabled: true,
      },
    },
    assets: {
      notFoundHandling: "single-page-application",
    },
  },
});
