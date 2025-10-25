# Giscus Configuration Guide

## Steps to get your correct Giscus configuration:

### 1. Enable GitHub Discussions
- Go to your repository: https://github.com/davidhoang/davidhoang-web
- Click **Settings** tab
- Scroll down to **Features** section
- Check **Discussions** checkbox
- Click **Set up discussions**

### 2. Get Configuration from Giscus
- Visit: https://giscus.app
- Enter your repository: `davidhoang/davidhoang-web`
- Choose your settings:
  - **Page ↔️ Discussions Mapping**: `pathname`
  - **Discussion Category**: `General` (or create a new one)
  - **Features**: 
    - ✅ Reactions enabled
    - ❌ Emit metadata
  - **Theme**: `preferred_color_scheme`
  - **Language**: `en`
  - **Loading**: `lazy`

### 3. Copy the Configuration
Giscus will generate a script tag with your specific values. Copy these values:

```html
<script src="https://giscus.app/client.js"
        data-repo="davidhoang/davidhoang-web"
        data-repo-id="YOUR_REPO_ID"
        data-category="General"
        data-category-id="YOUR_CATEGORY_ID"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="en"
        data-loading="lazy"
        crossorigin="anonymous"
        async>
</script>
```

### 4. Update CommentsSection.astro
Replace the placeholder values in `src/components/CommentsSection.astro`:

```typescript
const giscusConfig = {
  repo: "davidhoang/davidhoang-web",
  repoId: "YOUR_REPO_ID", // From giscus.app
  category: "General",
  categoryId: "YOUR_CATEGORY_ID", // From giscus.app
  mapping: "pathname",
  term: title,
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "bottom",
  theme: "preferred_color_scheme",
  lang: "en",
  loading: "lazy"
};
```

### 5. Test the Integration
- Save the changes
- Visit a blog post on your site
- Check if the comments section loads properly
- Try commenting (you'll need to sign in with GitHub)

## Current Status
✅ Giscus component created  
✅ CommentsSection updated  
✅ BlogPost layout updated  
✅ CSS styling added  
⚠️ **Need to update with your actual repo ID and category ID**
