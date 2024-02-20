import { log } from 'console';
import { DbController } from './DbController';
import { WsController } from './WsController';
import { GameInitialData } from 'models/game.model';
import { AddShipsData, AddUserToRoomData, GameRequest, RegData } from 'models/request.model';

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

  messageHandler(clientId: number, request: GameRequest) {
    if (!request) return;
    console.log('messageHandler: ', request);
    const { type, data } = request;
    switch (type) {
      case 'reg':
        this.reg(clientId, data);
        this.updateRoom();
        this.updateWinners();
        break;
      case 'create_room':
        this.createRoom(clientId);
        this.updateRoom();
        break;
      case 'add_user_to_room':
        this.addUserToRoom(data, clientId);
        this.createGame(data, clientId);
        this.updateRoom();
        break;
      case 'add_ships':
        this.addShips(data, clientId);

        break;
    }
  }

  reg(conectionId: number, user: RegData) {
    const response = this.db?.reg(conectionId, user);
    this.ws?.send(conectionId, JSON.stringify(response));
  }

  createRoom(connectionId: number) {
    const response = this.db?.createRoom(connectionId);
    this.ws?.send(connectionId, JSON.stringify({ type: 'update_room', data: JSON.stringify(response), id: 0 }));
  }

  addUserToRoom(data: AddUserToRoomData, connectionId: number) {
    const response = this.db?.addUserToRoom(data, connectionId);
    this.ws?.send(connectionId, JSON.stringify({ type: 'add_user_to_room', data: JSON.stringify(response), id: 0 }));
  }

  updateRoom(users: 'all' | string[] = 'all') {
    if (users === 'all') {
      this.ws?.clients.forEach((client) => {
        client.send(JSON.stringify({ type: 'update_room', data: JSON.stringify(this.db?.getAvailableRooms()), id: 0 }));
      });
    }
  }

  updateWinners() {
    this.ws?.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'update_winners', data: JSON.stringify(this.db?.users), id: 0 }));
    });
  }

  createGame(data: GameInitialData, id: number) {
    console.log('CREATE GAME');
    const response = this.db?.createGame(data, id);
    const currentRoom = this.db?.rooms.find((room) => room.roomId === data.indexRoom);
    currentRoom?.roomUsers.forEach((user) => {
      const client = this.ws?.clients.get(user.index.toString());
      client?.send(JSON.stringify({ type: 'create_game', data: JSON.stringify(response), id: 0 }));
    });
  }

  addShips(data: AddShipsData, clientId: number) {
    const game = this.db?.addShips(data, clientId);
    if (game) {
      game.data.forEach((item) => {
        const client = this.ws?.clients.get(item.indexPlayer.toString());
        const data = {
          currentPlayerIndex: item.indexPlayer,
          ships: item.ships,
        };
        client?.send(JSON.stringify({ type: 'start_game', data: JSON.stringify(data), id: 0 }));
      });
    }
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
