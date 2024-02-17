import { WebSocket, WebSocketServer } from "ws"
import {randomUUID}  from 'crypto';
import { GameControler } from "./GameController";

export class WsController {
    private port: number;
    private wss: WebSocketServer;
    private clients: Map<string, WebSocket>
    private game: GameControler

    constructor (port: number, game: GameControler) {
        this.port = port;
        this.wss = new WebSocketServer({port});
        this.clients = new Map<string, WebSocket>;
        this.game = game;

    }

    public init() {
        this.wss.on('connection', (client) => {
            const id = randomUUID();
            this.clients.set(id, client);
            client.on('message', (request) => {
                this.game.messageHandler(id, request)
            })
        })
    }
}