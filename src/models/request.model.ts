
export interface RegData {
  user: string;
  password: string;
}

export type Type  = 'reg' | 'attack'

export interface RegRequest {
  type: 'reg';
  data: RegData;
  id: 0;
}


export type Request = RegRequest