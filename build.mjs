import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['src/Launcher.ts'],
    bundle: true,
    outdir: './dist'
})