import { deleteUserById, findUserIdByEmail } from './supabase-admin'

export async function cleanupUserByEmail(email: string): Promise<void> {
  try {
    const userId = await findUserIdByEmail(email)
    if (!userId) return
    await deleteUserById(userId)
  } catch (err) {
    // Cleanup must never hide the real E2E failure.
    // We rethrow only if explicitly requested by caller.
    console.warn('E2E cleanup failed:', err)
  }
}

