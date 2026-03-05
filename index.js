import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Habit from './models/Habit.js';

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
