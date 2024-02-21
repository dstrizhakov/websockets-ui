import { GameControler } from "./src/controller/GameController";
import { httpServer } from "./src/http_server/index";

const HTTP_PORT = process.env.HTTP_PORT || 8181;
const WSS_PORT = Number(process.env.WSS_PORT || 3000);

httpServer.listen(HTTP_PORT, () => {
    console.log(`Start static http server on the ${HTTP_PORT} port!`);
});

const game = new GameControler();
game.init(WSS_PORT)


