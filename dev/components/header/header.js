const root = document.documentElement;
const header = document.querySelector('.header');
const burger = document.querySelector('.header__burger');
const nav = document.getElementById('site-nav');
const overlay = document.querySelector('.header__overlay');

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

function setNoScroll(on) {
  if (on) {
    const sbw = getScrollbarWidth();
    document.body.style.paddingRight = sbw ? `${sbw}px` : '';
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
    document.body.style.paddingRight = '';
  }
}

function openMenu() {
  header.classList.add('header--menu-open');
  burger.setAttribute('aria-expanded', 'true');
  overlay.hidden = false;        // показать перед анимацией
  requestAnimationFrame(() => {  // гарантируем старт перехода
    overlay.classList.add('is-visible');
  });
  setNoScroll(true);
}

function closeMenu() {
  header.classList.remove('header--menu-open');
  burger.setAttribute('aria-expanded', 'false');

  // плавно спрячем оверлей после окончания transition
  overlay.classList.remove('is-visible');
  const onEnd = (e) => {
    if (e.target !== overlay) return;
    overlay.hidden = true;
    overlay.removeEventListener('transitionend', onEnd);
  };
  overlay.addEventListener('transitionend', onEnd);

  setNoScroll(false);
}

function toggleMenu() {
  if (header.classList.contains('header--menu-open')) closeMenu();
  else openMenu();
}

burger.addEventListener('click', toggleMenu);
overlay.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// закрывать при клике по ссылке
nav.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (a) closeMenu();
});
