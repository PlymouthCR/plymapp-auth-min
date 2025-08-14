/* =========================================================================
   Plymouth Practice – app.js (versión mínima y robusta)
   - Login / SignUp / Logout con Supabase
   - Pinta la UI fiable al cambiar el estado de auth
   - Evita loops de caché y estados zombis
   =======================================================================*/

/* -------------------- Helpers -------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

// Panel de logs (opcional)
function log(msg) {
  console.log(msg);
  const box = $("#debug-log");
  if (!box) return;
  const p = document.createElement("div");
  p.textContent = msg;
  box.appendChild(p);
  box.scrollTop = box.scrollHeight;
}

/* -------------------- Obtener credenciales -------------------- */
const SB_URL =
  window.SUPABASE_URL ||
  window.__SUPABASE_URL__ ||
  document.querySelector('meta[name="https://ltkxdikyamllfcpugrcc.supabase.co"]')?.content;

const SB_KEY =
  window.SUPABASE_ANON_KEY ||
  window.__SUPABASE_ANON_KEY__ ||
  document.querySelector('meta[name="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0a3hkaWt5YW1sbGZjcHVncmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzc0ODAsImV4cCI6MjA3MDc1MzQ4MH0.dTSVaj9ae_PppaTPxcvJbX_Q7PyqnolJ2VH-0mtGdhY"]')?.content;

if (!SB_URL || !SB_KEY) {
  log("❌ No encuentro las credenciales de Supabase. Revisa URL y anon key.");
  // Evita que siga y dé errores en consola:
  throw new Error("Missing Supabase credentials");
}

/* -------------------- Supabase client -------------------- */
const supabase = window.supabase.createClient(SB_URL, SB_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/* -------------------- UI -------------------- */
async function paintUI() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    log("getSession error: " + error.message);
    return;
  }
  const logged = !!data?.session;

  // Mostrar/ocultar contenedores
  $("#anon")?.classList.toggle("hidden", logged);   // ocultar login si hay sesión
  $("#authed")?.classList.toggle("hidden", !logged); // mostrar welcome si hay sesión

  // Mostrar email del usuario (si existe)
  $("#who") && ($("#who").textContent = logged ? (data.session.user?.email || "") : "");

  log(`[AUTH] paintUI -> logged: ${logged}`);
}

// Escuchar los cambios de auth y repintar
(function hookAuth() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    log(`[AUTH] change: ${event} | session: ${!!session}`);
    await paintUI();
  });
})();

/* -------------------- Acciones -------------------- */
async function doSignup() {
  const btn = $("#btn-signup");
  const email = $("#email")?.value.trim();
  const pass  = $("#pass")?.value.trim();

  if (!email || !pass) return alert("Enter email & password.");

  btn && (btn.disabled = true);
  try {
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return alert("Sign up error: " + error.message);

    alert("Sign up ok. Si tienes 'Confirm email' activo, revisa tu correo.");
  } catch (e) {
    alert("Sign up error: " + (e?.message || e));
  } finally {
    btn && (btn.disabled = false);
  }
}

async function doLogin() {
  const btn = $("#btn-login");
  const email = $("#email")?.value.trim();
  const pass  = $("#pass")?.value.trim();

  if (!email || !pass) return alert("Enter email & password.");

  btn && (btn.disabled = true);
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email, password: pass,
    });
    if (error) return alert("Login error: " + error.message);

    log("login ok");
    // Limpia campos y repinta
    $("#email") && ($("#email").value = "");
    $("#pass")  && ($("#pass").value  = "");
    await paintUI();
  } catch (e) {
    alert("Login error: " + (e?.message || e));
  } finally {
    btn && (btn.disabled = false);
  }
}

async function doLogout() {
  const btn = $("#btn-logout");
  btn && (btn.disabled = true);
  try {
    await supabase.auth.signOut();
    try { localStorage.clear(); sessionStorage.clear(); } catch {}

    // Forzar UI inmediata (evita quedarse en "Welcome")
    $("#authed")?.classList.add("hidden");
    $("#anon")?.classList.remove("hidden");
    $("#who") && ($("#who").textContent = "");

    // Romper caché para que nunca veas la vista antigua
    const u = new URL(location.href);
    u.searchParams.set('_', Date.now().toString());
    location.replace(u.toString());
  } catch (e) {
    alert("Logout error: " + (e?.message || e));
  } finally {
    btn && (btn.disabled = false);
  }
}

/* -------------------- Event listeners -------------------- */
on($("#btn-signup"), "click", (e) => { e.preventDefault(); doSignup(); });
on($("#btn-login"),  "click", (e) => { e.preventDefault(); doLogin();  });
on($("#btn-logout"), "click", (e) => { e.preventDefault(); doLogout(); });

/* -------------------- Init -------------------- */
(async () => {
  // Pinta la UI con el estado actual
  await paintUI();

  // Log de arranque
  const { data } = await supabase.auth.getSession();
  log(`[AUTH] init -> logged: ${!!data?.session}`);
})();
