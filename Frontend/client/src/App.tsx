import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/dashboard/Dashboard";
import SeminarDashboard from "@/pages/dashboard/SeminarDashboard";
import RequestList from "@/pages/requests/RequestList";
import RequestDetail from "@/pages/requests/RequestDetail";
import CreateRequest from "@/pages/requests/CreateRequest";
import UserManagement from "@/pages/users/UserManagement";
import CoordinatorProfile from "@/pages/users/CoordinatorProfile";
import CoordinatorRegistration from "@/pages/auth/CoordinatorRegistration";
import StaffRegistration from "@/pages/auth/StaffRegistration";
import NovationRequestList from "@/pages/requests/NovationRequestList";
import StudentForm from "@/pages/student-data/StudentForm";
import StudentDataDashboard from "@/pages/student-data/StudentDataDashboard";
import AssessmentDashboard from "@/pages/assessment/AssessmentDashboard";
import MonitoringDashboard from "@/pages/monitoring/MonitoringDashboard";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { currentUser } = useStore();

  if (!currentUser) {
    return <Redirect to="/login" />;
  }

  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}

function Router() {
  const { currentUser } = useStore();

  return (
    <Switch>
      <Route path="/login">
        {currentUser ? <Redirect to="/" /> : <Login />}
      </Route>

      <Route path="/register/:token" component={CoordinatorRegistration} />
      <Route path="/staff-register/:token" component={StaffRegistration} />


      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>

      <Route path="/requests">
        <ProtectedRoute component={RequestList} />
      </Route>

      <Route path="/requests/:id">
        <ProtectedRoute component={RequestDetail} />
      </Route>

      <Route path="/create-request">
        <ProtectedRoute component={CreateRequest} />
      </Route>

      <Route path="/users">
        <ProtectedRoute component={UserManagement} />
      </Route>

      <Route path="/profile">
        <ProtectedRoute component={CoordinatorProfile} />
      </Route>

      <Route path="/info-change-requests">
        <ProtectedRoute component={NovationRequestList} />
      </Route>

      {/* Admin specific routes */}
      <Route path="/seminar-management">
        <ProtectedRoute component={SeminarDashboard} />
      </Route>
      <Route path="/student-data">
        <ProtectedRoute component={StudentDataDashboard} />
      </Route>
      <Route path="/assessment">
        <ProtectedRoute component={AssessmentDashboard} />
      </Route>
      <Route path="/monitoring">
        <ProtectedRoute component={MonitoringDashboard} />
      </Route>

      {/* Public Route for Student Data Collection */}
      <Route path="/collect-data/:hash">
        {/* No Auth Guard needed, but maybe an AppShell wrapper if we want consistent header, or bare layout? Using bare for focus. */}
        <StudentForm />
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { initialize, isLoading } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100">
        <div className="text-red-600 font-bold text-xl flex gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          LOADING APPLICATION...
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
