import { Ship } from 'models/ship.model';

export const mockShips: Ship[] = [
  {
    position: { x: 5, y: 0 },
    direction: false,
    type: 'huge',
    length: 4,
  },
  {
    position: { x: 2, y: 0 },
    direction: true,
    type: 'large',
    length: 3,
  },
  {
    position: { x: 0, y: 5 },
    direction: false,
    type: 'large',
    length: 3,
  },
  {
    position: { x: 7, y: 5 },
    direction: true,
    type: 'medium',
    length: 2,
  },
  {
    position: { x: 4, y: 3 },
    direction: true,
    type: 'medium',
    length: 2,
  },
  {
    position: { x: 5, y: 8 },
    direction: false,
    type: 'medium',
    length: 2,
  },
  {
    position: { x: 4, y: 6 },
    direction: false,
    type: 'small',
    length: 1,
  },
  {
    position: { x: 9, y: 5 },
    direction: false,
    type: 'small',
    length: 1,
  },
  {
    position: { x: 0, y: 1 },
    direction: true,
    type: 'small',
    length: 1,
  },
  {
    position: { x: 3, y: 8 },
    direction: true,
    type: 'small',
    length: 1,
  },
];
