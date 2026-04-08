import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, FileText, CheckCircle, XCircle, Clock, ListFilter, Hash } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

type ActiveTab = 'pending' | 'pass' | 'special_status' | 'history';

export default function AssessorDashboard() {
    const [, setLocation] = useLocation();
    const { currentUser } = useStore();
    const { toast } = useToast();
    
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
    
    // Evaluation Modal State
    const [evaluatingStudent, setEvaluatingStudent] = useState<any | null>(null);
    const [marksData, setMarksData] = useState<Record<string, number>>({});
    const [evaluationCondition, setEvaluationCondition] = useState<string>("NORMAL");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    
    // History & Reports State
    const [reports, setReports] = useState<any[]>([]);
    const [allMarks, setAllMarks] = useState<any[]>([]);
    const [uploadingReport, setUploadingReport] = useState<string | null>(null); // date string

    useEffect(() => {
        fetchAssignments();
        fetchHistoryData();
    }, []);

    const fetchHistoryData = async () => {
        try {
            const [reportsRes, marksRes] = await Promise.all([
                axios.get('/api/assessor-reports/'),
                axios.get('/api/assessment-marks/')
            ]);
            setReports(reportsRes.data);
            setAllMarks(marksRes.data);
        } catch (error) {
            console.error("Failed to fetch history data", error);
        }
    };

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/viva-assignments/');
            setAssignments(res.data);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
            toast({ title: "Error", description: "Could not load assigned students.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const filteredAssignments = useMemo(() => {
        if (!searchQuery) return assignments;
        const q = searchQuery.toLowerCase();
        return assignments.filter((a: any) => 
            a.student_details?.student_reg_no?.toLowerCase().includes(q) ||
            a.student_details?.nic?.toLowerCase().includes(q) ||
            a.student_details?.full_name?.toLowerCase().includes(q)
        );
    }, [assignments, searchQuery]);

    const pendingStudents = useMemo(() => filteredAssignments.filter(a => !a.marks), [filteredAssignments]);
    const passStudents = useMemo(() => filteredAssignments.filter(a => a.marks?.status === 'PASS'), [filteredAssignments]);
    const specialStatusStudents = useMemo(() => filteredAssignments.filter(a => a.marks?.status === 'SPECIAL_STATUS'), [filteredAssignments]);

    const getStudentsByTab = () => {
        switch (activeTab) {
            case 'pending': return pendingStudents;
            case 'pass': return passStudents;
            case 'special_status': return specialStatusStudents;
            default: return [];
        }
    };

    const openEvaluation = (assignment: any) => {
        setEvaluatingStudent(assignment);
        if (assignment.marks) {
            setMarksData(assignment.marks.marks_data || {});
            setEvaluationCondition(assignment.marks.evaluation_condition || "NORMAL");
            setRemarks(assignment.marks.assessor_remarks || "");
        } else {
            const initialMarks: Record<string, number> = {};
            if (assignment.marking_criteria && Array.isArray(assignment.marking_criteria)) {
                assignment.marking_criteria.forEach((c: any) => {
                    initialMarks[c.name] = 0;
                });
            }
            setMarksData(initialMarks);
            setEvaluationCondition("NORMAL");
            setRemarks("");
        }
    };

    const totalMark = Object.values(marksData).reduce((sum, val) => sum + Number(val || 0), 0);
    const isPass = totalMark >= 50 && evaluationCondition === 'NORMAL';

    const submitMarks = async () => {
        if (!evaluatingStudent) return;
        setSubmitting(true);
        
        const payload = {
            assignment: evaluatingStudent.id,
            marks_data: marksData,
            evaluation_condition: evaluationCondition,
            assessor_remarks: remarks
        };

        try {
            if (evaluatingStudent.marks?.id) {
                // Update existing marks
                await axios.put(`/api/assessment-marks/${evaluatingStudent.marks.id}/`, payload);
                toast({ title: "Marks Updated", description: "Student marks have been successfully updated." });
            } else {
                // Create new marks
                await axios.post('/api/assessment-marks/', payload);
                toast({ title: "Marks Submitted", description: "Student marks have been successfully saved." });
            }
            setEvaluatingStudent(null);
            fetchAssignments(); // Refresh data to show updated marks
            fetchHistoryData(); // Refresh history counts
        } catch (error) {
            console.error("Failed to submit marks", error);
            toast({ title: "Error", description: "Could not save marks. Please try again.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const groupedHistory = useMemo(() => {
        const history: Record<string, { count: number, report?: any }> = {};
        
        // Group all marks by date
        allMarks.forEach(m => {
            const date = new Date(m.created_at).toISOString().split('T')[0];
            if (!history[date]) history[date] = { count: 0 };
            history[date].count++;
        });

        // Attach existing reports
        reports.forEach(r => {
            if (!history[r.date]) history[r.date] = { count: 0 };
            history[r.date].report = r;
        });

        // Convert to array and sort by date descending
        return Object.entries(history)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [allMarks, reports]);

    const handleFileUpload = async (date: string, type: 'accomplishment_report' | 'claim_form', file: File) => {
        const formData = new FormData();
        formData.append(type, file);
        formData.append('date', date);

        const existingReport = reports.find(r => r.date === date);
        
        try {
            setSubmitting(true);
            if (existingReport) {
                await axios.patch(`/api/assessor-reports/${existingReport.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post('/api/assessor-reports/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            toast({ title: "File Uploaded", description: "Document has been successfully uploaded." });
            fetchHistoryData();
        } catch (error) {
            console.error("Upload failed", error);
            toast({ title: "Upload Failed", description: "Could not upload document.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Assessor Dashboard</h2>
                        <p className="text-muted-foreground">Welcome {currentUser?.name}. Manage and evaluate your assigned students.</p>
                    </div>
                </div>
            </div>

            {activeTab !== 'history' && (
                <Card className="min-h-[600px] shadow-sm animate-in zoom-in-95 duration-200 border-t-4 border-t-purple-600">
                <CardHeader className="bg-muted/10 border-b pb-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                        <div className="flex-1">
                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 md:w-[650px] mb-2">
                                    <TabsTrigger value="pending" className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Pending ({pendingStudents.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="pass" className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" /> Pass ({passStudents.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="special_status" className="flex items-center gap-2">
                                        <Hash className="h-4 w-4" /> Special ({specialStatusStudents.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> History & Reports
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <CardDescription>
                                Students scheduled for your viva panels.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
                            <Input
                                placeholder="Search students..."
                                className="pl-9 bg-white shadow-sm border-purple-200/50 focus-visible:ring-purple-200"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">Loading assigned students...</div>
                    ) : getStudentsByTab().length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">No students found in this category.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20">
                                    <TableHead className="pl-6 py-4">Student Details</TableHead>
                                    <TableHead>Registration No</TableHead>
                                    <TableHead>Training Location</TableHead>
                                    <TableHead>Panel Details</TableHead>
                                    <TableHead>Evaluation Status</TableHead>
                                    <TableHead className="text-right pr-6">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getStudentsByTab().map(assignment => (
                                    <TableRow key={assignment.id} className="hover:bg-purple-50/30">
                                        <TableCell className="pl-6 py-4">
                                            <div className="font-bold text-sm text-foreground">
                                                {assignment.student_details?.initials_name}
                                            </div>
                                            <div className="text-[10px] text-purple-700 font-mono font-bold mt-0.5">
                                                ID: {assignment.student_details?.student_reg_no}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                NIC: {assignment.student_details?.nic}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <p className="font-mono text-sm font-bold text-purple-700">
                                                {assignment.student_details?.student_reg_no}
                                            </p>
                                        </TableCell>
                                        <TableCell className="py-4 text-xs">
                                            <div className="font-medium text-foreground">{assignment.student_details?.training_establishment}</div>
                                            <div className="text-muted-foreground">{assignment.student_details?.training_district} District</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className="font-semibold text-xs text-blue-700 border-blue-200 bg-blue-50">
                                                Slot {assignment.slot_number}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {assignment.marks ? (
                                                <div className="flex items-center gap-2">
                                                    {assignment.marks.status === 'PASS' ? (
                                                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                                            <CheckCircle className="w-3 h-3 mr-1"/> Pass ({assignment.marks.total_mark})
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">
                                                            <XCircle className="w-3 h-3 mr-1"/> {assignment.marks.evaluation_condition?.replace('_', ' ')} ({assignment.marks.total_mark})
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">Pending Eval</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 py-4">
                                            <Button 
                                                size="sm" 
                                                variant={assignment.marks ? "outline" : "default"}
                                                onClick={() => openEvaluation(assignment)}
                                                className={assignment.marks ? "border-purple-200 text-purple-700 hover:bg-purple-50" : "bg-purple-600 hover:bg-purple-700"}
                                            >
                                                {assignment.marks ? "Edit Marks" : "Evaluate"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            )}

            {/* History & Reports Tab Content */}
            {activeTab === 'history' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-xl text-purple-800">Assessment History</CardTitle>
                                <CardDescription>Daily summary of students evaluated and required documentation.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Students Evaluated</TableHead>
                                            <TableHead>Documents</TableHead>
                                            <TableHead>Submission Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedHistory.map(day => (
                                            <TableRow key={day.date}>
                                                <TableCell className="font-medium">{day.date}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">
                                                        {day.count} Students
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between gap-4 text-xs">
                                                            <span>Accomplishment Report</span>
                                                            {day.report?.accomplishment_report ? (
                                                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100">Uploaded</Badge>
                                                            ) : (
                                                                <input 
                                                                    type="file" 
                                                                    accept=".pdf,.doc,.docx"
                                                                    className="w-32 text-[10px]"
                                                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(day.date, 'accomplishment_report', e.target.files[0])}
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4 text-xs">
                                                            <span>Claim Form</span>
                                                            {day.report?.claim_form ? (
                                                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100">Uploaded</Badge>
                                                            ) : (
                                                                <input 
                                                                    type="file" 
                                                                    accept=".pdf"
                                                                    className="w-32 text-[10px]"
                                                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(day.date, 'claim_form', e.target.files[0])}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {day.report?.is_received_by_admin ? (
                                                        <Badge className="bg-green-600">Received by Admin</Badge>
                                                    ) : day.report ? (
                                                        <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">Pending Review</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs italic">Awaiting Upload</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {groupedHistory.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                    No assessment history found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="bg-blue-50/50 border-blue-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                                        <Clock className="h-5 w-5" /> Submission Guidelines
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2 text-blue-900">
                                    <p>1. Upload your <strong>Accomplishment Report</strong> and <strong>Claim Form</strong> daily.</p>
                                    <p>2. Once uploaded, send the <strong>original physical documents</strong> by post to the SIT Division.</p>
                                    <p>3. Admin will update your status to <strong>"Received"</strong> after verifying the physical copies.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {/* Evaluation Dialog */}
            <Dialog open={!!evaluatingStudent} onOpenChange={(open) => !open && setEvaluatingStudent(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-purple-800">Viva Evaluation Entry</DialogTitle>
                        <DialogDescription>
                            Enter marks for the student. Total marks will be calculated automatically. Pass mark is 50.
                        </DialogDescription>
                    </DialogHeader>

                    {evaluatingStudent && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Student Context Panel */}
                            <div className="space-y-4 bg-muted/20 p-5 rounded-lg border border-purple-100 h-fit">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-purple-700 border-b border-purple-200 pb-2">Student Information</h3>
                                
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase">Name</Label>
                                    <p className="font-semibold text-foreground">{evaluatingStudent.student_details?.initials_name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase">Reg Number</Label>
                                        <p className="font-mono font-bold text-foreground">{evaluatingStudent.student_details?.student_reg_no}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase">NIC</Label>
                                        <p className="font-mono text-foreground">{evaluatingStudent.student_details?.nic}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase">Training Location</Label>
                                    <p className="text-sm font-medium">{evaluatingStudent.student_details?.training_establishment}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{evaluatingStudent.student_details?.field_of_training}</p>
                                </div>
                            </div>

                            {/* Marking Form */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {evaluatingStudent.marking_criteria?.map((criteria: any, idx: number) => (
                                        <div className="space-y-2" key={idx}>
                                            <Label htmlFor={`criteria_${idx}`}>{criteria.name} (Max: {criteria.max})</Label>
                                            <Input 
                                                id={`criteria_${idx}`} 
                                                type="number" 
                                                min="0" max={criteria.max} 
                                                value={marksData[criteria.name] ?? 0}
                                                onChange={(e) => {
                                                    let val = Number(e.target.value);
                                                    if (val > criteria.max) val = criteria.max;
                                                    setMarksData({...marksData, [criteria.name]: val});
                                                }}
                                                className="font-mono font-bold"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {(!evaluatingStudent.marking_criteria || evaluatingStudent.marking_criteria.length === 0) && (
                                    <div className="text-sm text-red-500 italic p-4 bg-red-50 rounded">No marking criteria defined for this panel. Please contact the administrator.</div>
                                )}

                                <div className="pt-4 pb-2">
                                    <div className={`p-4 rounded-xl flex items-center justify-between border-2 ${isPass ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                                        <div>
                                            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Total Score</p>
                                            <p className={`text-4xl font-black ${isPass ? 'text-green-700' : 'text-red-700'}`}>{totalMark.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Status</p>
                                            <Badge className={isPass ? 'bg-green-600 hover:bg-green-700 text-sm' : 'bg-red-600 hover:bg-red-700 text-sm'}>
                                                {isPass ? 'PASSED' : 'FAILED'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="eval_condition">Evaluation Condition</Label>
                                    <select 
                                        id="eval_condition"
                                        value={evaluationCondition}
                                        onChange={(e) => setEvaluationCondition(e.target.value)}
                                        className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="NORMAL">Normal</option>
                                        <option value="INCOMPLETE_DIARY">Incomplete Daily Diary</option>
                                        <option value="EXTEND">Extend</option>
                                        <option value="VIVA_REPEAT">Viva Repeat</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="remarks">Assessor Remarks (Optional)</Label>
                                    <Textarea 
                                        id="remarks" 
                                        placeholder="Add any comments regarding the student's performance..." 
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        className="resize-none h-24"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => setEvaluatingStudent(null)} disabled={submitting}>Cancel</Button>
                        <Button 
                            className="bg-purple-600 hover:bg-purple-700" 
                            onClick={submitMarks}
                            disabled={submitting}
                        >
                            {submitting ? "Saving..." : "Submit Evaluation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
