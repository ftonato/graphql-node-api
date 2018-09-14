import { AuthUser } from './AuthUserInterface';
import { DataLoaders } from './DataLoadersInterface';
import { DbConnection } from './DbConnection.interface';

export interface ResolverContext {
  db?: DbConnection;
  authorization?: string;
  authUser?: AuthUser;
  dataloaders?: DataLoaders;
}
