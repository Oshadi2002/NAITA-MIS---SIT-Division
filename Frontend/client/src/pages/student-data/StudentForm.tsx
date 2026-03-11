import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Schema
const studentFormSchema = z.object({
    // Personal
    full_name: z.string().min(2, "Full Name is required").regex(/^[A-Z\s]+$/, "Block Letters Only"),
    initials_name: z.string().min(2, "Name with Initials is required"),
    gender: z.string().min(1, "Gender is required"),
    nic: z.string().min(10, "Valid NIC is required"),
    email: z.string().email("Invalid email address"),
    contact_number: z.string().min(9, "Valid contact number is required"),
    permanent_address: z.string().min(5, "Address is required"),

    // Academic
    student_reg_no: z.string().min(2, "Registration Number is required"),
    degree_nvq_level: z.string().min(1, "Degree/NVQ Level is required"),
    degree_diploma_name: z.string().min(2, "Degree/Diploma Name is required"),

    // Training
    training_district: z.string().min(2, "District is required"),
    divisional_secretariat: z.string().min(2, "Secretariat is required"),
    training_establishment: z.string().min(2, "Establishment Name is required"),
    training_address: z.string().min(5, "Training Address is required"),
    officer_in_charge: z.string().min(2, "OIC Name is required"),
    training_start_date: z.string().min(1, "Start Date is required"),
    training_end_date: z.string().min(1, "End Date is required"),
    training_duration: z.string().min(1, "Duration is required"),
    field_of_training: z.string().min(2, "Field of Training is required"),

    // Head Office
    head_office_designation: z.string().optional(),
    head_office_name: z.string().optional(),
    head_office_address: z.string().optional(),
    head_office_email: z.string().email("Invalid email").optional().or(z.literal('')),
    head_office_phone: z.string().optional(),
    officer_in_charge_contact: z.string().optional(),

    // Files
    // For file inputs, we'll handle them manually or use a refined schema if using a wrapper
    // We'll treat them as required in the UI logic
});

export default function StudentForm() {
    const [match, params] = useRoute("/collect-data/:hash");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [validLink, setValidLink] = useState(false);
    const [linkData, setLinkData] = useState<any>(null);
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        nic_copy: null,
        agreement_form: null,
        work_site_form: null,
        placement_letter: null,
    });
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const form = useForm<z.infer<typeof studentFormSchema>>({
        resolver: zodResolver(studentFormSchema),
        defaultValues: {
            gender: "",
            training_duration: "6 Months", // Default
        },
    });

    // Fetch Link Data
    useEffect(() => {
        if (params?.hash) {
            axios.get(`/api/student-links/validate/?hash=${params.hash}`)
                .then(res => {
                    if (res.data.valid) {
                        setValidLink(true);
                        setLinkData(res.data);
                    } else {
                        setValidLink(false);
                    }
                })
                .catch(() => setValidLink(false))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
            setValidLink(false);
        }
    }, [params?.hash]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [fieldName]: e.target.files![0] }));
        }
    };

    const onSubmit = async (values: z.infer<typeof studentFormSchema>) => {
        // Validate Files
        const requiredFiles = ['nic_copy', 'agreement_form', 'work_site_form', 'placement_letter'];
        const missingFiles = requiredFiles.filter(f => !files[f]);

        if (missingFiles.length > 0) {
            toast({
                title: "Missing Files",
                description: `Please upload all required documents: ${missingFiles.join(', ')}`,
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        // Append JSON fields
        Object.entries(values).forEach(([key, value]) => formData.append(key, value));

        // Append Link Data
        formData.append('form_link_id', params!.hash);

        // Append Files
        Object.entries(files).forEach(([key, file]) => {
            if (file) formData.append(key, file);
        });

        try {
            await axios.post('/api/student-submissions/', formData);
            toast({
                title: "Submission Successful!",
                description: "Your data has been recorded. You can now download your receipt.",
                variant: "default", // Success green
            });
            // Redirect or Show Success State
            // For now, simpler to Replace the View
            setValidLink(false); // Hide form
            setLinkData({ ...linkData, submitted: true }); // Hack to show success
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.response?.data?.detail || "An error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (linkData?.submitted) {
        return (
            <div className="container max-w-lg mx-auto py-12 text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h1 className="text-3xl font-bold">Submission Received!</h1>
                <p className="text-muted-foreground">Thank you. Your details have been securely recorded.</p>
                <Button onClick={() => window.print()} variant="outline" className="mt-4">Download Receipt (Print)</Button>
            </div>
        );
    }

    if (!validLink) {
        return (
            <div className="container max-w-lg mx-auto py-12 text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
                <h1 className="text-2xl font-bold">Invalid or Expired Link</h1>
                <p className="text-muted-foreground">This link is no longer valid or does not exist. Please contact your coordinator.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-primary">Student Placement Data Collection</h1>
                    <p className="text-muted-foreground">Please fill out all details accurately. Block letters required for Full Name.</p>
                </div>

                <Card className="border-t-4 border-t-primary shadow-lg">
                    <CardHeader className="bg-muted/20">
                        <CardTitle>Context Information</CardTitle>
                        <CardDescription>These details are automatically captured from your link.</CardDescription>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                            <div className="p-3 bg-white rounded border">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">University</span>
                                <p className="font-bold">{linkData.university}</p>
                            </div>
                            <div className="p-3 bg-white rounded border">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Subject/Degree</span>
                                <p className="font-bold">{linkData.subject}</p>
                            </div>
                            <div className="p-3 bg-white rounded border">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Batch Year</span>
                                <p className="font-bold">{linkData.batch_year}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><div className="w-1 h-6 bg-primary rounded-full" /> Personal Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="initials_name" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Name with Initials</FormLabel>
                                                <FormControl><Input placeholder="e.g. A.B.C. Perera" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="full_name" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Full Name (Block Letters)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. AMARASINGHE BUWANEKA CHARITH PERERA"
                                                        className="uppercase"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e.target.value.toUpperCase());
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="gender" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="nic" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>NIC Number</FormLabel>
                                                <FormControl><Input placeholder="National Identity Card No" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="contact_number" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contact Number</FormLabel>
                                                <FormControl><Input placeholder="07XXXXXXXX" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="permanent_address" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Permanent Address</FormLabel>
                                                <FormControl><Textarea placeholder="Full residential address" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <Separator />

                                {/* Academic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><div className="w-1 h-6 bg-primary rounded-full" /> Academic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="student_reg_no" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>University Registration Number</FormLabel>
                                                <FormControl><Input placeholder="Reg No" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="degree_nvq_level" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Degree / NVQ Level</FormLabel>
                                                <FormControl><Input placeholder="e.g. NVQ Level 6 / BSc" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="degree_diploma_name" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Degree / Diploma Name</FormLabel>
                                                <FormControl><Input placeholder="Full name of the program" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <Separator />

                                {/* Training Details */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><div className="w-1 h-6 bg-primary rounded-full" /> Training Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="training_establishment" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Training Establishment Name</FormLabel>
                                                <FormControl><Input placeholder="Company / Organization Name" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="training_address" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Training Address</FormLabel>
                                                <FormControl><Textarea placeholder="Location of training" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="training_district" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Training District</FormLabel>
                                                <FormControl><Input placeholder="District" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="divisional_secretariat" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Divisional Secretariat</FormLabel>
                                                <FormControl><Input placeholder="Secretariat Division" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="officer_in_charge" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Officer In Charge (OIC)</FormLabel>
                                                <FormControl><Input placeholder="Supervisor Name" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="field_of_training" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Field of Training</FormLabel>
                                                <FormControl><Input placeholder="e.g. Software Engineering" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="training_start_date" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Date</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="training_end_date" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Date</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="training_duration" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Duration</FormLabel>
                                                <FormControl><Input placeholder="e.g. 6 Months" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <Separator />

                                {/* Head Office Details */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><div className="w-1 h-6 bg-primary rounded-full" /> Head Office Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="head_office_name" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Name of the Training Establishment (Head Office)</FormLabel>
                                                <FormControl><Input placeholder="e.g. Central Engineering Service (Pvt) Ltd" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="head_office_designation" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Designation of the Authorized officer (Head Office)</FormLabel>
                                                <FormControl><Input placeholder="e.g. HR Manager" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="head_office_address" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Address of the Training Establishment (Head Office)</FormLabel>
                                                <FormControl><Textarea placeholder="Head Office Address" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="head_office_email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-mail Address (Head Office)</FormLabel>
                                                <FormControl><Input type="email" placeholder="head.office@example.com" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="head_office_phone" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telephone Number (Head Office)</FormLabel>
                                                <FormControl><Input placeholder="Phone Number" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="officer_in_charge_contact" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number of the Officer In-charge Work Site</FormLabel>
                                                <FormControl><Input placeholder="Phone Number" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <Separator />

                                {/* File Uploads */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><div className="w-1 h-6 bg-primary rounded-full" /> Document Uploads</h3>
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Important</AlertTitle>
                                        <AlertDescription>Please upload clear PDF or Image files for the following documents.</AlertDescription>
                                    </Alert>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FileUploadField
                                            label="NIC Copy (Both Sides)"
                                            name="nic_copy"
                                            file={files.nic_copy}
                                            onChange={handleFileChange}
                                        />
                                        <FileUploadField
                                            label="NAITA Training Contract Form"
                                            name="agreement_form"
                                            file={files.agreement_form}
                                            onChange={handleFileChange}
                                        />
                                        <FileUploadField
                                            label="NAITA Training Work Site Form"
                                            name="work_site_form"
                                            file={files.work_site_form}
                                            onChange={handleFileChange}
                                        />
                                        <FileUploadField
                                            label="NAITA Placement Letter"
                                            name="placement_letter"
                                            file={files.placement_letter}
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>

                                <CardFooter className="px-0 pt-6">
                                    <Button type="submit" size="lg" className="w-full text-lg" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {submitting ? 'Submitting...' : 'Submit Student Data'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function FileUploadField({ label, name, file, onChange }: { label: string, name: string, file: File | null, onChange: (e: any, name: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label} <span className="text-destructive">*</span></Label>
            <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${file ? 'bg-primary/5 border-primary' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                        {file ? (
                            <>
                                <CheckCircle2 className="w-8 h-8 mb-2 text-primary" />
                                <p className="text-sm font-medium text-primary line-clamp-1 px-4 text-center">{file.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-8 h-8 mb-2" />
                                <p className="text-sm">Click to upload or drag and drop</p>
                            </>
                        )}
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onChange(e, name)} />
                </label>
            </div>
        </div>
    )
}
