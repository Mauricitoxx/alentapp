import { build } from 'esbuild';

const shared = {
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    external: [
        'fastify',
        '@fastify/*',
        '@prisma/client',
        '@prisma/adapter-pg',
        'pg',
        '@opentelemetry/*',
    ],
    banner: {
        js: [
            "import { createRequire as __cr } from 'module';",
            "import { fileURLToPath as __ftp } from 'url';",
            "import { dirname as __dn } from 'path';",
            'const require = __cr(import.meta.url);',
            'const __filename = __ftp(import.meta.url);',
            'const __dirname = __dn(__filename);',
        ].join(''),
    },
};

await build({ ...shared, entryPoints: ['src/app.ts'], outfile: 'dist/app.js' });
await build({ ...shared, entryPoints: ['src/infrastructure/telemetry.ts'], outfile: 'dist/telemetry.js' });

console.log('✅ Build completo: dist/app.js y dist/telemetry.js');