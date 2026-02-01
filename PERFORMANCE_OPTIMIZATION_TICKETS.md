# Performance Optimization Tickets - davidhoang-web

## ✅ COMPLETED
### Font Loading Optimization
**Status:** Done  
**Description:** Added font preloading for ABC Diatype fonts to improve LCP and prevent FOIT  
**Files Changed:** `src/layouts/MainLayout.astro`  
**Impact:** Faster font loading, better Core Web Vitals  

---

## 🎫 JIRA TICKETS TO CREATE

### 1. Bundle Size Reduction & Code Splitting
**Priority:** High  
**Effort:** Large  
**Description:**  
Reduce the current 18MB bundle size by implementing advanced code splitting and minification.

**Tasks:**
- Add manual chunks for heavy libraries (framer-motion, konva, @paper-design/shaders-react)
- Implement terser minification with console.log removal
- Add proper cache busting with content hashes
- Configure rollup options for optimal chunking

**Expected Impact:** 30-50% bundle size reduction (18MB → 8-12MB)  
**Files:** `astro.config.mjs`, webpack config  

---

### 2. Lazy Loading Heavy React Components  
**Priority:** High  
**Effort:** Medium  
**Description:**  
Convert heavy React components to lazy-loaded with suspense boundaries to improve initial load.

**Components to Optimize:**
- `CareerOdyssey.tsx` (217KB)
- `CardStackHero.tsx` (19KB) 
- `ShaderBackground.tsx`
- `HeroImageShader.tsx`
- `MusicPlayer.tsx` (30KB)

**Tasks:**
- Create lazy-loaded wrappers with React.lazy()
- Add Suspense boundaries with loading skeletons
- Implement intersection observer for viewport-based loading
- Add error boundaries for graceful fallbacks

**Expected Impact:** Faster initial page load, improved LCP  
**Files:** `src/components/*`

---

### 3. Audio Compression & Optimization
**Priority:** Medium  
**Effort:** Medium  
**Description:**  
Reduce audio assets from 4.1MB to 1-2MB through compression and format optimization.

**Tasks:**
- Create audio optimization script using ffmpeg
- Convert to efficient formats (OGG Vorbis, compressed MP3)
- Remove unused audio files
- Implement lazy loading for audio players
- Add progressive loading for music player

**Expected Impact:** 50-75% audio size reduction  
**Files:** `public/audio/*`, `scripts/optimize-audio.mjs`

---

### 4. Image Delivery Improvements
**Priority:** Medium  
**Effort:** Small  
**Description:**  
Enhance image delivery with responsive formats and better optimization.

**Tasks:**
- Configure Astro image optimization for AVIF/WebP
- Add responsive image sets for different screen sizes  
- Implement progressive JPEG for large images
- Add proper alt text and lazy loading attributes
- Create image optimization script improvements

**Expected Impact:** Improved image loading, better LCP  
**Files:** `astro.config.mjs`, image components

---

### 5. Code Splitting & Prefetching Utilities
**Priority:** Medium  
**Effort:** Medium  
**Description:**  
Build utilities for smart code splitting and resource prefetching.

**Tasks:**
- Create intersection observer utility for component loading
- Add route-based code splitting for Astro pages
- Implement predictive prefetching for likely navigation
- Build performance monitoring hooks
- Add bundle analysis scripts

**Expected Impact:** Better perceived performance, faster navigation  
**Files:** `src/utils/*`, new utility files

---

### 6. Clean Up Unused Imports & Dead Code
**Priority:** Low  
**Effort:** Small  
**Description:**  
Remove unused code and optimize imports to reduce bundle size.

**Tasks:**
- Add ts-unused-exports to identify dead code
- Remove unused React imports (ErrorInfo, ReactNode warnings)
- Eliminate unused CSS and component files
- Add tree-shaking configuration
- Create lint rules to prevent unused imports

**Expected Impact:** Smaller bundle size, cleaner codebase  
**Files:** Various, linting config

---

### 7. Performance Monitoring Utilities  
**Priority:** Low  
**Effort:** Medium  
**Description:**  
Add tools to monitor and track performance improvements.

**Tasks:**
- Implement Core Web Vitals tracking
- Add bundle size monitoring in CI/CD
- Create performance budgets and alerts
- Build lighthouse CI integration
- Add real user monitoring (RUM)

**Expected Impact:** Ongoing performance visibility  
**Files:** `scripts/performance/*`, CI config

---

## Summary
- **Total Tickets:** 7
- **High Priority:** 2 (Bundle reduction, Lazy loading)
- **Medium Priority:** 3 (Audio, Images, Code splitting)  
- **Low Priority:** 2 (Code cleanup, Monitoring)
- **Expected Bundle Reduction:** 18MB → 8-12MB
- **Expected Audio Reduction:** 4.1MB → 1-2MB
- **Repository:** https://github.com/davidhoang/davidhoang-web