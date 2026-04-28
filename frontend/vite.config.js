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
        lines:      50,
        functions:  55,
        // Branches include optional chaining and nullish coalescing throughout,
        // requiring integration tests to fully cover. This threshold is realistic
        // for a component-heavy React app where pages/contexts need live Firebase.
        branches:   40,
        statements: 50,
      },
    },
  },

  // Production build: split vendor chunks for better caching
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/analytics'],
          charts:   ['recharts'],
        },
      },
    },
  },
});
