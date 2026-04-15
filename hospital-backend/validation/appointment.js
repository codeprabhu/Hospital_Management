const Joi = require("joi");
const { idParam, datetime } = require("./common");

/*
Schema for booking appointment
*/
const bookAppointmentSchema = Joi.object({
    doctor_id: idParam,
    datetime: datetime
});

/*
Optional: Schema for deleting appointment (if you want later)
*/
const appointmentIdSchema = Joi.object({
    id: idParam
});

module.exports = {
    bookAppointmentSchema,
    appointmentIdSchema
};