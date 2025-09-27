// build/router-generator.js
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// ROUTER CONFIGURATION
// =============================================================================

// Базовые настройки для страниц
const DEFAULT_PAGE_CONFIG = {
  pin: "",
  isHome: false,
  category: "page", // page, news, video, etc.
  meta: {}
};

// Специальные настройки для конкретных страниц
const PAGE_OVERRIDES = {
  // Главная страница
  'home': {
    name: 'Home',
    url: '',
    isHome: true,
    category: 'main'
  },
  
  // Основные разделы
  'news': {
    name: 'News',
    url: 'news',
    category: 'content'
  },
  'lives': {
    name: 'Lives',
    url: 'lives',
    category: 'content'
  },
  'videos': {
    name: 'Videos',
    url: 'videos',
    category: 'content'
  },
  
  // Информационные страницы
  'calendar': {
    name: 'Calendar',
    url: 'calendar',
    category: 'info'
  },
  'history': {
    name: 'History',
    url: 'history',
    category: 'info'
  },
  'teams': {
    name: 'Teams',
    url: 'teams',
    category: 'info'
  },
  'league': {
    name: 'League',
    url: 'league',
    category: 'info'
  },
  
  // Детальные страницы (обычно динамические)
  'post': {
    name: 'Post',
    url: 'post',
    category: 'detail',
    meta: { dynamic: true, template: 'post' }
  },
  'video': {
    name: 'Video',
    url: 'video',
    category: 'detail',
    meta: { dynamic: true, template: 'video' }
  },
  'team': {
    name: 'Team',
    url: 'team',
    category: 'detail',
    meta: { dynamic: true, template: 'team' }
  },
  'player': {
    name: 'Player',
    url: 'player',
    category: 'detail',
    meta: { dynamic: true, template: 'player' }
  },
  'review': {
    name: 'Review',
    url: 'review',
    category: 'detail',
    meta: { dynamic: true, template: 'review' }
  },
  
  // Служебные страницы
  'contact': {
    name: 'Contact',
    url: 'contact',
    category: 'service'
  },
  'privacy': {
    name: 'Privacy',
    url: 'privacy',
    category: 'service'
  }
};


// =============================================================================
// ROUTER GENERATION
// =============================================================================

export function generateRouterConfig(projectRoot = process.cwd()) {
  const pagesDir = path.resolve(projectRoot, "dev/pages");
  const router = [];
  
  if (!fs.existsSync(pagesDir)) {
    console.warn("⚠️ Pages directory not found:", pagesDir);
    return router;
  }
  
  // Сканируем HTML файлы
  const files = fs.readdirSync(pagesDir)
    .filter(file => file.endsWith('.html'))
    .sort();
  
  for (const file of files) {
    const pageName = path.basename(file, '.html');
    const isHome = pageName === 'home';
    
    // Простая конфигурация - точно как в вашем файле
    const config = {
      file: isHome ? 'home.html' : `pages/${file}`,
      name: getPageName(pageName),
      pin: "",
      url: getPageUrl(pageName),
      isHome: isHome
    };
    
    router.push(config);
  }
  
  // Сортировка: Home первым, остальные по алфавиту
  router.sort((a, b) => {
    if (a.isHome) return -1;
    if (b.isHome) return 1;
    return a.name.localeCompare(b.name);
  });
  
  return router;
}

// Получение имени страницы
function getPageName(pageName) {
  const names = {
    'home': 'Home',
    'calendar': 'Calendar',
    'contact': 'Contact', 
    'history': 'History',
    'lives': 'Lives',
    'news': 'News',
    'player': 'Player',
    'post': 'Post',
    'review': 'Review',
    'team': 'Team',
    'teams': 'Teams',
    'video': 'Video',
    'videos': 'Videos',
    'league': 'League',
    'leagues': 'Leagues',
    'privacy': 'Privacy'
  };
  
  return names[pageName] || capitalize(pageName);
}

// Получение URL страницы  
function getPageUrl(pageName) {
  const urls = {
    'home': '' // Главная страница
  };
  
  return urls[pageName] !== undefined ? urls[pageName] : pageName;
}

// =============================================================================
// ROUTER UTILS
// =============================================================================

export function updateDevRouter(projectRoot = process.cwd()) {
  const routerPath = path.resolve(projectRoot, "dev/__router.json");
  const router = generateRouterConfig(projectRoot);
  
  try {
    // Читаем существующий файл для сохранения кастомных pin
    let existingCustomData = {};
    if (fs.existsSync(routerPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(routerPath, 'utf8'));
        existing.forEach(page => {
          const key = getPageKey(page);
          if (page.pin || page.meta?.custom) {
            existingCustomData[key] = {
              pin: page.pin,
              customMeta: page.meta?.custom
            };
          }
        });
      } catch (e) {
        console.warn('⚠️ Could not parse existing router:', e.message);
      }
    }
    
    // Применяем сохраненные кастомные данные
    router.forEach(page => {
      const key = getPageKey(page);
      if (existingCustomData[key]) {
        if (existingCustomData[key].pin) {
          page.pin = existingCustomData[key].pin;
        }
        if (existingCustomData[key].customMeta) {
          page.meta = page.meta || {};
          page.meta.custom = existingCustomData[key].customMeta;
        }
      }
    });
    
    fs.writeFileSync(routerPath, JSON.stringify(router, null, 2), 'utf8');
    console.log(`🔄 Updated dev/__router.json (${router.length} pages)`);
    
    return router;
    
  } catch (e) {
    console.error('❌ Could not write router:', e.message);
    return router;
  }
}

export function generateRouterStats(router) {
  const stats = {
    total: router.length,
    categories: {},
    dynamic: router.filter(p => p.meta?.dynamic).length,
    static: router.filter(p => !p.meta?.dynamic).length
  };
  
  router.forEach(page => {
    const category = page.category || 'unknown';
    stats.categories[category] = (stats.categories[category] || 0) + 1;
  });
  
  return stats;
}

// =============================================================================
// ENHANCED ROUTER (с метаданными)
// =============================================================================

export function generateEnhancedRouter(projectRoot = process.cwd()) {
  const router = generateRouterConfig(projectRoot);
  const stats = generateRouterStats(router);
  
  return {
    generated: new Date().toISOString(),
    version: getPackageVersion(projectRoot),
    stats,
    pages: router,
    categories: Object.keys(CATEGORY_CONFIG).map(key => ({
      key,
      ...CATEGORY_CONFIG[key],
      count: stats.categories[key] || 0
    }))
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getPageKey(page) {
  return path.basename(page.file, '.html');
}

function getPackageVersion(projectRoot) {
  try {
    const packagePath = path.resolve(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

// =============================================================================
// CLI USAGE (для ручного запуска)
// =============================================================================
const isMainModule = process.argv[1] && process.argv[1].endsWith('router-generator.js');

if (isMainModule) {
  const command = process.argv[2];
  const projectRoot = process.argv[3] || process.cwd();
  
  console.log(`🚀 Executing command: ${command || 'none'}`);
  
  switch (command) {
    case 'generate':
      console.log('🔄 Generating router...');
      try {
        const result = updateDevRouter(projectRoot);
        console.log(`✅ Success! Generated ${result.length} pages`);
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
      break;
      
    case 'enhanced':
      console.log('📊 Generating enhanced router...');
      try {
        const enhanced = generateEnhancedRouter(projectRoot);
        const outputPath = path.resolve(projectRoot, 'dev/__router-enhanced.json');
        fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2));
        console.log('✅ Enhanced router saved to:', outputPath);
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
      break;
      
    case 'test':
      console.log('🧪 Testing router generation...');
      try {
        const pagesDir = path.resolve(projectRoot, 'dev/pages');
        console.log('📁 Pages directory:', pagesDir);
        console.log('📁 Exists:', fs.existsSync(pagesDir));
        
        if (fs.existsSync(pagesDir)) {
          const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
          console.log('📄 Found pages:', files);
        }
        
        const router = generateRouterConfig(projectRoot);
        console.log('📋 Generated router:', router.length, 'pages');
        router.forEach(page => console.log(`  - ${page.name} (${page.file})`));
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
      break;
      
    default:
      console.log(`
📖 Usage: node build/router-generator.js <command> [project-root]

Commands:
  generate  - Generate basic router
  enhanced  - Generate enhanced router with stats  
  test      - Test router generation (debug)

Examples:
  node build/router-generator.js generate
  node build/router-generator.js test
      `);
  }
}
