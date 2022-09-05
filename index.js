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

const day = dayjs().format('HH:MM:SS');

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
    let objMes = {};
    const person = participants.find(usr=> usr.name===user);
    console.log(person);
    const day = dayjs().format('HH:MM:SS');
    if(person){  
        objMes = {
        to,
        text,
        type,
        from:person.name,
        time: day
    }}else{
       return res.sendStatus(422);
    }
  
const userSchema = joi.object({
    to: joi.string().min(1).required(),
    text: joi.string().min(1).required(),
    type: joi.valid('message','private_message').required(),
    from: joi.required(),
    time: joi.required()
});

const validation = userSchema.validate(objMes);
if(validation.error){
    res.status(422).send(validation.error.details)        
    }else{
        const message = db.collection('messages').insertOne(objMes);
        res.send(201);
    }
})

app.get('/messages', async(req, res)=>{
    try{
const messages = await db.collection('messages').find().toArray();
res.send(messages)
    }catch{
res.send("deu reuim");
    }
})




app.listen(5000, ()=>{
    console.log("listening port 5000");
})


   