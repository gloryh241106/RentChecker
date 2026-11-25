import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['{shared,server}/src/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['client/src/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
