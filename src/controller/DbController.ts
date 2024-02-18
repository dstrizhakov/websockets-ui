import { log } from 'console';
import { Room } from 'models/room.model';
import { User } from 'models/user.model';

export class DbController {
  public users: User[];
  public rooms: Room[];
  public games: User[];

  constructor() {
    this.users = [];
    this.rooms = [];
    this.games = [];
  }

  init() {}

  reg(connectionId: number, user: User) {
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
    return {
      type: 'update_room',
      data: JSON.stringify(this.rooms),
      id: 0,
    };
  }

  addUserToRoom(roomId: number, connectionId: number) {
    console.log(roomId === connectionId);
    if (roomId !== connectionId) {
      const foundedRoom = this.rooms.find((item) => item.roomId === connectionId);
      console.log(this.rooms);
      if (foundedRoom) {
        this.rooms.splice(this.rooms.indexOf(foundedRoom), 1);
      }
      const hostRoom = this.rooms.find((item) => item.roomId === roomId);
      console.log(hostRoom);
      if (hostRoom) {
        this.rooms.splice(this.rooms.indexOf(hostRoom), 1);
      }
      return { host: roomId, client: connectionId, isOnline: true };
    }
  }
}
