import AsyncStorage from "@react-native-async-storage/async-storage";

// key used to store the JWT token
const TOKEN_KEY = "auth_token";

export const auth = {
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

  // Remove token on logout
  async clear() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error("Failed to clear token:", e);
    }
  },
};
