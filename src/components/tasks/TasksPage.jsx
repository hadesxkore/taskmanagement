import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import TaskCard from './TaskCard';
import FilePreview from './FilePreview';
import { API_ENDPOINTS } from '../../config/api';
import GroupTasksPage from './GroupTasksPage';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    attachments: []
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start dragging after moving 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.TASKS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      console.log('Fetched personal tasks:', data); // Debug log
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error fetching tasks');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Append task data
      Object.keys(newTask).forEach(key => {
        if (key !== 'attachments') {
          formData.append(key, newTask[key]);
        }
      });
      formData.append('isGroupTask', 'false');

      // Append files
      newTask.attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch(API_ENDPOINTS.TASKS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setTasks([...tasks, data]);
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          status: 'pending',
          dueDate: '',
          attachments: []
        });
        setIsCreateDialogOpen(false);
        toast.success('Task created successfully!');
      } else {
        toast.error(data.message || 'Failed to create task');
      }
    } catch (error) {
      toast.error('Error creating task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setTasks(tasks.map(task =>
          task._id === taskId ? { ...task, status: newStatus } : task
        ));
        toast.success('Task status updated!');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update task status');
      }
    } catch (error) {
      toast.error('Error updating task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTasks(tasks.filter(task => task._id !== taskId));
        toast.success('Task deleted successfully!');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete task');
      }
    } catch (error) {
      toast.error('Error deleting task');
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${editingTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          status: editingTask.status,
          dueDate: editingTask.dueDate
        })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        ));
        setIsEditDialogOpen(false);
        setEditingTask(null);
        toast.success('Task updated successfully!');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update task');
      }
    } catch (error) {
      toast.error('Error updating task');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id && over) {
      try {
        const oldIndex = tasks.findIndex(item => item._id === active.id);
        const newIndex = tasks.findIndex(item => item._id === over.id);
        
        if (oldIndex === -1 || newIndex === -1) {
          console.error('Invalid task indices:', { oldIndex, newIndex, activeId: active.id, overId: over.id });
          return;
        }

        // Calculate the actual new position after removing the dragged item
        const adjustedNewIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
        
        // Optimistically update the UI
        setTasks(items => arrayMove(items, oldIndex, newIndex));

        const token = localStorage.getItem('token');
        const response = await fetch(API_ENDPOINTS.REORDER, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            taskId: active.id,
            newPosition: adjustedNewIndex
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to save task order');
        }

        // Refetch tasks to ensure correct order
        await fetchTasks();
      } catch (error) {
        console.error('Reorder error:', error);
        toast.error('Error saving task order. Please try again.');
        // Restore the original order
        fetchTasks();
      }
    }
  };

  return (
    <div className="p-8">
      <Tabs defaultValue="personal" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="personal" className="relative">
              Personal Tasks
            </TabsTrigger>
            <TabsTrigger value="group" className="relative">
              Group Tasks
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Personal Tasks</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-5 w-5" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={(e) => setNewTask({
                    ...newTask,
                    attachments: Array.from(e.target.files)
                  })}
                />
              </div>

              <Button type="submit" className="w-full">
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tasks.map(task => task._id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
                              <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDeleteTask={handleDeleteTask}
                  onFileClick={(file, taskId) => {
                    setSelectedFile(file);
                    setSelectedTaskId(taskId);
                  }}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setIsEditDialogOpen(true);
                  }}
                />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {selectedFile && selectedTaskId && (
        <FilePreview
          file={selectedFile}
          taskId={selectedTaskId}
          onClose={() => {
            setSelectedFile(null);
            setSelectedTaskId(null);
          }}
        />
      )}
        </TabsContent>

        <TabsContent value="group">
          <GroupTasksPage />
        </TabsContent>
      </Tabs>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editingTask?.title || ''}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editingTask?.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={editingTask?.priority || 'medium'}
                onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editingTask?.status || 'pending'}
                onValueChange={(value) => setEditingTask({ ...editingTask, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={editingTask?.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingTask(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;