/*
//First Aproach but it is not Professional approach but it's OK

import mongoose from 'mongoose'
import { DB_NAME } from './constants';

import express from 'express';
const app = express()

    //Use IIFE foe doing connection of the database so Intialization of the database is done before other the script will execute | (function(){})();

    ; (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
            app.on("error", (error) => {
                console.log("App Error: " + error)
            })

            app.listen(process.env.PORT, () => {
                console.log("App is listining on port: " + process.env.PORT)
            })

        } catch (error) {
            console.log(error);
        }
    })();

    */

import connectDB from "./db/index.js";
// require ('dotenv').config({path: './env'});
import dotenv from 'dotenv'

dotenv.config({
    path: './env'
})


connectDB
