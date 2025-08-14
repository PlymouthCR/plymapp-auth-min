/* ========= Pega aquí tus llaves de Supabase ========= */
/* Supabase → Settings → API */
const SB_URL  = "https://TU-PROJECT.supabase.co";   // <— cámbialo
const SB_ANON = "TU_ANON_PUBLIC_KEY";               // <— cámbialo

/* Cliente Supabase con sesión persistente */
window.supabase = supabase.createClient(SB_URL, SB_ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

/* Helpers + debug */
const $ = s => document.querySelector(s);
function log(m){ console.log("[AUTH]", m); const d=$("#debug-log"); if(d){ d.append(m+"\n"); d.scrollTop=d.scrollHeight; }}

/* Pintar UI según sesión */
async function paintUI(){
  const { data, error } = await supabase.auth.getUser();
  if(error) log("getUser error: "+error.message);
  const user = data?.user ?? null;
  $("#who").textContent = user ? (user.email||"Logged in") : "";
  $("#anon").classList.toggle("hidden", !!user);
  $("#authed").classList.toggle("hidden", !user);
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
  try{
    await supabase.auth.signOut();
    try{ localStorage.clear(); sessionStorage.clear(); }catch{}
    await paintUI();
  }catch(e){ alert("Logout error: "+(e?.message||e)); }
  finally{ $("#btn-logout").disabled = false; }
});

/* Arranque mínimo */
(async function start(){
  hookAuth();
  await paintUI();
  const { data, error } = await supabase.auth.getUser();
  log("init: "+(data?.user ? "LOGGED IN" : "NO SESSION")+(error? " | "+error.message:""));
})();
