import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import {
  crearPremio,
  obtenerPremios,
  actualizarPremio,
  eliminarPremio,
} from "../features/premios/premiosService";

type Premio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  sellos_requeridos: number;
  activo: boolean;
};

export default function PremiosPage() {
  const { profile } = useAuth();

  const [premios, setPremios] = useState<Premio[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sellos, setSellos] = useState(5);
  const [loading, setLoading] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editSellos, setEditSellos] = useState(5);
  const [editLoading, setEditLoading] = useState(false);

  async function cargarPremios() {
    if (!profile?.empresa_id) return;

    const { data, error } = await obtenerPremios(profile.empresa_id);

    if (error) {
      console.error("Error cargando premios:", error);
      return;
    }

    setPremios((data as Premio[]) || []);
  }

  useEffect(() => {
    void cargarPremios();
  }, [profile?.empresa_id]);

  async function handleCrear() {
    if (!nombre.trim()) {
      alert("El nombre del premio es obligatorio");
      return;
    }

    if (!profile?.empresa_id) {
      alert("No se encontró empresa en tu perfil");
      return;
    }

    if (sellos <= 0) {
      alert("La cantidad de sellos debe ser mayor a 0");
      return;
    }

    setLoading(true);

    const { error } = await crearPremio({
      empresa_id: profile.empresa_id,
      nombre,
      descripcion: descripcion || null,
      sellos_requeridos: sellos,
      activo: true,
    });

    setLoading(false);

    if (error) {
      alert("Error al crear premio: " + error.message);
      return;
    }

    setNombre("");
    setDescripcion("");
    setSellos(5);

    await cargarPremios();
  }

  async function toggleActivo(premio: Premio) {
    const { error } = await actualizarPremio(premio.id, {
      activo: !premio.activo,
    });

    if (error) {
      alert("Error al actualizar premio: " + error.message);
      return;
    }

    await cargarPremios();
  }

  function iniciarEdicion(premio: Premio) {
    setEditandoId(premio.id);
    setEditNombre(premio.nombre);
    setEditDescripcion(premio.descripcion || "");
    setEditSellos(premio.sellos_requeridos);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditNombre("");
    setEditDescripcion("");
    setEditSellos(5);
  }

  async function guardarEdicion(id: string) {
    if (!editNombre.trim()) {
      alert("El nombre del premio es obligatorio");
      return;
    }

    if (editSellos <= 0) {
      alert("La cantidad de sellos debe ser mayor a 0");
      return;
    }

    setEditLoading(true);

    const { error } = await actualizarPremio(id, {
      nombre: editNombre,
      descripcion: editDescripcion || null,
      sellos_requeridos: editSellos,
    });

    setEditLoading(false);

    if (error) {
      alert("Error al editar premio: " + error.message);
      return;
    }

    cancelarEdicion();
    await cargarPremios();
  }

  async function handleEliminar(id: string, nombrePremio: string) {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar el premio "${nombrePremio}"?`
    );

    if (!confirmar) return;

    const { error } = await eliminarPremio(id);

    if (error) {
      alert("Error al eliminar premio: " + error.message);
      return;
    }

    if (editandoId === id) {
      cancelarEdicion();
    }

    await cargarPremios();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#4a3535]">Premios</h1>
        <p className="text-[#8b6f6f] mt-1">
          Crea, edita y administra los premios de tu tarjeta de fidelidad
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          Crear nuevo premio
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Nombre del premio"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />

          <input
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />

          <input
            type="number"
            min={1}
            value={sellos}
            onChange={(e) => setSellos(Number(e.target.value))}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCrear}
            className="rounded-2xl bg-[#d9aeb2] text-white px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            {loading ? "Guardando..." : "Crear premio"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          Premios actuales
        </h2>

        {premios.length === 0 ? (
          <p className="text-[#8b6f6f]">
            Todavía no tienes premios creados.
          </p>
        ) : (
          <div className="space-y-3">
            {premios.map((premio) => {
              const estaEditando = editandoId === premio.id;

              return (
                <div
                  key={premio.id}
                  className="rounded-2xl border border-[#ead6d6] p-4"
                >
                  {estaEditando ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
                        />

                        <input
                          value={editDescripcion}
                          onChange={(e) => setEditDescripcion(e.target.value)}
                          className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
                        />

                        <input
                          type="number"
                          min={1}
                          value={editSellos}
                          onChange={(e) => setEditSellos(Number(e.target.value))}
                          className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          onClick={() => guardarEdicion(premio.id)}
                          className="rounded-xl bg-[#d9aeb2] text-white px-4 py-2 text-sm font-medium"
                        >
                          {editLoading ? "Guardando..." : "Guardar cambios"}
                        </button>

                        <button
                          onClick={cancelarEdicion}
                          className="rounded-xl border border-[#ead6d6] px-4 py-2 text-sm font-medium text-[#4a3535]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[#4a3535]">
                          {premio.nombre}
                        </p>
                        <p className="text-sm text-[#8b6f6f]">
                          {premio.sellos_requeridos} sellos
                        </p>
                        {premio.descripcion ? (
                          <p className="text-sm text-[#8b6f6f] mt-1">
                            {premio.descripcion}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleActivo(premio)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium ${
                            premio.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {premio.activo ? "Activo" : "Inactivo"}
                        </button>

                        <button
                          onClick={() => iniciarEdicion(premio)}
                          className="px-4 py-2 rounded-xl border border-[#ead6d6] text-sm font-medium text-[#4a3535]"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleEliminar(premio.id, premio.nombre)}
                          className="px-4 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}