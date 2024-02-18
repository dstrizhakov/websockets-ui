import { RawData, WebSocket } from 'ws';
import { DbController } from './DbController';
import { WsController } from './WsController';
import { RegData, RegRequest, Type } from 'models/request.model';
import { User } from 'models/user.model';
import { log } from 'console';
import rooms from '../../websockets-battleship/src/ws_server/databases/rooms';

export class GameControler {
  private ws: WsController | null;
  private db: DbController | null;

  constructor() {
    this.ws = null;
    this.db = null;
  }

  public init() {
    const WSS_PORT = Number(process.env.WSS_PORT || 3000);
    this.ws = new WsController(WSS_PORT, this);
    this.db = new DbController();
    if (this.ws && this.db) {
      this.ws.init();
      this.db.init();
    } else {
      console.error('WebSocket or Database controller is not initialized properly.');
    }
  }

  messageHandler(id: number, request: RawData) {
    const parsed = this.parseMesage(request);
    if (!parsed) return;
    console.log('messageHandler: ', parsed);
    const { type, data } = parsed;
    switch (type) {
      case 'reg':
        this.reg(id, data);
        this.updateWinners();
        break;
      case 'create_room':
        this.createRoom(id);
        this.updateRoom();
        break;
      case 'add_user_to_room':
        this.addUserToRoom(data.indexRoom, id);
        break;
    }
  }

  reg(conectionId: number, user: User) {
    const response = this.db?.reg(conectionId, user);
    this.ws?.send(conectionId, JSON.stringify(response));
  }

  createRoom(connectionId: number) {
    const response = this.db?.createRoom(connectionId);
    this.ws?.send(connectionId, JSON.stringify(response));
  }

  addUserToRoom(roomId: number, connectionId: number) {
    const response = this.db?.addUserToRoom(roomId, connectionId);
    this.ws?.send(connectionId, JSON.stringify(response));
  }

  updateRoom() {
    this.ws?.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'update_room', data: JSON.stringify(this.db?.rooms), id: 0 }));
    });
  }

  updateWinners() {
    this.ws?.clients.forEach((client) => {
        client.send(JSON.stringify({ type: 'update_winners', data: JSON.stringify(this.db?.users), id: 0 }));
      });
  }

  parseMesage(request: RawData) {
    try {
      const parsed = JSON.parse(request.toString());
      const type = parsed.type;
      const data = parsed.data ? JSON.parse(parsed.data) : {};
      return { type, data };
    } catch (error) {
      console.error("Can't parse message, error:", error);
      return null;
    }
  }

  deepParse(request: string) {
    const data = JSON.parse(request.toString());
    for (const property in data) {
      if (typeof data[property] === 'string') {
        if (data[property].includes('{')) data[property] = this.deepParse(data[property]);
      }
    }
    return data;
  }
}
