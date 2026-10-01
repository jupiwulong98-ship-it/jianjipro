import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
// @ts-ignore Local middleware uses plain Node ESM.
import {reviewApiPlugin} from './scripts/review-api.mjs';
export default defineConfig({test:{include:['tests/**/*.test.{ts,tsx}']},plugins:[reviewApiPlugin(),react()]});
