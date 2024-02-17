import { RawData, WebSocket, WebSocketServer } from "ws"
import {randomUUID}  from 'crypto';

export class WebSocketController {
    public port: number;
    private wss: WebSocketServer;
    public clients: Map<string, WebSocket>

    constructor (port: number) {
        this.port = port
        this.wss = new WebSocketServer({port});
        this.clients = new Map<string, WebSocket>
        this.init()
    }

    init() {
        this.wss.on('connection', (client) => {
            const id = randomUUID();
            console.log(`New client with id:${id} on WebSocket connection!`);
            this.clients.set(id, client);
            client.on('message', (request) => {
                this.messageHandler(id, client, request)
            })
        })
    }

    messageHandler(id: string, client: WebSocket, request: RawData) {
        try {
            const parsed = JSON.parse(request.toString());
            const user = parsed.id
            const type = parsed.type;
            const data = parsed.data ? JSON.parse(parsed.data) : {};

            console.log(`New message from client with id:${id} on WebSocket connection!`, {type, data, user});

            return {user, data, type}
        } catch (e) {
            console.log(e);
        }
    }
}