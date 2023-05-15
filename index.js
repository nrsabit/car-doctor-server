const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const app = express()
const port = process.env.PORT || 5000

// middlewares 
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h7lvo9z.mongodb.net/?retryWrites=true&w=majority`;

// const uri = `mongodb+srv://aaaaaaaaa:52P6MevaPpQ4LQpJ@cluster0.h7lvo9z.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// jwt verification before calling the api
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization
    const token = authorization.split(' ')[1]
    if (!token) {
        return res.status(401).send({ error: true, message: "unauthorized access" })
    }
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
            return res.status(402).send({ error: true, message: "unauthorized access" })
        } else {
            req.decoded = decoded
            next()
        }
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCollection = client.db('carDoctor').collection('services')
        const bookedServices = client.db('carDoctor').collection('booked')

        // jwt token related calls
        app.post('/jwt', (req, res) => {
            const user = req.body
            console.log(user)
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        // services related api calls
        app.get('/services', async (req, res) => {
            const result = await servicesCollection.find().toArray();
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await servicesCollection.findOne(query)
            res.send(result)
        })

        // This is the booked services collections. 
        app.post('/checkout', async (req, res) => {
            const newService = req.body
            const result = await bookedServices.insertOne(newService)
            res.send(result)
        })

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email
            if(email !== req.decoded.email){
                return res.status(403).send({error: true, message: "access denied"})
            }
            let query = {}
            email ? query = { email: email } : query = {}
            const result = await bookedServices.find(query).toArray();
            res.send(result)
        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body
            const filter = { _id: new ObjectId(id) }
            const updateService = {
                $set: {
                    status: status.status
                }
            };
            const result = await bookedServices.updateOne(filter, updateService)
            res.send(result)
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookedServices.deleteOne(query)
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