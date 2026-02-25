import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function CoordinatorRegistration() {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();

    const token = location.split("/").pop();

    const [loading, setLoading] = useState(true);
    const [validLink, setValidLink] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        university: "",
        faculty: "",
        department: "",
        designation: "",
        phone_number: "",
        whatsapp_number: ""
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setErrorMsg("Invalid link.");
            return;
        }

        axios.get(`/api/coordinator-invites/validate_token/?token=${token}`)
            .then(res => {
                setValidLink(true);
                if (res.data.whatsapp_number) {
                    setWhatsappNumber(res.data.whatsapp_number);
                    setFormData(prev => ({ ...prev, whatsapp_number: res.data.whatsapp_number }));
                }
            })
            .catch(err => {
                setValidLink(false);
                setErrorMsg(err.response?.data?.message || "Invalid or expired link.");
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.university) {
            toast({ title: "Missing Fields", description: "Name, Email and University are required.", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/api/coordinator-invites/register/', {
                token,
                ...formData
            });
            setSubmitted(true);
        } catch (err: any) {
            toast({
                title: "Submission Failed",
                description: err.response?.data?.message || "Could not submit your details. Please try again.",
                variant: "destructive"
            });
            setSubmitting(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Invalid Link ──────────────────────────────────────────────────────────
    if (!validLink) {
        return (
            <div className="flex h-screen items-center justify-center bg-muted/50">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-2">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-center text-destructive">Invalid Link</CardTitle>
                        <CardDescription className="text-center text-lg">{errorMsg}</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button onClick={() => setLocation("/login")}>Go to Login</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // ── Successfully Submitted ────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="flex h-screen items-center justify-center bg-muted/50 p-4">
                <Card className="max-w-md w-full shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-green-100 p-4 rounded-full mb-4 w-fit">
                            <Clock className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">Details Submitted!</CardTitle>
                        <CardDescription className="text-base mt-2 leading-relaxed">
                            Your registration details have been successfully submitted.<br /><br />
                            <strong>The admin will review your request</strong> and send your login credentials
                            to your email address once approved.<br /><br />
                            Please wait for the email before trying to log in.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => setLocation("/login")}>Go to Login Page</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // ── Registration Form ─────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-muted/30 py-10 px-4">
            <Card className="max-w-3xl mx-auto shadow-xl border-primary/20">
                <CardHeader className="text-center border-b bg-primary/5 pb-8">
                    <div className="mx-auto bg-green-100 p-3 rounded-full mb-4 w-fit">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">University Coordinator Registration</CardTitle>
                    <CardDescription>
                        Fill in your details below. The admin will review and send your login credentials via email.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 pt-8">

                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium border-b pb-2">Personal Details</h3>
                            <div className="space-y-2">
                                <Label>Full Name <span className="text-red-500">*</span></Label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Prof. John Doe"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email Address <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="email" required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@university.edu"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Designation</Label>
                                    <Input
                                        value={formData.designation}
                                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                        placeholder="e.g. Head of Department"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Number</Label>
                                    <Input
                                        value={formData.phone_number}
                                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder="e.g. 0712345678"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>WhatsApp Number</Label>
                                    <Input
                                        value={formData.whatsapp_number}
                                        onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                        placeholder="e.g. 94712345678"
                                    />
                                    {whatsappNumber && <p className="text-xs text-green-600">Pre-filled from invitation.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Institution Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium border-b pb-2">Institution Details</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>University Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        required
                                        value={formData.university}
                                        onChange={e => setFormData({ ...formData, university: e.target.value })}
                                        placeholder="e.g. University of Colombo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Faculty Name</Label>
                                    <Input
                                        value={formData.faculty}
                                        onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                                        placeholder="e.g. Faculty of Science"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Department Name</Label>
                                    <Input
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g. Department of Computer Science"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
                            <strong>What happens next?</strong><br />
                            After submitting, the admin will review your details and send your <strong>username &amp; password via email</strong>.
                        </div>

                    </CardContent>
                    <CardFooter className="justify-end bg-muted/20 p-6">
                        <Button size="lg" type="submit" disabled={submitting}>
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit Registration Request
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
