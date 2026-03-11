import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Clock, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function StaffRegistration() {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();

    const token = location.split("/").pop();

    const [loading, setLoading] = useState(true);
    const [validLink, setValidLink] = useState(false);
    const [inviteType, setInviteType] = useState<"ASSESSOR" | "INSPECTOR" | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [submitted, setSubmitted] = useState(false);

    // Common fields
    const [formData, setFormData] = useState({
        full_name: "",
        initials_name: "",
        permanent_address: "",
        phone_number: "",
        email: "",
        province: "",
        district: "",
        qualification: ""
    });

    // Option toggles
    const [isAlsoAssessor, setIsAlsoAssessor] = useState(false);

    // Assessor data
    const [paymentDetails, setPaymentDetails] = useState({
        account_number: "",
        bank_name: "",
        branch: ""
    });
    const [assessmentFields, setAssessmentFields] = useState<string[]>([]);
    const [newField, setNewField] = useState("");

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setErrorMsg("Invalid link.");
            return;
        }

        axios.get(`/api/staff-invites/validate_token/?token=${token}`)
            .then(res => {
                setValidLink(true);
                setInviteType(res.data.invite_type);
            })
            .catch(err => {
                setValidLink(false);
                setErrorMsg(err.response?.data?.message || "Invalid or expired link.");
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleAddField = () => {
        if (newField.trim() && !assessmentFields.includes(newField.trim())) {
            setAssessmentFields([...assessmentFields, newField.trim()]);
            setNewField("");
        }
    };

    const handleRemoveField = (fieldToRemove: string) => {
        setAssessmentFields(assessmentFields.filter(f => f !== fieldToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.full_name || !formData.email) {
            toast({ title: "Missing Fields", description: "Full Name and Email are required.", variant: "destructive" });
            return;
        }

        setSubmitting(true);

        const payload: any = {
            token,
            ...formData
        };

        const showAssessorFields = inviteType === "ASSESSOR" || (inviteType === "INSPECTOR" && isAlsoAssessor);

        if (showAssessorFields) {
            if (inviteType === "ASSESSOR") {
                payload.payment_details = paymentDetails;
                payload.assessment_fields = assessmentFields;
            } else if (inviteType === "INSPECTOR" && isAlsoAssessor) {
                payload.is_also_assessor = true;
                payload.assessor_data = {
                    payment_details: paymentDetails,
                    assessment_fields: assessmentFields
                };
            }
        }

        try {
            await axios.post('/api/staff-invites/register/', payload);
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
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">Registration Complete!</CardTitle>
                        <CardDescription className="text-base mt-2 leading-relaxed">
                            Your details have been successfully submitted and your account has been automatically created.<br /><br />
                            <strong>Please check your email.</strong> Your login credentials have been sent to you.<br />
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => setLocation("/login")}>Go to Login Page</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const roleName = inviteType === "ASSESSOR" ? "Assessor" : "Inspector";
    const showAssessorFields = inviteType === "ASSESSOR" || (inviteType === "INSPECTOR" && isAlsoAssessor);

    // ── Registration Form ─────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-muted/30 py-10 px-4">
            <Card className="max-w-3xl mx-auto shadow-xl border-primary/20">
                <CardHeader className="text-center border-b bg-primary/5 pb-8">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full mb-4 w-fit">
                        <CheckCircle2 className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">{roleName} Registration</CardTitle>
                    <CardDescription>
                        Fill in your details below to activate your {roleName.toLowerCase()} account.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 pt-8">

                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium border-b pb-2">Personal Details</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Full Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Name with Initials</Label>
                                    <Input
                                        value={formData.initials_name}
                                        onChange={e => setFormData({ ...formData, initials_name: e.target.value })}
                                        placeholder="J. Doe"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Permanent Address</Label>
                                    <Input
                                        value={formData.permanent_address}
                                        onChange={e => setFormData({ ...formData, permanent_address: e.target.value })}
                                        placeholder="No, Street, City"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="email" required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={formData.phone_number}
                                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder="0712345678"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Province</Label>
                                    <Input
                                        value={formData.province}
                                        onChange={e => setFormData({ ...formData, province: e.target.value })}
                                        placeholder="Western"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>District</Label>
                                    <Input
                                        value={formData.district}
                                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                                        placeholder="Colombo"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Qualification</Label>
                                    <Input
                                        value={formData.qualification}
                                        onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                                        placeholder="BSc. Engineering"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Inspector Checkbox */}
                        {inviteType === "INSPECTOR" && (
                            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mt-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="also-assessor"
                                        checked={isAlsoAssessor}
                                        onCheckedChange={(checked) => setIsAlsoAssessor(checked as boolean)}
                                    />
                                    <Label htmlFor="also-assessor" className="font-semibold text-amber-900 cursor-pointer">
                                        I also participate in assessments (I am an Assessor too)
                                    </Label>
                                </div>
                                <p className="text-sm text-amber-700 mt-2 pl-6">
                                    Check this box if you also act as an Assessor. You will be asked to provide your payment and field details.
                                </p>
                            </div>
                        )}

                        {/* Assessor Fields */}
                        {showAssessorFields && (
                            <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-top-4">
                                <h3 className="text-lg font-medium border-b pb-2 text-primary">Assessor Details</h3>

                                <div className="grid md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-md border">
                                    <div className="space-y-2 md:col-span-3">
                                        <Label className="font-semibold">Payment Details</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Number</Label>
                                        <Input
                                            value={paymentDetails.account_number}
                                            onChange={e => setPaymentDetails({ ...paymentDetails, account_number: e.target.value })}
                                            placeholder="XXXX XXXX XXXX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bank Name</Label>
                                        <Input
                                            value={paymentDetails.bank_name}
                                            onChange={e => setPaymentDetails({ ...paymentDetails, bank_name: e.target.value })}
                                            placeholder="BOC"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Branch</Label>
                                        <Input
                                            value={paymentDetails.branch}
                                            onChange={e => setPaymentDetails({ ...paymentDetails, branch: e.target.value })}
                                            placeholder="City Branch"
                                        />
                                    </div>
                                </div>

                                <div className="bg-muted/20 p-4 rounded-md border space-y-4">
                                    <Label className="font-semibold block">Fields for Viva/Assessments</Label>
                                    <p className="text-xs text-muted-foreground mt-0">Add the fields you can participate in (e.g., IT, Civil Engineering, etc.)</p>

                                    <div className="flex gap-2">
                                        <Input
                                            value={newField}
                                            onChange={e => setNewField(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddField();
                                                }
                                            }}
                                            placeholder="Type a field and press Add"
                                        />
                                        <Button type="button" onClick={handleAddField} variant="secondary">
                                            <Plus className="h-4 w-4 mr-1" /> Add
                                        </Button>
                                    </div>

                                    {assessmentFields.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {assessmentFields.map((field, i) => (
                                                <div key={i} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                                                    {field}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveField(field)}
                                                        className="hover:bg-primary/20 rounded-full p-1 ml-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
                            <strong>What happens next?</strong><br />
                            After submitting, your user account will be created automatically and your <strong>username &amp; password will be sent via email immediately</strong>.
                        </div>

                    </CardContent>
                    <CardFooter className="justify-end bg-muted/20 p-6">
                        <Button size="lg" type="submit" disabled={submitting}>
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit Registration
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
