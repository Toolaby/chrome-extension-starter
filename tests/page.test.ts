import { describe, expect, it } from 'vitest';
import { extractMarkdown, readInsights } from '../lib/page';

// Both functions take the document as their last argument, so a test hands them one of its own.
function page(html: string, title = 'A page') {
  const doc = document.implementation.createHTMLDocument();
  doc.title = title;
  doc.body.innerHTML = html;
  return doc;
}

const article = (body: string) => `
  <nav><a href="/">Home</a><a href="/about">About</a></nav>
  <article>${body}</article>
  <footer>© Someone · <a href="/privacy">Privacy</a></footer>`;

const lorem = 'The quick brown fox jumps over the lazy dog while the reader keeps reading. '.repeat(12);

describe('readInsights', () => {
  it('counts the words of the article, not of the navigation or the footer', () => {
    const doc = page(article(`<h1>Title</h1><p>${lorem}</p>`));
    const i = readInsights(doc);
    expect(i.words).toBe(1 + 14 * 12);
    expect(i.links).toBe(0);
    expect(i.minutes).toBeCloseTo(i.words / 238);
  });

  it('lists the outline with each heading’s level', () => {
    const doc = page(article(`<h1>Guide</h1><p>${lorem}</p><h2>Install</h2><h3>On macOS</h3><h2>Use</h2>`));
    expect(readInsights(doc).headings).toEqual([
      { level: 1, text: 'Guide' },
      { level: 2, text: 'Install' },
      { level: 3, text: 'On macOS' },
      { level: 2, text: 'Use' },
    ]);
  });

  it('counts Chinese, Japanese and Korean text by characters', () => {
    const doc = page(`<main>${'读书使人充实。'.repeat(80)}</main>`);
    expect(readInsights(doc).words).toBe(240); // six characters (the full stop is not one) × 80, two to a word
  });

  it('falls back to the body when nothing is marked as the main content', () => {
    const doc = page(`<div><p>${lorem}</p></div>`);
    expect(readInsights(doc).words).toBe(14 * 12);
  });
});

describe('extractMarkdown', () => {
  const md = (html: string, options = { images: true, links: true }) => extractMarkdown(options, page(article(html), 'Field notes')).markdown;

  it('puts the page title first when the content has no heading of its own', () => {
    expect(md('<p>Hello there.</p>')).toBe('# Field notes\n\nHello there.\n');
  });

  it('writes headings, emphasis, inline code and links', () => {
    expect(md('<h2>Setup</h2><p>Run <code>npm i</code>, then <strong>read</strong> the <a href="https://wxt.dev/guide">guide</a>.</p>'))
      .toBe('# Field notes\n\n## Setup\n\nRun `npm i`, then **read** the [guide](https://wxt.dev/guide).\n');
  });

  it('writes nested and numbered lists', () => {
    expect(md('<ol start="3"><li>Three<ul><li>a</li><li>b</li></ul></li><li>Four</li></ol>'))
      .toBe('# Field notes\n\n3. Three\n  - a\n  - b\n4. Four\n');
  });

  it('keeps code blocks verbatim, with their language', () => {
    expect(md('<pre><code class="language-ts">const a = 1;\nconst b = a * 2;\n</code></pre>'))
      .toBe('# Field notes\n\n```ts\nconst a = 1;\nconst b = a * 2;\n```\n');
  });

  it('writes tables as GitHub tables', () => {
    expect(md('<table><tr><th>Plan</th><th>Price</th></tr><tr><td>Pro</td><td>$4</td></tr></table>'))
      .toBe('# Field notes\n\n| Plan | Price |\n| --- | --- |\n| Pro | $4 |\n');
  });

  it('drops images and keeps only link text when the settings say so', () => {
    expect(md('<p>See <a href="https://example.com">this</a> <img src="https://example.com/a.png" alt="a chart"></p>', { images: false, links: false }))
      .toBe('# Field notes\n\nSee this\n');
  });

  it('leaves out scripts, forms and hidden content', () => {
    expect(md('<p>Kept.</p><script>alert(1)</script><form><button>Buy</button></form><p hidden>Gone.</p>'))
      .toBe('# Field notes\n\nKept.\n');
  });

  it('escapes Markdown in plain text', () => {
    expect(md('<p>Use *stars* and [brackets] as text.</p>')).toBe('# Field notes\n\nUse \\*stars\\* and \\[brackets\\] as text.\n');
  });
});
