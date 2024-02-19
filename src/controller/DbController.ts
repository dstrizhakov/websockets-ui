import { Game, GameInitialData } from 'models/game.model';
import { RegData } from 'models/request.model';
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

  init() { }

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

  addUserToRoom(roomId: number, connectionId: number) {
    if (roomId !== connectionId) {
      const foundedRoom = this.rooms.find((item) => item.roomId === roomId);
      const foundedUser = this.users.find((item) => item.index === connectionId);
      if (foundedRoom && foundedUser && foundedRoom.roomUsers.length < 2) {
        foundedRoom?.roomUsers.push({ name: foundedUser.name, index: connectionId });
        return { host: roomId, client: connectionId, isOnline: true };
      }
    }
  }

  createGame(gameData: GameInitialData, id: number) {
    const game = {
      idGame: gameData.indexRoom,
      idPlayer: id,
    };
    return game;
  }

  addShips(gameId: number, playerId: number, ships: Ship[]) {
    console.log('gameId:', gameId);
    console.log('playerId:', playerId);
    console.log('ships:', ships);
  }
}
