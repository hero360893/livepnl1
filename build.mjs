import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, writeFileSync } from 'fs';

mkdirSync('dist', { recursive: true });
mkdirSync('dist/icons', { recursive: true });

copyFileSync('public/manifest.json', 'dist/manifest.json');
copyFileSync('public/pip.css', 'dist/pip.css');
copyFileSync('public/icons/icon128.png', 'dist/icons/icon128.png');

const html = (script) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>LivePnL</title></head>
<body><div id="root"></div>
<script src="${script}"></script></body></html>`;

writeFileSync('dist/sidepanel.html', html('sidepanel.js'));
writeFileSync('dist/popup.html',     html('popup.js'));
writeFileSync('dist/pip.html',       html('pip.js'));

const shared = {
  bundle: true, minify: false, sourcemap: false,
  target: ['chrome120'], jsx: 'automatic',
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  define: { 'process.env.NODE_ENV': '"production"' },
};

async function build() {
  await esbuild.build({ ...shared, entryPoints: ['src/background/index.ts'],  outfile: 'dist/background.js', platform: 'browser' });
  await esbuild.build({ ...shared, entryPoints: ['src/sidepanel/index.tsx'],  outfile: 'dist/sidepanel.js',  platform: 'browser' });
  await esbuild.build({ ...shared, entryPoints: ['src/popup/index.tsx'],      outfile: 'dist/popup.js',      platform: 'browser' });
  await esbuild.build({ ...shared, entryPoints: ['src/pip/index.tsx'],        outfile: 'dist/pip.js',        platform: 'browser' });
  console.log('✅ Build complete → dist/');
}
build().catch(e => { console.error(e); process.exit(1); });
