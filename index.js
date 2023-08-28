const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('./public'))

app.get('/', (req,res)=>{
    res.json({message:"all right"})
})



app.listen(process.env.PORT, () => {
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
       .then(()=> console.log(`running on port ${process.env.PORT}`))
       .catch(error => console.error(error))
    
})