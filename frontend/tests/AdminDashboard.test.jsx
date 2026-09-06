import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeProvider } from "../src/context/ThemeContext";

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ token: "fake-token", user: { fullName: "Admin User", email: "admin@example.com", role: "admin" }, logout: vi.fn() }),
}));

const mockGetAdminStats = vi.fn();

vi.mock("../src/lib/api", () => ({
  getAdminUsers: vi.fn(),
  deactivateAdminUser: vi.fn(),
  getAdminJobs: vi.fn(),
  getAdminStats: (...args) => mockGetAdminStats(...args),
  getAdminSettings: vi.fn(),
  updateAdminSettings: vi.fn(),
}));

import AdminDashboard from "../src/pages/AdminDashboard";

beforeEach(() => {
  mockGetAdminStats.mockReset();
});

describe("AdminDashboard (Phase 5)", () => {
  it("renders real platform stats on the Overview tab", async () => {
    mockGetAdminStats.mockResolvedValue({
      success: true,
      data: { totalCandidates: 4, totalRecruiters: 2, totalJobs: 5, openJobs: 3, jobsMatched: 2, totalApplications: 6, totalMatches: 10 },
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText("4")).toBeInTheDocument()); // candidates
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1); // recruiters and/or jobsMatched
    expect(screen.getByText("6")).toBeInTheDocument(); // applications
    expect(screen.getByText("10")).toBeInTheDocument(); // match results
  });
});
