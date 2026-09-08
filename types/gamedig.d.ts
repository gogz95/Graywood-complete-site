declare module "gamedig" {
  export class GameDig {
    static query(options: {
      type: string;
      host: string;
      port?: number;
      socketTimeout?: number;
      maxAttempts?: number;
      [key: string]: any;
    }): Promise<{
      name?: string;
      map?: string;
      ping?: number;
      players?: Array<{ name?: string; ping?: number; [key: string]: any }>;
      maxplayers?: number;
      connect?: string;
      raw?: any;
    }>;

    query(options: any): Promise<any>;
  }
}
