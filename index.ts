import { wsServer } from "./src/ws_server";
import { GameControler } from "./src/controller/GameController";
import { httpServer } from "./src/http_server/index";

const HTTP_PORT = process.env.HTTP_PORT || 8181;

httpServer.listen(HTTP_PORT, () => {
    console.log(`Start static http server on the ${HTTP_PORT} port!`);
});

const game = new GameControler();
game.init(wsServer)


