import { app } from './router';

const port: number = parseInt(process.env.PORT || "5000");

app.listen(port, (listenSocket) => {

  if (listenSocket) {
    console.log(`Listening to port ${port}`);
  }
  
});