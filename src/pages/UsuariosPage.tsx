import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import {
  actualizarUsuario,
  crearUsuario,
  obtenerUsuarios,
} from "../features/usuarios/usuariosService";

type Usuario = {
  id: string;
  nombre: string | null;
  email: string | null;
  rol: string;
  activo: boolean;
};

const rolesDisponibles = ["admin", "recepcion", "marketing", "viewer"];

export default function UsuariosPage() {
  const { profile, user } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("recepcion");
  const [creando, setCreando] = useState(false);

  async function cargarUsuarios() {
    if (!profile?.empresa_id) return;

    setLoading(true);

    const { data, error } = await obtenerUsuarios(profile.empresa_id);

    if (error) {
      console.error("Error cargando usuarios:", error);
      setLoading(false);
      return;
    }

    setUsuarios((data as Usuario[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    void cargarUsuarios();
  }, [profile?.empresa_id]);

  async function handleCrear() {
    if (!profile?.empresa_id) {
      alert("No se encontró empresa");
      return;
    }

    if (!nombre.trim() || !email.trim() || !password.trim()) {
      alert("Completa nombre, correo y contraseña");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCreando(true);

    const { error } = await crearUsuario({
      nombre,
      email,
      password,
      rol,
      empresa_id: profile.empresa_id,
    });

    setCreando(false);

    if (error) {
      const mensaje =
        typeof error.message === "string"
          ? error.message
          : "No se pudo crear el usuario";
      alert("Error al crear usuario: " + mensaje);
      return;
    }

    alert("Usuario creado correctamente");

    setNombre("");
    setEmail("");
    setPassword("");
    setRol("recepcion");

    await cargarUsuarios();
  }

  async function toggleActivo(usuario: Usuario) {
    if (usuario.id === user?.id && usuario.activo) {
      alert("No puedes desactivarte a ti misma");
      return;
    }

    const { error } = await actualizarUsuario(usuario.id, {
      activo: !usuario.activo,
    });

    if (error) {
      alert("Error al actualizar usuario: " + error.message);
      return;
    }

    await cargarUsuarios();
  }

  async function cambiarRol(usuario: Usuario, nuevoRol: string) {
    const { error } = await actualizarUsuario(usuario.id, {
      rol: nuevoRol,
    });

    if (error) {
      alert("Error al cambiar rol: " + error.message);
      return;
    }

    await cargarUsuarios();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#4a3535]">Usuarios</h1>
        <p className="text-[#8b6f6f] mt-1">
          Crea usuarios y administra roles de tu empresa
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          Crear usuario
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />

          <input
            placeholder="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />

          <input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          />

          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="rounded-2xl border border-[#e8d5d5] px-4 py-3 outline-none"
          >
            {rolesDisponibles.map((rolItem) => (
              <option key={rolItem} value={rolItem}>
                {rolItem}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCrear}
            className="rounded-2xl bg-[#d9aeb2] text-white px-6 py-3 font-semibold"
          >
            {creando ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          Usuarios actuales
        </h2>

        {loading ? (
          <p className="text-[#8b6f6f]">Cargando...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-[#8b6f6f]">No hay usuarios registrados.</p>
        ) : (
          <div className="space-y-3">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="rounded-2xl border border-[#ead6d6] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-[#4a3535]">
                    {usuario.nombre || "Sin nombre"}
                  </p>
                  <p className="text-sm text-[#8b6f6f]">
                    {usuario.email || "Sin correo"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={usuario.rol}
                    onChange={(e) => void cambiarRol(usuario, e.target.value)}
                    className="rounded-xl border border-[#ead6d6] px-3 py-2 text-sm"
                  >
                    {rolesDisponibles.map((rolItem) => (
                      <option key={rolItem} value={rolItem}>
                        {rolItem}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => void toggleActivo(usuario)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${
                      usuario.activo
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}