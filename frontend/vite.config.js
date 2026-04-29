import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  // Development proxy: forward /api requests to FastAPI backend
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  // Test configuration (Vitest)
  // UPDATED (Prompt 09 — GAP-02): Added coverage thresholds so that
  // "npm run test:coverage" FAILS when coverage drops below the minimum.
  // Without thresholds, vitest --coverage always exits 0 regardless of actual coverage.
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    // Explicitly exclude Playwright e2e specs — vitest must not pick these up.
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.spec.{js,ts}'],
    // Redirect local firebase.js to a lightweight stub so tests don't need real
    // Firebase credentials or browser-only APIs (IndexedDB, etc.)
    // The regex covers both Unix (/) and Windows (\) path separators, and handles
    // the extensionless import form (`import '../firebase'`) used by api.js.
    alias: [
      {
        find: /[/\\]src[/\\]firebase(\.js)?$/,
        replacement: path.resolve(__dirname, 'src/__mocks__/firebase.js'),
      },
    ],
    coverage: {
      provider: 'v8',                           // v8 (not c8 — deprecated)
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',                         // entry point — not unit testable in isolation
        'src/firebase.js',                      // Firebase SDK init — mocked in all tests
        'src/**/*.test.{js,jsx}',
        'src/test-setup.js',
      ],
      thresholds: {
        lines:      70,
        functions:  60,
        branches:   60,
        statements: 70,
      },
    },
  },

  // Production build: split vendor chunks for better caching
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
});
