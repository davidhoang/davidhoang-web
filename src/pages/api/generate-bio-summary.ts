import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export const prerender = false; // This needs to run on the server

export const GET: APIRoute = async () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const aiSummaryPath = join(__dirname, '../../data/bio-ai-summary.json');
    
    try {
      const aiSummaryContent = await readFile(aiSummaryPath, 'utf-8');
      const aiSummary = JSON.parse(aiSummaryContent);
      
      return new Response(JSON.stringify({
        exists: true,
        lastUpdated: aiSummary.lastUpdated,
        hasContent: !!aiSummary.content,
        contentLength: aiSummary.content?.length || 0
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        exists: false,
        message: 'AI summary not yet generated'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Failed to check AI summary status',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify the request has authorization (you can customize this)
    const authHeader = request.headers.get('authorization');
    const expectedToken = import.meta.env.BIO_UPDATE_SECRET || process.env.BIO_UPDATE_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Read the bio markdown file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const bioPath = join(__dirname, '../../content/bio.md');
    const bioContent = await readFile(bioPath, 'utf-8');

    // Extract all bio sections to provide context
    const sections = bioContent.split(/^##\s+(.+)$/gm);
    const allBios = sections.filter((_, i) => i % 2 === 1).join('\n\n');

    // Get AI API key (supports OpenAI or Anthropic)
    const aiApiKey = import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const anthropicApiKey = import.meta.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    if (!aiApiKey && !anthropicApiKey) {
      return new Response(JSON.stringify({ 
        error: 'No AI API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate AI summary
    let aiSummary = '';
    
    if (anthropicApiKey) {
      // Use Anthropic Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Write a concise, engaging bio summary (2-3 paragraphs) in first person based on the following information. Write directly as David Hoang would, without any introductory phrases or meta-commentary. Match the tone of the existing bios:\n\n${allBios}`
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Anthropic API error: ${errorText}`;
        
        // Try to parse error for better message
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = `Anthropic API error: ${errorData.error.message}`;
          }
        } catch (e) {
          // Use the text as-is
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Unexpected response format from Anthropic API');
      }
      
      aiSummary = data.content[0].text;
    } else if (aiApiKey) {
      // Use OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: `Write a concise, engaging bio summary (2-3 paragraphs) in first person based on the following information. Write directly as David Hoang would, without any introductory phrases or meta-commentary. Match the tone of the existing bios:\n\n${allBios}`
          }],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      aiSummary = data.choices[0].message.content;
    }

    // Save to JSON file
    const aiSummaryPath = join(__dirname, '../../data/bio-ai-summary.json');
    const summaryData = {
      content: aiSummary,
      lastUpdated: new Date().toISOString(),
      version: 1
    };

    await writeFile(aiSummaryPath, JSON.stringify(summaryData, null, 2), 'utf-8');

    return new Response(JSON.stringify({
      success: true,
      message: 'AI summary generated successfully',
      lastUpdated: summaryData.lastUpdated
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate AI summary',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

