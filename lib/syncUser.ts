import { auth0 } from '@/lib/auth0';
import UserService from '@/lib/userService';
import { IUser } from '@/models/User';

/**
 * Server-side function to sync Auth0 user with MongoDB
 * Call this in server components or API routes after authentication
 *
 * This ensures the user exists in MongoDB without creating duplicates
 */
export async function syncUserToDatabase(): Promise<{
  user: IUser | null;
  isNewUser: boolean;
}> {
  try {
    // Get the current session from Auth0
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return { user: null, isNewUser: false };
    }

    const auth0User = session.user;

    // Ensure email is present
    if (!auth0User.email) {
      throw new Error('User email not found in Auth0 session');
    }

    // Extract user data from Auth0 session
    const userData = {
      sub: auth0User.sub,
      email: auth0User.email,
      firstName: auth0User.given_name || auth0User.name?.split(' ')[0] || 'User',
      username: auth0User.nickname || auth0User.email.split('@')[0],
      // Optional: Add dateOfBirth if you have it in custom claims
      // dateOfBirth: auth0User['https://yourapp.com/dateOfBirth']
    };

    // Find or create user in MongoDB (won't create duplicates)
    const { user, isNewUser } = await UserService.findOrCreateUser(userData);

    return { user, isNewUser };
  } catch (error) {
    console.error('Error syncing user to database:', error);
    throw error;
  }
}

/**
 * Get current user from MongoDB with all data
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<IUser | null> {
  try {
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return null;
    }

    // Find user by Auth0 sub
    const user = await UserService.findBySub(session.user.sub);

    // If user doesn't exist in DB, sync them
    if (!user) {
      const { user: syncedUser } = await syncUserToDatabase();
      return syncedUser;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
}