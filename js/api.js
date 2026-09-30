// =========================================================
// APEXMART - SHARED API LAYER (js/api.js)
// =========================================================
// Load in <head> right after js/config.js on every page.
//
//   // GET, returns the parsed JSON
//   const products = await apiFetch("/api/products/approved");
//
//   // POST JSON (plain objects are sent as JSON)
//   const seller = await apiFetch("/api/sellers/register", {
//       method: "POST",
//       body: { store_name: "...", ... }
//   });
//
//   try { ... } catch (error) {
//       alert(apiErrorMessage(error));
//   }
//
// apiFetch() throws ApiError in two different cases:
//   error.network === true  -> the request never got a response
//                              (server down, wrong URL, CORS blocked)
//   error.status  = 4xx/5xx -> the server answered with an error;
//                              error.message is FastAPI's "detail"

const API_SESSION_KEY = "apexmart_session";

const API_NETWORK_ERROR_MESSAGE =
    `Could not reach the server at ${API_BASE_URL}. ` +
    "Make sure FastAPI is running, and check the browser console " +
    "for a CORS error.";


class ApiError extends Error {
    constructor(message, { status = 0, network = false, data = null } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.network = network;
        this.data = data;
    }
}


/** Full URL for an API path ("/api/..."); full URLs pass through. */
function apiUrl(path) {
    return /^https?:\/\//.test(path) ? path : API_BASE_URL + path;
}


/** Uploaded files are stored as "/uploads/..." paths. */
function apiAssetUrl(path) {
    if (!path) return "";
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    return API_BASE_URL + path;
}


/**
 * Turns FastAPI's error body into one readable sentence.
 * - HTTPException:      { "detail": "Seller not found." }
 * - Validation (422):   { "detail": [{ "loc": [...], "msg": "..." }, ...] }
 */
function apiDetailMessage(data) {
    const detail = data && data.detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
        return detail
            .map(item => {
                const field = (item.loc || []).filter(p => p !== "body").join(".");
                // Pydantic prefixes custom validator messages
                const msg = String(item.msg || "").replace(/^Value error, /, "");
                return field ? `${field}: ${msg}` : msg;
            })
            .join("\n");
    }

    return "";
}


function apiStoredToken() {
    try {
        const session = JSON.parse(localStorage.getItem(API_SESSION_KEY));
        return session && session.token ? session.token : null;
    } catch (e) {
        return null;
    }
}


/**
 * fetch() for the backend. Returns the parsed JSON body (or null
 * for an empty body) and throws ApiError on any failure.
 *
 * options: same as fetch(), plus
 *   body   - plain objects are sent as JSON; FormData as-is
 *   auth   - false to skip the logged-in user's token
 */
async function apiFetch(path, options = {}) {
    const { auth = true, ...fetchOptions } = options;
    const headers = { ...(fetchOptions.headers || {}) };
    let body = fetchOptions.body;

    if (body && typeof body === "object" && !(body instanceof FormData)) {
        body = JSON.stringify(body);
        headers["Content-Type"] = "application/json";
    }

    const token = auth ? apiStoredToken() : null;
    if (token && !headers.Authorization) {
        headers.Authorization = "Bearer " + token;
    }

    const url = apiUrl(path);
    let response;

    try {
        response = await fetch(url, { ...fetchOptions, headers, body });
    } catch (networkError) {
        // Server down, wrong address, or CORS blocked the request
        console.error(`Network/CORS error calling ${url}:`, networkError);
        throw new ApiError(API_NETWORK_ERROR_MESSAGE, { network: true });
    }

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = text; // not JSON (e.g. a plain "Internal Server Error")
        }
    }

    if (!response.ok) {
        console.error(`API error ${response.status} from ${url}:`, data);

        const message =
            apiDetailMessage(data) ||
            `Request failed: ${response.status} ${response.statusText}`.trim();

        throw new ApiError(message, { status: response.status, data });
    }

    return data;
}


/**
 * Message to show the user for an error from apiFetch().
 * Anything else (a bug in page code) is logged and gets the fallback.
 */
function apiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
    if (error instanceof ApiError) return error.message;

    console.error(error);
    return fallback;
}


// Namespaced access used by js/auth.js
window.ApexApi = {
    BASE_URL: API_BASE_URL,
    SESSION_KEY: API_SESSION_KEY,
    ApiError,
    request: apiFetch,
    assetUrl: apiAssetUrl,
};
