import { log } from 'console';
import { Game, GameData, GameInitialData } from 'models/game.model';
import { AddShipsData, AddUserToRoomData, RegData } from 'models/request.model';
import { Room } from 'models/room.model';
import { Ship } from 'models/ship.model';
import { User } from 'models/user.model';

export class DbController {
  public users: User[];
  public rooms: Room[];
  public games: Game[];

  constructor() {
    this.users = [];
    this.rooms = [];
    this.games = [];
  }

  init() {}

  reg(connectionId: number, user: RegData) {
    const foundedUser = this.users.find((item) => item.name === user.name);
    let isError;
    let errorText;
    if (!foundedUser) {
      if (!/^[a-zA-Z\-]+$/.test(user.name)) {
        isError = true;
        errorText = 'Name must contain only letters';
      } else {
        this.users.push({
          index: connectionId,
          name: user.name,
          password: user.password,
          wins: 0,
        });
      }
    } else {
      if (foundedUser?.password === user?.password) {
        isError = false;
        errorText = '';
      } else {
        isError = true;
        errorText = 'Wrong password';
      }
    }

    return {
      type: 'reg',
      data: JSON.stringify({
        name: user.name,
        index: connectionId,
        error: isError,
        errorText: errorText,
      }),
      id: 0,
    };
  }

  createRoom(id: number) {
    const foundedRoom = this.rooms.find((item) => item.roomId === id);
    if (!foundedRoom) {
      const foundedUser = this.users.find((item) => item.index === id);
      if (!foundedUser) return;

      const data = {
        roomId: id,
        roomUsers: [
          {
            name: foundedUser.name,
            index: foundedUser.index,
          },
        ],
      };
      this.rooms.push(data);
    }
    return this.rooms;
  }

  addUserToRoom(data: AddUserToRoomData, connectionId: number) {
    const roomId = data?.indexRoom;
    if (roomId !== connectionId) {
      const foundedRoom = this.rooms.find((item) => item.roomId === roomId);
      const foundedUser = this.users.find((item) => item.index === connectionId);
      if (foundedRoom && foundedUser && foundedRoom.roomUsers.length < 2) {
        foundedRoom?.roomUsers.push({ name: foundedUser.name, index: connectionId });
        return { host: roomId, client: connectionId, isOnline: true };
      }
    }
  }

  createGame(data: GameInitialData, id: number) {
    const game = {
      idGame: data.indexRoom,
      idPlayer: id,
    };
    this.games.push({
      idGame: data.indexRoom,
      hostId: id,
      clientId: id,
      isOnline: true,
      data: [],
    });
    return game;
  }

  addShips(data: AddShipsData, clientId: number) {
    const currentGame = this.games.find((game) => game.idGame === data.gameId);
    if (currentGame) {
      const emptyGrid: number[][] = Array(10)
        .fill(0)
        .map(() => Array(10).fill(0));

      (currentGame.data as Array<GameData>).push({
        indexPlayer: clientId,
        ships: data.ships,
        grid: emptyGrid,
      });

      if (currentGame.data.length >= 2) {
        return currentGame;
      }
    }

    console.log('currentGame: ', currentGame);
  }

  getAvailableRooms() {
    return this.rooms.filter((room) => room.roomUsers.length < 2);
  }
}
