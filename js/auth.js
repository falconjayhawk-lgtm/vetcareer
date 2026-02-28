// ── Clerk Authentication ───────────────────────────────────────────────
const CLERK_PUBLISHABLE_KEY = 'pk_test_dW5iaWFzZWQtYmx1ZWpheS0zMS5jbGVyay5hY2NvdW50cy5kZXYk';

let clerkInstance = null;

// Waits for the Clerk script to finish loading, then initializes.
// The script tag is async so window.Clerk may not exist yet at page load.
async function initClerk() {
  try {
    // Poll for window.Clerk up to 10 seconds — async script may still be loading
    await waitForClerk();

    const clerk = window.Clerk;
    await clerk.load({ publishableKey: CLERK_PUBLISHABLE_KEY });
    clerkInstance = clerk;

    if (clerk.user) {
      syncClerkUserToState(clerk.user);
      setState({ loggedIn: true });
      if (typeof initFeedback === 'function') initFeedback();
      // Show onboarding for new users
      if (typeof shouldShowOnboarding === 'function' && shouldShowOnboarding()) {
        setState({ view: 'onboarding', ui: { ...state.ui, onboardStep: 1 } });
      }
    } else {
      setState({ loggedIn: false });
    }
  } catch (err) {
    console.error('Clerk init error:', err);
    // Fall back to showing the login page with an error message
    setState({ loggedIn: false, ui: { clerkError: true } });
  }
}

// Polls until window.Clerk is available or times out
function waitForClerk(maxWaitMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window.Clerk) { resolve(); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.Clerk) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > maxWaitMs) {
        clearInterval(interval);
        reject(new Error('Clerk script did not load within 10 seconds'));
      }
    }, 50);
  });
}

// Copies Clerk user info into app state (name, email)
function syncClerkUserToState(user) {
  if (!user) return;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const email = user.primaryEmailAddress?.emailAddress || '';
  if (!state.profile.fullName && fullName) state.profile.fullName = fullName;
  if (!state.profile.email && email) state.profile.email = email;
  state.clerkUserId = user.id;
}

// Mounts Clerk's pre-built sign-in UI into a container element
function mountClerkSignIn(elementId) {
  if (!clerkInstance) return;
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    clerkInstance.mountSignIn(el);
  } catch(err) {
    console.error('mountSignIn error:', err);
  }
}

// Signs the user out and resets app state
async function clerkSignOut() {
  try {
    if (clerkInstance) await clerkInstance.signOut();
  } catch (err) {
    console.error('Sign out error:', err);
  }
  setState({ loggedIn: false, view: 'dashboard', ui: {} });
}

// Returns the current user's display name for the sidebar
function getDisplayName() {
  const user = clerkInstance?.user;
  if (!user) return '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.primaryEmailAddress?.emailAddress || '';
}
