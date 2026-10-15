// The two functions the extension runs inside a page, with chrome.scripting.executeScript({ func }).
//
// Chrome sends each function into the page as its source text, so each must stand alone: no imports, nothing
// from outside its own body. That is why the helpers are declared inside them, and why they are plain functions
// a test can also call against any document (tests/page.test.ts).

export type Heading = { level: 1 | 2 | 3; text: string };

export type Insights = {
  title: string;
  url: string;
  lang: string;
  words: number;
  minutes: number;
  headings: Heading[];
  links: number;
  images: number;
  /** The site's icon, for the side panel's list. */
  favicon: string;
};

export type MarkdownOptions = { images: boolean; links: boolean };
export type Markdown = { title: string; markdown: string; words: number };

/** The page's main text, its size and its outline. */
export function readInsights(doc: Document = document): Insights {
  const SKIP = 'script,style,noscript,template,svg,canvas,iframe,nav,header,footer,aside,form,dialog,[hidden],[aria-hidden="true"]';
  const BLOCKS = 'p,div,li,h1,h2,h3,h4,h5,h6,td,th,tr,dt,dd,br,pre,blockquote,section,figcaption';
  const textOf = (el: Element) => {
    const copy = el.cloneNode(true) as Element;
    copy.querySelectorAll(SKIP).forEach((n) => n.remove());
    // textContent runs blocks together ("TitleThe first line"): a space after each block keeps words apart.
    copy.querySelectorAll(BLOCKS).forEach((n) => n.append(' '));
    return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
  };
  // The main content: the <article> or <main> holding the most text, else the body.
  const candidates = [...doc.querySelectorAll('article, main, [role="main"], #content, .post, .entry-content')];
  const main = candidates.map((el) => ({ el, n: textOf(el).length })).sort((a, b) => b.n - a.n)[0];
  const root = main && main.n > 400 ? main.el : doc.body;
  const text = textOf(root);
  // Words: runs of letters or digits; Chinese, Japanese and Korean count a word per two characters.
  const cjk = (text.match(/[぀-ヿ㐀-鿿가-힯]/g) ?? []).length;
  const latin = (text.replace(/[぀-ヿ㐀-鿿가-힯]/g, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
  const words = latin + Math.round(cjk / 2);
  const headings = [...root.querySelectorAll('h1, h2, h3')]
    .map((h) => ({ level: Number(h.tagName[1]) as 1 | 2 | 3, text: (h.textContent ?? '').replace(/\s+/g, ' ').trim() }))
    .filter((h) => h.text.length > 0 && h.text.length < 160)
    .slice(0, 80);
  const icon = doc.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href;
  return {
    title: doc.title.trim() || (headings[0]?.text ?? ''),
    url: doc.location?.href ?? '',
    lang: doc.documentElement.lang || '',
    words,
    minutes: words / 238,
    headings,
    links: root.querySelectorAll('a[href]').length,
    images: [...root.querySelectorAll('img')].filter((i) => (i.getAttribute('width') ?? '99') !== '1').length,
    favicon: icon ?? (doc.location?.origin ? `${doc.location.origin}/favicon.ico` : ''),
  };
}

/** The page's main content as Markdown: headings, paragraphs, lists, links, images, quotes, code and tables. */
export function extractMarkdown(options: MarkdownOptions, doc: Document = document): Markdown {
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS', 'IFRAME', 'NAV', 'FOOTER', 'ASIDE', 'FORM', 'BUTTON', 'DIALOG', 'SELECT', 'INPUT', 'TEXTAREA']);
  const candidates = [...doc.querySelectorAll('article, main, [role="main"], #content, .post, .entry-content')];
  const root = candidates.sort((a, b) => (b.textContent ?? '').length - (a.textContent ?? '').length)[0] ?? doc.body;
  const abs = (url: string | null) => {
    if (!url) return '';
    try { return new URL(url, doc.baseURI).href; } catch { return url; }
  };
  const esc = (s: string) => s.replace(/([\\`*_[\]])/g, '\\$1');
  const hidden = (el: Element) => el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true';

  // Inline content: text, emphasis, code, links and images, on one line.
  const inline = (node: Node): string => {
    if (node.nodeType === 3) return esc((node.textContent ?? '').replace(/\s+/g, ' '));
    if (node.nodeType !== 1) return '';
    const el = node as Element;
    if (SKIP.has(el.tagName) || hidden(el)) return '';
    const inner = () => [...el.childNodes].map(inline).join('');
    switch (el.tagName) {
      case 'BR': return '  \n';
      case 'STRONG': case 'B': { const t = inner().trim(); return t ? `**${t}**` : ''; }
      case 'EM': case 'I': { const t = inner().trim(); return t ? `_${t}_` : ''; }
      case 'DEL': case 'S': { const t = inner().trim(); return t ? `~~${t}~~` : ''; }
      case 'CODE': { const t = el.textContent ?? ''; const tick = t.includes('`') ? '``' : '`'; return t ? `${tick}${t}${tick}` : ''; }
      case 'A': {
        const t = inner().trim();
        const href = abs(el.getAttribute('href'));
        if (!options.links || !href || href.startsWith('javascript:')) return t;
        return t ? `[${t}](${href})` : '';
      }
      case 'IMG': {
        if (!options.images) return '';
        const src = abs(el.getAttribute('src') ?? el.getAttribute('data-src'));
        return src && !src.startsWith('data:') ? `![${esc(el.getAttribute('alt') ?? '')}](${src})` : '';
      }
      default: return inner();
    }
  };

  const out: string[] = [];
  const push = (block: string) => { const b = block.replace(/[ \t]+\n/g, '\n').trim(); if (b) out.push(b); };

  const list = (el: Element, depth: number) => {
    const ordered = el.tagName === 'OL';
    let n = Number(el.getAttribute('start') ?? 1);
    const lines: string[] = [];
    for (const li of el.children) {
      if (li.tagName !== 'LI') continue;
      const own = [...li.childNodes].filter((c) => !(c.nodeType === 1 && ['UL', 'OL'].includes((c as Element).tagName))).map(inline).join('').trim();
      lines.push(`${'  '.repeat(depth)}${ordered ? `${n++}.` : '-'} ${own}`);
      for (const sub of li.children) if (sub.tagName === 'UL' || sub.tagName === 'OL') lines.push(list(sub, depth + 1));
    }
    return lines.join('\n');
  };

  const table = (el: Element) => {
    const rows = [...el.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => inline(c).trim().replace(/\|/g, '\\|')));
    if (!rows.length) return '';
    const width = Math.max(...rows.map((r) => r.length));
    const pad = (r: string[]) => [...r, ...Array(width - r.length).fill('')];
    const [head, ...body] = rows;
    return [`| ${pad(head!).join(' | ')} |`, `| ${Array(width).fill('---').join(' | ')} |`, ...body.map((r) => `| ${pad(r).join(' | ')} |`)].join('\n');
  };

  const block = (node: Node) => {
    if (node.nodeType === 3) { if ((node.textContent ?? '').trim()) push(inline(node)); return; }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    if (SKIP.has(el.tagName) || hidden(el)) return;
    const tag = el.tagName;
    if (/^H[1-6]$/.test(tag)) return push(`${'#'.repeat(Number(tag[1]))} ${inline(el).trim()}`);
    if (tag === 'P') return push(inline(el));
    if (tag === 'UL' || tag === 'OL') return push(list(el, 0));
    if (tag === 'BLOCKQUOTE') return push(inline(el).trim().split('\n').map((l) => `> ${l}`).join('\n'));
    if (tag === 'PRE') {
      const code = el.querySelector('code');
      const lang = (code?.className.match(/language-([\w-]+)/) ?? [])[1] ?? '';
      return push(`\`\`\`${lang}\n${(code ?? el).textContent?.replace(/\n$/, '') ?? ''}\n\`\`\``);
    }
    if (tag === 'HR') return push('---');
    if (tag === 'TABLE') return push(table(el));
    if (tag === 'IMG') return push(inline(el));
    if (tag === 'FIGURE') {
      const img = el.querySelector('img');
      const caption = el.querySelector('figcaption');
      if (img) push(inline(img));
      if (caption) push(`_${inline(caption).trim()}_`);
      return;
    }
    // A container: its blocks, or its text as one paragraph when it holds only inline content.
    const blockish = [...el.children].some((c) => /^(P|DIV|SECTION|ARTICLE|H[1-6]|UL|OL|PRE|BLOCKQUOTE|TABLE|FIGURE|HR|HEADER|MAIN)$/.test(c.tagName));
    if (blockish) el.childNodes.forEach(block);
    else push(inline(el));
  };

  root.childNodes.forEach(block);
  const title = doc.title.trim();
  const body = out.join('\n\n');
  const markdown = body.startsWith('# ') || !title ? body : `# ${esc(title)}\n\n${body}`;
  const words = (markdown.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
  return { title, markdown: `${markdown}\n`, words };
}
