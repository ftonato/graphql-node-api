import { AuthUser } from './AuthUserInterface';
import { DbConnection } from './DbConnection.interface';

export interface ResolverContext {
  db?: DbConnection;
  authorization?: string;
  authUser?: AuthUser;
}
