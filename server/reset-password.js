const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://nik:8nXfNKk6dvXz42EC@ac-bcl2dzm-shard-00-00.2xoqsy8.mongodb.net:27017/jasa_lepas_db?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function reset() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Terhubung ke MongoDB.');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Update password rahmat@gmail.com
        const resRahmat = await User.updateOne(
            { email: 'rahmat@gmail.com' },
            { $set: { password: hashedPassword } }
        );
        console.log('Update Rahmat:', resRahmat);

        // Update password nik@gmail.com
        const resNik = await User.updateOne(
            { email: 'nik@gmail.com' },
            { $set: { password: hashedPassword } }
        );
        console.log('Update Nik:', resNik);

        await mongoose.disconnect();
        console.log('Terputus dari MongoDB.');
    } catch (err) {
        console.error(err);
    }
}

reset();