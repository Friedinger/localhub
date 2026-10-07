const CONCURRENCY = 40;
const TIMEOUT_MS = 1500;

export interface Server {
  port: number;
  title: string | null;
}

async function request(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readTitle(url: string): Promise<string | null> {
  try {
    const html = (await (await request(url, {})).text()).slice(0, 20000);
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
    return title?.trim() || null;
  } catch {
    // no CORS headers: the title cannot be read
    return null;
  }
}

/** A refused connection rejects, a listening server resolves (even without CORS). */
async function probe(port: number): Promise<Server | null> {
  const url = `http://localhost:${port}/`;
  try {
    await request(url, { mode: "no-cors" });
  } catch {
    return null;
  }
  return { port, title: await readTitle(url) };
}

export async function scan(
  ports: number[],
  onFound: (server: Server) => void,
  onProgress: (done: number, total: number) => void,
): Promise<Server[]> {
  const found: Server[] = [];
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (next < ports.length) {
      const port = ports[next++];
      if (port === undefined) break;
      const server = await probe(port);
      if (server) {
        found.push(server);
        onFound(server);
      }
      onProgress(++done, ports.length);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return found.sort((a, b) => a.port - b.port);
}
