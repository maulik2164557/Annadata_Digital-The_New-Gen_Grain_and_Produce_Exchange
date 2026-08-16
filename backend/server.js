const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.get('/' , (req,res) => {
    res.send("Annadata Digital Backend is running...");
});

const PORT = process.env.PORT || 8000;

app.listen(PORT , () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
});