import { playwrightLauncher } from "@web/test-runner-playwright";

export default {
  nodeResolve: true,
  playwright: true,
  browsers: [
    playwrightLauncher({ product: "chromium" }),
    playwrightLauncher({ product: "webkit" }),
    playwrightLauncher({ product: "firefox" }),
  ],
};
