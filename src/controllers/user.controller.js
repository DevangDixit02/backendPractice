import { asyncHandler } from '../utils/aysncHandeler.js';

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: 'Chai Aur Code',
  });
});

export { registerUser };