const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@aahaar.com' });
    if (adminExists) {
      console.log('Admin user already exists! Email: admin@aahaar.com');
      process.exit();
    }

    // Create admin user
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@aahaar.com',
      password: 'password123', // Will be hashed automatically by the pre-save hook
      role: 'admin',
      city: 'Global',
      isVerified: true,
      isApproved: true,
    });

    console.log('✅ Admin account created successfully!');
    console.log('Email: admin@aahaar.com');
    console.log('Password: password123');
    
    process.exit();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
