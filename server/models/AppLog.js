const mongoose = require('mongoose');

const appLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    level: {
        type: String,
        required: true,
        enum: ['ERROR', 'WARN', 'INFO', 'FATAL']
    },
    message: {
        type: String,
        required: true
    },
    stack: {
        type: String,
        default: ''
    },
    platform: {
        type: String,
        default: 'web'
    },
    userId: {
        type: String,
        default: ''
    },
    deviceInfo: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

module.exports = mongoose.model('AppLog', appLogSchema);
