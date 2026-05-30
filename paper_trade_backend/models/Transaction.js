const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    symbol: { 
        type: String, 
        required: true 
    },
    transactionType: { 
        type: String, 
        enum: ['BUY', 'SELL'],
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true 
    },
    pricePerShare: { 
        type: Number, 
        required: true 
    },
    totalAmount: { 
        type: Number, 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);      