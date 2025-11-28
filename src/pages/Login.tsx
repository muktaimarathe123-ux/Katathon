import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { auth, db } from "@/integrations/firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type UserType = "normal" | "blind" | "wheelchair" | "elderly" | "crowd";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [userType, setUserType] = useState<UserType>("normal");
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save user type to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    userType: userType,
                    createdAt: new Date().toISOString()
                });

                toast.success("Account created successfully!");
                navigate("/");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Successfully logged in!");
                navigate("/");
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            let errorMessage = "An error occurred";
            if (error.code === 'auth/email-already-in-use') errorMessage = "Email already in use";
            else if (error.code === 'auth/invalid-email') errorMessage = "Invalid email address";
            else if (error.code === 'auth/weak-password') errorMessage = "Password should be at least 6 characters";
            else if (error.code === 'auth/user-not-found') errorMessage = "User not found";
            else if (error.code === 'auth/wrong-password') errorMessage = "Invalid password";
            else errorMessage = `Error (${error.code}): ${error.message}`;

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
                    <CardDescription>
                        {isSignUp
                            ? "Sign up to start contributing to the community"
                            : "Sign in to your account"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {isSignUp && (
                            <div className="space-y-2">
                                <Label>I am a...</Label>
                                <RadioGroup value={userType} onValueChange={(value) => setUserType(value as UserType)} className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="normal" id="normal" />
                                        <Label htmlFor="normal">Normal User</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="blind" id="blind" />
                                        <Label htmlFor="blind">Blind / Low Vision</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="wheelchair" id="wheelchair" />
                                        <Label htmlFor="wheelchair">Wheelchair User</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="elderly" id="elderly" />
                                        <Label htmlFor="elderly">Elderly</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="crowd" id="crowd" />
                                        <Label htmlFor="crowd">Stuck in Crowd</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : isSignUp ? (
                                "Sign Up"
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                        <div className="text-center text-sm space-y-2">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-primary hover:underline block w-full"
                            >
                                {isSignUp
                                    ? "Already have an account? Sign in"
                                    : "Don't have an account? Sign up"}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    localStorage.setItem("isGuest", "true");
                                    toast.success("Logged in as Guest");
                                    navigate("/");
                                }}
                            >
                                Continue as Guest
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
