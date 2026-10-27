import colyseus from "colyseus";
import { createServer, type Server as HttpServer } from "node:http";
import { MatchRoom } from "./rooms/MatchRoom.js";

export * from "./rooms/MatchRoom.js";
export * from "./session.js";
export * from "./idempotency.js";
export * from "./logger.js";

export interface GameServerConfig {
  readonly port?: number;
}

export interface GameServerInstance {
  readonly gameServer: unknown;
  readonly httpServer: HttpServer;
  listen: (port?: number) => Promise<void>;
  close: () => Promise<void>;
}

export function createGameServer(config: GameServerConfig = {}): GameServerInstance {
  const httpServer = createServer();
  const colyseusObj = colyseus as unknown as {
    Server?: new (opts: unknown) => {
      define: (name: string, room: unknown) => void;
      listen: (port: number) => Promise<unknown>;
    };
    default?: {
      Server?: new (opts: unknown) => {
        define: (name: string, room: unknown) => void;
        listen: (port: number) => Promise<unknown>;
      };
    };
  };
  const ServerClass = (colyseusObj.Server ?? colyseusObj.default?.Server)!;
  const gameServer = new ServerClass({
    server: httpServer,
  });

  gameServer.define("match", MatchRoom);

  return {
    gameServer,
    httpServer,
    listen: (port: number = config.port ?? 2567) =>
      new Promise<void>((resolve, reject) => {
        try {
          gameServer.listen(port).then(() => resolve(), reject);
        } catch (err) {
          reject(err);
        }
      }),
    close: () =>
      new Promise<void>((resolve, reject) => {
        try {
          httpServer.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        } catch (err) {
          reject(err);
        }
      }),
  };
}
