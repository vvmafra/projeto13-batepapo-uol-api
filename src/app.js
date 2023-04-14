import express, { json } from "express"
import cors from "cors"
import dotenv from "dotenv"
import { MongoClient } from "mongodb"
import joi from "joi"
import dayjs from "dayjs"


// Server Creation
const app = express()

// Configs
app.use(cors())
app.use(express.json())
dotenv.config()

// DataBase Connection
const mongoClient = new MongoClient(process.env.DATABASE_URL)

try {
    await mongoClient.connect()
  } catch (err) {
    console.log(err.message)
  }
  const db = mongoClient.db();

app.post("/participants", async (req, res) => {
    const { name } = req.body

    if (!name) {
        return res.sendStatus(422)
    }

    const newUser = { name, lastStatus: Date.now() }

    try {

        const data =  await db.collection("participants").findOne({name: name})

        if (data) {
            return res.status(409).send("Participant already registered")
        } else {
            await db.collection("participants").insertOne(newUser)
            await db.collection("messages").insertOne({
                from: name, 
                to: 'Todos', 
                text: 'entra na sala...', 
                type: 'status', 
                time: dayjs(Date.now()).format("HH:mm:ss")
            })
            res.sendStatus(201)
        }
    } catch (err) { res.status(500).send(err.message) }
})


app.get("/participants", (req, res) => {
    db.collection("participants").find().toArray()
        .then(participants => res.send(participants))
        .catch(err => res.status(500).send(err.message))
})

app.post("/messages", async (req, res) => {
    const {to, text, type} = req.body 
    const { user } = req.headers

    try {
    //     const userCreated = await db.collection("participants").findOne({ user: user })
    //  if (!to || !text || type !== "message" || type !== "private_message" || !userCreated) {
    //      return res.sendStatus(422)
    // } else {
        await db.collection("messages").insertOne({
            from: user, 
            to, 
            text, 
            type, 
            time: dayjs(Date.now()).format("HH:mm:ss")
        })
        return res.sendStatus(201)
    } //}
    catch { return res.sendStatus(422) }

})

app.get("/messages", async(req, res) => {
    const { user } = req.headers
    const limit = Number(req.query.limit)

    try {
        const viewMessages = await db.collection("messages")
        .find( 
            {$or : [ {to: "Todos"}, {to: user}, {from: user}]} ).toArray()

        if (isNaN(limit) || limit <= 0) {
            return res.sendStatus(422)

        } else {
            const showMessages = viewMessages.slice(-limit).reverse()
            res.status(200).send(showMessages)

    }} catch { return res.sendStatus(422) }
})

app.post("/status", async (req, res) => {
    const { user } = req.headers

    try {
        const includeParticipant = await db
        .collection("participants").findOne({ name: user });

        if (!includeParticipant) {
            return res.sendStatus(404)
        } else {
        const chuck = await db.collection("participants").updateOne(
            { name: user }, { $set: { lastStatus: Date.now() } });  
        return res.sendStatus(200)
        }
    } catch { return res.sendStatus(422)}

})




const PORT = 5000
app.listen(PORT, () => console.log(`Using port ${PORT}`))