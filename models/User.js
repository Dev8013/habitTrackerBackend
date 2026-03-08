import mongoose from "mongoose";
import bcrpyt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        username: {type: String, required: true, unique: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
    }
);

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) {
        return next();
    }
    // Add password hashing logic here
    this.password = await bcrpyt.hash(this.password, 12);
    next();
})

userSchema.methods.comparePassword = async function (password) {
    return bcrpyt.compare(password, this.password);
    
}

export default mongoose.model('User', userSchema);