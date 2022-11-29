const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// Middle wares
app.use(cors());
app.use(express.json());

// Connecting server to mongoDB

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v1rp4a3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Verifying Jwt token
function verifyJWT(req, res, next) {
  console.log("token inside verify token", req.headers.authorization);

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

// MongoDb Crud Operations
async function run() {
  try {
    const usersCollection = client.db("ResaleZone").collection("users");
    const categoriesCollection = client
      .db("ResaleZone")
      .collection("laptopCategories");

    const productsCollection = client.db("ResaleZone").collection("products");

    const bookedProductsCollection = client
      .db("ResaleZone")
      .collection("bookedProducts");

    // sending jwt token to client side while login/signup
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }

      res.status(403).send({ accessToken: "" });
    });

    // Saving User information in database
    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = {
        email: user.email,
      };
      const existedUser = await usersCollection.find(query).toArray();

      if (existedUser.length) {
        const message = `User ${user.name} is Already Registered`;
        return res.send({ acknowledged: false, message });
      }
      const result = await usersCollection.insertOne(user);
      return res.send(result);
    });



    // Loading all users to display in all users
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });






    // Loading all category name to display
    app.get("/categories", async (req, res) => {
      const query = {};
      const users = await categoriesCollection.find(query).toArray();
      res.send(users);
    });




    // Loading category wise product using id
    app.get("/categoryProducts", async (req, res) => {
      let query = {};
      if (req.query.id) {
        query = {
          categoryId: req.query.id,
        };
      }
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });



    //Sending BookedProducts to database
    app.post("/bookedProducts", async (req, res) => {
      const bookingProduct = req.body;
      const product = await bookedProductsCollection.insertOne(bookingProduct);
      res.send(product);
    });


    //Sending BookedProducts to database
    // app.post("/bookedProducts", async (req, res) => {
    //   const bookingProduct = req.body;
      
    //   const query = {
    //     buyerEmail : bookingProduct.buyerEmail,
    //   }
    //   const alreadyBooked = await bookedProductsCollection.find(query).toArray;

    //   if(alreadyBooked){
    //     const message = `You have already booked this ${bookingProduct.productName}`;
    //     return res.send({ acknowledged: false, message })
    //   }

    //   const product = await bookedProductsCollection.insertOne(bookingProduct);
    //   res.send(product);
    // });





// checking user role
app.get('/users/type/:email', async(req, res) => {
  const email = req.params.email;
  const query = {email}
  const user = await usersCollection.findOne(query);
  res.send({userType: user?.userType})
})


// Loading my orders for buyer
app.get('/myOrders', async(req, res) => {
  let query = {};

      if (req.query.email) {
        query = {
          buyerEmail: req.query.email,
        };
      }
      const cursor = bookedProductsCollection.find(query);
      const products = await cursor.toArray();
  res.send(products)
})



// adding a product to the database
app.post('/products', async(req, res) => {
  const product = req.body;
  console.log(product);
  
  const result = await productsCollection.insertOne(product);
  res.send(result)
})



  } finally {
  }
}

run().catch(console.log);

// Basic server setup
app.get("/", (req, res) => {
  res.send("ResaleMart server is running successfully");
});

// Server running check on console
app.listen(port, () => {
  console.log(`Resale server is running on ${port} Port`);
});
