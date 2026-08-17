const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorMiddleware');

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


app.use('/upload' , express.static(path.join(__dirname, '/upload')));
app.get('/api/v1/health' , (req,res) => {
    res.status(200).json({ success: true , message: 'Annadata Digital API Server is Running'});
});

// app.get('/' , (req,res) => {
//     res.send("Annadata Digital Backend is running...");
// });

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/products', require('./routes/productRoutes'));
app.use('/api/v1/marketplace', require('./routes/marketplaceRoutes'));
app.use('/api/v1/group-buying', require('./routes/groupBuyingRoutes'));
app.use('/api/v1/orders', require('./routes/orderRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));


app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT , () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
});