import { WebSocketServer } from 'ws';
import { DbController } from './DbController';
import { WsController } from './WsController';
import { Game, GameInitialData } from 'models/game.model';
import {
  AddShipsData,
  AddUserToRoomData,
  AttackData,
  GameRequest,
  RandomAttackData,
  RegData,
} from 'models/request.model';

export class GameControler {
  private ws: WsController | null;
  private db: DbController | null;

  constructor() {
    this.ws = null;
    this.db = null;
  }

  public init(wss: WebSocketServer) {
    this.ws = new WsController(wss, this);
    this.db = new DbController();
    if (this.ws && this.db) {
      this.ws.init();
    } else {
      console.error('WebSocket controller is not initialized properly.');
    }
  }

  messageHandler(clientId: number, request: GameRequest) {
    if (!request) return;
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
        this.createGame(data);
        this.updateRoom();
        break;
      case 'add_ships':
        this.addShips(data, clientId);
        break;
      case 'attack':
        this.attack(data);
        break;
      case 'randomAttack':
        this.randomAttack(data);
        break;
      case 'single_play':
        this.createGame({ indexRoom: clientId });
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

  createGame(data: GameInitialData) {
    const game = this.db?.createGame(data);
    if (!game) return;
    const currentRoom = this.db?.rooms.find((room) => room.roomId === data.indexRoom);
    if (currentRoom) {
      //game in room
      currentRoom.roomUsers.forEach((user) => {
        const client = this.ws?.clients.get(user.index.toString());
        const response = { idGame: game?.idGame, idPlayer: user.index };
        client?.send(JSON.stringify({ type: 'create_game', data: JSON.stringify(response), id: 0 }));
      });
    } else {
      // single play
      const client = this.ws?.clients.get(game.hostId.toString());
      const response = { idGame: game?.idGame, idPlayer: game.hostId };
      client?.send(JSON.stringify({ type: 'create_game', data: JSON.stringify(response), id: 0 }));
    }
  }

  addShips(data: AddShipsData, clientId: number) {
    const game = this.db?.addShips(data, clientId);
    if (game) {
      game.data.forEach((item, index) => {
        const client = this.ws?.clients.get(item.indexPlayer.toString());
        const data = {
          currentPlayerIndex: index === 0 ? game.data[0]?.indexPlayer : game.data[1]?.indexPlayer,
          ships: item.ships,
        };
        client?.send(JSON.stringify({ type: 'start_game', data: JSON.stringify(data), id: 0 }));
      });

      const turnData = this.db?.turn(game.idGame);
      const turnResponse = JSON.stringify({ type: 'turn', data: JSON.stringify(turnData), id: 0 });
      this.ws?.sendToPlayers(game.hostId, game.clientId, turnResponse, turnResponse);

      const currentGame = this.db?.games.find((game) => game.idGame === clientId);
      if (!currentGame) return;

      if (!currentGame.isOnline && currentGame.turn === -1) {
        this.botAttack(game);
      }
    }
  }

  attack(data: AttackData) {
    const currentGame = this.db?.games.find((game) => game.idGame === data.gameId);
    if (!currentGame) return;
    const responseDb = this.db?.attack(data);
    if (responseDb) {
      const { game, responses } = responseDb;
      responses.forEach((response) => {
        const attackData = JSON.stringify({ type: 'attack', data: JSON.stringify(response), id: 0 });
        this.ws?.sendToPlayers(game.hostId, game.clientId, attackData, attackData);
      });

      const turnData = this.db?.turn(currentGame.idGame);
      const turnResponse = JSON.stringify({ type: 'turn', data: JSON.stringify(turnData), id: 0 });
      this.ws?.sendToPlayers(game.hostId, game.clientId, turnResponse, turnResponse);
    }

    if (!currentGame.isOnline && currentGame.turn === -1) {
      this.botAttack(currentGame);
    }

    const winPlayer = this.checkWinPlayer(currentGame);

    if (winPlayer !== undefined) {
      this.finish(currentGame.idGame, winPlayer);
      this.updateWinners();
    }
  }

  checkWinPlayer(game: Game): number | undefined {
    let winPlayer: undefined | number;
    let loosePlayer: undefined | number;
    game.data.forEach((item) => {
      const killedCount = item.grid.flat(2).reduce((acc, target) => (target === 4 ? acc + 1 : acc), 0);
      if (killedCount === 20) {
        loosePlayer = item.indexPlayer;
      }
    });
    if (loosePlayer !== undefined) {
      winPlayer = game.data.find((item) => item.indexPlayer !== loosePlayer)?.indexPlayer;
    }
    return winPlayer;
  }

  randomAttack(data: RandomAttackData) {
    const attackData = this.db?.randomAttack(data);
    if (!attackData) return;
    this.attack(attackData);
  }

  botAttack(game: Game) {
    const client = this.ws?.clients.get(game.hostId.toString());
    if (client) {
      setTimeout(() => {
        client.emit(
          'message',
          JSON.stringify({
            type: 'randomAttack',
            data: JSON.stringify({
              gameId: game?.idGame,
              indexPlayer: game?.clientId,
            }),
            id: 0,
          }),
        );
      }, 100);
    }
  }

  finish(gameId: number, winPlayer: number | string) {
    const currentGame = this.db?.games.find((game) => game.idGame === gameId);
    if (!currentGame) return;
    const response = this.db?.finish(gameId, winPlayer);
    const finishData = JSON.stringify({ type: 'finish', data: JSON.stringify(response), id: 0 });
    this.ws?.sendToPlayers(currentGame.hostId, currentGame.clientId, finishData, finishData);
  }

  endGame(playerId: number) {
    this.db?.endGame(playerId);
    this.updateRoom();
    this.updateWinners();
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
