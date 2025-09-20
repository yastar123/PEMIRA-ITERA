interface MockUser {
  id: string
  email: string
  created_at: string
}

interface MockAuthResponse {
  data: { user: MockUser | null }
  error: any
}

interface MockDataResponse<T> {
  data: T | null
  error: any
}

class MockSupabaseClient {
  auth = {
    signInWithPassword: async ({ email, password }: { email: string; password: string }): Promise<MockAuthResponse> => {
      // Mock authentication - accept any email/password for testing
      if (email && password) {
        return {
          data: {
            user: {
              id: "1",
              email,
              created_at: new Date().toISOString(),
            },
          },
          error: null,
        }
      }
      return {
        data: { user: null },
        error: { message: "Invalid credentials" },
      }
    },

    signUp: async ({
      email,
      password,
      options,
    }: { email: string; password: string; options?: any }): Promise<MockAuthResponse> => {
      return {
        data: {
          user: {
            id: Math.random().toString(),
            email,
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      }
    },

    getUser: async (): Promise<MockAuthResponse> => {
      // Mock logged in user for testing
      return {
        data: {
          user: {
            id: "1",
            email: "test@itera.ac.id",
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      }
    },

    signOut: async () => {
      return { error: null }
    },
  }

  from = (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: async (): Promise<MockDataResponse<any>> => {
          // Mock database responses based on table
          if (table === "User") {
            return {
              data: {
                id: "1",
                email: value,
                nim: "121140001",
                name: "Test User",
                phone: "081234567890",
                programStudi: "Teknik Informatika",
                gender: "MALE",
                role: "VOTER",
                isRegistered: true,
                hasVoted: false,
                createdAt: new Date().toISOString(),
              },
              error: null,
            }
          }
          if (table === "Candidate") {
            return {
              data: [
                {
                  id: "1",
                  name: "Kandidat 1",
                  description: "Visi misi kandidat 1",
                  photoUrl: "/candidate-photo.jpg",
                  voteCount: 0,
                },
                {
                  id: "2",
                  name: "Kandidat 2",
                  description: "Visi misi kandidat 2",
                  photoUrl: "/candidate-photo.jpg",
                  voteCount: 0,
                },
              ],
              error: null,
            }
          }
          return { data: null, error: null }
        },
      }),
    }),

    insert: async (data: any): Promise<MockDataResponse<any>> => {
      return { data: { ...data, id: Math.random().toString() }, error: null }
    },

    update: async (data: any) => ({
      eq: (column: string, value: any) => ({
        select: async (): Promise<MockDataResponse<any>> => {
          return { data: [{ ...data, id: value }], error: null }
        },
      }),
    }),
  })
}

export function createClient() {
  return new MockSupabaseClient()
}
