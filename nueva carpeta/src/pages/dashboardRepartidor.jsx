import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/conifg';
import {
    collection, query, where, onSnapshot,
    getDocs, doc, updateDoc, orderBy, limit
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function DashboardRepartidor() {
    const [userData, setUserData] = useState(null);
    const [conectado, setConectado] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [pedidoActivo, setPedidoActivo] = useState(null);
    const [pedidosHoy, setPedidosHoy] = useState(0);
    const [progreso, setProgreso] = useState({ realizados: 0, meta: 12 });
    const [pestana, setPestana] = useState('inicio');
    const navigate = useNavigate();

    // ── Auth ──
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUid(user.uid);
                try {
                    const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const data = snap.docs[0].data();
                        setUserData(data);
                        setConectado(data.disponible || false);
                    }
                } catch (e) {
                    console.error("Error cargando datos:", e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
                navigate('/index');
            }
        });
        return () => unsub();
    }, []);

    // ── Escuchar pedido activo en tiempo real ──
    useEffect(() => {
        if (!uid) return;
        const q = query(
            collection(db, 'pedidos'),
            where('repartidorId', '==', uid),
            where('estado', 'in', ['asignado', 'en_camino']),
            limit(1)
        );
        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const d = snap.docs[0];
                setPedidoActivo({ id: d.id, ...d.data() });
            } else {
                setPedidoActivo(null);
            }
        });
        return () => unsub();
    }, [uid]);

    // ── Contar pedidos entregados hoy ──
    useEffect(() => {
        if (!uid) return;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const q = query(
            collection(db, 'pedidos'),
            where('repartidorId', '==', uid),
            where('estado', '==', 'entregado'),
            where('fecha_entrega', '>=', hoy)
        );
        const unsub = onSnapshot(q, (snap) => {
            setPedidosHoy(snap.size);
            setProgreso(prev => ({ ...prev, realizados: snap.size }));
        });
        return () => unsub();
    }, [uid]);

    // ── Toggle online/offline ──
    const toggleOnline = async () => {
        if (!uid) return;
        const nuevo = !conectado;
        setConectado(nuevo);
        await updateDoc(doc(db, 'usuarios', uid), {
            disponible: nuevo,
            ultima_conexion: new Date()
        });
    };

    const getNombre = () => {
        if (userData?.nombre) return userData.nombre.split(' ')[0];
        return "Repartidor";
    };

    const porcentaje = Math.min(
        Math.round((progreso.realizados / progreso.meta) * 100), 100
    );

    
    return (
        <div style={styles.container}>
            <div style={styles.dashboard}>

                {/* HEADER */}
                <div style={styles.header}>
                    <div style={styles.headerContent}>
                        <div style={styles.textoHeader}>
                            <h1 style={styles.titulo}>¡Hola, {getNombre()}!</h1>
                            <p style={styles.subtitulo}>
                                {conectado ? 'Listo para entregar pedidos' : 'Estás desconectado'}
                            </p>
                            <div
                                style={conectado ? styles.onlineBtn : styles.onlineBtnOffline}
                                onClick={toggleOnline}
                            >
                                <span style={styles.estadoTexto}>
                                    {conectado ? "En línea" : "Desconectado"}
                                </span>
                                <div style={styles.switchTrack}>
                                    <div style={{
                                        ...styles.switchBall,
                                        background: conectado ? '#00c853' : '#ff4d4d',
                                        right: conectado ? '3px' : '23px',
                                    }}></div>
                                </div>
                            </div>
                        </div>
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                            alt="Foto Perfil"
                            style={styles.foto}
                        />
                    </div>
                </div>

                {/* CONTENIDO */}
                <div style={styles.contenido}>
                    <div style={styles.tituloSeccion}>
                        <h2 style={styles.tituloH2}>Resumen de hoy</h2>
                    </div>

                    {/* TARJETAS */}
                    <div style={styles.tarjetas}>
                        <div style={styles.card}>
                            <div style={styles.cardTop}>
                                <div style={{ ...styles.icono, ...styles.verde }}>📦</div>
                                <div>
                                    <h3 style={styles.cardNumero}>{pedidosHoy}</h3>
                                    <p style={styles.cardTexto}>Pedidos realizados</p>
                                </div>
                            </div>
                        </div>
                        <div style={styles.card}>
                            <div style={styles.cardTop}>
                                <div style={{ ...styles.icono, ...styles.azul }}>⏰</div>
                                <div>
                                    <h3 style={styles.cardNumero}>
                                        {conectado ? 'Activo' : 'Inactivo'}
                                    </h3>
                                    <p style={styles.cardTexto}>Estado actual</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GRID */}
                    <div style={styles.grid}>

                        {/* PEDIDO ACTIVO */}
                        <div style={styles.pedido}>
                            {pedidoActivo ? (
                                <>
                                    <span style={styles.estado}>
                                        {pedidoActivo.estado === 'en_camino' ? 'En camino' : 'Asignado'}
                                    </span>
                                    <h3 style={styles.pedidoTitulo}>
                                        Pedido #{pedidoActivo.id?.slice(-4).toUpperCase()}
                                    </h3>
                                    <p style={styles.cliente}>
                                        Cliente: {pedidoActivo.nombreCliente}
                                    </p>
                                    <div style={styles.direccion}>
                                        📍 {pedidoActivo.direccionEntrega}
                                    </div>
                                    <button
                                        style={styles.boton}
                                        onClick={() => navigate('/verpedido', {
                                            state: { pedidoId: pedidoActivo.id }
                                        })}
                                    >
                                        Ver pedido
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span style={styles.estado}>Sin pedido</span>
                                    <h3 style={styles.pedidoTitulo}>Sin pedido activo</h3>
                                    <p style={styles.cliente}>
                                        {conectado
                                            ? 'Esperando un pedido...'
                                            : 'Conéctate para recibir pedidos'}
                                    </p>
                                    <div style={styles.direccion}>
                                        Cuando aceptes un pedido aparecerá aquí
                                    </div>
                                    <button
                                        style={styles.boton}
                                        onClick={() => setPestana('pedidos')}
                                    >
                                        Ver pedidos disponibles
                                    </button>
                                </>
                            )}
                        </div>

                        {/* PROGRESO */}
                        <div style={styles.progreso}>
                            <h3 style={styles.progresoTitulo}>Progreso del día</h3>
                            <div style={styles.textoProgreso}>
                                <span>{progreso.realizados} / {progreso.meta} entregas</span>
                                <span>{porcentaje}%</span>
                            </div>
                            <div style={styles.barra}>
                                <div style={{ ...styles.relleno, width: `${porcentaje}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NAV */}
            <div style={styles.nav}>
                {[
                    { key: 'inicio', icon: '🏠', label: 'Inicio' },
                    { key: 'pedidos', icon: '📦', label: 'Pedidos' },
                    { key: 'historial', icon: '🕘', label: 'Historial' },
                    { key: 'perfil', icon: '👤', label: 'Perfil' },
                ].map(item => (
                    <div
                        key={item.key}
                        style={{
                            ...styles.navItem,
                            color: pestana === item.key ? '#016d3b' : '#888',
                            fontWeight: pestana === item.key ? 'bold' : 'normal',
                        }}
                        onClick={() => setPestana(item.key)}
                    >
                        <span style={styles.navIcon}>{item.icon}</span>
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );

// Al final de PedidosDisponibles, antes del cierre del return:
<div style={styles.nav}>
    {[
        { key: 'inicio', icon: '🏠', label: 'Inicio' },
        { key: 'pedidos', icon: '📦', label: 'Pedidos' },
        { key: 'historial', icon: '🕘', label: 'Historial' },
        { key: 'perfil', icon: '👤', label: 'Perfil' },
    ].map(item => (
        <div
            key={item.key}
            style={{
                ...styles.navItem,
                color: item.key === 'pedidos' ? '#016d3b' : '#888',
                fontWeight: item.key === 'pedidos' ? 'bold' : 'normal',
            }}
            onClick={() => item.key !== 'pedidos' ? onVolver() : null}
        >
            <span style={styles.navIcon}>{item.icon}</span>
            {item.label}
        </div>
    ))}
</div>
}


/* ─────────────────────────────────────────
   PEDIDOS DISPONIBLES
───────────────────────────────────────── */
function PedidosDisponibles({ uid, onVolver, navigate }) {
    const [pedidos, setPedidos] = useState([]);

    useEffect(() => {
        const q = query(
            collection(db, 'pedidos'),
            where('estado', '==', 'pendiente'),
            orderBy('fecha_creacion', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const aceptarPedido = async (pedidoId) => {
        await updateDoc(doc(db, 'pedidos', pedidoId), {
            estado: 'asignado',
            repartidorId: uid,
            fecha_asignacion: new Date()
        });
        onVolver();
    };

    return (
        <div style={styles.container}>
            <div style={styles.overlayHeader}>
                <button style={styles.volverBtn} onClick={onVolver}>←</button>
                <h1 style={styles.titulo}>Pedidos Disponibles</h1>
                <p style={styles.subtitulo}>Selecciona un pedido para comenzar</p>
            </div>
            <div style={styles.overlayContent}>
                {pedidos.length === 0 ? (
                    <div style={styles.sinDatos}>No hay pedidos disponibles en este momento</div>
                ) : pedidos.map(p => (
                    <div key={p.id} style={styles.pedidoItem}>
                        <div style={styles.pedidoItemTop}>
                            <span style={styles.pedidoItemNum}>
                                Pedido #{p.id?.slice(-4).toUpperCase()}
                            </span>
                            <span style={styles.estado}>Disponible</span>
                        </div>
                        <p style={{ color: '#555', fontSize: '15px', marginTop: '10px' }}>
                            Cliente: {p.nombreCliente}
                        </p>
                        <div style={styles.rutaBox}>
                            <div style={styles.puntoRuta}>
                                <div style={{ ...styles.circulo, background: '#00b85c' }}></div>
                                <div>
                                    <span style={styles.rutaLabel}>Recoger en</span>
                                    <strong style={styles.rutaVal}>{p.restaurante}</strong>
                                </div>
                            </div>
                            <div style={styles.lineaRuta}></div>
                            <div style={styles.puntoRuta}>
                                <div style={{ ...styles.circulo, background: '#ff4d4d' }}></div>
                                <div>
                                    <span style={styles.rutaLabel}>Entregar en</span>
                                    <strong style={styles.rutaVal}>{p.direccionEntrega}</strong>
                                </div>
                            </div>
                        </div>
                        <div style={styles.pedidoExtra}>
                            <div>
                                <div style={styles.precio}>${p.precioDelivery?.toFixed(2)}</div>
                                <div style={styles.distanciaText}>{p.distancia} km</div>
                            </div>
                        </div>
                        <div style={styles.botonesRow}>
                            <button style={styles.btnAceptar} onClick={() => aceptarPedido(p.id)}>
                                Aceptar pedido
                            </button>
                            <button style={styles.btnRechazar}>Ignorar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


/* ─────────────────────────────────────────
   HISTORIAL
───────────────────────────────────────── */
function Historial({ uid, onVolver }) {
    const [pedidos, setPedidos] = useState([]);

    useEffect(() => {
        if (!uid) return;
        const q = query(
            collection(db, 'pedidos'),
            where('repartidorId', '==', uid),
            where('estado', '==', 'entregado'),
            orderBy('fecha_entrega', 'desc'),
            limit(20)
        );
        const unsub = onSnapshot(q, (snap) => {
            setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [uid]);

    const formatFecha = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('es-SV', {
            day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div style={styles.container}>
            <div style={styles.overlayHeader}>
                <button style={styles.volverBtn} onClick={onVolver}>←</button>
                <h1 style={styles.titulo}>Historial</h1>
                <p style={styles.subtitulo}>Tus entregas realizadas recientemente</p>
            </div>
            <div style={styles.overlayContent}>
                {pedidos.length === 0 ? (
                    <div style={styles.sinDatos}>No tienes entregas registradas aún</div>
                ) : pedidos.map(p => (
                    <div key={p.id} style={styles.pedidoItem}>
                        <div style={styles.pedidoItemTop}>
                            <span style={styles.pedidoItemNum}>
                                Pedido #{p.id?.slice(-4).toUpperCase()}
                            </span>
                            <span style={{ ...styles.estado, background: '#dfffe9', color: '#016d3b' }}>
                                Completado
                            </span>
                        </div>
                        <p style={{ color: '#555', fontSize: '15px', marginTop: '10px' }}>
                            Cliente: {p.nombreCliente}
                        </p>
                        <div style={styles.rutaBox}>
                            <div style={styles.puntoRuta}>
                                <div style={{ ...styles.circulo, background: '#00b85c' }}></div>
                                <div>
                                    <span style={styles.rutaLabel}>Recogido en</span>
                                    <strong style={styles.rutaVal}>{p.restaurante}</strong>
                                </div>
                            </div>
                            <div style={styles.lineaRuta}></div>
                            <div style={styles.puntoRuta}>
                                <div style={{ ...styles.circulo, background: '#ff4d4d' }}></div>
                                <div>
                                    <span style={styles.rutaLabel}>Entregado en</span>
                                    <strong style={styles.rutaVal}>{p.direccionEntrega}</strong>
                                </div>
                            </div>
                        </div>
                        <div style={styles.pedidoExtra}>
                            <div style={styles.precio}>+${p.precioDelivery?.toFixed(2)}</div>
                            <div style={styles.distanciaText}>{formatFecha(p.fecha_entrega)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


/* ─────────────────────────────────────────
   PERFIL
───────────────────────────────────────── */
function Perfil({ uid, userData, onVolver, navigate }) {
    const [stats, setStats] = useState({ entregas: 0, ganancias: 0 });
    const [editando, setEditando] = useState(false);
    const [nombre, setNombre] = useState(userData?.nombre || '');
    const [vehiculo, setVehiculo] = useState(userData?.vehiculo || '');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (!uid) return;
        const q = query(
            collection(db, 'pedidos'),
            where('repartidorId', '==', uid),
            where('estado', '==', 'entregado')
        );
        const unsub = onSnapshot(q, (snap) => {
            const total = snap.docs.reduce((acc, d) => acc + (d.data().precioDelivery || 0), 0);
            setStats({ entregas: snap.size, ganancias: total.toFixed(2) });
        });
        return () => unsub();
    }, [uid]);

    const guardarCambios = async () => {
        setGuardando(true);
        await updateDoc(doc(db, 'usuarios', uid), { nombre, vehiculo });
        setGuardando(false);
        setEditando(false);
    };

    const cerrarSesion = async () => {
        await auth.signOut();
        navigate('/index');
    };

    return (
        <div style={styles.container}>
            <div style={{ ...styles.overlayHeader, textAlign: 'center' }}>
                <button style={{ ...styles.volverBtn, display: 'block' }} onClick={onVolver}>←</button>
                <img
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    alt="foto"
                    style={{ ...styles.foto, width: '100px', height: '100px', marginBottom: '10px' }}
                />
                <h1 style={styles.titulo}>{userData?.nombre}</h1>
                <p style={styles.subtitulo}>Repartidor activo</p>
            </div>

            <div style={styles.overlayContent}>
                <div style={styles.gridDos}>

                    {/* INFO */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitulo}>Información personal</h2>
                        {editando ? (
                            <>
                                <div style={styles.dato}>
                                    <span style={styles.datoLabel}>Nombre</span>
                                    <input style={styles.inputEdit} value={nombre}
                                        onChange={e => setNombre(e.target.value)} />
                                </div>
                                <div style={styles.dato}>
                                    <span style={styles.datoLabel}>Vehículo</span>
                                    <input style={styles.inputEdit} value={vehiculo}
                                        onChange={e => setVehiculo(e.target.value)} />
                                </div>
                                <div style={styles.dato}>
                                    <span style={styles.datoLabel}>Correo</span>
                                    <strong>{userData?.correo}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                                    <button style={styles.boton} onClick={guardarCambios} disabled={guardando}>
                                        {guardando ? 'Guardando...' : 'Guardar'}
                                    </button>
                                    <button
                                        style={{ ...styles.boton, background: '#eee', color: '#444', boxShadow: 'none' }}
                                        onClick={() => setEditando(false)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={styles.dato}>
                                    <span style={styles.datoLabel}>Correo</span>
                                    <strong>{userData?.correo}</strong>
                                </div>
                                <div style={styles.dato}>
                                    <span style={styles.datoLabel}>Teléfono</span>
                                    <strong>{userData?.telefono || '—'}</strong>
                                </div>
                                <div style={styles.dato}>
                                    <span style={styles.datoLabel}>Vehículo</span>
                                    <strong>{userData?.vehiculo || '—'}</strong>
                                </div>
                                <div style={styles.dato}>
                                    <span style={styles.datoLabel}>Zona</span>
                                    <strong>{userData?.zona || '—'}</strong>
                                </div>
                                <div style={styles.dato}>
                                    <span style={styles.datoLabel}>Placa</span>
                                    <strong>{userData?.placa || '—'}</strong>
                                </div>
                                <button style={styles.boton} onClick={() => setEditando(true)}>
                                    Editar perfil
                                </button>
                            </>
                        )}
                    </div>

                    {/* STATS */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitulo}>Estadísticas</h2>
                        <div style={styles.gridDos}>
                            {[
                                { val: stats.entregas, label: 'Entregas' },
                                { val: '4.9★', label: 'Calificación' },
                                { val: `$${stats.ganancias}`, label: 'Ganancias' },
                                { val: '—', label: 'Eficiencia' },
                            ].map((s, i) => (
                                <div key={i} style={styles.miniCard}>
                                    <h3 style={styles.miniCardVal}>{s.val}</h3>
                                    <p style={styles.miniCardLabel}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            style={{ ...styles.boton, marginTop: '16px', background: '#ff4d4d', boxShadow: '0 4px 12px rgba(255,77,77,0.25)' }}
                            onClick={cerrarSesion}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


/* ─────────────────────────────────────────
   ESTILOS
───────────────────────────────────────── */
const styles = {
    container: {
        minHeight: '100vh', background: 'linear-gradient(135deg, #eef2f7, #dfe7f3)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px', paddingBottom: '120px',
        fontFamily: 'Arial, Helvetica, sans-serif',
    },
    loading: { textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#016d3b' },
    dashboard: {
        width: '100%', maxWidth: '1000px', background: 'white',
        borderRadius: '28px', overflow: 'hidden', boxShadow: '0 18px 45px rgba(0,0,0,0.15)',
    },
    header: {
        background: 'linear-gradient(135deg, #003d24, #016d3b)',
        color: 'white', padding: '24px', position: 'relative', overflow: 'hidden',
    },
    headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
    textoHeader: { flex: 1 },
    titulo: { fontSize: '28px', fontWeight: '800', margin: 0 },
    subtitulo: { marginTop: '5px', color: '#d6ffe4', fontSize: '14px' },
    onlineBtn: {
        marginTop: '15px', background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.2)', width: 'max-content',
        padding: '8px 14px', borderRadius: '25px', display: 'flex',
        alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer',
    },
    onlineBtnOffline: {
        marginTop: '15px', background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.2)', width: 'max-content',
        padding: '8px 14px', borderRadius: '25px', display: 'flex',
        alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer',
    },
    estadoTexto: { fontWeight: '500', color: 'white' },
    switchTrack: { width: '42px', height: '22px', background: 'white', borderRadius: '20px', position: 'relative' },
    switchBall: { position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', top: '3px', transition: '0.25s' },
    foto: { width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.25)' },

    contenido: { padding: '24px', background: '#f8fafc' },
    tituloSeccion: { marginBottom: '14px' },
    tituloH2: { fontSize: '22px', color: '#222', margin: 0 },
    tarjetas: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    card: { background: 'white', padding: '18px', borderRadius: '20px', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' },
    cardTop: { display: 'flex', alignItems: 'center', gap: '12px' },
    icono: { width: '48px', height: '48px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px' },
    verde: { background: '#dfffe9' },
    azul: { background: '#dfefff' },
    cardNumero: { fontSize: '22px', color: '#222', margin: 0 },
    cardTexto: { marginTop: '5px', color: '#777', fontSize: '13px' },

    grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px', marginTop: '24px' },
    pedido: { background: 'white', borderRadius: '24px', padding: '22px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' },
    estado: { display: 'inline-block', background: '#dfffe9', color: '#016d3b', padding: '6px 14px', borderRadius: '18px', fontSize: '11px', fontWeight: 'bold' },
    pedidoTitulo: { marginTop: '14px', fontSize: '24px', color: '#222' },
    cliente: { marginTop: '5px', color: '#666', fontSize: '14px' },
    direccion: { marginTop: '15px', background: '#f5f5f5', borderRadius: '16px', padding: '16px', color: '#444', lineHeight: '1.5', fontSize: '13px' },
    boton: { width: '100%', marginTop: '18px', padding: '13px', border: 'none', borderRadius: '16px', background: 'linear-gradient(to right, #015e36, #018b50)', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },

    progreso: { background: 'white', borderRadius: '24px', padding: '22px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' },
    progresoTitulo: { fontSize: '20px', color: '#222', marginBottom: '15px' },
    textoProgreso: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#444', fontWeight: 'bold', fontSize: '13px' },
    barra: { width: '100%', height: '12px', background: '#ddd', borderRadius: '20px', overflow: 'hidden' },
    relleno: { height: '100%', background: 'linear-gradient(to right, #2ecc71, #016d3b)', transition: 'width 0.5s' },

    nav: {
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        width: '90%', maxWidth: '750px', background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(14px)', borderRadius: '22px', padding: '14px 18px',
        display: 'flex', justifyContent: 'space-around', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 999,
    },
    navItem: { textAlign: 'center', fontSize: '12px', cursor: 'pointer', transition: '0.2s' },
    navIcon: { display: 'block', fontSize: '24px', marginBottom: '4px' },

    overlayHeader: {
        width: '100%', maxWidth: '1000px',
        background: 'linear-gradient(135deg, #003d24, #016d3b)',
        color: 'white', padding: '28px', borderRadius: '28px', marginBottom: '20px',
        position: 'relative', overflow: 'hidden',
    },
    overlayContent: { width: '100%', maxWidth: '1000px' },
    volverBtn: { width: '44px', height: '44px', border: 'none', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '20px', cursor: 'pointer', marginBottom: '16px' },
    sinDatos: { textAlign: 'center', padding: '40px', color: '#777', fontSize: '16px' },

    pedidoItem: { background: 'white', borderRadius: '24px', padding: '22px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', marginBottom: '18px' },
    pedidoItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    pedidoItemNum: { fontSize: '20px', fontWeight: 'bold', color: '#222' },
    rutaBox: { marginTop: '16px', background: '#f8f8f8', borderRadius: '18px', padding: '16px' },
    puntoRuta: { display: 'flex', alignItems: 'center', gap: '12px' },
    circulo: { width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0 },
    lineaRuta: { width: '3px', height: '28px', background: '#d0d0d0', marginLeft: '5px', marginTop: '4px', marginBottom: '4px', borderRadius: '20px' },
    rutaLabel: { display: 'block', fontSize: '12px', color: '#777', marginBottom: '2px' },
    rutaVal: { color: '#222', fontSize: '14px' },
    pedidoExtra: { marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    precio: { fontSize: '22px', fontWeight: 'bold', color: '#016d3b' },
    distanciaText: { color: '#777', fontSize: '14px' },
    botonesRow: { display: 'flex', gap: '12px', marginTop: '18px' },
    btnAceptar: { flex: 1, padding: '14px', border: 'none', borderRadius: '16px', background: 'linear-gradient(to right,#016d3b,#019c58)', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
    btnRechazar: { flex: 1, padding: '14px', border: 'none', borderRadius: '16px', background: '#ececec', color: '#444', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },

    gridDos: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    cardTitulo: { fontSize: '20px', marginBottom: '16px', color: '#222' },
    dato: { marginBottom: '14px' },
    datoLabel: { display: 'block', fontSize: '13px', color: '#777', marginBottom: '4px' },
    inputEdit: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', marginTop: '4px' },
    miniCard: { background: '#f7f7f7', borderRadius: '16px', padding: '16px', textAlign: 'center' },
    miniCardVal: { fontSize: '24px', color: '#016d3b', marginBottom: '4px' },
    miniCardLabel: { color: '#666', fontSize: '13px' },
};

export default DashboardRepartidor;