import {createApp} from "./app";
import {Config, read} from "./config/configuration";

const start = async () => {
  const config: Config = await read();
  const server = createApp(config);
  try {
    await server.listen(config.port, config.bindAddress);
    server.log.info('Server started successfully');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();