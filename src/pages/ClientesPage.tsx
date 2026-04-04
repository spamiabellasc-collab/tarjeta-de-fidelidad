import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerClientes,
  eliminarCliente,
} from "../features/clientes/clientesService";
import { useAuth } from "../features/auth/AuthContext";

type Cliente = {
  id: string;
  nombre_completo: string;
  telefono: string;
  sellos_actuales: number;
};

export default function ClientesPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  async function cargarClientes() {
    if (!profile?.empresa_id) return;

    setLoading(true);

    const { data, error } = await obtenerClientes(profile.empresa_id);

    if (error) {
      console.error("Error cargando clientes:", error);
      setLoading(false);
      return;
    }

    setClientes((data as Cliente[]) || []);
    setLoading(false);
  }

  async function handleEliminar(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar este cliente?"
    );
    if (!confirmar) return;

    const { error } = await eliminarCliente(id);

    if (error) {
      alert("Error al eliminar: " + error.message);
      return;
    }

    await cargarClientes();
  }

  useEffect(() => {
    void cargarClientes();
  }, [profile?.empresa_id]);

  const clientesFiltrados = clientes.filter((c) =>
    `${c.nombre_completo} ${c.telefono}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#4a3535]">Clientes</h1>
        <p className="text-[#8b6f6f] mt-1">
          Busca, edita y administra todos tus clientes
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-5">
        <input
          placeholder="Buscar por nombre o número"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3"
        />
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-5 space-y-3">
        {loading ? (
          <p className="text-[#8b6f6f]">Cargando...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p className="text-[#8b6f6f]">No hay clientes</p>
        ) : (
          clientesFiltrados.map((cliente) => (
            <div
              key={cliente.id}
              className="flex items-center justify-between rounded-2xl border p-4"
            >
              <div>
                <p className="font-semibold text-[#4a3535]">
                  {cliente.nombre_completo}
                </p>
                <p className="text-sm text-[#8b6f6f]">{cliente.telefono}</p>
                <p className="text-xs text-[#8b6f6f]">
                  Sellos: {cliente.sellos_actuales}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/clientes/${cliente.id}`)}
                  className="px-4 py-2 rounded-xl bg-[#d9aeb2] text-white text-sm"
                >
                  Ver
                </button>

                <button
                  onClick={() => handleEliminar(cliente.id)}
                  className="px-4 py-2 rounded-xl border text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}