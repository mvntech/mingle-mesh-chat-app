import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 20,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
        },
        password: {
            type: String,
            required: false,
            minlength: 6,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        githubId: {
            type: String,
            unique: true,
            sparse: true,
        },
        avatar: {
            type: String,
            default: "",
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        favorites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Chat",
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

userSchema.pre("save", async function (next) {
    if (!this.password || !this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
    const obj = this.toObject({ virtuals: true });
    delete obj.password;
    return obj;
};

const User = mongoose.model("User", userSchema);

export default User;