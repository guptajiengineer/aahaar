const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  const result = await User.updateMany({}, { isApproved: true });
  console.log(`Approved ${result.modifiedCount} users!`);
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
