const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is not set in environment variables');
    }

    mongoose.set('strictQuery', true);

    await mongoose.connect(mongoUri, {
        dbName: process.env.DB_NAME || undefined
    });

    console.log('MongoDB connected');
};

module.exports = {
    connectDB
};
