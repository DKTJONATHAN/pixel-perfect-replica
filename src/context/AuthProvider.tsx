import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";\nimport type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import type { Profile } from "@/lib/database.types";
import type { Role, User } from "@/lib/types";
import { clearSession, loadStoredSession, loginAccount, registerAccount, signOutAccount, loadCurrentProfile, type SessionProfile } from "@/lib/customAuth";

interface AuthContextValue {
  ready: boolean;
  configured: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn: (loginId: string, password: string, role?: Role) => Promise<{ ok: boolean; error?: string }>;
  signUp: (loginId: string, password: string, fullName: string, role?: Role) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  portalPath: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(p: SessionProfile | Profile): User {
  return { id:p.id, name:p.full_name || p.login_id || p.email, email:p.email, role:p.role as Role, studentId:p.student_id, staffId:p.staff_id, loginId:p.login_id };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [ready,setReady]=useState(false);
  const [session,setSession]=useState<AuthContextValue["session"]>(null);
  const [profile,setProfile]=useState<Profile|null>(null);

  useEffect(() => {
    if (!configured) { setReady(true); return; }
    const sb=getSupabase();
    let active=true;
    void sb.auth.getSession().then(async ({data})=>{
      if (!active) return;
      setSession(data.session);
      setProfile(await loadCurrentProfile() as Profile|null);
      setReady(true);
    });
    const {data:{subscription}}=sb.auth.onAuthStateChange((_event,next)=>{
      setSession(next);
      if (!next) { setProfile(null); setReady(true); return; }
      window.setTimeout(()=>{ void loadCurrentProfile().then(p=>{ if(active) setProfile(p as Profile|null); }); },0);
    });
    return ()=>{active=false;subscription.unsubscribe();};
  },[configured]);

  const signIn=useCallback(async(loginId:string,password:string,_role?:Role)=>{
    if(!configured)return {ok:false,error:"Supabase is not configured."};
    if(!loginId.trim()||!password)return {ok:false,error:"Enter your login ID and password."};
    const result=await loginAccount(loginId,password);
    if(!result.ok)return {ok:false,error:result.error};
    setProfile(result.profile as Profile);
    return {ok:true};
  },[configured]);

  const signUp=useCallback(async(loginId:string,password:string,fullName:string,role:Role="parent")=>{
    if(!configured)return {ok:false,error:"Supabase is not configured."};
    const result=await registerAccount({loginId,password,fullName,role});
    if(!result.ok)return {ok:false,error:result.error};
    if(result.profile) setProfile(result.profile as Profile);
    return {ok:true};
  },[configured]);

  const signOut=useCallback(async()=>{ await signOutAccount(); clearSession(); setSession(null); setProfile(null); },[]);
  const portalPath=useCallback((role?:Role)=>{
    const r=role ?? (profile?.role as Role|undefined);
    if(r==="admin"||r==="registrar")return "/admin";
    if(r==="staff"||r==="teacher")return "/staff";
    if(r==="student")return "/student";
    if(r==="parent")return "/parent";
    return "/";
  },[profile?.role]);

  const user=profile?toUser(profile):null;
  const value=useMemo(()=>({ready,configured,session,user,profile,signIn,signUp,signOut,portalPath}),[ready,configured,session,user,profile,signIn,signUp,signOut,portalPath]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error("useAuth must be used inside AuthProvider");return ctx;}