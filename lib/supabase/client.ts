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

interface ChannelCallback {
  (payload: any): void
}

interface PostgresChangesFilter {
  event?: string
  schema?: string
  table?: string
  filter?: string
}

class MockChannel {
  private callbacks: Map<string, ChannelCallback[]> = new Map()
  
  on(
    type: string, 
    filter: PostgresChangesFilter, 
    callback: ChannelCallback
  ) {
    const key = `${type}:${filter.table || '*'}`
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, [])
    }
    this.callbacks.get(key)!.push(callback)
    return this
  }
  
  subscribe(callback?: (status: string) => void) {
    // Simulate successful subscription
    if (callback) {
      setTimeout(() => callback('SUBSCRIBED'), 100)
    }
    return this
  }
  
  unsubscribe() {
    this.callbacks.clear()
    return Promise.resolve({ error: null })
  }
  
  // Method to simulate real-time updates (for testing)
  _simulateUpdate(table: string, payload: any) {
    const key = `postgres_changes:${table}`
    const callbacks = this.callbacks.get(key) || []
    callbacks.forEach(callback => callback(payload))
  }
}

class SupabaseClient {
  private channels: Map<string, MockChannel> = new Map()
  
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
  
  // Add channel method for real-time functionality
  channel(name: string): MockChannel {
    if (!this.channels.has(name)) {
      this.channels.set(name, new MockChannel())
    }
    return this.channels.get(name)!
  }
  
  // Remove channel
  removeChannel(channel: MockChannel) {
    for (const [name, ch] of this.channels.entries()) {
      if (ch === channel) {
        this.channels.delete(name)
        break
      }
    }
    return Promise.resolve({ error: null })
  }
  
  from = (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        single: async (): Promise<DataResponse<any>> => {
          try {
            const response = await fetch(`/api/${table}?${column}=${value}&single=true`, {
              method: 'GET',
            })
            const result = await response.json()
            if (!response.ok) {
              return { data: null, error: { message: result.error } }
            }
            return { data: result.data, error: null }
          } catch (error) {
            return { data: null, error: { message: 'Network error' } }
          }
        },
      }),
      order: (column: string, options?: { ascending?: boolean }) => ({
        async: async (): Promise<DataResponse<any[]>> => {
          try {
            const direction = options?.ascending === false ? 'desc' : 'asc'
            const response = await fetch(`/api/${table}?order=${column}&direction=${direction}`, {
              method: 'GET',
            })
            const result = await response.json()
            if (!response.ok) {
              return { data: null, error: { message: result.error } }
            }
            return { data: result.data, error: null }
          } catch (error) {
            return { data: null, error: { message: 'Network error' } }
          }
        },
      }),
    }),
    
    insert: async (data: any): Promise<DataResponse<any>> => {
      try {
        const response = await fetch(`/api/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
        const result = await response.json()
        if (!response.ok) {
          return { data: null, error: { message: result.error } }
        }
        return { data: result.data, error: null }
      } catch (error) {
        return { data: null, error: { message: 'Network error' } }
      }
    },
    
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: async (): Promise<DataResponse<any>> => {
          try {
            const response = await fetch(`/api/${table}?${column}=${value}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            })
            const result = await response.json()
            if (!response.ok) {
              return { data: null, error: { message: result.error } }
            }
            return { data: result.data, error: null }
          } catch (error) {
            return { data: null, error: { message: 'Network error' } }
          }
        },
      }),
    }),
    
    delete: () => ({
      eq: (column: string, value: any) => ({
        async: async (): Promise<DataResponse<any>> => {
          try {
            const response = await fetch(`/api/${table}?${column}=${value}`, {
              method: 'DELETE',
            })
            const result = await response.json()
            if (!response.ok) {
              return { data: null, error: { message: result.error } }
            }
            return { data: result.data, error: null }
          } catch (error) {
            return { data: null, error: { message: 'Network error' } }
          }
        },
      }),
    }),
  })
}

export function createClient() {
  return new SupabaseClient()
}