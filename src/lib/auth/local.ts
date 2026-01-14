export type UserRole = "admin" | "broker" | "client";

export type LocalUser = {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
};

export type LocalProfileLite = {
  userId: string;
  role: UserRole;
  displayName?: string;
  whatsapp?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LocalSession = {
  userId: string;
  email: string;
  role: UserRole;
};

const PROFILES_KEY = "digicode_immo_profiles_v1";

const USERS_KEY = "digicode_immo_users_v1";
const SESSION_KEY = "digicode_immo_session_v1";

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function listUsers(): LocalUser[] {
  const users = safeParse<LocalUser[]>(localStorage.getItem(USERS_KEY));
  return Array.isArray(users) ? users : [];
}

export function listProfilesLite(): LocalProfileLite[] {
  const profiles = safeParse<LocalProfileLite[]>(localStorage.getItem(PROFILES_KEY));
  return Array.isArray(profiles) ? profiles : [];
}

export function updateUserRole(userId: string, role: UserRole) {
  const users = listUsers();
  const nextUsers = users.map((u) => (u.id === userId ? { ...u, role } : u));
  localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));

  const profiles = listProfilesLite();
  const nextProfiles = profiles.map((p) =>
    p.userId === userId ? { ...p, role, updatedAt: new Date().toISOString() } : p
  );
  localStorage.setItem(PROFILES_KEY, JSON.stringify(nextProfiles));

  const session = getSession();
  if (session?.userId === userId) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...session, role })
    );
  }
}

export function deleteUser(userId: string) {
  const users = listUsers();
  const nextUsers = users.filter((u) => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));

  const profiles = listProfilesLite();
  const nextProfiles = profiles.filter((p) => p.userId !== userId);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(nextProfiles));

  const session = getSession();
  if (session?.userId === userId) {
    signOut();
  }
}

export function getSession(): LocalSession | null {
  return safeParse<LocalSession>(localStorage.getItem(SESSION_KEY));
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function signInAsAdmin(): LocalSession {
  const session: LocalSession = {
    userId: "admin",
    email: "admin@digicode-immo.local",
    role: "admin",
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function signIn(email: string, password: string): LocalSession {
  const users = listUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== password) {
    throw new Error("Email ou mot de passe incorrect");
  }

  const session: LocalSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function registerUser(
  emailOrParams:
    | string
    | {
        email: string;
        password: string;
        role?: UserRole;
        displayName?: string;
        whatsapp?: string;
      },
  password?: string,
  role: UserRole = "client"
): LocalSession {
  const params =
    typeof emailOrParams === "string"
      ? {
          email: emailOrParams,
          password: password ?? "",
          role,
        }
      : {
          email: emailOrParams.email,
          password: emailOrParams.password,
          role: emailOrParams.role ?? "client",
          displayName: emailOrParams.displayName,
          whatsapp: emailOrParams.whatsapp,
        };

  if (!params.email) {
    throw new Error("Email obligatoire");
  }
  if (!params.password) {
    throw new Error("Mot de passe obligatoire");
  }

  const users = listUsers();
  const exists = users.some(
    (u) => u.email.toLowerCase() === params.email.toLowerCase()
  );

  if (exists) {
    throw new Error("Un compte avec cet email existe déjà");
  }

  const user: LocalUser = {
    id: generateId(),
    email: params.email,
    password: params.password,
    role: params.role ?? "client",
    createdAt: new Date().toISOString(),
  };

  const nextUsers = [...users, user];
  localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));

  try {
    const rawProfiles = localStorage.getItem(PROFILES_KEY);
    const profiles = rawProfiles ? (JSON.parse(rawProfiles) as any[]) : [];
    const displayName =
      params.displayName?.trim() || params.email.split("@")[0] || params.email;
    const nextProfile = {
      userId: user.id,
      role: user.role,
      displayName,
      whatsapp: params.whatsapp?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const out = [nextProfile, ...profiles.filter((p) => p.userId !== user.id)];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(out));
  } catch {
    // ignore
  }

  const session: LocalSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function requireSession(): LocalSession {
  const session = getSession();
  if (!session) {
    throw new Error("Non authentifié");
  }
  return session;
}
