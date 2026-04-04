import { useAuth } from "../../features/auth/AuthContext";

export default function Topbar() {
  const { profile, user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <header className="h-20 bg-white border-b border-[#ead6d6] px-6 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-[#4a3535]">Panel principal</h2>
        <p className="text-sm text-[#8b6f6f]">
          Gestiona clientes, sellos, premios y cumpleaños
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#fff7f7] border border-[#ead6d6] px-4 py-2 text-right">
          <p className="text-sm font-semibold text-[#5b4242]">
            {profile?.nombre || user?.email || "Usuario"}
          </p>
          <p className="text-xs text-[#8b6f6f]">
            Rol: {profile?.rol || "Sin rol"}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-2xl border border-[#ead6d6] bg-white px-4 py-2 text-sm font-semibold text-[#4a3535]"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}