const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const MONGODB_URI = "mongodb://127.0.0.1:27017/ecommerce";

mongoose.connect(MONGODB_URI).then(async () => {
  const User = require('./backend/src/models/User');
  let admin = await User.findOne({ email: 'aniketkumar821108@gmail.com' });
  
  if (!admin) {
    admin = new User({
        name: 'Aniket Admin',
        email: 'aniketkumar821108@gmail.com',
        password: 'aniket123@',
        role: 'admin',
        isVerified: true,
        phone: '1112223334'
    });
    await admin.save({ validateBeforeSave: false });
    console.log("✅ Admin user seeded uniquely for this test.");
  } else {
    admin.isVerified = true;
    admin.password = 'aniket123@'; // Ensuring password matches user request
    await admin.save({ validateBeforeSave: false });
    console.log("✅ Existing admin user updated and verified for this test.");
  }
  process.exit(0);
}).catch(err => {
    console.error("DB connection error:", err);
    process.exit(1);
});
