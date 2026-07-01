const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    password: {
        type: String,
        required: true
    },
    nama_lengkap: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    no_whatsapp: {
        type: String,
        required: true,
        unique: true
    },
    batas_talangan: {
        type: Number,
        default: 20000
    },
    saldo: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
