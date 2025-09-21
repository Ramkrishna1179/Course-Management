// JWT utility functions for token handling
export function decodeJWT(token: string) {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    return JSON.parse(decodedPayload);
    } catch (error) {
      // Handle JWT decoding error silently
      return null;
    }
}

export function getRoleFromToken(token: string): string | null {
  const decoded = decodeJWT(token);
  return decoded?.role || null;
}

// Extract user information from JWT token
export function getUserFromToken(token: string) {
  const decoded = decodeJWT(token);
  return decoded ? {
    id: decoded.id,
    email: decoded.Email,
    username: decoded.userName,
    role: decoded.role
  } : null;
}
