import { build } from 'esbuild'
import { nodeBuiltIns } from 'esbuild-node-builtins'

build({
  platform: 'browser',
  format: 'esm',
  entryPoints: ['src/worker.js'],
  plugins: [
    nodeBuiltIns()
  ],
  outdir: 'dist',
  bundle: true,
  loader: {
    '.html': 'text',
    '.gql': 'text'
  }
})
