const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config({ path: './server/.env' });

async function fixUsers() {
    await mongoose.connect('mongodb://127.0.0.1:27017/jasa_lepas_db');
    const users = await User.find({ saldo: { $exists: false } });
    for (let u of users) {
        u.saldo = 0;
        await u.save();
    }
    console.log(`Fixed ${users.length} users.`);
    process.exit();
}
fixUsers();
