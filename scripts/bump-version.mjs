// Incrementa automaticamente a versão (patch) do fii-track-front/package.json.
//
// Ex.: 1.2.10 -> 1.2.11 -> 1.2.12 ...
// É chamado pelo hook de pre-commit (.githooks/pre-commit) a cada commit.
//
// Uso manual: node scripts/bump-version.mjs [patch|minor|major]
//   patch (padrão): 1.2.10 -> 1.2.11
//   minor:          1.2.10 -> 1.3.0
//   major:          1.2.10 -> 2.0.0

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, '..', 'fii-track-front', 'package.json');

const tipo = process.argv[2] || 'patch';

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const atual = String(pkg.version || '0.0.0');

const partes = atual.split('.').map((n) => parseInt(n, 10) || 0);
let [major, minor, patch] = [partes[0] || 0, partes[1] || 0, partes[2] || 0];

if (tipo === 'major') { major += 1; minor = 0; patch = 0; }
else if (tipo === 'minor') { minor += 1; patch = 0; }
else { patch += 1; } // patch (padrão)

const nova = `${major}.${minor}.${patch}`;
pkg.version = nova;

// Mantém indentação de 2 espaços e newline final (padrão do npm).
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

console.log(`versão: ${atual} -> ${nova}`);
