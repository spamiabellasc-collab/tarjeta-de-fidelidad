import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { obtenerClientes } from "../features/clientes/clientesService";
import { abrirWhatsapp } from "../lib/whatsapp";

type Cliente = {
  id: string;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  telefono: string;
  activo: boolean;
};

type ClienteConCumple = Cliente & {
  mes: number;
  dia: number;
  diasParaCumple: number;
};

const nombresMeses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function calcularDiasParaCumple(fechaNacimiento: string | null) {
  if (!fechaNacimiento) return null;

  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);

  const cumpleEsteAnio = new Date(
    hoy.getFullYear(),
    nacimiento.getMonth(),
    nacimiento.getDate()
  );

  const hoySinHora = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate()
  );

  let proximoCumple = cumpleEsteAnio;

  if (cumpleEsteAnio < hoySinHora) {
    proximoCumple = new Date(
      hoy.getFullYear() + 1,
      nacimiento.getMonth(),
      nacimiento.getDate()
    );
  }

  const diffMs = proximoCumple.getTime() - hoySinHora.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function obtenerClientesConCumple(clientes: Cliente[]): ClienteConCumple[] {
  return clientes
    .filter((cliente) => !!cliente.fecha_nacimiento)
    .map((cliente) => {
      const fecha = new Date(cliente.fecha_nacimiento as string);

      return {
        ...cliente,
        mes: fecha.getMonth(),
        dia: fecha.getDate(),
        diasParaCumple: calcularDiasParaCumple(cliente.fecha_nacimiento) ?? 999,
      };
    })
    .sort((a, b) => {
      if (a.mes !== b.mes) return a.mes - b.mes;
      return a.dia - b.dia;
    });
}

export default function CumpleanosPage() {
  const { profile } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
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

  useEffect(() => {
    void cargarClientes();
  }, [profile?.empresa_id]);

  const clientesConCumple = useMemo(
    () => obtenerClientesConCumple(clientes),
    [clientes]
  );

  const cumpleanosHoy = useMemo(
    () => clientesConCumple.filter((cliente) => cliente.diasParaCumple === 0),
    [clientesConCumple]
  );

  const proximos7Dias = useMemo(
    () =>
      clientesConCumple
        .filter(
          (cliente) =>
            cliente.diasParaCumple > 0 && cliente.diasParaCumple <= 7
        )
        .sort((a, b) => a.diasParaCumple - b.diasParaCumple),
    [clientesConCumple]
  );

  const clientesPorMes = useMemo(() => {
    const agrupados: Record<number, ClienteConCumple[]> = {};

    for (const cliente of clientesConCumple) {
      if (!agrupados[cliente.mes]) {
        agrupados[cliente.mes] = [];
      }
      agrupados[cliente.mes].push(cliente);
    }

    return agrupados;
  }, [clientesConCumple]);

  function enviarWhatsappCumple(cliente: ClienteConCumple) {
    if (!cliente.telefono) {
      alert("Este cliente no tiene teléfono registrado");
      return;
    }

    const mensaje = `¡Hola ${cliente.nombre_completo}! 🎉

Todo el equipo te desea un feliz cumpleaños.

Te esperamos para consentirte en tu día especial 💖`;

    abrirWhatsapp(cliente.telefono, mensaje);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#4a3535]">Cumpleaños</h1>
        <p className="text-[#8b6f6f] mt-1">
          Revisa cumpleaños de hoy, próximos y lista completa por meses
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#4a3535]">
            Cumpleaños de hoy
          </h2>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-[#8b6f6f]">Cargando...</p>
            ) : cumpleanosHoy.length === 0 ? (
              <p className="text-[#8b6f6f]">
                No hay cumpleaños para hoy.
              </p>
            ) : (
              cumpleanosHoy.map((cliente) => (
                <div
                  key={cliente.id}
                  className="rounded-2xl border border-[#ead6d6] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-[#4a3535]">
                      {cliente.nombre_completo}
                    </p>
                    <p className="text-sm text-[#8b6f6f]">
                      {cliente.dia} de {nombresMeses[cliente.mes]}
                    </p>
                  </div>

                  <button
                    onClick={() => enviarWhatsappCumple(cliente)}
                    className="rounded-xl bg-[#d9aeb2] text-white px-4 py-2 text-sm font-medium"
                  >
                    Enviar WhatsApp
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#4a3535]">
            Próximos 7 días
          </h2>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-[#8b6f6f]">Cargando...</p>
            ) : proximos7Dias.length === 0 ? (
              <p className="text-[#8b6f6f]">
                No hay cumpleaños próximos en los siguientes 7 días.
              </p>
            ) : (
              proximos7Dias.map((cliente) => (
                <div
                  key={cliente.id}
                  className="rounded-2xl border border-[#ead6d6] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-[#4a3535]">
                      {cliente.nombre_completo}
                    </p>
                    <p className="text-sm text-[#8b6f6f]">
                      {cliente.dia} de {nombresMeses[cliente.mes]}
                    </p>
                    <p className="text-sm text-[#b08c8f]">
                      Faltan {cliente.diasParaCumple} día(s)
                    </p>
                  </div>

                  <button
                    onClick={() => enviarWhatsappCumple(cliente)}
                    className="rounded-xl border border-[#ead6d6] px-4 py-2 text-sm font-medium text-[#4a3535]"
                  >
                    WhatsApp
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#4a3535]">
          Lista completa por meses
        </h2>

        <div className="mt-6 space-y-6">
          {loading ? (
            <p className="text-[#8b6f6f]">Cargando...</p>
          ) : clientesConCumple.length === 0 ? (
            <p className="text-[#8b6f6f]">
              No hay clientes con fecha de cumpleaños registrada.
            </p>
          ) : (
            nombresMeses.map((mesNombre, index) => {
              const clientesMes = clientesPorMes[index] || [];

              if (clientesMes.length === 0) return null;

              return (
                <div key={mesNombre} className="space-y-3">
                  <h3 className="text-lg font-semibold text-[#4a3535]">
                    {mesNombre}
                  </h3>

                  {clientesMes.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="rounded-2xl border border-[#ead6d6] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-[#4a3535]">
                          {cliente.nombre_completo}
                        </p>
                        <p className="text-sm text-[#8b6f6f]">
                          {cliente.dia} de {mesNombre}
                        </p>
                        <p className="text-sm text-[#8b6f6f]">
                          {cliente.telefono || "Sin teléfono"}
                        </p>
                      </div>

                      <button
                        onClick={() => enviarWhatsappCumple(cliente)}
                        className="rounded-xl border border-[#ead6d6] px-4 py-2 text-sm font-medium text-[#4a3535]"
                      >
                        Enviar saludo
                      </button>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}