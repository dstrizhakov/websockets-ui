import { Ship } from './ship.model';

export interface RegData {
  name: string;
  password: string;
}
export interface AddShipsData {
  gameId: number;
  indexPlayer: number;
  ships: Ship[];
}
export interface AddUserToRoomData {
  indexRoom: number;
}

export interface AttackData {
  gameId: number;
  x: number;
  y: number;
  indexPlayer: number;
}

export interface RandomAttackData {
  gameId: number;
  indexPlayer: number;
}

export interface RegReq {
  type: 'reg';
  data: RegData;
  id: 0;
}

export interface CreateRoomReq {
  type: 'create_room';
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

export interface Attack {
  type: 'attack';
  data: AttackData;
  id: 0;
}

export interface RandomAttack {
  type: 'randomAttack';
  data: RandomAttackData;
  id: 0;
}

export type Type = 'reg' | 'create_room' | 'add_user_to_room' | 'add_ships' | 'attack' | 'randomAttack';

export type GameRequest = RegReq | CreateRoomReq | AddShipsReq | AddUserToRoomReq | Attack | RandomAttack;
