import { App, DEDICATED_COMPRESSOR_3KB, HttpRequest, HttpResponse } from "uWebSockets.js"
import { receive } from "./call";

export type RequestBehavior = (res: HttpResponse, req: HttpRequest) => void;

export const app = App()
  .ws('/call/voice/:number', receive)
  .get('/call/event')
  .get('/call/answer')
  .get('/*', (res, req) => {
    /* It does Http as well */
    res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
  });