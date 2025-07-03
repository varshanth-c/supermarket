import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// --- For better security, create a .env.local file in your project root ---
// --- and add this line: REACT_APP_ADMIN_USER_ID=dad08f43-1538-43bf-b6c2-4a13459e5528 ---
export const ADMIN_USER_ID = 'dad08f43-1538-43bf-b6c2-4a13459e5528';

interface Profile {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  created_at?: string;
  address?: string;
  avatar_url?: string;
  full_name?: string;
  updated_at?: string;
}
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = useMemo(() => {
    return user?.id === ADMIN_USER_ID;
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    profile,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
// import { User, Session } from '@supabase/supabase-js';
// import { supabase } from '@/integrations/supabase/client';
// import { Loader2 } from 'lucide-react';

// // --- For better security, create a .env.local file in your project root ---
// // --- and add this line: REACT_APP_ADMIN_USER_ID=dad08f43-1538-43bf-b6c2-4a13459e5528 ---
// export const ADMIN_USER_ID = 'dad08f43-1538-43bf-b6c2-4a13459e5528';

// interface Profile {
//   id: string;
//   email?: string;
//   name?: string;
//   phone?: string;
//   role?: string;
//   created_at?: string;
//   address?: string;
// }
// interface AuthContextType {
//   user: User | null;
//   session: Session | null;
//   loading: boolean;
//   isAdmin: boolean; // <-- ADD THIS
//    profile: Profile | null;
//   signIn: (email: string, password:string) => Promise<{ error: any }>;
//   signUp: (email: string, password: string) => Promise<{ error: any }>;
//   signOut: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (event, session) => {
//         setSession(session);
//         setUser(session?.user ?? null);
//         setLoading(false);
//       }
//     );

//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   // --- ADD THIS MEMOIZED CALCULATION ---
//   // This efficiently determines if the logged-in user is an admin.
//   const isAdmin = useMemo(() => {
//     return user?.id === ADMIN_USER_ID;
//   }, [user]);

//   const signIn = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });
//     return { error };
//   };
  

//   const signUp = async (email: string, password: string) => {
//     const redirectUrl = `${window.location.origin}/`;
//     const { error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         emailRedirectTo: redirectUrl
//       }
//     });
//     return { error };
//   };
//   const updateProfile = async (data: {
//   email?: string;
//   name?: string;
//   phone?: string;
//   role?: string;
//   address?: string;
// }) => {
//   if (!user) throw new Error("No user logged in");

//   const { error } = await supabase
//     .from('profiles')
//     .update(data)
//     .eq('id', user.id);

//   // If update is successful, refresh the local profile state
//   if (!error) {
//     const { data: updatedProfileData } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', user.id)
//       .single();
//     setProfile(updatedProfileData);
//   }

//   return { error };
// };

// if (loading) {
//   return (
//     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//       <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
//     </div>
//   );
// }

//   const signOut = async () => {
//     await supabase.auth.signOut();
//     setProfile(null);
//   };

//   const value = {
//     user,
//     session,
//     loading,
//     isAdmin, // <-- EXPOSE isAdmin HERE
//     signIn,
//     signUp,
//     signOut,
//     updateProfile, 
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };
