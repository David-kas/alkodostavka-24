import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'middleware.js');
if (!fs.existsSync(file)) process.exit(0);

let source = fs.readFileSync(file, 'utf8');
source = source.replace(
  /const NEW_ORIGIN\s*=\s*['\"][^'\"]+['\"];/,
  "const NEW_ORIGIN = 'https://alkodostavka24.vercel.app';",
);
source = source.replace(
  /const OLD_HOSTS\s*=\s*new Set\(\[[\s\S]*?\]\);/,
  "const OLD_HOSTS = new Set([\n  'alkodastavka.vercel.app',\n  'alkodostavka24.online',\n]);",
);
fs.writeFileSync(file, source, 'utf8');
console.log('protect-primary-middleware: redirect hosts preserved');
