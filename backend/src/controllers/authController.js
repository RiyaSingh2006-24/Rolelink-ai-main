const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

const buildUserPayload = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyName: user.companyName,
  companyLogoUrl: user.companyLogoUrl,
  skills: user.skills,
  education: user.education,
  experience: user.experience,
  resumeUrl: user.resumeUrl,
  phone: user.phone,
  location: user.location,
  linkedin: user.linkedin,
  github: user.github,
  portfolio: user.portfolio,
  certifications: user.certifications,
  achievements: user.achievements,
  competitions: user.competitions,
  skillsCategories: user.skillsCategories,
  createdAt: user.createdAt
});

const register = async (req, res) => {
  try {
    const { name, email, password, role, skills, education, experience, companyName, companyLogoUrl } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (!['jobseeker', 'employer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      companyName: companyName || (role === 'employer' ? name : ''),
      companyLogoUrl: companyLogoUrl || '',
      skills: Array.isArray(skills) ? skills : [],
      education: education || '',
      experience: experience || ''
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: buildUserPayload(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: buildUserPayload(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const me = async (req, res) => {
  return res.json({ user: buildUserPayload(req.user) });
};

const updateMe = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.email) {
      updates.email = updates.email.toLowerCase();
      const existing = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    if (updates.skills && typeof updates.skills === 'string') {
      updates.skills = updates.skills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select(
      '-password'
    );

    return res.json({ user: buildUserPayload(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Resume PDF file is required' });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { resumeUrl },
      { new: true, runValidators: true }
    ).select('-password');

    return res.json({ user: buildUserPayload(user), resumeUrl });
  } catch (error) {
    return res.status(500).json({ message: 'Resume upload failed', error: error.message });
  }
};

module.exports = { register, login, me, updateMe, uploadResume };
