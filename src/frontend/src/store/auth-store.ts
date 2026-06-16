import { apiFetch } from "@/lib/api";
import { deleteCookie, getCookie, setCookie } from "@/lib/cookies";
import type { User, UserRole } from "@/lib/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole, name?: string) => void;
  loginWithCredentials: (
    username: string,
    password: string,
    hospitalCode?: string,
    isDemo?: boolean,
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (role: UserRole, name?: string) => {
        // Mock login for development
        set({
          user: {
            id: "mock",
            name: name || "Mock User",
            role,
            email: `${role}@example.com`,
            hospitalCode: "HSP001",
          },
          isAuthenticated: true,
        });
      },
      loginWithCredentials: async (
        username: string,
        password: string,
        hospitalCode?: string,
        isDemo?: boolean,
      ) => {
        try {
          const response = await apiFetch<{
            token: string;
            role: string;
            username: string;
            entityId: string;
            hospitalCode: string;
            mobile?: string;
            avatarUrl?: string;
          }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({
              emailOrMobile: username,
              password: password,
            }),
          });

          if (response.token) {
            setCookie("auth-token", response.token, {
              expires: 365,
              sameSite: "Strict",
            });
            localStorage.setItem("auth-token", response.token);
            localStorage.removeItem("jwtToken");

            // Map backend role to frontend role
            let frontendRole: UserRole = "admin";
            const backendRole = response.role.toUpperCase();

            if (
              backendRole === "SUPER_ADMIN" ||
              backendRole === "ROLE_SUPER_ADMIN"
            )
              frontendRole = "superAdmin";
            else if (backendRole === "DOCTOR" || backendRole === "ROLE_DOCTOR")
              frontendRole = "doctor";
            else if (
              backendRole === "RECEPTIONIST" ||
              backendRole === "ROLE_RECEPTIONIST"
            )
              frontendRole = "receptionist";
            else if (
              backendRole === "PHARMACIST" ||
              backendRole === "ROLE_PHARMACIST"
            )
              frontendRole = "pharmacist";
            else if (
              backendRole === "LAB_TECHNICIAN" ||
              backendRole === "ROLE_LAB_TECHNICIAN"
            )
              frontendRole = "lab_technician";
            else if (backendRole === "ADMIN" || backendRole === "ROLE_ADMIN")
              frontendRole = "admin";

            if (
              frontendRole !== "superAdmin" &&
              hospitalCode &&
              response.hospitalCode &&
              response.hospitalCode.toLowerCase() !== hospitalCode.toLowerCase()
            ) {
              throw new Error(
                "Unauthorized: You do not belong to this hospital.",
              );
            }

            set({
              user: {
                id: response.entityId,
                name: response.username,
                role: frontendRole,
                email: response.username,
                hospitalCode: response.hospitalCode,
                mobile: response.mobile,
                avatar: response.avatarUrl,
                isDemo: !!isDemo,
              },
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch (error: any) {
          if (error.message?.includes("Unauthorized")) throw error;

          console.warn(
            "Backend login failed, attempting local mock fallback...",
            error,
          );

          // Check local mock user credentials fallback
          try {
            const mockCredsStr = localStorage.getItem("mock-user-credentials");
            if (mockCredsStr) {
              const mockCreds = JSON.parse(mockCredsStr);
              const found = mockCreds.find(
                (c: any) =>
                  c.email.toLowerCase() === username.toLowerCase() &&
                  c.password === password,
              );
              if (found) {
                if (
                  hospitalCode &&
                  found.hospitalCode &&
                  found.hospitalCode.toLowerCase() !==
                    hospitalCode.toLowerCase()
                ) {
                  throw new Error(
                    "Unauthorized: You do not belong to this hospital.",
                  );
                }
                setCookie("auth-token", "dev-mock-token", {
                  expires: 7,
                  sameSite: "Strict",
                });
                localStorage.removeItem("auth-token");
                localStorage.removeItem("jwtToken");
                set({
                  user: {
                    id: found.entityId || "mock-id",
                    name: found.name,
                    role: found.role,
                    email: found.email,
                    hospitalCode: found.hospitalCode || "HSP001",
                    hospitalId: found.hospitalId || "1",
                    mobile: found.mobile,
                    isDemo: !!isDemo,
                  },
                  isAuthenticated: true,
                });
                return true;
              }
            }
          } catch (e: any) {
            if (e.message?.includes("Unauthorized")) throw e;
            console.error("Error checking mock credentials:", e);
          }

          // Dev Mode Bypass for easy testing without backend
          if (
            password === "password" ||
            password === "admin" ||
            password === "123456"
          ) {
            let frontendRole: UserRole = "admin";
            if (username.toLowerCase().includes("pharmacist"))
              frontendRole = "pharmacist";
            else if (username.toLowerCase().includes("lab"))
              frontendRole = "lab_technician";
            else if (username.toLowerCase().includes("doctor"))
              frontendRole = "doctor";
            else if (username.toLowerCase().includes("reception"))
              frontendRole = "receptionist";
            else if (username.toLowerCase().includes("super"))
              frontendRole = "superAdmin";

            if (
              frontendRole !== "superAdmin" &&
              hospitalCode &&
              hospitalCode.toLowerCase() !== "hsp001"
            ) {
              throw new Error(
                "Unauthorized: You do not belong to this hospital.",
              );
            }

            setCookie("auth-token", "dev-mock-token", {
              expires: 7,
              sameSite: "Strict",
            });
            localStorage.removeItem("auth-token");
            localStorage.removeItem("jwtToken");
            set({
              user: {
                id: "mock-id",
                name: "Demo User",
                role: frontendRole,
                email: username,
                hospitalCode: hospitalCode || "HSP001",
                isDemo: !!isDemo,
              },
              isAuthenticated: true,
            });
            return true;
          }

          throw error;
        }
      },
      logout: () => {
        deleteCookie("auth-token");
        localStorage.removeItem("auth-token");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("hospital-auth");
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (updatedFields) => {
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              ...updatedFields,
            },
          };
        });
      },
    }),
    {
      name: "hospital-auth",
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          const cookieVal = getCookie(name);
          if (cookieVal) return cookieVal;
          return typeof window !== "undefined"
            ? localStorage.getItem(name)
            : null;
        },
        setItem: (name: string, value: string) => {
          setCookie(name, value, { expires: 365, sameSite: "Strict" });
          if (typeof window !== "undefined") {
            localStorage.setItem(name, value);
          }
        },
        removeItem: (name: string) => {
          deleteCookie(name);
          if (typeof window !== "undefined") {
            localStorage.removeItem(name);
          }
        },
      })),
    },
  ),
);
