import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  buscarClientePorTelefono,
  obtenerEmpresaPublicaPorSlug,
  registrarClientePublico,
} from "../features/clientes/registroPublicoService";

type EmpresaPublica = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  nombre_tarjeta: string | null;
  logo_url: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  slug: string;
};

export default function RegistroClientePublicoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [empresa, setEmpresa] = useState<EmpresaPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  useEffect(() => {
    async function cargarEmpresa() {
      if (!slug) return;

      setLoading(true);
      setError("");

      const { data, error } = await obtenerEmpresaPublicaPorSlug(slug);

      if (error) {
        console.error("Error cargando empresa pública:", error);
        setError("No se pudo cargar la empresa.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("No encontramos esta página de registro.");
        setLoading(false);
        return;
      }

      setEmpresa(data);
      setLoading(false);
    }

    void cargarEmpresa();
  }, [slug]);

  const colorPrimario = useMemo(
    () => empresa?.color_primario || "#D9AEB2",
    [empresa]
  );

  const colorSecundario = useMemo(
    () => empresa?.color_secundario || "#F4E7E7",
    [empresa]
  );

  const nombreVisible = useMemo(
    () => empresa?.nombre_comercial || empresa?.nombre || "LuminaClub",
    [empresa]
  );

  const nombreTarjeta = useMemo(
    () => empresa?.nombre_tarjeta || "Tarjeta de fidelidad",
    [empresa]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!empresa) return;

    if (!nombreCompleto.trim()) {
      setError("Ingresa tu nombre completo.");
      return;
    }

    if (!telefono.trim()) {
      setError("Ingresa tu teléfono.");
      return;
    }

    setGuardando(true);
    setError("");

    const { data: clienteExistente, error: errorBusqueda } =
      await buscarClientePorTelefono(empresa.id, telefono);

    if (errorBusqueda) {
      console.error("Error buscando cliente existente:", errorBusqueda);
      setError("No se pudo validar el teléfono.");
      setGuardando(false);
      return;
    }

    if (clienteExistente?.id) {
      setGuardando(false);
      navigate(`/tarjeta/${clienteExistente.id}`);
      return;
    }

    const { data, error } = await registrarClientePublico({
      empresa_id: empresa.id,
      nombre_completo: nombreCompleto,
      telefono,
      fecha_nacimiento: fechaNacimiento || null,
    });

    setGuardando(false);

    if (error) {
      console.error("Error registrando cliente público:", error);

      if (error.message?.toLowerCase().includes("duplicate")) {
        setError("Ese teléfono ya está registrado en este negocio.");
      } else {
        setError("No se pudo completar el registro.");
      }

      return;
    }

    if (!data?.id) {
      setError("No se pudo generar la tarjeta.");
      return;
    }

    navigate(`/tarjeta/${data.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff9f8] flex items-center justify-center px-4">
        <div className="text-[#8b6f6f]">Cargando registro...</div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-[#fff9f8] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl bg-white border border-[#ead6d6] p-6 text-center">
          <h1 className="text-2xl font-bold text-[#4a3535]">
            Registro no disponible
          </h1>
          <p className="mt-2 text-[#8b6f6f]">
            Esta página no está disponible por el momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-6"
      style={{
        background: `linear-gradient(180deg, ${colorSecundario} 0%, #fff9f8 100%)`,
      }}
    >
      <div className="mx-auto max-w-xl">
        <div className="rounded-[32px] overflow-hidden border bg-white shadow-sm">
          <div
            className="px-6 py-8 sm:px-8"
            style={{
              background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
            }}
          >
            <div className="flex items-center gap-4 min-w-0">
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt="Logo"
                  className="h-16 w-16 shrink-0 rounded-2xl bg-white object-contain border border-white/60 p-2"
                />
              ) : null}

              <div className="min-w-0">
                <p className="text-sm text-white/90">Bienvenida a</p>
                <h1 className="text-3xl font-bold text-white break-words">
                  {nombreVisible}
                </h1>
                <p className="mt-1 text-sm text-white/90 break-words">
                  {nombreTarjeta}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#4a3535]">
                Crea tu tarjeta digital
              </h2>
              <p className="mt-1 text-sm sm:text-base text-[#8b6f6f]">
                Regístrate y empieza a acumular beneficios en tus visitas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#4a3535]">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full rounded-2xl border border-[#ead6d6] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4a3535]">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Tu número de teléfono"
                  className="w-full rounded-2xl border border-[#ead6d6] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#4a3535]">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full rounded-2xl border border-[#ead6d6] px-4 py-3 outline-none"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-[#ead6d6] bg-[#fff7f7] px-4 py-3 text-sm text-[#8b6f6f]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-2xl px-5 py-3 text-white font-semibold"
                style={{ backgroundColor: colorPrimario }}
              >
                {guardando ? "Creando tu tarjeta..." : "Crear mi tarjeta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}