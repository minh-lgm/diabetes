import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-charts', test: /node_modules[\/](recharts|d3-|victory|internmap|delaunator|robust-predicates)/ },
            { name: 'vendor-react', test: /node_modules[\/](react|react-dom|react-router|scheduler)/ },
            { name: 'vendor-db', test: /node_modules[\/](dexie|date-fns)/ },
          ],
        },
      },
    },
  },
})
