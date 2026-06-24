import { ApiError } from '../errors/ApiError';

export const postJson = async <T>(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new ApiError(502, 'LLM provider request failed', details);
  }

  return (await response.json()) as T;
};

const extractData = (rawEvent: string): string | null => {
  const dataLines = rawEvent
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim());

  return dataLines.length > 0 ? dataLines.join('\n') : null;
};

export async function* streamSse(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal: AbortSignal,
): AsyncGenerator<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    const details = await response.text().catch(() => '');
    throw new ApiError(502, 'LLM provider request failed', details);
  }

  const decoder = new TextDecoder();
  const stream = response.body as unknown as AsyncIterable<Uint8Array>;
  let buffer = '';

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true }).replace(/\r\n/g, '\n');

    let separatorIndex = buffer.indexOf('\n\n');

    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const data = extractData(rawEvent);

      if (data === '[DONE]') {
        return;
      }

      if (data !== null) {
        yield JSON.parse(data);
      }

      separatorIndex = buffer.indexOf('\n\n');
    }
  }
}
