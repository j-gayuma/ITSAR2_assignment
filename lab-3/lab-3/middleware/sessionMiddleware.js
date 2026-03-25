const session = require("express-session");

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "techvault-lab3",
  resave: false,
  saveUninitialized: true
});

module.exports = {
  sessionMiddleware
};
