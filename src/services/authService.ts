export interface AuthContextType {
  isAuthenticated: boolean
  account: any | null
  accessToken: string | null
  login: () => Promise<void>
  logout: () => void
  getAccessToken: (scopes: string[]) => Promise<string | null>
}

class AuthService {
  private account: any | null = null
  private accessToken: string | null = null
  private isMockMode: boolean = false

  async initialize(): Promise<void> {
    // Check if we're in mock mode
    this.isMockMode = import.meta.env.VITE_USE_MOCK_DATA === 'true'
    
    if (this.isMockMode) {
      // Mock authentication for testing
      this.account = {
        username: 'test@corvus.com',
        name: 'Test User',
        localAccountId: 'mock-account-id'
      }
      this.accessToken = 'mock-access-token'
      console.log('🔧 Auth Service initialized in MOCK MODE')
      return
    }
    
    throw new Error('Real authentication requires Azure MSAL packages. Use mock mode for testing.')
  }

  async loginWithTeams(): Promise<void> {
    if (this.isMockMode) {
      // Already authenticated in mock mode
      return
    }
    
    throw new Error('Real Teams authentication requires Azure packages. Use mock mode for testing.')
  }

  async login(): Promise<void> {
    if (this.isMockMode) {
      // Already authenticated in mock mode
      return
    }
    
    throw new Error('Real login requires Azure MSAL packages. Use mock mode for testing.')
  }

  logout(): void {
    if (this.isMockMode) {
      this.account = null
      this.accessToken = null
      return
    }
    
    this.account = null
    this.accessToken = null
  }

  async getAccessToken(_scopes: string[] = []): Promise<string | null> {
    if (this.isMockMode) {
      return this.accessToken
    }
    
    return null
  }

  isAuthenticated(): boolean {
    return this.account !== null
  }

  getAccount(): any | null {
    return this.account
  }

  getCurrentAccessToken(): string | null {
    return this.accessToken
  }
}

export const authService = new AuthService()