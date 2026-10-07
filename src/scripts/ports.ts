export const DEFAULT_PORTS =
  "80, 443, 1313, 3000-3010, 4000-4010, 4200, 4321, 5000-5010, 5173-5180, 6006, 7000-7010, 8000-8100, 8787, 8888, 9000-9010";

/** Parses "3000-3010, 5173" into a sorted list of unique valid ports. */
export function parsePorts(input: string): number[] {
  const ports = new Set<number>();
  for (const part of input.split(/[,\s]+/).filter(Boolean)) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!match) continue;
    const [, from = "", to = from] = match;
    const end = Math.min(65535, Number(to));
    for (let port = Math.max(1, Number(from)); port <= end; port++) {
      ports.add(port);
    }
  }
  return [...ports].sort((a, b) => a - b);
}
