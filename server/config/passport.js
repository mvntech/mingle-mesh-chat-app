import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

const configurePassport = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                const { id, displayName, emails, photos } = profile;
                const email = emails[0].value;
                try {
                    let user = await User.findOne({
                        $or: [{ googleId: id }, { email }]
                    });
                    if (user) {
                        if (!user.googleId) {
                            user.googleId = id;
                            await user.save();
                        }
                        return done(null, user);
                    }
                    user = await User.create({
                        googleId: id,
                        username: displayName.toLowerCase().replace(/\s/g, ""),
                        email,
                        avatar: photos[0]?.value || "",
                    });
                    done(null, user);
                } catch (error) {
                    if (error.code === 11000) {
                        try {
                            const user = await User.findOne({ $or: [{ googleId: id }, { email }] });
                            if (user) return done(null, user);
                        } catch (error) {
                            return done(error, null);
                        }
                    }
                    done(error, null);
                }
            }
        )
    );

    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                const { id, username, emails, photos } = profile;
                const email = emails?.[0]?.value || `no-email-${id}@github.placeholder.com`;
                try {
                    let user = await User.findOne({
                        $or: [{ githubId: id }, { email }]
                    });
                    if (user) {
                        if (!user.githubId) {
                            user.githubId = id;
                            await user.save();
                        }
                        return done(null, user);
                    }
                    user = await User.create({
                        githubId: id,
                        username: username.toLowerCase(),
                        email,
                        avatar: photos[0]?.value || "https://res.cloudinary.com/dgm2hjnfx/image/upload/v1768382070/dummy-avatar_xq8or9.jpg",
                    });
                    done(null, user);
                } catch (error) {
                    if (error.code === 11000) {
                        try {
                            const user = await User.findOne({ $or: [{ githubId: id }, { email }] });
                            if (user) return done(null, user);
                        } catch (error) {
                            return done(error, null);
                        }
                    }
                    done(error, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

export default configurePassport;
