import { App, HttpRequest, HttpResponse } from "uWebSockets.js"
import { receive, event, answer } from "./call";

export type RequestBehavior = (res: HttpResponse, req: HttpRequest) => void;

export const app = App()
  .ws('/call/voice/:number', receive)
  .get('/call/event', event)
  .get('/call/answer', answer)
  .get('/*', (res, req) => {
    res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
  });