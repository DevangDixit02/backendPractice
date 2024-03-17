import { User } from '../models/users.models.js';
import { apiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/aysncHandeler.js';
import jwt from 'jsonwebtoken';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header('Authorization')?.replace('Bearer ', '');
  console.log("unable to get token",token);

  if (!token) {
    throw new apiError(401, 'aunthorized token');
  }
  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decodedToken?._id).select(
    '-password -refreshToken'
  );

  if (!user) {
    throw new apiError(401, 'invalid token access');
  }
  req.user = user;
  next();
});
