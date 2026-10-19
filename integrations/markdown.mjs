// Emits a markdown twin (index.md) next to every built HTML page, served by functions/_middleware.ts
// when a client sends `Accept: text/markdown`.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import TurndownService from 'turndown';

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name === 'index.html') yield path;
  }
}

export default function markdown() {
  return {
    name: 'markdown-twins',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(dir);
        const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
        td.remove(['script', 'style', 'svg', 'form', 'button', 'noscript']);
        for await (const file of htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1].trim();
          const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1];
          if (!main) continue;
          const body = td.turndown(main).replace(/\n{3,}/g, '\n\n');
          await writeFile(file.replace(/\.html$/, '.md'), `${title ? `# ${title}\n\n` : ''}${body}\n`);
        }
      },
    },
  };
}
