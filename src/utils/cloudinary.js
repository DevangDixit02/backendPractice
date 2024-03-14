import { v2 as cloudinary } from 'cloudinary';
import { response } from 'express';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUNDINARY_CLOUD_NAME,
  api_key: process.env.CLOUNDINARY_API_KEY,
  api_secret: process.env.CLOUNDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });
    console.log('File is uploaded on Cloudinary', response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
