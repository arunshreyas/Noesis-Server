require("dotenv").config();

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const DiscordStrategy = require("passport-discord").Strategy;
const User = require("../models/userModel");

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || "https://noesis-server-sk6o.onrender.com";

// Debug environment variables
console.log("OAuth Configuration Debug:");
console.log("SERVER_BASE_URL:", SERVER_BASE_URL);
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING");
console.log("GOOGLE_CALLBACK_URL:", process.env.GOOGLE_CALLBACK_URL);
console.log("DISCORD_CLIENT_ID:", process.env.DISCORD_CLIENT_ID ? "SET" : "MISSING");
console.log("DISCORD_CLIENT_SECRET:", process.env.DISCORD_CLIENT_SECRET ? "SET" : "MISSING");
console.log("DISCORD_REDIRECT_URI:", process.env.DISCORD_REDIRECT_URI || `${SERVER_BASE_URL}/users/auth/discord/callback`);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        process.env.GOOGLE_REDIRECT_URI ||
        `${SERVER_BASE_URL}/users/auth/google/callback`,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth profile received:", {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails,
          username: profile.username
        });
        
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value;
        let user = null;
        if (profile.id) {
          user = await User.findOne({ googleId: profile.id });
        }
        if (!user && email) {
          user = await User.findOne({ email });
        }
        if (!user) {
          const base = (
            profile.username ||
            profile.displayName ||
            (email ? email.split("@")[0] : "user")
          )
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_");
          const safeUsername = `${base}_${Math.random()
            .toString(36)
            .slice(2, 6)}`;
          user = await User.create({
            googleId: profile.id,
            email,
            username: safeUsername,
            passwordHash: "",
            name: profile.displayName,
            profile_picture:
              profile.photos && profile.photos[0] && profile.photos[0].value,
            provider: "google",
          });
        } else {
          if (!user.googleId && profile.id) {
            user.googleId = profile.id;
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        console.error("Google OAuth error:", err);
        return done(err, null);
      }
    }
  )
);
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_REDIRECT_URI,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value;
        let user = null;
        if (profile.id) {
          user = await User.findOne({ githubId: profile.id });
        }
        if (!user && email) {
          user = await User.findOne({ email });
        }
        if (!user) {
          const base = (
            profile.username ||
            profile.displayName ||
            (email ? email.split("@")[0] : "user")
          )
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_");
          const safeUsername = `${base}_${Math.random()
            .toString(36)
            .slice(2, 6)}`;

          user = await User.create({
            githubId: profile.id,
            email,
            username: safeUsername,
            passwordHash: "",
            name: profile.displayName,
            profile_picture:
              profile.photos && profile.photos[0] && profile.photos[0].value,
            provider: "github",
          });
        } else {
          if (!user.githubId && profile.id) {
            user.githubId = profile.id;
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL:
        process.env.DISCORD_REDIRECT_URI ||
        `${SERVER_BASE_URL}/users/auth/discord/callback`,
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Discord OAuth profile received:", {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          discriminator: profile.discriminator
        });
        
        const email = profile.email;
        let user = null;
        if (profile.id) {
          user = await User.findOne({ discordId: profile.id });
        }
        if (!user && email) {
          user = await User.findOne({ email });
        }
        if (!user) {
          const base = (
            profile.username || (email ? email.split("@")[0] : "user")
          )
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_");
          const safeUsername = `${base}_${Math.random()
            .toString(36)
            .slice(2, 6)}`;
          user = await User.create({
            discordId: profile.id,
            email,
            username: safeUsername,
            passwordHash: "",
            name: profile.username,
            profile_picture: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : null,
            provider: "discord",
          });
        } else {
          if (!user.discordId && profile.id) {
            user.discordId = profile.id;
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        console.error("Discord OAuth error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
