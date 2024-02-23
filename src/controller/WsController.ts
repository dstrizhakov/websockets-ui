import { CloseEvent, MessageEvent, WebSocket, WebSocketServer } from 'ws';
import { GameControler } from './GameController';
import { GameRequest } from 'models/request.model';

export interface WebSocketClient extends WebSocket {
  id?: number;
}

export class WsController {
  private port: number;
  private wss: WebSocketServer;
  public clients: Map<string, WebSocketClient>;
  private game: GameControler;
  private id: number;

  constructor(port: number, game: GameControler) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.clients = new Map<string, WebSocketClient>();
    this.game = game;
    this.id = 0;
  }

  public init() {
    this.wss
      .on('connection', (client) => {
        const webSocketClient: WebSocketClient = client;
        webSocketClient.id = this.id;
        this.clients.set(this.id.toString(), webSocketClient);
        this.id += 1;
        client.on('message', (request: MessageEvent) => {
          const currentId = this.getKey(client);
          const parsed = this.game.deepParse(request.toString()) as GameRequest;
          if (currentId && parsed) {
            this.game.messageHandler(Number(currentId), parsed);
          }
        });
      })
      .on('open', (event: Event) => {
        console.log('open... event = ', event);
      })
      .on('close', (event: CloseEvent) => {
        console.log('close... current id = ', this.getKey(event.target));
      })
      .on('error', (error: Error) => {
        console.log(error);
      });
  }

  public send(id: number, message: string) {
    const client = this.clients.get(id.toString());
    client?.send(message);
  }

  public sendToPlayers(hostId: number, clientId: number, messageHost: string, messageClient: string) {
    const host = this.clients.get(hostId.toString());
    const client = this.clients.get(clientId.toString());
    host?.send(messageHost);
    client?.send(messageClient);
  }

  private getKey(client: WebSocket) {
    return [...this.clients.keys()].find((key) => this.clients.get(key) === client);
  }
}
