import { GameDig } from "gamedig";
import { prisma } from "@/lib/prisma";

export interface LiveGameServerStatus {
  id: string;
  name: string;
  gameType: string;
  protocolType: string;
  endpoint: string;
  enabled: boolean;
  online: boolean;
  ping: number | null;
  currentPlayers: number;
  maxPlayers: number;
  map?: string;
  statusText: string;
}

/**
 * Live Game Server Telemetry Prober
 * Directly queries GameServer nodes registered in SQLite using native GameDig UDP protocols.
 * Returns live ping latency and connected player count, or an understated OFFLINE / UNREACHABLE status.
 */
export async function queryGameServers(): Promise<LiveGameServerStatus[]> {
  try {
    const servers = await prisma.gameServer.findMany({
      where: { enabled: true },
      orderBy: { createdAt: "asc" },
    });

    if (!servers.length) return [];

    const results = await Promise.all(
      servers.map(async (server): Promise<LiveGameServerStatus> => {
        const [host, portStr] = server.endpoint.split(":");
        const port = portStr ? parseInt(portStr, 10) : undefined;

        try {
          const state = await GameDig.query({
            type: server.protocolType || "minecraft",
            host: host || "127.0.0.1",
            port: port || 25565,
            socketTimeout: 2000,
            maxAttempts: 1,
          });

          return {
            id: server.id,
            name: server.name,
            gameType: server.gameType,
            protocolType: server.protocolType,
            endpoint: server.endpoint,
            enabled: server.enabled,
            online: true,
            ping: typeof state.ping === "number" ? state.ping : null,
            currentPlayers: state.players?.length ?? 0,
            maxPlayers: state.maxplayers ?? 0,
            map: state.map || undefined,
            statusText: "ONLINE",
          };
        } catch {
          return {
            id: server.id,
            name: server.name,
            gameType: server.gameType,
            protocolType: server.protocolType,
            endpoint: server.endpoint,
            enabled: server.enabled,
            online: false,
            ping: null,
            currentPlayers: 0,
            maxPlayers: 0,
            statusText: "OFFLINE / UNREACHABLE",
          };
        }
      })
    );

    return results;
  } catch (error) {
    console.error("queryGameServers error:", error);
    return [];
  }
}
