const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  toUserId:   { type: Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    required: true,
    enum: [
      'gift_send',          // viewer → streamer (pièces débitées)
      'gift_receive',       // streamer reçoit (globos crédités)
      'coin_purchase',      // achat pièces via Stripe
      'globo_to_coin',      // conversion Globo → Pièces
      'withdrawal_request', // demande retrait Globos → cash
      'withdrawal_paid'     // retrait marqué payé par admin
    ]
  },
  coinsAmount:  { type: Number, default: 0 },  // positif = reçu, négatif = dépensé
  globosAmount: { type: Number, default: 0 },  // positif = reçu, négatif = dépensé
  giftId:   String,   // id du cadeau (gift_send / gift_receive)
  giftName: String,   // nom dénormalisé pour affichage
  roomId:   String,   // id du live room (si cadeau en live)
  stripeSessionId:  String,  // checkout.session.id (coin_purchase)
  stripePaymentId:  String,  // payment_intent.id (coin_purchase)
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'rejected'],
    default: 'completed'
  },
  note:     String,   // note admin (retrait)
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

transactionSchema.index({ fromUserId: 1, createdAt: -1 });
transactionSchema.index({ toUserId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
