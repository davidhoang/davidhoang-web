import { validateGeneratedTheme } from './theme-validation.mjs';

function parseThemeResponse(responseText) {
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                    responseText.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
  return JSON.parse(jsonStr);
}

/**
 * Request a bounded theme and give Claude actionable feedback on one retry.
 * @param {object} options
 * @param {any} options.client
 * @param {string} options.fullPrompt
 * @param {import('@anthropic-ai/sdk/resources/messages/messages').ContentBlockParam[]} [options.imagePrefixBlocks]
 * @param {(theme: any) => any} [options.normalizeTheme]
 */
export async function requestThemeCandidate({
  client,
  fullPrompt,
  imagePrefixBlocks = [],
  normalizeTheme = (theme) => theme,
}) {
  let messages = [{
    role: 'user',
    content: [...imagePrefixBlocks, { type: 'text', text: fullPrompt }],
  }];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    // Let API errors propagate unchanged so outage fallback can classify them.
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages,
    });
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    try {
      if (message.stop_reason === 'max_tokens') {
        throw new Error('Theme response was truncated at the token limit. Return a complete, concise JSON object.');
      }
      if (!responseText) throw new Error('Theme response did not contain any text.');

      const validated = validateGeneratedTheme(parseThemeResponse(responseText));
      // Keep normalization (including contrast checks) inside the retry boundary.
      return normalizeTheme(validated);
    } catch (validationError) {
      if (attempt === 2) {
        throw new Error(`Theme candidate failed validation after retry: ${validationError.message}`, {
          cause: validationError,
        });
      }
      messages = [
        ...messages,
        ...(responseText ? [{ role: 'assistant', content: responseText }] : []),
        {
          role: 'user',
          content: [
            '## VALIDATION RETRY',
            'The previous theme was rejected:',
            validationError.message,
            'Correct these errors and keep every field within the allowed values in the original instructions.',
            'Return ONLY one complete raw JSON object. No markdown fences or commentary.',
          ].join('\n'),
        },
      ];
    }
  }

  throw new Error('Theme candidate generation failed unexpectedly.');
}
