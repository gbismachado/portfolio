function tickClock(){
  var el = document.getElementById('clock');
  if(!el) return;
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if(h === 0) h = 12;
  el.textContent = h + ':' + String(m).padStart(2,'0') + ' ' + ampm;
}
tickClock();
setInterval(tickClock, 1000);

// mobile nav: hamburger toggle
(function(){
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  if(!toggle || !nav) return;
  function closeNav(){
    nav.classList.remove('is-open');
    toggle.classList.remove('is-active');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function(){
    var isOpen = nav.classList.toggle('is-open');
    toggle.classList.toggle('is-active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(function(link){
    link.addEventListener('click', closeNav);
  });
  window.addEventListener('resize', function(){
    if(window.innerWidth > 760) closeNav();
  });
})();

// page-load / page-exit fade transition (works across real page navigations)
(function(){
  var veil = document.getElementById('pageVeil');
  if(!veil) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(reduceMotion){
    veil.classList.remove('is-active');
  } else {
    // wait a frame so the browser has painted the (still covered) page first,
    // then remove is-active to trigger the fade-out transition defined in CSS
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ veil.classList.remove('is-active'); });
    });
  }

  document.querySelectorAll('a[data-transition]').forEach(function(link){
    link.addEventListener('click', function(e){
      var href = link.getAttribute('href');
      if(!href || link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if(reduceMotion) return; // let the browser navigate immediately
      e.preventDefault();
      veil.classList.add('is-active');
      setTimeout(function(){ window.location.href = href; }, 320);
    });
  });
})();

// lightbox: click any framed screenshot to view it full-size
(function(){
  var lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = '<button class="lightbox-close" aria-label="Fechar">&times;</button><img alt="">';
  document.body.appendChild(lightbox);
  var lbImg = lightbox.querySelector('img');

  function openLightbox(img){
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lightbox.classList.add('is-open');
  }
  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lbImg.src = '';
  }
  document.querySelectorAll('[data-lightbox]').forEach(function(el){
    el.addEventListener('click', function(){
      var img = el.querySelector('img');
      if(img) openLightbox(img);
    });
  });
  lightbox.addEventListener('click', function(e){
    if(e.target === lightbox) closeLightbox();
  });
  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeLightbox();
  });
})();

// reveal cards as they scroll into view
var revealEls = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.12});
  revealEls.forEach(function(el){ io.observe(el); });
} else {
  revealEls.forEach(function(el){ el.classList.add('is-visible'); });
}

// scroll progress bar + active section highlight in the fixed nav
(function(){
  var bar = document.querySelector('.scroll-progress-bar');
  var navLinks = document.querySelectorAll('header nav a');
  if(!bar || !navLinks.length) return;
  var lastLink = navLinks[navLinks.length - 1];

  var ticking = false;
  function updateProgress(){
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - doc.clientHeight;
    var pct = scrollable > 0 ? doc.scrollTop / scrollable : 0;
    bar.style.transform = 'scaleX(' + pct + ')';
    if(pct >= 0.995){
      navLinks.forEach(function(l){ l.classList.remove('active'); });
      lastLink.classList.add('active');
    }
    ticking = false;
  }
  function onScroll(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  }
  updateProgress();
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);

  if(!('IntersectionObserver' in window)) return;
  var linkByHash = {};
  var sections = [];
  navLinks.forEach(function(link){
    var href = link.getAttribute('href');
    // only same-page hashes (e.g. "#sobre") can be scrollspied — links that
    // point at another page (e.g. "/index.html#sobre") are skipped here
    if(!href || href.charAt(0) !== '#') return;
    linkByHash[href] = link;
    var section = document.querySelector(href);
    if(section) sections.push(section);
  });
  if(!sections.length) return;
  var navObserver = new IntersectionObserver(function(entries){
    var doc = document.documentElement;
    var atBottom = doc.scrollTop >= doc.scrollHeight - doc.clientHeight - 2;
    if(atBottom) return;
    entries.forEach(function(entry){
      var hash = '#' + entry.target.id;
      var link = linkByHash[hash];
      if(!link) return;
      if(entry.isIntersecting) link.classList.add('active');
      else link.classList.remove('active');
    });
  }, {rootMargin: '-35% 0px -55% 0px'});
  sections.forEach(function(section){ navObserver.observe(section); });
})();

// hero: mesh de gradiente + spotlight + cards de ferramentas reagem sutilmente ao mouse
(function(){
  var hero = document.querySelector('.hero-dark');
  var mesh = hero && hero.querySelector('.hero-mesh');
  if(!hero || !mesh) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(window.matchMedia('(pointer: coarse)').matches) return;
  var rafPending = false, lastEvent = null;
  hero.addEventListener('pointermove', function(e){
    lastEvent = e;
    if(rafPending) return;
    rafPending = true;
    requestAnimationFrame(function(){
      var rect = hero.getBoundingClientRect();
      var x = (lastEvent.clientX - rect.left) / rect.width - 0.5;
      var y = (lastEvent.clientY - rect.top) / rect.height - 0.5;
      mesh.style.transform = 'translate(' + (x * 24).toFixed(1) + 'px,' + (y * 24).toFixed(1) + 'px)';
      hero.style.setProperty('--mx', ((x + 0.5) * 100).toFixed(1) + '%');
      hero.style.setProperty('--my', ((y + 0.5) * 100).toFixed(1) + '%');
      rafPending = false;
    });
  });
  hero.addEventListener('pointerleave', function(){
    mesh.style.transform = 'translate(0,0)';
  });
})();

// esteira de ferramentas: scroll infinito de verdade — cada card tem sua
// própria posição em JS e é reciclado (somado de volta pra "fila") assim que
// sai da área visível, então nenhum card jamais pula de volta ao início:
// ele reaparece do outro lado antes de qualquer um poder notar
(function(){
  var container = document.querySelector('.tool-cards');
  var tracks = document.querySelectorAll('.tool-track');
  if(!container || !tracks.length) return;

  var mq = window.matchMedia('(max-width: 1000px)');
  var SPEED = {up: 51, down: 42.5}; // px/s — equivalente às durações originais (510px em 10s/12s)

  // a máscara de fade de .tool-cards fica sobre um elemento com transform 3D
  // (perspective + rotateX + rotate), então translateY local não mapeia
  // linearmente para posição na tela — em vez de supor um valor de buffer
  // fixo, medimos de fato (opacidade real, via getBoundingClientRect) onde
  // cada trilha fica totalmente invisível, tanto saindo por cima quanto
  // entrando por baixo, e usamos esses pontos calibrados para reciclar
  function xOpacity(xpx){ return xpx<=200?0: xpx>=320?1: (xpx-200)/120; }
  function yOpacity(ypx, H){
    var bottomFlat = H*0.84;
    if(ypx<=200) return 0;
    if(ypx<300) return (ypx-200)/100;
    if(ypx<=bottomFlat) return 1;
    if(ypx<H) return (H-ypx)/(H-bottomFlat);
    return 0;
  }
  function opacityAt(card, y){
    card.style.transform = 'translateY(' + y + 'px)';
    var cRect = container.getBoundingClientRect();
    var r = card.getBoundingClientRect();
    var H = cRect.height;
    if(r.right < cRect.left || r.left > cRect.right || r.bottom < cRect.top || r.top > cRect.bottom) return 0;
    var op = 1;
    if(r.left < cRect.left) op = Math.min(op, xOpacity(r.right - cRect.left));
    if(r.top < cRect.top) op = Math.min(op, yOpacity(r.bottom - cRect.top, H));
    if(r.bottom > cRect.bottom) op = Math.min(op, yOpacity(r.top - cRect.top, H));
    return op;
  }
  function calibrate(card){
    var topExit = -800, bottomEntry = 3000;
    for(var y = 0; y >= -2000; y -= 20){
      if(opacityAt(card, y) <= 0.01){ topExit = y; break; }
    }
    for(var y2 = 0; y2 <= 5000; y2 += 25){
      if(opacityAt(card, y2) <= 0.01){ bottomEntry = y2; break; }
    }
    return {topExit: topExit - 60, bottomEntry: bottomEntry + 60}; // margem extra de segurança
  }

  var lanes = [];
  Array.prototype.forEach.call(tracks, function(track){
    var templates = Array.prototype.slice.call(track.querySelectorAll('.tool-card'));
    if(!templates.length) return;
    var dir = track.classList.contains('tool-track--down') ? 1 : -1;
    lanes.push({
      track: track, templates: templates, cards: [], dir: dir,
      speed: dir === 1 ? SPEED.down : SPEED.up,
      step: 0, topExit: 0, bottomEntry: 0, y: []
    });
  });
  if(!lanes.length) return;

  // o vão entre "invisível saindo por cima" e "invisível entrando por baixo"
  // é maior do que os 3 cards únicos cobrem no espaçamento apertado original
  // — clonamos o conjunto exatamente o número de vezes necessário pra cobrir
  // o vão (nem menos, o que deixa buraco sem card nenhum, nem mais, o que
  // sobrepõe cards na emenda do loop)
  function rebuildCards(lane, count){
    lane.track.querySelectorAll('.tool-card[data-tc-clone]').forEach(function(n){ n.remove(); });
    var list = lane.templates.slice();
    while(list.length < count){
      var tpl = lane.templates[list.length % lane.templates.length];
      var clone = tpl.cloneNode(true);
      clone.setAttribute('data-tc-clone', '1');
      clone.style.setProperty('--i', list.length % lane.templates.length);
      lane.track.appendChild(clone);
      list.push(clone);
    }
    lane.cards = list;
  }

  function measure(){
    // as duas colunas usam o MESMO espaçamento (independente de quantos
    // cards cada uma acaba precisando para cobrir seu próprio vão) — sem
    // isso, colunas com vãos calibrados ligeiramente diferentes acabavam
    // com espaçamentos visivelmente diferentes entre si
    var targetStep = lanes[0].templates[0].offsetHeight + 20; // altura do card + os 20px de espaçamento original

    lanes.forEach(function(lane){
      lane.step = targetStep;
      var bounds = calibrate(lane.templates[0]);
      lane.topExit = bounds.topExit;
      lane.bottomEntry = bounds.bottomEntry;
      var span = lane.bottomEntry - lane.topExit;
      var count = Math.max(lane.templates.length, Math.ceil(span / targetStep) + 1);
      // o "pool" de reciclagem é sempre um múltiplo exato do step
      // compartilhado — assim, ao reaparecer do outro lado, o card cai
      // exatamente na mesma grade de espaçamento, sem nenhuma costura
      // menor que as demais (o bug de sobreposição da vez passada)
      lane.pool = count * targetStep;
      rebuildCards(lane, count);
      lane.y = [];
      lane.cards.forEach(function(card, i){
        lane.y[i] = lane.topExit + i * lane.step;
        card.style.transform = 'translateY(' + lane.y[i].toFixed(1) + 'px)';
      });
    });
  }
  measure();
  window.addEventListener('resize', measure);

  var last = performance.now();
  function frame(now){
    var dt = (now - last) / 1000;
    last = now;
    if(!mq.matches){
      if(dt > 0.1) dt = 0.1; // evita saltos grandes ao voltar de uma aba em segundo plano
      lanes.forEach(function(lane){
        for(var i = 0; i < lane.cards.length; i++){
          lane.y[i] += lane.dir * lane.speed * dt;
          if(lane.dir === -1 && lane.y[i] < lane.topExit) lane.y[i] += lane.pool;
          if(lane.dir === 1 && lane.y[i] > lane.bottomEntry) lane.y[i] -= lane.pool;
          lane.cards[i].style.transform = 'translateY(' + lane.y[i].toFixed(1) + 'px)';
        }
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
