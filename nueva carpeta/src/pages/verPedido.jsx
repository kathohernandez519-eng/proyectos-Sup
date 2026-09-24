import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/conifg';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

function VerPedido() {
    const [pedido, setPedido] = useState(null);
    const [distancia, setDistancia] = useState('Calculando...');
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const pedidoId = location.state?.pedidoId;

    // Escuchar pedido en tiempo real
    useEffect(() => {
        if (!pedidoId) return navigate('/dashboardrepartidor');
        const unsub = onSnapshot(doc(db, 'pedidos', pedidoId), (snap) => {
            if (snap.exists()) setPedido({ id: snap.id, ...snap.data() });
        });
        return () => unsub();
    }, [pedidoId]);

    // Inicializar mapa cuando llega el pedido
    useEffect(() => {
        if (!pedido || mapInstanceRef.current) return;

        const map = L.map(mapRef.current);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const geocode = async (dir) => {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dir)}`
            );
            const data = await res.json();
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        };

        const crearRuta = async () => {
            const origen = await geocode(pedido.restaurante + ', El Salvador');
            const destino = await geocode(pedido.direccionEntrega + ', El Salvador');

            L.Routing.control({
                waypoints: [L.latLng(origen), L.latLng(destino)],
                routeWhileDragging: false,
                draggableWaypoints: false,
                addWaypoints: false,
                show: false,
                lineOptions: { styles: [{ color: '#016d3b', weight: 6 }] }
            }).on('routesfound', (e) => {
                const km = (e.routes[0].summary.totalDistance / 1000).toFixed(1);
                setDistancia(`${km} km`);
            }).addTo(map);
        };

        crearRuta();
    }, [pedido]);

    const marcarEntregado = async () => {
        await updateDoc(doc(db, 'pedidos', pedidoId), {
            estado: 'entregado',
            fecha_entrega: new Date()
        });
        navigate('/dashboardrepartidor');
    };

    if (!pedido) return <div style={{ padding: '30px', textAlign: 'center' }}>Cargando pedido...</div>;

    return (
        <div style={vStyles.page}>
            <div style={vStyles.header}>
                <div style={vStyles.circle}></div>
                <button style={vStyles.volverBtn} onClick={() => navigate('/dashboardrepartidor')}>←</button>
                <h1 style={vStyles.title}>Pedido en Curso</h1>
                <p style={vStyles.sub}>Navegación activa hacia el cliente</p>
            </div>

            <div style={vStyles.contenido}>
                <div style={vStyles.infoCard}>
                    <h2 style={vStyles.infoTitle}>Ruta del pedido</h2>

                    <div style={vStyles.rutaBox}>
                        <div style={vStyles.puntoRuta}>
                            <div style={{ ...vStyles.circulo, background: '#00c46a' }}></div>
                            <div>
                                <span style={vStyles.rutaLabel}>Recoger en</span>
                                <strong style={vStyles.rutaVal}>{pedido.restaurante}</strong>
                            </div>
                        </div>
                        <div style={vStyles.lineaRuta}></div>
                        <div style={vStyles.puntoRuta}>
                            <div style={{ ...vStyles.circulo, background: '#ff4d4d' }}></div>
                            <div>
                                <span style={vStyles.rutaLabel}>Entregar en</span>
                                <strong style={vStyles.rutaVal}>{pedido.direccionEntrega}</strong>
                            </div>
                        </div>
                    </div>

                    <div style={vStyles.miniGrid}>
                        <div style={vStyles.mini}>
                            <span style={vStyles.miniLabel}>Distancia</span>
                            <strong style={vStyles.miniVal}>{distancia}</strong>
                        </div>
                        <div style={vStyles.mini}>
                            <span style={vStyles.miniLabel}>Costo delivery</span>
                            <strong style={vStyles.miniVal}>${pedido.precioDelivery?.toFixed(2)}</strong>
                        </div>
                    </div>

                    <div style={vStyles.clienteBox}>
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                            alt="cliente"
                            style={vStyles.clienteFoto}
                        />
                        <div>
                            <h3 style={{ margin: 0, color: '#222' }}>{pedido.nombreCliente}</h3>
                            <p style={{ color: '#666', fontSize: '14px' }}>Cliente esperando pedido</p>
                        </div>
                    </div>

                    <div style={vStyles.botones}>
                        <button style={vStyles.btnPrincipal} onClick={marcarEntregado}>
                            Pedido entregado ✓
                        </button>
                        <button style={vStyles.btnSecundario}>
                            Contactar cliente
                        </button>
                    </div>
                </div>

                <div ref={mapRef} style={vStyles.mapa}></div>
            </div>
        </div>
    );
}

const vStyles = {
    page: { background: 'linear-gradient(135deg,#eef2f7,#dfe7f3)', minHeight: '100vh', padding: '25px', fontFamily: 'Arial, Helvetica, sans-serif' },
    header: { background: 'linear-gradient(135deg,#003d24,#016d3b)', color: 'white', padding: '28px', borderRadius: '28px', marginBottom: '20px', position: 'relative', overflow: 'hidden' },
    circle: { position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: '-80px', right: '-50px' },
    volverBtn: { width: '44px', height: '44px', border: 'none', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '20px', cursor: 'pointer', marginBottom: '16px', display: 'block' },
    title: { fontSize: '32px', margin: 0 },
    sub: { marginTop: '8px', color: '#d8ffe5' },
    contenido: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', maxWidth: '1200px', margin: '0 auto' },
    infoCard: { background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' },
    infoTitle: { fontSize: '24px', color: '#222', marginBottom: '18px' },
    rutaBox: { background: '#f7f7f7', borderRadius: '18px', padding: '18px' },
    puntoRuta: { display: 'flex', alignItems: 'center', gap: '12px' },
    circulo: { width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0 },
    lineaRuta: { width: '3px', height: '30px', background: '#ccc', marginLeft: '5px', marginTop: '4px', marginBottom: '4px', borderRadius: '10px' },
    rutaLabel: { display: 'block', fontSize: '12px', color: '#777', marginBottom: '3px' },
    rutaVal: { color: '#222', fontSize: '14px' },
    miniGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '18px' },
    mini: { background: '#f7f7f7', borderRadius: '16px', padding: '16px' },
    miniLabel: { display: 'block', fontSize: '12px', color: '#777', marginBottom: '6px' },
    miniVal: { fontSize: '18px', color: '#222' },
    clienteBox: { marginTop: '18px', background: '#f7f7f7', borderRadius: '18px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' },
    clienteFoto: { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' },
    botones: { display: 'flex', gap: '12px', marginTop: '18px' },
    btnPrincipal: { flex: 1, padding: '15px', border: 'none', borderRadius: '16px', background: 'linear-gradient(to right,#016d3b,#019c58)', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
    btnSecundario: { flex: 1, padding: '15px', border: 'none', borderRadius: '16px', background: '#ececec', color: '#444', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
    mapa: { height: '600px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' },
};

export default VerPedido;