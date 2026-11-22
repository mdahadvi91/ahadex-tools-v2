import { execSync } from 'node:child_process';

function run(cmd: string): void {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

run('npx tsx scripts/orchestrators/validate.ts --phase=pre');
run('npx tsx scripts/tasks/sitemap.ts --generate');
run('npm run build:client');
run('npx tsx scripts/prerender.ts'.replace('scripts/prerender.ts', 'scripts/build/prerender.ts'));
run('npx tsx scripts/tasks/deployment.ts --generate');
run('npx tsx scripts/orchestrators/validate.ts --phase=post');
