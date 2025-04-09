var express = require('express');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var path = require('path');
var fs = require('fs');
var session = require('express-session');
var app = express();
app.use(express.json()); 
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:"MeanStack",
    saveUninitialized:false,
    resave:false,
}))
let b = mongoose.connect('mongodb://localhost:27017/meanstack')
let cseschema = new mongoose.Schema({
    _id:Number,
    name:{type:String,minLength:5,required:true},
    password:String, 
},{versionKey:false});

let modelcse = new mongoose.model('cse',cseschema,'cse');
app.listen(4000,()=>{
    console.log("Server is running on port `localhost:4000/home`")
})
app.get('/home',(req,res)=>{
     
    res.sendFile(path.join(__dirname,'index.html'))
})
app.post("/post",async (req,res)=>{
    var id = req.body.id;
    var name = req.body.name;
    var password = req.body.password;
    let hash = await bcrypt.hash(password,10);
    let data = {_id:id,name:name,password:hash};
    const m = new modelcse(data);
    await m.save().then(()=>{
         
        res.sendFile (path.join(__dirname,'login.html'))
    })
})
app.use((req,res,next)=>{
    res.set('Cache-Control','no-store');
    next();
})
app.post('/check',async (req,res)=>{
    const {name,password} = req.body;
    try{
        const user = await modelcse.findOne({name});
        if(!user){
            return res.status(404).send("Invalid credentials");
        }
        const passwordMatch = await bcrypt.compare(password,user.password);
        if(!passwordMatch){
            return res.status(404).send("Invalid credentials");
        }
        req.session.name = user; 
        res.sendFile(path.join(__dirname,'main.html'))
    }
    catch(err){
        res.status(500).send("Internal Server Error");
    }
})
app.post('/view',async (req,res)=>{

    if(req.session.name){
        res.send("Welcome to the Secret page of the user");
    }
    else{
        res.redirect("/login");
    }
})
app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            res.send(err);
        }
        else{
            res.clearCookie("connect.sid");
            res.send("Logged out successfully");
        }
    })
})