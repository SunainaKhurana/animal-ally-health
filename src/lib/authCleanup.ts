
export const cleanupAuthState = () => {
  console.log('🧹 Starting complete auth state cleanup...');
  
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log('Removing localStorage key:', key);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log('Removing sessionStorage key:', key);
        sessionStorage.removeItem(key);
      }
    });
  }
  
  console.log('✅ Auth state cleanup completed');
};

export const debugAuthState = async (supabase: any) => {
  try {
    console.log('🔍 Debugging auth state...');
    
    // Check current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Session data:', sessionData);
    console.log('Session error:', sessionError);
    
    // Check current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('User data:', userData);
    console.log('User error:', userError);
    
    // Test a simple query to check if RLS is working
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    console.log('Test query data:', testData);
    console.log('Test query error:', testError);
    
  } catch (error) {
    console.error('Error debugging auth state:', error);
  }
};
