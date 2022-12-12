import { HttpRequest, HttpResponse, us_socket_context_t, WebSocket, WebSocketBehavior } from "uWebSockets.js";
import { Connection, ConnectionManager, ConnectionUnavailableException } from "./connections";
import { SystemPhoneNumber } from "./rolodex";
import { RequestBehavior } from "./router";
import { AzureSpeechToText, SpeechToText, SpeechToTextProvider } from "./speech";
import { UtteranceProcessor } from "./utterance-processor";

const connectionManager = new ConnectionManager();

function getConnection(ws: WebSocket): Connection<WebSocket> {
  const conn: Connection<WebSocket>|undefined = ws['conn'];
  if (conn) return conn;
  throw new ConnectionUnavailableException(ws['id']);
}

function makeWebSocketReceiver(idHeader: string, processor: UtteranceProcessor, sttProvider: SpeechToTextProvider): WebSocketBehavior {
  const idKey = 'id';
  const receive: WebSocketBehavior = {
    idleTimeout: 32,
    maxBackpressure: 1024,
    maxPayloadLength: 512,
    // compression: DEDICATED_COMPRESSOR_3KB,

    upgrade: (res, req, context) => {
      console.log('An Http connection wants to become WebSocket, URL: ' + req.getUrl() + '!');
      const id: string = req.getHeader(idHeader);
      if (id == "") {
        res.end("400", true);
        return;
      }

      res.upgrade(
        { url: req.getUrl(), idKey: id },
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        context
      );
    },

    open: (ws) => {
      const id: SystemPhoneNumber = ws[idKey];
      console.log(`Websocket connection opened for ${id}`);
      const conn: Connection<WebSocket> = new Connection(id, ws, sttProvider.create(processor));
      ws['conn'] = conn; //TODO: make more better
      conn.transformer.listen();
    },
    message: (ws, message, isBinary) => {
      /* Ok is false if backpressure was built up, wait for drain */
      if (isBinary) {
        // let ok = ws.send(message, isBinary);
        const conn: Connection<WebSocket> = getConnection(ws);
        conn.transformer.write(message);
      } else {
        console.error("Invalid Message: %s", message);
      }
    },
    drain: (ws) => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      const conn: Connection<WebSocket> = getConnection(ws);
      conn.transformer.close();
      console.log('WebSocket closed');
    }
  }

  return receive;
}

export const event: RequestBehavior = (res, req) => {
  console.log("Event: %s", req.getParameter)
};

export const answer: RequestBehavior = (res, req) => {
  const phoneNumber = req.getQuery("to");
  const ncco = phoneNumber ? [
    {
      action: 'talk',
      text: 'Connecting you to the system'
    },
    {
      action: "connect",
      from: "The Red Queen",
      endpoint: [{
        type: "websocket",
        uri: `wss://${req.getHeader('host')}/call/voice/${phoneNumber}`,
        'content-type': "audio/l16;rate=16000",
        headers: {
          'trq-number-system': phoneNumber
        }
      }]
    }
  ] : [
    {
      action: 'talk',
      text: 'The party you are trying to reach is unavailble. Goodbye.'
    }
  ];
  res.end(JSON.stringify(ncco));
};


