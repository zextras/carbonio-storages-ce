import {createApp} from "./app";
import {Config, read} from "./config/config";

const start = async () => {
  const config: Config = await read();
  const server = createApp(config);
  try {
    await server.listen(config.port, "0.0.0.0");
    server.log.info('Server started successfully');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();