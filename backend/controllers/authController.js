// const User = require('../models/User');

// const bcrypt = require('bcryptjs');

// const jwt = require('jsonwebtoken');



// // Helper function to generate JWT token

// const generateToken = (id) => {

// &#x20; return jwt.sign({ id }, process.env.JWT\_SECRET, {

// &#x20;   expiresIn: process.env.JWT\_EXPIRE || '30d',

// &#x20; });

// };



// /\*\*

// &#x20;\* @desc    Register a new user (Farmer, Consumer, Admin)

// &#x20;\* @route   POST /api/v1/auth/register

// &#x20;\* @access  Public

// &#x20;\*/

// exports.registerUser = async (req, res, next) => {

// &#x20; try {

// &#x20;   const { name, email, phone, password, address, role } = req.body;



// &#x20;   // Check if user already exists

// &#x20;   const userExists = await User.findOne({ email });

// &#x20;   if (userExists) {

// &#x20;     return res.status(400).json({ success: false, message: 'User already exists with this email' });

// &#x20;   }



// &#x20;   // Hash password

// &#x20;   const salt = await bcrypt.genSalt(10);

// &#x20;   const passwordHash = await bcrypt.hash(password, salt);



// &#x20;   // Set initial status based on role

// &#x20;   // Farmers require Admin approval; Consumers \& Admins can be approved immediately

// &#x20;   const status = role === 'Farmer' ? 'Pending Approval' : 'Approved';



// &#x20;   const user = await User.create({

// &#x20;     name,

// &#x20;     email,

// &#x20;     phone,

// &#x20;     passwordHash,

// &#x20;     address,

// &#x20;     role,

// &#x20;     status,

// &#x20;   });



// &#x20;   const token = generateToken(user.\_id);



// &#x20;   res.status(201).json({

// &#x20;     success: true,

// &#x20;     token,

// &#x20;     user: {

// &#x20;       id: user.\_id,

// &#x20;       name: user.name,

// &#x20;       email: user.email,

// &#x20;       role: user.role,

// &#x20;       status: user.status,

// &#x20;     },

// &#x20;   });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Login user \& return JWT token

// &#x20;\* @route   POST /api/v1/auth/login

// &#x20;\* @access  Public

// &#x20;\*/

// exports.loginUser = async (req, res, next) => {

// &#x20; try {

// &#x20;   const { email, password } = req.body;



// &#x20;   if (!email || !password) {

// &#x20;     return res.status(400).json({ success: false, message: 'Please provide email and password' });

// &#x20;   }



// &#x20;   // Find user and explicitly include passwordHash

// &#x20;   const user = await User.findOne({ email }).select('+passwordHash');

// &#x20;   if (!user) {

// &#x20;     return res.status(401).json({ success: false, message: 'Invalid email or password' });

// &#x20;   }



// &#x20;   // Check password

// &#x20;   const isMatch = await bcrypt.compare(password, user.passwordHash);

// &#x20;   if (!isMatch) {

// &#x20;     return res.status(401).json({ success: false, message: 'Invalid email or password' });

// &#x20;   }



// &#x20;   // Check account status

// &#x20;   if (user.status === 'Blocked' || user.status === 'Deactivated') {

// &#x20;     return res.status(403).json({ success: false, message: `Account is currently ${user.status.toLowerCase()}` });

// &#x20;   }



// &#x20;   const token = generateToken(user.\_id);



// &#x20;   res.status(200).json({

// &#x20;     success: true,

// &#x20;     token,

// &#x20;     user: {

// &#x20;       id: user.\_id,

// &#x20;       name: user.name,

// &#x20;       email: user.email,

// &#x20;       role: user.role,

// &#x20;       status: user.status,

// &#x20;     },

// &#x20;   });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Get currently logged in user profile

// &#x20;\* @route   GET /api/v1/auth/me

// &#x20;\* @access  Private

// &#x20;\*/

// exports.getMe = async (req, res, next) => {

// &#x20; try {

// &#x20;   const user = await User.findById(req.user.id);

// &#x20;   res.status(200).json({ success: true, data: user });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || '30d'
        }
    );
};

exports.registerUser = async (req, res, next) => {
    try {
        const { name, email, phone, password, address, role } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const status = role === 'Farmer'
            ? 'Pending Approval'
            : 'Approved';

        const user = await User.create({
            name,
            email,
            phone,
            passwordHash,
            address,
            role,
            status
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+passwordHash');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (user.status === 'Blocked' || user.status === 'Deactivated') {
            return res.status(403).json({
                success: false,
                message: `Account is currently ${user.status.toLowerCase()}`
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};