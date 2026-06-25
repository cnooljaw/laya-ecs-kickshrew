import { defineFeature, defineSystem } from "../../framework/feature/FeatureManifest";
import { thunderSystem } from "./ThunderSystem";

export const SessionFeature = defineFeature({
  name: "session",
  systems: [defineSystem("state", "session.thunder", thunderSystem)],
});
