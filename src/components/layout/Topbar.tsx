import { Menu } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";

type TopbarProps = {
  onOpenMenu: () => void;
};

export default function Topbar({ onOpenMenu }: TopbarProps) {
  const { profile, user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <header className="bg-white border-b border-[#ead6d6] px-3 sm:px-4 md:px-6 py-3 sm:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenMenu}
            className="lg:hidden mt-1 shrink-0 rounded-2xl border border-[#ead6d6] bg-white p-2 text-[#4a3535]"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-[#4a3535] break-words">
              Panel principal
            </h2>
            <p className="text-sm text-[#8b6f6f] break-words">
              Gestiona clientes, sellos, premios y cumpleaños
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <div className="rounded-2xl bg-[#fff7f7] border border-[#ead6d6] px-4 py-2 text-right max-w-[240px]">
            <p className="text-sm font-semibold text-[#5b4242] break-words">
              {profile?.nombre || user?.email || "Usuario"}
            </p>
            <p className="text-xs text-[#8b6f6f] break-words">
              Rol: {profile?.rol || "Sin rol"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-2xl border border-[#ead6d6] bg-white px-4 py-2 text-sm font-semibold text-[#4a3535] whitespace-nowrap"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 md:hidden">
        <div className="rounded-2xl bg-[#fff7f7] border border-[#ead6d6] px-4 py-3">
          <p className="text-sm font-semibold text-[#5b4242] break-words">
            {profile?.nombre || user?.email || "Usuario"}
          </p>
          <p className="text-xs text-[#8b6f6f] break-words">
            Rol: {profile?.rol || "Sin rol"}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full rounded-2xl border border-[#ead6d6] bg-white px-4 py-3 text-sm font-semibold text-[#4a3535]"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}