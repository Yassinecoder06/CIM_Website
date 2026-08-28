import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The scene runtime and its companion packages must share one Three.js module.
    dedupe: ['three']
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  // Keep workers bundling correct for Needle Engine
  optimizeDeps: {
    exclude: ['three-mesh-bvh', '@needle-tools/gltf-progressive']
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 0
  },
  server: { host: true, port: 5173 },
  preview: { host: '0.0.0.0', port: 4173 },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})
