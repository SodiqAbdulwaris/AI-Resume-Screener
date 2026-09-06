import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeProvider } from "../src/context/ThemeContext";

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ token: "fake-token" }),
}));

const mockGetJob = vi.fn();
const mockGetMatchResults = vi.fn();

vi.mock("../src/lib/api", () => ({
  downloadMatchResultsCsv: vi.fn(),
  getMatchResults: (...args) => mockGetMatchResults(...args),
  getJob: (...args) => mockGetJob(...args),
  triggerMatch: vi.fn(),
  toggleShortlist: vi.fn(),
}));

import MatchView from "../src/components/recruiter/MatchView";

function renderAt(jobId) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[`/recruiter/jobs/${jobId}/matches`]}>
        <Routes>
          <Route path="/recruiter/jobs/:jobId/matches" element={<MatchView />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

beforeEach(() => {
  mockGetJob.mockReset();
  mockGetMatchResults.mockReset();
  mockGetJob.mockResolvedValue({ success: true, data: { title: "Backend Engineer" } });
});

describe("MatchView — 'never run' vs 'ran, 0 results' (Phase 2)", () => {
  it("shows the 'never run' message when lastMatchedAt is null", async () => {
    mockGetMatchResults.mockResolvedValue({
      success: true,
      data: { items: [], nextCursor: null, hasMore: false, lastMatchedAt: null },
    });

    renderAt("job1");

    await waitFor(() => expect(screen.getByText(/no match results yet\. run ai matching/i)).toBeInTheDocument());
  });

  it("shows a distinct message when matching HAS run but found 0 applicants", async () => {
    mockGetMatchResults.mockResolvedValue({
      success: true,
      data: { items: [], nextCursor: null, hasMore: false, lastMatchedAt: "2026-01-01T00:00:00.000Z" },
    });

    renderAt("job2");

    await waitFor(() => expect(screen.getByText(/ai matching ran, but no candidates matched/i)).toBeInTheDocument());
    expect(screen.queryByText(/no match results yet\. run ai matching/i)).not.toBeInTheDocument();
  });
});
