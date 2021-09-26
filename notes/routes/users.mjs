import path from 'path';
import util from 'util';
import { default as express } from 'express';
import { default as passport } from 'passport'; 
import { default as passportLocal } from 'passport-local';
const LocalStrategy = passportLocal.Strategy; 
// const Auth0Strategy = require("passport-auth0");
import { default as Auth0Strategy } from 'passport-auth0';

import passportTwitter from 'passport-twitter';
const TwitterStrategy = passportTwitter.Strategy;
import * as usersModel from '../models/users-superagent.mjs';
import { sessionCookieName } from '../app.mjs';

export const router = express.Router();

import DBG from 'debug';
const debug = DBG('notes:router-users');
const error = DBG('notes:error-users');

export function initPassport(app) {
  try {
    const strategy = new Auth0Strategy(
      {
        domain: process.env.AUTH0_DOMAIN,
        clientID: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        callbackURL: process.env.AUTH0_CALLBACK_URL
      },
      function(accessToken, refreshToken, extraParams, profile, done) {
  
        /**
         * Access tokens are used to authorize users to an API
         * (resource server)
         * accessToken is the token to call the Auth0 API
         * or a secured third-party API
         * extraParams.id_token has the JSON Web Token
         * profile has all the information from the user
         */
      //    var info = {
      //     "profile": profile,
      //     "accessToken": accessToken,
      //     "refreshToken": refreshToken,
      //     "extraParams": extraParams
      // };
        console.log({profile})
      
        return done(null, profile);
      }
    );
    passport.use(strategy)
    twitterLogin=true
  } catch(err) {
      twitterLogin = false;
      console.log({err})
  }
 
    app.use(passport.initialize());
    app.use(passport.session()); 
}

export function ensureAuthenticated(req, res, next) {
    try {
      // req.user is set by Passport in the deserialize function
      if (req.user) next();
      else res.redirect('/users/login');
    } catch (e) { next(e); }
}

router.get('/login', function(req, res, next) {
    try {
      res.render('login', { title: "Login to Notes", user: req.user, });
    } catch (e) { next(e); }
});

router.post('/login',
    passport.authenticate('local', {
      successRedirect: '/', // SUCCESS: Go to home page
      failureRedirect: 'login', // FAIL: Go to /user/login
    })
);

router.get('/logout', function(req, res, next) {
    try {
      req.session.destroy();
      req.logout();
      res.clearCookie(sessionCookieName);
      res.redirect('/');
    } catch (e) { next(e); }
});

passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        var check = await usersModel.userPasswordCheck(username,
        password);
        if (check.check) {
          done(null, { id: check.username, username: check.username });
          console.log({ id: check.username, username: check.username })
        } else {
          done(null, false, check.message);
        }
      } catch (e) { done(e); }
    }
));

passport.serializeUser(function(user, done) {
    try {
      const profile=user;
      usersModel.findOrCreate({
        id: profile.id, username: profile.id, password: "",
        provider: profile.provider, familyName: "",
        givenName: "", middleName: "",
      
      })
      done(null, user.id);
    } catch (e) { done(e); }
});

passport.deserializeUser(async (username, done) => {
    try {
      let user = await usersModel.find(username);
      done(null, user);
    } catch(e) { done(e); }
});

const twittercallback = process.env.TWITTER_CALLBACK_HOST
    ? process.env.TWITTER_CALLBACK_HOST
    : "http://localhost:3000";
    export var twitterLogin;




router.get('/auth/twitter', passport.authenticate('twitter')); 

router.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { successRedirect: '/', 
                       failureRedirect: '/users/login' }));

