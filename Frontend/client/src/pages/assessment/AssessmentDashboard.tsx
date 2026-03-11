import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    ArrowLeft, Search, Building2, Calendar, FileText, ChevronRight, Hash, Eye,
    Home, School, MapPin, BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import axios from "axios";
import { Badge } from "@/components/ui/badge";

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

type NavLevel = 'years' | 'universities' | 'districts' | 'subjects' | 'list';

export default function AssessmentDashboard() {
    const { currentUser } = useStore();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [students, setStudents] = useState<StudentSubmission[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [viewingStudent, setViewingStudent] = useState<StudentSubmission | null>(null);

    const [navPath, setNavPath] = useState<{
        year?: string;
        university?: string;
        district?: string;
        subject?: string;
    }>({});

    useEffect(() => {
        if (currentUser?.role) fetchData();
    }, [currentUser]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/student-submissions/');
            const completed = res.data.filter((s: StudentSubmission) => s.is_agreement_sent === true);
            setStudents(completed);
        } catch (error) {
            console.error(error);
            toast({ title: "Error fetching data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

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
        if (!search) return filteredStudents;
        return filteredStudents.filter(s =>
            s.initials_name.toLowerCase().includes(search.toLowerCase()) ||
            s.student_reg_no.toLowerCase().includes(search.toLowerCase()) ||
            s.training_establishment.toLowerCase().includes(search.toLowerCase())
        );
    }, [filteredStudents, search]);

    return (
        <div className="space-y-6 animate-in fade-in pb-12">
            {/* Header */}
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
            </div>

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

            {/* List View */}
            {currentLevel === 'list' && (
                <Card className="min-h-[600px] border-t-4 border-t-purple-600 shadow-sm animate-in zoom-in-95 duration-200">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                            <div>
                                <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
                                    <FileText className="h-5 w-5" /> Completed Students
                                </CardTitle>
                                <CardDescription>
                                    Total {filteredStudents.length} student(s) ready for assessment.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-64">
                                <div className="relative w-full">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
                                    <Input
                                        placeholder="Search by Name, Reg No, or Place"
                                        className="pl-9 h-10 bg-white shadow-sm border-border/50 focus-visible:ring-purple-200"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    {displayStudents.length > 0 && search && (
                                        <Badge className="absolute right-2 top-2 h-6 text-[10px] bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">
                                            {displayStudents.length}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20">
                                    <TableHead className="pl-6">Student Information</TableHead>
                                    <TableHead>Registration Details</TableHead>
                                    <TableHead>Training Details</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayStudents.map(student => (
                                    <TableRow key={student.id} className="hover:bg-purple-50/30">
                                        <TableCell className="pl-6">
                                            <div className="font-semibold text-base text-foreground flex items-center gap-2">
                                                {student.initials_name}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                                <Hash className="h-3 w-3" /> {student.student_reg_no || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{student.university}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Batch: {student.batch_year}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                {student.training_establishment || "Not specified"}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Duration: {student.training_duration || "Not specified"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setViewingStudent(student)}
                                                className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-colors"
                                            >
                                                <Eye className="h-4 w-4 mr-2" /> View Full Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {displayStudents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                                            {loading ? "Loading data... " : "No students found match the current criteria."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

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
                            {/* Prominent Information Header */}
                            <div className="bg-purple-50 border border-purple-100 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider text-purple-600 font-bold mb-1">Student Name</h4>
                                    <p className="text-xl font-bold text-gray-900">{viewingStudent.initials_name}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider text-purple-600 font-bold mb-1">Student ID Number</h4>
                                    <p className="text-lg font-mono text-gray-800">{viewingStudent.student_reg_no}</p>
                                </div>
                                <div className="md:col-span-2 border-t border-purple-200/50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs uppercase tracking-wider text-purple-600 font-bold mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> Training Place</h4>
                                        <p className="text-base font-medium text-gray-900">{viewingStudent.training_establishment}</p>
                                        <p className="text-sm text-gray-600">{viewingStudent.training_address}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs uppercase tracking-wider text-purple-600 font-bold mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Training Duration</h4>
                                        <p className="text-base font-medium text-gray-900">{viewingStudent.training_duration}</p>
                                        <p className="text-sm text-gray-600">{viewingStudent.training_start_date} to {viewingStudent.training_end_date}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Information Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">University:</dt><dd className="col-span-2 font-medium">{viewingStudent.university}</dd></div>
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">Subject/Faculty:</dt><dd className="col-span-2">{viewingStudent.subject}</dd></div>
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">Degree/NVQ:</dt><dd className="col-span-2">{viewingStudent.degree_nvq_level}</dd></div>
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">Diploma Name:</dt><dd className="col-span-2">{viewingStudent.degree_diploma_name || "-"}</dd></div>
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">Batch Year:</dt><dd className="col-span-2">{viewingStudent.batch_year}</dd></div>
                                    </dl>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">Full Name:</dt><dd className="col-span-2">{viewingStudent.full_name}</dd></div>
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">NIC:</dt><dd className="col-span-2">{viewingStudent.nic}</dd></div>
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">Email:</dt><dd className="col-span-2 text-blue-600">{viewingStudent.email}</dd></div>
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">Contact:</dt><dd className="col-span-2">{viewingStudent.contact_number}</dd></div>
                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground font-medium">Gender:</dt><dd className="col-span-2">{viewingStudent.gender}</dd></div>
                                    </dl>
                                </div>

                                <div className="space-y-4 md:col-span-2">
                                    <h3 className="text-lg font-semibold border-b pb-2">Additional Training Details</h3>
                                    <dl className="space-y-2 text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Field of Training:</span>
                                            <span className="font-medium bg-muted px-2 py-1 rounded">{viewingStudent.field_of_training || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Officer In Charge:</span>
                                            <span className="font-medium">{viewingStudent.officer_in_charge} ({viewingStudent.officer_in_charge_contact || "-"})</span>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
