import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  DoorOpen, 
  Calendar, 
  ClipboardList,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Rooms', href: '/rooms', icon: DoorOpen },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Bookings', href: '/bookings', icon: ClipboardList },
];

const NavItem: React.FC<{
  item: typeof navigation[0];
  mobile?: boolean;
  onClick?: () => void;
}> = ({ item, mobile, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === item.href;

  return (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        mobile ? 'w-full' : '',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      )}
    >
      <item.icon className="h-5 w-5" />
      <span>{item.name}</span>
    </NavLink>
  );
};

const DesktopSidebar: React.FC = () => (
  <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar">
    <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
      <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
        <DoorOpen className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-bold text-sidebar-foreground">RoomBook</span>
    </div>
    <nav className="flex-1 px-4 py-6 space-y-1">
      {navigation.map((item) => (
        <NavItem key={item.name} item={item} />
      ))}
    </nav>
    <div className="p-4 border-t border-sidebar-border">
      <p className="text-xs text-sidebar-foreground/50">
        © 2024 RoomBook
      </p>
    </div>
  </aside>
);

const MobileNav: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-16 flex items-center px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <DoorOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">RoomBook</span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <NavItem 
                key={item.name} 
                item={item} 
                mobile 
                onClick={() => setOpen(false)} 
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
          <DoorOpen className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold">RoomBook</span>
      </div>
    </header>
  );
};

const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border h-16 flex items-center justify-around px-2">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <MobileNav />
      <main className="lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};
