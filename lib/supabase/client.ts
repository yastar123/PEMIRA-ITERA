interface User {
  id: string
  email: string
  name: string
  nim: string
  role: string
  hasVoted: boolean
}

interface AuthResponse {
  data: { user: User | null }
  error: any
}

interface DataResponse<T> {
  data: T | null
  error: any
}

class SupabaseClient {
  auth = {
    signInWithPassword: async ({ email, password }: { email: string; password: string }): Promise<AuthResponse> => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const result = await response.json()

        if (!response.ok) {
          return {
            data: { user: null },
            error: { message: result.error || 'Login failed' },
          }
        }

        return {
          data: { user: result.user },
          error: null,
        }
      } catch (error) {
        return {
          data: { user: null },
          error: { message: 'Network error' },
        }
      }
    },

    signUp: async ({
      email,
      password,
      options,
    }: { email: string; password: string; options?: any }): Promise<AuthResponse> => {
      try {
        const userData = options?.data || {}
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            ...userData
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          return {
            data: { user: null },
            error: { message: result.error || 'Registration failed' },
          }
        }

        return {
          data: { user: result.user },
          error: null,
        }
      } catch (error) {
        return {
          data: { user: null },
          error: { message: 'Network error' },
        }
      }
    },

    getUser: async (): Promise<AuthResponse> => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
        })

        const result = await response.json()

        if (!response.ok) {
          return {
            data: { user: null },
            error: { message: result.error || 'Get user failed' },
          }
        }

        return {
          data: { user: result.user },
          error: null,
        }
      } catch (error) {
        return {
          data: { user: null },
          error: { message: 'Network error' },
        }
      }
    },

    signOut: async () => {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
        })
        return { error: null }
      } catch (error) {
        return { error: { message: 'Logout failed' } }
      }
    },
  }

  from = (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: async (): Promise<DataResponse<any>> => {
          // This would be handled by specific API endpoints
          return { data: null, error: null }
        },
      }),
    }),

    insert: async (data: any): Promise<DataResponse<any>> => {
      // This would be handled by specific API endpoints
      return { data: null, error: null }
    },

    update: async (data: any) => ({
      eq: (column: string, value: any) => ({
        select: async (): Promise<DataResponse<any>> => {
          return { data: null, error: null }
        },
      }),
    }),
  })
}

export function createClient() {
  return new SupabaseClient()
}
