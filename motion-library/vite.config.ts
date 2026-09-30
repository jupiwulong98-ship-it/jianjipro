import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
// @ts-ignore Local middleware uses plain Node ESM.
import { reviewApiPlugin } from "./scripts/review-api.mjs";

export default defineConfig({ test: { include: ["tests/**/*.test.{ts,tsx}"] }, plugins: [{ name: "chatcut-preview-source", enforce: "pre", transform(code, id) {
  if (id.includes("/cards/") && id.includes("Component.jsx?preview")) {
    // Supply native runtime globals without changing the animation source.
    return `import {spring, useCurrentFrame, useVideoConfig, interpolate, interpolateColors, random, Easing, AbsoluteFill, Img, Video, Audio} from "remotion";\n${code}\nexport { Component };`;
  }
} }, reviewApiPlugin(), react()] });
