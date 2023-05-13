const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middlewares 
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h7lvo9z.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCollection = client.db('carDoctor').collection('services')
        const bookedServices = client.db('carDoctor').collection('booked')

        app.get('/services', async(req, res) => {
            const result = await servicesCollection.find().toArray();
            res.send(result)
        })

        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await servicesCollection.findOne(query)
            res.send(result)
        })

        // This is the booked services collections. 
        app.post('/checkout', async(req, res) => {
            const newService = req.body
            const result = await bookedServices.insertOne(newService)
            res.send(result)
        })

        app.get('/bookings', async(req, res) => {
            const email = req.query.email
            let query = {}
            email ? query = {email : email} : query = {}
            const result = await bookedServices.find(query).toArray();
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Car Doctor is Running')
})

app.listen(port, () => {
    console.log(`Car Running on Port: ${port}`)
})