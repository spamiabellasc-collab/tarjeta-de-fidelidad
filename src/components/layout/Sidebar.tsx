import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Gift,
  Cake,
  Settings,
  ShieldCheck,
  ScanLine,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { obtenerEmpresaPorId } from "../../features/configuracion/configuracionService";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes/nuevo", label: "Nuevo cliente", icon: UserPlus },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/scanner", label: "Escáner QR", icon: ScanLine },
  { to: "/premios", label: "Premios", icon: Gift },
  { to: "/cumpleanos", label: "Cumpleaños", icon: Cake },
  { to: "/configuracion", label: "Configuración", icon: Settings },
  { to: "/usuarios", label: "Usuarios", icon: ShieldCheck },
];

type EmpresaMini = {
  nombre: string;
  nombre_tarjeta: string | null;
  logo_url: string | null;
};

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const { profile } = useAuth();
  const [empresa, setEmpresa] = useState<EmpresaMini | null>(null);

  useEffect(() => {
    async function cargarEmpresa() {
      if (!profile?.empresa_id) return;

      const { data } = await obtenerEmpresaPorId(profile.empresa_id);
      setEmpresa((data as EmpresaMini) || null);
    }

    void cargarEmpresa();
  }, [profile?.empresa_id]);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed left-0 top-0 z-50 h-screen w-72 max-w-[85vw] bg-[#f7e8e8] border-r border-[#ead6d6] p-5 transition-transform duration-300 ease-out lg:static lg:z-auto lg:block lg:min-h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <p className="text-sm font-semibold text-[#5b4242]">Menú</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#ead6d6] bg-white p-2 text-[#5b4242]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-8">
          <div className="rounded-3xl bg-white shadow-sm border border-[#ead6d6] p-4">
            <div className="flex items-center gap-3 min-w-0">
              {empresa?.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt="Logo empresa"
                  className="h-14 w-14 shrink-0 object-contain rounded-2xl bg-white border border-[#ead6d6] p-2"
                />
              ) : null}

              <div className="min-w-0">
                <h1 className="text-xl font-bold text-[#5b4242] break-words">
                  {empresa?.nombre || "Mia Bella"}
                </h1>
                <p className="text-sm text-[#8b6f6f] break-words">
                  {empresa?.nombre_tarjeta || "Tarjeta de fidelidad"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {links.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    isActive
                      ? "bg-[#d9aeb2] text-white shadow"
                      : "text-[#5b4242] hover:bg-white"
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span className="font-medium break-words">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}