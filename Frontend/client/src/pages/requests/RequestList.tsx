import { useStore, RequestStatus } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function RequestList() {
  const { currentUser, requests } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  if (!currentUser) return null;

  const myRequests = currentUser.role === 'ADMIN'
    ? requests
    : currentUser.role === 'INSPECTOR'
      ? requests.filter(r => r.assigned_inspector === currentUser.id)
      : requests.filter(r => r.coordinator === currentUser.id);

  const filteredRequests = myRequests.filter(r =>
    r.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'APPROVED': return "bg-green-100 text-green-800 hover:bg-green-100";
      case 'REJECTED': return "bg-red-100 text-red-800 hover:bg-red-100";
      case 'COMPLETED': return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case 'NEED_CHANGES': return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case 'INSPECTOR_CONFIRMED': return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Seminar Requests</h2>
          <p className="text-muted-foreground">Manage and track seminar applications.</p>
        </div>
        {currentUser.role === 'UNIVERSITY_COORDINATOR' && (
          <Link href="/create-request">
            <Button className="shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-sm bg-card p-1 rounded-md border shadow-sm">
        <Search className="h-4 w-4 ml-2 text-muted-foreground" />
        <Input
          placeholder="Search university or location..."
          className="border-none focus-visible:ring-0 shadow-none h-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>University</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req) => (
                <TableRow key={req.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{req.university_name}</TableCell>
                  <TableCell>{req.location}</TableCell>
                  <TableCell>{req.student_count}</TableCell>
                  <TableCell>
                    {req.final_date
                      ? new Date(req.final_date).toLocaleDateString()
                      : new Date(req.preferred_dates[0]).toLocaleDateString()
                    }
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-medium", getStatusColor(req.status))}>
                      {req.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/requests/${req.id}`}>
                      <Button variant="ghost" size="sm">View Details</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
