import { Ship } from './ship.model';

type data =
  | {
      indexPlayer: number;
      ships: Ship[];
      grid: number[][];
    }[]
  | [];

export interface Game {
  idGame: number;
  hostId: number;
  clientId: number;
  data: data;
  turn?: number;
  isOnline: boolean;
}

export interface GameInitialData {
  indexRoom: number;
}
