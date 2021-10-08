import {createApp} from "./app";
import {Config, read} from "./config/config";

const config: Config = read();
const server = createApp(config);

const start = async () => {
  try {
    await server.listen(config.port, "0.0.0.0");
    server.log.info('Server started successfully');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();