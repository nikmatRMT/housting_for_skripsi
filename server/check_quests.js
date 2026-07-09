const mongoose = require('mongoose');

const mongoUri = "mongodb://nik:8nXfNKk6dvXz42EC@ac-bcl2dzm-shard-00-00.2xoqsy8.mongodb.net:27017/jasa_lepas_db?ssl=true&authSource=admin&retryWrites=true&w=majority";

const questSchema = new mongoose.Schema({
    deskripsi: String,
    status: String,
    lokasi: {
        type: { type: String },
        coordinates: [Number]
    },
    pembuat_id: mongoose.Schema.Types.ObjectId,
    pekerja_id: mongoose.Schema.Types.ObjectId,
    created_at: Date
});

const Quest = mongoose.model('Quest', questSchema);

async function check() {
    try {
        await mongoose.connect(mongoUri);
        console.log("Connected!");
        
        const allQuests = await Quest.find().sort({ created_at: -1 }).limit(5);
        console.log(`Total quests in DB: ${await Quest.countDocuments()}`);
        
        allQuests.forEach(q => {
            console.log(`ID: ${q._id}`);
            console.log(`Desc: ${q.deskripsi}`);
            console.log(`Status: ${q.status}`);
            console.log(`Coord: [lng, lat] = [${q.lokasi?.coordinates[0]}, ${q.lokasi?.coordinates[1]}]`);
            console.log(`Created At: ${q.created_at}`);
            console.log(`Pembuat: ${q.pembuat_id}`);
            console.log("---");
        });
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

check();
