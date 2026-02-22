// ── Clerk Authentication ───────────────────────────────────────────────
// Clerk handles all sign-up, sign-in, session management, and sign-out.
// The publishable key is safe to expose in frontend code — it identifies
// your Clerk application but cannot be used to access private data.

const CLERK_PUBLISHABLE_KEY = 'pk_test_dW5iaWFzZWQtYmx1ZWpheS0zMS5jbGVyay5hY2NvdW50cy5kZXYk';

let clerkInstance = null;

// Called once at app startup — loads Clerk and checks for existing session
async function initClerk() {
  try {
    const clerk = window.Clerk;
    if (!clerk) { console.error('Clerk SDK not loaded'); return; }

    await clerk.load();
    clerkInstance = clerk;

    // If user is already signed in, go straight to the app
    if (clerk.user) {
      syncClerkUserToState(clerk.user);
      setState({ loggedIn: true });
    } else {
      // Not signed in — show login screen
      setState({ loggedIn: false });
    }
  } catch (err) {
    console.error('Clerk init error:', err);
    setState({ loggedIn: false });
  }
}

// Copies Clerk user info into app state (name, email)
// so the rest of the app can use it without knowing about Clerk
function syncClerkUserToState(user) {
  if (!user) return;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const email = user.primaryEmailAddress?.emailAddress || '';

  // Pre-fill profile name/email if not already set
  if (!state.profile.fullName && fullName) {
    state.profile.fullName = fullName;
  }
  if (!state.profile.email && email) {
    state.profile.email = email;
  }

  // Store Clerk user ID — will be used as the Supabase row key later
  state.clerkUserId = user.id;
}

// Mounts Clerk's pre-built sign-in UI into a container element
function mountClerkSignIn(elementId) {
  if (!clerkInstance) return;
  const el = document.getElementById(elementId);
  if (!el) return;
  clerkInstance.mountSignIn(el, {
    afterSignInUrl: window.location.href,
    afterSignUpUrl: window.location.href,
  });
}

// Signs the user out via Clerk, then resets app state
async function clerkSignOut() {
  try {
    if (clerkInstance) await clerkInstance.signOut();
  } catch (err) {
    console.error('Sign out error:', err);
  }
  // Clear sensitive in-memory state but keep localStorage intact
  // so their data is waiting when they sign back in
  setState({ loggedIn: false, view: 'dashboard', ui: {} });
}

// Returns true if there's an active Clerk session
function isSignedIn() {
  return !!(clerkInstance?.user);
}

// Returns the current user's display name for the sidebar
function getDisplayName() {
  const user = clerkInstance?.user;
  if (!user) return '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.primaryEmailAddress?.emailAddress || '';
}
