import { Game, GameData, GameInitialData } from 'models/game.model';
import { AddShipsData, AddUserToRoomData, AttackData, RandomAttackData, RegData } from 'models/request.model';
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
    const currentRoom = this.rooms.find((room) => room.roomId === data.indexRoom);
    if (!currentRoom) return;
    const game = {
      idGame: data.indexRoom,
      hostId: currentRoom?.roomUsers[0].index,
      clientId: currentRoom?.roomUsers[1].index,
      isOnline: true,
      data: [],
    };
    this.games.push(game);
    return game;
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

      if (currentGame.data.length === 2) {
        currentGame.clientId = clientId;
        currentGame.turn = currentGame.data[0].indexPlayer;
        return currentGame;
      }
    }
  }
  // 1-hidden 2-miss 3-shot 4-killed
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
    const currentData = currentGame.data.find((item) => item.indexPlayer === data.indexPlayer);
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
    const randomCell = {
      y: Math.floor(Math.random() * 10),
      x: Math.floor(Math.random() * 10),
    };
    return grid[randomCell.y][randomCell.x] === 0 || grid[randomCell.y][randomCell.x] === 1
      ? randomCell
      : this.getRandomCell(grid);
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
    this.rooms.filter((room) => room.roomId !== gameId); // удаляем комнату, так как игра завершена
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
    // ships.forEach((ship) => {
    //   const { x, y } = ship.position;
    //   const { length, direction } = ship;
    //   if (direction) {
    //     for (let i = 0; i < length; i++) {
    //       if (x + i < 10) {
    //         grid[y][x + i] = 1;
    //       }
    //     }
    //   } else {
    //     for (let i = 0; i < length; i++) {
    //       if (y + i < 10) {
    //         grid[y + i][x] = 1;
    //       }
    //     }
    //   }
    // });

    return grid;
  }

  getAvailableRooms() {
    return this.rooms.filter((room) => room.roomUsers.length < 2);
  }
}
