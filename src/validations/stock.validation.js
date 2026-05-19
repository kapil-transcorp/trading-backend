const Joi = require('joi');

const watchlistSchema = Joi.object({
  stock_id: Joi.string().required()
});

module.exports = {
  watchlistSchema
};
