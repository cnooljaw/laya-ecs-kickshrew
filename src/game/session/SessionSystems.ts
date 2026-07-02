import { defineSystem, type SystemDefinition } from "../../framework/feature/FeatureManifest";
import { activateHammerThunderIfCharged } from "./HammerThunderSystem";

export const GAME_SESSION_SYSTEMS: readonly SystemDefinition[] = [
  defineSystem("state", "session.hammerThunder", activateHammerThunderIfCharged),
];
