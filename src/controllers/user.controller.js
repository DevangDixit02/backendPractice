import { asyncHandler } from '../utils/aysncHandeler.js';
import { apiError } from '../utils/apiError.js';
import { User } from '../models/users.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiRes.js';

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  console.log('Email:', email);

  // Validate required fields
  if (
    [fullname, email, password, username].some(
      (field) => !field || field.trim() === ''
    )
  ) {
    throw new apiError(400, 'All fields are required');
  }

  // Check if user already exists
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new apiError(409, 'User with the same username or email exists');
  }

  // Get paths for avatar and cover image
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath = '';
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // Validate avatar path
  if (!avatarLocalPath) {
    throw new apiError(400, 'Avatar is required');
  }

  // Upload avatar and cover image to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : '';

  // Create user with avatar and cover image URLs
  const user = await User.create({
    fullname,
    avatar: avatar,
    coverImage: coverImage,
    email,
    password,
    username: username.toLowerCase(),
  });

  // Remove sensitive information from response
  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  // Check if user was created successfully
  if (!createdUser) {
    throw new apiError(500, 'Something went wrong while registering the user');
  }

  // Send response with status code 201
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
