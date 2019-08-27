const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
let constantStatus = require("./../utils/constants");

const UserSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true, auto: true },
  email: { type: String },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  userName: { type: String },
  status: { type: Number, default: constantStatus.userStatus.ACTIVE }, // 1 -> active, 2 -> block, 3 -> deleted
  platform: { type: String },
  IsWalletCreated: { type: Boolean, default: false },
  IsLoanProvided: { type: Boolean, default: false },
  loanCount: { type: Number, default: 0 },
  loanPaidOff: { type: Boolean },
  loanProvidedTime: { type: Date },
  loanPaidOffTime: { type: Date },
  walletImported:{type: Boolean, default:false},
  address: { type: String },
  mnemonic: { type: String },
  porteTrustLine: { type: Boolean },
  loginTime: { type: Number },
  isLogin: { type: Boolean, default: true, required: true },
  createdAt: { type: Number, required: true },
  updatedAt: { type: Number, required: true }
});

let userModel = mongoose.model("User", UserSchema);
module.exports = userModel;
