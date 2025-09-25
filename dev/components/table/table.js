export default function initTableSmart() {
  const blocks = document.querySelectorAll('[data-table]');
  if (!blocks.length) return;

  blocks.forEach(block => {
    const variant = block.getAttribute('data-table') || 'default';
    const wrap = block.querySelector('.table__wrap');
    if (!wrap) return;

    // 1) Горизонтальный скролл колесом (только для default)
    if (variant === 'default') {
      wrap.addEventListener(
        'wheel',
        (e) => {
          // если вертикальная прокрутка преобладает — конвертируем её в горизонтальную
          const moreVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
          if (moreVertical && wrap.scrollWidth > wrap.clientWidth) {
            wrap.scrollLeft += e.deltaY;
          }
        },
        { passive: true }
      );
    }

    // 2) Подсказки для формы W/D/L (accessibility)
    const formLists = block.querySelectorAll('.form');
    formLists.forEach((ul) => {
      ul.setAttribute('role', 'list');
      ul.querySelectorAll('.form__item').forEach((li) => {
        const map = { W: 'Win', D: 'Draw', L: 'Lose' };
        const t = (li.textContent || '').trim();
        li.setAttribute('aria-label', map[t] || t);
      });
    });

    // 3) Sticky-шапка таблицы (CSS должен поддержать position: sticky)
    const head = block.querySelector('.table__head');
    if (head) {
      head.style.position = 'sticky';
      head.style.top = '0';
      head.style.zIndex = '2';
      // Тень при горизонтальном скролле
      wrap.addEventListener('scroll', () => {
        const scrolled = wrap.scrollLeft > 0;
        head.style.boxShadow = scrolled ? 'inset 6px 0 8px -6px rgba(0,0,0,0.25)' : 'none';
      });
    }
  });
}