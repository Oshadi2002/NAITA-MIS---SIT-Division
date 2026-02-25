import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface NovationRequest {
    id: number;
    student_details: {
        full_name: string;
        student_reg_no: string;
        university: string;
    };
    coordinator_name: string;
    requested_work_site: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    admin_comment: string | null;
    created_at: string;
}

export default function NovationRequestList() {
    const { currentUser } = useStore();

    const { data: requests, isLoading } = useQuery<NovationRequest[]>({
        queryKey: ['novation-requests'],
        queryFn: async () => {
            const res = await axios.get('/api/novation-requests/');
            return res.data;
        }
    });

    const approveRequest = async (id: number) => {
        if (!confirm("Approve this novation request?")) return;
        await axios.post(`/api/novation-requests/${id}/approve/`);
        // Invalidate query or reload - simpliest is reload for now or using client query invalidation
        location.reload();
    };

    const rejectRequest = async (id: number) => {
        if (!confirm("Reject this novation request?")) return;
        await axios.post(`/api/novation-requests/${id}/reject/`);
        location.reload();
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Novation Requests</h2>
                    <p className="text-muted-foreground">Manage and track student placement change requests.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Requests</CardTitle>
                    <CardDescription>
                        {currentUser?.role === 'ADMIN' ? 'Review requests from coordinators.' : 'Track status of your requests.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Requested Change</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Coordinator</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                {currentUser?.role === 'ADMIN' && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests?.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{req.student_details.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{req.student_details.student_reg_no}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{req.requested_work_site}</div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate" title={req.reason}>
                                            {req.reason}
                                        </TableCell>
                                        <TableCell>{req.coordinator_name}</TableCell>
                                        <TableCell>
                                            <Badge variant={req.status === 'APPROVED' ? 'default' : req.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </TableCell>
                                        {currentUser?.role === 'ADMIN' && (
                                            <TableCell className="text-right space-x-2">
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => approveRequest(req.id)}>Approve</Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => rejectRequest(req.id)}>Reject</Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
