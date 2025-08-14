/* ========= Pega aquí tus llaves de Supabase ========= */
/* Supabase → Settings → API */
const SB_URL  = "https://ltkxdikyamllfcpugrcc.supabase.co";   // <— cámbialo
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0a3hkaWt5YW1sbGZjcHVncmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzc0ODAsImV4cCI6MjA3MDc1MzQ4MH0.dTSVaj9ae_PppaTPxcvJbX_Q7PyqnolJ2VH-0mtGdhY";               // <— cámbialo

/* Cliente Supabase con sesión persistente */
window.supabase = supabase.createClient(SB_URL, SB_ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

/* Helpers + debug */
const $ = s => document.querySelector(s);
function log(m){ console.log("[AUTH]", m); const d=$("#debug-log"); if(d){ d.append(m+"\n"); d.scrollTop=d.scrollHeight; }}

/* Pintar UI según sesión */
async function paintUI() {
  // getSession NO lanza error cuando no hay sesión
  const { data, error } = await supabase.auth.getSession();
  if (error) log("getSession error: " + error.message);

  const session = data?.session || null;
  const logged = !!session;

  // Muestra/Oculta tarjetas
  $("#anon").classList.toggle("hidden", logged);
  $("#authed").classList.toggle("hidden", !logged);

  // Email en la esquina
  $("#who").textContent = logged ? (session.user?.email || "") : "";

  log("paintUI -> logged: " + logged);
}

/* Escuchar cambios de auth (login/logout/confirmación) */
let hooked = false;
function hookAuth(){
  if (hooked) return;
  supabase.auth.onAuthStateChange(async (ev, session) => {
    log(`auth change: ${ev} | session: ${!!session}`);
    await paintUI();
  });
  hooked = true;
}

/* Botones */
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

$("#btn-login")?.addEventListener("click", async () => {
  const email = $("#email").value.trim();
  const pass  = $("#pass").value.trim();
  if(!email || !pass) return alert("Enter email & password.");
  $("#btn-login").disabled = true;
  try{
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return alert(error.message);
    log("login ok");
    await paintUI(); // sin recargar
  }catch(e){ alert("Login error: "+(e?.message||e)); }
  finally{ $("#btn-login").disabled = false; }
});

$("#btn-logout")?.addEventListener("click", async () => {
  $("#btn-logout").disabled = true;
  try {
    await supabase.auth.signOut();
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    await paintUI();                      // <-- repinta a estado "login"
    // Si aún ves "Welcome" por cache, descomenta la línea de abajo:
    // window.location.reload();
  } catch (e) {
    alert("Logout error: " + (e?.message || e));
  } finally {
    $("#btn-logout").disabled = false;
  }
});
/* Arranque mínimo */
(async function start(){
  hookAuth();
  await paintUI();
  const { data, error } = await supabase.auth.getUser();
  log("init: "+(data?.user ? "LOGGED IN" : "NO SESSION")+(error? " | "+error.message:""));
})();
