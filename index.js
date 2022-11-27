const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();


// Middle wares
app.use(cors());
app.use(express.json());




// Connecting server to mongoDB 

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v1rp4a3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });








// MongoDb Crud Operations


async function run(){

try{

    const usersCollection = client
    .db("ResaleMart")
    .collection("users");


   // Saving User information in database
   app.post("/users", async (req, res) => {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    res.send(result);
  });





    // Loading all users to display in all users
    app.get('/users', async(req, res) => {
        const query = {};
        const users = await usersCollection.find(query).toArray();
        res.send(users)
      })
  


}

finally{

}





}

run().catch(console.log)





















// Basic server setup
app.get('/', (req, res) => {
    res.send('ResaleMart server is running successfully')
})

// Server running check on console
app.listen(port, () => {
    console.log(`Resale server is running on ${port} Port`);
    
})

