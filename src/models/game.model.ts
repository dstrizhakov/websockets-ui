import { Ship } from './ship.model';

export interface GameData {
  indexPlayer: number;
  ships: Ship[];
  grid: number[][];
}

export interface Game {
  idGame: number;
  hostId: number;
  clientId: number;
  data: GameData[] | [];
  turn?: number;
  isOnline: boolean;
}

export interface GameInitialData {
  indexRoom: number;
}
