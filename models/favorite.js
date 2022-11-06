const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const favoriteSchema = new Schema({
  user: {
////////// NOTE: On line 2, you took the trouble to create a "Schema" constant to stand in for "mongoose.Schema".
// So, you could do this...
// OLD CODE:    type: mongoose.Schema.Types.ObjectId,
      type: Schema.Types.ObjectId,
////////// END NOTE
      ref: 'User'
  },
  campsites: [{
////////// NOTE: Same here...
// OLD CODE:    type: mongoose.Schema.Types.ObjectId,
type: Schema.Types.ObjectId,
////////// END NOTE
      ref: 'Campsite'
  }],
},
{
  timestamps: true,
}
);

////////// NOTE: You can condense code by combing the "model" method and export lines. It would look like this:
module.exports = mongoose.model("Favorite", favoriteSchema); 

