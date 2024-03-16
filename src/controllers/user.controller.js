import { asyncHandler } from '../utils/aysncHandeler.js';
import { apiError } from '../utils/apiError.js';
import { User } from '../models/users.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiRes.js';

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  console.log('Email:', email);

  if (
    [fullname, email, password, username].some((field) => field?.trim() === '')
  ) {
    throw new apiError(400, 'All fields are required');
  }
  const existedUser = User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new apiError(409, 'User with same username or email exist');
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw apiError(400, 'Avatar is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw apiError(400, 'Avatar is required');
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  if (!createdUser) {
    throw new apiError(500, 'Something went wrong while registering user');
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, 'User Registered Successfully'));
});

export { registerUser };

//Get user Detail.
// validation-not empty
// check if user already exist: username;email
// check image and avatar
// upload them cloudinary
// create user object -create entry in db
// remove password and refresh token field from response
//  check for user creation
//  send res
