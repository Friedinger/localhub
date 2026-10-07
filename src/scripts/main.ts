import "../styles/style.css";
import { DEFAULT_PORTS, parsePorts } from "./ports";
import { scan, type Server } from "./scanner";

const AUTO_INTERVAL_MS = 5000;

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

const portsInput = byId<HTMLInputElement>("ports");
const scanButton = byId<HTMLButtonElement>("scan");
const autoCheckbox = byId<HTMLInputElement>("auto");
const statusText = byId("status");
const grid = byId("grid");

let scanning = false;
let timer: number | undefined;

function div(className: string, text: string): HTMLDivElement {
  const element = document.createElement("div");
  element.className = className;
  element.textContent = text;
  return element;
}

function card({ port, title }: Server): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "card";
  link.href = `http://localhost:${port}/`;
  link.target = "_blank";
  link.rel = "noopener";
  link.append(
    div("card__port", `:${port}`),
    div("card__title", title ?? "(title not readable)"),
    div("card__hint", `localhost:${port}`),
  );
  return link;
}

function render(servers: Server[]): void {
  if (servers.length === 0) {
    grid.replaceChildren(div("empty", "No running servers found."));
    return;
  }
  grid.replaceChildren(...servers.map(card));
}

/** Keeps the URL in sync so the current settings can be bookmarked. */
function syncUrl(): void {
  const params = new URLSearchParams();
  const ports = portsInput.value.trim();
  if (ports && ports !== DEFAULT_PORTS) params.set("ports", ports);
  if (autoCheckbox.checked) params.set("auto", "1");
  const query = params.toString();
  history.replaceState(
    null,
    "",
    `${location.pathname}${query ? `?${query}` : ""}`,
  );
}

function setAuto(enabled: boolean): void {
  autoCheckbox.checked = enabled;
  window.clearInterval(timer);
  timer = enabled
    ? window.setInterval(() => void runScan(), AUTO_INTERVAL_MS)
    : undefined;
  syncUrl();
}

async function runScan(): Promise<void> {
  if (scanning) return;
  scanning = true;
  scanButton.disabled = true;

  const ports = parsePorts(portsInput.value);
  syncUrl();

  const live: Server[] = [];
  const servers = await scan(
    ports,
    (server) => {
      live.push(server);
      render([...live].sort((a, b) => a.port - b.port));
    },
    (done, total) => {
      statusText.textContent = `Scanning… ${done}/${total}`;
    },
  );

  render(servers);
  statusText.textContent = `${servers.length} server(s) found (${ports.length} ports checked, ${new Date().toLocaleTimeString()})`;
  scanning = false;
  scanButton.disabled = false;
}

const params = new URLSearchParams(location.search);
portsInput.value = params.get("ports")?.trim() || DEFAULT_PORTS;
scanButton.addEventListener("click", () => void runScan());
portsInput.addEventListener("input", syncUrl);
portsInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") void runScan();
});
autoCheckbox.addEventListener("change", () => setAuto(autoCheckbox.checked));

setAuto(params.get("auto") === "1");
void runScan();
