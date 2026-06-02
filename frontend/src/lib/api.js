const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

let authToken = null;
let tokenUpdater = null;
let logoutCallback = null;

export const setAuthTokenTracker = (token, updateFn, logoutFn) => {
  authToken = token;
  tokenUpdater = updateFn;
  logoutCallback = logoutFn;
};

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return { success: false, status: res.status, message: `Invalid JSON response from server (Status ${res.status})` };
    }
  } else {
    try {
      const text = await res.text();
      return { success: false, status: res.status, message: text || `Server error (Status ${res.status})` };
    } catch {
      return { success: false, status: res.status, message: `Server error (Status ${res.status})` };
    }
  }
}

export async function apiCall(method, path, body = null, token = null, isForm = false) {
  let currentToken = token || authToken;
  const headers = {};

  if (currentToken) {
    headers.Authorization = `Bearer ${currentToken}`;
  }

  if (!isForm && body) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions = {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  };

  try {
    const res = await fetch(API_BASE + path, fetchOptions);

    if (res.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(API_BASE + "/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          const refreshData = await parseResponse(refreshRes);

          if (refreshRes.ok && refreshData.success) {
            const newAccessToken = refreshData.data.token;
            if (tokenUpdater) {
              tokenUpdater(newAccessToken);
            }
            authToken = newAccessToken;
            isRefreshing = false;
            onRefreshed(newAccessToken);
          } else {
            isRefreshing = false;
            if (logoutCallback) {
              logoutCallback();
            }
            return { success: false, status: 401, message: "Session expired. Please log in again." };
          }
        } catch (refreshErr) {
          isRefreshing = false;
          if (logoutCallback) {
            logoutCallback();
          }
          return { success: false, status: 401, message: "Network error during token refresh." };
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
          resolve(
            fetch(API_BASE + path, {
              ...fetchOptions,
              headers: retryHeaders,
            })
              .then(parseResponse)
              .catch(() => ({ success: false, message: "Retry connection failed" }))
          );
        });
      });
    }

    return await parseResponse(res);
  } catch (err) {
    return { success: false, message: "Network error — failed to connect to server." };
  }
}

export const authRegister = (body) => apiCall("POST", "/auth/register", body);
export const authLogin = (body) => apiCall("POST", "/auth/login", body);
export const getMe = (token) => apiCall("GET", "/auth/me", null, token);
export const silentRefresh = () => apiCall("POST", "/auth/refresh");
export const getJobs = (token, cursor = null, limit = 20) =>
  apiCall("GET", `/jobs?limit=${limit}` + (cursor ? `&cursor=${cursor}` : ""), null, token);
export const applyToJob = (jobId, token) => apiCall("POST", `/jobs/${jobId}/apply`, null, token);
export const cancelApplication = (jobId, token) => apiCall("DELETE", `/jobs/${jobId}/apply`, null, token);
export const getMyApplications = (token) => apiCall("GET", "/jobs/my-applications", null, token);
export const getCandidateProfile = (token) => apiCall("GET", "/candidates/me", null, token);
export const acceptParsedName = (token) => apiCall("POST", "/candidates/me/accept-parsed-name", null, token);
export const uploadResume = (formData, token) => apiCall("POST", "/resumes", formData, token, true);
export const createJob = (body, token) => apiCall("POST", "/jobs", body, token);
export const triggerMatch = (jobId, token) => apiCall("POST", `/jobs/${jobId}/match`, null, token);
export const getMatchResults = (jobId, token, cursor = null, limit = 20) =>
  apiCall("GET", `/jobs/${jobId}/matches?limit=${limit}` + (cursor ? `&cursor=${cursor}` : ""), null, token);
export const getResume = (resumeId, token) => apiCall("GET", `/resumes/${resumeId}`, null, token);
export const getJob = (jobId, token) => apiCall("GET", `/jobs/${jobId}`, null, token);
export const sendContactFeedback = (body) => apiCall("POST", "/contact", body);
export const toggleShortlist = (jobId, matchId, shortlisted, token) =>
  apiCall("PATCH", `/jobs/${jobId}/matches/${matchId}`, { shortlisted }, token);
export const closeJob = (jobId, isOpen, token) =>
  apiCall("PATCH", `/jobs/${jobId}`, { isOpen }, token);

export const verifyEmail = (token) => apiCall("GET", `/auth/verify-email?token=${token}`);
export const resendVerification = (email) => apiCall("POST", "/auth/resend-verification", { email });
export const forgotPassword = (email) => apiCall("POST", "/auth/forgot-password", { email });
export const resetPassword = (token, newPassword) => apiCall("POST", "/auth/reset-password", { token, newPassword });

export async function downloadMatchResultsCsv(jobId, token) {
  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/matches/export.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, message: text || "CSV export failed" };
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    return {
      success: true,
      data: {
        blob,
        filename: match?.[1] || "match-results.csv",
      },
    };
  } catch {
    return { success: false, message: "Network error — is the server running?" };
  }
}
