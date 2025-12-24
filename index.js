const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

// Middleware 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vknfgr8.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const db = client.db("smart_user");
        const productsCollection = db.collection("products");
        const bidsCollection = db.collection("bids");

        // GET products
        app.get('/products', async (req, res)=> {

            const email = req.query.email;
            const query = {};
            if (email) {
                query.email = email;
            }
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // GET products by id
        app.get('/products/:id', async (req, res)=>{
            const id = req.params.id;
            const query = { _id: new ObjectId(id)};
            const result = await productsCollection.findOne(query);
            res.send(result);
        })

        // POST product
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result);
        });

        // delete products
        app.delete('/products/:id', async (req, res)=>{
            const id = req.params.id;
            const query = { _id: new ObjectId(id)};
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })

        // Patch products
        app.patch('/products/:id', async (req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;
            const query = { _id: new ObjectId(id)};
            const update = {
                $set: {
                    name: updatedProduct.name,
                    price: updatedProduct.price,
                    category: updatedProduct.category
                }
            }
            const result = await productsCollection.updateOne(query, update);
            res.send(result);
        });

        // bids releted apis
        app.get('/bids', async (req,res)=>{

            const email = req.query.email;
            const query = {};
            if (email) {
                query.buyer_email = email;
            }

            const cursor = bidsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/bids', async(req,res)=>{
            const newBid = req.body;
            const result = await bidsCollection.insertOne(newBid);
            res.send(result);
        });

        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.error(error);
    }
}
run();

// Root Endpoint 
app.get('/', (req, res) => {
    res.send("smart deals server is running");
});

// Start the server 
app.listen(port, () => {
    console.log(`smart deals server is running on port: ${port}`);
});
