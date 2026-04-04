import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearCliente } from "../features/clientes/clientesService";
import { useAuth } from "../features/auth/AuthContext";

export default function NuevoClientePage() {
  const { profile, loading: authLoading, obtenerPerfilActual } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [aceptaWhatsapp, setAceptaWhatsapp] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleGuardar() {
    if (!nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!telefono.trim()) {
      alert("El teléfono es obligatorio");
      return;
    }

    if (authLoading) {
      alert("Estamos cargando tu perfil. Intenta nuevamente.");
      return;
    }

    let empresaId = profile?.empresa_id ?? null;

    if (!empresaId) {
      const perfilActual = await obtenerPerfilActual();
      empresaId = perfilActual?.empresa_id ?? null;
    }

    if (!empresaId) {
      alert("Error: no se encontró empresa en tu perfil");
      return;
    }

    setLoading(true);

    const { error } = await crearCliente({
      empresa_id: empresaId,
      nombre_completo: nombre,
      fecha_nacimiento: fechaNacimiento || null,
      telefono,
      notas: notas || null,
      acepta_whatsapp: aceptaWhatsapp,
    });

    setLoading(false);

    if (error) {
      alert("Error al guardar: " + error.message);
      return;
    }

    alert("Cliente creado correctamente");

    setNombre("");
    setFechaNacimiento("");
    setTelefono("");
    setNotas("");
    setAceptaWhatsapp(true);

    navigate("/clientes");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-[#4a3535]">Nuevo cliente</h1>
      <p className="text-[#8b6f6f] mt-1">
        Registra un nuevo cliente en la tarjeta de fidelidad
      </p>

      <div className="mt-6 rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-4">
        <input
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3"
        />

        <input
          type="date"
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3"
        />

        <input
          placeholder="Número de teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3"
        />

        <textarea
          placeholder="Notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border px-4 py-3"
        />

        <label className="flex items-center gap-2 text-sm text-[#5b4242]">
          <input
            type="checkbox"
            checked={aceptaWhatsapp}
            onChange={(e) => setAceptaWhatsapp(e.target.checked)}
          />
          Acepta recibir mensajes por WhatsApp
        </label>

        <div className="rounded-2xl bg-[#fff7f7] border border-[#ead6d6] px-4 py-3 text-sm text-[#8b6f6f]">
          Empresa detectada: {profile?.empresa_id || "Sin empresa"}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGuardar}
            className="rounded-2xl bg-[#d9aeb2] text-white px-6 py-3 font-semibold"
          >
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}