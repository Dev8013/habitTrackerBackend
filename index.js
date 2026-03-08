import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Habit from './models/Habit.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })

}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});


app.post('/tasks',async (req, res) => {
    try {
        const {name} = req.body;
        if(!name) {
            return res.status(400).json({message: "Name is required"});
        }
        const habit = await Habit.create({name});
        res.status(201).json(habit);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

app.get('/tasks', async (req, res) => {
    try {
        const habits = await Habit.find().sort({ createdAt: 1 });
        if(!habits) {
            return res.status(404).json({message: "No Habits found"});
        }
        res.status(200).json(habits);
        
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }
})

app.delete('/tasks/:id', async (req, res) => {
    try {
        const {id} = req.params;
        if(!id) {
            return res.status(400).json({message: "Id is required"});
        }
        await Habit.findByIdAndDelete(id);
        res.status(200).json({message: "Task deleted successfully"});

    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }
})

app.post('/tasks/:id/mark', async (req, res) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findById(id);
    if (!habit) return res.status(404).json({ message: 'Task not found' });

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let streak = habit.streak || 0;
    let lastDone = habit.lastDone ? new Date(habit.lastDone) : null;

    if (lastDone) {
      const yesterday = new Date(todayDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastDoneDate = new Date(lastDone.getFullYear(), lastDone.getMonth(), lastDone.getDate());

      if (lastDoneDate.getTime() === todayDate.getTime()) {
        // already done today: no change
      } else if (lastDoneDate.getTime() === yesterday.getTime()) {
        streak += 1;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    habit.streak = streak;
    habit.lastDone = today;
    habit.doneDates.push(today);
    await habit.save();

    res.json(habit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/register', async (req, res) => {
    try {
        const {username, email, password} = req.body;
        const user = new User({username, email, password});
        await user.save();
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
        res.json({token, user: {id: user._id, username}});
    } catch (error) {
        return res.status(500).json({message: "Server error registering the user"});
    }
})

app.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user || !(await user.comparePassword(password))) {
            return res.status(400).json({message: "Invalid email or password"});
        }
        const token = jwt.sign({userId : user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
        res.json({token, user: {id: user._id, username: user.username}});
    } catch (error) {
        return res.status(500).json({message: "server login error"});
    }
})

app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        if(!users) {
            return res.status(400).json({message: "No user found"});
        }
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({message: "Internal Server Error"});
    }
})

app.get('/user/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const user = await User.findById(id);
    if(!id) {
        return res.status(400).json({message: "ID does not exits"});
    }
    res.status(200).json({message: "user found"});
    return res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({message: 'Internal Server Error'});
    }

})
