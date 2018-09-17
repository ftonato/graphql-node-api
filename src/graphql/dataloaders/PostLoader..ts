import { DataLoaderParam } from '../../interfaces/DataLoaderParamInterface';
import { PostInstance } from '../../interfaces/Post.interface';
import { PostModel } from '../../models/Post.model';
import { RequestedFields } from '../ast/RequestedFields';

export class PostLoader {
  static batchPosts(Post: PostModel, params: DataLoaderParam<number>[], requestedFields: RequestedFields): Promise<PostInstance[]> {
    const ids: number[] = params.map(param => param.key);

    return Promise.resolve(
      Post.findAll({
        where: { id: { $in: ids } },
        attributes: requestedFields.getFields(params[0].info, { keep: ['id'], exclude: ['comments'] })
      })
    );
  }
}
