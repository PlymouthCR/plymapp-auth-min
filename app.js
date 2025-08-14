/* ========= TU CONFIG ========= */
const SB_URL  = "https://ltkxdikyamllfcpugrcc.supabase.co";   // <-- cambia
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0a3hkaWt5YW1sbGZjcHVncmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzc0ODAsImV4cCI6MjA3MDc1MzQ4MH0.dTSVaj9ae_PppaTPxcvJbX_Q7PyqnolJ2VH-0mtGdhY";               // <-- cambia

window.supabase = supabase.createClient(SB_URL, SB_ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const $ = s => document.querySelector(s);
function log(m){ const d=$("#debug-log"); if(d){ d.append(m+"\n"); d.scrollTop=d.scrollHeight; } console.log("[AUTH]", m); }

async function paintUI(){
  const { data, error } = await supabase.auth.getSession();
  if (error) log("getSession error: " + error.message);

  const logged = !!data?.session;
  $("#anon")?.classList.toggle("hidden", logged);
  $("#authed")?.classList.toggle("hidden", !logged);
  $("#who").textContent = logged ? (data.session.user?.email || "") : "";
  log("paintUI -> logged: " + logged);
}

let hooked = false;
function hookAuth(){
  if (hooked) return;
  supabase.auth.onAuthStateChange(async (ev, session) => {
    log(`auth change: ${ev} | session: ${!!session}`);
    await paintUI();
  });
  hooked = true;
}

/* ---------- Sign up ---------- */
$("#btn-signup")?.addEventListener("click", async () => {
  const email = $("#email").value.trim();
  const pass  = $("#pass").value.trim();
  if(!email || !pass) return alert("Enter email & password.");
  $("#btn-signup").disabled = true;
  try{
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return alert(error.message);
    alert("Check your email to confirm (if confirmation is enabled).");
  }catch(e){ alert("Sign up error: "+(e?.message||e)); }
  finally{ $("#btn-signup").disabled = false; }
});

/* ---------- Login ---------- */
$("#btn-login")?.addEventListener("click", async () => {
  const email = $("#email").value.trim();
  const pass  = $("#pass").value.trim();
  if(!email || !pass) return alert("Enter email & password.");
  $("#btn-login").disabled = true;
  try{
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return alert(error.message);
    log("login ok");
    await paintUI();
  }catch(e){ alert("Login error: "+(e?.message||e)); }
  finally{ $("#btn-login").disabled = false; }
});

/* ---------- Logout (forzado) ---------- */
$("#btn-logout")?.addEventListener("click", async () => {
  $("#btn-logout").disabled = true;
  try{
    await supabase.auth.signOut();

    // Limpieza defensiva
    try { localStorage.clear(); sessionStorage.clear(); } catch {}

    // FORZAR la UI inmediatamente (sin esperar eventos)
    $("#anon")?.classList.remove("hidden");
    $("#authed")?.classList.add("hidden");
    $("#who").textContent = "";

    // Cinturón y tirantes: recarga con cache-buster para evitar vistas cacheadas
    setTimeout(() => {
      const u = new URL(window.location.href);
      u.searchParams.set("_", Date.now()); // rompe caché
      window.location.replace(u.toString());
    }, 50);

  }catch(e){
    alert("Logout error: "+(e?.message||e));
  }finally{
    $("#btn-logout").disabled = false;
  }
});

/* ---------- Arranque ---------- */
(async function start(){
  hookAuth();
  await paintUI();
  const { data, error } = await supabase.auth.getSession();
  log("init: "+(data?.session ? "LOGGED IN" : "NO SESSION")+(error? " | "+error.message:""));
})();
