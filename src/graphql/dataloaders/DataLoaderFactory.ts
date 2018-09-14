import * as DataLoader from 'dataloader';
import { DataLoaders } from '../../interfaces/DataLoadersInterface';
import { DbConnection } from '../../interfaces/DbConnection.interface';
import { PostInstance } from '../../interfaces/Post.interface';
import { UserInstance } from '../../interfaces/User.interface';
import { PostLoader } from './PostLoader.';
import { UserLoader } from './UserLoader';

export class DataLoaderFactory {
  constructor(private db: DbConnection) {}

  getLoaders(): DataLoaders {
    return {
      userLoader: new DataLoader<number, UserInstance>((ids: number[]) => UserLoader.batchUsers(this.db.User, ids)),
      postLoader: new DataLoader<number, PostInstance>((ids: number[]) => PostLoader.batchPosts(this.db.Post, ids))
    };
  }
}
