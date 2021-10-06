import {createApp} from "./app";
import {Config, read} from "./config/config";

const config: Config = read();
const server = createApp(config);

const start = async () => {
  try {
    await server.listen(config.port);
    console.log('Server started successfully');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();