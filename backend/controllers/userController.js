// const User = require('../models/User');



// /\*\*

// &#x20;\* @desc    Get user profile by ID

// &#x20;\* @route   GET /api/v1/users/profile

// &#x20;\* @access  Private

// &#x20;\*/

// exports.getUserProfile = async (req, res, next) => {

// &#x20; try {

// &#x20;   const user = await User.findById(req.user.id);

// &#x20;   if (!user) {

// &#x20;     return res.status(404).json({ success: false, message: 'User not found' });

// &#x20;   }

// &#x20;   res.status(200).json({ success: true, data: user });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Update user profile

// &#x20;\* @route   PUT /api/v1/users/profile

// &#x20;\* @access  Private

// &#x20;\*/

// exports.updateUserProfile = async (req, res, next) => {

// &#x20; try {

// &#x20;   const fieldsToUpdate = {

// &#x20;     name: req.body.name,

// &#x20;     phone: req.body.phone,

// &#x20;     address: req.body.address,

// &#x20;   };



// &#x20;   const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {

// &#x20;     new: true,

// &#x20;     runValidators: true,

// &#x20;   });



// &#x20;   res.status(200).json({ success: true, data: user });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };

const User = require('../models/User');

exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

exports.updateUserProfile = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            phone: req.body.phone,
            address: req.body.address
        };

        const user = await User.findByIdAndUpdate(
            req.user.id,
            fieldsToUpdate,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};
