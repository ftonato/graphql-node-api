import { PostInstance } from '../../interfaces/Post.interface';
import { PostModel } from '../../models/Post.model';

export class PostLoader {
  static batchPosts(Post: PostModel, ids: number[]): Promise<PostInstance[]> {
    return Promise.resolve(
      Post.findAll({
        where: { id: { $in: ids } }
      })
    );
  }
}
