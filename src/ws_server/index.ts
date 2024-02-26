import { CloseEvent, MessageEvent, WebSocket, WebSocketServer } from 'ws';

export interface WebSocketClient extends WebSocket {
    id?: number;
}

const port = Number(process.env.WSS_PORT || 3000);

export const wsServer = new WebSocketServer({ port });