import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import TasksPage from '../tasks/TasksPage';
import ProfilePage from '../profile/ProfilePage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Settings,
  LogOut,
  User,
  PlusCircle
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card text-card-foreground border-r border-border">
        <div className="h-full flex flex-col">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center">
              <img 
                src="/checklist.png" 
                alt="Task Management" 
                className="w-8 h-8 mr-3"
              />
              <div>
                <h1 className="text-xl font-bold">Task Management</h1>
                <p className="text-xs text-muted-foreground">by Kobie</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => navigate('/dashboard/tasks')}
            >
              <ListTodo className="h-5 w-5" />
              Tasks
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Calendar className="h-5 w-5" />
              Calendar
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => navigate('/dashboard/profile')}
            >
              <User className="h-5 w-5" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </Button>
          </nav>

          {/* Add Task Button */}
          <div className="p-4 border-t border-border">
            <Button className="w-full gap-2">
              <PlusCircle className="h-5 w-5" />
              Add New Task
            </Button>
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.username || 'Loading...'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'Loading...'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
