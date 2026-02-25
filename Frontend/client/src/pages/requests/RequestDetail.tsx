import { useStore } from "@/lib/store";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RequestDetail() {
  const [, params] = useRoute("/requests/:id");
  const [, setLocation] = useLocation();
  const { requests, users, currentUser, updateRequestStatus, assignInspector, setFinalDate, completeRequest } = useStore();
  const { toast } = useToast();

  const [adminNote, setAdminNote] = useState("");
  const [selectedInspector, setSelectedInspector] = useState("");
  const [finalDateTime, setFinalDateTime] = useState("");
  const [inspectorMessage, setInspectorMessage] = useState("");

  if (!currentUser || !params?.id) return null;

  const request = requests.find(r => r.id === parseInt(params.id));
  if (!request) return <div>Request not found</div>;

  const inspectors = users.filter(u => u.role === 'INSPECTOR');

  const handleAdminAction = (action: 'APPROVE' | 'REJECT' | 'NEED_CHANGES') => {
    if (action === 'APPROVE') {
      if (!finalDateTime) {
        toast({ title: "Error", description: "Please select a final date and time.", variant: "destructive" });
        return;
      }
      if (!selectedInspector) {
        toast({ title: "Error", description: "Please assign an inspector.", variant: "destructive" });
        return;
      }
      const inspector = users.find(u => u.id === parseInt(selectedInspector));
      setFinalDate(request.id, finalDateTime);
      assignInspector(request.id, parseInt(selectedInspector));
      updateRequestStatus(request.id, 'APPROVED', adminNote);
    } else {
      updateRequestStatus(request.id, action === 'REJECT' ? 'REJECTED' : 'NEED_CHANGES', adminNote);
    }
    toast({ title: "Success", description: "Request status updated." });
  };

  const handleInspectorAction = (action: 'CONFIRM' | 'NEED_CHANGES' | 'COMPLETE') => {
    if (action === 'COMPLETE') {
      completeRequest(request.id, inspectorMessage);
    } else if (action === 'CONFIRM') {
      updateRequestStatus(request.id, 'INSPECTOR_CONFIRMED');
    } else {
      updateRequestStatus(request.id, 'NEED_CHANGES', inspectorMessage);
    }
    toast({ title: "Success", description: "Action recorded successfully." });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <Button variant="ghost" onClick={() => setLocation("/requests")} className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to Requests
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-t-4 border-t-primary shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-serif">{request.university_name}</CardTitle>
                  <p className="text-muted-foreground mt-1">Request #{request.id}</p>
                </div>
                <Badge variant={request.status === 'APPROVED' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                  {request.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Student Count</p>
                    <p className="text-muted-foreground">{request.student_count} Students</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground">{request.location}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Preferred Dates
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {request.preferred_dates.map((date, i) => (
                    <Badge key={i} variant="outline" className="text-sm py-1">
                      {format(new Date(date), "PPP p")}
                    </Badge>
                  ))}
                </div>
              </div>

              {request.notes && (
                <div className="bg-muted/30 p-4 rounded-md text-sm">
                  <span className="font-semibold">Notes:</span> {request.notes}
                </div>
              )}

              {request.assigned_inspector_name && (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-md flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Assigned Inspector</p>
                    <p className="font-medium">{request.assigned_inspector_name}</p>
                  </div>
                  {request.final_date && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">Confirmed Date</p>
                      <p className="font-medium">{format(new Date(request.final_date), "PPP p")}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Request Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-4">
                {request.status_history.map((history, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <div>
                        <p className="font-medium text-sm">{history.status.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">by {history.by}</p>
                        {history.note && (
                          <p className="text-xs bg-muted mt-1 p-2 rounded italic">"{history.note}"</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap mt-1 sm:mt-0">
                        {format(new Date(history.date), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {currentUser.role === 'ADMIN' && request.status === 'PENDING' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Inspector</label>
                  <Select onValueChange={setSelectedInspector}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Inspector" />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectors.map(i => (
                        <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Final Date & Time</label>
                  <input
                    type="datetime-local"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setFinalDateTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Note (Optional)</label>
                  <Textarea
                    placeholder="Add a message..."
                    className="bg-background"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button className="w-full" onClick={() => handleAdminAction('APPROVE')}>Approve & Schedule</Button>
                <div className="flex w-full gap-2">
                  <Button variant="outline" className="w-full" onClick={() => handleAdminAction('NEED_CHANGES')}>Request Changes</Button>
                  <Button variant="destructive" className="w-full" onClick={() => handleAdminAction('REJECT')}>Reject</Button>
                </div>
              </CardFooter>
            </Card>
          )}

          {currentUser.role === 'INSPECTOR' && request.assigned_inspector === currentUser.id && request.status === 'APPROVED' && (
            <Card>
              <CardHeader><CardTitle>Inspector Actions</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Please confirm you can attend this seminar at the scheduled time.</p>
                <Button className="w-full" onClick={() => handleInspectorAction('CONFIRM')}>Confirm Attendance</Button>
              </CardContent>
            </Card>
          )}

          {currentUser.role === 'INSPECTOR' && request.assigned_inspector === currentUser.id && request.status === 'INSPECTOR_CONFIRMED' && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader><CardTitle>Complete Seminar</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Completion Report</label>
                  <Textarea
                    placeholder="Enter seminar outcome details..."
                    className="bg-background"
                    value={inspectorMessage}
                    onChange={(e) => setInspectorMessage(e.target.value)}
                  />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleInspectorAction('COMPLETE')}>
                  Submit Report & Complete
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Read Only Status Card for Coordinator */}
          {currentUser.role === 'UNIVERSITY_COORDINATOR' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Current Status</CardTitle>
                <p className="text-2xl font-bold text-primary mt-2">{request.status.replace('_', ' ')}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Check the timeline for the latest updates on your request.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
