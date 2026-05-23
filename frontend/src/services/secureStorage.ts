import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'my_phone_agent_access_token';
const REFRESH_KEY = 'my_phone_agent_refresh_token';

export const secureStorage = {
  async saveTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
    ]);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  async clearTokens() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY)
    ]);
  }
};
