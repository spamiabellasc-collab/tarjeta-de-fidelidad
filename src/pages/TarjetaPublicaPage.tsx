import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  obtenerCanjesCliente,
  obtenerClientePorId,
  obtenerPremiosPorEmpresa,
} from "../features/clientes/clientesService";
import { obtenerEmpresaPorId } from "../features/configuracion/configuracionService";
import { formatearFecha } from "../lib/dates";

type Cliente = {
  id: string;
  empresa_id: string;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  sellos_actuales: number;
  sellos_historicos: number;
  ciclo_tarjeta: number;
  activo?: boolean | null;
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
  telefono: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  logo_url: string | null;
  icono_sello: string | null;
};

export default function TarjetaPublicaPage() {
  const { id } = useParams();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [canjes, setCanjes] = useState<Canje[]>([]);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorPantalla, setErrorPantalla] = useState("");

  async function cargarTarjeta() {
    try {
      if (!id) {
        setErrorPantalla("No se recibió el ID del cliente.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorPantalla("");

      const { data: clienteData, error: clienteError } = await obtenerClientePorId(id);

      if (clienteError) {
        console.error("Error cargando cliente:", clienteError);
        setErrorPantalla("No se pudo cargar el cliente.");
        setLoading(false);
        return;
      }

      const clienteFinal = (clienteData as Cliente) || null;
      setCliente(clienteFinal);

      if (!clienteFinal) {
        setErrorPantalla("No se encontró el cliente.");
        setLoading(false);
        return;
      }

      if (!clienteFinal.empresa_id) {
        setErrorPantalla("El cliente no tiene empresa asociada.");
        setLoading(false);
        return;
      }

      const [
        { data: empresaData, error: empresaError },
        { data: premiosData, error: premiosError },
        { data: canjesData, error: canjesError },
      ] = await Promise.all([
        obtenerEmpresaPorId(clienteFinal.empresa_id),
        obtenerPremiosPorEmpresa(clienteFinal.empresa_id),
        obtenerCanjesCliente(clienteFinal.id),
      ]);

      if (empresaError) console.error("Error cargando empresa:", empresaError);
      if (premiosError) console.error("Error cargando premios:", premiosError);
      if (canjesError) console.error("Error cargando canjes:", canjesError);

      setEmpresa((empresaData as Empresa) || null);
      setPremios((premiosData as Premio[]) || []);
      setCanjes((canjesData as Canje[]) || []);

      const urlQr = `${window.location.origin}/clientes/${clienteFinal.id}/scan`;
      const qrGenerado = await QRCode.toDataURL(urlQr, {
        width: 220,
        margin: 2,
      });
      setQrUrl(qrGenerado);

      setLoading(false);
    } catch (error) {
      console.error("Error general cargando tarjeta pública:", error);
      setErrorPantalla("Ocurrió un error inesperado al cargar la tarjeta.");
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargarTarjeta();
  }, [id]);

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
  const nombreEmpresa =
    empresa?.nombre_comercial || empresa?.nombre || "Mi Empresa";
  const nombreTarjeta = empresa?.nombre_tarjeta || "Tarjeta de fidelidad";
  const iconoSello = empresa?.icono_sello || "✿";

  async function compartirTarjeta() {
    try {
      const url = window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: nombreTarjeta,
          text: `Mira mi progreso en ${nombreEmpresa}`,
          url,
        });
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado");
        return;
      }

      window.prompt("Copia este enlace:", url);
    } catch (error) {
      console.error("Error compartiendo tarjeta:", error);
      alert("No se pudo compartir el enlace.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff9f8] flex items-center justify-center p-6">
        <p className="text-[#8b6f6f]">Cargando tarjeta...</p>
      </div>
    );
  }

  if (errorPantalla) {
    return (
      <div className="min-h-screen bg-[#fff9f8] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white border border-[#ead6d6] p-8 text-center">
          <h1 className="text-2xl font-bold text-[#4a3535]">
            Tarjeta no disponible
          </h1>
          <p className="text-[#8b6f6f] mt-3">{errorPantalla}</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-[#fff9f8] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white border border-[#ead6d6] p-8 text-center">
          <h1 className="text-2xl font-bold text-[#4a3535]">
            Tarjeta no disponible
          </h1>
          <p className="text-[#8b6f6f] mt-3">
            No se encontró una tarjeta pública para este cliente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background: `linear-gradient(180deg, ${colorSecundario} 0%, #fff9f8 100%)`,
      }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: colorPrimario }}>
            {nombreEmpresa}
          </p>
          <h1 className="text-3xl font-bold text-[#4a3535] mt-2">
            {nombreTarjeta}
          </h1>
        </div>

        <div
          className="rounded-[32px] overflow-hidden shadow-lg border"
          style={{
            borderColor: colorPrimario,
            background: `linear-gradient(145deg, ${colorSecundario} 0%, #ffffff 100%)`,
          }}
        >
          <div
            className="px-8 py-6"
            style={{
              background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
            }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-white/90 tracking-wide">
                  {nombreEmpresa}
                </p>
                <h2 className="text-3xl font-bold text-white mt-2">
                  {nombreTarjeta}
                </h2>
                <p className="text-white/90 mt-2 text-sm">
                  Cliente: {cliente.nombre_completo}
                </p>
              </div>

              {empresa?.logo_url ? (
                <div className="h-20 w-20 rounded-3xl bg-white/90 p-3 flex items-center justify-center">
                  <img
                    src={empresa.logo_url}
                    alt="Logo empresa"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-[#8b6f6f]">Ciclo actual</p>
                <p className="text-xl font-bold text-[#4a3535]">
                  #{cliente.ciclo_tarjeta}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#8b6f6f]">Sellos actuales</p>
                <p className="text-xl font-bold text-[#4a3535]">
                  {cliente.sellos_actuales}/10
                </p>
              </div>

              <div>
                <p className="text-sm text-[#8b6f6f]">Próximo premio</p>
                <p className="text-base font-semibold text-[#4a3535]">
                  {siguientePremio ? siguientePremio.nombre : "Tarjeta completa"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, index) => {
                const lleno = index < cliente.sellos_actuales;

                return (
                  <div
                    key={index}
                    className="h-20 rounded-3xl flex items-center justify-center text-3xl border"
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

            <div className="mt-8 rounded-3xl border border-[#ead6d6] bg-white/70 p-5">
              {siguientePremio && faltanParaSiguiente !== null ? (
                <>
                  <p className="text-sm text-[#8b6f6f]">Te faltan</p>
                  <p className="text-2xl font-bold text-[#4a3535]">
                    {faltanParaSiguiente} sello(s)
                  </p>
                  <p className="text-sm text-[#8b6f6f] mt-1">
                    para canjear: {siguientePremio.nombre}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#8b6f6f]">¡Excelente!</p>
                  <p className="text-2xl font-bold text-[#4a3535]">
                    Tarjeta completa
                  </p>
                  <p className="text-sm text-[#8b6f6f] mt-1">
                    Ya puedes canjear tu premio final.
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 rounded-3xl bg-white/80 border border-[#ead6d6] p-6 text-center">
              <p className="text-sm text-[#8b6f6f] mb-4">
                Tu QR para sellado rápido
              </p>

              {qrUrl ? (
                <div className="flex justify-center">
                  <img
                    src={qrUrl}
                    alt="QR del cliente"
                    className="rounded-2xl border border-[#ead6d6] p-3 bg-white"
                  />
                </div>
              ) : null}

              <p className="text-xs text-[#8b6f6f] mt-4">
                Muéstralo en tu próxima visita para registrar tus sellos más rápido.
              </p>
            </div>

            <div className="mt-6 text-xs text-[#8b6f6f] flex items-center justify-between gap-3 flex-wrap">
              <span>Histórico: {cliente.sellos_historicos} sello(s)</span>
              {cliente.fecha_nacimiento ? (
                <span>Cumpleaños: {formatearFecha(cliente.fecha_nacimiento)}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => void compartirTarjeta()}
              className="rounded-2xl px-6 py-3 font-semibold text-white"
              style={{ backgroundColor: colorPrimario }}
            >
              Compartir tarjeta
            </button>

            {empresa?.telefono ? (
              <a
                href={`https://wa.me/${empresa.telefono.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[#ead6d6] px-6 py-3 font-semibold text-[#4a3535]"
              >
                Contactar a la empresa
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}