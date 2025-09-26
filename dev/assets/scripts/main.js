
"use strict";
function when(selectorOrTest, importer, runner) {
  const ok =
    typeof selectorOrTest === "function"
      ? selectorOrTest()
      : document.querySelector(selectorOrTest);

  if (!ok) return;

  importer()
    .then((m) => (runner ? runner(m) : m.default?.()))
    .catch((e) => console.error("[feature load error]", e));
}

function init() {

  when('[data-module="header"]', () =>
    import("@components/header/header.js")
  ); 
    when("[data-swiper]", () =>
    import("@components/swiper/swiper.js")
  ); 
  when('[data-table]', () =>
  import('@components/table/table.js')
);
  when("[data-tabs]", () =>
    import("@components/tabs/tabs.js")
  ); 
  when("[data-calendar]", () =>
    import("@components/calendar/calendar.js")
  ); 
  when("[data-infinite-scroll]", () =>
  import("@components/infinite-scroll/infinite-scroll.js"),
  (module) => {
    const containers = document.querySelectorAll('[data-infinite-scroll]');
    
    containers.forEach(container => {
      const cardType = container.dataset.cardType || 'default';
      const itemsPerPage = parseInt(container.dataset.itemsPerPage) || 8;
      
      const infiniteScroll = new module.default(container, {
        cardType: cardType,
        itemsPerPage: itemsPerPage,
        rootMargin: '100px',
        delay: 600,
      });
      
      // Listen to events
      container.addEventListener('itemsLoaded', (e) => {
        console.log(`${e.detail.cardType}: loaded ${e.detail.items.length} items`);
        
        // Analytics tracking
        if (window.gtag) {
          window.gtag('event', 'infinite_scroll_load', {
            content_type: e.detail.cardType,
            items_loaded: e.detail.items.length,
            page_number: e.detail.page
          });
        }
      });
      
      container.addEventListener('loadError', (e) => {
        console.error(`Error loading ${e.detail.cardType}:`, e.detail.error);
      });
      
      // Retry functionality
      const retryButton = container.querySelector('[data-retry]');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          infiniteScroll.reload();
        });
      }
    });
  }
);
//   when('[data-module="header-league"]', () =>
//   import("@components/header-league/header-league.js")
//   );
//   when('[data-calendar]', () => import('@components/calendar/calendar.js'));
//   when('[data-pagination]', () =>
//   import('@components/pagination/pagination.js')
// );

}

// DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}