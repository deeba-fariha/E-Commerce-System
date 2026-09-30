/**
 * ============================================================================
 * ADMIN PANEL - BACKEND API HELPER (js/api.js)
 * ============================================================================
 * Admin wrapper around apiFetch() from ../js/api.js (backend URL comes
 * from ../js/config.js).
 * - Sends the admin JWT (Authorization: Bearer ...)
 * - Redirects to login.html when the token is missing/expired (401)
 * - Throws ApiError with the backend's "detail" message on failure,
 *   or a "could not reach the server" message on network/CORS errors
 */

async function adminApi(path, options = {}) {
  const token = localStorage.getItem("admin_token");

  // Always the admin token, never a customer/seller storefront token
  if (!token) {
    window.location.href = "login.html";
    throw new ApiError("Please log in as an admin.", { status: 401 });
  }

  try {
    return await apiFetch(path, {
      ...options,
      headers: {
        "Authorization": "Bearer " + token,
        ...(options.headers || {})
      }
    });
  } catch (error) {
    // 401 expired/invalid token, 403 not an admin token
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      ApexAuth.clearSession();
      window.location.href = "login.html";
    }
    throw error;
  }
}

/** Grey "no image" tile, built in so it never depends on another site */
const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
    '<rect width="40" height="40" fill="#F5F4F0"/>' +
    '<path d="M11 27l6-7 4 5 3-3 5 5z" fill="#C9C5BA"/>' +
    '<circle cx="25" cy="15" r="3" fill="#C9C5BA"/></svg>'
  );

/** Product images uploaded by sellers are stored as "/uploads/..." paths */
function productImageUrl(image) {
  if (!image) return NO_IMAGE_PLACEHOLDER;
  return apiAssetUrl(image);
}

/** Escapes seller-provided text before inserting it into innerHTML */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
