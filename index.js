const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const admin = require("firebase-admin");
const cors = require("cors");
app.use(cors());
app.use(express.json());
require("dotenv").config();

//car-mart-firebase-admin-sdk

const serviceAccount = require("./car-mart-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//connect

const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8bgmy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//verify token

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

// console.log(uri);
async function run() {
  try {
    await client.connect();
    const database = client.db("Car_Mart");
    const ordersCollection = database.collection("orders");
    const usersCollection = database.collection("users");
    const servicesCollection = database.collection("services");
    const reviewsCollection = database.collection("reviews");

    //review api

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.json(result);
    });
    app.get("/reviews", async (req, res) => {
      const cursor = reviewsCollection.find({});
      const review = await cursor.toArray();
      res.json(review);
    });

    //get api

    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.json(orders);
    });

    app.get("/services", async (req, res) => {
      const cursor = servicesCollection.find({});
      const services = await cursor.toArray();
      res.json(services);
    });

    //post api for create orders
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);

      console.log(result);
      //sent to front-end
      res.json(result);
    });
    //post api for create users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };

      const options = { upsert: true };
      const updateDoc = { $set: user };

      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
    //make admin

    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "Get Lost Bro You Don't Have This Access" });
      }
    });

    //get specific user to verify admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const user = await usersCollection.findOne(query);

      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello cmart!");
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});
