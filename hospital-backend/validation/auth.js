const Joi = require("joi");

const registerSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("patient").required(), // 🔥 restrict
    linked_id: Joi.number().optional()
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };