const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'src', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB');
  const User = require('./src/models/User');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'aniketkumar821108@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Aniket123@';

  let admin = await User.findOne({ email: adminEmail });
  
  if (!admin) {
    admin = new User({
        name: 'Aniket Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isVerified: true,
        phone: '1112223334'
    });
    await admin.save({ validateBeforeSave: false });
    console.log('✅ Admin user created successfully.');
  } else {
    admin.isVerified = true;
    admin.password = adminPassword;
    await admin.save({ validateBeforeSave: false });
    console.log('✅ Existing admin user updated and verified.');
  }
  process.exit(0);
}).catch(err => {
    console.error('❌ DB connection error:', err.message);
    process.exit(1);
});
