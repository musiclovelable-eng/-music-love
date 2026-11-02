import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Next.js standalone output intentionally excludes browser assets. A production
// server started from .next/standalone must receive them explicitly, otherwise
// the HTML loads without CSS, client-side JavaScript, or files from public/.
const root = process.cwd();
const copies = [
  ['.next/static', '.next/standalone/.next/static'],
  ['public', '.next/standalone/public'],
];

for (const [source, destination] of copies) {
  const from = path.join(root, source);
  const to = path.join(root, destination);
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to, { recursive: true, force: true });
  console.log(`Standalone assets copied: ${source} -> ${destination}`);
}
