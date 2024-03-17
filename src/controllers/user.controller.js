import { asyncHandler } from '../utils/aysncHandeler.js';
import { apiError } from '../utils/apiError.js';
import { User } from '../models/users.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiRes.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, 'Somwthing went wrong while genrating token');
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //Get user Detail.
  // validation-not empty
  // check if user already exist: username;email
  // check image and avatar
  // upload them cloudinary
  // create user object -create entry in db
  // remove password and refresh token field from response
  //  check for user creation
  //  send res

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

const loginUser = asyncHandler(async (req, res) => {
  // req body-> data
  //username or email
  // find user
  // password check
  // access and refresh token
  // send cookie

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new apiError(400, 'Kindly enter the email or username');
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(404, 'User doesnt exist');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, 'Invalid user credential');
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User LoggedIn Successfully'
      )
    );
});
const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User Logged Out'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, 'Unauthorized Request');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apiError(401, 'Invalid Refresh Token');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, 'Refresh token used or expired');
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          'Access Token Refreshed'
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || 'Invalid Refresh Token');
  }
});

export { registerUser, loginUser, logOutUser, refreshAccessToken };
