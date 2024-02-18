import { Ship } from "./ship.model";

type data =
  | {
      indexPlayer: number;
      ships: Ship[];
      grid: number[][];
    }[]
  | [];

export default interface IGame {
  gameId: number;
  hostId: number;
  clientId: number;
  data: data;
  turn?: number;
  isOnline: boolean;
}