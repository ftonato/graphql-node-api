import { UserInstance } from '../../interfaces/User.interface';
import { UserModel } from '../../models/User.model';

export class UserLoader {
  static batchUsers(User: UserModel, ids: number[]): Promise<UserInstance[]> {
    return Promise.resolve(
      User.findAll({
        where: { id: { $in: ids } }
      })
    );
  }
}
