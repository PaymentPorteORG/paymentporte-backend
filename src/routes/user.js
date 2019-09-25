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

/** logout a user */
router.post('/logOut', auth.basicAuth, auth.userAuth,
    // celebrate(UserSchema.userLogOut),
    User.logOutUser
);

/** change a user's password */
router.post('/changePassword', auth.basicAuth, auth.userAuth,
    celebrate(UserSchema.changePassword),
    User.changePassword
);

/** forgot password */
router.post('/forgotPassword', auth.basicAuth,
    celebrate(UserSchema.forgotPassword),
    User.forgotPassword
);

/** reset password */
router.post('/resetPassword', auth.basicAuth,
    celebrate(UserSchema.resetPassword),
    User.resetPassword
);

/** reset password */
router.post('/contactUs', auth.basicAuth, auth.userAuth,
    celebrate(UserSchema.contactUs),
    User.contactUs
);


module.exports = router;