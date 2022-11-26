const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();


// Middle wares
app.use(cors());
app.use(express.json());




// Connecting server to mongoDB 

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v1rp4a3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// MongoDB Crud Operations

async function run() {
   
try {

}

finally {
    
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

