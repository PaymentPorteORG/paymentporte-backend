const express = require('express');
const router = express.Router();
const User = require('../controllers/user');
const { celebrate } = require('celebrate');
const UserSchema = require('../validations/user.validations')
const auth = require('./../middleware/authorization');

/** creates a new user */
router.post('/signUp', auth.basicAuth,
    celebrate(UserSchema.userSignUp),
    User.createNewUser
);

/** login a user */
router.post('/logIn', auth.basicAuth,
    celebrate(UserSchema.userLogIn),
    User.loginUser
);



module.exports = router;