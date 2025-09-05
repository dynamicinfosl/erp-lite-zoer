import { NextResponse } from "next/server";
import { setCookie, clearCookie } from "./api-utils";

/**
 * Creates a JSON success response with custom structure
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Creates a JSON error response with custom structure
 */
export function createErrorResponse(params: {
  errorCode?: string,
  errorMessage: string,
  status?: number,
}): Response {
  const { errorCode, errorMessage, status = 500 } = params;
  return new Response(
    JSON.stringify({
      success: false,
      errorCode,
      errorMessage,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

// Create auth response
export function createAuthResponse(params: {
  accessToken: string;
  refreshToken: string;
}, redirectUrl?: string): Response {
  const { accessToken, refreshToken } = params;
  const response = redirectUrl ? NextResponse.redirect(redirectUrl) : new Response(
    JSON.stringify({
      success: true,
      data: true
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // Set two separate cookies using utility functions
  setCookie(response, "auth-token", accessToken, { path: "/" });
  setCookie(response, "refresh-token", refreshToken, { 
    path: "/next_api/auth/refresh" 
  });

  return response;
}

// Create logout response
export function createLogoutResponse(): Response {
  const response = new Response(
    JSON.stringify({
      success: true,
      message: "Logged out successfully",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // Clear both auth cookies using utility functions
  clearCookie(response, "auth-token", "/");
  clearCookie(response, "refresh-token", "/");

  return response;
}