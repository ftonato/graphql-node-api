import { CommentModel } from '../models/Comment.model';
import { PostModel } from '../models/Post.model';
import { UserModel } from '../models/User.model';

export interface ModelsInterface {
  Comment: CommentModel;
  Post: PostModel;
  User: UserModel;
}
