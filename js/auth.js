// ── Clerk Authentication ───────────────────────────────────────────────
const CLERK_PUBLISHABLE_KEY = 'pk_test_dW5iaWFzZWQtYmx1ZWpheS0zMS5jbGVyay5hY2NvdW50cy5kZXYk';
let clerkInstance = null;

// Waits for the Clerk script to finish loading, then initializes.
async function initClerk() {
  try {
    await waitForClerk();
    const clerk = window.Clerk;
    await clerk.load({ publishableKey: CLERK_PUBLISHABLE_KEY });
    clerkInstance = clerk;

    if (clerk.user) {
      syncClerkUserToState(clerk.user);
      setState({ loggedIn: true });
      if (typeof initFeedback === 'function') initFeedback();

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('reset') === '1') {
        if (typeof resetAllData === 'function') {
          resetAllData();
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }
      }

      if (typeof shouldShowOnboarding === 'function' && shouldShowOnboarding()) {
        setState({ view: 'onboarding', ui: { ...state.ui, onboardStep: 1 } });
      }
    } else {
      // Not logged in — re-render so mountClerkSignIn runs AFTER clerkInstance is set
      setState({ loggedIn: false });
      render();
      setTimeout(() => mountClerkSignIn('clerk-signin-container'), 50);
    }

  } catch (err) {
    console.error('Clerk init error:', err);
    setState({ loggedIn: false, ui: { clerkError: true } });
    render();
  }
}

// Waits for Clerk via onload event, falls back to polling
function waitForClerk(maxWaitMs = 15000) {
  return new Promise((resolve, reject) => {
    if (window.Clerk) { resolve(); return; }
    // Try hooking into the script tag's onload
    const clerkScript = document.querySelector('script[data-clerk-publishable-key]');
    if (clerkScript) {
      const onLoad = () => { if (window.Clerk) resolve(); else pollForClerk(); };
      clerkScript.addEventListener('load', onLoad);
    }
    // Polling fallback in case onload already fired
    const start = Date.now();
    function pollForClerk() {
      if (window.Clerk) { resolve(); return; }
      if (Date.now() - start > maxWaitMs) {
        reject(new Error('Clerk script did not load within 15 seconds'));
        return;
      }
      setTimeout(pollForClerk, 100);
    }
    setTimeout(pollForClerk, 500);
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
  render();
  setTimeout(() => mountClerkSignIn('clerk-signin-container'), 50);
}

// Returns the current user's display name for the sidebar
function getDisplayName() {
  const user = clerkInstance?.user;
  if (!user) return '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.primaryEmailAddress?.emailAddress || '';
}  } catch (err) {
    console.error('Clerk init error:', err);
    setState({ loggedIn: false, ui: { clerkError: true } });
    render();
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
  render();
  setTimeout(() => mountClerkSignIn('clerk-signin-container'), 50);
}

// Returns the current user's display name for the sidebar
function getDisplayName() {
  const user = clerkInstance?.user;
  if (!user) return '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.primaryEmailAddress?.emailAddress || '';
}
