import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const exists = fs.existsSync(distDir);
console.log(`Performance check baseline: dist exists=${exists}`);
