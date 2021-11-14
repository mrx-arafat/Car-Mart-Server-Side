const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");
app.use(cors());
app.use(express.json());
require("dotenv").config();

//connect

const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8bgmy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log(uri);
async function run() {
  try {
    await client.connect();
    const database = client.db("Car_Mart");
    const ordersCollection = database.collection("orders");

    //get api

    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.json(orders);
    });

    //post api
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);

      console.log(result);
      //sent to front-end
      res.json(result);
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
