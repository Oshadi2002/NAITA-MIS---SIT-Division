import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Activity, Compass } from "lucide-react";

export default function MonitoringDashboard() {
    const [, setLocation] = useLocation();

    return (
        <div className="space-y-6 animate-in fade-in pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Monitoring Dashboard</h2>
                    <p className="text-muted-foreground">Track and manage student and inspector monitoring.</p>
                </div>
            </div>

            <Card className="min-h-[400px] border-t-4 border-t-orange-500 shadow-sm flex flex-col items-center justify-center p-12 text-center bg-muted/10">
                <Compass className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <CardTitle className="text-2xl text-muted-foreground">Monitoring Phase</CardTitle>
                <CardDescription className="text-lg max-w-lg mt-2">
                    This section will be populated with real-time tracking, assignment of inspectors, and periodic evaluation logs for currently active placements.
                </CardDescription>
                <Button className="mt-6 bg-orange-500 hover:bg-orange-600 shadow-sm" onClick={() => setLocation("/")}>
                    Return to Dashboard
                </Button>
            </Card>
        </div>
    );
}
