import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft, Plus, Copy, ExternalLink, CheckCircle2, XCircle,
    Search, Folder, ChevronRight, GraduationCap, MapPin, BookOpen,
    Calendar, Home, School, Trash2, Eye, FileText, Download, Mail, Send, Loader2
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { NovationRequestDialog } from "@/components/requests/NovationRequestDialog";

interface FormLink {
    is_active: boolean;
    id: string;
    university: string;
    subject: string;
    batch_year: string;
    district: string;
    created_at: string;
}

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

// Navigation Levels
type NavLevel = 'years' | 'universities' | 'districts' | 'subjects' | 'list';

export default function StudentDataDashboard() {
    const { currentUser } = useStore();
    const [activeTab, setActiveTab] = useState<'students' | 'links'>('students');
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Data
    const [links, setLinks] = useState<FormLink[]>([]);
    const [students, setStudents] = useState<StudentSubmission[]>([]);
    const [loading, setLoading] = useState(false);

    // Navigation State
    const [navPath, setNavPath] = useState<{
        year?: string;
        university?: string;
        district?: string;
        subject?: string;
    }>({});

    // Derived Search State for the final list
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (currentUser?.role) fetchData();
    }, [activeTab, currentUser]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'links' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'UNIVERSITY_COORDINATOR')) {
                const res = await axios.get('/api/student-links/');
                setLinks(res.data);
            } else {
                const res = await axios.get('/api/student-submissions/');
                setStudents(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = (id: string) => {
        const url = `${window.location.origin}/collect-data/${id}`;
        navigator.clipboard.writeText(url);
        toast({ title: "Link Copied", description: "URL copied to clipboard." });
    };

    const toggleChecked = async (student: StudentSubmission) => {
        if (currentUser?.role !== 'ADMIN') return;

        try {
            const newVal = !student.checked_ok;
            await axios.patch(`/api/student-submissions/${student.id}/`, { checked_ok: newVal });
            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, checked_ok: newVal } : s));
            toast({ title: newVal ? "Marked as Checked" : "Marked as Pending", variant: "default" });
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    const updateRegNo = async (student: StudentSubmission, val: string) => {
        if (currentUser?.role !== 'ADMIN') return;
        try {
            await axios.patch(`/api/student-submissions/${student.id}/`, { admin_reg_number: val });
            toast({ title: "Reg No Updated" });
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    }

    // --- Drill Down Logic ---

    // 1. Filter students based on current path
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (navPath.year && s.batch_year !== navPath.year) return false;
            if (navPath.university && s.university !== navPath.university) return false;
            if (navPath.district && s.district !== navPath.district) return false;
            if (navPath.subject && s.subject !== navPath.subject) return false;
            return true;
        });
    }, [students, navPath]);

    // 2. Determine Current View Level
    const currentLevel: NavLevel = useMemo(() => {
        if (!navPath.year) return 'years';
        if (!navPath.university) return 'universities';
        if (!navPath.district) return 'districts';
        if (!navPath.subject) return 'subjects';
        return 'list';
    }, [navPath]);

    // 3. Get Items for the Card Grid
    const gridItems = useMemo(() => {
        const items = new Map<string, number>(); // Name -> Count
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

    // Handlers
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

    const LinkManagementView = () => (
        <div className="space-y-4">
            <div className="flex justify-end">
                {currentUser?.role === 'ADMIN' && <CreateLinkDialog onCreated={fetchData} />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {links.map((link: {
                    is_active: boolean;
                    google_form_url?: string;
                    university: string;
                    subject: string;
                    batch_year: string;
                    district: string;
                    id: string;
                }) => (
                    <Card key={link.id} className={`hover:shadow-md transition-shadow ${link.google_form_url ? 'border-l-4 border-l-blue-500' : ''}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base font-bold">{link.university}</CardTitle>
                                    {link.google_form_url && <Badge variant="secondary" className="mt-1 text-xs">Google Form</Badge>}
                                </div>
                                <Badge variant="outline">{link.batch_year}</Badge>
                            </div>
                            <CardDescription>{link.subject}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground mb-4">District: <span className="font-medium text-foreground">{link.district}</span></div>
                            <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" className="w-full" onClick={() => {
                                    const url = link.google_form_url || `${window.location.origin}/collect-data/${link.id}`;
                                    navigator.clipboard.writeText(url);
                                    toast({ title: "Link Copied", description: "URL copied to clipboard." });
                                }}>
                                    <Copy className="h-3 w-3 mr-2" /> Copy URL
                                </Button>
                                <Button size="sm" variant="ghost" className="px-2" onClick={() => window.open(link.google_form_url || `/collect-data/${link.id}`, '_blank')}>
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                            {!link.google_form_url && (
                                <p className="text-xs text-muted-foreground mt-2 text-center select-all font-mono">
                                    {link.id}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    const StudentListView = ({ openEdit, openNovation, isDownloadingExcel, isDownloadingZip, handleDownloadExcel, handleDownloadZip }: { openEdit: (s: StudentSubmission) => void, openNovation: (s: StudentSubmission) => void, isDownloadingExcel: boolean, isDownloadingZip: boolean, handleDownloadExcel: () => void, handleDownloadZip: () => void }) => {
        // Final Search Filter inside the list view
        const displayStudents = filteredStudents.filter(s =>
            s.full_name.toLowerCase().includes(search.toLowerCase()) ||
            s.nic.toLowerCase().includes(search.toLowerCase()) ||
            s.student_reg_no.toLowerCase().includes(search.toLowerCase())
        );


        return (
            <Card className="min-h-[600px]">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                        <div>
                            <CardTitle>Student Details</CardTitle>
                            <CardDescription>
                                {navPath.year} / {navPath.university} / {navPath.district} / {navPath.subject}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto mt-2 sm:mt-0 p-3 bg-muted/30 rounded-xl border border-border/50 backdrop-blur-sm">
                            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'UNIVERSITY_COORDINATOR') && (
                                <>
                                    <div className="flex flex-col gap-1 items-start mr-2">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Export Data</span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleDownloadExcel}
                                                disabled={isDownloadingExcel}
                                                title="Download filtered student details as Excel sheet"
                                                className="h-10 px-4 border-emerald-200/50 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all font-semibold shadow-sm bg-white"
                                            >
                                                {isDownloadingExcel ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <FileText className="h-4 w-4 mr-2 text-emerald-600" />
                                                )}
                                                {isDownloadingExcel ? "Processing..." : "Export Excel"}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleDownloadZip}
                                                disabled={isDownloadingZip || displayStudents.length === 0}
                                                title="Download all placement letters as a ZIP archive"
                                                className="h-10 px-4 border-blue-200/50 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all font-semibold shadow-sm bg-white"
                                            >
                                                {isDownloadingZip ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Folder className="h-4 w-4 mr-2 text-blue-600" />
                                                )}
                                                {isDownloadingZip ? "Zipping..." : "Letters ZIP"}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="h-10 w-px bg-border/50 mx-1 hidden sm:block" />
                                </>
                            )}
                            <div className="flex flex-col gap-1 items-start w-full sm:w-64">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Search Records</span>
                                <div className="relative w-full">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
                                    <Input
                                        placeholder="Search"
                                        className="pl-9 h-10 bg-white shadow-sm border-border/50 focus-visible:ring-primary/20"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    {displayStudents.length > 0 && (
                                        <Badge className="absolute right-2 top-2 h-6 text-[10px] bg-primary/10 text-primary border-none hover:bg-primary/10">
                                            {displayStudents.length} {displayStudents.length === 1 ? 'result' : 'results'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Checked</TableHead>
                                <TableHead>Reg No</TableHead>
                                <TableHead>Contract Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayStudents.map(student => (
                                <TableRow key={student.id} className={student.is_agreement_sent ? "bg-green-50/50" : ""}>
                                    <TableCell>
                                        <div className="font-medium">{student.full_name}</div>
                                        <div className="text-xs text-muted-foreground">{student.nic} | {student.student_reg_no}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{student.university}</div>
                                        <div className="text-xs text-muted-foreground">{student.subject} ({student.batch_year})</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={student.checked_ok ? "default" : "secondary"}>
                                            {student.checked_ok ? "Verified" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleChecked(student)}
                                            disabled={currentUser?.role !== 'ADMIN'}
                                            className={student.checked_ok ? "text-green-600" : "text-muted-foreground"}
                                        >
                                            {student.checked_ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        {currentUser?.role === 'ADMIN' ? (
                                            <Input
                                                className="h-8 w-32 font-mono text-center"
                                                defaultValue={student.admin_reg_number || ''}
                                                onBlur={(e) => updateRegNo(student, e.target.value)}
                                                placeholder="-"
                                            />
                                        ) : (
                                            <span className="text-sm font-mono">{student.admin_reg_number || '-'}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={student.is_agreement_sent ? "default" : "outline"} className={student.is_agreement_sent ? "bg-green-600" : ""}>
                                            {student.is_agreement_sent ? "Complete" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* PDF GENERATION BUTTON */}
                                            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'UNIVERSITY_COORDINATOR') && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(`/api/student-submissions/${student.id}/generate-letter/`, '_blank')}
                                                    className="gap-1"
                                                    title="Generate Placement Letter"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    <span className="hidden sm:inline">PDF</span>
                                                </Button>
                                            )}

                                            {/* Novation Request Button - Only for Coordinator */}
                                            {currentUser?.role === 'UNIVERSITY_COORDINATOR' && (
                                                <Button variant="outline" size="sm" onClick={() => openNovation(student)}>
                                                    Req. Novation
                                                </Button>
                                            )}

                                            {/* Finalize Contract Button - Only for Admin */}
                                            {currentUser?.role === 'ADMIN' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setFinalizingStudent(student)}
                                                    className={`gap-1 ${student.is_agreement_sent ? "border-green-200 text-green-700 hover:bg-green-50" : ""}`}
                                                    title="Finalize & Email Contract"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Finalize</span>
                                                </Button>
                                            )}

                                            {/* View Finalized Contract Button - For Admin and Coordinator */}
                                            {student.is_agreement_sent && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(student.finalized_agreement_form!, '_blank')}
                                                    className="gap-1 border-green-200 text-green-700 hover:bg-green-50"
                                                    title="View Finalized Contract"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Contract</span>
                                                </Button>
                                            )}

                                            {/* Edit/View Button - For all roles */}
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(student)}>
                                                {currentUser?.role === 'ADMIN' ? 'Edit' : 'View'}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {displayStudents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    };

    const [editingStudent, setEditingStudent] = useState<StudentSubmission | null>(null);
    const [novationStudent, setNovationStudent] = useState<StudentSubmission | null>(null);
    const [finalizingStudent, setFinalizingStudent] = useState<StudentSubmission | null>(null);

    // Download state lifted to parent to prevent StudentListView remounting on search state change
    const [isDownloadingZip, setIsDownloadingZip] = useState(false);
    const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

    const handleDownloadZip = async () => {
        const displayStudents = filteredStudents.filter(s =>
            s.full_name.toLowerCase().includes(search.toLowerCase()) ||
            s.nic.toLowerCase().includes(search.toLowerCase()) ||
            s.student_reg_no.toLowerCase().includes(search.toLowerCase())
        );
        if (displayStudents.length === 0) return;
        setIsDownloadingZip(true);
        try {
            const ids = displayStudents.map(s => s.id);
            const response = await axios.post('/api/student-submissions/download-letters-zip/', { ids }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'placement_letters.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast({ title: "Download Started", description: "Your ZIP file is being downloaded." });
        } catch (error) {
            console.error("ZIP download error", error);
            toast({ title: "Download Failed", description: "Could not generate ZIP.", variant: "destructive" });
        } finally {
            setIsDownloadingZip(false);
        }
    };

    const handleDownloadExcel = async () => {
        setIsDownloadingExcel(true);
        try {
            const response = await axios.get('/api/student-submissions/export_excel/', {
                responseType: 'blob',
                params: {
                    batch_year: navPath.year,
                    university: navPath.university,
                    district: navPath.district,
                    subject: navPath.subject
                }
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_submissions.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast({ title: "Download Started", description: "Your Excel file is being downloaded." });
        } catch (error) {
            console.error("Excel download error", error);
            toast({ title: "Download Failed", description: "Could not generate Excel file.", variant: "destructive" });
        } finally {
            setIsDownloadingExcel(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-12">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Student Data Management</h2>
                        <p className="text-muted-foreground">Manage student submissions and generated links.</p>
                    </div>
                </div>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'UNIVERSITY_COORDINATOR') && (
                    <div className="flex gap-2">
                        <Button
                            variant={activeTab === 'links' ? "default" : "outline"}
                            onClick={() => setActiveTab('links')}
                        >
                            Manage Links
                        </Button>
                        <Button
                            variant={activeTab === 'students' ? "default" : "outline"}
                            onClick={() => setActiveTab('students')}
                        >
                            View Students
                        </Button>
                    </div>
                )}
                {activeTab === 'students' && currentUser?.role === 'ADMIN' && (
                    <div className="flex gap-2">
                        <CreateStudentDialog onCreated={fetchData} />
                    </div>
                )}
            </div>

            {activeTab === 'links' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'UNIVERSITY_COORDINATOR') ? (
                <LinkManagementView />
            ) : (
                <div className="space-y-6">
                    {/* Breadcrumbs */}
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

                    {/* Drill-down Grid */}
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
                                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                                    No data available at this level.
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

                    {/* List View */}
                    {currentLevel === 'list' && (
                        <>
                            <StudentListView
                                openEdit={(s) => setEditingStudent(s)}
                                openNovation={(s) => setNovationStudent(s)}
                                isDownloadingExcel={isDownloadingExcel}
                                isDownloadingZip={isDownloadingZip}
                                handleDownloadExcel={handleDownloadExcel}
                                handleDownloadZip={handleDownloadZip}
                            />
                            <EditStudentDialog
                                student={editingStudent}
                                open={!!editingStudent}
                                onOpenChange={(open) => !open && setEditingStudent(null)}
                                onSuccess={() => {
                                    setEditingStudent(null);
                                    fetchData();
                                }}
                            />
                            <NovationRequestDialog
                                student={novationStudent}
                                open={!!novationStudent}
                                onOpenChange={(open) => !open && setNovationStudent(null)}
                                onSuccess={() => {
                                    setNovationStudent(null);
                                    // optional: refresh
                                }}
                            />
                            <AgreementFormDialog
                                student={finalizingStudent}
                                open={!!finalizingStudent}
                                onOpenChange={(open) => !open && setFinalizingStudent(null)}
                                onSuccess={() => {
                                    setFinalizingStudent(null);
                                    fetchData();
                                }}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function EditStudentDialog({ student, open, onOpenChange, onSuccess }: { student: StudentSubmission | null, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const { currentUser } = useStore();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    if (!student) return null;

    const isAdmin = currentUser?.role === 'ADMIN';

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isAdmin) return;

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await axios.patch(`/api/student-submissions/${student.id}/`, data);
            toast({ title: "Student Updated", description: "Changes saved successfully." });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: "Update Failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        if (!confirm("Are you sure you want to delete this student record? This action cannot be undone.")) return;

        setLoading(true);
        try {
            await axios.delete(`/api/student-submissions/${student.id}/`);
            toast({ title: "Student Deleted", description: "Record removed successfully." });
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: "Delete Failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const FileLink = ({ label, fileUrl, highlight }: { label: string, fileUrl: string | null, highlight?: boolean }) => {
        if (!fileUrl) return null;
        return (
            <div className={`flex items-center justify-between p-3 border rounded-md ${highlight ? 'bg-green-50 border-green-200' : 'bg-muted/20'}`}>
                <div className="flex items-center gap-3">
                    <FileText className={`h-5 w-5 ${highlight ? 'text-green-600' : 'text-primary'}`} />
                    <span className={`text-sm font-medium ${highlight ? 'text-green-700' : ''}`}>{label}</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')} className={highlight ? 'border-green-200 text-green-700 hover:bg-green-100' : ''}>
                        <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isAdmin ? "Edit Student Details" : "Student Details"}</DialogTitle>
                    <DialogDescription>
                        {isAdmin ? "Make changes to the student's submission." : "View student submission details."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2"><div className="w-1 h-5 bg-primary rounded-full" /> Personal Information</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <Label>Full Name (Block Letters)</Label>
                                <Input name="full_name" defaultValue={student.full_name} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <Label>Name with Initials</Label>
                                <Input name="initials_name" defaultValue={student.initials_name} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>NIC</Label>
                                <Input name="nic" defaultValue={student.nic} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select name="gender" defaultValue={student.gender} disabled={!isAdmin} required>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input name="email" type="email" defaultValue={student.email} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Number</Label>
                                <Input name="contact_number" defaultValue={student.contact_number} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Permanent Address</Label>
                                <Input name="permanent_address" defaultValue={student.permanent_address} readOnly={!isAdmin} required />
                            </div>
                        </div>
                    </div>

                    {/* Academic Information */}
                    <div className="border-t pt-4 space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2"><div className="w-1 h-5 bg-primary rounded-full" /> Academic Information</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Student Reg No</Label>
                                <Input name="student_reg_no" defaultValue={student.student_reg_no} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Admin Reg No</Label>
                                <Input name="admin_reg_number" defaultValue={student.admin_reg_number || ''} readOnly={!isAdmin} placeholder="-" />
                            </div>
                            <div className="space-y-2">
                                <Label>Degree/NVQ Level</Label>
                                <Input name="degree_nvq_level" defaultValue={student.degree_nvq_level} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <Label>Degree/Diploma Name</Label>
                                <Input name="degree_diploma_name" defaultValue={student.degree_diploma_name} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>University</Label>
                                <Input name="university" defaultValue={student.university} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Input name="subject" defaultValue={student.subject} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Batch Year</Label>
                                <Input name="batch_year" defaultValue={student.batch_year} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>District</Label>
                                <Input name="district" defaultValue={student.district} readOnly={!isAdmin} required />
                            </div>
                        </div>
                    </div>

                    {/* Training Details */}
                    <div className="border-t pt-4 space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2"><div className="w-1 h-5 bg-primary rounded-full" /> Training Details</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Training Establishment Name</Label>
                                <Input name="training_establishment" defaultValue={student.training_establishment} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Training Address</Label>
                                <Input name="training_address" defaultValue={student.training_address} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Training District</Label>
                                <Input name="training_district" defaultValue={student.training_district} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Divisional Secretariat</Label>
                                <Input name="divisional_secretariat" defaultValue={student.divisional_secretariat} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Officer In Charge (OIC)</Label>
                                <Input name="officer_in_charge" defaultValue={student.officer_in_charge} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Field of Training</Label>
                                <Input name="field_of_training" defaultValue={student.field_of_training} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Select OIC Contact</Label>
                                <Input name="officer_in_charge_contact" defaultValue={student.officer_in_charge_contact || ''} readOnly={!isAdmin} />
                            </div>
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input name="training_start_date" type="date" defaultValue={student.training_start_date} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input name="training_end_date" type="date" defaultValue={student.training_end_date} readOnly={!isAdmin} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Duration</Label>
                                <Input name="training_duration" defaultValue={student.training_duration} readOnly={!isAdmin} required />
                            </div>
                        </div>
                    </div>

                    {/* Head Office Information */}
                    <div className="border-t pt-4 space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2"><div className="w-1 h-5 bg-primary rounded-full" /> Head Office Information</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <Label>Name of the Training Establishment (Head Office)</Label>
                                <Input name="head_office_name" defaultValue={student.head_office_name || ''} readOnly={!isAdmin} />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <Label>Designation of Authorized Officer (Head Office)</Label>
                                <Input name="head_office_designation" defaultValue={student.head_office_designation || ''} readOnly={!isAdmin} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Address of the Training Establishment (Head Office)</Label>
                                <Input name="head_office_address" defaultValue={student.head_office_address || ''} readOnly={!isAdmin} />
                            </div>
                            <div className="space-y-2">
                                <Label>E-mail Address (Head Office)</Label>
                                <Input name="head_office_email" type="email" defaultValue={student.head_office_email || ''} readOnly={!isAdmin} />
                            </div>
                            <div className="space-y-2">
                                <Label>Telephone Number (Head Office)</Label>
                                <Input name="head_office_phone" defaultValue={student.head_office_phone || ''} readOnly={!isAdmin} />
                            </div>
                        </div>
                    </div>

                    {/* Extra Fields */}
                    {isAdmin && (
                        <div className="border-t pt-4 space-y-4">
                            <Label className="text-base font-semibold flex items-center gap-2"><div className="w-1 h-5 bg-primary rounded-full" /> Extra Information</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Column 1</Label>
                                    <Input name="column_1" defaultValue={student.column_1 || ''} readOnly={!isAdmin} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <Label className="mb-3 block text-base">Uploaded Documents</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FileLink label="NIC Copy" fileUrl={student.nic_copy} />
                            <FileLink label="Agreement Form" fileUrl={student.agreement_form} />
                            <FileLink label="Work Site Form" fileUrl={student.work_site_form} />
                            <FileLink label="Placement Letter" fileUrl={student.placement_letter} />
                            {student.finalized_agreement_form && (
                                <FileLink label="Finalized Contract" fileUrl={student.finalized_agreement_form} highlight />
                            )}
                            {(!student.nic_copy && !student.agreement_form && !student.work_site_form && !student.placement_letter && !student.finalized_agreement_form) && (
                                <p className="text-sm text-muted-foreground col-span-2">No documents uploaded.</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between items-center gap-2">
                        {isAdmin ? (
                            <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={loading}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                        ) : <div />}

                        <div className="flex gap-2">
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Close</Button>
                            {isAdmin && <Button type="submit" disabled={loading}>Save Changes</Button>}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CreateLinkDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const { toast } = useToast();
    const [useGoogleForm, setUseGoogleForm] = useState(false);

    // Fetch users (coordinators)
    useEffect(() => {
        if (open) {
            axios.get('/api/management/users/').then(res => {
                setUsers(res.data.filter((u: any) => u.role === 'UNIVERSITY_COORDINATOR'));
            }).catch(e => console.error(e));
        }
    }, [open]);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            await axios.post('/api/student-links/', {
                university: formData.get('university'),
                subject: formData.get('subject'),
                batch_year: formData.get('batch_year'),
                district: formData.get('district'),
                assigned_coordinator: formData.get('assigned_coordinator') || null,
                google_form_url: useGoogleForm ? formData.get('google_form_url') : null,
            });
            onCreated();
            setOpen(false);
            toast({ title: "Link Created" });
        } catch (err) {
            console.error(err);
            toast({ title: "Failed to create link", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    // Default districts
    const districts = [
        "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota",
        "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
        "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Monaragala", "Ratnapura", "Kegalle"
    ];

    const [selectedUni, setSelectedUni] = useState("");

    const filteredCoordinators = users.filter(u =>
        !selectedUni || u.university?.toLowerCase().includes(selectedUni.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> New Form Link</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Collection Link</DialogTitle>
                    <DialogDescription>Generate a new link or share a Google Form.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">

                    {/* Link Type Toggle */}
                    <div className="flex items-center space-x-2 pb-2">
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="google-mode">Use Google Form Link</Label>
                            <Button
                                type="button"
                                variant={useGoogleForm ? "default" : "outline"}
                                onClick={() => setUseGoogleForm(!useGoogleForm)}
                                size="sm"
                            >
                                {useGoogleForm ? "Enabled" : "Disabled"}
                            </Button>
                        </div>
                    </div>

                    {useGoogleForm && (
                        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <Label className="text-blue-900">Google Form URL</Label>
                            <Input
                                name="google_form_url"
                                required={useGoogleForm}
                                placeholder="https://docs.google.com/forms/..."
                                className="bg-white"
                            />
                            <p className="text-xs text-blue-700">
                                This link will be shown to the coordinator instead of the standard SIT form.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Batch Year</Label>
                            <Input name="batch_year" required placeholder="e.g. 2024/2025" />
                        </div>
                        <div className="space-y-2">
                            <Label>District</Label>
                            <Select name="district" required defaultValue="Colombo">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>University</Label>
                        <Input
                            name="university"
                            required
                            placeholder="e.g. University of Colombo"
                            onChange={(e) => setSelectedUni(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Subject / Degree</Label>
                        <Input name="subject" required placeholder="e.g. BSc in Computer Science" />
                    </div>

                    <div className="space-y-2">
                        <Label>Assign Coordinator (Optional)</Label>
                        <Select name="assigned_coordinator">
                            <SelectTrigger><SelectValue placeholder="Select Coordinator" /></SelectTrigger>
                            <SelectContent>
                                {filteredCoordinators.map(u => (
                                    <SelectItem key={u.id} value={u.id.toString()}>
                                        {u.name || u.email} ({u.university})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Listing coordinators matching the university above.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {useGoogleForm ? "Save Google Link" : "Generate Link"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CreateStudentDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await axios.post('/api/student-submissions/', formData);
            toast({ title: "Student Created", description: "New student record added." });
            setOpen(false);
            onCreated();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || "Failed to create student.";
            toast({ title: "Creation Failed", description: msg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>Manually add a student record.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name (Block Letters)</Label>
                            <Input name="full_name" required placeholder="AMARASINGHE..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Name with Initials</Label>
                            <Input name="initials_name" required placeholder="A.B.C. Perera" />
                        </div>
                        <div className="space-y-2">
                            <Label>NIC</Label>
                            <Input name="nic" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input name="contact_number" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select name="gender" required>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Permanent Address</Label>
                            <Input name="permanent_address" required />
                        </div>

                        <div className="col-span-2 border-t pt-2 mt-2">
                            <Label className="text-base font-semibold">Academic Context</Label>
                        </div>
                        <div className="space-y-2">

                            <Label>University</Label>
                            <Input name="university" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input name="subject" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Batch Year</Label>
                            <Input name="batch_year" required placeholder="2024/2025" />
                        </div>
                        <div className="space-y-2">
                            <Label>District</Label>
                            <Input name="district" required />
                        </div>

                        <div className="space-y-2">
                            <Label>Student Reg No</Label>
                            <Input name="student_reg_no" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Degree/NVQ Level</Label>
                            <Input name="degree_nvq_level" required defaultValue="Degree" />
                        </div>
                        <div className="space-y-2">
                            <Label>Degree/Diploma Name</Label>
                            <Input name="degree_diploma_name" required />
                        </div>

                        <div className="col-span-2 border-t pt-2 mt-2">
                            <Label className="text-base font-semibold">Training Details</Label>
                        </div>

                        <div className="space-y-2">
                            <Label>Training Establishment</Label>
                            <Input name="training_establishment" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Training Address</Label>
                            <Input name="training_address" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Training District</Label>
                            <Input name="training_district" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Divisional Secretariat</Label>
                            <Input name="divisional_secretariat" required />
                        </div>
                        <div className="space-y-2">
                            <Label>OIC Name</Label>
                            <Input name="officer_in_charge" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Field of Training</Label>
                            <Input name="field_of_training" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input name="training_start_date" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input name="training_end_date" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Duration</Label>
                            <Input name="training_duration" required defaultValue="6 Months" />
                        </div>

                        <div className="col-span-2 border-t pt-2 mt-2">
                            <Label className="text-base font-semibold">Head Office Information</Label>
                        </div>

                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label>Name of the Training Establishment (Head Office)</Label>
                            <Input name="head_office_name" />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label>Designation of Authorized Officer (Head Office)</Label>
                            <Input name="head_office_designation" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Address of the Training Establishment (Head Office)</Label>
                            <Input name="head_office_address" />
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail Address (Head Office)</Label>
                            <Input name="head_office_email" type="email" />
                        </div>
                        <div className="space-y-2">
                            <Label>Telephone Number (Head Office)</Label>
                            <Input name="head_office_phone" />
                        </div>
                        <div className="space-y-2">
                            <Label>OIC Contact Number</Label>
                            <Input name="officer_in_charge_contact" />
                        </div>

                        <div className="col-span-2 border-t pt-2 mt-2">
                            <Label className="text-base font-semibold">Extra Information</Label>
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label>Column 1</Label>
                            <Input name="column_1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>Create Student</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AgreementFormDialog({ student, open, onOpenChange, onSuccess }: { student: StudentSubmission | null, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [signatureImg, setSignatureImg] = useState<File | null>(null);
    const { toast } = useToast();

    if (!student) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!signatureImg) {
            toast({ title: "Signature Required", description: "Please upload a signature/stamp image.", variant: "destructive" });
            return;
        }

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("signature_image", signatureImg);

        try {
            await axios.post(`/api/student-submissions/${student.id}/finalize-agreement/`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast({ title: "Contract Sent", description: "The finalized agreement has been emailed to the student." });
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.response?.data?.detail || "Could not finalize the agreement.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Finalize Training Contract</DialogTitle>
                    <DialogDescription>
                        Edit and send the finalized contract form to <strong>{student.full_name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Signature / Stamp Image</Label>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => e.target.files && setSignatureImg(e.target.files[0])}
                            />
                            {signatureImg ? (
                                <div className="text-center">
                                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium">{signatureImg.name}</p>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <Plus className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-sm">Click to upload signature image</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Signature Date</Label>
                        <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>

                    <div className="space-y-2">
                        <Label>Additional Remarks (Optional)</Label>
                        <Textarea
                            name="additional_text"
                            placeholder="Add any extra instructions or notes to appear on the contract..."
                            rows={4}
                        />
                    </div>

                    <div className="bg-muted/30 p-3 rounded-md text-xs text-muted-foreground">
                        <p>This will generate a PDF using the student's submission data, attach your signature and remarks, and email it directly to <strong>{student.email}</strong>.</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {loading ? "Sending..." : "Send Finalized Contract"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}