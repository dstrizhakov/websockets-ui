import { WebSocket, WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { GameControler } from './GameController';
import { GameRequest } from 'models/request.model';

export class WsController {
  private port: number;
  private wss: WebSocketServer;
  public clients: Map<string, WebSocket>;
  private game: GameControler;
  private id: number;

  constructor(port: number, game: GameControler) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.clients = new Map<string, WebSocket>();
    this.game = game;
    this.id = 0;
  }

  public init() {
    this.wss.on('connection', (client) => {
      this.id += 1;
      this.clients.set(this.id.toString(), client);
      client.on('message', (request) => {
        const currentId = this.getKey(client);
        const parsed = this.game.deepParse(request.toString()) as GameRequest;
        if (currentId && parsed) {
          this.game.messageHandler(Number(currentId), parsed);
        }
      });
    });
  }

  public send(id: number, message: string) {
    const client = this.clients.get(id.toString());
    client?.send(message);
  }

  private getKey(client: WebSocket) {
    return [...this.clients.keys()].find((key) => this.clients.get(key) === client);
  }
}
