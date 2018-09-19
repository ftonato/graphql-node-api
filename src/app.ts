import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import * as helmet from 'helmet';
import { RequestedFields } from './graphql/ast/RequestedFields';
import { DataLoaderFactory } from './graphql/dataloaders/DataLoaderFactory';
import schema from './graphql/schema';
import { extractJwtMiddleware } from './middlewares/extract-jwt.middleware';
import db from './models';

class App {
  public express: express.Application;
  private dataLoaderFactory: DataLoaderFactory;
  private requestedFields: RequestedFields;

  constructor() {
    this.express = express();
    this.init();
  }

  private init(): void {
    this.requestedFields = new RequestedFields();
    this.dataLoaderFactory = new DataLoaderFactory(db, this.requestedFields);
    this.middleware();
  }

  private middleware(): void {

    this.express.use(cors({
      origin: '*',
      methods: ['POST', 'GET'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Enconding'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));

    this.express.use(compression());

    this.express.use(helmet());

    this.express.use(
      '/graphql',

      extractJwtMiddleware(),

      (req, res, next) => {
        req['context']['db'] = db;
        req['context']['dataloaders'] = this.dataLoaderFactory.getLoaders();
        req['context']['requestedFields'] = this.requestedFields;
        next();
      },

      graphqlHTTP(req => ({
        schema,
        graphiql: process.env.NODE_ENV === 'development',
        context: req['context']
      }))
    );
  }
}

export default new App().express;
