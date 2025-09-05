const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Reorder tasks
router.put('/reorder', auth, async (req, res) => {
  try {
    const { taskId, newPosition, isGroupTask } = req.body;

    let taskToMove;
    let tasks;
    let queryFilter;

    if (isGroupTask) {
      // For group tasks, check if user is the leader
      taskToMove = await Task.findOne({ 
        _id: taskId, 
        isGroupTask: true,
        leader: req.user._id 
      });
      
      if (!taskToMove) {
        return res.status(404).json({ message: 'Group task not found or not authorized' });
      }

      queryFilter = {
        isGroupTask: true,
        leader: req.user._id
      };
    } else {
      // For personal tasks, check if user is the owner
      taskToMove = await Task.findOne({ 
        _id: taskId, 
        user: req.user._id,
        isGroupTask: { $ne: true }
      });
      
      if (!taskToMove) {
        return res.status(404).json({ message: 'Task not found' });
      }

      queryFilter = {
        user: req.user._id,
        isGroupTask: { $ne: true }
      };
    }

    // Get all tasks for this user/leader
    tasks = await Task.find(queryFilter).sort({ order: 1 });

    // Remove the task we're moving from the array for order calculation
    const otherTasks = tasks.filter(t => t._id.toString() !== taskId);

    // Calculate new order value
    let newOrder;
    if (otherTasks.length === 0) {
      newOrder = 1000; // First or only task
    } else if (newPosition === 0) {
      // Moving to start
      newOrder = otherTasks[0].order - 1000;
    } else if (newPosition >= otherTasks.length) {
      // Moving to end
      newOrder = otherTasks[otherTasks.length - 1].order + 1000;
    } else {
      // Moving between tasks
      newOrder = (otherTasks[newPosition - 1].order + otherTasks[newPosition].order) / 2;
    }

    // Update the task's order
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { order: newOrder } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Failed to update task order' });
    }

    // If order numbers are getting too large or small, normalize them
    if (Math.abs(newOrder) > 1000000) {
      const allTasks = await Task.find(queryFilter).sort({ order: 1 });

      const normalizeUpdates = allTasks.map((task, index) => ({
        updateOne: {
          filter: { _id: task._id },
          update: { $set: { order: index * 1000 } }
        }
      }));

      await Task.bulkWrite(normalizeUpdates);
    }

    res.json({ message: 'Task reordered successfully', task: updatedTask });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(400).json({ message: 'Error reordering task', error: error.message });
  }
});

// Get all tasks for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching tasks for user:', req.user._id); // Debug log
    const tasks = await Task.find({ 
      user: req.user._id,
      isGroupTask: { $ne: true } // Changed to handle undefined isGroupTask
    }).sort({ order: 1, createdAt: -1 });
    console.log('Found tasks:', tasks); // Debug log
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error); // Debug log
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Get all group tasks for the authenticated user
router.get('/group', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      isGroupTask: true,
      $or: [
        { user: req.user._id },
        { members: req.user._id },
        { leader: req.user._id }
      ]
    })
    .populate('members', 'username email')
    .populate('leader', 'username email')
    .populate('notes.author', 'username')
    .sort({ order: 1, createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group tasks', error: error.message });
  }
});

// Create a new group task
router.post('/group', auth, upload.array('attachments'), async (req, res) => {
  try {
    const { title, description, priority, status, dueDate, members } = req.body;
    
    // Handle file attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    })) : [];

    const task = new Task({
      title,
      description,
      priority,
      status,
      dueDate,
      attachments,
      user: req.user._id,
      leader: req.user._id,
      members: members ? JSON.parse(members) : [],
      isGroupTask: true
    });

    await task.save();
    
    // Populate members and leader info before sending response
    await task.populate('members', 'username email');
    await task.populate('leader', 'username email');
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Group task creation error:', error);
    res.status(400).json({ message: 'Error creating group task', error: error.message });
  }
});

// Update task members
router.put('/:taskId/members', auth, async (req, res) => {
  try {
    const { members } = req.body;
    const task = await Task.findOne({ 
      _id: req.params.taskId,
      leader: req.user._id // Only leader can update members
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    task.members = members;
    await task.save();

    // Populate members info before sending response
    await task.populate('members', 'username email');
    await task.populate('leader', 'username email');

    res.json(task);
  } catch (error) {
    console.error('Error updating task members:', error);
    res.status(500).json({ message: 'Error updating task members', error: error.message });
  }
});

// Add note to group task
router.post('/:taskId/notes', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findOne({
      _id: req.params.taskId,
      $or: [
        // Personal task - user owns it
        { user: req.user._id, isGroupTask: false },
        // Group task - user is leader, member, or owner
        { 
          isGroupTask: true,
          $or: [
            { user: req.user._id },
            { members: req.user._id },
            { leader: req.user._id }
          ]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    // Add the note
    task.notes.push({
      content,
      author: req.user._id
    });

    await task.save();

    // Populate the author info for the new note
    await task.populate('notes.author', 'username');
    
    // Only populate group-specific fields if it's a group task
    if (task.isGroupTask) {
      await task.populate('members', 'username email');
      await task.populate('leader', 'username email');
    }

    res.json(task);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Error adding note', error: error.message });
  }
});

// Delete note from task
router.delete('/:taskId/notes/:noteId', auth, async (req, res) => {
  try {
    console.log('Delete note request:', {
      taskId: req.params.taskId,
      noteId: req.params.noteId,
      userId: req.user._id
    });

    const task = await Task.findOne({
      _id: req.params.taskId,
      $or: [
        // Personal task - user owns it
        { user: req.user._id, isGroupTask: false },
        // Group task - user is leader, member, or owner
        { 
          isGroupTask: true,
          $or: [
            { user: req.user._id },
            { members: req.user._id },
            { leader: req.user._id }
          ]
        }
      ]
    });

    console.log('Found task:', task ? 'Yes' : 'No');

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    // Find the note and check if user can delete it (author or leader)
    const note = task.notes.id(req.params.noteId);
    console.log('Found note:', note ? 'Yes' : 'No');
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Only the author or leader (for group tasks) can delete the note
    const canDelete = note.author.toString() === req.user._id.toString() || 
                     (task.isGroupTask && task.leader && task.leader.toString() === req.user._id.toString());
    
    console.log('Can delete:', canDelete);
    
    if (!canDelete) {
      return res.status(403).json({ message: 'Unauthorized to delete this note' });
    }

    // Use pull to remove the note from the array
    task.notes.pull(req.params.noteId);
    await task.save();

    console.log('Note deleted successfully - v1.1');

    // Populate info before sending response
    await task.populate('notes.author', 'username');
    
    // Only populate group-specific fields if it's a group task
    if (task.isGroupTask) {
      await task.populate('members', 'username email');
      await task.populate('leader', 'username email');
    }

    res.json(task);
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
});

// Create a new task with file upload
router.post('/', auth, upload.array('attachments'), async (req, res) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;
    
    // Handle file attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    })) : [];

    // Get the highest order value for the appropriate task type
    const lastTask = await Task.findOne({ 
      user: req.user._id,
      isGroupTask: false
    }).sort({ order: -1 });
    const order = lastTask ? lastTask.order + 1000 : 0;

    const task = new Task({
      title,
      description,
      priority,
      status,
      dueDate,
      attachments,
      user: req.user._id,
      order,
      isGroupTask: false // Explicitly set for personal tasks
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
});

// Get a specific task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
});

// Update a task (supports both PATCH and PUT)
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Find the task first to check permissions
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user can update this task
    const canUpdate = 
      existingTask.user.toString() === req.user._id.toString() || // Owner of personal task
      (existingTask.isGroupTask && existingTask.leader.toString() === req.user._id.toString()); // Leader of group task

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id },
      updates,
      { new: true }
    ).populate('user', 'username')
     .populate('members', 'username')
     .populate('leader', 'username')
     .populate('notes.author', 'username');

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error: error.message });
  }
});

// Update a task with attachments
router.patch('/:id', auth, upload.array('attachments'), async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Handle new file attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype
      }));
      updates.attachments = newAttachments;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error: error.message });
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete associated files
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach(attachment => {
        try {
          fs.unlinkSync(attachment.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }

    res.json({ message: 'Task deleted successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

// Download a task attachment
router.get('/:taskId/attachments/:filename', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const attachment = task.attachments.find(a => a.filename === req.params.filename);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading attachment', error: error.message });
  }
});

// Get all tasks for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching tasks for user:', req.user._id); // Debug log
    const tasks = await Task.find({ 
      user: req.user._id,
      isGroupTask: { $ne: true } // Changed to handle undefined isGroupTask
    }).sort({ order: 1, createdAt: -1 });
    console.log('Found tasks:', tasks); // Debug log
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error); // Debug log
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get personal tasks statistics
    const personalTasks = await Task.find({ 
      user: userId,
      isGroupTask: { $ne: true }
    });
    
    // Get group tasks statistics (where user is leader or member)
    const groupTasks = await Task.find({
      isGroupTask: true,
      $or: [
        { user: userId },
        { members: userId },
        { leader: userId }
      ]
    });
    
    const allTasks = [...personalTasks, ...groupTasks];
    
    // Calculate statistics
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = allTasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = allTasks.filter(task => task.status === 'in_progress').length;
    
    // Get recent tasks (last 10)
    const recentTasks = await Task.find({
      $or: [
        { user: userId, isGroupTask: { $ne: true } },
        { isGroupTask: true, $or: [{ user: userId }, { members: userId }, { leader: userId }] }
      ]
    })
    .populate('user', 'username')
    .populate('members', 'username')
    .populate('leader', 'username')
    .sort({ updatedAt: -1 })
    .limit(10);
    
    // Get weekly task creation data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyData = await Task.aggregate([
      {
        $match: {
          $or: [
            { user: userId, isGroupTask: { $ne: true } },
            { isGroupTask: true, $or: [{ user: userId }, { members: userId }, { leader: userId }] }
          ],
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format weekly data for chart
    const taskData = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      
      const dayData = weeklyData.find(d => d._id === dateStr);
      taskData.push({
        name: dayName,
        tasks: dayData ? dayData.count : 0
      });
    }
    
    res.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        teamMembers: 0 // This would need to be calculated from group tasks
      },
      recentTasks: recentTasks.map(task => ({
        id: task._id,
        title: task.title,
        status: task.status,
        user: task.isGroupTask ? (task.leader?.username || 'Unknown') : task.user?.username || 'Unknown',
        time: getTimeAgo(task.updatedAt),
        isGroupTask: task.isGroupTask
      })),
      taskData
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
  }
});

// Helper function to get time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

module.exports = router;