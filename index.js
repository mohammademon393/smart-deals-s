const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var admin = require("firebase-admin");
const port = process.env.PORT || 3000;

// ১. DNS সমস্যা সমাধানের জন্য এই দুটি লাইন যোগ করুন
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

//fireBase admin sdk
var serviceAccount = require("./smart-deals-firebase-admin-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// Middleware 
app.use(cors());
app.use(express.json());

// Logger middleware
const logger = (req, res, next) => {
    console.log('logger middleware info');
    next();
    
}
const verifyFirebaseToken = (req, res, next) => {
    console.log('on the verifyfirebase token', req.headers.authorization);
    if(!req.headers.authorization){
        //do  not allow to go next
        return res.status(401).send({message:"Unauthorized access"});
    }
    const token = req.headers.authorization.split(' ')[1]
    if (!token) {
        return res.status(401).send({message:"Unauthorized Token"});
    }

    next();
}

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
        const usersCollection = db.collection("users");


        // users related apis
        // post users
        app.post('/users', async (req, res) => {
            const newUser = req.body;

            const email = req.body.email;
            const query = { email: email };
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                res.send({message:"User already exists"});
            } else {

                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }

        });

        // GET products
        app.get('/products', async (req, res) => {

            const email = req.query.email;
            const query = {};
            if (email) {
                query.email = email;
            }
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });


        app.get('/latest-products', async(req,res)=>{
            const cursor = productsCollection.find().sort({ created_at: -1}).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        // GET products by id
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: id }; // 🔥 STRING match
            const result = await productsCollection.findOne(query);

            res.send(result);
        });


        // POST product
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result);
        });

        // delete products
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })

        // Patch products
        app.patch('/products/:id', async (req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;
            const query = { _id: new ObjectId(id) };
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

        //get all bids
        app.get('/bids', logger,verifyFirebaseToken, async (req, res) => {
            
            // console.log('headers', req.headers);
            

            const email = req.query.email;
            const query = {};
            if (email) {
                query.buyer_email = email;
            }

            const cursor = bidsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // get bids by id
        app.get('/bids/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bidsCollection.findOne(query);
            res.send(result);
        });

        // product/bids/:productId
        app.get('/product/bids/:productId', async (req, res) => {
            const productId = req.params.productId;
            const query = { product: productId };
            const cursor = bidsCollection.find(query).sort({bid_price: -1});
            const result = await cursor.toArray();
            res.send(result);
        });


        // post bids
        app.post('/bids', async (req, res) => {
            const newBid = req.body;
            const result = await bidsCollection.insertOne(newBid);
            res.send(result);
        });

        // delete bids
        app.delete('/bids/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bidsCollection.deleteOne(query);
            res.send(result);
        });

        // delete api in my bids
        app.get('/bids/:id', async (req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await bidsCollection.deleteOne(query);
            res.send(result);
        })

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
