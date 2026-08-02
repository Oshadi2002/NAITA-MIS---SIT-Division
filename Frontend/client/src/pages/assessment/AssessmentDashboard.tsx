import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    ArrowLeft, Search, Building2, Calendar, FileText, ChevronRight, Hash, Eye,
    Home, School, MapPin, BookOpen, Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, X, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentSubmission {
    id: number;
    full_name: string;
    student_reg_no: string;
    nic: string;
    university: string;
    subject: string;
    batch_year: string;
    district: string;
    checked_ok: boolean;
    admin_reg_number: string | null;
    submitted_at: string;
    nic_copy: string | null;
    agreement_form: string | null;
    work_site_form: string | null;
    placement_letter: string | null;
    initials_name: string;
    gender: string;
    email: string;
    contact_number: string;
    permanent_address: string;
    degree_nvq_level: string;
    degree_diploma_name: string;
    training_district: string;
    divisional_secretariat: string;
    training_establishment: string;
    training_address: string;
    officer_in_charge: string;
    training_start_date: string;
    training_end_date: string;
    training_duration: string;
    field_of_training: string;
    head_office_designation: string | null;
    head_office_name: string | null;
    head_office_address: string | null;
    head_office_email: string | null;
    head_office_phone: string | null;
    officer_in_charge_contact: string | null;
    column_1: string | null;
    finalized_agreement_form: string | null;
    is_agreement_sent: boolean;
    agreement_sent_at: string | null;
}

interface AssessmentMark {
    id: number;
    assignment: number;
    assessor: number;
    assessor_name?: string;
    total_mark: number;
    status: 'PASS' | 'SPECIAL_STATUS';
    marks_data: Record<string, number>;
    evaluation_condition?: string;
    created_at: string;
    updated_at: string;
}

interface VivaAssignment {
    id: number;
    panel: number;
    student: number;
    student_details?: StudentSubmission;
    slot_number: number | null;
    scheduled_time: string | null;
    marks?: AssessmentMark;
    panel_name?: string;
    marking_criteria?: MarkingCriterion[];
}

interface MarkingCriterion {
    name: string;
    max: number;
}

interface VivaPanel {
    id: number;
    name: string;
    assessor: number | null;
    assessor_name?: string;
    dates: string[];
    location: string | null;
    university?: string;
    subject?: string;
    batch_year?: string;
    assignments?: VivaAssignment[];
    student_count?: number;
    marking_criteria?: MarkingCriterion[];
}

interface User {
    id: number;
    username: string;
    name: string;
    role: string;
}

type NavLevel = 'years' | 'universities' | 'districts' | 'subjects' | 'list';
type ActiveTab = 'students' | 'pass' | 'special_status' | 'panels' | 'reports';

export default function AssessmentDashboard() {
    const { currentUser } = useStore();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [assessorReports, setAssessorReports] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [students, setStudents] = useState<StudentSubmission[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [viewingStudent, setViewingStudent] = useState<StudentSubmission | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('students');
    const [assessmentPhase, setAssessmentPhase] = useState<'PHASE_1' | 'PHASE_2'>('PHASE_1');
    const [vivaPanels, setVivaPanels] = useState<VivaPanel[]>([]);
    const [vivaAssignments, setVivaAssignments] = useState<VivaAssignment[]>([]);
    const [assessors, setAssessors] = useState<User[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [assigningToPanel, setAssigningToPanel] = useState<number | null>(null);
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [editingPanelId, setEditingPanelId] = useState<number | null>(null);
    const DEFAULT_CRITERIA: MarkingCriterion[] = [
        { name: "Daily Diary", max: 100 },
        { name: "Attendance", max: 100 },
        { name: "Technical Knowledge", max: 100 },
        { name: "Final Report", max: 100 }
    ];

    const [newPanel, setNewPanel] = useState<{ name: string; dates: string[]; assessor: string; location: string; university: string; batch_year: string; subject: string; training_phase: string; marking_criteria: MarkingCriterion[] }>({ name: "", dates: [], assessor: "", location: "", university: "", batch_year: "", subject: "", training_phase: "PHASE_1", marking_criteria: DEFAULT_CRITERIA });
    const [sortBy, setSortBy] = useState<'name' | 'location' | 'reg_no'>('name');
    const [openAssessorDropdown, setOpenAssessorDropdown] = useState(false);
    const [tempDate, setTempDate] = useState("");
    const criteriaSum = useMemo(() => {
        return newPanel.marking_criteria.reduce((sum, c) => sum + (Number(c.max) || 0), 0);
    }, [newPanel.marking_criteria]);

    const safeStudents = Array.isArray(students) ? students : [];
    const safePanels = Array.isArray(vivaPanels) ? vivaPanels : [];

    const uniqueUniversities = useMemo(() => Array.from(new Set(safeStudents.map(s => s.university))).filter(Boolean).sort(), [safeStudents]);
    const uniqueBatchYears = useMemo(() => Array.from(new Set(safeStudents.map(s => s.batch_year))).filter(Boolean).sort(), [safeStudents]);
    const uniqueSubjects = useMemo(() => Array.from(new Set(safeStudents.map(s => s.subject))).filter(Boolean).sort(), [safeStudents]);

    const [navPath, setNavPath] = useState<{
        year?: string;
        university?: string;
        district?: string;
        subject?: string;
    }>({});

    useEffect(() => {
        if (currentUser?.role) {
            fetchInitialData();
        }
    }, [currentUser]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [panelsRes, assignmentsRes, submissionsRes, assessorsRes, reportsRes] = await Promise.all([
                axios.get('/api/viva-panels/'),
                axios.get('/api/viva-assignments/'),
                axios.get('/api/student-submissions/'),
                axios.get('/api/auth/assessors/'),
                axios.get('/api/assessor-reports/')
            ]);
            setVivaPanels(panelsRes.data);
            setVivaAssignments(assignmentsRes.data);
            setStudents(submissionsRes.data);
            setAssessors(assessorsRes.data);
            setAssessorReports(reportsRes.data);
        } catch (error) {
            console.error("Failed to fetch assessment data", error);
            toast({ title: "Error", description: "Could not load data. Please refresh and try again.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePanel = async () => {
        const finalDates = [...newPanel.dates];
        if (tempDate && !finalDates.includes(tempDate) && finalDates.length < 10) {
            finalDates.push(tempDate);
            finalDates.sort();
        }

        if (!newPanel.name || finalDates.length === 0) {
            toast({ title: "Name and at least one Date are required", variant: "destructive" });
            return;
        }
        try {
            const payload = {
                ...newPanel,
                dates: finalDates,
                assessor: newPanel.assessor ? parseInt(newPanel.assessor) : null,
                university: newPanel.university || navPath.university || null,
                subject: newPanel.subject || navPath.subject || null,
                batch_year: newPanel.batch_year || navPath.year || null
            };

            if (editingPanelId) {
                await axios.put(`/api/viva-panels/${editingPanelId}/`, payload);
                toast({ title: "Viva Panel updated successfully" });
            } else {
                await axios.post('/api/viva-panels/', payload);
                toast({ title: "Viva Panel created successfully" });
            }
            setShowCreatePanel(false);
            setTempDate("");
            setNewPanel({ name: "", dates: [], assessor: "", location: "", university: "", batch_year: "", subject: "", training_phase: "PHASE_1", marking_criteria: DEFAULT_CRITERIA });
            setEditingPanelId(null);
            fetchInitialData();
        } catch (error) {
            toast({ title: "Failed to save panel", variant: "destructive" });
        }
    };

    const handleDeletePanel = async (id: number) => {
        if (!confirm("Are you sure you want to delete this panel? Associated assignments will be removed.")) return;
        try {
            await axios.delete(`/api/viva-panels/${id}/`);
            toast({ title: "Panel deleted successfully" });
            fetchInitialData();
        } catch {
            toast({ title: "Failed to delete panel", variant: "destructive" });
        }
    };

    const handleEditPanelClick = (panel: VivaPanel) => {
        setEditingPanelId(panel.id);
        setNewPanel({
            name: panel.name,
            dates: panel.dates || [],
            assessor: panel.assessor?.toString() || "",
            location: panel.location || "",
            university: panel.university || "",
            batch_year: panel.batch_year || "",
            subject: panel.subject || "",
            training_phase: panel.training_phase || "PHASE_1",
            marking_criteria: panel.marking_criteria?.length ? panel.marking_criteria : DEFAULT_CRITERIA
        });
        setShowCreatePanel(true);
    };

    const handleBulkAssign = async (panelId: number) => {
        if (selectedStudents.length === 0) return;
        setLoading(true);
        try {
            await axios.post('/api/viva-panels/bulk_assign/', {
                panel_id: panelId,
                student_ids: selectedStudents
            });
            toast({ title: "Success", description: `Assigned ${selectedStudents.length} students to the panel.` });
            setSelectedStudents([]);
            fetchInitialData();
        } catch (error) {
            console.error("Bulk assign failed", error);
            toast({ title: "Error", description: "Could not assign students.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const markReportReceived = async (reportId: number) => {
        try {
            setSubmitting(true);
            await axios.post(`/api/assessor-reports/${reportId}/mark_received/`);
            toast({ title: "Received", description: "Document status updated successfully." });
            fetchInitialData();
        } catch (error) {
            console.error("Update failed", error);
            toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = useMemo(() => {
        return safeStudents.filter(s => {
            if (assessmentPhase === 'PHASE_2' && !s.has_phase2_placement) return false;
            if (navPath.year && s.batch_year !== navPath.year) return false;
            if (navPath.university && s.university !== navPath.university) return false;
            if (navPath.district && s.district !== navPath.district) return false;
            if (navPath.subject && s.subject !== navPath.subject) return false;
            return true;
        });
    }, [safeStudents, navPath, assessmentPhase]);

    const filteredVivaPanels = useMemo(() => {
        return safePanels.filter(p => {
            if (navPath.year && p.batch_year !== navPath.year) return false;
            if (navPath.university && p.university !== navPath.university) return false;
            if (navPath.subject && p.subject !== navPath.subject) return false;
            return true;
        });
    }, [safePanels, navPath]);

    const currentLevel: NavLevel = useMemo(() => {
        if (!navPath.year) return 'years';
        if (!navPath.university) return 'universities';
        if (!navPath.district) return 'districts';
        if (!navPath.subject) return 'subjects';
        return 'list';
    }, [navPath]);

    const gridItems = useMemo(() => {
        const items = new Map<string, number>();
        if (currentLevel === 'list') return [];

        filteredStudents.forEach(s => {
            let key = "";
            if (currentLevel === 'years') key = s.batch_year;
            else if (currentLevel === 'universities') key = s.university;
            else if (currentLevel === 'districts') key = s.district;
            else if (currentLevel === 'subjects') key = s.subject;

            if (key) items.set(key, (items.get(key) || 0) + 1);
        });

        return Array.from(items.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredStudents, currentLevel]);

    const handleDrill = (itemName: string) => {
        if (currentLevel === 'years') setNavPath({ ...navPath, year: itemName });
        else if (currentLevel === 'universities') setNavPath({ ...navPath, university: itemName });
        else if (currentLevel === 'districts') setNavPath({ ...navPath, district: itemName });
        else if (currentLevel === 'subjects') setNavPath({ ...navPath, subject: itemName });
    };

    const handleBreadcrumbClick = (level: NavLevel) => {
        if (level === 'years') setNavPath({});
        if (level === 'universities') setNavPath({ year: navPath.year });
        if (level === 'districts') setNavPath({ year: navPath.year, university: navPath.university });
        if (level === 'subjects') setNavPath({ year: navPath.year, university: navPath.university, district: navPath.district });
    };

    const displayStudents = useMemo(() => {
        let results = [...filteredStudents];
        if (search) {
            const q = search.toLowerCase();
            results = results.filter(s => {
                const establishment = assessmentPhase === 'PHASE_2' ? (s.phase2_training_establishment || "") : s.training_establishment;
                const dist = assessmentPhase === 'PHASE_2' ? (s.phase2_training_district || "") : (s.training_district || "");
                return (
                    s.full_name.toLowerCase().includes(q) ||
                    s.initials_name.toLowerCase().includes(q) ||
                    s.student_reg_no.toLowerCase().includes(q) ||
                    s.nic.toLowerCase().includes(q) ||
                    (s.admin_reg_number?.toLowerCase().includes(q) ?? false) ||
                    establishment.toLowerCase().includes(q) ||
                    dist.toLowerCase().includes(q)
                );
            });
        }

        results.sort((a, b) => {
            if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
            if (sortBy === 'location') {
                const locA = assessmentPhase === 'PHASE_2' ? (a.phase2_training_district || "") : (a.training_district || "");
                const locB = assessmentPhase === 'PHASE_2' ? (b.phase2_training_district || "") : (b.training_district || "");
                return locA.localeCompare(locB);
            }
            if (sortBy === 'reg_no') return a.student_reg_no.localeCompare(b.student_reg_no);
            return 0;
        });

        return results.map(s => {
            const dateStr = assessmentPhase === 'PHASE_2' ? s.phase2_training_end_date : s.training_end_date;
            const isTrainingCompleted = dateStr ? new Date(dateStr) <= new Date() : false;
            return { ...s, isTrainingCompleted };
        });
    }, [filteredStudents, search, sortBy, assessmentPhase]);

    const allAssignments = useMemo(() => {
        return vivaAssignments.map(a => {
            const panel = vivaPanels.find(p => p.id === a.panel);
            return { ...a, panel_name: panel?.name || "No Panel" };
        });
    }, [vivaAssignments, vivaPanels]);

    const passStudents = useMemo(() => allAssignments.filter(a => a.marks && a.marks.status === 'PASS'), [allAssignments]);
    const specialStatusStudents = useMemo(() => allAssignments.filter(a => a.marks && a.marks.status === 'SPECIAL_STATUS'), [allAssignments]);

    return (
        <div className="space-y-6 animate-in fade-in pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Assessment Management</h2>
                        <p className="text-muted-foreground">Manage and assess students who have completed their placement process.</p>
                    </div>
                </div>

                {currentUser?.role === 'ADMIN' && (
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setEditingPanelId(null);
                                setNewPanel({ name: "", dates: [], assessor: "", location: "", university: navPath.university || "", batch_year: navPath.year || "", subject: navPath.subject || "", marking_criteria: DEFAULT_CRITERIA });
                                setTempDate("");
                                setShowCreatePanel(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            Create Viva Panel
                        </Button>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-5 max-w-5xl mx-auto mb-6">
                    <TabsTrigger value="students" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Pending / All
                    </TabsTrigger>
                    <TabsTrigger value="pass" className="flex items-center gap-2">
                        <Check className="w-4 h-4" /> Pass Students
                    </TabsTrigger>
                    <TabsTrigger value="special_status" className="flex items-center gap-2">
                        <Hash className="w-4 h-4" /> Special Status
                    </TabsTrigger>
                    <TabsTrigger value="panels" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Viva Panels
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Assessor Reports
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="space-y-6">
                    <nav className="flex items-center text-sm text-muted-foreground bg-muted/30 p-2 px-4 rounded-md w-fit">
                        <button onClick={() => handleBreadcrumbClick('years')} className="hover:text-primary flex items-center gap-1 font-medium">
                            <Home className="w-4 h-4" /> Home
                        </button>

                        {navPath.year && (
                            <>
                                <ChevronRight className="w-4 h-4 mx-2" />
                                <button onClick={() => handleBreadcrumbClick('universities')} className="hover:text-primary font-medium">
                                    {navPath.year}
                                </button>
                            </>
                        )}
                        {navPath.university && (
                            <>
                                <ChevronRight className="w-4 h-4 mx-2" />
                                <button onClick={() => handleBreadcrumbClick('districts')} className="hover:text-primary font-medium">
                                    {navPath.university}
                                </button>
                            </>
                        )}
                        {navPath.district && (
                            <>
                                <ChevronRight className="w-4 h-4 mx-2" />
                                <button onClick={() => handleBreadcrumbClick('subjects')} className="hover:text-primary font-medium">
                                    {navPath.district}
                                </button>
                            </>
                        )}
                        {navPath.subject && (
                            <>
                                <ChevronRight className="w-4 h-4 mx-2" />
                                <span className="text-foreground font-bold">{navPath.subject}</span>
                            </>
                        )}
                    </nav>

                    {currentLevel !== 'list' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
                                {currentLevel === 'years' && <Calendar className="w-5 h-5 text-primary" />}
                                {currentLevel === 'universities' && <School className="w-5 h-5 text-primary" />}
                                {currentLevel === 'districts' && <MapPin className="w-5 h-5 text-primary" />}
                                {currentLevel === 'subjects' && <BookOpen className="w-5 h-5 text-primary" />}
                                Select {currentLevel.slice(0, -1)}
                            </h3>

                            {gridItems.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
                                    {loading ? "Loading data..." : "No assessment data available at this level."}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {gridItems.map(item => (
                                        <Card
                                            key={item.name}
                                            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                                            onClick={() => handleDrill(item.name)}
                                        >
                                            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                                                    {currentLevel === 'years' && <Calendar className="w-6 h-6" />}
                                                    {currentLevel === 'universities' && <School className="w-6 h-6" />}
                                                    {currentLevel === 'districts' && <MapPin className="w-6 h-6" />}
                                                    {currentLevel === 'subjects' && <BookOpen className="w-6 h-6" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-lg leading-tight">{item.name}</h4>
                                                    <p className="text-xs text-muted-foreground">{item.count} {item.count === 1 ? 'Student' : 'Students'}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentLevel === 'list' && (
                        <Card className="min-h-[600px] border-t-4 border-t-purple-600 shadow-sm animate-in zoom-in-95 duration-200">
                            <CardHeader className="bg-muted/10 border-b pb-4">
                                <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                                    <div className="space-y-4">
                                        <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
                                            <FileText className="h-5 w-5" /> Completed Students
                                            <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 font-semibold">
                                                {filteredStudents.length} Total
                                            </Badge>
                                            {selectedStudents.length > 0 && (
                                                <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200 animate-pulse">
                                                    {selectedStudents.length} Selected
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        
                                        <Tabs value={assessmentPhase} onValueChange={(v) => setAssessmentPhase(v as 'PHASE_1' | 'PHASE_2')} className="w-[300px]">
                                            <TabsList className="grid w-full grid-cols-2 h-9">
                                                <TabsTrigger value="PHASE_1" className="text-xs">Phase 1 Vivas</TabsTrigger>
                                                <TabsTrigger value="PHASE_2" className="text-xs">Phase 2 Vivas</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                        
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                                        {selectedStudents.length > 0 && currentUser?.role === 'ADMIN' && (
                                            <div className="flex items-center gap-2 mr-2">
                                                <Select onValueChange={(v) => handleBulkAssign(parseInt(v))}>
                                                    <SelectTrigger className="w-48 bg-blue-600 text-white border-blue-700">
                                                        <SelectValue placeholder="Assign to Panel..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredVivaPanels.filter(p => p.training_phase === assessmentPhase).map(p => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.name} ({p.dates && p.dates.length > 0 ? p.dates.join(', ') : 'No Dates'})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 bg-white rounded-md border px-3 h-10 shadow-sm">
                                            <Label htmlFor="sort" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Sort By:</Label>
                                            <select
                                                id="sort"
                                                className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer font-medium"
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value as any)}
                                            >
                                                <option value="name">Name</option>
                                                <option value="location">Training Location</option>
                                                <option value="reg_no">Reg Number</option>
                                            </select>
                                        </div>

                                        <div className="relative w-full sm:w-64">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
                                            <Input
                                                placeholder="Search Students..."
                                                className="pl-9 h-10 bg-white shadow-sm border-purple-200/50 focus-visible:ring-purple-200"
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/20">
                                            {currentUser?.role === 'ADMIN' && (
                                                <TableHead className="w-[50px] pl-6">
                                                    <Checkbox
                                                        checked={selectedStudents.length === displayStudents.filter(s => (s as any).isTrainingCompleted).length && displayStudents.filter(s => (s as any).isTrainingCompleted).length > 0}
                                                        onCheckedChange={(checked) => {
                                                            const completeds = displayStudents.filter(s => (s as any).isTrainingCompleted);
                                                            if (checked) setSelectedStudents(completeds.map(s => s.id));
                                                            else setSelectedStudents([]);
                                                        }}
                                                    />
                                                </TableHead>
                                            )}
                                            <TableHead className={currentUser?.role === 'ADMIN' ? "" : "pl-6"}>Student Details</TableHead>
                                            <TableHead>Registration No</TableHead>
                                            <TableHead>Training Information</TableHead>
                                            <TableHead className="text-right pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayStudents.map(student => (
                                            <TableRow key={student.id} className={`align-top ${(student as any).isTrainingCompleted ? 'hover:bg-purple-50/30' : 'bg-red-50/30 hover:bg-red-50/50 cursor-not-allowed'}`}>
                                                {currentUser?.role === 'ADMIN' && (
                                                    <TableCell className="pl-6 py-4">
                                                        <Checkbox
                                                            disabled={!(student as any).isTrainingCompleted}
                                                            checked={selectedStudents.includes(student.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) setSelectedStudents([...selectedStudents, student.id]);
                                                                else setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                                            }}
                                                        />
                                                    </TableCell>
                                                )}
                                                <TableCell className={currentUser?.role === 'ADMIN' ? "py-4" : "pl-6 py-4"}>
                                                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                                                        {student.initials_name}
                                                        {!(student as any).isTrainingCompleted && (
                                                            <Badge variant="destructive" className="text-[10px] h-5">Training Incomplete</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-4">
                                                    <p className="font-mono text-xs font-bold text-purple-700">
                                                        {student.student_reg_no}
                                                    </p>
                                                </TableCell>

                                                <TableCell className="py-4">
                                                    <div className="space-y-1.5">
                                                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                            <Building2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                                            {student.training_establishment}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                            <MapPin className="h-3 w-3 shrink-0" />
                                                            {student.training_district}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                            <Calendar className="h-3 w-3 shrink-0" />
                                                            {student.training_duration}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right pr-6 py-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setViewingStudent(student)}
                                                        className="h-8 text-[11px] border-purple-200 text-purple-700 hover:bg-purple-50"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-1" /> Profile
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="panels" className="space-y-6">
                    <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <div className="space-y-1">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Assessment Schedule
                            </h3>
                            <p className="text-xs text-blue-700">Organized viva panels and allocated assessors.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-xs font-medium text-blue-800">
                                {filteredVivaPanels.length} Panels Scheduled
                            </div>
                        </div>
                    </div>

                    {filteredVivaPanels.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h4 className="text-gray-500 font-medium">No assessment panels scheduled yet</h4>
                            <p className="text-sm text-gray-400 mt-1">Start by creating a panel and assigning students from the completed list.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Grouping by First Date for simplicity, or we could flatten */}
                            {Array.from(new Set(filteredVivaPanels.map(p => (p.dates && p.dates.length > 0) ? p.dates[0] : 'No Date'))).sort().map(dateGroup => (
                                <div key={dateGroup} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-blue-600 text-white border-none font-bold px-3 py-1">
                                            {dateGroup}
                                        </Badge>
                                        <div className="h-px flex-1 bg-blue-100" />
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {filteredVivaPanels.filter(p => (p.dates && p.dates.length > 0 ? p.dates[0] : 'No Date') === dateGroup).length} Panels Operating
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredVivaPanels.filter(p => (p.dates && p.dates.length > 0 ? p.dates[0] : 'No Date') === dateGroup).map(panel => (
                                            <Card key={panel.id} className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-2 bg-blue-50/20">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                                                                <Hash className="w-4 h-4 text-blue-500" /> {panel.name}
                                                            </CardTitle>
                                                            <CardDescription className="flex items-center gap-1 mt-1 text-[11px] font-medium">
                                                                {panel.location || "Location TBD"}
                                                            </CardDescription>
                                                            {panel.dates && panel.dates.length > 1 && (
                                                                <div className="flex gap-1 mt-2 flex-wrap">
                                                                    {panel.dates.map((d, i) => (
                                                                        <Badge key={i} variant="outline" className="text-[9px] bg-white border-blue-200 text-blue-600">
                                                                            {d}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            {currentUser?.role === 'ADMIN' && (
                                                                <div className="flex justify-end gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-100" onClick={(e) => { e.stopPropagation(); handleEditPanelClick(panel); }}>
                                                                        <Edit2 className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDeletePanel(panel.id); }}>
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            <Badge variant="secondary" className={
                                                                (panel.assignments?.length || 0) > 14
                                                                    ? "bg-red-50 text-red-700 border-red-100"
                                                                    : (panel.assignments?.length || 0) >= 13
                                                                        ? "bg-green-50 text-green-700 border-green-100"
                                                                        : "bg-blue-50 text-blue-700 border-blue-100"
                                                            }>
                                                                {panel.assignments?.length || 0} / 14
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4 pt-4">
                                                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                                                                {panel.assessor_name?.[0] || "?"}
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Assessor</p>
                                                                <p className="text-xs font-bold text-foreground truncate max-w-[120px]">
                                                                    {panel.assessor_name || "Unassigned"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 flex justify-between items-center">
                                                            <span>Assigned Students</span>
                                                            {(panel.assignments?.length || 0) >= 13 && (
                                                                <span className="text-[9px] text-green-600 normal-case font-medium">Full Schedule</span>
                                                            )}
                                                        </p>
                                                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                            {panel.assignments?.map((as, idx) => (
                                                                <div key={as.id} className="text-[11px] p-1.5 rounded bg-white border border-gray-50 flex justify-between group hover:border-blue-100 items-center">
                                                                    <div className="flex items-center gap-2 truncate">
                                                                        <span className="text-muted-foreground font-mono w-4">{idx + 1}.</span>
                                                                        <span className="font-medium text-foreground truncate">{as.student_details?.full_name}</span>
                                                                    </div>
                                                                    <span className="text-[9px] text-muted-foreground font-mono bg-muted px-1 rounded">
                                                                        {as.student_details?.student_reg_no}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {(!panel.assignments || panel.assignments.length === 0) && (
                                                                <div className="text-center py-4 text-xs text-muted-foreground italic border border-dashed rounded bg-gray-50/50">
                                                                    No students assigned
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pass" className="space-y-6">
                    <Card className="min-h-[400px] border-t-4 border-t-green-600 shadow-sm animate-in zoom-in-95 duration-200">
                        <CardHeader className="bg-muted/10 border-b pb-4">
                            <CardTitle className="text-xl text-green-800 flex items-center gap-2">
                                <Check className="h-5 w-5" /> Passed Students
                                <Badge className="ml-2 bg-green-100 text-green-800 border-green-200 font-semibold">
                                    {passStudents.length} Total
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Students who achieved a total mark of 50 or above with a Normal status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20">
                                        <TableHead className="pl-6">Student Details</TableHead>
                                        <TableHead>Registration No</TableHead>
                                        <TableHead>Panel</TableHead>
                                        <TableHead className="text-right pr-6">Total Mark</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {passStudents.map(assignment => (
                                        <TableRow key={assignment.id} className="hover:bg-green-50/30">
                                            <TableCell className="pl-6 py-4">
                                                <div className="font-bold text-sm text-foreground">
                                                    {assignment.student_details?.initials_name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <p className="font-mono text-xs font-bold text-green-700">
                                                    {assignment.student_details?.student_reg_no}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-4 font-medium text-xs">
                                                {assignment.panel_name}
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-4 font-bold text-green-700">
                                                {assignment.marks?.total_mark}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {passStudents.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                                No passed students found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="special_status" className="space-y-6">
                    <Card className="min-h-[400px] border-t-4 border-t-orange-600 shadow-sm animate-in zoom-in-95 duration-200">
                        <CardHeader className="bg-muted/10 border-b pb-4">
                            <CardTitle className="text-xl text-orange-800 flex items-center gap-2">
                                <Hash className="h-5 w-5" /> Special Status Students
                                <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                                    {specialStatusStudents.length} Total
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Students with incomplete prerequisites, extensions, or viva repeats.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20">
                                        <TableHead className="pl-6">Student Details</TableHead>
                                        <TableHead>Registration No</TableHead>
                                        <TableHead>Panel</TableHead>
                                        <TableHead>Condition</TableHead>
                                        <TableHead className="text-right pr-6">Total Mark</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {specialStatusStudents.map(assignment => (
                                        <TableRow key={assignment.id} className="hover:bg-orange-50/30">
                                            <TableCell className="pl-6 py-4">
                                                <div className="font-bold text-sm text-foreground">
                                                    {assignment.student_details?.initials_name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <p className="font-mono text-xs font-bold text-orange-700">
                                                    {assignment.student_details?.student_reg_no}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-4 font-medium text-xs">
                                                {assignment.panel_name}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50">
                                                    {assignment.marks?.evaluation_condition?.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-4 font-bold text-orange-700">
                                                {assignment.marks?.total_mark}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {specialStatusStudents.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                                No special status students found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-6">
                    <Card className="border-t-4 border-t-purple-600 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Assessor Daily Reports & Claims
                            </CardTitle>
                            <CardDescription>
                                Track document submissions from assessors and mark them as received.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/10">
                                        <TableHead className="pl-6">Assessor</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Students</TableHead>
                                        <TableHead>Documents</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assessorReports.map(report => (
                                        <TableRow key={report.id} className="hover:bg-purple-50/20">
                                            <TableCell className="pl-6 font-bold text-sm">{report.assessor_name}</TableCell>
                                            <TableCell className="text-sm">{report.date}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">
                                                    {report.student_count} Students
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    {report.accomplishment_report ? (
                                                        <a 
                                                            href={report.accomplishment_report} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5 group"
                                                        >
                                                            <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                                <Download className="h-3 w-3" />
                                                            </div>
                                                            Accomplishment Report
                                                        </a>
                                                    ) : <span className="text-[10px] text-muted-foreground italic flex items-center gap-1.5"><X className="h-3 w-3" /> No Report</span>}
                                                    {report.claim_form ? (
                                                        <a 
                                                            href={report.claim_form} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5 group"
                                                        >
                                                            <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                                <Download className="h-3 w-3" />
                                                            </div>
                                                            Claim Form (PDF)
                                                        </a>
                                                    ) : <span className="text-[10px] text-muted-foreground italic flex items-center gap-1.5"><X className="h-3 w-3" /> No Claim Form</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {report.is_received_by_admin ? (
                                                    <Badge className="bg-green-600 border-none px-2 py-0.5 text-[10px] flex items-center gap-1 w-fit">
                                                        <Check className="h-3 w-3" /> Received
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 px-2 py-0.5 text-[10px]">
                                                        Pending Review
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                {!report.is_received_by_admin && (
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-green-600 hover:bg-green-700 h-8 text-xs font-bold"
                                                        onClick={() => markReportReceived(report.id)}
                                                        disabled={submitting}
                                                    >
                                                        {submitting ? "Processing..." : "Mark as Received"}
                                                    </Button>
                                                )}
                                                {report.is_received_by_admin && (
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Physical Copy Verified</p>
                                                        <p className="text-xs text-green-700 font-bold">
                                                            {new Date(report.received_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {assessorReports.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileText className="h-8 w-8 opacity-20" />
                                                    <p>No assessor reports or claim forms found at this time.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pass" className="space-y-6">
                    <Card className="min-h-[600px] border-t-4 border-t-green-600 shadow-sm">
                        <CardHeader className="bg-muted/10 border-b pb-4">
                            <CardTitle className="text-xl text-green-800 flex items-center gap-2">
                                <Check className="h-5 w-5" /> Passed Students
                                <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">{passStudents.length} Total</Badge>
                            </CardTitle>
                            <CardDescription>Students who have successfully passed their assessment.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20">
                                        <TableHead className="pl-6 py-4">Student Details</TableHead>
                                        <TableHead>Registration No</TableHead>
                                        <TableHead>Panel & Assessor</TableHead>
                                        <TableHead>Marks</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {passStudents.map(assignment => (
                                        <TableRow key={assignment.id} className="hover:bg-green-50/30">
                                            <TableCell className="pl-6 py-4">
                                                <div className="font-bold text-sm">{assignment.student_details?.initials_name}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">NIC: {assignment.student_details?.nic}</div>
                                            </TableCell>
                                            <TableCell className="py-4 font-mono font-bold text-green-700">
                                                {assignment.student_details?.student_reg_no}
                                            </TableCell>
                                            <TableCell className="py-4 text-xs">
                                                <div className="font-bold text-green-900">{assignment.panel_name}</div>
                                                <div className="text-muted-foreground">Assessor: {assignment.marks?.assessor_name || "Unknown"}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="text-xl font-black text-green-600">{assignment.marks?.total_mark}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge className="bg-green-600">{assignment.marks?.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {passStudents.length === 0 && (
                                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No passed students found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="special_status" className="space-y-6">
                    <Card className="min-h-[600px] border-t-4 border-t-orange-500 shadow-sm">
                        <CardHeader className="bg-muted/10 border-b pb-4">
                            <CardTitle className="text-xl text-orange-800 flex items-center gap-2">
                                <Hash className="h-5 w-5" /> Special Status Students
                                <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200">{specialStatusStudents.length} Total</Badge>
                            </CardTitle>
                            <CardDescription>Students with special evaluation conditions or failed assessments.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20">
                                        <TableHead className="pl-6 py-4">Student Details</TableHead>
                                        <TableHead>Registration No</TableHead>
                                        <TableHead>Panel & Assessor</TableHead>
                                        <TableHead>Marks</TableHead>
                                        <TableHead>Condition</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {specialStatusStudents.map(assignment => (
                                        <TableRow key={assignment.id} className="hover:bg-orange-50/30">
                                            <TableCell className="pl-6 py-4">
                                                <div className="font-bold text-sm">{assignment.student_details?.initials_name}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">NIC: {assignment.student_details?.nic}</div>
                                            </TableCell>
                                            <TableCell className="py-4 font-mono font-bold text-orange-700">
                                                {assignment.student_details?.student_reg_no}
                                            </TableCell>
                                            <TableCell className="py-4 text-xs">
                                                <div className="font-bold text-orange-900">{assignment.panel_name}</div>
                                                <div className="text-muted-foreground">Assessor: {assignment.marks?.assessor_name || "Unknown"}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="text-xl font-black text-orange-600">{assignment.marks?.total_mark}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="destructive" className="uppercase tracking-wider">
                                                    {assignment.marks?.evaluation_condition?.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {specialStatusStudents.length === 0 && (
                                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No special status students found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Student Details Dialog */}
            <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-purple-800 border-b pb-4 mb-2 flex items-center gap-2">
                            <FileText className="h-6 w-6" /> Assessment Details
                        </DialogTitle>
                        <DialogDescription>
                            Complete information for this student's assessment.
                        </DialogDescription>
                    </DialogHeader>

                    {viewingStudent && (
                        <div className="space-y-6">
                            {/* Essential Highlights */}
                            <div className="bg-purple-50 border border-purple-100 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider text-purple-600 font-bold mb-1">Student Name (Initials)</h4>
                                    <p className="text-xl font-bold text-gray-900">{viewingStudent.initials_name}</p>
                                    <p className="text-sm text-muted-foreground">{viewingStudent.full_name}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider text-purple-600 font-bold mb-1">Registration Numbers</h4>
                                    <p className="text-lg font-mono text-purple-800 font-bold">{viewingStudent.student_reg_no}</p>
                                    {viewingStudent.admin_reg_number && (
                                        <p className="text-sm font-mono text-blue-700">Uni No: {viewingStudent.admin_reg_number}</p>
                                    )}
                                </div>
                                <div className="md:col-span-2 border-t border-purple-200/50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs uppercase tracking-wider text-purple-600 font-bold mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> Training Establishment</h4>
                                        <p className="text-base font-medium text-gray-900">{viewingStudent.training_establishment}</p>
                                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-tight font-semibold">Address:</p>
                                        <p className="text-sm text-gray-600 leading-relaxed">{viewingStudent.training_address}</p>
                                        {viewingStudent.training_district && (
                                            <p className="text-xs text-muted-foreground italic mt-1">{viewingStudent.training_district} District</p>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-xs uppercase tracking-wider text-purple-600 font-bold mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Training Period</h4>
                                        <p className="text-base font-medium text-gray-900">{viewingStudent.training_duration}</p>
                                        <p className="text-sm text-gray-600">{viewingStudent.training_start_date} <span className="mx-2 text-purple-300">→</span> {viewingStudent.training_end_date}</p>

                                        <div className="mt-4 p-2 bg-white/50 rounded border border-purple-100/50">
                                            <p className="text-[10px] uppercase font-bold text-purple-400">Field of Training</p>
                                            <p className="text-xs font-semibold">{viewingStudent.field_of_training || "Not Specified"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-4">
                                {/* Left Column */}
                                <div className="space-y-8">
                                    <section>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-l-4 border-purple-500 pl-3 mb-4">Academic Background</h3>
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">University</span>
                                                <span className="font-semibold text-right">{viewingStudent.university}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">Course/Subject</span>
                                                <span className="font-medium text-right">{viewingStudent.subject}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">Batch Year</span>
                                                <span className="font-medium">{viewingStudent.batch_year}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">Degree Level</span>
                                                <span className="font-medium">{viewingStudent.degree_nvq_level || "Degree"}</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-l-4 border-purple-500 pl-3 mb-4">Contact Information</h3>
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">Email Address</span>
                                                <span className="font-medium">{viewingStudent.email}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">Contact No</span>
                                                <span className="font-medium text-purple-700">{viewingStudent.contact_number || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">NIC Number</span>
                                                <span className="font-mono">{viewingStudent.nic}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">Gender</span>
                                                <span className="font-medium">{viewingStudent.gender || "Not Specified"}</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-8">
                                    <section>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-l-4 border-blue-500 pl-3 mb-4">Training Supervision</h3>
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                                <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Officer In Charge (Establishment)</p>
                                                <p className="font-bold">{viewingStudent.officer_in_charge || "Unassigned"}</p>
                                                <p className="text-xs text-muted-foreground">Officer In Charge</p>
                                                <p className="text-xs font-mono mt-1 text-blue-700">{viewingStudent.officer_in_charge_contact || "N/A"}</p>
                                            </div>

                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Head Office</p>
                                                <p className="font-bold">{viewingStudent.head_office_name || "Not Specified"}</p>
                                                <p className="text-xs text-muted-foreground">{viewingStudent.head_office_designation || "Authorized Officer"}</p>
                                                <p className="text-xs font-mono mt-1">{viewingStudent.head_office_phone || "N/A"}</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-l-4 border-blue-500 pl-3 mb-4">Location & Logistics</h3>
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            <div className="flex flex-col gap-1 border-b border-gray-50 pb-2">
                                                <span className="text-muted-foreground">Permanent Address</span>
                                                <span className="text-xs leading-relaxed">{viewingStudent.permanent_address || "Not Provided"}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">Divisional Secretariat</span>
                                                <span className="font-medium">{viewingStudent.divisional_secretariat || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-muted-foreground">Training District</span>
                                                <span className="font-medium">{viewingStudent.training_district || "N/A"}</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Panel Dialog */}
            <Dialog open={showCreatePanel} onOpenChange={setShowCreatePanel}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-purple-800">
                            {editingPanelId ? "Edit Viva Panel" : "Create Viva Panel"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPanelId ? "Update the details for this viva panel." : "Set up a new panel for assessments. Group students by day and assessor."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/20 rounded-md border border-purple-100">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-purple-700 font-bold">University</Label>
                                <Select value={newPanel.university || "ALL"} onValueChange={(v) => setNewPanel({ ...newPanel, university: v === "ALL" ? "" : v })} disabled={!!navPath.university && !editingPanelId}>
                                    <SelectTrigger className="h-8 text-xs border-purple-200">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Universities</SelectItem>
                                        {uniqueUniversities.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-purple-700 font-bold">Batch Year</Label>
                                <Select value={newPanel.batch_year || "ALL"} onValueChange={(v) => setNewPanel({ ...newPanel, batch_year: v === "ALL" ? "" : v })} disabled={!!navPath.year && !editingPanelId}>
                                    <SelectTrigger className="h-8 text-xs border-purple-200">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Batches</SelectItem>
                                        {uniqueBatchYears.map(b => <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-purple-700 font-bold">Subject</Label>
                                <Select value={newPanel.subject || "ALL"} onValueChange={(v) => setNewPanel({ ...newPanel, subject: v === "ALL" ? "" : v })} disabled={!!navPath.subject && !editingPanelId}>
                                    <SelectTrigger className="h-8 text-xs border-purple-200">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Subjects</SelectItem>
                                        {uniqueSubjects.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Panel Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Panel 01"
                                value={newPanel.name}
                                onChange={e => setNewPanel({ ...newPanel, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Viva Dates </Label>
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    value={tempDate}
                                    onChange={e => setTempDate(e.target.value)}
                                    disabled={newPanel.dates.length >= 10}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={!tempDate || newPanel.dates.length >= 10 || newPanel.dates.includes(tempDate)}
                                    onClick={() => {
                                        if (tempDate && !newPanel.dates.includes(tempDate) && newPanel.dates.length < 10) {
                                            setNewPanel({ ...newPanel, dates: [...newPanel.dates, tempDate].sort() });
                                            setTempDate("");
                                        }
                                    }}
                                >
                                    <Plus className="w-4 h-4" /> Add
                                </Button>
                            </div>
                            {newPanel.dates.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {newPanel.dates.map(date => (
                                        <Badge key={date} variant="secondary" className="flex items-center gap-1 pr-1">
                                            {date}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 ml-1 hover:bg-transparent text-muted-foreground hover:text-red-500"
                                                onClick={() => setNewPanel({ ...newPanel, dates: newPanel.dates.filter(d => d !== date) })}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {newPanel.dates.length >= 10 && (
                                <p className="text-xs text-muted-foreground">Maximum of 10 dates allowed.</p>
                            )}
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Assign Assessor</Label>
                            <Popover open={openAssessorDropdown} onOpenChange={setOpenAssessorDropdown}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openAssessorDropdown}
                                        className="w-full justify-between border-gray-300 focus:border-purple-500 font-normal"
                                    >
                                        {newPanel.assessor
                                            ? assessors.find((a) => a.id.toString() === newPanel.assessor)?.name
                                            : "Search and select assessor..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search assessor by name..." />
                                        <CommandList>
                                            <CommandEmpty>No assessor found.</CommandEmpty>
                                            <CommandGroup>
                                                {assessors.map((a) => (
                                                    <CommandItem
                                                        key={a.id}
                                                        value={a.name}
                                                        onSelect={() => {
                                                            setNewPanel({ ...newPanel, assessor: a.id.toString() });
                                                            setOpenAssessorDropdown(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                newPanel.assessor === a.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {a.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loc">Location (Optional)</Label>
                            <Input
                                id="loc"
                                placeholder="Physical address or Zoom link"
                                value={newPanel.location}
                                onChange={e => setNewPanel({ ...newPanel, location: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 border-t pt-4 mt-2">
                            <Label className="flex justify-between items-center text-purple-800 font-bold">
                                <span>Marking Criteria</span>
                                {criteriaSum !== 100 && (
                                    <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded border border-orange-100 flex items-center gap-1 animate-in fade-in zoom-in-95">
                                        Total: {criteriaSum} (Recommended: 100)
                                    </span>
                                )}
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 text-xs" 
                                    onClick={() => setNewPanel(prev => ({ ...prev, marking_criteria: [...prev.marking_criteria, { name: "", max: 100 }] }))}
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add Field
                                </Button>
                            </Label>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                {newPanel.marking_criteria.map((criteria, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <Input
                                            placeholder="Field Name"
                                            value={criteria.name}
                                            onChange={e => {
                                                const newCriteria = [...newPanel.marking_criteria];
                                                newCriteria[index].name = e.target.value;
                                                setNewPanel({ ...newPanel, marking_criteria: newCriteria });
                                            }}
                                            className="text-sm h-8"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            value={criteria.max}
                                            onChange={e => {
                                                const newCriteria = [...newPanel.marking_criteria];
                                                newCriteria[index].max = parseInt(e.target.value) || 0;
                                                setNewPanel({ ...newPanel, marking_criteria: newCriteria });
                                            }}
                                            className="w-20 text-sm h-8"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 shrink-0"
                                            onClick={() => {
                                                const newCriteria = newPanel.marking_criteria.filter((_, i) => i !== index);
                                                setNewPanel({ ...newPanel, marking_criteria: newCriteria });
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {newPanel.marking_criteria.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">No criteria defined. Please add at least one.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={() => { setShowCreatePanel(false); setTempDate(""); setEditingPanelId(null); }}>Cancel</Button>
                        <Button onClick={handleCreatePanel} className="bg-purple-600 hover:bg-purple-700">
                            {editingPanelId ? "Update Panel" : "Create Panel"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
