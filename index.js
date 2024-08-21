const express = require('express')
const cors = require('cors');
const jwt=require('jsonwebtoken')
const cookieParser=require("cookie-parser")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000
//middle ware
app.use(cors({
  origin:['http://localhost:5173'],
  credentials: true
}));
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bdqfb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const serviceCollection=client.db('car-doctor').collection('services');
    const orderCollection=client.db('car-doctor').collection('orders')
    //service related api
    app.post('/jwt',async(req, res)=>{
      const user=req.body;
      console.log('user for token', user);
      const token=jwt.sign(user, process.env.JWT_TOKEN, {expiresIn: '1h'})
      res.cookie(
        'token',token,{
          httpOnly:true,
          secure:false,// as http://localhost:5173
          sameSite:'none'
        }
      ).send({success:true})
    })
    // app.post('/jwt', async(req, res)=>{
    //   const user=req.body;
    //   console.log(user);
    //   const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
    //   res
    //   .cookie('token', token,{
    //     httpOnly: true,
    //     secure:false, // http://localhost:5173/login,
    //     sameSite: "none"
    //   })
    //   .send({success:true});
    // })

    app.post('/logout', async(req, res)=>{
      const user=req.body;
      console.log('logging out from server', user)
      res.cookie('token', {maxAge:0}).send({success:true})
    })
    
    //auth related api
    app.get('/services',async(req, res)=>{
      const cursor=serviceCollection.find();
      const result=await cursor.toArray();
      res.send(result);
    })
    
    app.get(`/service/:id`,async(req, res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const result=await serviceCollection.findOne(query);
      res.send(result);
    })

    app.get('/bookings', async(req, res)=>{
      console.log('tok tok token', req.cookies?.token)
      let query={};
      if (req.query?.email) {
        query={email: req.query.email}
      }
      const cursor=orderCollection.find(query);
      const result=await cursor.toArray();
      res.send(result);
    })

    app.post('/bookings', async(req, res)=>{
      const booking=req.body;
      console.log(booking);
      const result=await orderCollection.insertOne(booking);
      res.send(result);
    })

    app.delete('/booking/:id', async(req, res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const result=await orderCollection.deleteOne(query);
      res.send(result);
    })

    app.put('/booking/:id', async(req, res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const options={upsert:true};
      const update={
        $set:{
          date: req.body.newDate
        }
      }
      const result=await orderCollection.updateOne(query, update, options)
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Doctor is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})