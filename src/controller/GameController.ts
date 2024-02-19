import { RawData } from 'ws';
import { DbController } from './DbController';
import { WsController } from './WsController';
import { User } from 'models/user.model';
import { log } from 'console';
import { GameInitialData } from 'models/game.model';

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
    const parsed = this.deepParse(request.toString());
    if (!parsed) return;
    console.log('messageHandler: ', parsed);
    const { type, data } = parsed;
    switch (type) {
      case 'reg':
        this.reg(id, data);
        this.updateRoom();
        this.updateWinners();
        break;
      case 'create_room':
        this.createRoom(id);
        this.updateRoom();
        break;
      case 'add_user_to_room':
        this.addUserToRoom(data.indexRoom, id);
        this.createGame(data, id);
        this.updateRoom();
        break;
      case 'add_ships':
        this.addShips(data, data.indexPlayer);
        break;
    }
  }

  reg(conectionId: number, user: User) {
    const response = this.db?.reg(conectionId, user);
    this.ws?.send(conectionId, JSON.stringify(response));
  }

  createRoom(connectionId: number) {
    const response = this.db?.createRoom(connectionId);
    this.ws?.send(connectionId, JSON.stringify({ type: 'update_room', data: JSON.stringify(response), id: 0 }));
  }

  addUserToRoom(roomId: number, connectionId: number) {
    const response = this.db?.addUserToRoom(roomId, connectionId);
    this.ws?.send(connectionId, JSON.stringify({ type: 'add_user_to_room', data: JSON.stringify(response), id: 0 }));
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

  createGame(gameData: GameInitialData, id: number) {
    const response = this.db?.createGame(gameData, id);
    const currentRoom = this.db?.rooms.find((room) => room.roomId === gameData.indexRoom);
    currentRoom?.roomUsers.forEach((user) => {
      const client = this.ws?.clients.get(user.index.toString());
      client?.send(JSON.stringify({ type: 'create_game', data: JSON.stringify(response), id: 0 }));
    });
  }

  addShips(data: any, indexPlayer: number) {
    this.db?.addShips(data.gameId, indexPlayer, data.ships);
  }

  deepParse(request: string) {
    const data = JSON.parse(request);
    for (const property in data) {
      if (typeof data[property] === 'string') {
        if (data[property].includes('{')) data[property] = this.deepParse(data[property]);
      }
    }
    return data;
  }
}
