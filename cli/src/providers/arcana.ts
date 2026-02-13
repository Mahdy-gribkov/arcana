import { GitHubProvider } from "./github.js";

export class ArcanaProvider extends GitHubProvider {
  constructor() {
    super("mahdy-gribkov", "arcana", {
      name: "arcana",
      displayName: "Arcana (official)",
      branch: "master",
    });
  }
}
