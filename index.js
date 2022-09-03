import express from 'express';
import joi from 'joi';
import cors from 'cors';
import dayjs from 'dayjs';
import {MongoClient, ObjectId} from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

let participants;

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect(()=>{
    db = mongoClient.db('database');
});

app.post('/participants', async(req,res)=>{
    const {name} = req.body;
    const userSchema = joi.object({
        name: joi.string().min(0)
    });
    
    const validation = userSchema.validate({name}, {abortEarly: true});
    
    if(validation.error){
    return res.status(422).send(validation.error.details)        
    }


const objUser={
    name,
    lastStatus: Date.now()
}

const day = dayjs().format('HH:MM:SS')

const objLogin={
    from: name,
    to:'Todos',
    text: 'entra na sala...', 
    type: 'status',
    time: day
}
console.log(objLogin);

try{
const collectNames = await db.collection('participants').find().toArray();
const check = collectNames.find(nome=> nome.name === name);
if(!check){
    const resp = await db.collection('participants').insertOne(objUser);
    const resp2 = await db.collection('messages').insertOne(objLogin);
    return res.sendStatus(201); 
}
return res.status(409).send("cadastro já existe");

}catch{
    res.send("deu ruim");
} 
})

app.get('/participants', async(req,res)=>{
    try{
        participants = await db.collection('participants').find().toArray();
res.send(participants);
    }catch{
res.sendStatus(500);
    }
})

app.post('/messages', async(req,res)=>{
    const {to,text,type} = req.body;
    const {user} = req.headers;
    let objMes;

    const person = participants.find(usr=> usr===user);
    if(person){  
        objMes = {
        to,
        text,
        type,
        from:person
    }}
  
const userSchema = joi.object({
    to: joi.string().min(0),
    text: joi.string().min(0),
    type: joi.valid('message','private_message'),
});

const validation = userSchema.validate(objMes);
if(validation.error){
    return res.status(422).send(validation.error.details)        
    }else{
        res.send(objMes)
    }


})


app.listen(5001, ()=>{
    console.log("listening port 5000");
})


   