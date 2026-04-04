import { useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      console.log("Intentando login...");

      const { error } = await login(email, password);

      console.log("Resultado login:", error);

      if (error) {
        alert("Error al iniciar sesión: " + error.message);
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Error inesperado en login:", err);
      alert("Ocurrió un error inesperado al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fff9f8] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#ead6d6] shadow-sm p-8">
        <h1 className="text-3xl font-bold text-[#4a3535]">
          Iniciar sesión
        </h1>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-[#d9aeb2] text-white py-3 disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}