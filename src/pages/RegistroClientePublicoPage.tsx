import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../api/supabase";

type Empresa = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  nombre_tarjeta: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  logo_url?: string | null;
};

type ClienteExistente = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
};

function normalizarTelefono(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export default function RegistroClientePublicoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorPantalla, setErrorPantalla] = useState("");

  async function cargarEmpresa() {
    if (!slug) {
      setErrorPantalla("No se recibió el slug de la empresa.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("empresas")
      .select(
        "id, nombre, nombre_comercial, nombre_tarjeta, color_primario, color_secundario, logo_url"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Error cargando empresa:", error);
      setErrorPantalla("No se pudo cargar la empresa.");
      setLoading(false);
      return;
    }

    const empresaFinal = (data as Empresa) || null;

    if (!empresaFinal) {
      setErrorPantalla("Empresa no encontrada.");
      setLoading(false);
      return;
    }

    setEmpresa(empresaFinal);
    setLoading(false);
  }

  useEffect(() => {
    void cargarEmpresa();
  }, [slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!empresa?.id) {
      alert("Empresa no válida");
      return;
    }

    if (!nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!telefono.trim()) {
      alert("El teléfono es obligatorio");
      return;
    }

    setGuardando(true);

    const telefonoNormalizado = normalizarTelefono(telefono);

    // 1) Buscar si ya existe cliente con ese teléfono en la misma empresa
    const { data: clienteExistente, error: errorBusqueda } = await supabase
      .from("clientes")
      .select("id, nombre_completo, telefono")
      .eq("empresa_id", empresa.id)
      .eq("telefono", telefonoNormalizado)
      .is("deleted_at", null)
      .maybeSingle();

    if (errorBusqueda) {
      console.error("Error buscando cliente existente:", errorBusqueda);
      setGuardando(false);
      alert("No se pudo validar el teléfono.");
      return;
    }

    if ((clienteExistente as ClienteExistente | null)?.id) {
      setGuardando(false);
      navigate(`/tarjeta/${(clienteExistente as ClienteExistente).id}`);
      return;
    }

    // 2) Crear cliente nuevo
    const { data: nuevoCliente, error: errorInsert } = await supabase
      .from("clientes")
      .insert({
        empresa_id: empresa.id,
        nombre_completo: nombre.trim(),
        telefono: telefonoNormalizado,
        fecha_nacimiento: fechaNacimiento || null,
        sellos_actuales: 0,
        sellos_historicos: 0,
        ciclo_tarjeta: 1,
        activo: true,
      })
      .select("id")
      .single();

    setGuardando(false);

    if (errorInsert) {
      console.error("Error registrando cliente:", errorInsert);
      alert("Error al registrarte: " + errorInsert.message);
      return;
    }

    if (!nuevoCliente?.id) {
      alert("No se pudo generar la tarjeta.");
      return;
    }

    // 3) Ir directo a la tarjeta pública
    navigate(`/tarjeta/${nuevoCliente.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#8b6f6f] bg-[#fff9f8]">
        Cargando...
      </div>
    );
  }

  if (errorPantalla) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#fff9f8]">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[#ead6d6] p-6 text-center">
          <h1 className="text-2xl font-bold text-[#4a3535]">
            Registro no disponible
          </h1>
          <p className="text-[#8b6f6f] mt-3">{errorPantalla}</p>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#8b6f6f] bg-[#fff9f8]">
        Empresa no encontrada
      </div>
    );
  }

  const colorPrimario = empresa.color_primario || "#D9AEB2";
  const colorSecundario = empresa.color_secundario || "#F4E7E7";
  const nombreEmpresa =
    empresa.nombre_comercial || empresa.nombre || "Mi empresa";
  const nombreTarjeta = empresa.nombre_tarjeta || "Tarjeta de fidelidad";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background: `linear-gradient(145deg, ${colorSecundario} 0%, #ffffff 100%)`,
      }}
    >
      <div className="w-full max-w-md space-y-6">
        <div
          className="rounded-3xl p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${colorPrimario}, ${colorSecundario})`,
          }}
        >
          <div className="flex items-center gap-4">
            {empresa.logo_url ? (
              <div className="h-14 w-14 rounded-2xl bg-white/90 p-2 flex items-center justify-center shrink-0">
                <img
                  src={empresa.logo_url}
                  alt="Logo empresa"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : null}

            <div className="min-w-0">
              <h1 className="text-2xl font-bold break-words">
                {nombreEmpresa}
              </h1>
              <p className="text-sm opacity-90 mt-1 break-words">
                {nombreTarjeta}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold text-[#4a3535]">
              Regístrate y obtén tu tarjeta
            </h2>

            <input
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
            />

            <input
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
            />

            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
            />

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-2xl text-white py-3 font-semibold"
              style={{ backgroundColor: colorPrimario }}
            >
              {guardando ? "Registrando..." : "Registrarme"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}