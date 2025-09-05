import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MoreVertical,
  FileText,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  Users,
  MessageSquare,
  Send,
  X,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const statusIcons = {
  completed: <CheckCircle className="h-3 w-3" />,
  in_progress: <Clock className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />
};

const TaskCard = ({ task, onStatusChange, onDeleteTask, onFileClick, onEdit, onManageMembers, onAddNote, onDeleteNote }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id });

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await onAddNote(task._id, newNote.trim());
      setNewNote('');
      setShowAddNoteModal(false);
      toast.success('Note added successfully!');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await onDeleteNote(task._id, noteId);
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    position: 'relative',
    touchAction: 'none'
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative transition-all duration-200 cursor-move hover:shadow-lg hover:scale-[1.02]",
        isDragging && "shadow-2xl scale-105 rotate-2",
        task.status === 'completed' && "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800",
        task.status === 'in_progress' && "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800",
        task.status === 'pending' && "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800"
      )}
    >
      {/* Header with Status and Actions */}
      <CardHeader className="pb-1 pt-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              task.status === 'completed' && "bg-green-500",
              task.status === 'in_progress' && "bg-blue-500 animate-pulse",
              task.status === 'pending' && "bg-amber-500"
            )} />
            <Badge className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              task.status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
              task.status === 'in_progress' && "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
              task.status === 'pending' && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
            )}>
              <div className="flex items-center gap-1">
                {statusIcons[task.status]}
                <span className="capitalize text-xs">{task.status.replace('_', ' ')}</span>
              </div>
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                task.priority === 'high' && "border-red-200 text-red-700 dark:border-red-800 dark:text-red-300",
                task.priority === 'medium' && "border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-300",
                task.priority === 'low' && "border-green-200 text-green-700 dark:border-green-800 dark:text-green-300"
              )}
            >
              {task.priority.toUpperCase()}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onStatusChange(task._id, 'completed')}
                className="gap-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange(task._id, 'in_progress')}
                className="gap-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <Clock className="h-4 w-4" />
                Mark In Progress
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.isGroupTask && task.leader?._id === JSON.parse(localStorage.getItem('user')).id && (
                <DropdownMenuItem 
                  onClick={() => onManageMembers(task)}
                  className="gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <Users className="h-4 w-4" />
                  Manage Members
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onEdit(task)}
                className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <Edit2 className="h-4 w-4" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteTask(task._id)}
                className="gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Title moved to header section */}
        <h3 className="font-bold text-base mt-1.5 mb-0.5 text-gray-900 dark:text-gray-100">
          {task.title}
        </h3>
      </CardHeader>

      {/* Content */}
      <CardContent className="pb-2 pt-0">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
            {task.description || 'No description provided'}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span>
              {task.dueDate ? (
                new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              ) : (
                'No due date'
              )}
            </span>
          </div>
        </div>
        
        {/* Group Task Members Display */}
        {task.isGroupTask && (
          <div className="mb-1.5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Team ({task.members?.length || 0} members)
              </span>
            </div>
            <div className="flex -space-x-1.5">
              {task.members?.slice(0, 4).map((member, index) => (
                <Avatar key={member._id} className="h-6 w-6 border-2 border-white dark:border-gray-800">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {member.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.members?.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    +{task.members.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes section for group tasks */}
        {task.isGroupTask && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
                className="h-8 px-3 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <MessageSquare className="h-3 w-3 mr-2" />
                Notes ({task.notes?.length || 0})
              </Button>
              {showNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddNoteModal(true)}
                  className="h-8 px-3 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-300 dark:hover:bg-blue-950/30 rounded-full"
                >
                  Add Note
                </Button>
              )}
            </div>
            
            {showNotes && (
              <div className="space-y-1.5 max-h-48 overflow-hidden relative">
                {task.notes?.slice(0, 2).map((note) => (
                  <div key={note._id} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">{note.content}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                              {note.author?.username?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{note.author?.username}</span>
                          <span>•</span>
                          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {(note.author?._id === JSON.parse(localStorage.getItem('user')).id || 
                        task.leader?._id === JSON.parse(localStorage.getItem('user')).id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note._id)}
                          className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Blurry overlay and view more button when there are more than 2 notes */}
                {task.notes?.length > 2 && (
                  <div className="relative mt-2">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-900/90 rounded-lg pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-center py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNotesModal(true)}
                        className="h-8 px-4 text-xs font-medium bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 shadow-lg rounded-full"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View {task.notes.length - 2} more notes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="pt-0 pb-0">
        <div className="flex items-center justify-end w-full">
          <div className="flex items-center gap-1.5">
            {task.attachments?.length > 0 && (
              <div className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs text-gray-500">{task.attachments.length}</span>
              </div>
            )}
            {task.attachments?.length > 0 && task.attachments.map((file, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                onClick={() => onFileClick(file, task._id)}
              >
                {file.originalName}
              </Button>
            ))}
          </div>
        </div>
      </CardFooter>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              All Notes ({task.notes?.length || 0})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {task.notes?.map((note) => (
              <div key={note._id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 leading-relaxed">{note.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {note.author?.username?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{note.author?.username}</span>
                      <span>•</span>
                      <span>{new Date(note.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                  {(note.author?._id === JSON.parse(localStorage.getItem('user')).id || 
                    task.leader?._id === JSON.parse(localStorage.getItem('user')).id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note._id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {task.notes?.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notes yet. Be the first to add one!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={showAddNoteModal} onOpenChange={setShowAddNoteModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Note to "{task.title}"
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Note Content
              </label>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your note here..."
                className="min-h-[120px] text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg resize-none"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddNoteModal(false);
                  setNewNote('');
                }}
                className="px-4"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newNote.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TaskCard;