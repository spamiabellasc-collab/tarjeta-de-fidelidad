import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScannerPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const hasScannedRef = useRef(false);

  const [error, setError] = useState("");
  const [iniciando, setIniciando] = useState(true);
  const [camaraActiva, setCamaraActiva] = useState(false);

  useEffect(() => {
    const readerId = "qr-reader";
    const scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;

    async function iniciarScanner() {
      if (isStartingRef.current) return;
      isStartingRef.current = true;
      setError("");
      setIniciando(true);

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;

            const texto = decodedText.trim();

            try {
              const url = new URL(texto);

              const path = url.pathname || "";

              // Soporta links como /clientes/:id/scan o /tarjeta/:id
              const partes = path.split("/").filter(Boolean);

              if (partes.length >= 3 && partes[0] === "clientes" && partes[2] === "scan") {
                const clienteId = partes[1];
                void detenerScanner().finally(() => {
                  navigate(`/clientes/${clienteId}/scan`);
                });
                return;
              }

              if (partes.length >= 2 && partes[0] === "tarjeta") {
                const clienteId = partes[1];
                void detenerScanner().finally(() => {
                  navigate(`/clientes/${clienteId}/scan`);
                });
                return;
              }

              setError("El QR no tiene un formato válido para sellado.");
              hasScannedRef.current = false;
            } catch {
              // También soporta QR con solo el ID
              if (texto.length >= 8) {
                void detenerScanner().finally(() => {
                  navigate(`/clientes/${texto}/scan`);
                });
                return;
              }

              setError("No se pudo interpretar el QR escaneado.");
              hasScannedRef.current = false;
            }
          },
          () => {
            // ignoramos errores de lectura intermitentes
          }
        );

        setCamaraActiva(true);
      } catch (err: any) {
        console.error("Error iniciando scanner:", err);
        setError(
          "No se pudo abrir la cámara. Revisa permisos del navegador y usa HTTPS en el celular."
        );
      } finally {
        setIniciando(false);
        isStartingRef.current = false;
      }
    }

    async function detenerScanner() {
      const actual = scannerRef.current;
      if (!actual) return;

      try {
        const state = actual.getState();
        if (state === 2 || state === 3) {
          await actual.stop();
        }
      } catch {
        // ignore
      }

      try {
        await actual.clear();
      } catch {
        // ignore
      }

      setCamaraActiva(false);
    }

    void iniciarScanner();

    return () => {
      void detenerScanner();
    };
  }, [navigate]);

  async function reiniciarScanner() {
    const actual = scannerRef.current;
    hasScannedRef.current = false;
    setError("");
    setIniciando(true);

    if (!actual) {
      setIniciando(false);
      setError("No se pudo reiniciar el escáner.");
      return;
    }

    try {
      try {
        const state = actual.getState();
        if (state === 2 || state === 3) {
          await actual.stop();
        }
      } catch {
        // ignore
      }

      try {
        await actual.clear();
      } catch {
        // ignore
      }

      await actual.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          const texto = decodedText.trim();

          try {
            const url = new URL(texto);
            const path = url.pathname || "";
            const partes = path.split("/").filter(Boolean);

            if (partes.length >= 3 && partes[0] === "clientes" && partes[2] === "scan") {
              const clienteId = partes[1];
              void actual.stop().finally(() => {
                navigate(`/clientes/${clienteId}/scan`);
              });
              return;
            }

            if (partes.length >= 2 && partes[0] === "tarjeta") {
              const clienteId = partes[1];
              void actual.stop().finally(() => {
                navigate(`/clientes/${clienteId}/scan`);
              });
              return;
            }

            setError("El QR no tiene un formato válido para sellado.");
            hasScannedRef.current = false;
          } catch {
            if (texto.length >= 8) {
              void actual.stop().finally(() => {
                navigate(`/clientes/${texto}/scan`);
              });
              return;
            }

            setError("No se pudo interpretar el QR escaneado.");
            hasScannedRef.current = false;
          }
        },
        () => {}
      );

      setCamaraActiva(true);
    } catch (err) {
      console.error("Error reiniciando scanner:", err);
      setError("No se pudo reiniciar la cámara.");
    } finally {
      setIniciando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4a3535]">
          Escáner QR
        </h1>
        <p className="text-sm sm:text-base text-[#8b6f6f]">
          Escanea el QR del cliente para abrir el sellado rápido
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-4 sm:p-5">
        <div className="rounded-3xl overflow-hidden border border-[#ead6d6] bg-[#fff9f8]">
          <div
            id="qr-reader"
            className="w-full min-h-[320px] sm:min-h-[380px]"
          />
        </div>

        <div className="mt-4 space-y-3">
          {iniciando ? (
            <p className="text-sm text-[#8b6f6f]">Iniciando cámara...</p>
          ) : camaraActiva ? (
            <p className="text-sm text-[#8b6f6f]">
              Cámara activa. Apunta al QR del cliente.
            </p>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-[#ead6d6] bg-[#fff7f7] px-4 py-3 text-sm text-[#8b6f6f]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reiniciarScanner}
              className="w-full sm:w-auto rounded-2xl bg-[#d9aeb2] px-5 py-3 text-sm font-semibold text-white"
            >
              Reiniciar escáner
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto rounded-2xl border border-[#ead6d6] px-5 py-3 text-sm font-semibold text-[#4a3535]"
            >
              Volver al dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}