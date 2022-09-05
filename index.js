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

const day = dayjs().format('HH:mm:ss');

const objLogin={
    from: name,
    to:'Todos',
    text: 'entrou na sala...', 
    type: 'status',
    time: day
}

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
    let personTo;
    const person = participants.find(usr=> usr.name===user);
    if(to !== "Todos"){
        const person1 = participants.find(usrto=>usrto.name === to);
        if(person1){
        personTo = person1.name;}
    else{res.sendStatus(400)}
    }else{
        personTo = "Todos";
    }
    
    const day = dayjs().format('HH:mm:ss');
    if(person && personTo){  
        objMes = {
        to: personTo,
        text,
        type,
        from:person.name,
        time: day
    }}else{
       return res.sendStatus(400);
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
    const {limit} = req.query;
    const {user} = req.headers;
    let mesUser = [];
    const messages = await db.collection('messages').find().toArray();
    mesUser = messages.filter((mens)=> mens.to === "Todos" || mens.to === user || mens.from === user)
    if(mesUser){
        try{
            if(limit){
            const mes = mesUser.slice(-limit);
             res.send(mes);
            }
             const mes2 = mesUser.slice(-100);
            res.send(mes2);
            }catch{
            return res.send("deu reuim");
            }
    }
})

app.post('/status', async(req, res)=> {
    const {user} = req.headers;
const us = participants.find(part=> part.name === user);
const ID = us._id;

   if(us){
      const newTi = await db.collection('participants').updateOne({_id: ID}, {$set: {"lastStatus":Date.now()}})
        return res.send(200);
    }else{
        return res.send(404);
    }
})


async function unaccessUser(){
    console.log("atualizando");
    const day = dayjs().format('HH:mm:ss');
    const dateNow = Date.now();
    const user = await db.collection('participants').find().toArray();
    const UnLog = user.filter((time)=> ((dateNow - time.lastStatus)/1000) > 10 );

    UnLog.map((usr)=>{
        db.collection('messages').insertOne({
            from: usr.name,
            to:'Todos',
            text: 'saiu da sala...', 
            type: 'status',
            time: day
        });
        db.collection('participants').deleteOne({
            name: usr.name
        });
    });
    
}

//setInterval(unaccessUser, 15000);

app.listen(5000, ()=>{
    console.log("listening port 5000");
})


   