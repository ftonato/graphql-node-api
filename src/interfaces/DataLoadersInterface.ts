import * as DataLoader from 'dataloader';
import { PostInstance } from './Post.interface';
import { UserInstance } from './User.interface';

export interface DataLoaders {
  userLoader: DataLoader<number, UserInstance>;
  postLoader: DataLoader<number, PostInstance>;
}
