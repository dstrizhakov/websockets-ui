import { User } from './user.model';

export interface Room {
  roomId: number;
  roomUsers: User[];
}
