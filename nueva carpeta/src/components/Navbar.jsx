import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-gray-900 text-white border-t border-gray-800 z-50">
      <div className="flex justify-around items-center py-3">
        {/* Usamos nombres cortos para que quepan en el celular */}

        <Link to="/index" className="flex flex-col items-center hover:text-green-400 transition-colors">
          <span className="text-xs">log in</span> {/* "log in" es más corto que "login" para que se vea mejor en el celular */}
        </Link>

        <Link to="/dashboardona" className="flex flex-col items-center hover:text-green-400 transition-colors"> {/* */}
          <span className="text-xs">Donante</span>
        </Link>

        <Link to="/donaciones" className="flex flex-col items-center hover:text-green-400 transition-colors">
          <span className="text-xs">Donar</span>
        </Link>

        <Link to="/registro" className="flex flex-col items-center hover:text-green-400 transition-colors">
          <span className="text-xs">Registro</span>
        </Link>

        <Link to="/Bienvenida" className="flex flex-col items-center hover:text-green-400 transition-colors">
          <span className="text-xs">Bienvenida</span>
        </Link>
        <Link to="/dashboardbeneficiario" className="flex flex-col items-center hover:text-green-400 transition-colors">
          <span className="text-xs">Beneficiario</span>
        </Link>
        <Link to="/registrorepartidor" className="flex flex-col items-center hover:text-green-400 transition-colors"> 
          <span className="text-xs">Repartidor</span>
        </Link>
        <Link to="/dashboardrepartidor" className="flex flex-col items-center hover:text-green-400 transition-colors">
          <span className="text-xs">Dashboard Repartidor</span>
        </Link> 
        <Link to="/verpedido" className="flex flex-col items-center hover:text-green-400 transition-colors">
          <span className="text-xs">Ver Pedido</span>
        </Link> 

      
      </div>
    </nav>
  );
}

export default Navbar;