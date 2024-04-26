import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'


//IIFE
const connectDB = (async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`Mongo DB connect Succesfully !! | DB Host: ${connectionInstance.connection.host}`)


    } catch (error) {
        console.log("Mongo DB Connection failed: " + error);
        process.exit(1);
    }

})();

export default connectDB