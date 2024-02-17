import { RawData } from 'ws';
import { DbController } from './DbController';
import { WsController } from "./WsController";

export class GameControler {
    private ws: WsController | null;
    private db: DbController | null;
    
    constructor() {
        this.ws = null;
        this.db = null;
    }

    public init() {
        const WSS_PORT = Number(process.env.WSS_PORT || 3000);
        this.ws = new WsController(WSS_PORT, this)
        this.db = new DbController();
        if (this.ws && this.db) {
            this.ws.init();
            this.db.init();
        } else {
            console.error("WebSocket or Database controller is not initialized properly.");
        }

    }

    messageHandler(id: string, request: RawData) {
        try {
            const parsed = JSON.parse(request.toString());
            const type = parsed.type;
            const data = parsed.data ? JSON.parse(parsed.data) : {};
            return {id, data, type}
        } catch (e) {
            console.log(e);
        }
    }
}