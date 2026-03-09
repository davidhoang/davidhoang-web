<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS Feed</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style type="text/css">
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            max-width: 640px;
            margin: 0 auto;
            padding: 2rem 1rem;
            color: #1a1a1a;
            line-height: 1.6;
            background: #fafafa;
          }
          .banner {
            background: #1a1a1a;
            color: #fff;
            padding: 1rem 1.25rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            font-size: 0.875rem;
            line-height: 1.5;
          }
          .banner a { color: #a5b4fc; }
          h1 {
            font-size: 1.5rem;
            margin-bottom: 0.25rem;
          }
          .description {
            color: #666;
            margin-bottom: 2rem;
          }
          .meta {
            font-size: 0.8rem;
            color: #888;
            margin-bottom: 2rem;
          }
          .item {
            border-top: 1px solid #e5e5e5;
            padding: 1.25rem 0;
          }
          .item h2 {
            font-size: 1.1rem;
            margin-bottom: 0.25rem;
          }
          .item h2 a {
            color: #1a1a1a;
            text-decoration: none;
          }
          .item h2 a:hover { text-decoration: underline; }
          .item .date {
            font-size: 0.8rem;
            color: #888;
            margin-bottom: 0.5rem;
          }
          .item .summary {
            font-size: 0.9rem;
            color: #444;
          }
          .categories {
            display: flex;
            gap: 0.375rem;
            margin-top: 0.5rem;
            flex-wrap: wrap;
          }
          .categories span {
            font-size: 0.7rem;
            background: #e5e5e5;
            padding: 0.125rem 0.5rem;
            border-radius: 999px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="banner">
          <strong>This is an RSS feed.</strong> Subscribe by copying the URL into your reader.
          Visit <a href="https://aboutfeeds.com">About Feeds</a> to learn more.
        </div>
        <h1><xsl:value-of select="/rss/channel/title"/></h1>
        <p class="description"><xsl:value-of select="/rss/channel/description"/></p>
        <p class="meta">
          <xsl:value-of select="count(/rss/channel/item)"/> items ·
          Last updated <xsl:value-of select="/rss/channel/lastBuildDate"/>
        </p>
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <h2><a><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute><xsl:value-of select="title"/></a></h2>
            <p class="date"><xsl:value-of select="pubDate"/></p>
            <p class="summary"><xsl:value-of select="description"/></p>
            <xsl:if test="category">
              <div class="categories">
                <xsl:for-each select="category">
                  <span><xsl:value-of select="."/></span>
                </xsl:for-each>
              </div>
            </xsl:if>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
