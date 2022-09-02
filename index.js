import express, { application } from 'express';
import joi from 'joi';
import cors from 'cors';
import {MongoClient, ObjectId} from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

let app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect(()=>{
    db = mongoClient.db('database');
});

app.post('/participants', async(res,req)=>{
    let name = req.body;
    console.log(name);
    const userSchema = joi.object({
    name: joi.string().min(0)
});

const validation = userSchema.validate(name, {abortEarly: true});

if(validation.error){
return res.status(422).send(validation.error.details)        
}
const objUser={
    name,
    lastStatus: Date.now()
}

try{
await db.collection('participants').insertOne(objUser);
console.log("foi")
}catch{
    console.log("deu ruim")
}

})



app.listen(5001, ()=>{
    console.log("listening port 5000");
})