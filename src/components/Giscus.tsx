import React, { useEffect, useRef } from 'react';

interface GiscusProps {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: string;
  term: string;
  reactionsEnabled: string;
  emitMetadata: string;
  inputPosition: string;
  theme: string;
  lang: string;
  loading: string;
}

export default function Giscus({
  repo,
  repoId,
  category,
  categoryId,
  mapping,
  term,
  reactionsEnabled,
  emitMetadata,
  inputPosition,
  theme,
  lang,
  loading
}: GiscusProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.hasChildNodes()) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-term', term);
    script.setAttribute('data-reactions-enabled', reactionsEnabled);
    script.setAttribute('data-emit-metadata', emitMetadata);
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-loading', loading);
    script.crossOrigin = 'anonymous';
    script.async = true;

    ref.current.appendChild(script);
  }, [repo, repoId, category, categoryId, mapping, term, reactionsEnabled, emitMetadata, inputPosition, theme, lang, loading]);

  return <div ref={ref} />;
}
