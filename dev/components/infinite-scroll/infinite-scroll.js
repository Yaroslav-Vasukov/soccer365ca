
export default class InfiniteScroll {
  constructor(element, options = {}) {
    this.container = element;
    this.grid = element.querySelector(options.gridSelector || '[data-grid]');
    this.loader = element.querySelector(options.loaderSelector || '[data-loader]');
    this.endMessage = element.querySelector(options.endSelector || '[data-end-message]');
    this.errorMessage = element.querySelector(options.errorSelector || '[data-error-message]');
    
    // Configuration
    this.config = {
      itemsPerPage: options.itemsPerPage || 8,
      rootMargin: options.rootMargin || '100px',
      threshold: options.threshold || 0.1,
      delay: options.delay || 800,
      cardType: options.cardType || 'default', // 'live', 'news', 'video', 'team', etc.
      ...options
    };
    
    // Get data
    if (options.data) {
      this.allData = options.data;
    } else {
      const dataAttr = `data-${this.config.cardType}-data`;
      const dataScript = document.querySelector(`[${dataAttr}]`);
      this.allData = dataScript ? JSON.parse(dataScript.textContent) : [];
    }
    
    // State
    this.currentPage = options.startPage || 0; // Начинаем с 0, так как первые элементы уже загружены в Twig
    this.isLoading = false;
    this.hasMore = this.allData.length > this.config.itemsPerPage;
    
    // Card renderers registry
    this.cardRenderers = new Map([
      ['live', this.renderLiveCard.bind(this)],
      ['news', this.renderNewsCard.bind(this)],
      ['video', this.renderVideoCard.bind(this)],
      ['league', this.renderLeagueCard.bind(this)],
      ['default', this.renderDefaultCard.bind(this)]
    ]);
    
    // Use custom renderer if provided
    if (options.renderCard && typeof options.renderCard === 'function') {
      this.renderCard = options.renderCard.bind(this);
    } else {
      this.renderCard = this.cardRenderers.get(this.config.cardType) || this.renderDefaultCard.bind(this);
    }
    
    this.init();
  }
  
  init() {
    if (!this.hasMore) {
      this.showEndMessage();
      return;
    }
    
    this.createObserver();
    this.createSentinel();
  }
  
  createObserver() {
    const options = {
      root: null,
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoading && this.hasMore) {
          this.loadMore();
        }
      });
    }, options);
  }
  
  createSentinel() {
    this.sentinel = document.createElement('div');
    this.sentinel.className = 'infinite-scroll-sentinel';
    this.sentinel.style.cssText = 'height: 1px; margin-bottom: 1px; visibility: hidden;';
    this.container.appendChild(this.sentinel);
    this.observer.observe(this.sentinel);
  }
  
  async loadMore() {
    if (this.isLoading || !this.hasMore) return;
    
    this.isLoading = true;
    this.showLoader();
    this.hideError();
    
    try {
      if (this.config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.delay));
      }
      
      // Увеличиваем страницу перед загрузкой
      this.currentPage++;
      
      const startIndex = this.currentPage * this.config.itemsPerPage;
      const endIndex = startIndex + this.config.itemsPerPage;
      const newItems = this.allData.slice(startIndex, endIndex);
      
      if (newItems.length === 0) {
        this.hasMore = false;
        this.hideLoader();
        this.showEndMessage();
        return;
      }
      
      await this.renderItems(newItems);
      
      this.isLoading = false;
      this.hideLoader();
      
      if (endIndex >= this.allData.length) {
        this.hasMore = false;
        this.showEndMessage();
      }
      
      this.dispatchEvent('itemsLoaded', {
        items: newItems,
        page: this.currentPage,
        hasMore: this.hasMore,
        cardType: this.config.cardType
      });
      
    } catch (error) {
      console.error('Error loading more items:', error);
      this.currentPage--; // Откатываем страницу назад при ошибке
      this.isLoading = false;
      this.hideLoader();
      this.showError();
      
      this.dispatchEvent('loadError', { error, cardType: this.config.cardType });
    }
  }
  
  async renderItems(items) {
    const fragment = document.createDocumentFragment();
    
    for (const item of items) {
      const element = await this.renderCard(item);
      if (element) {
        element.classList.add('infinite-scroll-item');
        fragment.appendChild(element);
      }
    }
    
    this.grid.appendChild(fragment);
    
    // Staggered animation
    requestAnimationFrame(() => {
      const newItems = this.grid.querySelectorAll('.infinite-scroll-item:not(.infinite-scroll-item--visible)');
      newItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add('infinite-scroll-item--visible');
        }, index * 100);
      });
    });
  }
  
  // Card renderers for different types
renderLiveCard(match) {
    const card = document.createElement('article');
    card.className = 'card-live';
    
    // Отладка - проверим что приходит в данных
    console.log('Rendering match:', match);
    
    // Обработка статуса матча
    const status = match.status || 'LIVE';
    const statusClass = status.toLowerCase();
    const badgeText = status === 'FT' ? 'FT' : status === 'LIVE' ? 'LIVE' : status.toUpperCase();
    
    // Обработка времени/даты
    const matchTime = match.date || match.time || '';
    const datetime = match.date || match.datetime || matchTime;
    
    // Обработка счета - используем правильную структуру из JSON
    const score1 = match.score?.t1 ?? match.score1 ?? '0';
    const score2 = match.score?.t2 ?? match.score2 ?? '0';
    const score = `${score1} - ${score2}`;
    
    // Обработка лиги - используем правильную структуру из JSON
    const leagueName = match.league?.name || match.league || 'Unknown League';
    const leagueHref = match.league?.href || '#';
    
    // Используем правильные пути из JSON
    const thumbSrc = match.preview?.src || match.thumb || match.image || '/assets/images/bg/hero.webp';
    const team1Logo = match.team1?.logo || '/assets/images/teams/team-1.webp';
    const team2Logo = match.team2?.logo || '/assets/images/teams/team-2.webp';
    
    console.log('Image paths:', { thumbSrc, team1Logo, team2Logo });
    
    card.innerHTML = `
      <a href="${this.escapeHtml(match.href || '#')}" class="card-live__preview" aria-label="Open match">
        <img src="${thumbSrc}" 
             alt="${this.escapeHtml(match.preview?.alt || `${match.team1?.name || 'Team 1'} vs ${match.team2?.name || 'Team 2'}`)}" 
             class="card-live__thumb" loading="lazy">
        <span class="card-live__play material-symbols-outlined" aria-hidden="true">play_circle</span>
        ${status ? `<span class="card-live__badge card-live__badge--${statusClass}">${this.escapeHtml(badgeText)}</span>` : ''}
      </a>
      
      <div class="card-live__meta">
        ${matchTime ? `
          <time class="date date--card-live" datetime="${this.escapeHtml(datetime)}">
            <span class="material-symbols-outlined date__icon">calendar_today</span>
            ${this.escapeHtml(matchTime)}
          </time>
        ` : ''}
        
        <a href="${this.escapeHtml(leagueHref)}" class="card-live__league">
          ${this.escapeHtml(leagueName)}
        </a>
      </div>
      
      <div class="card-live__teams">
        <a href="${this.escapeHtml(match.team1?.href || '#')}" class="card-live__team" aria-label="${this.escapeHtml(match.team1?.name || 'Team 1')}">
          <img src="${team1Logo}" 
               alt="${this.escapeHtml(match.team1?.name || 'Team 1')}" 
               class="card-live__logo" loading="lazy">
          <span class="card-live__name">${this.escapeHtml(match.team1?.name || 'Team 1')}</span>
        </a>
        
        <span class="card-live__score">${this.escapeHtml(score)}</span>
        
        <a href="${this.escapeHtml(match.team2?.href || '#')}" class="card-live__team" aria-label="${this.escapeHtml(match.team2?.name || 'Team 2')}">
          <img src="${team2Logo}" 
               alt="${this.escapeHtml(match.team2?.name || 'Team 2')}" 
               class="card-live__logo" loading="lazy">
          <span class="card-live__name">${this.escapeHtml(match.team2?.name || 'Team 2')}</span>
        </a>
      </div>
      
      <div class="btn btn--live">
        <a href="${this.escapeHtml(match.href || '#')}" class="btn__link">
          <span class="btn__text">Live broadcast</span>
        </a>
      </div>
    `;
    
    // Добавляем обработчик ошибок только как последний fallback
    const images = card.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('error', function() {
        console.log('Image failed to load:', this.src);
        if (this.classList.contains('card-live__thumb')) {
          this.src = '/assets/images/bg/hero.webp';
        } else if (this.classList.contains('card-live__logo')) {
          this.src = '/assets/images/teams/team-1.webp';
        }
      });
    });
    
    return card;
  }
  
  renderNewsCard(post) {
    const card = document.createElement('article');
    card.className = 'card-post';
    
    // Обработка данных согласно JSON структуре
    const href = post.href || '#';
    const imgSrc = post.thumb || '/assets/images/placeholder.webp';
    const imgAlt = post.title || 'Post image';
    const dateValue = post.published_at || null;
    const tags = Array.isArray(post.tags) ? post.tags : [];
    
    console.log('Rendering news post:', { href, imgSrc, title: post.title, tags });
    
    // Создаем HTML структуру как в Twig шаблоне
    card.innerHTML = `
      <div class="card-post__thumbnail">
        <a href="${this.escapeHtml(href)}" class="card-post__link">
          <img src="${imgSrc}" 
               alt="${this.escapeHtml(imgAlt)}" 
               class="card-post__image" 
               loading="lazy">
        </a>
        
        ${tags.length ? this.renderTagsAbsolute(tags) : ''}
      </div>
      
      <div class="card-post__content">
        <h3 class="card-post__title">
          <a href="${this.escapeHtml(href)}" class="card-post__title-link">
            ${this.escapeHtml(post.title || 'Untitled post')}
          </a>
        </h3>
        
        <div class="card-post__meta">
          ${dateValue ? this.renderDateShort(dateValue) : ''}
        </div>
      </div>
    `;
    
    // Обработчик ошибок для изображения
    const img = card.querySelector('img');
    if (img) {
      img.addEventListener('error', function() {
        console.log('News image failed to load:', this.src);
        this.src = '/assets/images/placeholder.webp';
      });
    }
    
    return card;
  }
  
  // Вспомогательная функция для рендеринга тегов
  renderTagsAbsolute(tags) {
    if (!tags || !tags.length) return '';
    
    const tagsHtml = tags.map(tag => {
      const label = tag.label || tag;
      const href = tag.href || '#';
      return `<a href="${this.escapeHtml(href)}" class="tag tag--absolute">${this.escapeHtml(label)}</a>`;
    }).join('');
    
    return `<div class="tag-absolute">${tagsHtml}</div>`;
  }
  
  // Вспомогательная функция для рендеринга даты
  renderDateShort(dateValue) {
    if (!dateValue) return '';
    
    const date = new Date(dateValue);
    const formattedDate = date.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).replace(/\//g, '.');
    
    return `
      <time class="date date--short" datetime="${dateValue}">
        <span class="material-symbols-outlined date__icon">calendar_today</span>
        ${formattedDate}
      </time>
    `;
  }
  
renderVideoCard(video) {
    const card = document.createElement('article');
    card.className = 'card-video';
    
    // Обработка данных согласно JSON структуре
    const href = video.href || '#';
    const thumbSrc = video.thumb || '/assets/images/pictures/default.webp';
    const title = video.title || 'Untitled video';
    const dateValue = video.published_at || null;
    const tags = Array.isArray(video.tags) ? video.tags : [];
    
    console.log('Rendering video:', { href, thumbSrc, title, dateValue, tags });
    
    // Создаем HTML структуру как в Twig шаблоне
    card.innerHTML = `
      <a href="${this.escapeHtml(href)}" class="card-video__thumb">
        <img src="${thumbSrc}" alt="thumb" class="card-video__thumbnail" loading="lazy">
        <span class="card-video__play material-symbols-outlined">play_circle</span>
      </a>
      
      <div class="card-video__content">
        <h3 class="card-video__title">
          <a href="${this.escapeHtml(href)}" class="card-video__link">${this.escapeHtml(title)}</a>
        </h3>
        
        <div class="card-video__meta">
          ${dateValue ? this.renderDateVideo(dateValue) : ''}
        </div>
        
        ${tags.length ? this.renderTagsAbsolute(tags) : ''}
      </div>
    `;
    
    // Обработчик ошибок для изображения
    const img = card.querySelector('img');
    if (img) {
      img.addEventListener('error', function() {
        console.log('Video thumbnail failed to load:', this.src);
        this.src = '/assets/images/pictures/default.webp';
      });
    }
    
    return card;
  }
  

  
  renderLeagueCard(league) {
    const card = document.createElement('article');
    card.className = 'card-league';
    
    // Обработка данных согласно JSON структуре
    const href = league.href || '#';
    const logoSrc = league.logo || null;
    const logoAlt = league.logo_alt || '';
    const name = league.name || 'League name';
    const country = league.country || null;
    const champion = league.champion || null;
    
    console.log('Rendering league:', { href, logoSrc, name, country, champion });
    
    // Создаем HTML структуру как в Twig шаблоне
    card.innerHTML = `
      <div class="card-league__top">
        <a href="${this.escapeHtml(href)}" class="card-league__link">
          ${logoSrc ? `<img src="${logoSrc}" alt="${this.escapeHtml(logoAlt)}" class="card-league__logo" loading="lazy">` : ''}
        </a>
        <div class="card-league__info">
          <h3 class="card-league__name">
            <a href="${this.escapeHtml(href)}" class="card-league__name-link">${this.escapeHtml(name)}</a>
          </h3>
          ${country ? `<p class="card-league__meta">${this.escapeHtml(country)}</p>` : ''}
        </div>
      </div>
      
      ${champion ? `
        <div class="card-league__bot">
          <a href="${this.escapeHtml(champion.href || '#')}" class="card-league__champion">
            ${champion.logo ? `<img src="${champion.logo}" alt="${this.escapeHtml(champion.logo_alt || '')}" class="card-league__champion-logo" loading="lazy">` : ''}
            <span class="card-league__champion-name">${this.escapeHtml(champion.name || 'Champion')}</span>
          </a>
          <span class="material-symbols-outlined card-league__champion-icon">trophy</span>
        </div>
      ` : ''}
    `;
    
    // Обработчики ошибок для изображений
    const images = card.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('error', function() {
        console.log('League card image failed to load:', this.src);
        if (this.classList.contains('card-league__logo')) {
          // Заменяем логотип лиги на fallback
          this.src = '/assets/images/leagues/default.webp';
        } else if (this.classList.contains('card-league__champion-logo')) {
          // Заменяем логотип чемпиона на fallback
          this.src = '/assets/images/teams/team-1.webp';
        }
      });
    });
    
    return card;
  }
  

  
  renderDefaultCard(item) {
    const card = document.createElement('div');
    card.className = 'card-default';
    
    card.innerHTML = `
      <div class="card-default__inner">
        <h3 class="card-default__title">
          <a href="${this.escapeHtml(item.href || '#')}">${this.escapeHtml(item.title || item.name || 'Untitled')}</a>
        </h3>
        ${item.description ? `<p class="card-default__description">${this.escapeHtml(item.description)}</p>` : ''}
      </div>
    `;
    
    return card;
  }
  
  // Вспомогательные функции для рендереров
  renderTagsAbsolute(tags) {
    if (!tags || !tags.length) return '';
    
    const tagsHtml = tags.map(tag => {
      const label = tag.label || tag;
      const href = tag.href || '#';
      return `<a href="${this.escapeHtml(href)}" class="tag tag--absolute">${this.escapeHtml(label)}</a>`;
    }).join('');
    
    return `<div class="tag-absolute">${tagsHtml}</div>`;
  }
   renderDateVideo(dateValue) {
    if (!dateValue) return '';
    
    const date = new Date(dateValue);
    const formattedDate = date.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).replace(/\//g, '.');
    
    return `
      <time class="date date--video" datetime="${dateValue}">
        <span class="material-symbols-outlined date__icon">calendar_today</span>
        ${formattedDate}
      </time>
    `;
  }
  renderDateShort(dateValue) {
    if (!dateValue) return '';
    
    const date = new Date(dateValue);
    const formattedDate = date.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).replace(/\//g, '.');
    
    return `
      <time class="date date--short" datetime="${dateValue}">
        <span class="material-symbols-outlined date__icon">calendar_today</span>
        ${formattedDate}
      </time>
    `;
  }
  
  // Utility methods
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  formatViews(views) {
    if (!views) return '0';
    if (views >= 1000000) return Math.floor(views / 100000) / 10 + 'M';
    if (views >= 1000) return Math.floor(views / 100) / 10 + 'K';
    return views.toString();
  }
  
  // State management methods
  showLoader() {
    if (this.loader) {
      this.loader.hidden = false;
      this.container.classList.add('infinite-scroll-container--loading');
    }
  }
  
  hideLoader() {
    if (this.loader) {
      this.loader.hidden = true;
      this.container.classList.remove('infinite-scroll-container--loading');
    }
  }
  
  showEndMessage() {
    if (this.endMessage) {
      this.endMessage.hidden = false;
    }
    this.destroySentinel();
  }
  
  showError() {
    if (this.errorMessage) {
      this.errorMessage.hidden = false;
      this.container.classList.add('infinite-scroll-container--error');
    }
  }
  
  hideError() {
    if (this.errorMessage) {
      this.errorMessage.hidden = true;
      this.container.classList.remove('infinite-scroll-container--error');
    }
  }
  
  destroySentinel() {
    if (this.sentinel && this.observer) {
      this.observer.unobserve(this.sentinel);
      this.sentinel.remove();
      this.sentinel = null;
    }
  }
  
  dispatchEvent(eventName, detail) {
    this.container.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
  
  // Public API
  reload() {
    this.currentPage = 0; // Сбрасываем на 0
    this.isLoading = false;
    this.hasMore = this.allData.length > this.config.itemsPerPage;
    this.grid.innerHTML = '';
    this.hideLoader();
    this.hideError();
    if (this.endMessage) this.endMessage.hidden = true;
    this.container.classList.remove('infinite-scroll-container--loading', 'infinite-scroll-container--error');
    this.destroySentinel();
    this.init();
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.destroySentinel();
  }
  
  // Add custom card renderer
  addCardRenderer(type, renderer) {
    this.cardRenderers.set(type, renderer);
  }
}