import { useStore } from "@/lib/store";
import { SeminarManagementCard } from "@/components/dashboard/SeminarManagementCard";
import { StudentDataCard } from "@/components/dashboard/StudentDataCard";
import { MonitoringCard } from "@/components/dashboard/MonitoringCard";
import { AssessmentCard } from "@/components/dashboard/AssessmentCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { currentUser, requests } = useStore();
  const [, setLocation] = useLocation();

  if (!currentUser) return null;

  // Calculate Stats for the Card Preview
  const myRequests = currentUser.role === 'ADMIN'
    ? requests
    : currentUser.role === 'INSPECTOR'
      ? requests.filter(r => r.assigned_inspector === currentUser.id)
      : requests.filter(r => r.coordinator === currentUser.id);

  const pending = myRequests.filter(r => r.status === 'PENDING').length;
  // const approved = myRequests.filter(r => r.status === 'APPROVED').length; // Unused in launchpad
  // const completed = myRequests.filter(r => r.status === 'COMPLETED').length; // Unused in launchpad
  const total = myRequests.length;

  // Find next upcoming seminar
  const now = new Date();
  const upcomingSeminarRequest = myRequests
    .filter(r => r.status === 'APPROVED' && r.final_date && new Date(r.final_date) > now)
    .sort((a, b) => new Date(a.final_date!).getTime() - new Date(b.final_date!).getTime())[0];

  const upcomingSeminar = upcomingSeminarRequest ? {
    university: upcomingSeminarRequest.university_name,
    date: upcomingSeminarRequest.final_date!,
    location: upcomingSeminarRequest.location
  } : undefined;


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Admin Dashboard</h2>
        <div className="flex justify-between items-start">
          <p className="text-muted-foreground mt-2">
            Welcome back, {currentUser.name || currentUser.username}. Select a module to manage.
          </p>
          <Button variant="outline" onClick={() => setLocation("/profile")}>
            My Profile
          </Button>
        </div>
      </div>

      {/* Admin & Coordinator Management Level */}
      {(currentUser.role === 'ADMIN' || currentUser.role === 'UNIVERSITY_COORDINATOR') && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SeminarManagementCard
            totalRequests={total}
            pendingRequests={pending}
            upcomingSeminar={upcomingSeminar}
            onClick={() => setLocation("/seminar-management")}
            className="col-span-1"
          />
          <StudentDataCard
            totalStudents={0} // TODO: Fetch real stats
            uncheckedCount={0}
            onClick={() => setLocation("/student-data")}
            className="col-span-1"
          />
          <MonitoringCard
            activeMonitors={0} // TODO: Fetch real stats 
            onClick={() => setLocation("/monitoring")}
            className="col-span-1"
          />
          <AssessmentCard
            completedStudents={0} // TODO: Fetch real stats
            onClick={() => setLocation("/assessment")}
            className="col-span-1"
          />
          {/* Future Modules: User Management, Reports, etc. */}
        </div>
      )}

      {/* 
        If there are other roles (Inspector/Coordinator) they might still need their default view 
        or they should also have a "Module" view? 
        For now, since the specific request was "Admin Dashboard", 
        I'm simplifying this page heavily for Admin. 
        If currentUser is NOT Admin, we might want to show their stats here? 
        The request said "Only the main cards should be displayed on the Admin Dashboard".
      */}
      {currentUser.role !== 'ADMIN' && (
        <div className="text-muted-foreground">
          {/* Placeholder for non-admin dashboard or redirect them? */}
          <p>Please use the side navigation to access your modules.</p>
        </div>
      )}
    </div>
  );
}
