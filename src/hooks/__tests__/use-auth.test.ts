import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock actions
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

// Mock anon work tracker
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// Mock project actions
vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with isLoading as false", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
    });

    it("should expose signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(result.current).toHaveProperty("isLoading");
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    it("should set isLoading to true during sign in", async () => {
      vi.mocked(signInAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: false }), 100);
          })
      );

      const { result } = renderHook(() => useAuth());

      const signInPromise = result.current.signIn("test@example.com", "password123");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await signInPromise;
    });

    it("should set isLoading to false after sign in completes", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(result.current.isLoading).toBe(false);
    });

    it("should call signInAction with correct credentials", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(signInAction).toHaveBeenCalledWith("test@example.com", "password123");
    });

    it("should return the result from signInAction", async () => {
      const mockResult = { success: false, error: "Invalid credentials" };
      vi.mocked(signInAction).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      const signInResult = await result.current.signIn("test@example.com", "wrong");

      expect(signInResult).toEqual(mockResult);
    });

    it("should set isLoading to false even if signInAction throws", async () => {
      vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signIn("test@example.com", "password123")
      ).rejects.toThrow("Network error");

      expect(result.current.isLoading).toBe(false);
    });

    describe("successful sign in with anonymous work", () => {
      it("should create project with anonymous work data", async () => {
        const mockAnonWork = {
          messages: [{ role: "user", content: "test message" }],
          fileSystemData: { "/App.jsx": { type: "file", content: "code" } },
        };
        const mockProject = { id: "project-123" };

        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(mockAnonWork);
        vi.mocked(createProject).mockResolvedValue(mockProject as any);

        const { result } = renderHook(() => useAuth());

        await result.current.signIn("test@example.com", "password123");

        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^Design from \d{1,2}:\d{2}:\d{2}/),
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
      });

      it("should clear anonymous work after creating project", async () => {
        const mockAnonWork = {
          messages: [{ role: "user", content: "test" }],
          fileSystemData: {},
        };
        const mockProject = { id: "project-123" };

        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(mockAnonWork);
        vi.mocked(createProject).mockResolvedValue(mockProject as any);

        const { result } = renderHook(() => useAuth());

        await result.current.signIn("test@example.com", "password123");

        expect(clearAnonWork).toHaveBeenCalled();
      });

      it("should navigate to the new project", async () => {
        const mockAnonWork = {
          messages: [{ role: "user", content: "test" }],
          fileSystemData: {},
        };
        const mockProject = { id: "project-456" };

        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(mockAnonWork);
        vi.mocked(createProject).mockResolvedValue(mockProject as any);

        const { result } = renderHook(() => useAuth());

        await result.current.signIn("test@example.com", "password123");

        expect(mockPush).toHaveBeenCalledWith("/project-456");
      });

      it("should not create project if anonymous work has no messages", async () => {
        const mockAnonWork = {
          messages: [],
          fileSystemData: {},
        };
        const mockProjects = [{ id: "existing-project" }];

        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(mockAnonWork);
        vi.mocked(getProjects).mockResolvedValue(mockProjects as any);

        const { result } = renderHook(() => useAuth());

        await result.current.signIn("test@example.com", "password123");

        expect(createProject).not.toHaveBeenCalledWith(
          expect.objectContaining({ messages: [] })
        );
        expect(mockPush).toHaveBeenCalledWith("/existing-project");
      });
    });

    describe("successful sign in without anonymous work", () => {
      it("should navigate to most recent project if projects exist", async () => {
        const mockProjects = [
          { id: "project-1", createdAt: new Date() },
          { id: "project-2", createdAt: new Date() },
        ];

        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(null);
        vi.mocked(getProjects).mockResolvedValue(mockProjects as any);

        const { result } = renderHook(() => useAuth());

        await result.current.signIn("test@example.com", "password123");

        expect(mockPush).toHaveBeenCalledWith("/project-1");
      });

      it("should create new project if no projects exist", async () => {
        const mockProject = { id: "new-project-789" };

        vi.mocked(signInAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(null);
        vi.mocked(getProjects).mockResolvedValue([]);
        vi.mocked(createProject).mockResolvedValue(mockProject as any);

        const { result } = renderHook(() => useAuth());

        await result.current.signIn("test@example.com", "password123");

        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/new-project-789");
      });
    });

    describe("failed sign in", () => {
      it("should not perform post-signin actions on failure", async () => {
        vi.mocked(signInAction).mockResolvedValue({
          success: false,
          error: "Invalid credentials",
        });

        const { result } = renderHook(() => useAuth());

        await result.current.signIn("test@example.com", "wrong");

        expect(getAnonWorkData).not.toHaveBeenCalled();
        expect(getProjects).not.toHaveBeenCalled();
        expect(createProject).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe("signUp", () => {
    it("should set isLoading to true during sign up", async () => {
      vi.mocked(signUpAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: false }), 100);
          })
      );

      const { result } = renderHook(() => useAuth());

      const signUpPromise = result.current.signUp("test@example.com", "password123");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await signUpPromise;
    });

    it("should set isLoading to false after sign up completes", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("test@example.com", "password123");

      expect(result.current.isLoading).toBe(false);
    });

    it("should call signUpAction with correct credentials", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("new@example.com", "password123");

      expect(signUpAction).toHaveBeenCalledWith("new@example.com", "password123");
    });

    it("should return the result from signUpAction", async () => {
      const mockResult = { success: false, error: "Email already exists" };
      vi.mocked(signUpAction).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      const signUpResult = await result.current.signUp("existing@example.com", "pass");

      expect(signUpResult).toEqual(mockResult);
    });

    it("should set isLoading to false even if signUpAction throws", async () => {
      vi.mocked(signUpAction).mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signUp("test@example.com", "password123")
      ).rejects.toThrow("Database error");

      expect(result.current.isLoading).toBe(false);
    });

    describe("successful sign up with anonymous work", () => {
      it("should create project with anonymous work data", async () => {
        const mockAnonWork = {
          messages: [{ role: "user", content: "signup test" }],
          fileSystemData: { "/App.jsx": { type: "file", content: "signup code" } },
        };
        const mockProject = { id: "signup-project" };

        vi.mocked(signUpAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(mockAnonWork);
        vi.mocked(createProject).mockResolvedValue(mockProject as any);

        const { result } = renderHook(() => useAuth());

        await result.current.signUp("new@example.com", "password123");

        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^Design from \d{1,2}:\d{2}:\d{2}/),
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
      });

      it("should navigate to the new project after signup", async () => {
        const mockAnonWork = {
          messages: [{ role: "user", content: "test" }],
          fileSystemData: {},
        };
        const mockProject = { id: "signup-project-123" };

        vi.mocked(signUpAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(mockAnonWork);
        vi.mocked(createProject).mockResolvedValue(mockProject as any);

        const { result } = renderHook(() => useAuth());

        await result.current.signUp("new@example.com", "password123");

        expect(mockPush).toHaveBeenCalledWith("/signup-project-123");
      });
    });

    describe("successful sign up without anonymous work", () => {
      it("should create new project for new user", async () => {
        const mockProject = { id: "first-project" };

        vi.mocked(signUpAction).mockResolvedValue({ success: true });
        vi.mocked(getAnonWorkData).mockReturnValue(null);
        vi.mocked(getProjects).mockResolvedValue([]);
        vi.mocked(createProject).mockResolvedValue(mockProject as any);

        const { result } = renderHook(() => useAuth());

        await result.current.signUp("new@example.com", "password123");

        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/first-project");
      });
    });

    describe("failed sign up", () => {
      it("should not perform post-signup actions on failure", async () => {
        vi.mocked(signUpAction).mockResolvedValue({
          success: false,
          error: "Email already exists",
        });

        const { result } = renderHook(() => useAuth());

        await result.current.signUp("existing@example.com", "password123");

        expect(getAnonWorkData).not.toHaveBeenCalled();
        expect(getProjects).not.toHaveBeenCalled();
        expect(createProject).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe("edge cases", () => {
    it("should handle getAnonWorkData returning undefined", async () => {
      const mockProjects = [{ id: "existing-project" }];

      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(undefined as any);
      vi.mocked(getProjects).mockResolvedValue(mockProjects as any);

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockPush).toHaveBeenCalledWith("/existing-project");
    });

    it("should handle empty string credentials", async () => {
      vi.mocked(signInAction).mockResolvedValue({
        success: false,
        error: "Invalid input",
      });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("", "");

      expect(signInAction).toHaveBeenCalledWith("", "");
    });

    it("should handle rapid consecutive sign in attempts", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      const promise1 = result.current.signIn("test1@example.com", "pass1");
      const promise2 = result.current.signIn("test2@example.com", "pass2");

      await Promise.all([promise1, promise2]);

      expect(signInAction).toHaveBeenCalledTimes(2);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
