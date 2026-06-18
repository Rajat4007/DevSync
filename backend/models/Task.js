const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a task description']
    },
    status: {
        type: String,
        enum: ['To-Do', 'In Progress', 'Review', 'Done'],
        default: 'To-Do' // Naya task hamesha To-Do se shuru hoga
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project', // Kis project ka task hai
        required: true
    },
    priority: {                              // ✅ yeh add karo
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Kis bande ko ye task poora karna hai
        default: null
    },
    dueDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    
});

module.exports = mongoose.model('Task', TaskSchema);