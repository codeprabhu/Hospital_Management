const Joi = require("joi");

const idParam = Joi.number().integer().required();

const datetime = Joi.string().required();

const amount = Joi.number().required();

module.exports = {
    idParam,
    datetime,
    amount
};