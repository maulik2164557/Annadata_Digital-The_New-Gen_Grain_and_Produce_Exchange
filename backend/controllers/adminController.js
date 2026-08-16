// const User = require('../models/User');



// /\*\*

// &#x20;\* @desc    Approve or block a user account

// &#x20;\* @route   PUT /api/v1/admin/users/:id/approval

// &#x20;\* @access  Private (Admin)

// &#x20;\*/

// exports.updateUserApprovalStatus = async (req, res, next) => {

// &#x20; try {

// &#x20;   const { status } = req.body; // Approved, Blocked, Deactivated

// &#x20;   const user = await User.findById(req.params.id);



// &#x20;   if (!user) {

// &#x20;     return res.status(404).json({ success: false, message: 'User not found' });

// &#x20;   }



// &#x20;   user.status = status;

// &#x20;   await user.save();



// &#x20;   res.status(200).json({ success: true, message: `User status updated to ${status}`, data: user });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };



// /\*\*

// &#x20;\* @desc    Get all registered users for administration

// &#x20;\* @route   GET /api/v1/admin/users

// &#x20;\* @access  Private (Admin)

// &#x20;\*/

// exports.getAllUsers = async (req, res, next) => {

// &#x20; try {

// &#x20;   const users = await User.find().select('-passwordHash');

// &#x20;   res.status(200).json({ success: true, count: users.length, data: users });

// &#x20; } catch (error) {

// &#x20;   next(error);

// &#x20; }

// };

const User = require('../models/User');

exports.updateUserApprovalStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = status;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User status updated to ${status}`,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-passwordHash');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};