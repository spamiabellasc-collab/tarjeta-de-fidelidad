import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../api/supabase";

type Empresa = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  nombre_tarjeta: string | null;
  color_primario: string | null;
  color_secundario: string | null;
};

export default function RegistroClientePublicoPage() {
  const { slug } = useParams();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [success, setSuccess] = useState(false);

  async function cargarEmpresa() {
    if (!slug) return;

    const { data, error } = await supabase
      .from("empresas")
      .select(
        "id, nombre, nombre_comercial, nombre_tarjeta, color_primario, color_secundario"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Error cargando empresa:", error);
    }

    setEmpresa((data as Empresa) || null);
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

    setGuardando(true);

    const { error } = await supabase.from("clientes").insert({
      empresa_id: empresa.id,
      nombre_completo: nombre,
      telefono: telefono || null,
      fecha_nacimiento: fechaNacimiento || null,
      sellos_actuales: 0,
      sellos_historicos: 0,
      ciclo_tarjeta: 1,
      activo: true,
    });

    setGuardando(false);

    if (error) {
      alert("Error al registrarte: " + error.message);
      return;
    }

    setSuccess(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#8b6f6f]">
        Cargando...
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#8b6f6f]">
        Empresa no encontrada
      </div>
    );
  }

  const colorPrimario = empresa.color_primario || "#D9AEB2";
  const colorSecundario = empresa.color_secundario || "#F4E7E7";
  const nombreEmpresa =
    empresa.nombre_comercial || empresa.nombre || "Mi empresa";
  const nombreTarjeta =
    empresa.nombre_tarjeta || "Tarjeta de fidelidad";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: `linear-gradient(145deg, ${colorSecundario} 0%, #ffffff 100%)`,
      }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* HEADER */}
        <div
          className="rounded-3xl p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${colorPrimario}, ${colorSecundario})`,
          }}
        >
          <h1 className="text-2xl font-bold">{nombreEmpresa}</h1>
          <p className="text-sm opacity-90 mt-1">{nombreTarjeta}</p>
        </div>

        {/* FORM */}
        <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm">
          {success ? (
            <div className="text-center space-y-3">
              <h2 className="text-xl font-bold text-[#4a3535]">
                🎉 Registro exitoso
              </h2>
              <p className="text-[#8b6f6f]">
                Ya tienes tu tarjeta de fidelidad.
              </p>
              <p className="text-sm text-[#8b6f6f]">
                Puedes regresar al negocio para comenzar a acumular sellos ✨
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}