import { NextFunction, Request, RequestHandler, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserInstance } from '../interfaces/User.interface';
import { JWT_SECRET } from '../utils/utils';
import db from './../models';

export const extractJwtMiddleware = (): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authorization: string = req.get('authorization');
    const token: string = authorization ? authorization.split(' ')[1] : undefined;

    req['context'] = {};
    req['context']['authorization'] = authorization;

    if (!token) {
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) {
        return next();
      }

      db.User.findById(decoded.sub, {
        attributes: ['id', 'email']
      }).then((user: UserInstance) => {
        if (user) {
          req['context']['authUser'] = {
            id: user.get('id'),
            email: user.get('email')
          };
        }

        return next();
      });
    });
  };
};
