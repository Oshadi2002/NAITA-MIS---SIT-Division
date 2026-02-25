import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, TrendingUp, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import RequestList from "@/pages/requests/RequestList";

export default function SeminarDashboard() {
    const { currentUser, requests } = useStore();
    const [, setLocation] = useLocation();

    if (!currentUser) return null;

    // Calculate Stats
    const myRequests = currentUser.role === 'ADMIN'
        ? requests
        : currentUser.role === 'INSPECTOR'
            ? requests.filter(r => r.assigned_inspector === currentUser.id)
            : requests.filter(r => r.coordinator === currentUser.id);

    const pending = myRequests.filter(r => r.status === 'PENDING').length;
    const approved = myRequests.filter(r => r.status === 'APPROVED').length;
    const completed = myRequests.filter(r => r.status === 'COMPLETED').length;
    const total = myRequests.length;

    const data = [
        { name: 'Pending', value: pending, color: 'hsl(var(--chart-4))' }, // Amber
        { name: 'Approved', value: approved, color: 'hsl(var(--chart-1))' }, // Blue
        { name: 'Completed', value: completed, color: 'hsl(var(--chart-2))' }, // Teal
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Placement Seminar Management</h2>
                    <p className="text-muted-foreground mt-2">
                        Detailed overview and management for placement seminars.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Seminars"
                    value={total}
                    icon={Calendar}
                    description="All time requests"
                />
                <StatsCard
                    title="Pending Approval"
                    value={pending}
                    icon={Clock}
                    description="Awaiting review"
                />
                <StatsCard
                    title="Scheduled"
                    value={approved}
                    icon={CheckCircle2}
                    description="Upcoming seminars"
                />
                <StatsCard
                    title="Completed"
                    value={completed}
                    icon={TrendingUp}
                    description="Successfully finished"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart */}
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Request Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {myRequests.slice(0, 4).map((req) => (
                                <div key={req.id} className="flex items-start gap-4">
                                    <div className="h-2 w-2 mt-2 rounded-full bg-primary shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {req.university_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Status updated to <span className="font-semibold text-foreground">{req.status}</span>
                                        </p>
                                    </div>
                                    <div className="ml-auto text-xs text-muted-foreground">
                                        {req.status_history.length > 0 && new Date(req.status_history[req.status_history.length - 1].date).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {myRequests.length === 0 && (
                                <p className="text-sm text-muted-foreground">No recent activity.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Embedded Request List for "All placement details" */}
            <div className="pt-4">
                <RequestList />
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, description }: { title: string, value: number, icon: any, description: string }) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
} 