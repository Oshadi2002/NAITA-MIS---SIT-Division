import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  School,
  ClipboardCheck,
  Bell,
  Microscope
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { currentUser, logout } = useStore();

  const { data: novationRequests } = useQuery({
    queryKey: ['novation-requests'],
    queryFn: async () => {
      const res = await axios.get('/api/novation-requests/');
      return res.data;
    },
    enabled: currentUser?.role === 'ADMIN' || currentUser?.role === 'UNIVERSITY_COORDINATOR'
  });

  const unreadNovationCount = (currentUser?.role === 'ADMIN' && Array.isArray(novationRequests))
    ? novationRequests.filter((r: any) => r && !r.is_read_by_admin && r.status === 'PENDING').length 
    : 0;

  if (!currentUser) return null;

  const NavItem = ({ href, icon: Icon, label, badgeCount }: { href: string; icon: any; label: string; badgeCount?: number }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 mb-1 font-medium",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 text-left">{label}</span>
          {badgeCount ? (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
              {badgeCount}
            </span>
          ) : null}
        </Button>
      </Link>
    );
  };

  return (
    <div className="h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shrink-0">
      <div className="p-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 text-sidebar-primary-foreground">
          <School className="h-6 w-6 text-primary" />
          <span className="font-serif font-bold text-lg tracking-tight">PlacementMngr</span>
        </div>
        <div className="mt-4 text-xs text-sidebar-foreground/50 uppercase tracking-wider font-semibold">
          {currentUser.role.replace('_', ' ')}
        </div>
      </div>

      <div className="flex-1 py-6 px-3">
        <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />

        {currentUser.role === 'UNIVERSITY_COORDINATOR' && (
          <>
            <NavItem href="/create-request" icon={FileText} label="New Seminar Request" />
            <NavItem href="/requests" icon={ClipboardCheck} label="My Seminar Requests" />
            <NavItem href="/info-change-requests" icon={Users} label="Novation Requests" />
          </>
        )}

        {currentUser.role === 'ADMIN' && (
          <>
            <NavItem href="/requests" icon={ClipboardCheck} label="All Requests" />
            <NavItem href="/student-data" icon={Users} label="Student Data" />
            <NavItem href="/info-change-requests" icon={Users} label="Novation Requests" badgeCount={unreadNovationCount} />
            <NavItem href="/users" icon={Users} label="User Management" />
            <NavItem href="/assessment" icon={Microscope} label="Assessment Management" />
          </>
        )}

        {currentUser.role === 'INSPECTOR' && (
          <>
            <NavItem href="/requests" icon={ClipboardCheck} label="Assigned Seminars" />
          </>
        )}

        {currentUser.role === 'ASSESSOR' && (
          <>
            <NavItem href="/assessor-dashboard" icon={Microscope} label="Student Assessments" />
          </>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold">
            {(currentUser.name || currentUser.username || "U").charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{currentUser.name || currentUser.username}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{currentUser.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
