const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
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

    // Verify admin has to run after verify jwt
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.userType !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // Verify admin has to run after verify jwt
    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.userType !== "seller") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };



   // sending jwt token to client side while login/signup
   app.post("/jwt", async (req, res) => {
    const currentUser = req.body;
    const email = currentUser?.email;
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      return res.send({ accessToken: token });
    })













    // // sending jwt token to client side while login/signup
    // app.post("/jwt", async (req, res) => {
    //   const currentUser = req.body;
    //   const email = currentUser?.email;
    //   const query = { email: email };
    //   const user = await usersCollection.findOne(query);

    //   if (user) {
    //     const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
    //       expiresIn: "1d",
    //     });
    //     return res.send({ accessToken: token });
    //   }

    //   res.status(403).send({ accessToken: "" });
    // });








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

 

    // checking user role
    app.get("/users/type/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ userType: user?.userType });
    });



    // Loading my orders for buyer
    app.get("/myOrders", verifyJWT, async (req, res) => {
      const email = req.query.email;

      query = {
        buyerEmail: email,
      };

      const cursor = bookedProductsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // adding a product to the database
    app.post("/products", verifyJWT, verifySeller, async (req, res) => {
      const product = req.body;
      console.log(product);

      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // Loading product of a seller
    app.get("/myProducts", async (req, res) => {
      const email = req.query.email;
      query = {
        sellerEmail: email,
      };

      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    //Advertise one  product
    app.put("/products/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          isAdvertised: true,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });

    // Deleting one product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
      res.send(result);
    });

    // Loading advertise product to homepage
    app.get("/advertisedProducts", async (req, res) => {
      const query = {
        isAdvertised: true,
      };
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // Loading all buyers from database
    app.get("/users/buyers", verifyJWT, async (req, res) => {
      const query = {
        userType: "buyer",
      };
      const cursor = usersCollection.find(query);
      const buyers = await cursor.toArray();
      res.send(buyers);
    });

    // Loading all sellers from database
    app.get("/users/sellers", verifyJWT, async (req, res) => {
      const query = {
        userType: "seller",
      };
      const cursor = usersCollection.find(query);
      const sellers = await cursor.toArray();
      res.send(sellers);
    });



    // Deleting A buyer form database
    app.delete("/users/buyer/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });



    // Deleting A seller form database
    app.delete(
      "/users/seller/:id",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await usersCollection.deleteOne(filter);
        res.send(result);
      }
    );



    // Verify a seller
    app.put("/users/seller/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          isSellerVerified: true,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });



    //Report a product
    app.put("/products/report/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          isReported: true,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });



    // Loading all reported products for admin
    app.get("/products/reported", async (req, res) => {
      const query = {
        isReported: true,
      };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });


    // Checking if a user is admin or not
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.userType === "admin" });
    });


    // Checking if a user is seller or not
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.userType === "seller" });
    });


  // checking if a user is buyer or not
    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.userType === "buyer" });
    });


  } 
  finally {

  }
}

run().catch(console.log);

// Basic server setup
app.get("/", (req, res) => {
  res.send("ResaleZone server is running successfully");
});

// Server running check on console
app.listen(port, () => {
  console.log(`Resale server is running on ${port} Port`);
});
