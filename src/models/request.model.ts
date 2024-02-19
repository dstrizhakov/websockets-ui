import { Ship } from "./ship.model";

export interface RegData {
  name: string;
  password: string;
}
export interface AddShipsData {
  gameId: number;
  playerIndex: number;
  ships: Ship[];
}
export interface AddUserToRoomData {
  indexRoom: number;
}

export interface RegReq {
  type: 'reg';
  data: RegData;
  id: 0;
}

export interface CreateRoomReq {
  type: 'create_room',
  data: '';
}

export interface AddUserToRoomReq {
  type: 'add_user_to_room';
  data: AddUserToRoomData;
}

export interface AddShipsReq {
  type: 'add_ships';
  data: AddShipsData;
}


export type Type = 'reg' | 'create_room' | 'add_user_to_room' | 'add_ships' | 'attack'
export type GameRequest = RegReq | CreateRoomReq | AddShipsReq | AddUserToRoomReq