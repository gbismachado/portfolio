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
  var scene = hero && hero.querySelector('.tool-scene');
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
      if(scene){
        // opposite direction from the mesh, smaller range — a nearer
        // layer drifting against the background gives a light 3D parallax
        scene.style.setProperty('--tx', (x * -16).toFixed(1) + 'px');
        scene.style.setProperty('--ty', (y * -16).toFixed(1) + 'px');
      }
      rafPending = false;
    });
  });
  hero.addEventListener('pointerleave', function(){
    mesh.style.transform = 'translate(0,0)';
    if(scene){
      scene.style.setProperty('--tx', '0px');
      scene.style.setProperty('--ty', '0px');
    }
  });
})();
