import { useEffect, useMemo, useState } from "react";
import { Users, Ticket, Gift, Cake } from "lucide-react";
import StatCard from "../components/ui/StatCard";
import { supabase } from "../api/supabase";
import { useAuth } from "../features/auth/AuthContext";
import {
  obtenerClientesConPremioProximo,
  obtenerClientesInactivos,
  obtenerCumpleanosProximos,
  type ClienteDashboard,
  type PremioDashboard,
} from "../lib/dashboard";
import { abrirWhatsapp } from "../lib/whatsapp";
import { formatearFecha } from "../lib/dates";
import { obtenerEmpresaPorId } from "../features/configuracion/configuracionService";

type EmpresaMini = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  telefono: string | null;
};

export default function DashboardPage() {
  const { profile } = useAuth();

  const [clientes, setClientes] = useState<ClienteDashboard[]>([]);
  const [premios, setPremios] = useState<PremioDashboard[]>([]);
  const [totalSellos, setTotalSellos] = useState(0);
  const [empresa, setEmpresa] = useState<EmpresaMini | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargarDashboard() {
    if (!profile?.empresa_id) return;

    setLoading(true);

    const [
      { data: clientesData, error: clientesError },
      { data: premiosData, error: premiosError },
      { count: sellosCount, error: sellosError },
      { data: empresaData, error: empresaError },
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select(
          "id, nombre_completo, fecha_nacimiento, telefono, ultima_visita_at, sellos_actuales, activo"
        )
        .eq("empresa_id", profile.empresa_id)
        .is("deleted_at", null)
        .eq("activo", true)
        .order("nombre_completo", { ascending: true }),

      supabase
        .from("premios")
        .select("id, nombre, sellos_requeridos, activo")
        .eq("empresa_id", profile.empresa_id)
        .order("sellos_requeridos", { ascending: true }),

      supabase
        .from("movimientos_sellos")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", profile.empresa_id)
        .eq("tipo", "sello"),

      obtenerEmpresaPorId(profile.empresa_id),
    ]);

    if (clientesError) {
      console.error("Error cargando clientes:", clientesError);
    }

    if (premiosError) {
      console.error("Error cargando premios:", premiosError);
    }

    if (sellosError) {
      console.error("Error cargando sellos:", sellosError);
    }

    if (empresaError) {
      console.error("Error cargando empresa:", empresaError);
    }

    setClientes((clientesData as ClienteDashboard[]) || []);
    setPremios((premiosData as PremioDashboard[]) || []);
    setTotalSellos(sellosCount || 0);
    setEmpresa((empresaData as EmpresaMini) || null);

    setLoading(false);
  }

  useEffect(() => {
    void cargarDashboard();
  }, [profile?.empresa_id]);

  const cumpleanosProximos = useMemo(
    () => obtenerCumpleanosProximos(clientes, 7),
    [clientes]
  );

  const clientesPremioProximo = useMemo(
    () => obtenerClientesConPremioProximo(clientes, premios),
    [clientes, premios]
  );

  const clientesInactivos = useMemo(
    () => obtenerClientesInactivos(clientes, 15, 30),
    [clientes]
  );

  const cumpleanosHoy = useMemo(
    () => cumpleanosProximos.filter((c) => c.dias_para_cumple === 0),
    [cumpleanosProximos]
  );

  const nombreEmpresa =
    empresa?.nombre_comercial || empresa?.nombre || "nuestro centro";

  function enviarWhatsappCumpleanosHoy(
    telefono: string,
    nombreCliente: string
  ) {
    const mensaje = `¡Hola ${nombreCliente}! 🎉

Todo el equipo de ${nombreEmpresa} te desea un feliz cumpleaños.

Te esperamos para consentirte en tu día especial 💖`;

    abrirWhatsapp(telefono, mensaje);
  }

  function enviarWhatsappPremioProximo(
    telefono: string,
    nombreCliente: string,
    premioNombre: string,
    sellosFaltantes: number
  ) {
    const mensaje = `¡Hola ${nombreCliente}! ✨

Te escribimos de ${nombreEmpresa} para contarte que estás muy cerca de tu próximo premio.

Solo te faltan ${sellosFaltantes} sello(s) para canjear: ${premioNombre}.

¡Te esperamos pronto para seguir sumando! 💖`;

    abrirWhatsapp(telefono, mensaje);
  }

  function enviarWhatsappInactivo(
    telefono: string,
    nombreCliente: string,
    diasInactivo: number
  ) {
    const mensaje = `¡Hola ${nombreCliente}! 😊

Te saludamos de ${nombreEmpresa}. Hace ${diasInactivo} días que no nos visitas y queremos invitarte a volver.

Será un gusto atenderte nuevamente 💖`;

    abrirWhatsapp(telefono, mensaje);
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4a3535]">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-[#8b6f6f]">
          Resumen general de tu programa de fidelidad
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Cantidad de clientes"
          value={loading ? "..." : clientes.length}
          subtitle="Clientes activos registrados"
          icon={<Users size={22} />}
        />
        <StatCard
          title="Cantidad de sellos"
          value={loading ? "..." : totalSellos}
          subtitle="Sellos entregados históricamente"
          icon={<Ticket size={22} />}
        />
        <StatCard
          title="Premios próximos"
          value={loading ? "..." : clientesPremioProximo.length}
          subtitle="Clientes cerca de canjear"
          icon={<Gift size={22} />}
        />
        <StatCard
          title="Cumpleaños próximos"
          value={loading ? "..." : cumpleanosProximos.length}
          subtitle="Próximos 7 días"
          icon={<Cake size={22} />}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-3xl bg-white border border-[#ead6d6] p-4 sm:p-5 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-[#4a3535]">
            Cumpleaños del día
          </h2>

          <div className="mt-4 space-y-3">
            {cumpleanosHoy.length === 0 ? (
              <p className="text-sm text-[#8b6f6f]">
                No hay cumpleaños para hoy.
              </p>
            ) : (
              cumpleanosHoy.map((cliente) => (
                <div
                  key={cliente.id}
                  className="rounded-2xl border border-[#ead6d6] p-3 min-w-0"
                >
                  <p className="font-semibold text-[#4a3535] break-words">
                    {cliente.nombre_completo}
                  </p>
                  <p className="text-sm text-[#8b6f6f] break-all">
                    {cliente.telefono || "Sin teléfono"}
                  </p>

                  {cliente.telefono ? (
                    <button
                      onClick={() =>
                        enviarWhatsappCumpleanosHoy(
                          cliente.telefono!,
                          cliente.nombre_completo
                        )
                      }
                      className="mt-3 w-full sm:w-auto rounded-xl bg-[#d9aeb2] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Enviar WhatsApp
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#ead6d6] p-4 sm:p-5 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-[#4a3535]">
            Clientes con premio próximo
          </h2>

          <div className="mt-4 space-y-3">
            {clientesPremioProximo.length === 0 ? (
              <p className="text-sm text-[#8b6f6f]">
                No hay clientes cerca de premio por ahora.
              </p>
            ) : (
              clientesPremioProximo.slice(0, 5).map((cliente) => (
                <div
                  key={cliente.id}
                  className="rounded-2xl border border-[#ead6d6] p-3 min-w-0"
                >
                  <p className="font-semibold text-[#4a3535] break-words">
                    {cliente.nombre_completo}
                  </p>
                  <p className="text-sm text-[#8b6f6f] break-words">
                    Premio: {cliente.premio_nombre}
                  </p>
                  <p className="text-sm text-[#8b6f6f]">
                    Le faltan {cliente.sellos_faltantes} sello(s)
                  </p>

                  {cliente.telefono ? (
                    <button
                      onClick={() =>
                        enviarWhatsappPremioProximo(
                          cliente.telefono!,
                          cliente.nombre_completo,
                          cliente.premio_nombre,
                          cliente.sellos_faltantes
                        )
                      }
                      className="mt-3 w-full sm:w-auto rounded-xl bg-[#4a3535] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Enviar promoción
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#ead6d6] p-4 sm:p-5 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-[#4a3535]">
            Clientes inactivos
          </h2>

          <div className="mt-4 space-y-3">
            {clientesInactivos.length === 0 ? (
              <p className="text-sm text-[#8b6f6f]">
                No hay clientes inactivos entre 15 y 30 días.
              </p>
            ) : (
              clientesInactivos.slice(0, 5).map((cliente) => (
                <div
                  key={cliente.id}
                  className="rounded-2xl border border-[#ead6d6] p-3 min-w-0"
                >
                  <p className="font-semibold text-[#4a3535] break-words">
                    {cliente.nombre_completo}
                  </p>
                  <p className="text-sm text-[#8b6f6f] break-words">
                    Última visita: {formatearFecha(cliente.ultima_visita_at)}
                  </p>
                  <p className="text-sm text-[#8b6f6f]">
                    {cliente.dias_inactivo} días sin visitar
                  </p>

                  {cliente.telefono ? (
                    <button
                      onClick={() =>
                        enviarWhatsappInactivo(
                          cliente.telefono!,
                          cliente.nombre_completo,
                          cliente.dias_inactivo
                        )
                      }
                      className="mt-3 w-full sm:w-auto rounded-xl border border-[#ead6d6] px-4 py-2.5 text-sm font-semibold text-[#4a3535]"
                    >
                      Recontactar por WhatsApp
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}