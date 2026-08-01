import { useState } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, GraduationCap, MapPin, Microscope, LogIn, Mail, Lock } from "lucide-react";
import loginHero from "@/assets/login-hero.png";

export default function Login() {
  const { login } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username: string, password = "password", requestedRole?: string) => {
    setLoading(true);
    const success = await login({ username, password, role: requestedRole } as any);
    if (success) {
      toast({
        title: "Welcome back",
        description: "Successfully logged in to the portal.",
      });
      setLocation("/");
    } else {
      const errorMsg = useStore.getState().error || "";
      let displayMessage = "Incorrect Email or Password! Try again.";
      if (errorMsg.includes("Please select the correct login tab")) {
          displayMessage = "Please select the correct login tab for your role!";
      } else if (errorMsg.includes("Incorrect Email or Password")) {
          displayMessage = "Incorrect Email or Password! Try again.";
      }
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: displayMessage,
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left: Content Side */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-4 transform -rotate-3 transition-transform hover:rotate-0">
               <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-serif">NAITA</h1>
            <p className="text-slate-500 font-medium">Special Industrial Training Division</p>
          </div>

          <Tabs defaultValue="admin" className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TabsList className="grid w-full grid-cols-4 h-14 bg-white shadow-sm border p-1 rounded-xl mb-8">
              <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <ShieldCheck className="h-4 w-4 mr-2 hidden sm:inline" /> Admin
              </TabsTrigger>
              <TabsTrigger value="coordinator" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <GraduationCap className="h-4 w-4 mr-2 hidden sm:inline" /> Uni
              </TabsTrigger>
              <TabsTrigger value="inspector" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <MapPin className="h-4 w-4 mr-2 hidden sm:inline" /> Inspect
              </TabsTrigger>
              <TabsTrigger value="assessor" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <Microscope className="h-4 w-4 mr-2 hidden sm:inline" /> Viva
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <LoginForm
                role="System Administrator"
                backendRole="ADMIN"
                icon={<ShieldCheck className="w-5 h-5 text-primary" />}
                defaultEmail="admin@system.com"
                onSubmit={handleLogin}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="coordinator">
              <LoginForm
                role="University Coordinator"
                backendRole="UNIVERSITY_COORDINATOR"
                icon={<GraduationCap className="w-5 h-5 text-primary" />}
                defaultEmail="colombo@uni.com"
                onSubmit={handleLogin}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="inspector">
              <LoginForm
                role="District Inspector"
                backendRole="INSPECTOR"
                icon={<MapPin className="w-5 h-5 text-primary" />}
                defaultEmail="john@inspector.com"
                onSubmit={handleLogin}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="assessor">
              <LoginForm
                role="Viva Assessor"
                backendRole="ASSESSOR"
                icon={<Microscope className="w-5 h-5 text-primary" />}
                defaultEmail="john@assessor.com"
                onSubmit={handleLogin}
                loading={loading}
              />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-4">
             <span>SIT Division IT Services &copy; 2026</span>
             <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure Access</span>
          </div>
        </div>
      </div>

      {/* Right: Hero Side */}
      <div className="hidden lg:block relative m-6 overflow-hidden rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-purple-800/80 mix-blend-multiply z-10" />
        <img
          src={loginHero}
          alt="Modern University"
          className="absolute inset-0 h-full w-full object-cover scale-110 hover:scale-100 transition-transform duration-10000"
        />
        
        <div className="absolute inset-x-0 bottom-0 p-12 z-20 space-y-6">
          <div className="p-10 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl space-y-6 max-w-lg">
             <div className="w-12 h-1 bg-white/40 rounded-full" />
             <blockquote className="font-serif text-3xl leading-snug text-white italic">
               "Empowering future professionals through Excellence in Industrial Training."
             </blockquote>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-white font-bold text-xs ring-4 ring-white/5">
                 NI
               </div>
               <div>
                  <p className="text-white font-bold text-sm">National Apprentice & Industrial Training Authority</p>
                  <p className="text-white/60 text-xs">SIT Division Digital Portal</p>
               </div>
             </div>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-12 right-12 z-20 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
           Systems Online
        </div>
      </div>
    </div>
  );
}

function LoginForm({ role, backendRole, icon, defaultEmail, onSubmit, loading }: { role: string, backendRole: string, icon: React.ReactNode, defaultEmail: string, onSubmit: (username: string, password?: string, requestedRole?: string) => void, loading: boolean }) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("password");

  return (
    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden group">
      <CardHeader className="space-y-1 pb-6 pt-8">
        <div className="flex items-center justify-between">
           <div className="p-2.5 bg-primary/10 rounded-xl mb-2 group-hover:bg-primary/20 transition-colors">
              {icon}
           </div>
           <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary uppercase tracking-tighter">Secure</Badge>
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900">Sign in as {role}</CardTitle>
        <CardDescription className="text-slate-500 font-medium tracking-tight">Access your administrative workspace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-8">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Work Email</Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@naita.gov.lk"
              className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
              data-testid="input-email"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <Label htmlFor="password" className="text-sm font-bold text-slate-700">Access Key</Label>
            <button className="text-[11px] font-bold text-primary hover:underline">Forgot access?</button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
              data-testid="input-password"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
           <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Authorized use only</span>
        </div>
        <Button
          className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0"
          onClick={() => onSubmit(email, password, backendRole)}
          disabled={loading}
          data-testid="button-submit"
        >
          {loading ? (
             <div className="flex items-center gap-2">
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               Processing...
             </div>
          ) : (
            <div className="flex items-center gap-2">
              Sign In <LogIn className="w-4 h-4" />
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Internal Badge shim if not imported correctly, though usually UI components are expected to be present
function Badge({ children, className, variant }: any) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
