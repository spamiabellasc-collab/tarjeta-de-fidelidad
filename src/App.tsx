import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import NuevoClientePage from "./pages/NuevoClientePage";
import ClientesPage from "./pages/ClientesPage";
import ClienteDetallePage from "./pages/ClienteDetallePage";
import ClienteQrPage from "./pages/ClienteQrPage";
import ClienteScanPage from "./pages/ClienteScanPage";
import QrScannerPage from "./pages/QrScannerPage";
import CumpleanosPage from "./pages/CumpleanosPage";
import PremiosPage from "./pages/PremiosPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import UsuariosPage from "./pages/UsuariosPage";
import TarjetaPublicaPage from "./pages/TarjetaPublicaPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tarjeta/:id" element={<TarjetaPublicaPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clientes/nuevo" element={<NuevoClientePage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/:id" element={<ClienteDetallePage />} />
          <Route path="/clientes/:id/qr" element={<ClienteQrPage />} />
          <Route path="/clientes/:id/scan" element={<ClienteScanPage />} />
          <Route path="/scanner" element={<QrScannerPage />} />
          <Route path="/cumpleanos" element={<CumpleanosPage />} />
          <Route path="/premios" element={<PremiosPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}