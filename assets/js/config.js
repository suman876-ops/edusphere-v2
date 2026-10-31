/*
 * Public runtime configuration.
 *
 * The key below is the project's *anon* key: a JWT that PostgREST accepts in
 * both the apikey and the Authorization header. It is designed to sit in client
 * code — it carries no privileges of its own, and every request it makes is
 * filtered by the row-level security policies in the database.
 *
 * The newer sb_publishable_… keys are not JWTs, so sending one as a Bearer
 * token makes PostgREST reject the request with "Invalid JWT". That is why this
 * file uses the anon key instead.
 *
 * Never put a service_role key here — tools/build.py fails the build if one
 * appears.
 */
window.EDUSPHERE_CONFIG = {
  supabaseUrl: "https://krmrjbygrdfxgrlwmhsf.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybXJqYnlncmRmeGdybHdtaHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNTk1NTYsImV4cCI6MjEwODgzNTU1Nn0.TeZVZcFKhFWYOv8kxG-FOJIRlfVhxMLC8fW1zjnd3dM",
  tables: {
    modules: "site_modules",
    campuses: "site_campuses",
    notices: "site_notices",
    enquiries: "site_enquiries",
    applications: "site_applications"
  }
};
