const User = require('../models/User');

// PATCH /api/users/profile-picture
// Body: { profilePictureUrl } - the URL Cloudinary returns after a direct,
// unsigned client-side upload (see frontend Cloudinary widget/service).
async function updateProfilePicture(req, res) {
  try {
    const { profilePictureUrl } = req.body;
    if (!profilePictureUrl) {
      return res.status(400).json({ message: 'profilePictureUrl is required.' });
    }

    // Basic sanity check that this actually came from Cloudinary.
    if (!profilePictureUrl.includes('res.cloudinary.com')) {
      return res.status(400).json({ message: 'Invalid image URL.' });
    }

    req.user.profilePictureUrl = profilePictureUrl;
    await req.user.save();

    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile picture.', error: err.message });
  }
}

// PATCH /api/users/me
// Body: any subset of { bio } for now - a general profile-update endpoint,
// extendable later for other self-editable fields.
async function updateMe(req, res) {
  try {
    const { bio } = req.body;
    if (typeof bio === 'string') {
      req.user.bio = bio;
    }
    await req.user.save();
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile.', error: err.message });
  }
}

module.exports = { updateProfilePicture, updateMe };
