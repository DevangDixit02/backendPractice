import mongoose from 'mongoose';
import { DB_Name } from '../constants.js';

const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}/${DB_Name}`
        );
        console.log(`\n connectDB: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

export default connectDB