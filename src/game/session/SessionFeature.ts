import { defineFeature, defineSystem } from "../../framework/feature/FeatureManifest";
import { activateHammerThunderIfCharged } from "./HammerThunderSystem";

export const SessionFeature = defineFeature({
  name: "session",
  systems: [defineSystem("state", "session.hammerThunder", activateHammerThunderIfCharged)],
});
