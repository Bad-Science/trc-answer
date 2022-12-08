import { exit } from 'process';
import { app } from './router';

const port: number = parseInt(process.env.PORT || "5000");

app.listen(port, (listening) => {
  if (listening) {
    console.log(`Listening to port ${port}`);
  } else {
    console.error(`Failed to listen to port ${port}`);
    exit(1);
  }
});