/*
 * Public runtime configuration.
 *
 * The key below is a Supabase *publishable* key. It is designed to sit in client code:
 * it can only do what the row-level security policies allow. It is not a secret, and
 * rotating it costs nothing. Never put a service_role key in this file — the build
 * script fails if you do.
 */
window.EDUSPHERE_CONFIG = {
  supabaseUrl: "https://krmrjbygrdfxgrlwmhsf.supabase.co",
  supabaseKey: "sb_publishable_fMZjTfYBEF__E4cOYpmcHQ_IBqnlvLi",
  tables: {
    modules: "site_modules",
    campuses: "site_campuses",
    notices: "site_notices",
    enquiries: "site_enquiries"
  }
};
