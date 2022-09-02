import express, { application } from 'express';
import cors from 'cors';
import {MongoClient, ObjectId} from 'mongodb';
import dotenv from 'dotenv'

let app = express();
app.use(cors());
app.use(express.json());


app.listen(5000, ()=>{
    console.log("listening port 5000");
})