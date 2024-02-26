import { Game, GameData, GameInitialData } from 'models/game.model';
import { AddShipsData, AddUserToRoomData, AttackData, RandomAttackData, RegData } from 'models/request.model';
import { createHash } from 'node:crypto';
import { Room } from 'models/room.model';
import { Ship } from 'models/ship.model';
import { User } from 'models/user.model';
import { mockShips } from '../mockShips';

export class DbController {
  public users: User[];
  public rooms: Room[];
  public games: Game[];

  constructor() {
    this.users = [];
    this.rooms = [];
    this.games = [];
  }

  private generateHash(string: string) {
    return createHash('sha256').update(string).digest('hex');
  }

  public reg(connectionId: number, user: RegData) {
    const foundedUser = this.users.find((item) => item.name === user.name);
    let isError;
    let errorText;
    if (!foundedUser) {
      if (!/^[a-zA-Z\-]+$/.test(user.name)) {
        isError = true;
        errorText = 'Логин может содержать только латинские буквы';
      } else {
        this.users.push({
          index: connectionId,
          name: user.name,
          password: this.generateHash(user.password),
          wins: 0,
        });
      }
    } else {
      if (foundedUser?.password === this.generateHash(user.password)) {
        isError = false;
        errorText = '';
      } else {
        isError = true;
        errorText = 'Логин или пароль введен не верно';
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
    //игрок создавший комнату не может присоединиться так как он там уже есть
    if (roomId !== connectionId) {
      const foundedRoom = this.rooms.find((item) => item.roomId === roomId);
      const foundedUser = this.users.find((item) => item.index === connectionId);
      if (foundedRoom && foundedUser && foundedRoom.roomUsers.length < 2) {
        foundedRoom?.roomUsers.push({ name: foundedUser.name, index: connectionId });
        return { host: roomId, client: connectionId, isOnline: true };
      }
    }
  }

  createGame(data: GameInitialData) {
    const currentRoom = this.rooms.find((room) => room.roomId === data.indexRoom);
    if (currentRoom) {
      const game = {
        idGame: data.indexRoom,
        hostId: currentRoom?.roomUsers[0].index,
        clientId: currentRoom?.roomUsers[1].index,
        isOnline: true,
        data: [],
      };
      this.games.push(game);
      return game;
    } else {
      const game = {
        idGame: data.indexRoom,
        hostId: data.indexRoom,
        clientId: -1,
        isOnline: false,
        data: [],
      };
      this.games.push(game);
      return game;
    }
  }

  addShips(data: AddShipsData, clientId: number) {
    const currentGame = this.games.find((game) => game.idGame === data.gameId);
    if (currentGame) {
      (currentGame.data as Array<GameData>).push({
        indexPlayer: clientId,
        ships: this.generateShipsCells(data.ships),
        grid: this.generateGrid(data.ships),
      });
      if (currentGame.data.length === 1) {
        currentGame.hostId = clientId;
      }
      if (!currentGame.isOnline) {
        (currentGame.data as Array<GameData>).push({
          indexPlayer: -1,
          ships: this.generateShipsCells(mockShips),
          grid: this.generateGrid(mockShips),
        });
      }
      if (currentGame.data.length === 2) {
        currentGame.clientId = currentGame.isOnline ? clientId : -1;
        currentGame.turn = currentGame.data[0].indexPlayer;
        return currentGame;
      }
    }
  }

  attack(data: AttackData) {
    const currentGame = this.games.find((game) => game.idGame === data.gameId);
    if (currentGame?.turn === data.indexPlayer) {
      let response;
      const responses = [];
      const grid = currentGame.data.find((user) => user.indexPlayer !== data.indexPlayer)?.grid;
      if (grid) {
        const targetCell = grid[data.y][data.x];
        if (targetCell === 0) {
          grid[data.y][data.x] = 2;
          response = {
            position: {
              x: data.x,
              y: data.y,
            },
            currentPlayer: data.indexPlayer,
            status: 'miss',
          };
          responses.push(response);
        } else if (targetCell === 1) {
          const ships = currentGame.data.find((user) => user.indexPlayer !== data.indexPlayer)?.ships;
          const ship = ships?.find((ship) => {
            const current = ship.shipCells?.filter((cells) => cells.y === data.y && cells.x === data.x);
            return current && current.length > 0;
          });
          const cell = ship?.shipCells?.find((cell) => cell && cell.x === data.x && cell.y === data.y);
          if (cell && cell.status === 1) {
            if (
              ship &&
              ship.shipCells &&
              ship.shipCells.filter((cell) => cell?.status === 3).length === ship.shipCells.length - 1
            ) {
              ship.shipCells.forEach((cell) => {
                if (cell) {
                  cell.status = 4;
                  grid[cell.y][cell.x] = 4;
                  response = {
                    position: {
                      x: data.x,
                      y: data.y,
                    },
                    currentPlayer: data.indexPlayer,
                    status: 'killed',
                  };
                  responses.push(response);
                  const missedCells = this.getMissedCells(grid, cell.y, cell.x);
                  missedCells.forEach((missed) => {
                    grid[missed.y][missed.x] = 2;
                    response = {
                      position: {
                        x: missed.x,
                        y: missed.y,
                      },
                      currentPlayer: data.indexPlayer,
                      status: 'miss',
                    };
                    responses.push(response);
                  });
                }
              });
              ship.isKilled = true;
            } else {
              cell.status = 3;
              grid[data.y][data.x] = 3;
              response = {
                position: {
                  x: data.x,
                  y: data.y,
                },
                currentPlayer: data.indexPlayer,
                status: 'shot',
              };
              responses.push(response);
            }
          }
        }
      }
      return { game: currentGame, responses };
    }
  }

  randomAttack(data: RandomAttackData) {
    const currentGame = this.games.find((game) => game.idGame === data.gameId);
    if (!currentGame) return;
    const currentData = currentGame.data.find((item) => item.indexPlayer !== data.indexPlayer);
    if (!currentData) return;
    const { y, x } = this.getRandomCell(currentData.grid);
    const { gameId, indexPlayer } = data;
    return {
      gameId,
      y,
      x,
      indexPlayer,
    };
  }

  getRandomCell(grid: number[][]): { y: number; x: number } {
    let cell;
    let cellStatus = 0;
    do {
      cell = {
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
      };
      cellStatus = grid[cell.y][cell.x];
    } while (cellStatus !== 0 && cellStatus !== 1);
    return cell;
  }

  getMissedCells(grid: number[][], y: number, x: number) {
    const cells: { x: number; y: number }[] = [];
    for (let i = y - 1; i <= y + 1; i++) {
      for (let j = x - 1; j <= x + 1; j++) {
        if (j >= 0 && j < 10 && i >= 0 && i < 10 && (i !== y || j !== x) && grid[i][j] === 0 && grid[i][j] !== 2) {
          cells.push({ x: j, y: i });
        }
      }
    }
    return cells;
  }

  turn(gameId: number) {
    const currentGame = this.games.find((game) => game.idGame === gameId);
    if (!currentGame) return;
    currentGame.turn = currentGame.data.filter((user) => user.indexPlayer !== currentGame.turn)[0]?.indexPlayer;
    return {
      currentPlayer: currentGame.turn,
    };
  }

  finish(gameId: number, winPlayer: number | string) {
    const currentGame = this.games.find((game) => game.idGame === gameId);
    if (!currentGame) return;
    const winner = this.users.find((user) => user.index === winPlayer);
    winner?.wins !== undefined && winner.wins++; // добавляем кол-во побед
    this.rooms = this.rooms.filter((room) => room.roomId !== gameId); // удаляем комнату, так как игра завершена
    this.games = this.games.filter((game) => game.idGame !== gameId); //удаляем игру
    return { winPlayer };
  }

  generateShipsCells(ships: Ship[]) {
    return ships.map((ship) => {
      ship.shipCells = [];
      ship.isKilled = false;
      for (let i = 0; i < ship.length; i++) {
        ship.shipCells.push({
          y: ship.direction ? ship.position.y + i : ship.position.y,
          x: ship.direction ? ship.position.x : ship.position.x + i,
          status: 1,
        });
      }
      return ship;
    });
  }

  generateEmptyGrid(): number[][] {
    return Array(10)
      .fill(0)
      .map(() => Array(10).fill(0)) as number[][];
  }

  generateGrid(ships: Ship[]) {
    const grid = this.generateEmptyGrid();
    ships.forEach((ship) => {
      for (let i = 0; i < ship.length; i++) {
        grid[ship.direction ? ship.position.y + i : ship.position.y][
          ship.direction ? ship.position.x : ship.position.x + i
        ] = 1;
      }
    });
    return grid;
  }

  endGame(playerId: number) {
    this.rooms = this.rooms.filter((room) => !room.roomUsers.find((user) => user.index === playerId));
    this.games = this.games.filter((game) => game.clientId !== playerId && game.hostId !== playerId);
  }

  getAvailableRooms() {
    return this.rooms.filter((room) => room.roomUsers.length < 2);
  }
}
