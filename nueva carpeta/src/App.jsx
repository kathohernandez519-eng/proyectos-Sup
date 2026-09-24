import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/login';
import DashboardDonante from './pages/dasboarDonante';
import CrearDonaciones from './pages/crearDonaciones';
import Registro from './pages/registro';
import DashboardBeneficiario from './pages/dashboardbeneficiario';
import Bienvenida from './pages/bienvenida';
import RegistroRepartidor from './pages/registroRepartidor';
import DashboardRepartidor from './pages/dashboardRepartidor';
import VerPedido from './pages/verPedido';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/index" />} />
        <Route path="/index" element={<Login />} />
        <Route path="/dashboardona" element={<DashboardDonante />} />
        <Route path="/donaciones" element={<CrearDonaciones />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/dashboardbene" element={<DashboardBeneficiario />} />
        <Route path="/Bienvenida" element={<Bienvenida />} />
        <Route path="/dashboardbeneficiario" element={<DashboardBeneficiario />} />
        <Route path="/registrorepartidor" element={<RegistroRepartidor />} />
        <Route path="/dashboardrepartidor" element={<DashboardRepartidor />} />
        <Route path="/verpedido" element={<VerPedido />} />
        <Route path="*" element={<div style={{padding: "20px"}}>404 - Página no encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;