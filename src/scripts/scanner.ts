const CONCURRENCY = 40;
const TIMEOUT_MS = 1500;
/** Long enough for the user to answer a local network permission prompt. */
const PERMISSION_TIMEOUT_MS = 15000;

export interface Server {
  port: number;
  title: string | null;
}

export interface ScanResult {
  servers: Server[];
  /** Probes that hung until the timeout instead of being answered or refused. */
  timedOut: number;
}

type Probe = Server | "closed" | "timeout";

async function request(
  url: string,
  init: RequestInit,
  timeoutMs = TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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

/**
 * A refused connection rejects quickly, a listening server resolves (even
 * without CORS). A request that hangs until the timeout is neither: the
 * browser is usually waiting for or silently blocking local network access.
 */
async function probe(port: number): Promise<Probe> {
  const url = `http://localhost:${port}/`;
  try {
    await request(url, { mode: "no-cors" });
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError"
      ? "timeout"
      : "closed";
  }
  return { port, title: await readTitle(url) };
}

/**
 * Browsers that ask for local network permission hold back the first request
 * until the user answers. Wait for it once, so the real probes don't time out.
 */
async function awaitLocalAccess(port: number): Promise<void> {
  try {
    await request(
      `http://localhost:${port}/`,
      { mode: "no-cors" },
      PERMISSION_TIMEOUT_MS,
    );
  } catch {
    // refused or blocked: the actual probes will report it
  }
}

export async function scan(
  ports: number[],
  onFound: (server: Server) => void,
  onProgress: (done: number, total: number) => void,
): Promise<ScanResult> {
  const found: Server[] = [];
  let timedOut = 0;
  let next = 0;
  let done = 0;

  const first = ports[0];
  if (first !== undefined) await awaitLocalAccess(first);

  const worker = async () => {
    while (next < ports.length) {
      const port = ports[next++];
      if (port === undefined) break;
      const result = await probe(port);
      if (result === "timeout") {
        timedOut++;
      } else if (result !== "closed") {
        found.push(result);
        onFound(result);
      }
      onProgress(++done, ports.length);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { servers: found.sort((a, b) => a.port - b.port), timedOut };
}
