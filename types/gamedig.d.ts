declare module "gamedig" {
  export class GameDig {
    static query(options: {
      type: string;
      host: string;
      port?: number;
      socketTimeout?: number;
      maxAttempts?: number;
      [key: string]: unknown;
    }): Promise<{
      name?: string;
      map?: string;
      ping?: number;
      players?: Array<{ name?: string; ping?: number; [key: string]: unknown }>;
      maxplayers?: number;
      connect?: string;
      raw?: unknown;
    }>;

    query(options: unknown): Promise<unknown>;
  }
}
