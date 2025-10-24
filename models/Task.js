// backend/models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    // Assigned member info
    memberName: String,
    memberEmail: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Extra fields
    deadline: Date,
    completedAt: Date, // ✅ when member first marks "Done"
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },

    // Status + decision
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Done"],
      default: "Pending",
    },
    decision: {
      type: String,
      enum: ["Accepted", "Rejected", "Pending"], // keep "Pending" as default
      default: "Pending",
    },

    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
