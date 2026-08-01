import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Download, Eye, FileText, CheckCircle2, XCircle } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface NovationRequest {
    id: number;
    student_details: {
        full_name: string;
        student_reg_no: string;
        university: string;
        batch_year: string;
        training_establishment: string;
        training_address: string;
    };
    coordinator_name: string;
    requested_work_site: string;
    new_training_address: string;
    new_training_district: string;
    new_divisional_secretariat: string;
    new_officer_in_charge: string;
    new_officer_in_charge_contact: string;
    new_training_start_date: string;
    new_training_end_date: string;
    new_training_duration: string;
    new_field_of_training: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    admin_comment: string | null;
    admin_novation_form: string | null;
    is_read_by_admin: boolean;
    created_at: string;
}

export default function NovationRequestList() {
    const { currentUser } = useStore();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedRequest, setSelectedRequest] = useState<NovationRequest | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formFile, setFormFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const isAdmin = currentUser?.role === 'ADMIN';

    const { data: requests, isLoading } = useQuery<NovationRequest[]>({
        queryKey: ['novation-requests'],
        queryFn: async () => {
            const res = await axios.get('/api/novation-requests/');
            return res.data;
        }
    });

    const [filterUniversity, setFilterUniversity] = useState<string>("all");
    const [filterBatchYear, setFilterBatchYear] = useState<string>("all");

    const universities = useMemo(() => {
        if (!requests) return [];
        const set = new Set(requests.map(r => r.student_details.university).filter(Boolean));
        return Array.from(set).sort();
    }, [requests]);

    const batchYears = useMemo(() => {
        if (!requests) return [];
        const set = new Set(requests.map(r => r.student_details.batch_year).filter(Boolean));
        return Array.from(set).sort();
    }, [requests]);

    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        return requests.filter(req => {
            const matchUni = filterUniversity === "all" || req.student_details.university === filterUniversity;
            const matchYear = filterBatchYear === "all" || req.student_details.batch_year === filterBatchYear;
            return matchUni && matchYear;
        });
    }, [requests, filterUniversity, filterBatchYear]);

    const markAsReadMutation = useMutation({
        mutationFn: (id: number) => axios.post(`/api/novation-requests/${id}/mark_as_read/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['novation-requests'] })
    });

    const updateRequestMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: any }) => {
            await axios.patch(`/api/novation-requests/${id}/`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novation-requests'] });
            setIsEditing(false);
            toast({ title: "Updated", description: "Request details updated successfully." });
        },
        onError: () => toast({ title: "Update Failed", variant: "destructive" })
    });

    const approveMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: FormData }) => {
            await axios.post(`/api/novation-requests/${id}/approve/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novation-requests'] });
            setIsReviewOpen(false);
            setSelectedRequest(null);
            toast({ title: "Approved", description: "Novation request has been approved." });
        },
        onError: () => toast({ title: "Failed", variant: "destructive" })
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, comment }: { id: number, comment: string }) => {
            await axios.post(`/api/novation-requests/${id}/reject/`, { admin_comment: comment });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novation-requests'] });
            setIsReviewOpen(false);
            setSelectedRequest(null);
            toast({ title: "Rejected", description: "Novation request has been rejected." });
        },
        onError: () => toast({ title: "Failed", variant: "destructive" })
    });

    const handleReview = (req: NovationRequest) => {
        setSelectedRequest(req);
        setIsReviewOpen(true);
        if (isAdmin && !req.is_read_by_admin) {
            markAsReadMutation.mutate(req.id);
        }
    };

    const handleApprove = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedRequest) return;
        setIsProcessing(true);
        const formData = new FormData(e.currentTarget);
        if (formFile) formData.append('admin_novation_form', formFile);
        
        approveMutation.mutate({ id: selectedRequest.id, data: formData });
        setIsProcessing(false);
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Requests</CardTitle>
                            <CardDescription>
                                {isAdmin ? 'Review requests from coordinators.' : 'Track status of your requests.'}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Select value={filterUniversity} onValueChange={setFilterUniversity}>
                                <SelectTrigger className="w-[180px] bg-white">
                                    <SelectValue placeholder="All Universities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Universities</SelectItem>
                                    {universities.map(u => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterBatchYear} onValueChange={setFilterBatchYear}>
                                <SelectTrigger className="w-[150px] bg-white">
                                    <SelectValue placeholder="All Batches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Batches</SelectItem>
                                    {batchYears.map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>University & Batch</TableHead>
                                <TableHead>Requested Change</TableHead>
                                <TableHead>Coordinator</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequests?.map((req) => (
                                    <TableRow key={req.id} className={isAdmin && !req.is_read_by_admin ? "bg-red-50 hover:bg-red-100" : ""}>
                                        <TableCell>
                                            <div className="font-medium">{req.student_details.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{req.student_details.student_reg_no}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{req.student_details.university}</div>
                                            <div className="text-xs text-muted-foreground">{req.student_details.batch_year}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{req.requested_work_site}</div>
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
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => handleReview(req)}>
                                                {isAdmin ? (req.status === 'PENDING' ? 'Review' : 'View') : 'View Details'}
                                            </Button>
                                            {req.admin_novation_form && (
                                                <Button size="sm" variant="ghost" onClick={() => window.open(req.admin_novation_form!, '_blank')}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedRequest && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Review Novation Request</DialogTitle>
                                <DialogDescription>
                                    Reviewing request for {selectedRequest.student_details.full_name}.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                {/* Left Side: Training Details */}
                                <div className="space-y-4 border-r pr-4">
                                    <div>
                                        <h4 className="font-bold text-sm text-primary uppercase tracking-tight mb-2">Original Training Site</h4>
                                        <p className="text-sm font-semibold">{selectedRequest.student_details.training_establishment}</p>
                                        <p className="text-xs text-muted-foreground">{selectedRequest.student_details.training_address}</p>
                                    </div>
                                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-sm text-primary uppercase tracking-tight">New Requested Site</h4>
                                            {isAdmin && selectedRequest.status === 'PENDING' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-7 text-[10px]" 
                                                    onClick={() => setIsEditing(!isEditing)}
                                                >
                                                    {isEditing ? 'Cancel Edit' : 'Edit Details'}
                                                </Button>
                                            )}
                                        </div>
                                        
                                        {isEditing ? (
                                            <div className="space-y-3 pt-1">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Establishment Name</Label>
                                                    <Input 
                                                        className="h-8 text-sm" 
                                                        defaultValue={selectedRequest.requested_work_site} 
                                                        onChange={(e) => selectedRequest.requested_work_site = e.target.value}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Address</Label>
                                                    <Input 
                                                        className="h-8 text-sm" 
                                                        defaultValue={selectedRequest.new_training_address} 
                                                        onChange={(e) => selectedRequest.new_training_address = e.target.value}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">District</Label>
                                                        <Input 
                                                            className="h-8 text-sm" 
                                                            defaultValue={selectedRequest.new_training_district} 
                                                            onChange={(e) => selectedRequest.new_training_district = e.target.value}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">OIC</Label>
                                                        <Input 
                                                            className="h-8 text-sm" 
                                                            defaultValue={selectedRequest.new_officer_in_charge} 
                                                            onChange={(e) => selectedRequest.new_officer_in_charge = e.target.value}
                                                        />
                                                    </div>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    className="w-full h-8 text-xs bg-primary"
                                                    onClick={() => {
                                                        const { student_details, coordinator_name, ...data } = selectedRequest;
                                                        updateRequestMutation.mutate({ id: selectedRequest.id, data });
                                                    }}
                                                >
                                                    Save Changes
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm font-semibold">{selectedRequest.requested_work_site}</p>
                                                <p className="text-xs text-muted-foreground">{selectedRequest.new_training_address}</p>
                                                <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                                                    <div>
                                                        <p className="text-muted-foreground">District</p>
                                                        <p className="font-medium">{selectedRequest.new_training_district}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">OIC</p>
                                                        <p className="font-medium">{selectedRequest.new_officer_in_charge}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Start Date</p>
                                                        <p className="font-medium">{selectedRequest.new_training_start_date}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Duration</p>
                                                        <p className="font-medium">{selectedRequest.new_training_duration}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Request Details & Actions */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-sm text-primary uppercase tracking-tight mb-1">Reason for Request</h4>
                                        <p className="text-sm italic text-muted-foreground bg-muted p-3 rounded-md">
                                            "{selectedRequest.reason}"
                                        </p>
                                    </div>

                                    {isAdmin && selectedRequest.status === 'PENDING' ? (
                                        <form onSubmit={handleApprove} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Admin Comment (Optional)</Label>
                                                <Textarea name="admin_comment" placeholder="Add a comment for the coordinator..." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Upload Novation Form (PDF)</Label>
                                                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 cursor-pointer relative">
                                                    <Input 
                                                        type="file" 
                                                        accept=".pdf" 
                                                        onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    {formFile ? (
                                                        <>
                                                            <FileText className="h-8 w-8 text-blue-500" />
                                                            <p className="text-xs font-medium">{formFile.name}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="h-8 w-8 text-muted-foreground" />
                                                            <p className="text-xs text-muted-foreground text-center">Click to upload the official novation PDF</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isProcessing}>
                                                    Approve Request
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    variant="destructive" 
                                                    className="flex-1"
                                                    onClick={() => {
                                                        const comment = (document.querySelector('[name="admin_comment"]') as HTMLTextAreaElement)?.value;
                                                        rejectMutation.mutate({ id: selectedRequest.id, comment });
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-primary uppercase tracking-tight">Status:</h4>
                                                <Badge variant={selectedRequest.status === 'APPROVED' ? 'default' : selectedRequest.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                                    {selectedRequest.status}
                                                </Badge>
                                            </div>
                                            {selectedRequest.admin_comment && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight mb-1">Admin Comment</p>
                                                    <p className="text-sm bg-muted/50 p-3 rounded-md border">{selectedRequest.admin_comment}</p>
                                                </div>
                                            )}
                                            {selectedRequest.admin_novation_form && (
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    onClick={() => window.open(selectedRequest.admin_novation_form!, '_blank')}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    Download Novation Form
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsReviewOpen(false)}>Close</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
