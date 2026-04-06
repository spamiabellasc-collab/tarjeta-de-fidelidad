import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  agregarSelloCliente,
  obtenerCanjesCliente,
  obtenerClientePorId,
  obtenerPremiosPorEmpresa,
} from "../features/clientes/clientesService";
import { useAuth } from "../features/auth/AuthContext";
import { obtenerEmpresaPorId } from "../features/configuracion/configuracionService";

type Cliente = {
  id: string;
  empresa_id: string;
  nombre_completo: string;
  telefono: string | null;
  sellos_actuales: number;
  sellos_historicos: number;
  ciclo_tarjeta: number;
};

type Premio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  sellos_requeridos: number;
  activo: boolean;
};

type Canje = {
  id: string;
  premio_id: string;
  ciclo_tarjeta: number;
};

type Empresa = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  nombre_tarjeta: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  icono_sello: string | null;
};

export default function ClienteScanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [canjes, setCanjes] = useState<Canje[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  async function cargarTodo() {
    if (!id || !profile?.empresa_id) return;

    setLoading(true);

    const [
      { data: clienteData, error: clienteError },
      { data: premiosData, error: premiosError },
      { data: canjesData, error: canjesError },
      { data: empresaData, error: empresaError },
    ] = await Promise.all([
      obtenerClientePorId(id),
      obtenerPremiosPorEmpresa(profile.empresa_id),
      obtenerCanjesCliente(id),
      obtenerEmpresaPorId(profile.empresa_id),
    ]);

    if (clienteError) console.error("Error cargando cliente:", clienteError);
    if (premiosError) console.error("Error cargando premios:", premiosError);
    if (canjesError) console.error("Error cargando canjes:", canjesError);
    if (empresaError) console.error("Error cargando empresa:", empresaError);

    setCliente((clienteData as Cliente) || null);
    setPremios((premiosData as Premio[]) || []);
    setCanjes((canjesData as Canje[]) || []);
    setEmpresa((empresaData as Empresa) || null);
    setLoading(false);
  }

  useEffect(() => {
    void cargarTodo();
  }, [id, profile?.empresa_id]);

  const siguientePremio = useMemo(() => {
    if (!cliente) return null;

    return premios.find((premio) => {
      const yaCanjeadoEnEsteCiclo = canjes.some(
        (canje) =>
          canje.premio_id === premio.id &&
          canje.ciclo_tarjeta === cliente.ciclo_tarjeta
      );

      return (
        cliente.sellos_actuales < premio.sellos_requeridos &&
        !yaCanjeadoEnEsteCiclo
      );
    });
  }, [cliente, premios, canjes]);

  const faltanParaSiguiente = useMemo(() => {
    if (!cliente || !siguientePremio) return null;
    return siguientePremio.sellos_requeridos - cliente.sellos_actuales;
  }, [cliente, siguientePremio]);

  const colorPrimario = empresa?.color_primario || "#D9AEB2";
  const colorSecundario = empresa?.color_secundario || "#F4E7E7";
  const nombreTarjeta = empresa?.nombre_tarjeta || "Tarjeta de fidelidad";
  const iconoSello = empresa?.icono_sello || "✿";
  const nombreEmpresa =
    empresa?.nombre_comercial || empresa?.nombre || "Mi Empresa";

  async function handleAgregarSelloRapido() {
    if (!cliente || !profile?.empresa_id || !user?.id) {
      alert("Faltan datos para agregar sello");
      return;
    }

    setGuardando(true);

    const { error } = await agregarSelloCliente({
      cliente_id: cliente.id,
      empresa_id: profile.empresa_id,
      realizado_por: user.id,
      sellos_actuales: cliente.sellos_actuales,
      sellos_historicos: cliente.sellos_historicos,
    });

    setGuardando(false);

    if (error) {
      alert("Error al agregar sello: " + error.message);
      return;
    }

    alert("Sello agregado correctamente");
    await cargarTodo();
  }

  if (loading) {
    return <div className="text-[#8b6f6f]">Cargando vista rápida...</div>;
  }

  if (!cliente) {
    return <div className="text-[#8b6f6f]">No se encontró el cliente.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4a3535]">
          Sellado rápido
        </h1>
        <p className="text-sm sm:text-base text-[#8b6f6f]">
          Agrega sellos rápidamente escaneando el QR del cliente
        </p>
      </div>

      <div
        className="overflow-hidden rounded-[28px] sm:rounded-[32px] shadow-sm border"
        style={{
          borderColor: colorPrimario,
          background: `linear-gradient(145deg, ${colorSecundario} 0%, #ffffff 100%)`,
        }}
      >
        <div
          className="px-4 py-5 sm:px-8 sm:py-6"
          style={{
            background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
          }}
        >
          <p className="text-xs sm:text-sm font-medium text-white/90 tracking-wide break-words">
            {nombreEmpresa}
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white break-words">
            {nombreTarjeta}
          </h2>
          <p className="mt-2 text-sm text-white/90 break-words">
            Cliente: {cliente.nombre_completo}
          </p>
        </div>

        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {Array.from({ length: 10 }).map((_, index) => {
              const lleno = index < cliente.sellos_actuales;

              return (
                <div
                  key={index}
                  className="h-12 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-xl sm:text-3xl border"
                  style={{
                    backgroundColor: lleno ? colorPrimario : "#fff7f7",
                    color: lleno ? "#ffffff" : "#c8a4a8",
                    borderColor: lleno ? colorPrimario : "#ead6d6",
                  }}
                >
                  {iconoSello}
                </div>
              );
            })}
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white/80 border border-[#ead6d6] p-4 sm:p-5 min-w-0">
              <p className="text-sm text-[#8b6f6f]">Sellos actuales</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#4a3535]">
                {cliente.sellos_actuales}
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 border border-[#ead6d6] p-4 sm:p-5 min-w-0">
              <p className="text-sm text-[#8b6f6f]">Próximo premio</p>
              <p className="text-base sm:text-lg font-semibold text-[#4a3535] break-words">
                {siguientePremio ? siguientePremio.nombre : "Tarjeta completa"}
              </p>

              {faltanParaSiguiente !== null ? (
                <p className="text-sm text-[#8b6f6f] mt-1">
                  Faltan {faltanParaSiguiente} sello(s)
                </p>
              ) : (
                <p className="text-sm text-[#8b6f6f] mt-1">
                  Ya puede canjear premio final
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <button
              onClick={handleAgregarSelloRapido}
              disabled={guardando}
              className="w-full sm:w-auto rounded-2xl text-white px-5 sm:px-8 py-3 sm:py-4 font-semibold text-base sm:text-lg"
              style={{ backgroundColor: colorPrimario }}
            >
              {guardando ? "Guardando..." : "Agregar sello"}
            </button>

            <button
              onClick={() => navigate(`/clientes/${cliente.id}`)}
              className="w-full sm:w-auto rounded-2xl border border-[#ead6d6] px-5 sm:px-6 py-3 sm:py-4 font-semibold text-[#4a3535]"
            >
              Ver ficha completa
            </button>

            <button
              onClick={() => navigate("/scanner")}
              className="w-full sm:w-auto rounded-2xl border border-[#ead6d6] px-5 sm:px-6 py-3 sm:py-4 font-semibold text-[#4a3535]"
            >
              Volver a escanear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}