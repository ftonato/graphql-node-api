import * as DataLoader from 'dataloader';
import { DataLoaderParam } from './DataLoaderParamInterface';
import { PostInstance } from './Post.interface';
import { UserInstance } from './User.interface';

export interface DataLoaders {
  userLoader: DataLoader<DataLoaderParam<number>, UserInstance>;
  postLoader: DataLoader<DataLoaderParam<number>, PostInstance>;
}
