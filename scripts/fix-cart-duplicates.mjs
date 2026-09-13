/**
 * Удаляет дубли корзины и оставляет одну актуальную разметку.
 * Запуск: node scripts/fix-cart-duplicates.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CART_PANEL_HTML } from './cart-panel-html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(fp, acc);
    } else if (/\.html$/i.test(name)) {
      acc.push(fp);
    }
  }
  return acc;
}

function stripCartBlocks(html) {
  let out = html;
  while (out.includes('id="cart-backdrop"') || out.includes('id="cart-panel"')) {
    const backdropStart = out.indexOf('<div id="cart-backdrop"');
    const panelStart = out.indexOf('<div id="cart-panel"');
    const start =
      backdropStart === -1
        ? panelStart
        : panelStart === -1
          ? backdropStart
          : Math.min(backdropStart, panelStart);

    if (start === -1) break;

    let depth = 0;
    let i = start;
    let removed = false;
    while (i < out.length) {
      if (out.slice(i, i + 4) === '<div') {
        depth++;
        i += 4;
        continue;
      }
      if (out.slice(i, i + 6) === '</div>') {
        depth--;
        i += 6;
        if (depth === 0) {
          out = out.slice(0, start) + out.slice(i);
          removed = true;
          break;
        }
        continue;
      }
      i++;
    }
    if (!removed) break;
  }
  return out;
}

let changed = 0;
for (const fp of walk(ROOT)) {
  let html = fs.readFileSync(fp, 'utf8');
  if (!html.includes('id="cart-panel"') && !html.includes('id="cart-backdrop"')) continue;

  let next = stripCartBlocks(html);
  const headerEnd = next.indexOf('</header>');
  if (headerEnd !== -1) {
    const insertAt = headerEnd + '</header>'.length;
    next = next.slice(0, insertAt) + '\n' + CART_PANEL_HTML + next.slice(insertAt);
  }

  if (next !== html) {
    fs.writeFileSync(fp, next, 'utf8');
    changed++;
  }
}

console.log(`fix-cart-duplicates: fixed ${changed} html files`);
