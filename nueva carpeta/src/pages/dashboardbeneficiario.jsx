// DashboardBeneficiario.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase/conifg';
import {
    collection, query, where, onSnapshot,
    addDoc, doc, getDocs, updateDoc, orderBy,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function DashboardBeneficiario() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [pestana, setPestana] = useState('inicio');
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUid(user.uid);
                const q = query(collection(db, 'usuarios'), where('uid', '==', user.uid));
                const snap = await getDocs(q);
                if (!snap.empty) setUserData(snap.docs[0].data());
            } else {
                navigate('/index');
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div style={s.loading}>Cargando...</div>;

    if (pestana === 'donaciones') return <Donaciones uid={uid} userData={userData} onVolver={() => setPestana('inicio')} />;
    if (pestana === 'solicitudes') return <Solicitudes uid={uid} onVolver={() => setPestana('inicio')} />;
    if (pestana === 'perfil') return <PerfilBene uid={uid} userData={userData} onVolver={() => setPestana('inicio')} navigate={navigate} />;

    return (
        <div style={s.page}>
            <div style={s.dashboard}>
                <div style={s.header}>
                    <div style={s.headerCircle}></div>
                    <div style={s.headerContent}>
                        <div>
                            <h1 style={s.titulo}>¡Hola, {userData?.nombre?.split(' ')[0]}! 👋</h1>
                            <p style={s.subtitulo}>Estamos aquí para apoyarte</p>
                        </div>
                        <img src="https://cdn-icons-png.flaticon.com/512/6997/6997662.png" alt="perfil" style={s.foto} />
                    </div>
                </div>

                <div style={s.contenido}>
                    <div style={s.cardPrincipal}>
                        <div style={s.iconoPrincipal}>❤️</div>
                        <div style={{ flex: 1 }}>
                            <h2 style={s.cardH2}>Comida en donación disponible cerca de ti</h2>
                            <p style={s.cardP}>Encuentra alimentos disponibles para ser entregados a personas y familias que lo necesiten.</p>
                            <button style={s.botonPrincipal} onClick={() => setPestana('donaciones')}>
                                Ver donaciones disponibles
                            </button>
                        </div>
                    </div>

                    <h2 style={{ ...s.tituloSeccion, marginTop: '24px' }}>Estadísticas de donaciones</h2>
                    <StatsInicio uid={uid} />

                    <div style={s.consejo}>
                        <div style={s.iconoConsejo}>🛡️</div>
                        <div>
                            <h3 style={{ fontSize: '20px', color: '#222', marginBottom: '8px' }}>Tu seguridad es lo primero</h3>
                            <p style={{ color: '#666', lineHeight: 1.6, fontSize: '14px' }}>
                                Verifica el lugar y la hora de entrega. Nunca compartas tu información personal con desconocidos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Nav pestana={pestana} setPestana={setPestana} />
        </div>
    );
}

/* ─────────────────────────────────────────
   STATS INICIO
───────────────────────────────────────── */
function StatsInicio({ uid }) {
    const [stats, setStats] = useState({ disponibles: 0, solicitudes: 0 });

    useEffect(() => {
        if (!uid) return;
        const qDon = query(collection(db, 'donaciones'), where('estado', '==', 'disponible'));
        const unsubDon = onSnapshot(qDon, snap => setStats(prev => ({ ...prev, disponibles: snap.size })));
        const qSol = query(collection(db, 'pedidos'), where('beneficiarioId', '==', uid));
        const unsubSol = onSnapshot(qSol, snap => setStats(prev => ({ ...prev, solicitudes: snap.size })));
        return () => { unsubDon(); unsubSol(); };
    }, [uid]);

    return (
        <div style={s.grid}>
            <div style={s.cardGrande}>
                <div style={s.iconoGrande}>🍱</div>
                <h3 style={{ fontSize: '40px', color: '#00a344', marginBottom: '8px' }}>{stats.disponibles}</h3>
                <p style={{ color: '#666', fontSize: '15px' }}>Donaciones disponibles cerca de tu ubicación</p>
            </div>
            <div style={s.lado}>
                <div style={s.cardPequena}>
                    <div style={{ ...s.icono, background: '#dfefff' }}>📋</div>
                    <div>
                        <h3 style={{ fontSize: '22px', color: '#222' }}>{stats.solicitudes}</h3>
                        <p style={{ color: '#666', fontSize: '12px' }}>Mis solicitudes</p>
                    </div>
                </div>
                <div style={s.cardPequena}>
                    <div style={{ ...s.icono, background: '#fff3d9' }}>⏰</div>
                    <div>
                        <h3 style={{ fontSize: '22px', color: '#222' }}>15 min</h3>
                        <p style={{ color: '#666', fontSize: '12px' }}>Tiempo promedio</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   DONACIONES
───────────────────────────────────────── */
function Donaciones({ uid, userData, onVolver }) {
    const [donaciones, setDonaciones] = useState([]);
    const [seleccionada, setSeleccionada] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'donaciones'), where('estado', '==', 'disponible'), orderBy('fecha_creacion', 'desc'));
        const unsub = onSnapshot(q, snap => setDonaciones(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, []);

    if (seleccionada) return <VerDonacion donacion={seleccionada} uid={uid} userData={userData} onVolver={() => setSeleccionada(null)} />;

    return (
        <div style={s.page}>
            <div style={s.overlayHeader}>
                <div style={s.headerCircle}></div>
                <button style={s.volverBtn} onClick={onVolver}>❮</button>
                <h1 style={s.titulo}>Donaciones cerca de ti</h1>
                <p style={s.subtitulo}>Estas son las publicaciones disponibles actualmente</p>
            </div>
            <div style={s.overlayContent}>
                {donaciones.length === 0 ? (
                    <div style={s.sinDatos}>No hay donaciones disponibles en este momento</div>
                ) : donaciones.map(d => (
                    <div key={d.id} style={s.donacionCard}>
                        {(d.imagen || d.fotoUrl) && (
                            <img src={d.imagen || d.fotoUrl} alt={d.titulo || d.nombre} style={s.donacionImg} />
                        )}
                        <div style={{ padding: '16px' }}>
    <div style={s.topCard}>
       <div>
    <h3 style={{
        fontSize: '18px',
        color: '#222',
        marginBottom: '6px'
    }}>
        {d.titulo || d.nombre}
    </h3>

    <div style={{
        width: '200px',
        height: '2px',
        background: '#000',
        borderRadius: '10px'
    }}></div>
</div>

        <span style={s.estadoBadge}>Disponible</span>
    </div>

    <p style={{
        color: '#00a344',
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '10px 0'
    }}>
        {d.cantidad}
    </p>

    <p style={{
        color: '#666',
        fontSize: '13px',
        margin: '0 0 14px',
        lineHeight: 1.5
    }}>
        {d.descripcion}
    </p>
                            <div style={s.infoGrid}>
                                <div style={s.datoBox}>
                                    <div style={{ ...s.icono, background: '#dfffe9' }}>📍</div>
                                    <div>
                                        <h4 style={{ color: '#222', fontSize: '14px' }}>Ubicación</h4>
                                        <p style={{ color: '#666', fontSize: '13px' }}>{d.ubicacion}</p>
                                    </div>
                                </div>
                                <div style={s.datoBox}>
                                    <div style={{ ...s.icono, background: '#fff3d9' }}>⏰</div>
                                    <div>
                                        <h4 style={{ color: '#222', fontSize: '14px' }}>Disponible hasta</h4>
                                        <p style={{ color: '#666', fontSize: '13px' }}>{d.disponibleHasta || '—'}</p>
                                    </div>
                                </div>
                            </div>
                            <button style={s.botonVerde} onClick={() => setSeleccionada(d)}>Ver donación</button>
                        </div>
                    </div>
                ))}
            </div>
            <Nav pestana="donaciones" setPestana={() => {}} />
        </div>
    );
}

/* ─────────────────────────────────────────
   VER DONACIÓN - TOTAL MEJORADO
───────────────────────────────────────── */
function VerDonacion({ donacion, uid, userData, onVolver }) {
    const [modo, setModo] = useState('delivery');
    const [motivo, setMotivo] = useState('');
    const [metodo, setMetodo] = useState('bicicleta');
    const [hora, setHora] = useState('');
    const [enviando, setEnviando] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    const tarifas = {
        bicicleta: { base: 2.00, porKm: 0.18 },
        moto:       { base: 2.80, porKm: 0.22 },
        carro:      { base: 4.50, porKm: 0.28 },
        camion:     { base: 8.00, porKm: 0.45 }
    };

    const distanciaKm = Number(donacion.distancia) || 3.8;
    const precioDelivery = modo === 'delivery' 
        ? Number((tarifas[metodo].base + (distanciaKm * tarifas[metodo].porKm)).toFixed(2)) 
        : 0;

    const tiempos = { bicicleta: '40 min', moto: '25 min', carro: '20 min', camion: '35 min' };

    const getDonacionCoords = () => {
        if (donacion.coordenadas?.lat && donacion.coordenadas?.lng) {
            return [parseFloat(donacion.coordenadas.lat), parseFloat(donacion.coordenadas.lng)];
        }
        if (donacion.lat && donacion.lng) {
            return [parseFloat(donacion.lat), parseFloat(donacion.lng)];
        }
        return [13.6929, -89.2182];
    };

    useEffect(() => {
        if (!mapRef.current) return;
        if (mapInstanceRef.current) mapInstanceRef.current.remove();

        const coords = getDonacionCoords();
        const map = L.map(mapRef.current).setView(coords, 16);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        L.marker(coords)
            .addTo(map)
            .bindPopup(`<b>${donacion.titulo || donacion.nombre}</b><br>${donacion.ubicacion}`)
            .openPopup();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [donacion]);

    const solicitar = async () => {
        if (!motivo) return alert('Por favor explica tu situación');
        setEnviando(true);
        try {
            await addDoc(collection(db, 'pedidos'), {
                beneficiarioId: uid,
                nombreCliente: userData?.nombre,
                direccionEntrega: userData?.direccion || 'Sin dirección',
                donacionId: donacion.id,
                donadorId: donacion.donadorId,
                restaurante: donacion.ubicacion,
                titulo: donacion.titulo || donacion.nombre,
                modo,
                metodo: modo === 'delivery' ? metodo : null,
                precioDelivery,
                distancia: distanciaKm,
                motivo,
                horaRecogida: modo === 'recoger' ? hora : null,
                estado: 'pendiente',
                fecha_creacion: new Date(),
            });
            alert('¡Solicitud enviada con éxito!');
            onVolver();
        } catch (e) {
            console.error(e);
            alert('Error al enviar la solicitud');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div style={s.page}>
            <div style={s.overlayHeader}>
                <div style={s.headerCircle}></div>
                <button style={s.volverBtn} onClick={onVolver}>❮</button>
                <h1 style={s.titulo}>Donación disponible</h1>
                <p style={s.subtitulo}>Selecciona cómo deseas recibir la donación</p>
            </div>
            <div style={s.overlayContent}>
                <div style={s.card}>
                    <h2 style={s.cardTitulo}>{donacion.titulo || donacion.nombre}</h2>
                    {(donacion.imagen || donacion.fotoUrl) && (
                        <img src={donacion.imagen || donacion.fotoUrl} alt="" style={{ ...s.donacionImg, marginBottom: '16px' }} />
                    )}
                    <p style={{ color: '#555', lineHeight: 1.6, fontSize: '15px' }}>{donacion.descripcion}</p>
                    <div style={s.infoGrid}>
                        <div style={s.infoBox}><span style={s.infoLabel}>Donador</span><strong>{donacion.donador || '—'}</strong></div>
                        <div style={s.infoBox}><span style={s.infoLabel}>Distancia</span><strong>{distanciaKm.toFixed(1)} km</strong></div>
                    </div>
                </div>

                <div style={s.card}>
                    <h2 style={s.cardTitulo}>¿Cómo deseas recibirla?</h2>
                    <div style={s.opcionesGrid}>
                        <div style={{ ...s.opcion, ...(modo === 'delivery' ? s.opcionActiva : {}) }} onClick={() => setModo('delivery')}>
                            <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>🚚 Delivery</h3>
                            <p style={{ fontSize: '13px', color: '#666' }}>Recibe la donación directamente en tu ubicación.</p>
                        </div>
                        <div style={{ ...s.opcion, ...(modo === 'recoger' ? s.opcionActiva : {}) }} onClick={() => setModo('recoger')}>
                            <h3 style={{ fontSize: '17px', marginBottom: '6px' }}>🙋 Recogeré personalmente</h3>
                            <p style={{ fontSize: '13px', color: '#666' }}>Tú mismo pasarás a recoger la donación.</p>
                        </div>
                    </div>

                    <label style={s.label}>Motivo de la solicitud</label>
                    <textarea style={s.textarea} placeholder="Explica brevemente tu situación..." value={motivo} onChange={e => setMotivo(e.target.value)} />

                    {modo === 'delivery' ? (
                        <>
                            <label style={s.label}>Tu dirección de entrega</label>
                            <input style={s.inputField} type="text" value={userData?.direccion || 'Sin dirección registrada'} readOnly />
                            <div ref={mapRef} style={s.mapa}></div>

                            <label style={s.label}>Método de entrega</label>
                            <div style={s.metodosGrid}>
                                {[
                                    { key: 'bicicleta', emoji: '🚲', label: 'Bicicleta', desc: 'Entrega económica' },
                                    { key: 'moto', emoji: '🛵', label: 'Moto', desc: 'Entrega rápida' },
                                    { key: 'carro', emoji: '🚗', label: 'Carro', desc: 'Pedidos medianos' },
                                    { key: 'camion', emoji: '🚚', label: 'Camión', desc: 'Entregas grandes' },
                                ].map(m => {
                                    const precio = (tarifas[m.key].base + distanciaKm * tarifas[m.key].porKm).toFixed(2);
                                    return (
                                        <div key={m.key} style={{ ...s.metodo, ...(metodo === m.key ? s.metodoActivo : {}) }} onClick={() => setMetodo(m.key)}>
                                            <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>{m.emoji} {m.label}</h4>
                                            <p style={{ fontSize: '13px', color: '#666' }}>{m.desc}</p>
                                            <p style={{ fontWeight: 'bold', color: '#00a344', marginTop: '8px' }}>
                                                ${precio}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={s.total}>
                                <div style={s.totalLine}><span>Distancia</span><span>{distanciaKm.toFixed(1)} km</span></div>
                                <div style={s.totalLine}><span>Método</span><span style={{ textTransform: 'capitalize' }}>{metodo}</span></div>
                                <div style={s.totalLine}><span>Tiempo aprox.</span><span>{tiempos[metodo]}</span></div>
                                
                                {/* TOTAL MEJORADO Y DESTACADO */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: '20px',
                                    paddingTop: '16px',
                                    borderTop: '2px solid #c8e6d5',
                                    fontSize: '32px',
                                    fontWeight: '900',
                                    color: '#006d2f'
                                }}>
                                    <span>Total</span>
                                    <span>${precioDelivery}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <label style={s.label}>Hora aproximada de llegada</label>
                            <input style={s.inputField} type="time" value={hora} onChange={e => setHora(e.target.value)} />
                        </>
                    )}

                    <button style={s.botonVerde} onClick={solicitar} disabled={enviando}>
                        {enviando ? 'Enviando...' : `Solicitar donación - $${precioDelivery}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   SOLICITUDES
───────────────────────────────────────── */
function Solicitudes({ uid, onVolver }) {
    const [pedidos, setPedidos] = useState([]);
    const [stats, setStats] = useState({ total: 0, aprobadas: 0 });

    useEffect(() => {
        if (!uid) return;
        const q = query(collection(db, 'pedidos'), where('beneficiarioId', '==', uid), orderBy('fecha_creacion', 'desc'));
        const unsub = onSnapshot(q, snap => {
            const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPedidos(lista);
            setStats({ total: lista.length, aprobadas: lista.filter(p => p.estado === 'entregado' || p.estado === 'asignado').length });
        });
        return () => unsub();
    }, [uid]);

    const cancelarPedido = async (pedidoId) => {
        if (!window.confirm('¿Seguro que deseas cancelar esta solicitud?')) return;
        await updateDoc(doc(db, 'pedidos', pedidoId), { estado: 'cancelado' });
    };

    const getEstiloEstado = (estado) => {
        if (estado === 'entregado') return { background: '#e3ffea', color: '#009944' };
        if (estado === 'asignado' || estado === 'en_camino') return { background: '#e3f0ff', color: '#0066cc' };
        if (estado === 'cancelado') return { background: '#ffe4e4', color: '#d60000' };
        return { background: '#fff6d8', color: '#c28a00' };
    };

    const getLabelEstado = (estado) => {
        if (estado === 'entregado') return 'Completado';
        if (estado === 'asignado') return 'Aprobada';
        if (estado === 'en_camino') return 'En camino';
        if (estado === 'cancelado') return 'Cancelada';
        return 'Pendiente';
    };

    const formatFecha = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('es-SV', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={s.page}>
            <div style={s.overlayHeader}>
                <div style={s.headerCircle}></div>
                <button style={s.volverBtn} onClick={onVolver}>❮</button>
                <h1 style={s.titulo}>Solicitudes Enviadas</h1>
                <p style={s.subtitulo}>Revisa el estado de tus solicitudes</p>
            </div>
            <div style={s.overlayContent}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div style={s.statBox}><div style={s.statIcon}>📨</div><div><h3 style={s.statNum}>{stats.total}</h3><p style={s.statLabel}>Solicitudes enviadas</p></div></div>
                    <div style={s.statBox}><div style={s.statIcon}>✅</div><div><h3 style={s.statNum}>{stats.aprobadas}</h3><p style={s.statLabel}>Solicitudes aprobadas</p></div></div>
                </div>

                {pedidos.length === 0 ? (
                    <div style={s.sinDatos}>No tienes solicitudes aún</div>
                ) : pedidos.map(p => (
                    <div key={p.id} style={s.card}>
                        <div style={s.topCard}>
                            <div>
                                <h2 style={{ fontSize: '20px', color: '#222', marginBottom: '6px' }}>{p.titulo}</h2>
                                <p style={{ fontSize: '14px', color: '#666' }}>Solicitud enviada a {p.restaurante}</p>
                            </div>
                            <span style={{ ...s.estadoBadge, ...getEstiloEstado(p.estado) }}>{getLabelEstado(p.estado)}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                            <div style={s.infoBox}><span style={s.infoLabel}>Fecha</span><strong style={{ fontSize: '14px', color: '#222' }}>{formatFecha(p.fecha_creacion)}</strong></div>
                            <div style={s.infoBox}><span style={s.infoLabel}>Método</span><strong style={{ fontSize: '14px', color: '#222' }}>{p.modo === 'delivery' ? `🛵 ${p.metodo}` : '🙋 Recogida personal'}</strong></div>
                            <div style={s.infoBox}><span style={s.infoLabel}>Dirección</span><strong style={{ fontSize: '14px', color: '#222' }}>{p.direccionEntrega}</strong></div>
                            <div style={s.infoBox}><span style={s.infoLabel}>Total delivery</span><strong style={{ fontSize: '14px', color: '#222' }}>${p.precioDelivery?.toFixed(2) || '0.00'}</strong></div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            {p.estado === 'pendiente' && (
                                <button style={{ ...s.botonVerde, marginTop: 0, flex: 1, background: '#f1f1f1', color: '#444', boxShadow: 'none' }} onClick={() => cancelarPedido(p.id)}>
                                    Cancelar solicitud
                                </button>
                            )}
                            {(p.estado === 'en_camino' || p.estado === 'asignado') && (
                                <button style={{ ...s.botonVerde, marginTop: 0, flex: 1 }}>🗺️ Rastrear pedido</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <Nav pestana="solicitudes" setPestana={() => {}} />
        </div>
    );
}

/* ─────────────────────────────────────────
   PERFIL BENEFICIARIO
───────────────────────────────────────── */
function PerfilBene({ uid, userData, onVolver, navigate }) {
    const [stats, setStats] = useState({ solicitudes: 0, aprobadas: 0, recibidas: 0 });

    useEffect(() => {
        if (!uid) return;
        const q = query(collection(db, 'pedidos'), where('beneficiarioId', '==', uid));
        const unsub = onSnapshot(q, snap => {
            const lista = snap.docs.map(d => d.data());
            setStats({
                solicitudes: lista.length,
                aprobadas: lista.filter(p => ['asignado', 'en_camino', 'entregado'].includes(p.estado)).length,
                recibidas: lista.filter(p => p.estado === 'entregado').length,
            });
        });
        return () => unsub();
    }, [uid]);

    const cerrarSesion = async () => { await signOut(auth); navigate('/index'); };

    return (
        <div style={s.page}>
            <div style={{ ...s.overlayHeader, textAlign: 'center' }}>
                <div style={s.headerCircle}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                    <button style={s.volverBtn} onClick={onVolver}>❮</button>
                    <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="foto" style={{ ...s.foto, width: '90px', height: '90px' }} />
                    <div style={{ width: '44px' }}></div>
                </div>
                <h1 style={{ ...s.titulo, marginTop: '10px' }}>{userData?.nombre}</h1>
                <p style={s.subtitulo}>Beneficiaria activa en la comunidad solidaria</p>
            </div>
            <div style={s.overlayContent}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    {[
                        { icon: '📨', val: stats.solicitudes, label: 'Solicitudes realizadas' },
                        { icon: '✅', val: stats.aprobadas, label: 'Solicitudes aprobadas' },
                        { icon: '🍱', val: stats.recibidas, label: 'Donaciones recibidas' },
                    ].map((st, i) => (
                        <div key={i} style={{ background: 'white', borderRadius: '20px', padding: '20px', textAlign: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
                            <div style={{ fontSize: '26px', marginBottom: '8px' }}>{st.icon}</div>
                            <h2 style={{ fontSize: '26px', color: '#222', marginBottom: '6px' }}>{st.val}</h2>
                            <p style={{ fontSize: '12px', color: '#666' }}>{st.label}</p>
                        </div>
                    ))}
                </div>

                <div style={s.card}>
                    <h3 style={s.cardTitulo}>Información personal</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        {[
                            { label: 'Correo electrónico', val: userData?.correo },
                            { label: 'Teléfono', val: userData?.telefono || '—' },
                            { label: 'Dirección', val: userData?.direccion || '—' },
                            { label: 'Miembro desde', val: userData?.fecha_registro?.toDate ? userData.fecha_registro.toDate().toLocaleDateString('es-SV', { month: 'long', year: 'numeric' }) : '—' },
                        ].map((item, i) => (
                            <div key={i} style={s.infoBox}>
                                <span style={s.infoLabel}>{item.label}</span>
                                <strong style={{ fontSize: '14px', color: '#222' }}>{item.val}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={s.card}>
                    <h3 style={s.cardTitulo}>Opciones</h3>
                    {[
                        { icon: '📨', titulo: 'Mis solicitudes', desc: 'Consulta tus solicitudes enviadas' },
                        { icon: '🔒', titulo: 'Privacidad y seguridad', desc: 'Gestiona tu cuenta y seguridad' },
                        { icon: '📞', titulo: 'Soporte', desc: 'Contáctanos para ayuda' },
                    ].map((op, i) => (
                        <div key={i} style={s.accion}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <span style={{ fontSize: '22px' }}>{op.icon}</span>
                                <div>
                                    <h4 style={{ fontSize: '15px', color: '#222', marginBottom: '3px' }}>{op.titulo}</h4>
                                    <p style={{ fontSize: '13px', color: '#666' }}>{op.desc}</p>
                                </div>
                            </div>
                            <span style={{ fontSize: '20px', color: '#888' }}>›</span>
                        </div>
                    ))}
                    <div style={{ ...s.accion, background: '#fff0f0' }} onClick={cerrarSesion}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '22px' }}>🚪</span>
                            <div>
                                <h4 style={{ fontSize: '15px', color: '#d60000', marginBottom: '3px' }}>Cerrar sesión</h4>
                                <p style={{ fontSize: '13px', color: '#666' }}>Salir de la aplicación</p>
                            </div>
                        </div>
                        <span style={{ fontSize: '20px', color: '#888' }}>›</span>
                    </div>
                </div>
            </div>
            <Nav pestana="perfil" setPestana={() => {}} />
        </div>
    );
}

/* ─────────────────────────────────────────
   NAV
───────────────────────────────────────── */
function Nav({ pestana, setPestana }) {
    return (
        <div style={s.nav}>
            {[
                { key: 'inicio', icon: '🏠', label: 'Inicio' },
                { key: 'donaciones', icon: '🍱', label: 'Donaciones' },
                { key: 'solicitudes', icon: '📋', label: 'Solicitudes' },
                { key: 'perfil', icon: '👤', label: 'Perfil' },
            ].map(item => (
                <div key={item.key} style={{ ...s.navItem, color: pestana === item.key ? '#00a344' : '#888', fontWeight: pestana === item.key ? 'bold' : 'normal' }} onClick={() => setPestana(item.key)}>
                    <span style={s.navIcon}>{item.icon}</span>
                    {item.label}
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────
   ESTILOS
───────────────────────────────────────── */
const s = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg,#eef2f7,#dfe7f3)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px', paddingBottom: '120px', fontFamily: 'Arial, Helvetica, sans-serif', boxSizing: 'border-box' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#00a344' },
    dashboard: { width: '100%', maxWidth: '1100px' },
    header: { background: 'linear-gradient(135deg,#006d2f,#00a344)', borderRadius: '28px', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.12)' },
    headerCircle: { position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: '-80px', right: '-50px' },
    headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', position: 'relative', zIndex: 2 },
    titulo: { fontSize: '28px', fontWeight: 800, margin: 0 },
    subtitulo: { marginTop: '6px', color: '#dcffe9', fontSize: '14px' },
    foto: { width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.25)' },
    contenido: { marginTop: '22px', width: '100%', maxWidth: '1100px' },
    cardPrincipal: { background: 'white', borderRadius: '28px', padding: '24px', display: 'flex', alignItems: 'center', gap: '22px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' },
    iconoPrincipal: { width: '90px', height: '90px', borderRadius: '24px', background: '#dfffe9', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '42px', flexShrink: 0 },
    cardH2: { fontSize: '24px', color: '#222', marginBottom: '8px' },
    cardP: { color: '#666', lineHeight: 1.6, fontSize: '14px' },
    botonPrincipal: { marginTop: '16px', padding: '13px 22px', border: 'none', borderRadius: '16px', background: 'linear-gradient(to right,#006d2f,#00a344)', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
    tituloSeccion: { fontSize: '24px', color: '#222', marginBottom: '14px' },
    grid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' },
    cardGrande: { background: 'white', borderRadius: '26px', padding: '24px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' },
    iconoGrande: { width: '85px', height: '85px', borderRadius: '24px', background: '#dfffe9', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '42px', margin: 'auto', marginBottom: '16px' },
    lado: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    cardPequena: { background: 'white', borderRadius: '24px', padding: '18px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' },
    icono: { width: '55px', height: '55px', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '25px', flexShrink: 0 },
    consejo: { marginTop: '24px', background: 'white', borderRadius: '24px', padding: '22px', display: 'flex', gap: '18px', alignItems: 'flex-start', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' },
    iconoConsejo: { width: '65px', height: '65px', borderRadius: '20px', background: '#dfffe9', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', flexShrink: 0 },
    nav: { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '92%', maxWidth: '760px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', borderRadius: '22px', padding: '14px 18px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.5)', zIndex: 999 },
    navItem: { textAlign: 'center', fontSize: '12px', cursor: 'pointer', transition: '0.2s' },
    navIcon: { display: 'block', fontSize: '24px', marginBottom: '4px' },
    overlayHeader: { width: '100%', maxWidth: '1100px', background: 'linear-gradient(135deg,#006d2f,#00a344)', color: 'white', padding: '28px', borderRadius: '28px', marginBottom: '20px', position: 'relative', overflow: 'hidden' },
    overlayContent: { width: '100%', maxWidth: '1100px' },
    volverBtn: { width: '44px', height: '44px', border: 'none', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '20px', cursor: 'pointer', marginBottom: '16px', display: 'block', position: 'relative', zIndex: 2 },
    sinDatos: { textAlign: 'center', padding: '40px', color: '#777', fontSize: '16px' },
    donacionCard: {background: 'white',borderRadius: '22px',overflow: 'hidden',boxShadow: '0 6px 18px rgba(0,0,0,0.06)',marginBottom: '14px'},
    donacionImg: {width: '100%',height: '200px', objectFit: 'cover'},
    topCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' },
    estadoBadge: { display: 'inline-block', background: '#dfffe9', color: '#00853a', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' },
    infoGrid: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' },
    datoBox: { display: 'flex', alignItems: 'center', gap: '12px', background: '#f7f7f7', borderRadius: '16px', padding: '12px' },
    botonVerde: { width: '100%', marginTop: '18px', padding: '14px', border: 'none', borderRadius: '16px', background: 'linear-gradient(to right,#006d2f,#00a344)', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
    card: { background: 'white', borderRadius: '24px', padding: '22px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', marginBottom: '20px' },
    cardTitulo: { fontSize: '20px', marginBottom: '16px', color: '#222' },
    infoBox: { background: '#f5f5f5', padding: '16px', borderRadius: '18px' },
    infoLabel: { display: 'block', fontSize: '12px', color: '#777', marginBottom: '6px' },
    opcionesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '16px' },
    opcion: { background: '#f5f5f5', padding: '20px', borderRadius: '20px', cursor: 'pointer', border: '3px solid transparent', transition: '0.2s' },
    opcionActiva: { borderColor: '#016d3b', background: '#eafff2' },
    label: { display: 'block', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold', color: '#333', fontSize: '14px' },
    textarea: { width: '100%', padding: '15px', border: 'none', borderRadius: '18px', background: '#f5f5f5', fontSize: '15px', outline: 'none', height: '120px', resize: 'none', boxSizing: 'border-box' },
    inputField: { width: '100%', padding: '15px', border: 'none', borderRadius: '18px', background: '#f5f5f5', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
    mapa: { width: '100%', height: '280px', borderRadius: '22px', marginTop: '15px', overflow: 'hidden' },
    metodosGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' },
    metodo: { background: '#f5f5f5', padding: '18px', borderRadius: '20px', cursor: 'pointer', border: '3px solid transparent', transition: '0.2s' },
    metodoActivo: { borderColor: '#016d3b', background: '#eafff2' },
    total: { marginTop: '20px', background: '#f5fff8', padding: '20px', borderRadius: '20px' },
    totalLine: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '15px' },
    statBox: { background: 'white', padding: '18px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' },
    statIcon: { width: '50px', height: '50px', borderRadius: '16px', background: '#eafff2', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px' },
    statNum: { fontSize: '22px', color: '#222' },
    statLabel: { fontSize: '13px', color: '#666', marginTop: '4px' },
    accion: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '16px', borderRadius: '18px', cursor: 'pointer', marginBottom: '12px' },
};

export default DashboardBeneficiario;