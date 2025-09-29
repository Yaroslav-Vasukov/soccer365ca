const P=document.querySelector(".header"),N=document.querySelector(".header__burger"),j=document.getElementById("site-nav"),H=document.querySelector(".header__overlay");function W(){return window.innerWidth-document.documentElement.clientWidth}function z(r){if(r){const e=W();document.body.style.paddingRight=e?`${e}px`:"",document.body.classList.add("no-scroll")}else document.body.classList.remove("no-scroll"),document.body.style.paddingRight=""}function J(){P.classList.add("header--menu-open"),N.setAttribute("aria-expanded","true"),H.hidden=!1,requestAnimationFrame(()=>{H.classList.add("is-visible")}),z(!0)}function A(){P.classList.remove("header--menu-open"),N.setAttribute("aria-expanded","false"),H.classList.remove("is-visible");const r=e=>{e.target===H&&(H.hidden=!0,H.removeEventListener("transitionend",r))};H.addEventListener("transitionend",r),z(!1)}function B(){P.classList.contains("header--menu-open")?A():J()}N.addEventListener("click",B);H.addEventListener("click",A);document.addEventListener("keydown",r=>{r.key==="Escape"&&A()});j.addEventListener("click",r=>{r.target.closest("a")&&A()});const se=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));document.querySelectorAll(".swiper[data-swiper]").forEach(function(r){var e={};try{e=JSON.parse(r.getAttribute("data-swiper")||"{}")}catch{e={}}var t=r.querySelector("[data-swiper-prev]"),a=r.querySelector("[data-swiper-next]"),i=r.querySelector("[data-swiper-pagination]");(t||a)&&(e.navigation={prevEl:t||void 0,nextEl:a||void 0}),i&&(e.pagination={el:i,clickable:!0});var c={slidesPerView:1,spaceBetween:16};new Swiper(r,Object.assign(c,e))});const ne=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));function V(){const r=document.querySelectorAll("[data-table]");r.length&&r.forEach(e=>{const t=e.getAttribute("data-table")||"default",a=e.querySelector(".table__wrap");if(!a)return;t==="default"&&a.addEventListener("wheel",o=>{Math.abs(o.deltaY)>Math.abs(o.deltaX)&&a.scrollWidth>a.clientWidth&&(a.scrollLeft+=o.deltaY)},{passive:!0}),e.querySelectorAll(".form").forEach(o=>{o.setAttribute("role","list"),o.querySelectorAll(".form__item").forEach(g=>{const f={W:"Win",D:"Draw",L:"Lose"},_=(g.textContent||"").trim();g.setAttribute("aria-label",f[_]||_)})});const c=e.querySelector(".table__head");c&&(c.style.position="sticky",c.style.top="0",c.style.zIndex="2",a.addEventListener("scroll",()=>{const o=a.scrollLeft>0;c.style.boxShadow=o?"inset 6px 0 8px -6px rgba(0,0,0,0.25)":"none"}))})}const re=Object.freeze(Object.defineProperty({__proto__:null,default:V},Symbol.toStringTag,{value:"Module"}));function q(r,e){return Array.from(r.querySelectorAll(e))}function x(r="id"){return`${r}-${Math.random().toString(36).slice(2,9)}`}function U(r=document){q(r,"[data-tabs]").forEach(t=>{const a=q(t,'[role="tab"], .tabs__tab'),i=q(t,'[role="tabpanel"], .tabs__panel');if(!a.length||!i.length)return;a.forEach((n,d)=>{if(n.id||(n.id=x("tab")),n.setAttribute("role","tab"),n.setAttribute("aria-selected","false"),n.tabIndex=-1,!n.getAttribute("aria-controls")){const u=i[d]||i[0];u&&(u.id||(u.id=x("panel")),n.setAttribute("aria-controls",u.id))}}),i.forEach((n,d)=>{n.id||(n.id=x("panel")),n.setAttribute("role","tabpanel");const l=a[d]||a[0];l&&n.setAttribute("aria-labelledby",l.id),n.hidden=!0,n.removeAttribute("hidden"),n.hidden=!0,n.classList.remove("is-active")});const c=n=>{if(!n)return;a.forEach(p=>{p.classList.remove("is-active"),p.setAttribute("aria-selected","false"),p.tabIndex=-1}),i.forEach(p=>{p.classList.remove("is-active"),p.hidden=!0,p.setAttribute("hidden","")}),n.classList.add("is-active"),n.setAttribute("aria-selected","true"),n.tabIndex=0;const d=n.getAttribute("aria-controls"),l=d?t.querySelector("#"+d):null;l&&(l.hidden=!1,l.removeAttribute("hidden"),l.classList.add("is-active"));const u=n.dataset.tab||n.id;if(t.dataset.active=u,t.dataset.tabsSync==="hash"&&t.id){const p=new URLSearchParams(window.location.hash.slice(1));p.set(t.id,u),window.history.replaceState(null,"","#"+p.toString())}t.dispatchEvent(new CustomEvent("tabs:change",{detail:{value:u,tab:n,panel:l},bubbles:!0}))},g=(()=>{if(t.dataset.tabsSync==="hash"&&t.id){const l=new URLSearchParams(window.location.hash.slice(1)).get(t.id);if(l){const u=a.find(p=>(p.dataset.tab||p.id)===l);if(u)return u}}if(t.dataset.active){const d=a.find(l=>(l.dataset.tab||l.id)===t.dataset.active);if(d)return d}const n=t.querySelector(".tabs__tab.is-active");return n||a[0]})();c(g);const f=g?.getAttribute("aria-controls"),_=f?t.querySelector("#"+f):null;_&&(_.hidden=!1,_.removeAttribute("hidden"),_.classList.add("is-active")),a.forEach(n=>{n.addEventListener("click",()=>c(n)),n.addEventListener("keydown",d=>{(d.key==="Enter"||d.key===" ")&&(d.preventDefault(),c(n))})}),(t.querySelector('[role="tablist"]')||t).addEventListener("keydown",n=>{const d=a,l=d.findIndex(p=>p.getAttribute("aria-selected")==="true");if(l<0)return;let u=l;(n.key==="ArrowRight"||n.key==="ArrowDown")&&(u=(l+1)%d.length),(n.key==="ArrowLeft"||n.key==="ArrowUp")&&(u=(l-1+d.length)%d.length),n.key==="Home"&&(u=0),n.key==="End"&&(u=d.length-1),u!==l&&(n.preventDefault(),d[u].focus(),c(d[u]))}),t.dataset.tabsSync==="hash"&&t.id&&window.addEventListener("hashchange",()=>{const d=new URLSearchParams(window.location.hash.slice(1)).get(t.id);if(!d)return;const l=a.find(u=>(u.dataset.tab||u.id)===d);l&&l!==t.querySelector(".tabs__tab.is-active")&&c(l)}),t.switchTo=n=>{const d=a.find(l=>(l.dataset.tab||l.id)===n);d&&c(d)}})}function G(){U(document)}const ie=Object.freeze(Object.defineProperty({__proto__:null,default:G,initStandingsTabs:U},Symbol.toStringTag,{value:"Module"})),K=["January","February","March","April","May","June","July","August","September","October","November","December"],X=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],Q=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],R=r=>String(r).padStart(2,"0"),k=(r,e,t)=>`${r}-${R(e+1)}-${R(t)}`;function Z(r){const e=String(r.getDate()).padStart(2,"0"),t=Q[r.getMonth()],a=String(r.getHours()).padStart(2,"0"),i=String(r.getMinutes()).padStart(2,"0");return`${e} ${t}, ${a}:${i}`}function ee(r){console.log("Initializing calendar:",r);const e=r.querySelector('[data-el="grid"]'),t=r.querySelector('[data-el="month"]'),a=r.querySelector('[data-el="year"]'),i=r.querySelector('[data-el="matches"]'),c=r.querySelector('[data-el="matches-date"]');if(!e||!t||!a||!i||!c){console.error("Calendar: Missing required elements");return}let o={};try{const s=r.dataset.matches||"{}";console.log("Raw matches data:",s),o=JSON.parse(s),console.log("Parsed matches data:",o),console.log("Dates with matches:",Object.keys(o))}catch(s){console.error("Error parsing matches data:",s),o={}}let g=!1;const f=new Date;f.setHours(0,0,0,0);let _=new Date(f.getFullYear(),f.getMonth(),1),w=new Date(f);const n=r.querySelector("[data-prev-month]"),d=r.querySelector("[data-next-month]"),l=r.querySelector("[data-go-today]"),u=r.querySelector("[data-toggle-empty]");n&&n.addEventListener("click",()=>{_=new Date(_.getFullYear(),_.getMonth()-1,1),p()}),d&&d.addEventListener("click",()=>{_=new Date(_.getFullYear(),_.getMonth()+1,1),p()}),l&&l.addEventListener("click",s=>{s.preventDefault();const h=new Date;_=new Date(h.getFullYear(),h.getMonth(),1),w=new Date(h),p()}),u&&u.addEventListener("click",s=>{s.preventDefault(),g=!g,u.setAttribute("aria-pressed",String(g));const h=u.querySelector(".material-symbols-outlined");h&&(h.textContent=g?"visibility":"visibility_off"),g?e.classList.add("calendar__grid--compact"):e.classList.remove("calendar__grid--compact"),p()}),p();function p(){I(),D(),F()}function I(){t.textContent=K[_.getMonth()],a.textContent=_.getFullYear()}function D(){if(e.innerHTML="",!g){const y=document.createElement("div");y.className="calendar__dow",X.forEach(m=>{const S=document.createElement("span");S.textContent=m,y.appendChild(S)}),e.appendChild(y)}const s=_.getFullYear(),h=_.getMonth(),$=new Date(s,h,1),L=new Date(s,h+1,0).getDate(),M=($.getDay()+6)%7;if(g){const y=[];for(let m=1;m<=L;m++){const S=k(s,h,m);o[S]&&o[S].length>0&&y.push(m)}if(y.length>0){const m=document.createElement("div");m.className="calendar__compact-grid",y.forEach(S=>{m.appendChild(C(new Date(s,h,S),!1))}),e.appendChild(m)}else{const m=document.createElement("div");m.className="calendar__no-matches",m.textContent="No matches this month",e.appendChild(m)}}else{const y=new Date(s,h,0).getDate();for(let v=0;v<M;v++){const E=y-M+1+v;e.appendChild(C(new Date(s,h-1,E),!0))}for(let v=1;v<=L;v++)e.appendChild(C(new Date(s,h,v),!1));const S=(7-(M+L)%7)%7;for(let v=1;v<=S;v++)e.appendChild(C(new Date(s,h+1,v),!0))}}function C(s,h){const $=s.getFullYear(),L=s.getMonth(),M=s.getDate(),y=k($,L,M),m=document.createElement("button");m.type="button",m.className="calendar__cell"+(h?" calendar__cell--muted":""),m.setAttribute("role","gridcell"),m.setAttribute("aria-selected",String(O(s,w))),m.dataset.date=y,O(s,f)&&m.classList.add("calendar__today");const S=document.createElement("div");S.className="calendar__daynum",S.textContent=M,m.appendChild(S);const v=o[y]||[],E=v.length;if(console.log(`Date ${y}: ${E} matches`,v),E>0){const b=document.createElement("div");b.className="calendar__badge",b.textContent=E,m.appendChild(b)}return m.addEventListener("click",()=>{w=new Date($,L,M),h?(_=new Date($,L,1),p()):(e.querySelectorAll('.calendar__cell[aria-selected="true"]').forEach(b=>b.setAttribute("aria-selected","false")),m.setAttribute("aria-selected","true"),F())}),m}function O(s,h){return s.getFullYear()===h.getFullYear()&&s.getMonth()===h.getMonth()&&s.getDate()===h.getDate()}function Y(s){console.log("Creating card for match:",s);const h=document.createElement("article");h.className="card-match";const $=s.score_home!==null&&s.score_away!==null&&s.score_home!==void 0&&s.score_away!==void 0&&s.score_home!=="—"&&s.score_away!=="—",L=$&&Number(s.score_home)>Number(s.score_away),M=$&&Number(s.score_away)>Number(s.score_home),y=s.date_value?new Date(s.date_value):null,m=y?Z(y):"TBD",S=s.status?.toLowerCase()==="live";let v="card-match__status";const E=s.status?.toLowerCase()||"scheduled";["live","ongoing"].includes(E)?v+=" card-match__status--live":["finished","final","ft"].includes(E)?v+=" card-match__status--finished":v+=" card-match__status--scheduled";let b=s.button;if(!b||!b.label){const T=s.href||"#";["live","ongoing"].includes(E)?b={label:"Watch Live",url:T,icon:"play_arrow"}:["finished","final","ft"].includes(E)?b={label:"Match Report",url:T,icon:"article"}:["scheduled","upcoming"].includes(E)?b={label:"Preview",url:T,icon:"visibility"}:b={label:"Match Center",url:T,icon:"sports_soccer"}}return h.innerHTML=`
      <div class="card-match__top">
        <a href="${s.league?.href||"#"}" class="card-match__league-link">
          <img
            src="${s.league?.logo||"/assets/images/leagues/default.webp"}"
            alt="${s.league?.name||"League"}"
            class="card-match__league-img"
            loading="lazy"
            decoding="async">
          <span>${s.league?.name||"League"}</span>
        </a>
      </div>

      <div class="card-match__teams-section">
        <a href="${s.home?.href||"#"}" class="card-match__team">
          <img
            src="${s.home?.logo||"/assets/images/teams/default.webp"}"
            alt="${s.home?.name||"Team 1"}"
            class="card-match__team-logo"
            loading="lazy"
            decoding="async">
          <span class="card-match__team-name">${s.home?.name||"Team 1"}</span>
        </a>

        <div class="card-match__center">
          ${$?`
            <div class="card-match__score">
              <span class="card-match__score-num${L?" card-match__score-num--winner":""}">${s.score_home}</span>
              <span class="card-match__score-dash">-</span>
              <span class="card-match__score-num${M?" card-match__score-num--winner":""}">${s.score_away}</span>
            </div>
          `:`
            <div class="card-match__vs">vs</div>
          `}
        </div>

        <a href="${s.away?.href||"#"}" class="card-match__team">
          <img
            src="${s.away?.logo||"/assets/images/teams/default.webp"}"
            alt="${s.away?.name||"Team 2"}"
            class="card-match__team-logo"
            loading="lazy"
            decoding="async">
          <span class="card-match__team-name">${s.away?.name||"Team 2"}</span>
        </a>
      </div>

      <div class="card-match__bottom">
        <div class="card-match__date">
          <span class="material-symbols-outlined">
            ${S?"schedule":"calendar_today"}
          </span>
          <span>${S?"Live":m}</span>
        </div>
        
        <div class="${v}">${s.status||"Scheduled"}</div>

        ${b?.label?`
          <a href="${b.url||b.href||"#"}" class="btn btn--match">
            <span>${b.label}</span>
            <span class="material-symbols-outlined">${b.icon||"arrow_forward"}</span>
          </a>
        `:""}
      </div>
    `,h}function F(){const s=k(w.getFullYear(),w.getMonth(),w.getDate());console.log("Rendering matches for date:",s),c&&(c.textContent=s);const h=o[s]||[];if(console.log("Matches for this date:",h),i.innerHTML="",!h.length){i.innerHTML='<p class="muted">No matches scheduled for this date.</p>';return}h.forEach($=>{const L=Y($);i.appendChild(L)}),console.log("Rendered",h.length,"matches")}}function te(){console.log("Calendar module loaded, looking for [data-calendar] elements...");const r=document.querySelectorAll("[data-calendar]");console.log("Found",r.length,"calendar elements"),r.forEach(ee)}const le=Object.freeze(Object.defineProperty({__proto__:null,default:te},Symbol.toStringTag,{value:"Module"}));class ae{constructor(e,t={}){if(this.container=e,this.grid=e.querySelector(t.gridSelector||"[data-grid]"),this.loader=e.querySelector(t.loaderSelector||"[data-loader]"),this.endMessage=e.querySelector(t.endSelector||"[data-end-message]"),this.errorMessage=e.querySelector(t.errorSelector||"[data-error-message]"),this.config={itemsPerPage:t.itemsPerPage||8,rootMargin:t.rootMargin||"100px",threshold:t.threshold||.1,delay:t.delay||800,cardType:t.cardType||"default",...t},t.data)this.allData=t.data;else{const a=`data-${this.config.cardType}-data`,i=document.querySelector(`[${a}]`);this.allData=i?JSON.parse(i.textContent):[]}this.currentPage=t.startPage||0,this.isLoading=!1,this.hasMore=this.allData.length>this.config.itemsPerPage,this.cardRenderers=new Map([["live",this.renderLiveCard.bind(this)],["news",this.renderNewsCard.bind(this)],["video",this.renderVideoCard.bind(this)],["league",this.renderLeagueCard.bind(this)],["default",this.renderDefaultCard.bind(this)]]),t.renderCard&&typeof t.renderCard=="function"?this.renderCard=t.renderCard.bind(this):this.renderCard=this.cardRenderers.get(this.config.cardType)||this.renderDefaultCard.bind(this),this.init()}init(){if(!this.hasMore){this.showEndMessage();return}this.createObserver(),this.createSentinel()}createObserver(){const e={root:null,rootMargin:this.config.rootMargin,threshold:this.config.threshold};this.observer=new IntersectionObserver(t=>{t.forEach(a=>{a.isIntersecting&&!this.isLoading&&this.hasMore&&this.loadMore()})},e)}createSentinel(){this.sentinel=document.createElement("div"),this.sentinel.className="infinite-scroll-sentinel",this.sentinel.style.cssText="height: 1px; margin-bottom: 1px; visibility: hidden;",this.container.appendChild(this.sentinel),this.observer.observe(this.sentinel)}async loadMore(){if(!(this.isLoading||!this.hasMore)){this.isLoading=!0,this.showLoader(),this.hideError();try{this.config.delay>0&&await new Promise(i=>setTimeout(i,this.config.delay)),this.currentPage++;const e=this.currentPage*this.config.itemsPerPage,t=e+this.config.itemsPerPage,a=this.allData.slice(e,t);if(a.length===0){this.hasMore=!1,this.hideLoader(),this.showEndMessage();return}await this.renderItems(a),this.isLoading=!1,this.hideLoader(),t>=this.allData.length&&(this.hasMore=!1,this.showEndMessage()),this.dispatchEvent("itemsLoaded",{items:a,page:this.currentPage,hasMore:this.hasMore,cardType:this.config.cardType})}catch(e){console.error("Error loading more items:",e),this.currentPage--,this.isLoading=!1,this.hideLoader(),this.showError(),this.dispatchEvent("loadError",{error:e,cardType:this.config.cardType})}}}async renderItems(e){const t=document.createDocumentFragment();for(const a of e){const i=await this.renderCard(a);i&&(i.classList.add("infinite-scroll-item"),t.appendChild(i))}this.grid.appendChild(t),requestAnimationFrame(()=>{this.grid.querySelectorAll(".infinite-scroll-item:not(.infinite-scroll-item--visible)").forEach((i,c)=>{setTimeout(()=>{i.classList.add("infinite-scroll-item--visible")},c*100)})})}renderLiveCard(e){const t=document.createElement("article");t.className="card-live",console.log("Rendering match:",e);const a=e.status||"LIVE",i=a.toLowerCase(),c=a==="FT"?"FT":a==="LIVE"?"LIVE":a.toUpperCase(),o=e.date||e.time||"",g=e.date||e.datetime||o,f=e.score?.t1??e.score1??"0",_=e.score?.t2??e.score2??"0",w=`${f} - ${_}`,n=e.league?.name||e.league||"Unknown League",d=e.league?.href||"#",l=e.preview?.src||e.thumb||e.image||"/assets/images/bg/hero.webp",u=e.team1?.logo||"/assets/images/teams/team-1.webp",p=e.team2?.logo||"/assets/images/teams/team-2.webp";return console.log("Image paths:",{thumbSrc:l,team1Logo:u,team2Logo:p}),t.innerHTML=`
      <a href="${this.escapeHtml(e.href||"#")}" class="card-live__preview" aria-label="Open match">
        <img src="${l}" 
             alt="${this.escapeHtml(e.preview?.alt||`${e.team1?.name||"Team 1"} vs ${e.team2?.name||"Team 2"}`)}" 
             class="card-live__thumb" loading="lazy">
        <span class="card-live__play material-symbols-outlined" aria-hidden="true">play_circle</span>
        ${`<span class="card-live__badge card-live__badge--${i}">${this.escapeHtml(c)}</span>`}
      </a>
      
      <div class="card-live__meta">
        ${o?`
          <time class="date date--card-live" datetime="${this.escapeHtml(g)}">
            <span class="material-symbols-outlined date__icon">calendar_today</span>
            ${this.escapeHtml(o)}
          </time>
        `:""}
        
        <a href="${this.escapeHtml(d)}" class="card-live__league">
          ${this.escapeHtml(n)}
        </a>
      </div>
      
      <div class="card-live__teams">
        <a href="${this.escapeHtml(e.team1?.href||"#")}" class="card-live__team" aria-label="${this.escapeHtml(e.team1?.name||"Team 1")}">
          <img src="${u}" 
               alt="${this.escapeHtml(e.team1?.name||"Team 1")}" 
               class="card-live__logo" loading="lazy">
          <span class="card-live__name">${this.escapeHtml(e.team1?.name||"Team 1")}</span>
        </a>
        
        <span class="card-live__score">${this.escapeHtml(w)}</span>
        
        <a href="${this.escapeHtml(e.team2?.href||"#")}" class="card-live__team" aria-label="${this.escapeHtml(e.team2?.name||"Team 2")}">
          <img src="${p}" 
               alt="${this.escapeHtml(e.team2?.name||"Team 2")}" 
               class="card-live__logo" loading="lazy">
          <span class="card-live__name">${this.escapeHtml(e.team2?.name||"Team 2")}</span>
        </a>
      </div>
      
      <div class="btn btn--live">
        <a href="${this.escapeHtml(e.href||"#")}" class="btn__link">
          <span class="btn__text">Live broadcast</span>
        </a>
      </div>
    `,t.querySelectorAll("img").forEach(D=>{D.addEventListener("error",function(){console.log("Image failed to load:",this.src),this.classList.contains("card-live__thumb")?this.src="/assets/images/bg/hero.webp":this.classList.contains("card-live__logo")&&(this.src="/assets/images/teams/team-1.webp")})}),t}renderNewsCard(e){const t=document.createElement("article");t.className="card-post";const a=e.href||"#",i=e.thumb||"/assets/images/placeholder.webp",c=e.title||"Post image",o=e.published_at||null,g=Array.isArray(e.tags)?e.tags:[];console.log("Rendering news post:",{href:a,imgSrc:i,title:e.title,tags:g}),t.innerHTML=`
      <div class="card-post__thumbnail">
        <a href="${this.escapeHtml(a)}" class="card-post__link">
          <img src="${i}" 
               alt="${this.escapeHtml(c)}" 
               class="card-post__image" 
               loading="lazy">
        </a>
        
        ${g.length?this.renderTagsAbsolute(g):""}
      </div>
      
      <div class="card-post__content">
        <h3 class="card-post__title">
          <a href="${this.escapeHtml(a)}" class="card-post__title-link">
            ${this.escapeHtml(e.title||"Untitled post")}
          </a>
        </h3>
        
        <div class="card-post__meta">
          ${o?this.renderDateShort(o):""}
        </div>
      </div>
    `;const f=t.querySelector("img");return f&&f.addEventListener("error",function(){console.log("News image failed to load:",this.src),this.src="/assets/images/placeholder.webp"}),t}renderTagsAbsolute(e){return!e||!e.length?"":`<div class="tag-absolute">${e.map(a=>{const i=a.label||a,c=a.href||"#";return`<a href="${this.escapeHtml(c)}" class="tag tag--absolute">${this.escapeHtml(i)}</a>`}).join("")}</div>`}renderDateShort(e){if(!e)return"";const a=new Date(e).toLocaleDateString("en-US",{day:"2-digit",month:"2-digit",year:"numeric"}).replace(/\//g,".");return`
      <time class="date date--short" datetime="${e}">
        <span class="material-symbols-outlined date__icon">calendar_today</span>
        ${a}
      </time>
    `}renderVideoCard(e){const t=document.createElement("article");t.className="card-video";const a=e.href||"#",i=e.thumb||"/assets/images/pictures/default.webp",c=e.title||"Untitled video",o=e.published_at||null,g=Array.isArray(e.tags)?e.tags:[];console.log("Rendering video:",{href:a,thumbSrc:i,title:c,dateValue:o,tags:g}),t.innerHTML=`
      <a href="${this.escapeHtml(a)}" class="card-video__thumb">
        <img src="${i}" alt="thumb" class="card-video__thumbnail" loading="lazy">
        <span class="card-video__play material-symbols-outlined">play_circle</span>
      </a>
      
      <div class="card-video__content">
        <h3 class="card-video__title">
          <a href="${this.escapeHtml(a)}" class="card-video__link">${this.escapeHtml(c)}</a>
        </h3>
        
        <div class="card-video__meta">
          ${o?this.renderDateVideo(o):""}
        </div>
        
        ${g.length?this.renderTagsAbsolute(g):""}
      </div>
    `;const f=t.querySelector("img");return f&&f.addEventListener("error",function(){console.log("Video thumbnail failed to load:",this.src),this.src="/assets/images/pictures/default.webp"}),t}renderLeagueCard(e){const t=document.createElement("article");t.className="card-league";const a=e.href||"#",i=e.logo||null,c=e.logo_alt||"",o=e.name||"League name",g=e.country||null,f=e.champion||null;return console.log("Rendering league:",{href:a,logoSrc:i,name:o,country:g,champion:f}),t.innerHTML=`
      <div class="card-league__top">
        <a href="${this.escapeHtml(a)}" class="card-league__link">
          ${i?`<img src="${i}" alt="${this.escapeHtml(c)}" class="card-league__logo" loading="lazy">`:""}
        </a>
        <div class="card-league__info">
          <h3 class="card-league__name">
            <a href="${this.escapeHtml(a)}" class="card-league__name-link">${this.escapeHtml(o)}</a>
          </h3>
          ${g?`<p class="card-league__meta">${this.escapeHtml(g)}</p>`:""}
        </div>
      </div>
      
      ${f?`
        <div class="card-league__bot">
          <a href="${this.escapeHtml(f.href||"#")}" class="card-league__champion">
            ${f.logo?`<img src="${f.logo}" alt="${this.escapeHtml(f.logo_alt||"")}" class="card-league__champion-logo" loading="lazy">`:""}
            <span class="card-league__champion-name">${this.escapeHtml(f.name||"Champion")}</span>
          </a>
          <span class="material-symbols-outlined card-league__champion-icon">trophy</span>
        </div>
      `:""}
    `,t.querySelectorAll("img").forEach(w=>{w.addEventListener("error",function(){console.log("League card image failed to load:",this.src),this.classList.contains("card-league__logo")?this.src="/assets/images/leagues/default.webp":this.classList.contains("card-league__champion-logo")&&(this.src="/assets/images/teams/team-1.webp")})}),t}renderDefaultCard(e){const t=document.createElement("div");return t.className="card-default",t.innerHTML=`
      <div class="card-default__inner">
        <h3 class="card-default__title">
          <a href="${this.escapeHtml(e.href||"#")}">${this.escapeHtml(e.title||e.name||"Untitled")}</a>
        </h3>
        ${e.description?`<p class="card-default__description">${this.escapeHtml(e.description)}</p>`:""}
      </div>
    `,t}renderTagsAbsolute(e){return!e||!e.length?"":`<div class="tag-absolute">${e.map(a=>{const i=a.label||a,c=a.href||"#";return`<a href="${this.escapeHtml(c)}" class="tag tag--absolute">${this.escapeHtml(i)}</a>`}).join("")}</div>`}renderDateVideo(e){if(!e)return"";const a=new Date(e).toLocaleDateString("en-US",{day:"2-digit",month:"2-digit",year:"numeric"}).replace(/\//g,".");return`
      <time class="date date--video" datetime="${e}">
        <span class="material-symbols-outlined date__icon">calendar_today</span>
        ${a}
      </time>
    `}renderDateShort(e){if(!e)return"";const a=new Date(e).toLocaleDateString("en-US",{day:"2-digit",month:"2-digit",year:"numeric"}).replace(/\//g,".");return`
      <time class="date date--short" datetime="${e}">
        <span class="material-symbols-outlined date__icon">calendar_today</span>
        ${a}
      </time>
    `}escapeHtml(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}formatDate(e){return e?new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):""}formatViews(e){return e?e>=1e6?Math.floor(e/1e5)/10+"M":e>=1e3?Math.floor(e/100)/10+"K":e.toString():"0"}showLoader(){this.loader&&(this.loader.hidden=!1,this.container.classList.add("infinite-scroll-container--loading"))}hideLoader(){this.loader&&(this.loader.hidden=!0,this.container.classList.remove("infinite-scroll-container--loading"))}showEndMessage(){this.endMessage&&(this.endMessage.hidden=!1),this.destroySentinel()}showError(){this.errorMessage&&(this.errorMessage.hidden=!1,this.container.classList.add("infinite-scroll-container--error"))}hideError(){this.errorMessage&&(this.errorMessage.hidden=!0,this.container.classList.remove("infinite-scroll-container--error"))}destroySentinel(){this.sentinel&&this.observer&&(this.observer.unobserve(this.sentinel),this.sentinel.remove(),this.sentinel=null)}dispatchEvent(e,t){this.container.dispatchEvent(new CustomEvent(e,{detail:t}))}reload(){this.currentPage=0,this.isLoading=!1,this.hasMore=this.allData.length>this.config.itemsPerPage,this.grid.innerHTML="",this.hideLoader(),this.hideError(),this.endMessage&&(this.endMessage.hidden=!0),this.container.classList.remove("infinite-scroll-container--loading","infinite-scroll-container--error"),this.destroySentinel(),this.init()}destroy(){this.observer&&this.observer.disconnect(),this.destroySentinel()}addCardRenderer(e,t){this.cardRenderers.set(e,t)}}const ce=Object.freeze(Object.defineProperty({__proto__:null,default:ae},Symbol.toStringTag,{value:"Module"}));export{ie as a,le as c,se as h,ce as i,ne as s,re as t};
