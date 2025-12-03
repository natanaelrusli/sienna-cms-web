import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, BookOpen, Settings, Image as ImageIcon, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/text', label: 'Text Content', icon: FileText },
    { path: '/blog', label: 'Blog Posts', icon: BookOpen },
    { path: '/page-config', label: 'Page Config', icon: Settings },
    { path: '/images', label: 'Images', icon: ImageIcon },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-semibold">Sienna CMS</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                className={cn("w-full justify-start", isActive && "bg-primary text-primary-foreground")}
                onClick={() => navigate(item.path)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        <div className="border-t bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="truncate">{user?.email || 'User'}</span>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

