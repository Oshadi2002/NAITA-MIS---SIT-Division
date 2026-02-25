import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Briefcase, CalendarClock, School } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SeminarManagementCardProps {
    totalRequests: number;
    pendingRequests: number;
    upcomingSeminar?: {
        university: string;
        date: string;
        location: string;
    };
    onClick: () => void;
    className?: string;
}

export function SeminarManagementCard({
    totalRequests,
    pendingRequests,
    upcomingSeminar,
    onClick,
    className,
}: SeminarManagementCardProps) {
    return (
        <Card
            className={cn(
                "flex flex-col h-full border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all duration-200",
                className
            )}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Placement Management
                    </CardTitle>
                    {pendingRequests > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            {pendingRequests} Action{pendingRequests !== 1 && 's'} Needed
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Total Requests</p>
                        <p className="text-2xl font-bold tracking-tight">{totalRequests}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Pending</p>
                        <p className={cn("text-2xl font-bold tracking-tight", pendingRequests > 0 ? "text-amber-600" : "")}>
                            {pendingRequests}
                        </p>
                    </div>
                </div>

                {/* Upcoming Seminar Section */}
                <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2 text-primary font-medium text-sm">
                        <CalendarClock className="h-4 w-4" /> Next Upcoming Seminar
                    </div>

                    {upcomingSeminar ? (
                        <div className="space-y-1">
                            <div className="font-semibold text-base truncate flex items-center gap-2">
                                <School className="h-3 w-3 text-muted-foreground" />
                                {upcomingSeminar.university}
                            </div>
                            <div className="text-sm text-muted-foreground flex justify-between items-center">
                                <span>{format(new Date(upcomingSeminar.date), "PPP p")}</span>
                            </div>
                            <div className="text-xs text-muted-foreground pt-1 truncate">
                                📍 {upcomingSeminar.location}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic py-2">
                            No upcoming seminars scheduled.
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="pt-2">
                <Button onClick={onClick} className="w-full group" variant="default">
                    Manage All Seminars
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}
