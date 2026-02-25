import { useState } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import loginHero from "@/assets/login-hero.png";

export default function Login() {
  const { login } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username: string, password = "password") => {
    setLoading(true);
    const success = await login({ username, password });
    if (success) {
      toast({
        title: "Welcome back",
        description: "Successfully logged in to the portal.",
      });
      setLocation("/");
    } else {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Incorrect Email or Password! Try again.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Content */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif font-bold text-primary">NAITA</h1>
            <p className="text-muted-foreground">Special Industrial Training Division </p>
          </div>

          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="coordinator">Coordinator</TabsTrigger>
              <TabsTrigger value="inspector">Inspector</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <LoginForm
                role="Administrator"
                defaultEmail="admin@system.com"
                onSubmit={handleLogin}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="coordinator">
              <LoginForm
                role="University Coordinator"
                defaultEmail="colombo@uni.com"
                onSubmit={handleLogin}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="inspector">
              <LoginForm
                role="Inspector"
                defaultEmail="john@inspector.com"
                onSubmit={handleLogin}
                loading={loading}
              />
            </TabsContent>
          </Tabs>

          <div className="text-center text-xs text-muted-foreground">
            Protected by SIT Division IT Services &copy; 2026
          </div>
        </div>
      </div>

      {/* Right: Hero Image */}
      <div className="hidden lg:block relative bg-muted">
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply z-10" />
        <img
          src={loginHero}
          alt="University Hall"
          className="absolute inset-0 h-full w-full object-contain grayscale-[20%]"
        />
        <div className="absolute bottom-12 left-12 right-12 z-20 text-white p-8 backdrop-blur-md bg-black/30 rounded-lg border border-white/10">
          <blockquote className="font-serif text-xl italic mb-4">
            "Education is the passport to the future, for tomorrow belongs to those who prepare for it today."
          </blockquote>
          <cite className="not-italic text-sm font-medium opacity-80">- Malcom X</cite>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ role, defaultEmail, onSubmit, loading }: { role: string, defaultEmail: string, onSubmit: (username: string, password?: string) => void, loading: boolean }) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("password");

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle>Login as {role}</CardTitle>
        <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="m@example.com"
            data-testid="input-email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="input-password"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onSubmit(email, password)}
          disabled={loading}
          data-testid="button-submit"
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </CardFooter>
    </Card>
  );
}
