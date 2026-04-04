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

export default function Sidebar() {
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
    <aside className="w-72 min-h-screen bg-[#f7e8e8] border-r border-[#ead6d6] p-5">
      <div className="mb-8">
        <div className="rounded-3xl bg-white shadow-sm border border-[#ead6d6] p-4">
          <div className="flex items-center gap-3">
            {empresa?.logo_url ? (
              <img
                src={empresa.logo_url}
                alt="Logo empresa"
                className="h-14 w-14 object-contain rounded-2xl bg-white border border-[#ead6d6] p-2"
              />
            ) : null}

            <div>
              <h1 className="text-xl font-bold text-[#5b4242]">
                {empresa?.nombre || "Mia Bella"}
              </h1>
              <p className="text-sm text-[#8b6f6f]">
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
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  isActive
                    ? "bg-[#d9aeb2] text-white shadow"
                    : "text-[#5b4242] hover:bg-white"
                }`
              }
            >
              <Icon size={18} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}