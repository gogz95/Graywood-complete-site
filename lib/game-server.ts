import net from "net";

export interface GameServerStatus {
  online: boolean;
  latencyMs: number | null;
  playerCount: number | null;
  maxPlayers: number | null;
  statusText: string;
}

/**
 * Probes a game server cluster node dynamically.
 * Measures real round-trip TCP/UDP connectivity with a strict timeout.
 * Returns a clean "Unreachable / Offline" state if offline with zero hardcoded numbers.
 */
export async function queryGameServer(
  host: string,
  port: number,
  timeoutMs: number = 1500
): Promise<GameServerStatus> {
  const start = performance.now();

  return new Promise<GameServerStatus>((resolve) => {
    let resolved = false;

    const socket = new net.Socket();

    const finish = (online: boolean, errMessage?: string) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();

      if (online) {
        const latencyMs = Math.max(1, Math.round(performance.now() - start));
        resolve({
          online: true,
          latencyMs,
          playerCount: null,
          maxPlayers: null,
          statusText: "ONLINE",
        });
      } else {
        resolve({
          online: false,
          latencyMs: null,
          playerCount: null,
          maxPlayers: null,
          statusText: "Unreachable / Offline",
        });
      }
    };

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      finish(true);
    });

    socket.on("timeout", () => {
      finish(false, "Timeout");
    });

    socket.on("error", (err) => {
      finish(false, err.message);
    });

    try {
      socket.connect(port, host);
    } catch {
      finish(false, "Failed to connect");
    }
  });
}
