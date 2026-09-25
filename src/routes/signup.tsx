import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, School } from "lucide-react";
import { Button, Input } from "@/components/UI";
import { isSupabaseConfigured } from "@/lib/supabase";
import { registerAccount } from "@/lib/customAuth";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const [fullName,setFullName]=useState("");
  const [phone,setPhone]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setError(""); setMessage("");
    if(!isSupabaseConfigured()){setError("Supabase is not configured.");return;}
    if(!fullName.trim()){setError("Enter your full name.");return;}
    if(!phone.trim()){setError("Enter your phone number.");return;}
    if(!email.trim()){setError("Enter your email address.");return;}
    if(password.length<6){setError("Password must be at least 6 characters.");return;}
    if(password!==confirm){setError("Passwords do not match.");return;}
    setLoading(true);
    try{
      const loginId=phone.replace(/\D/g,"")||phone.trim();
      const result=await registerAccount({loginId,password,fullName:fullName.trim(),role:"parent",parentPhone:phone.trim(),email:email.trim()});
      if(!result.ok) throw new Error(result.error);
      setMessage(result.needsEmailConfirmation\n        ? "Parent account created. Check your email and click the confirmation link before signing in. You can then sign in with your phone number or email and password."\n        : "Parent account created. You can now sign in with your phone number or email and password.");
      setPassword(""); setConfirm("");
    }catch(err){setError(err instanceof Error?err.message:"Sign up failed");}
    finally{setLoading(false);}
  }

  return <main className="flex min-h-screen items-center justify-center bg-background p-6">
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl gradient-hero text-primary-foreground"><School className="size-6"/></div>
        <h1 className="mt-4 font-display text-2xl font-bold">Parent registration</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a parent / guardian account to access your children's portal.</p>
      </div>
      <div className="surface-card p-8">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div><label className="mb-1.5 block text-sm font-medium">Full name</label><Input required value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Phone number</label><Input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254 7xx xxx xxx" autoComplete="tel" /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Email address</label><Input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Password</label><Input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" /></div>
          <div><label className="mb-1.5 block text-sm font-medium">Confirm password</label><Input type="password" required minLength={6} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" /></div>
          {error&&<p className="text-sm text-destructive">{error}</p>}
          {message&&<p className="text-sm text-primary">{message}</p>}
          <Button className="w-full" type="submit" loading={loading}>Create parent account <ArrowRight className="size-4"/></Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <a href="/login" className="text-primary hover:underline">Sign in</a></p>
      </div>
    </div>
  </main>;
}