const express = require('express');
const { updateProfilePicture, updateMe } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.patch('/profile-picture', protect, updateProfilePicture);
router.patch('/me', protect, updateMe);

module.exports = router;
