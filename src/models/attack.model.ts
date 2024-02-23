export default interface Attack {
    type: 'attack';
    data: {
      gameId: number;
      x: number;
      y: number;
      indexPlayer: number;
    };
    id: 0;
  }