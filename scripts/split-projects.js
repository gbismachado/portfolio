const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'index.html');
const src = fs.readFileSync(SRC, 'utf8');

function idx(str, from){
  const i = src.indexOf(str, from);
  if(i === -1) throw new Error('marker not found: ' + str);
  return i;
}

const projects = [
  {id:'projeto-01', slug:'metaverso-codengage', title:'Metaverso Codengage'},
  {id:'projeto-02', slug:'gestao-demandas-documentos', title:'Painel de Gestão de Demandas & Documentos'},
  {id:'projeto-03', slug:'conexao-pesquisa-setor-publico', title:'Estruturação de plataforma de conexão entre pesquisa e setor público'},
  {id:'projeto-04', slug:'erp-modular', title:'ERP modular — da produção ao atendimento'},
  {id:'projeto-05', slug:'app-de-treinos', title:'App de treinos'},
  {id:'projeto-06', slug:'app-despachante', title:'Aplicativo para Despachante'},
  {id:'projeto-07', slug:'social-media-kepha', title:'Social Media — Clube Kepha Bora Captar'},
];

// 1) extract <style> content -> styles.css
const styleStart = idx('<style>') + '<style>'.length;
const styleEnd = idx('</style>', styleStart);
const styleContent = src.slice(styleStart, styleEnd);
fs.writeFileSync(path.join(ROOT, 'styles.css'), styleContent.trim() + '\n', 'utf8');
console.log('styles.css written,', styleContent.length, 'bytes');

// 2) extract each <article class="case" id="projeto-0N">...</article>
for(const p of projects){
  const startMarker = '<article class="case" id="' + p.id + '">';
  const start = idx(startMarker);
  const end = idx('</article>', start) + '</article>'.length;
  p.html = src.slice(start, end);
  p.start = start;
  p.end = end;
}

// sanity check: projects are in order and non-overlapping
for(let i = 1; i < projects.length; i++){
  if(projects[i].start < projects[i-1].end) throw new Error('overlap between ' + projects[i-1].id + ' and ' + projects[i].id);
}

const HEADER_HOME_LINK = `<a class="logo" href="/" data-transition>Gabrieli Machado<span class="dot-accent">.</span></a>`;

function pageTemplate(p){
  let article = p.html;
  // back-link now points to the projects section on the home page
  article = article.split('href="#projetos"').join('href="/index.html#projetos" data-transition');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title} — Gabrieli Machado</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
</head>
<body>

<div class="page-veil is-active" id="pageVeil" aria-hidden="true"></div>

<header class="site-header">
  <div class="wrap header-inner">
    ${HEADER_HOME_LINK}
    <div class="status-pill"><span class="pulse"></span>Dois Vizinhos, PR <span class="clock" id="clock">--:--</span></div>
    <nav>
      <a href="/index.html#sobre" data-transition>sobre</a>
      <a href="/index.html#competencias" data-transition>competências</a>
      <a href="/index.html#projetos" data-transition>projetos</a>
      <a href="/index.html#contato" data-transition>contato</a>
    </nav>
  </div>
  <div class="scroll-progress" aria-hidden="true"><span class="scroll-progress-bar"></span></div>
</header>

<main class="case-page">
  <div class="wrap">
${article}
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <span>Gabrieli Machado · UX/UI Designer</span>
    <span>Dois Vizinhos, PR</span>
  </div>
</footer>

<script src="/script.js"></script>
</body>
</html>
`;
}

for(const p of projects){
  const dir = path.join(ROOT, 'projetos', p.slug);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir, 'index.html'), pageTemplate(p), 'utf8');
  console.log('wrote projetos/' + p.slug + '/index.html —', (p.html.length/1024/1024).toFixed(2), 'MB of case content');
}

// 3) remove the whole case-list block from the source, update tile links,
//    swap inline <style>/<script> for external references, add the page veil
let out = src;

const caseListStart = idx('<div class="case-list">');
const lastArticleEnd = projects[projects.length - 1].end;
const caseListCloseStart = idx('</div>', lastArticleEnd);
const caseListEnd = caseListCloseStart + '</div>'.length;
out = out.slice(0, caseListStart) + out.slice(caseListEnd);

for(const p of projects){
  const oldHref = `href="#${p.id}"`;
  const newHref = `href="/projetos/${p.slug}/" data-transition`;
  if(!out.includes(oldHref)) throw new Error('tile href not found for ' + p.id);
  out = out.split(oldHref).join(newHref);
}

// swap inline style block for external stylesheet
const newStyleStart = out.indexOf('<style>');
const newStyleEnd = out.indexOf('</style>', newStyleStart) + '</style>'.length;
out = out.slice(0, newStyleStart) + '<link rel="stylesheet" href="/styles.css">' + out.slice(newStyleEnd);

// swap inline script block for external script
const newScriptStart = out.indexOf('<script>');
const newScriptEnd = out.indexOf('</script>', newScriptStart) + '</script>'.length;
out = out.slice(0, newScriptStart) + '<script src="/script.js"></script>' + out.slice(newScriptEnd);

// add the static page veil right after <body>
out = out.replace('<body>', '<body>\n\n<div class="page-veil is-active" id="pageVeil" aria-hidden="true"></div>');

fs.writeFileSync(SRC, out, 'utf8');
console.log('index.html rewritten —', (out.length/1024/1024).toFixed(2), 'MB (was', (src.length/1024/1024).toFixed(2), 'MB)');
