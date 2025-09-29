import { defineConfig } from "vite";
import path from "path";
import fs from "fs";
import * as sass from "sass";
import { fileURLToPath, pathToFileURL } from "url";
import sharp from "sharp";
import postcss from "postcss";
import pxtorem from "postcss-pxtorem";
import { PurgeCSS } from "purgecss";
import glob from "glob-all";
import Twig from "twig";
import twigPlugin from "@fulcrumsaas/vite-plugin-twig";
import { generateRouterConfig, updateDevRouter } from './build/router-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV !== 'production';
const SRC_ROOT = path.resolve(__dirname, "src");
const SCSS_CACHE = new Map(); // Кэш компиляции SCSS
const SCSS_ENTRY = path.resolve(__dirname, "dev/assets/styles/main.scss");
const CSS_OUTPUT_DEV = path.resolve(__dirname, "dev/assets/styles/main.css");

// === load_json helper ===============================================
const DEV_ROOT = path.resolve(__dirname, "dev");
const ALIASES = {
  "@": DEV_ROOT,
  "@components": path.resolve(DEV_ROOT, "components"),
  "@assets": path.resolve(DEV_ROOT, "assets"),
};

function resolveFromAliases(p) {
  let s = String(p);
  if (s.startsWith("@/")) s = s.replace(/^@\//, "");
  if (s.startsWith("@")) {
    const parts = s.split("/");
    const head = parts.shift();
    const base = ALIASES[head] || DEV_ROOT;
    return path.resolve(base, parts.join("/"));
  }
  if (!path.isAbsolute(s)) return path.resolve(DEV_ROOT, s);
  return s;
}

Twig.extendFunction("load_json", (p) => {
  try {
    const abs = resolveFromAliases(p);
    const txt = fs.readFileSync(abs, "utf8");
    return JSON.parse(txt);
  } catch (e) {
    console.warn("[load_json] error:", p, e.message);
    return [];
  }
});


Twig.extendFunction("get_url_param", (paramName, defaultValue = null) => {
  try {
    // В серверной среде Twig нет доступа к URL, но мы можем использовать
    // глобальную переменную или другой способ передачи параметров
    if (typeof global !== 'undefined' && global.currentUrlParams) {
      return global.currentUrlParams[paramName] || defaultValue;
    }
    return defaultValue;
  } catch (e) {
    console.warn("[get_url_param] error:", paramName, e.message);
    return defaultValue;
  }
});

// Также добавим функцию для установки параметров URL
const setTwigUrlParams = (params) => {
  if (typeof global !== 'undefined') {
    global.currentUrlParams = params;
  }
};
// ---- purge css ------------------------------------------------
const USE_PURGED = process.env.USE_PURGED === "1";
const oldCss = path.resolve(__dirname, "dev/assets/styles/old-styles.css");

// ---- shared constants/helpers ------------------------------------------------
const IMG_DIR_DEV = path.resolve(__dirname, "dev/assets/images");
const IMG_URL_RE = /\/assets\/images\/[^"')\s]+\.(jpg|jpeg|png|bmp)(?=(?:[?#][^"')\s]*)?)/gi;
const SRC_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".bmp"];
const REM_ROOT = Number(process.env.REM_ROOT || 16);

const norm = (p) => p.replace(/\\/g, "/");
const hasAnyExt = (name, exts) => exts.some((e) => name.toLowerCase().endsWith(e));

// Smart webp options: lossless for png with alpha, else quality 82
async function webpConvert(inPath, outPath) {
  const meta = await sharp(inPath).metadata();
  const isPng = /\.png$/i.test(inPath);
  const hasAlpha = !!meta.hasAlpha;
  const pipeline = sharp(inPath);
  if (isPng && hasAlpha) {
    await pipeline.webp({ lossless: true }).toFile(outPath);
  } else {
    await pipeline.webp({ quality: 82 }).toFile(outPath);
  }
}

// =============================================================================
// ENHANCED TWIG PLUGIN WITH ERROR HANDLING
// =============================================================================
function enhancedTwigPlugin() {
  return {
    name: "enhanced-twig-transform",
    order: "pre",
    configResolved() {
      Twig.cache(false);
    },
    transformIndexHtml: {
      order: "pre",
      async handler(_html, ctx) {
        return await new Promise((resolve, reject) => {
          Twig.renderFile(ctx.filename, {}, (err, out) => {
            if (err) {
              // Детальная информация об ошибке
              const errorInfo = {
                file: ctx.filename,
                message: err.message,
                line: err.line || 'unknown',
                column: err.column || 'unknown',
                stack: err.stack
              };
              
              console.error('❌ Twig Template Error:');
              console.error(`📄 File: ${errorInfo.file}`);
              console.error(`📍 Line: ${errorInfo.line}, Column: ${errorInfo.column}`);
              console.error(`💬 Message: ${errorInfo.message}`);
              
              // Создаем понятную HTML страницу с ошибкой для dev режима
              if (process.env.NODE_ENV !== 'production') {
                const errorHtml = createErrorPage(errorInfo);
                resolve(errorHtml);
              } else {
                reject(err);
              }
            } else {
              resolve(out);
            }
          });
        });
      },
    },
    configureServer(server) {
      if (server) {
        server.watcher.on("change", (file) => {
          if (/\.(twig|html)$/.test(file)) {
            console.log(`🔄 Reloading: ${path.basename(file)}`);
            server.ws.send({ type: "full-reload" });
          }
        });
      }
    },
  };
}

// Создание страницы с ошибкой для удобной отладки
function createErrorPage(errorInfo) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Twig Template Error</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #1a1a1a;
            color: #ff6b6b;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .error-container {
            max-width: 800px;
            margin: 0 auto;
            background: #2a2a2a;
            border-radius: 8px;
            padding: 30px;
            border-left: 5px solid #ff6b6b;
        }
        .error-title {
            color: #ff6b6b;
            font-size: 24px;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .error-info {
            background: #333;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .error-label {
            color: #74c0fc;
            font-weight: bold;
        }
        .error-value {
            color: #ffd43b;
            margin-left: 10px;
        }
        .error-message {
            background: #400;
            border: 1px solid #600;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            white-space: pre-wrap;
        }
        .reload-hint {
            color: #51cf66;
            margin-top: 20px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-title">🚨 Twig Template Error</div>
        
        <div class="error-info">
            <div><span class="error-label">📄 File:</span><span class="error-value">${errorInfo.file}</span></div>
            <div><span class="error-label">📍 Line:</span><span class="error-value">${errorInfo.line}</span></div>
            <div><span class="error-label">📍 Column:</span><span class="error-value">${errorInfo.column}</span></div>
        </div>
        
        <div class="error-message">
            <strong>Error Message:</strong><br>
            ${errorInfo.message}
        </div>
        
        <div class="reload-hint">
            💡 Fix the error and save the file - the page will reload automatically
        </div>
    </div>
    
    <script>
        // Автоматическая перезагрузка при исправлении
        if (window.location.protocol === 'http:') {
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    </script>
</body>
</html>`;
}
// =============================================================================
// JSON VALIDATION PLUGIN
// =============================================================================
function jsonValidationPlugin() {
  return {
    name: 'json-validation',
    configureServer(server) {
      if (server) {
        server.watcher.on('change', (file) => {
          if (file.endsWith('.json') && file.includes('/data/')) {
            validateJsonFile(file);
          }
        });
      }
    },
    buildStart() {
      // Валидация всех JSON файлов при сборке
      const dataDir = path.resolve(__dirname, 'dev/data');
      if (fs.existsSync(dataDir)) {
        validateAllJsonFiles(dataDir);
      }
    }
  };
}

function validateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    console.log(`✅ JSON valid: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ JSON Error in ${path.basename(filePath)}:`);
    console.error(`📍 Line: ${getJsonErrorLine(error, filePath)}`);
    console.error(`💬 ${error.message}`);
  }
}

function validateAllJsonFiles(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let validCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      const fullPath = path.resolve(dir, file.name);
      
      if (file.isDirectory()) {
        const result = validateAllJsonFiles(fullPath);
        validCount += result.valid;
        errorCount += result.errors;
      } else if (file.name.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          JSON.parse(content);
          validCount++;
        } catch (error) {
          console.error(`❌ JSON Error in ${file.name}: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    if (errorCount === 0) {
      console.log(`✅ All ${validCount} JSON files are valid`);
    }
    
    return { valid: validCount, errors: errorCount };
  } catch (error) {
    console.warn(`⚠️ Could not validate JSON files in ${dir}`);
    return { valid: 0, errors: 0 };
  }
}

function getJsonErrorLine(error, filePath) {
  // Пытаемся извлечь номер строки из ошибки JSON
  const match = error.message.match(/line (\d+)|position (\d+)/i);
  if (match) {
    return match[1] || match[2];
  }
  return 'unknown';
}
// tiny concurrency limiter
function createLimiter(limit = 4) {
  let active = 0;
  const q = [];
  const run = async (fn) => {
    if (active >= limit) await new Promise((r) => q.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      const n = q.shift();
      if (n) n();
    }
  };
  return (fn) => run(fn);
}

// -----------------------------------------------------------------------------
// SCSS compile (prepend + importer + px→rem via PostCSS)
const entryScss = path.resolve(__dirname, "dev/assets/styles/main.scss");
const devCss = path.resolve(__dirname, "dev/assets/styles/main.css");

async function compileScss(outFile) {
  const aliasMap = {
    "@": path.resolve(__dirname, "dev"),
    "@components": path.resolve(__dirname, "dev/components"),
  };

  function tryCandidates(baseDir, rel) {
    const noExt = rel.replace(/\.scss$/i, "");
    const baseName = path.basename(noExt);
    const dirName = path.dirname(noExt);
    const candidates = [
      noExt + ".scss",
      path.join(noExt, "index.scss"),
      path.join(dirName, "_" + baseName + ".scss"),
    ];
    for (const c of candidates) {
      const full = path.resolve(baseDir, c);
      if (fs.existsSync(full)) return full;
    }
    return null;
  }

  const scssImporter = {
    canonicalize(url, options) {
      if (url.startsWith("~")) url = url.slice(1);

      if (options?.containingUrl?.protocol === "file:") {
        const baseDir = path.dirname(fileURLToPath(options.containingUrl));
        const relHit = tryCandidates(baseDir, url);
        if (relHit) return pathToFileURL(relHit);
      }

      for (const [alias, base] of Object.entries(aliasMap)) {
        if (url === alias || url.startsWith(alias + "/")) {
          const rel = url === alias ? "" : url.slice(alias.length + 1);
          const found = tryCandidates(base, rel);
          if (found) return pathToFileURL(found);
        }
      }

      const fromA = tryCandidates(path.resolve(__dirname, "dev/assets/styles"), url);
      if (fromA) return pathToFileURL(fromA);
      const fromB = tryCandidates(path.resolve(__dirname, "dev"), url);
      if (fromB) return pathToFileURL(fromB);

      return null;
    },

    load(u) {
      if (u.protocol !== "file:") return null;
      const p = fileURLToPath(u);
      const src = fs.readFileSync(p, "utf8");

      const isUtils = /[\\\/]dev[\\\/]assets[\\\/]styles[\\\/]utils[\\\/]/i.test(p);
      const hasNoUtilsPragma = /@no-utils\b/.test(src);
      if (isUtils || hasNoUtilsPragma) {
        return { contents: src, syntax: "scss" };
      }

      const alreadyUsesIndex = /@use\s+["'](?:\.{1,2}\/)*utils\/index["']/.test(src);
      const prelude = alreadyUsesIndex ? "" : '@use "utils/index" as *;\n';
      return { contents: prelude + src, syntax: "scss" };
    },
  };

  const entry = fs.readFileSync(entryScss, "utf8");
  const src = '@use "utils/index" as *;\n' + entry;

const res = sass.compileString(src, {
  style: isDev ? "expanded" : "compressed",
  loadPaths: [
    path.resolve(__dirname, "dev/assets/styles"),
    path.resolve(__dirname, "dev"),
  ],
  importers: [scssImporter],
  sourceMap: isDev, // Source maps для dev
});

  const processed = await postcss([
    pxtorem({
      rootValue: Number(process.env.REM_ROOT || 16),
      propList: ["*"],
      unitPrecision: 5,
      replace: true,
      minPixelValue: 1,
      exclude: (file) => !!file && /node_modules/i.test(file),
    }),
  ]).process(res.css, {
  from: entryScss,
  to: outFile,
  map: isDev ? { inline: false } : false,
});

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, processed.css);
  if (isDev && processed.map) {
  fs.writeFileSync(`${outFile}.map`, processed.map.toString());
}
  console.log("✅ SCSS →", outFile);
}

function debounce(fn, ms = 120) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

// =============================================================================
// OPTIMIZED SCSS COMPILATION
// =============================================================================
async function compileScssOptimized(outFile, isDevelopment = false) {
  try {
    // Проверяем кэш для dev режима
    if (isDevelopment) {
      const cacheKey = await generateScssCache();
      
      if (SCSS_CACHE.has(cacheKey) && fs.existsSync(outFile)) {
        const outStat = fs.statSync(outFile);
        const cachedTime = SCSS_CACHE.get(cacheKey);
        
        if (outStat.mtimeMs >= cachedTime) {
          console.log("⚡ SCSS cache hit - skipping compilation");
          return;
        }
      }
    }
    
    console.log(`🎨 Compiling SCSS${isDevelopment ? ' (dev)' : ' (prod)'}...`);
    const startTime = Date.now();
    
    await compileScss(outFile);
    
    const duration = Date.now() - startTime;
    console.log(`✅ SCSS compiled in ${duration}ms`);
    
    // Сохраняем в кэш для dev режима
    if (isDevelopment) {
      const cacheKey = await generateScssCache();
      SCSS_CACHE.set(cacheKey, Date.now());
    }
    
  } catch (error) {
    console.error('❌ SCSS compilation error:', error.message);
    throw error;
  }
}

// Генерация ключа кэша на основе времени изменения SCSS файлов
async function generateScssCache() {
  const scssFiles = [];
  
  function collectScssFiles(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.resolve(dir, entry.name);
        
        if (entry.isDirectory()) {
          collectScssFiles(fullPath);
        } else if (entry.name.endsWith('.scss')) {
          scssFiles.push(fullPath);
        }
      }
    } catch (e) {
      // Игнорируем ошибки доступа к папкам
    }
  }
  
  // Сканируем основные папки со стилями
  collectScssFiles(path.resolve(__dirname, "dev/assets/styles"));
  collectScssFiles(path.resolve(__dirname, "dev/components"));
  
  // Создаем хэш на основе времени изменения файлов
  let cacheString = '';
  for (const file of scssFiles) {
    try {
      const stat = fs.statSync(file);
      cacheString += `${file}:${stat.mtimeMs};`;
    } catch (e) {
      // Файл может быть удален между сканированием и проверкой
    }
  }
  
  return cacheString;
}

// =============================================================================
// SMART SRC CLEAN
// =============================================================================
function smartSrcCleanPlugin() {
  return {
    name: 'smart-src-clean',
    apply: 'build',
    buildStart() {
      if (!fs.existsSync(SRC_ROOT)) {
        fs.mkdirSync(SRC_ROOT, { recursive: true });
        console.log('📁 Created src/ directory');
        return;
      }
      
      console.log('🧹 Cleaning src/ for fresh build...');
      
      const protectedFiles = [
        '.htaccess', 'web.config', 'robots.txt', 'sitemap.xml', 
        'favicon.ico', '.well-known', 'README.md', '.env'
      ];
      
      const protectedExtensions = ['.php', '.py', '.htaccess'];
      const protectedFolders = ['config', 'uploads', 'cache', 'storage', 'api'];
      
      try {
        const entries = fs.readdirSync(SRC_ROOT, { withFileTypes: true });
        let cleanedCount = 0;
        let protectedCount = 0;
        
        for (const entry of entries) {
          const fullPath = path.resolve(SRC_ROOT, entry.name);
          let isProtected = false;
          
          if (protectedFiles.includes(entry.name.toLowerCase())) {
            isProtected = true;
          }
          
          if (!isProtected) {
            const ext = path.extname(entry.name).toLowerCase();
            if (protectedExtensions.includes(ext)) {
              isProtected = true;
            }
          }
          
          if (!isProtected && entry.isDirectory()) {
            if (protectedFolders.includes(entry.name.toLowerCase())) {
              isProtected = true;
            }
          }
          
          if (!isProtected && entry.name.startsWith('.') && entry.name !== '.well-known') {
            if (!protectedFiles.includes(entry.name)) {
              isProtected = true;
            }
          }
          
          if (isProtected) {
            console.log(`🛡️  Protected: ${entry.name}`);
            protectedCount++;
          } else {
            try {
              fs.rmSync(fullPath, { recursive: true, force: true });
              console.log(`🗑️  Removed: ${entry.name}`);
              cleanedCount++;
            } catch (err) {
              console.warn(`⚠️  Could not remove ${entry.name}:`, err.message);
            }
          }
        }
        
        console.log(`✅ Cleaned ${cleanedCount} items, protected ${protectedCount} items`);
        
      } catch (error) {
        console.error('❌ Error during cleaning:', error.message);
      }
    }
  };
}

// AUTO ROUTER PLUGIN
function autoRouterPlugin() {
  return {
    name: 'auto-router',
    
    configureServer(server) {
      if (server) {
        updateDevRouter(__dirname);
        
        server.watcher.on('add', (file) => {
          if (file.includes('/pages/') && file.endsWith('.html')) {
            console.log('📄 New page:', path.basename(file));
            updateDevRouter(__dirname);
          }
        });
        
        server.watcher.on('unlink', (file) => {
          if (file.includes('/pages/') && file.endsWith('.html')) {
            console.log('🗑️ Removed page:', path.basename(file));
            updateDevRouter(__dirname);
          }
        });
      }
    },
    
    generateBundle() {
      const router = generateRouterConfig(__dirname);
      
      this.emitFile({
        type: 'asset',
        fileName: '__router.json',
        source: JSON.stringify(router, null, 2)
      });
      
      console.log(`📋 Generated __router.json (${router.length} pages)`);
    }
  };
}

// DEPLOY MANIFEST PLUGIN
function deployManifestPlugin() {
  return {
    name: 'deploy-manifest',
    apply: 'build',
    generateBundle(options, bundle) {
      let totalSize = 0;
      const fileTypes = {
        html: 0, css: 0, js: 0, images: 0, other: 0
      };
      
      for (const [fileName, asset] of Object.entries(bundle)) {
        try {
          if (asset.source) {
            const size = typeof asset.source === 'string' 
              ? Buffer.byteLength(asset.source, 'utf8')
              : asset.source.length || 0;
            totalSize += size;
          }
        } catch (e) {
          console.warn('⚠️ Could not calculate size for:', fileName);
        }
        
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        
        if (ext === 'html') {
          fileTypes.html++;
        } else if (ext === 'css') {
          fileTypes.css++;
        } else if (ext === 'js') {
          fileTypes.js++;
        } else if (['webp', 'jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
          fileTypes.images++;
        } else {
          fileTypes.other++;
        }
      }
      
      const manifest = {
        generated: new Date().toISOString(),
        build_time: Date.now(),
        version: process.env.npm_package_version || '1.0.0',
        total_files: Object.keys(bundle).length,
        total_size_mb: Math.round(totalSize / 1024 / 1024 * 100) / 100,
        files: fileTypes
      };
      
      this.emitFile({
        type: 'asset',
        fileName: 'build-info.json',
        source: JSON.stringify(manifest, null, 2)
      });
      
      console.log(`📊 Deploy manifest: ${manifest.total_files} files, ${manifest.total_size_mb}MB`);
    }
  };
}
// =============================================================================
// AUTO PAGE INPUT GENERATION
// =============================================================================
function generatePageInputs() {
  const pagesDir = path.resolve(__dirname, "dev/pages");
  
  if (!fs.existsSync(pagesDir)) {
    console.warn("⚠️ Pages directory not found:", pagesDir);
    return { index: path.resolve(__dirname, "dev/pages/index.html") };
  }
  
  const pages = fs.readdirSync(pagesDir)
    .filter(file => file.endsWith('.html'))
    .reduce((acc, file) => {
      const name = path.basename(file, '.html');
      const key = name === 'index' ? 'index' : name;
      acc[key] = path.resolve(pagesDir, file);
      return acc;
    }, {});
  
  console.log(`📄 Auto-detected ${Object.keys(pages).length} pages for build`);
  return pages;
}
// -----------------------------------------------------------------------------
// Vite config
export default defineConfig({
  appType: "mpa",
  root: path.resolve(__dirname, "dev"),
  base: "/",
optimizeDeps: {
  entries: [path.resolve(__dirname, "dev/assets/scripts/main.js")],
  exclude: [] // Исключаем проблемные зависимости если появятся
},

  plugins: [
    smartSrcCleanPlugin(),
    autoRouterPlugin(),
    deployManifestPlugin(),

    enhancedTwigPlugin(),
    jsonValidationPlugin(),
    twigPlugin({
      root: path.resolve(__dirname, "dev"),
      namespaces: {
        layouts: path.resolve(__dirname, "dev/layouts"),
        components: path.resolve(__dirname, "dev/components"),
        pages: path.resolve(__dirname, "dev/pages"),
      },
    }),

    // routes (pretty URLs → .html)
// Более автоматическое решение в vite.config.js

{
  name: "dynamic-routes",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (!req.url) return next();
      
      // Сброс параметров URL
      if (typeof global !== 'undefined') {
        global.currentUrlParams = {};
      }
      
      // Главная страница
      if (req.url === "/" || req.url === "/index") {
        req.url = "/pages/index.html";
        return next();
      }
      
      // Динамическая история лиг - /league/{slug}/history
      const leagueHistoryMatch = req.url.match(/^\/league\/([a-z0-9-]+)\/history\/?(\?.*)?$/i);
      if (leagueHistoryMatch) {
        const leagueSlug = leagueHistoryMatch[1];
        
        // Устанавливаем параметры для Twig
        if (typeof global !== 'undefined') {
          global.currentUrlParams = { league: leagueSlug };
        }
        
        req.url = `/pages/history.html`;
        return next();
      }
      
      // Поддержка прямых URL (для обратной совместимости)
      const directHistoryMatch = req.url.match(/^\/history-([a-z-]+)\/?$/i);
      if (directHistoryMatch) {
        const leagueName = directHistoryMatch[1];
        
        if (typeof global !== 'undefined') {
          global.currentUrlParams = { league: leagueName };
        }
        
        req.url = `/pages/history.html`;
        return next();
      }
      
      // Обычные страницы
      const simplePages = /^\/(news|post|videos|calendar|league|review|video|teams|team|player|contact|lives|privacy|leagues)\/?$/i;
      const simpleMatch = req.url.match(simplePages);
      if (simpleMatch) {
        req.url = `/pages/${simpleMatch[1]}.html`;
        return next();
      }
      
      next();
    });
  },
},
    // одноразовая очистка старого CSS (Purge по .html/.twig)
    {
      name: "purge-once",
      apply: () => USE_PURGED,
      async configResolved() {
        const CSS_IN = oldCss;
        if (!fs.existsSync(CSS_IN)) {
          console.warn("⚠️ purge-once: CSS not found:", CSS_IN);
          return;
        }

        const backup = CSS_IN.replace(/\.css$/i, `.${Date.now()}.bak.css`);
        fs.copyFileSync(CSS_IN, backup);
        console.log("📦 purge-once: backup saved:", backup);

        const content = glob.sync([
          path.resolve(__dirname, "dev/pages/**/*.{html,twig}"),
          path.resolve(__dirname, "dev/components/**/*.{html,twig}"),
          path.resolve(__dirname, "dev/**/*.{js,ts}"),
        ]);

        const safelist = {
          standard: [
            "html", "body", "active", "open", "hidden", "show",
            "is-active", "is-open", "is-hidden", "is-sticky",
          ],
          deep: [/^swiper-/, /^lg-/, /^toast/, /^modal/],
          greedy: [/^is-/, /^has-/],
        };

        const raw = fs.readFileSync(CSS_IN, "utf8");
        const res = await new PurgeCSS().purge({
          content,
          css: [{ raw }],
          safelist,
          keyframes: true,
          fontFace: true,
          rejected: true,
        });

        const out = res[0]?.css ?? "";
        fs.writeFileSync(CSS_IN, out);
        console.log("✅ purge-once: CSS cleaned:", CSS_IN);

        const rejected = res[0]?.rejected || [];
        if (rejected.length) {
          console.log("🧹 purge-once: rejected selectors:", rejected.length);
          console.log(rejected.slice(0, 50).join("\n"));
        }
      },
    },

    // SCSS live compile (dev) - OPTIMIZED
    {
      name: "scss-dev-optimized",
      apply: "serve",
      configureServer(server) {
        if (USE_PURGED) return;
        
        let isCompiling = false;
        let pendingCompilation = false;
        
        const reload = debounce(() => {
          if (isCompiling) {
            pendingCompilation = true;
            return;
          }
          
          server.ws.send({ 
            type: "update", 
            updates: [{
              type: "css-update",
              timestamp: Date.now(),
              path: "/assets/styles/main.css"
            }]
          });
        }, 150);
        
        // Первичная компиляция при запуске
        compileScssOptimized(CSS_OUTPUT_DEV, true)
          .then(() => {
            console.log("🎨 Initial SCSS ready");
          })
          .catch(console.error);
        
        // Отслеживаем изменения SCSS файлов
        server.watcher.on("change", async (file) => {
          if (file.endsWith(".scss")) {
            if (isCompiling) {
              pendingCompilation = true;
              return;
            }
            
            isCompiling = true;
            const fileName = path.basename(file);
            
            try {
              console.log(`📝 SCSS changed: ${fileName}`);
              await compileScssOptimized(CSS_OUTPUT_DEV, true);
              reload();
              
              // Если была отложенная компиляция - запускаем её
              if (pendingCompilation) {
                pendingCompilation = false;
                setTimeout(() => {
                  isCompiling = false;
                  server.watcher.emit('change', file);
                }, 100);
              } else {
                isCompiling = false;
              }
              
            } catch (error) {
              console.error('❌ SCSS error:', error.message);
              isCompiling = false;
              
              // Отправляем ошибку в браузер
              server.ws.send({
                type: 'error',
                err: {
                  message: `SCSS Error: ${error.message}`,
                  stack: error.stack
                }
              });
            }
          }
        });
        
        // Очищаем кэш при перезапуске
        server.watcher.on('restart', () => {
          SCSS_CACHE.clear();
          console.log('🔄 SCSS cache cleared');
        });
      },
    },

    // SCSS build step - OPTIMIZED
    {
      name: "scss-build-optimized",
      apply: "build",
      async buildStart() {
        if (!USE_PURGED) {
          await compileScssOptimized(CSS_OUTPUT_DEV, false);
        }
      },
    },

    // dev: convert images to webp
    {
      name: "webp-dev-only",
      apply: "serve",
      configureServer(server) {
        const ROOT = norm(IMG_DIR_DEV).toLowerCase();
        if (!fs.existsSync(IMG_DIR_DEV))
          fs.mkdirSync(IMG_DIR_DEV, { recursive: true });
        const limit = createLimiter(4);

        const inImages = (p) => p && norm(p).toLowerCase().startsWith(ROOT);
        const isConvertible = (p) => inImages(p) && hasAnyExt(p, SRC_IMAGE_EXTS);

        async function toWebp(srcPath) {
          try {
            const { dir, name } = path.parse(srcPath);
            const out = path.resolve(dir, `${name}.webp`);
            if (fs.existsSync(out)) {
              const srcStat = fs.statSync(srcPath);
              const outStat = fs.statSync(out);
              if (outStat.mtimeMs >= srcStat.mtimeMs) return;
            }
            await limit(() => webpConvert(srcPath, out));
            console.log(
              "🟢 WEBP(dev):",
              norm(srcPath).replace(norm(__dirname) + "/", ""),
              "→",
              norm(out).replace(norm(__dirname) + "/", "")
            );
          } catch (e) {
            console.warn("🔴 WEBP(dev) error:", srcPath, e.message);
          }
        }

        (function walk(dir) {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.resolve(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (isConvertible(full)) toWebp(full);
          }
        })(IMG_DIR_DEV);

        server.watcher.on("add", (p) => {
          if (isConvertible(p)) toWebp(p);
        });
        server.watcher.on("change", (p) => {
          if (isConvertible(p)) toWebp(p);
        });

        server.middlewares.use((req, _res, next) => {
          if (!req.url) return next();
          const m = req.url.match(/^\/assets\/images\/(.+)\.(jpg|jpeg|png|bmp)$/i);
          if (!m) return next();
          const webpPath = path.resolve(IMG_DIR_DEV, m[1] + ".webp");
          if (fs.existsSync(webpPath)) req.url = `/assets/images/${m[1]}.webp`;
          next();
        });
      },
    },

    // build: ensure webp exists
    {
      name: "ensure-webp-on-build",
      apply: "build",
      async buildStart() {
        if (!fs.existsSync(IMG_DIR_DEV)) return;
        const tasks = [];
        (function walk(dir) {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.resolve(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (hasAnyExt(entry.name, SRC_IMAGE_EXTS)) {
              const base = entry.name.replace(/\.(jpg|jpeg|png|bmp)$/i, "");
              const out = path.resolve(dir, `${base}.webp`);
              let need = true;
              if (fs.existsSync(out)) {
                const srcStat = fs.statSync(full);
                const outStat = fs.statSync(out);
                if (outStat.mtimeMs >= srcStat.mtimeMs) need = false;
              }
              if (need) {
                tasks.push(
                  webpConvert(full, out)
                    .then(() =>
                      console.log(
                        "🟢 build:webp:",
                        norm(full).replace(norm(__dirname) + "/", ""),
                        "→",
                        norm(out).replace(norm(__dirname) + "/", "")
                      )
                    )
                    .catch((e) =>
                      console.warn("🔴 build:webp error:", full, e.message)
                    )
                );
              }
            }
          }
        })(IMG_DIR_DEV);
        if (tasks.length) await Promise.all(tasks);
      },
    },

    // build: rewrite refs to webp & prune originals
    {
      name: "rewrite-to-webp-and-prune",
      apply: "build",
      generateBundle(_options, bundle) {
        const webps = new Set(
          Object.values(bundle)
            .filter(
              (i) =>
                i.type === "asset" &&
                typeof i.fileName === "string" &&
                i.fileName.toLowerCase().endsWith(".webp")
            )
            .map((i) => norm(i.fileName).toLowerCase())
        );

        const toWebpIfExists = (pathStr) => {
          const m = pathStr.match(
            /^(.*\/assets\/images\/)([^\/]+)\.(jpg|jpeg|png|bmp)(?=(?:[?#][^"')\s]*)?)/i
          );
          if (!m) return null;
          const candidate = (m[1] + m[2] + ".webp").toLowerCase();
          return webps.has(candidate) ? m[1] + m[2] + ".webp" : null;
        };

        for (const item of Object.values(bundle)) {
          if (item.type !== "asset") continue;
          const f = (item.fileName || "").toLowerCase();
          if (!f.endsWith(".html") && !f.endsWith(".css")) continue;
          const original = item.source.toString();
          const replaced = original.replace(
            IMG_URL_RE,
            (match) => toWebpIfExists(match) || match
          );
          if (replaced !== original) {
            item.source = replaced;
            console.log("✏️  rewrite refs:", item.fileName);
          }
        }

        const exts = SRC_IMAGE_EXTS;
        for (const [key, item] of Object.entries(bundle)) {
          if (item.type !== "asset") continue;
          const f = norm(item.fileName);
          const lower = f.toLowerCase();
          const ext = exts.find((e) => lower.endsWith(e));
          if (!ext) continue;
          const base = f.slice(0, -ext.length) + ".webp";
          if (webps.has(base.toLowerCase())) {
            delete bundle[key];
            console.log("🗑  prune:", f, "→ kept:", base);
          }
        }
      },
    },
  ],

build: {
  assetsInlineLimit: 4096,
  outDir: path.resolve(__dirname, "src"),
  emptyOutDir: false,
  cssCodeSplit: false,
  sourcemap: isDev,
  minify: 'esbuild',
  target: 'es2020',
  
  rollupOptions: {
        input: {

      ...generatePageInputs(),
      
      // JavaScript точка входа - УБЕДИТЕСЬ ЧТО ОНА ВНУТРИ input: {}
      main: path.resolve(__dirname, "dev/assets/scripts/main.js")
    },
    preserveEntrySignatures: false,
    
    output: {
      entryFileNames: "assets/scripts/[name].[hash:8].js",
      chunkFileNames: "assets/scripts/[name].[hash:8].js",
      
      assetFileNames: (info) => {
        const ext = info.name.split(".").pop().toLowerCase();
        
        if (ext === "css") return "assets/styles/[name].[hash:8].css";
        if (["png", "jpg", "jpeg", "bmp", "webp", "gif", "svg"].includes(ext))
          return "assets/images/[name][extname]";
        if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext))
          return "assets/fonts/[name][extname]";
        if (["mp4", "webm", "ogg", "mp3", "wav"].includes(ext))
          return "assets/media/[name][extname]";
        if (["ico", "xml", "txt", "json", "map"].includes(ext))
          return "[name][extname]";
        return "assets/other/[name][extname]";
      },
      
      // ИСПРАВЛЕННАЯ версия manualChunks
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('swiper')) {
            return 'vendor-swiper';
          }
          return 'vendor';
        }
        
        if (id.includes('/components/')) {
          return 'components';
        }
        
        if (id.includes('/utils/')) {
          return 'utils';
        }
        
        return undefined;
      },
    },
    
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false
    }
  },
},

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "dev"),
      "@components": path.resolve(__dirname, "dev/components"),
    },
  },

css: {
  devSourcemap: isDev,
  preprocessorOptions: {
    scss: {
      includePaths: [
        path.resolve(__dirname, "dev/components"),
        path.resolve(__dirname, "dev/assets/styles"),
      ],
      charset: false, // Убирает ненужный @charset
      quietDeps: true // Убирает warnings от зависимостей
    },
  },
},

server: {
  host: true,
  port: 5500,
  https: false,
  strictPort: true,
  open: "/pages/index.html",
  fs: { 
    allow: [path.resolve(__dirname, "dev")],
    strict: false // Ускоряет file watching
  },
  watch: {
    usePolling: false, // Быстрее на Windows
    interval: 100
  }
},
});