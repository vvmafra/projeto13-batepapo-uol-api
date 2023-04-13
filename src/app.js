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
let db
const mongoClient = new MongoClient(process.env.DATABASE_URL)

mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))


app.post("/participants", (req, res) => {
    const { name } = req.body

    const newUser = { name, lastStatus: Date.now() }

    db.collection("participants").findOne({name: name})
        .then((data) => {
            if (data) {
            return res.status(409).send("Participant already registered") 
            } else {
                db.collection("participants").insertOne(newUser)
                    .then(() => {
                        db.collection("messages").insertOne({
                            from: name, 
                            to: 'Todos', 
                            text: 'entra na sala...', 
                            type: 'status', 
                            time: dayjs().format("HH:mm:ss")
                        })
                        res.sendStatus(201)
                    })
                    .catch((err) => console.log(err.message))
            }
        })
        .catch(err => res.status(500).send(err.message))
    
    
})






const PORT = 5000
app.listen(PORT, () => console.log(`Using port ${PORT}`))