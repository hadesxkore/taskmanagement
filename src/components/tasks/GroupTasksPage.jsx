import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { PlusCircle, Check, ChevronsUpDown, X, Users, Search } from 'lucide-react';
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
import TaskCard from './TaskCard';

const GroupTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [managingTask, setManagingTask] = useState(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUsersOpen, setIsUsersOpen] = useState(false);

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

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    members: [],
    attachments: []
  });

  useEffect(() => {
    fetchGroupTasks();
    fetchUsers();
  }, []);

  const fetchGroupTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks/group', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTasks(data);
      } else {
        toast.error(data.message || 'Failed to fetch group tasks');
      }
    } catch (error) {
      toast.error('Error fetching group tasks');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (error) {
      toast.error('Error fetching users');
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
        // Refetch tasks to ensure proper order and data consistency
        await fetchGroupTasks();
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
        // Refetch tasks to ensure proper order and data consistency
        await fetchGroupTasks();
        toast.success('Task deleted successfully!');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete task');
      }
    } catch (error) {
      toast.error('Error deleting task');
    }
  };

  const handleManageMembers = async (task) => {
    setManagingTask(task);
    setSelectedMembers(task.members || []);
    setIsMembersDialogOpen(true);
  };

  const handleUpdateMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${managingTask._id}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          members: selectedMembers.map(member => member._id)
        })
      });

      if (response.ok) {
        // Refetch tasks to ensure proper order and data consistency
        await fetchGroupTasks();
        setIsMembersDialogOpen(false);
        setManagingTask(null);
        setSelectedMembers([]);
        toast.success('Team members updated successfully!');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update team members');
      }
    } catch (error) {
      toast.error('Error updating team members');
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
        // Refetch tasks to ensure proper order and data consistency
        await fetchGroupTasks();
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

  const handleAddNote = async (taskId, content) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        // Refetch tasks to ensure proper order and data consistency
        await fetchGroupTasks();
        toast.success('Note added successfully!');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add note');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteNote = async (taskId, noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refetch tasks to ensure proper order and data consistency
        await fetchGroupTasks();
        toast.success('Note deleted successfully!');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete note');
      }
    } catch (error) {
      throw error;
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
        const response = await fetch('http://localhost:5000/api/tasks/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            taskId: active.id,
            newPosition: adjustedNewIndex,
            isGroupTask: true
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to save task order');
        }

        // Success - keep the optimistic update, no need to refetch
        console.log('Task reordered successfully');
      } catch (error) {
        console.error('Reorder error:', error);
        toast.error('Error updating task order');
        // Revert the optimistic update by refetching
        await fetchGroupTasks();
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Append task data
      Object.keys(newTask).forEach(key => {
        if (key !== 'attachments' && key !== 'members') {
          formData.append(key, newTask[key]);
        }
      });
      formData.append('isGroupTask', 'true');
      formData.append('leader', JSON.parse(localStorage.getItem('user')).id);

      // Append member IDs as JSON string
      formData.append('members', JSON.stringify(selectedMembers.map(member => member._id)));

      // Append files
      newTask.attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch('http://localhost:5000/api/tasks/group', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        // Refetch tasks to ensure proper order and data consistency
        await fetchGroupTasks();
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          status: 'pending',
          dueDate: '',
          members: [],
          attachments: []
        });
        setSelectedMembers([]);
        setIsCreateDialogOpen(false);
        toast.success('Group task created successfully!');
      } else {
        toast.error(data.message || 'Failed to create group task');
      }
    } catch (error) {
      toast.error('Error creating group task');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedMembers.find(member => member._id === user._id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Group Tasks</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-5 w-5" />
              New Group Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Group Task</DialogTitle>
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedMembers.map(member => (
                    <Badge
                      key={member._id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-xs">
                          {member.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {member.username}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSelectedMembers(selectedMembers.filter(m => m._id !== member._id))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <Popover open={isUsersOpen} onOpenChange={setIsUsersOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isUsersOpen}
                      className="w-full justify-between"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Add team members
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search users..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-72">
                          {filteredUsers.map(user => (
                            <CommandItem
                              key={user._id}
                              onSelect={() => {
                                setSelectedMembers([...selectedMembers, user]);
                                setSearchTerm('');
                              }}
                            >
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback>
                                  {user.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {user.username}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedMembers.find(member => member._id === user._id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewTask({
                      title: '',
                      description: '',
                      priority: 'medium',
                      status: 'pending',
                      dueDate: '',
                      members: [],
                      attachments: []
                    });
                    setSelectedMembers([]);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members Management Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Team Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Members</Label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(member => (
                  <Badge
                    key={member._id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {member.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.username}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSelectedMembers(selectedMembers.filter(m => m._id !== member._id))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Add New Members</Label>
              <Popover open={isUsersOpen} onOpenChange={setIsUsersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isUsersOpen}
                    className="w-full justify-between"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Add team members
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-72">
                        {filteredUsers.map(user => (
                          <CommandItem
                            key={user._id}
                            onSelect={() => {
                              setSelectedMembers([...selectedMembers, user]);
                              setSearchTerm('');
                            }}
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback>
                                {user.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {user.username}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedMembers.find(member => member._id === user._id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsMembersDialogOpen(false);
                  setManagingTask(null);
                  setSelectedMembers([]);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateMembers}>
                Update Members
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Group Task</DialogTitle>
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
                Update Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                onManageMembers={handleManageMembers}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default GroupTasksPage;
