import { Server } from 'http';

export const normalizePort = (val: number | string): number | string | boolean => {
  const port: number = typeof val === 'string' ? parseInt(val) : val;
  if (isNaN(port)) return val;
  else if (port >= 0) return port;

  return false;
};

export const onError = (server: Server) => {
  return (error: NodeJS.ErrnoException): void => {
    const port: number | string = server.address().toString();
    if (error.syscall !== 'listen') throw error;
    const bind = typeof port === 'string' ? `pipe ${port}` : `port ${port}`;
    getError(error, bind);
  };
};

export const onListening = (server: Server) => {
  return (): void => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Listening at ${bind}...`);
  };
};
function getError(error: NodeJS.ErrnoException, bind: string): void {
  const errors = {
    EACCES: `${bind} requires elevated privileges`,
    EADDRINUSE: `${bind} is already in use`
  };

  if (!!errors[error.code]) {
    console.error(errors[error.code]);
    process.exit(1);
  }

  throw error;
}
export const handleError = (error: Error) => {
  let errorMessage: string = `${error.name}: ${error.message}`;
  let env: string = process.env.NODE_ENV;
  if (env !== 'test' && env !== 'pipelines') {
    console.log(errorMessage);
  }
  return Promise.reject(new Error(errorMessage));
};

export const JWT_SECRET: string = process.env.JWT_SECRET;
