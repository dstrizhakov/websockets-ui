import { WebSocketController } from "./src/ws_server/WebSocketController";
import { httpServer } from "./src/http_server/index";

const HTTP_PORT = process.env.HTTP_PORT || 8181;
const WSS_PORT = Number(process.env.WSS_PORT || 3000);

httpServer.listen(HTTP_PORT, () => {
    console.log(`Start static http server on the ${HTTP_PORT} port!`);
});

new WebSocketController(WSS_PORT);


