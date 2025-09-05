import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import TasksPage from '../tasks/TasksPage';
import ProfilePage from '../profile/ProfilePage';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Settings,
  LogOut,
  User,
  PlusCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    },
    {
      name: 'Tasks',
      href: '/dashboard/tasks',
      icon: ListTodo,
      current: location.pathname === '/dashboard/tasks'
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: Calendar,
      current: location.pathname === '/dashboard/calendar'
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      current: location.pathname === '/dashboard/profile'
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: location.pathname === '/dashboard/settings'
    }
  ];

  // Sidebar Content Component
  const SidebarContent = ({ isMobile = false }) => (
    <div className="h-full flex flex-col">
      {/* Logo/Brand */}
      <div className={`p-6 border-b border-border ${isMobile ? 'pt-8' : ''}`}>
        <div className="flex items-center">
          <img 
            src="/checklist.png" 
            alt="Task Management" 
            className="w-8 h-8 mr-3 flex-shrink-0"
          />
          <div className={`${sidebarCollapsed && !isMobile ? 'hidden' : 'block'} transition-all duration-300`}>
            <h1 className="text-xl font-bold">Task Management</h1>
            <p className="text-xs text-muted-foreground">by Kobie</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.name}
              variant={item.current ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 h-12 ${
                sidebarCollapsed && !isMobile ? 'px-3' : 'px-4'
              } transition-all duration-300 ${
                isMobile ? 'touch-manipulation mobile-transition' : ''
              }`}
              onClick={() => {
                navigate(item.href);
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className={`${sidebarCollapsed && !isMobile ? 'hidden' : 'block'} transition-all duration-300`}>
                {item.name}
              </span>
            </Button>
          );
        })}
      </nav>

      {/* Add Task Button */}
      <div className="p-4 border-t border-border">
        <Button 
          className={`w-full gap-2 h-12 ${
            sidebarCollapsed && !isMobile ? 'px-3' : 'px-4'
          } transition-all duration-300 ${
            isMobile ? 'touch-manipulation mobile-transition' : ''
          }`}
        >
          <PlusCircle className="h-5 w-5 flex-shrink-0" />
          <span className={`${sidebarCollapsed && !isMobile ? 'hidden' : 'block'} transition-all duration-300`}>
            Add New Task
          </span>
        </Button>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className={`${sidebarCollapsed && !isMobile ? 'hidden' : 'block'} min-w-0 transition-all duration-300`}>
              <p className="text-sm font-medium truncate">{user?.username || 'Loading...'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || 'Loading...'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:text-destructive flex-shrink-0"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar */}
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent 
            side="left" 
            className="w-80 p-0 sm:w-72"
            style={{ 
              '--sheet-content-width': '320px',
              '--sheet-content-width-sm': '288px'
            }}
          >
            <SidebarContent isMobile={true} />
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop Sidebar */
        <div className={`bg-card text-card-foreground border-r border-border transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <SidebarContent />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden touch-manipulation"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div className="flex items-center">
              <img 
                src="/checklist.png" 
                alt="Task Management" 
                className="w-6 h-6 mr-2"
              />
              <h1 className="text-lg font-semibold truncate">
                {navigationItems.find(item => item.current)?.name || 'Task Management'}
              </h1>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hover:bg-muted"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
              <h1 className="text-xl font-semibold">
                {navigationItems.find(item => item.current)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Welcome back, {user?.username || 'User'}!
              </span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto mobile-scroll">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
