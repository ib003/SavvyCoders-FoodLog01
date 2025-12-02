import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.4.35:3000";

// Add this helper function at the top of the file
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 3000): Promise<Response> => {
  // Use Promise.race for better React Native compatibility
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout - server is not responding")), timeout)
    ),
  ]);
};

// keys used to store auth data
const TOKEN_KEY = "auth_token";
const USER_EMAIL_KEY = "user_email";

export interface LoginResponse {
  token: string;
  email?: string;
}

export const auth = {
  // Quick server connectivity check
  async checkServerConnection(): Promise<boolean> {
    try {
      // Quick 2-second check using Promise.race
      const response = await Promise.race([
        fetch(`${BASE_URL}/foods?q=test`, { method: "GET" }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2000)
        ),
      ]);
      
      return response.ok || response.status < 500; // Server is reachable
    } catch (error: any) {
      return false; // Server not reachable
    }
  },

  // Login with email and password
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log("Attempting login to:", `${BASE_URL}/auth/login`);
      
      // Quick server check before attempting login
      const serverAvailable = await this.checkServerConnection();
      if (!serverAvailable) {
        throw new Error("Cannot connect to server. Please check:\n1. Server is running\n2. Correct IP address\n3. Same network");
      }
      
      const response = await fetchWithTimeout(
        `${BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ email: email.trim(), password }),
        },
        3000 // 3 second timeout for faster failure
      );

      console.log("Login response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || "Invalid email or password";
        } catch (e) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || `Server error (${response.status})`;
          } catch (e2) {
            errorMessage = `Server error (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error("No token received from server");
      }

      // Handle both old format { token, email } and new format { token, user: { id, email } }
      const userEmail = data.user?.email || data.email || email.trim();

      await this.saveToken(data.token);
      await AsyncStorage.setItem(USER_EMAIL_KEY, userEmail);
      console.log("Login successful, token saved");
      return { token: data.token, email: userEmail };
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle network errors
      if (
        error.message.includes("fetch") || 
        error.message.includes("Network") || 
        error.message.includes("Failed to fetch") ||
        error.message.includes("timeout") ||
        error.message.includes("not responding")
      ) {
        throw new Error("Cannot connect to server. Please check:\n1. Server is running\n2. Correct IP address\n3. Same network");
      }
      
      throw new Error(error.message || "Login failed. Please try again.");
    }
  },

  // Register new user with email and password
  async register(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log("Attempting registration to:", `${BASE_URL}/auth/register`);
      
      // Quick server check before attempting registration
      const serverAvailable = await this.checkServerConnection();
      if (!serverAvailable) {
        throw new Error("Cannot connect to server. Please check:\n1. Server is running\n2. Correct IP address\n3. Same network");
      }
      
      const response = await fetchWithTimeout(
        `${BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ email: email.trim(), password }),
        },
        3000 // 3 second timeout for faster failure
      );

      console.log("Register response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || "Unable to create account";
          
          if (errorMessage.toLowerCase().includes("unique") || errorMessage.toLowerCase().includes("already")) {
            errorMessage = "An account with this email already exists. Please sign in instead.";
          }
        } catch (e) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || `Server error (${response.status})`;
          } catch (e2) {
            errorMessage = `Server error (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Registration response data:", JSON.stringify(data, null, 2));
      
      if (!data.token) {
        console.error("No token in registration response:", data);
        throw new Error("No token received from server");
      }

      // Handle both old format { token, email } and new format { token, user: { id, email } }
      const userEmail = data.user?.email || data.email || email.trim();
      console.log("Saving token and email:", { hasToken: !!data.token, userEmail });

      await this.saveToken(data.token);
      await AsyncStorage.setItem(USER_EMAIL_KEY, userEmail);
      
      // Verify token was saved
      const savedToken = await this.getToken();
      console.log("Token saved successfully:", savedToken ? "Yes" : "No");
      
      console.log("Registration successful, token saved");
      return { token: data.token, email: userEmail };
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Handle network errors
      if (
        error.message.includes("fetch") || 
        error.message.includes("Network") || 
        error.message.includes("Failed to fetch") ||
        error.message.includes("timeout") ||
        error.message.includes("not responding")
      ) {
        throw new Error("Cannot connect to server. Please check:\n1. Server is running\n2. Correct IP address\n3. Same network");
      }
      
      throw new Error(error.message || "Registration failed. Please try again.");
    }
  },

  // Save token after login or register
  async saveToken(token: string) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error("Failed to save token:", e);
    }
  },

  // Retrieve token for authenticated requests
  async getToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (e) {
      console.error("Failed to read token:", e);
      return null;
    }
  },

  // Get user email
  async getUserEmail() {
    try {
      return await AsyncStorage.getItem(USER_EMAIL_KEY);
    } catch (e) {
      console.error("Failed to read user email:", e);
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    // Development mode flag - allows bypass in dev mode
    const DEV_MODE = true; // Set to false in production
    
    const token = await this.getToken();
    if (!token) {
      // In dev mode, allow access even without token (for testing)
      return DEV_MODE;
    }
    
    // Basic validation - token should be a JWT string
    if (typeof token !== 'string' || token.length < 10) {
      // Invalid token format, clear it
      await this.clear();
      // In dev mode, still allow access
      return DEV_MODE;
    }
    return true;
  },

  // Remove token on logout
  async clear() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_EMAIL_KEY]);
      console.log("Auth data cleared successfully");
    } catch (e) {
      console.error("Failed to clear auth data:", e);
    }
  },

  // Clear token helper for testing/debugging
  async clearToken() {
    return this.clear();
  },
};
