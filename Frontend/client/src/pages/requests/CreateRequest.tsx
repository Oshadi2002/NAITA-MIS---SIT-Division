import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Schema with Discriminated Union
const formSchema = z.discriminatedUnion("submissionType", [
  z.object({
    submissionType: z.literal("standard"),
    studentCount: z.coerce.number().min(1, "Must have at least 1 student"),
    location: z.string().min(3, "Location is required"),
    notes: z.string().optional(),
    date1: z.string().min(1, "At least one date is required"),
    date2: z.string().optional(),
    date3: z.string().optional(),
  }),
  z.object({
    submissionType: z.literal("google_form"),
    notes: z.string().optional(), // Notes can still be sent? Maybe not needed.
  }),
]);

export default function CreateRequest() {
  const { createRequest } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      submissionType: "standard",
      studentCount: 0,
      location: "",
      notes: "",
      date1: "",
      date2: "",
      date3: "",
    },
  });

  const submissionType = form.watch("submissionType");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.submissionType === "google_form") {
      try {
        await axios.post("/api/requests/send-google-form/");
        toast({
          title: "Email Sent",
          description: "The Google Form link has been emailed to the University Coordinator.",
        });
        setLocation("/requests");
      } catch (error: any) {
        toast({
          title: "Error Sending Email",
          description: "Failed to send the Google Form link. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    const dates = [values.date1, values.date2, values.date3].filter(Boolean) as string[];

    createRequest({
      student_count: values.studentCount,
      location: values.location,
      notes: values.notes,
      preferred_dates: dates
    });

    toast({
      title: "Request Created",
      description: "Your seminar request has been submitted for approval.",
    });

    setLocation("/requests");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <div>
        <h2 className="text-3xl font-serif font-bold text-primary">New Seminar Request</h2>
        <p className="text-muted-foreground">Submit a proposal for a new placement seminar.</p>
      </div>

      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Seminar Details</CardTitle>
          <CardDescription>
            Choose how you would like to submit your request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Submission Type Selection */}
              <FormField
                control={form.control}
                name="submissionType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Submission Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="standard" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Standard Proposal (Fill form below)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="google_form" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Send Google Form Link to Coordinator
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submissionType === "google_form" ? (
                <div className="p-4 border rounded-md bg-muted/50 text-sm text-muted-foreground flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Mail className="h-4 w-4" />
                    Email Notification
                  </div>
                  <p>
                    Selecting this option will trigger an automated email to the University Coordinator containing the Google Form link.
                  </p>
                  <p>
                    You do not need to fill out any further details here.
                  </p>
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="studentCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Student Count</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Main Auditorium, Building B" {...field} />
                        </FormControl>
                        <FormDescription>Where will the seminar take place?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Preferred Dates & Times</Label>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date1"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="date2"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any specific requirements (AV, seating, etc.)"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  {submissionType === "google_form" ? (
                    <>Send Link via Email <ExternalLink className="ml-2 h-4 w-4" /></>
                  ) : (
                    "Submit Proposal"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
