import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors '

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//If doing any configuration then use app.use()
app.use(express.json({
    limit: "20kb"
}))
app.use(express.urlencoded({ extended: true, limit: "20kb" }))
app.use(express.static("public"));

//Cookie Parser
app.use(cookieParser())

export { app }
