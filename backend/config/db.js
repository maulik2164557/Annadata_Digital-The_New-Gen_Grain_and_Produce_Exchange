const mongoose = require('mongoose');

/**
 * @description Establishes a connection to the MongoDB database using Mongoose.
 */

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch(error){
        console.log(`Error connecting to MongoDB: ${error.message}` );
        process.exit(1);
    }
};

module.exports = connectDB;