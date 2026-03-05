import mongoose from 'mongoose';
// Define the Habit schema
const HabitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastDone: {
      type: Date,
    },
    doneDates: {
      type: [Date],
      default: [],
    },
  },
  { timestamps: true }
);

// Create the Habit model
const Habit = mongoose.model('Habit', HabitSchema);

export default Habit;
