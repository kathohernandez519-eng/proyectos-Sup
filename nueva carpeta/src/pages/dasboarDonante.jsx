import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/conifg';
import { collection, query, where, onSnapshot, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, Link } from 'react-router-dom';

function DashboardDonante() {
    const [userData, setUserData] = useState(null);
    const [donaciones, setDonaciones] = useState([]);
    const [donacionesCount, setDonacionesCount] = useState(0);
    const [donacionesActivas, setDonacionesActivas] = useState(0);
    const [solicitudesCount, setSolicitudesCount] = useState(0);
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pestana, setPestana] = useState('inicio');
    const [uid, setUid] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUid(user.uid);
                try {
                    const qUsuario = query(collection(db, "usuarios"), where("uid", "==", user.uid));
                    const snap = await getDocs(qUsuario);
                    if (!snap.empty) setUserData(snap.docs[0].data());

                    const qDon = query(collection(db, "donaciones"), where("donadorId", "==", user.uid));
                    onSnapshot(qDon, (s) => {
                        const lista = s.docs.map(d => ({ id: d.id, ...d.data() }));
                        setDonaciones(lista);
                        setDonacionesCount(lista.length);
                        setDonacionesActivas(lista.filter(d => d.estado === 'disponible').length);
                    });

                    const qPedidos = query(
                        collection(db, "pedidos"),
                        where("donadorId", "==", user.uid),
                        where("estado", "==", "pendiente")
                    );
                    onSnapshot(qPedidos, (s) => {
                        setSolicitudesCount(s.size);
                        setSolicitudes(s.docs.map(d => ({ id: d.id, ...d.data() })));
                    });

                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
                navigate('/index');
            }
        });
        return () => unsubAuth();
    }, []);

    const cerrarSesion = async () => { await signOut(auth); navigate('/index'); };
    const eliminarDonacion = async (id) => {
        if (!window.confirm('¿Eliminar esta donación?')) return;
        await deleteDoc(doc(db, 'donaciones', id));
    };
    const getNombre = () => userData?.nombre?.split(' ')[0] || 'Donante';
    const getEstado = (estado) => {
        if (estado === 'disponible') return { bg: '#dff8e8', color: '#0c8a46', label: 'Disponible' };
        if (estado === 'entregado') return { bg: '#dff8e8', color: '#0c8a46', label: 'Entregada' };
        if (estado === 'cancelado') return { bg: '#ffe2e2', color: '#d93030', label: 'Cancelada' };
        return { bg: '#fff3d9', color: '#d38a00', label: 'Pendiente' };
    };

    if (loading) return <div style={s.loading}>Cargando BiteX...</div>;
    if (pestana === 'mis-donaciones') return <MisDonaciones donaciones={donaciones} onVolver={() => setPestana('inicio')} onEliminar={eliminarDonacion} getEstado={getEstado} navigate={navigate} />;
    if (pestana === 'solicitudes') return <SolicitudesRecibidas solicitudes={solicitudes} onVolver={() => setPestana('inicio')} />;
    if (pestana === 'perfil') return <PerfilDonante userData={userData} uid={uid} donacionesCount={donacionesCount} donacionesActivas={donacionesActivas} onVolver={() => setPestana('inicio')} onCerrarSesion={cerrarSesion} />;

    return (
        <div style={s.page}>
            <div style={s.container}>

                {/* HEADER */}
                <div style={s.header}>
                    <div style={s.headerBefore}></div>
                    <div style={s.headerAfter}></div>
                    <div style={s.headerContent}>
                        <div style={s.userRow}>
                            <img src="https://cdn-icons-png.flaticon.com/512/6997/6997662.png" alt="foto" style={s.foto} />
                            <div>
                                <h1 style={s.saludo}>¡Hola, {getNombre()}! 👋</h1>
                                <p style={s.saludoSub}>Gracias por compartir comida con quienes más lo necesitan</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENIDO */}
                <div style={s.content}>

                    {/* ALERTA SOLICITUDES PENDIENTES */}
                    {solicitudes.length > 0 && (
                        <div style={s.alertaSolicitudes} onClick={() => setPestana('solicitudes')}>
                            <span style={{ fontSize: '24px' }}>🔔</span>
                            <div style={{ flex: 1 }}>
                                <strong style={{ color: '#7a4a00', fontSize: '15px' }}>
                                    {solicitudes.length} solicitud{solicitudes.length > 1 ? 'es' : ''} pendiente{solicitudes.length > 1 ? 's' : ''}
                                </strong>
                                <p style={{ fontSize: '13px', color: '#9a6200', marginTop: '2px' }}>
                                    Alguien quiere recibir tu donación. ¡Responde ahora!
                                </p>
                            </div>
                            <span style={{ color: '#9a6200', fontSize: '22px' }}>›</span>
                        </div>
                    )}

                    {/* HERO */}
                    <div style={s.hero}>
                        <div style={s.heroLeft}>
                            <h2 style={s.heroH2}>Dona comida,<br />alimenta sonrisas</h2>
                            <p style={s.heroP}>Tu comida puede ayudar a muchas personas. Cada donación genera un impacto positivo.</p>
                            <Link to="/donaciones" style={{ textDecoration: 'none' }}>
                                <button style={s.heroBtn}>Hacer una donación</button>
                            </Link>
                        </div>
                        <img src="https://cdn-icons-png.flaticon.com/512/2153/2153788.png" style={s.heroImg} alt="" />
                    </div>

                    {/* ESTADÍSTICAS */}
                    <div style={s.sectionTitle}><h3 style={s.sectionH3}>Resumen de impacto</h3></div>
                    <div style={s.stats}>
                        <div style={s.statBig}>
                            <div style={s.statBigTop}>
                                <div style={s.bigIcon}>🍱</div>
                                <div>
                                    <h2 style={s.statBigNum}>{donacionesCount}</h2>
                                    <p style={s.statBigLabel}>Donaciones Realizadas</p>
                                </div>
                            </div>
                        </div>
                        <div style={s.statsRow}>
                            <div style={s.statSmall}>
                                <div style={s.smallIcon}>🟢</div>
                                <h3 style={s.statSmallNum}>{donacionesActivas}</h3>
                                <p style={s.statSmallLabel}>Donaciones activas</p>
                            </div>
                            <div style={s.statSmall}>
                                <div style={s.smallIcon}>📩</div>
                                <h3 style={s.statSmallNum}>{solicitudesCount}</h3>
                                <p style={s.statSmallLabel}>Solicitudes recibidas</p>
                            </div>
                        </div>
                    </div>

                    {/* DONACIÓN ACTIVA */}
                    {donaciones.filter(d => d.estado === 'disponible').length > 0 && (
                        <>
                            <div style={s.sectionTitle}><h3 style={s.sectionH3}>Donación activa</h3></div>
                            {donaciones.filter(d => d.estado === 'disponible').slice(0, 1).map(d => {
                                const est = getEstado(d.estado);
                                return (
                                    <div key={d.id} style={s.card}>
                                        {(d.imagen || d.fotoUrl) && (
                                            <img src={d.imagen || d.fotoUrl} alt={d.titulo || d.nombre} style={s.cardImg} />
                                        )}
                                        <div style={s.cardInfo}>
                                            <span style={{ ...s.estadoBadge, background: est.bg, color: est.color }}>{est.label}</span>
                                            <h4 style={s.cardH4}>{d.titulo || d.nombre}</h4>
                                            <p style={s.cardMeta}>
                                                {d.fecha || new Date().toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                <br /><br />📍 {d.ubicacion}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {donaciones.length === 0 && (
                        <div style={s.sinDatos}>Aún no has publicado ninguna donación</div>
                    )}
                </div>
            </div>

            <Nav pestana={pestana} setPestana={setPestana} />
        </div>
    );
}


/* ─────────────────────────────────────────
   SOLICITUDES RECIBIDAS
───────────────────────────────────────── */
function SolicitudesRecibidas({ solicitudes, onVolver }) {

    const aceptar = async (pedidoId, donacionId) => {
        await updateDoc(doc(db, 'pedidos', pedidoId), {
            estado: 'asignado',
            fecha_aprobacion: new Date()
        });
        if (donacionId) {
            await updateDoc(doc(db, 'donaciones', donacionId), {
                estado: 'en_proceso'
            });
        }
        alert('¡Solicitud aceptada! Se asignará un repartidor.');
    };

    const rechazar = async (pedidoId) => {
        if (!window.confirm('¿Seguro que deseas rechazar esta solicitud?')) return;
        await updateDoc(doc(db, 'pedidos', pedidoId), {
            estado: 'cancelado',
            fecha_rechazo: new Date()
        });
    };

    const formatFecha = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('es-SV', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={s.page}>
            <div style={s.appNarrow}>
                <div style={s.headerNarrow}>
                    <div style={s.headerTopRow}>
                            <button style={s.backBtn} onClick={onVolver}>❮</button>                       
                             <div>
                            <h1 style={s.headerH1}>Solicitudes</h1>
                            <p style={s.headerP}>Personas que quieren tu donación</p>
                        </div>
                    </div>
                </div>

                <div style={s.contentNarrow}>
                    {solicitudes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                            <p style={{ fontSize: '15px' }}>No tienes solicitudes pendientes</p>
                        </div>
                    ) : solicitudes.map(p => (
                        <div key={p.id} style={s.solicitudCard}>

                            <div style={s.solicitudHeader}>
                                <div style={s.solicitudIcono}>👤</div>
                                <div style={{ flex: 1 }}>
                                    <strong style={{ fontSize: '16px', color: '#222' }}>{p.nombreCliente}</strong>
                                    <p style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>{formatFecha(p.fecha_creacion)}</p>
                                </div>
                                <span style={s.solicitudBadge}>Pendiente</span>
                            </div>

                            <div style={s.solicitudInfo}>
                                <span style={s.infoLabelSol}>Donación solicitada</span>
                                <strong style={{ fontSize: '15px', color: '#222' }}>{p.titulo}</strong>
                            </div>

                            <div style={s.solicitudInfo}>
                                <span style={s.infoLabelSol}>Método de entrega</span>
                                <strong style={{ fontSize: '14px', color: '#222' }}>
                                    {p.modo === 'delivery' ? `🛵 Delivery — ${p.metodo}` : '🙋 Recogida personal'}
                                </strong>
                            </div>

                            {p.modo === 'delivery' && (
                                <div style={s.solicitudInfo}>
                                    <span style={s.infoLabelSol}>Dirección de entrega</span>
                                    <strong style={{ fontSize: '14px', color: '#222' }}>📍 {p.direccionEntrega}</strong>
                                </div>
                            )}

                            <div style={s.motivoBox}>
                                <span style={s.infoLabelSol}>Motivo de la solicitud</span>
                                <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.6, marginTop: '6px' }}>
                                    "{p.motivo}"
                                </p>
                            </div>

                            <div style={s.solicitudBotones}>
                                <button style={s.btnAceptarSol} onClick={() => aceptar(p.id, p.donacionId)}>
                                    ✅ Aceptar
                                </button>
                                <button style={s.btnRechazarSol} onClick={() => rechazar(p.id)}>
                                    ✕ Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Nav 
    pestana="solicitudes" 
    setPestana={(tab) => {
        if (tab === 'inicio') onVolver();
    }} 
/>
        </div>
    );
}


/* ─────────────────────────────────────────
   MIS DONACIONES
───────────────────────────────────────── */
function MisDonaciones({ donaciones, onVolver, onEliminar, getEstado, navigate }) {
    return (
        <div style={s.page}>
            <div style={s.appNarrow}>
                <div style={s.headerNarrow}>
                    <div style={s.headerTopRow}>
                        <button style={s.backBtn} onClick={onVolver}>❮</button>
                        <div>
                            <h1 style={s.headerH1}>Mis Donaciones</h1>
                            <p style={s.headerP}>Consulta las comidas que has compartido</p>
                        </div>
                    </div>
                </div>

                <div style={s.contentNarrow}>
                    <h2 style={s.sectionTitleText}>Donaciones Recientes</h2>

                    {donaciones.length === 0 ? (
                        <div style={s.extra}>
                            <div style={{ fontSize: '48px' }}>🍣</div>
                            <h3 style={s.extraH3}>¿Deseas compartir más comida?</h3>
                            <p style={s.extraP}>Cada donación puede ayudar muchísimo a personas que necesitan apoyo alimenticio.</p>
                            <Link to="/donaciones" style={{ textDecoration: 'none' }}>
                                <button style={s.btnExtra}>Crear nueva donación</button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {donaciones.map(d => {
                                const est = getEstado(d.estado);
                                return (
                                    <div key={d.id} style={s.donCard}>
                                        {(d.imagen || d.fotoUrl) && (
                                            <img src={d.imagen || d.fotoUrl} alt={d.titulo || d.nombre} style={s.donCardImg} />
                                        )}
                                        <div style={s.donCardBody}>
                                            <span style={{ ...s.estadoBadge, background: est.bg, color: est.color }}>{est.label}</span>
                                            <h3 style={s.donCardH3}>{d.titulo || d.nombre}</h3>
                                            <p style={s.donCardFecha}>{d.fecha || '—'}</p>
                                            <p style={s.donCardUbic}>📍 {d.ubicacion}</p>
                                            <div style={s.donFooter}>
                                                <button style={s.btnEliminar} onClick={() => onEliminar(d.id)}>🗑️ Eliminar</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={s.extra}>
                                <div style={{ fontSize: '48px' }}>🍣</div>
                                <h3 style={s.extraH3}>¿Deseas compartir más comida?</h3>
                                <p style={s.extraP}>Cada donación puede ayudar muchísimo a personas que necesitan apoyo alimenticio.</p>
                                <Link to="/donaciones" style={{ textDecoration: 'none' }}>
                                    <button style={s.btnExtra}>Crear nueva donación</button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <Nav 
    pestana="mis-donaciones" 
    setPestana={(tab) => {
        if (tab === 'inicio') onVolver();
    }} 
/>
        </div>
    );
}


/* ─────────────────────────────────────────
   PERFIL DONANTE
───────────────────────────────────────── */
function PerfilDonante({ userData, uid, donacionesCount, donacionesActivas, onVolver, onCerrarSesion }) {
    return (
        <div style={s.page}>
            <div style={s.appNarrow}>
                <div style={s.headerNarrow}>
                    <div style={s.headerTopRow}>
                        <h1 style={s.headerH1}>Mi perfil</h1>
                        <span style={{ fontSize: '22px', cursor: 'pointer' }}>⚙️</span>
                    </div>
                </div>

                <div style={{ ...s.contentNarrow, marginTop: '-65px', position: 'relative', zIndex: 2 }}>
                    <div style={s.cardPerfil}>
                        <div style={s.fotoPerfilBox}>
                            <img src="https://cdn-icons-png.flaticon.com/512/6997/6997662.png" alt="foto" style={s.fotoPerfil} />
                            <div style={s.cameraBtn}>📷</div>
                        </div>
                        <h2 style={s.perfilNombre}>{userData?.nombre}</h2>
                        <p style={s.perfilCorreo}>{userData?.correo}</p>
                        <div style={s.perfilBadge}>Donador activo</div>

                        <div style={s.perfilStats}>
                            <div style={s.perfilStat}>
                                <h3 style={s.perfilStatNum}>{donacionesCount}</h3>
                                <p style={s.perfilStatLabel}>Donaciones realizadas</p>
                            </div>
                            <div style={s.perfilStat}>
                                <h3 style={s.perfilStatNum}>{donacionesActivas}</h3>
                                <p style={s.perfilStatLabel}>Donaciones activas</p>
                            </div>
                        </div>

                        <div style={s.opciones}>
                            {[
                                { icon: '👤', titulo: 'Información personal', desc: 'Edita tus datos y contraseña' },
                                { icon: '📍', titulo: 'Dirección', desc: 'Gestiona tu ubicación' },
                                { icon: '📞', titulo: 'Contacto', desc: 'Número y correo' },
                                { icon: '❓', titulo: 'Ayuda y soporte', desc: 'Contáctanos' },
                            ].map((op, i) => (
                                <div key={i} style={s.opcionItem}>
                                    <div style={s.opcionLeft}>
                                        <div style={s.opcionIcon}>{op.icon}</div>
                                        <div>
                                            <h4 style={s.opcionH4}>{op.titulo}</h4>
                                            <p style={s.opcionP}>{op.desc}</p>
                                        </div>
                                    </div>
                                    <span style={{ color: '#999', fontSize: '20px' }}>›</span>
                                </div>
                            ))}
                        </div>

                        <div style={s.perfilBotones}>
                            <button style={s.btnEditar}>Editar perfil</button>
                            <button style={s.btnCerrar} onClick={onCerrarSesion}>Cerrar sesión</button>
                        </div>
                    </div>
                </div>
            </div>
            <Nav 
    pestana="perfil" 
    setPestana={(tab) => {
        if (tab === 'inicio') onVolver();
    }} 
/>
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
                { key: 'solicitudes', icon: '🔔', label: 'Solicitudes' },
                { key: 'mis-donaciones', icon: '🍱', label: 'Mis donaciones' },
                { key: 'perfil', icon: '👤', label: 'Perfil' },
            ].map(item => (
                <div key={item.key} style={{
                    ...s.navItem,
                    color: pestana === item.key ? '#016d3b' : '#888',
                    fontWeight: pestana === item.key ? 'bold' : 'normal'
                }} onClick={() => setPestana(item.key)}>
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
    page: { background: 'linear-gradient(135deg,#eef2f7,#dfe7f3)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px', paddingBottom: '110px', fontFamily: 'Arial, Helvetica, sans-serif', boxSizing: 'border-box' },
    loading: { textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#016d3b' },
    container: { width: '100%', maxWidth: '1000px', background: 'white', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 18px 45px rgba(0,0,0,0.15)' },
    header: { background: 'linear-gradient(135deg,#003d24,#016d3b)', padding: '22px', position: 'relative', overflow: 'hidden', color: 'white' },
    headerBefore: { position: 'absolute', width: '180px', height: '180px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', top: '-70px', right: '-40px' },
    headerAfter: { position: 'absolute', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', bottom: '-50px', left: '-30px' },
    headerContent: { position: 'relative', zIndex: 2 },
    userRow: { display: 'flex', alignItems: 'center', gap: '16px' },
    foto: { width: '78px', height: '78px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', flexShrink: 0 },
    saludo: { fontSize: '26px', fontWeight: 800, margin: 0 },
    saludoSub: { fontSize: '14px', color: '#d6ffe4', marginTop: '5px', lineHeight: 1.5 },
    content: { padding: '18px', background: '#f8fafc' },

    alertaSolicitudes: { background: '#fff8e8', border: '1px solid #ffe0a0', borderRadius: '20px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,180,0,0.12)' },

    hero: { background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', marginBottom: '22px', overflow: 'hidden' },
    heroLeft: { flex: 1 },
    heroH2: { fontSize: '24px', color: '#222', marginBottom: '10px', lineHeight: 1.2 },
    heroP: { color: '#666', lineHeight: 1.6, fontSize: '14px', marginBottom: '18px' },
    heroBtn: { padding: '14px 22px', border: 'none', borderRadius: '18px', background: 'linear-gradient(to right,#015e36,#018b50)', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
    heroImg: { width: '115px', height: 'auto', flexShrink: 0, objectFit: 'contain' },

    sectionTitle: { marginBottom: '14px', marginTop: '8px' },
    sectionH3: { fontSize: '22px', color: '#222' },
    stats: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '24px' },
    statBig: { background: 'white', borderRadius: '24px', padding: '22px', boxShadow: '0 6px 20px rgba(0,0,0,0.07)' },
    statBigTop: { display: 'flex', alignItems: 'center', gap: '16px' },
    bigIcon: { width: '65px', height: '65px', borderRadius: '20px', background: '#e6fff0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', flexShrink: 0 },
    statBigNum: { fontSize: '38px', color: '#222', lineHeight: 1, marginBottom: '6px' },
    statBigLabel: { fontSize: '15px', color: '#666' },
    statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    statSmall: { background: 'white', padding: '18px', borderRadius: '22px', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' },
    smallIcon: { fontSize: '28px', marginBottom: '10px' },
    statSmallNum: { fontSize: '26px', color: '#222', marginBottom: '4px' },
    statSmallLabel: { fontSize: '13px', color: '#666', lineHeight: 1.5 },

    card: { background: 'white', borderRadius: '24px', padding: '18px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', display: 'flex', gap: '16px', alignItems: 'center' },
    cardImg: { width: '120px', height: '100px', borderRadius: '18px', objectFit: 'cover', flexShrink: 0 },
    cardInfo: { flex: 1 },
    estadoBadge: { display: 'inline-block', padding: '7px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' },
    cardH4: { fontSize: '20px', color: '#222', marginBottom: '8px' },
    cardMeta: { fontSize: '14px', color: '#666', lineHeight: 1.6 },
    sinDatos: { textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '14px' },

    appNarrow: { width: '100%', maxWidth: '430px', background: 'white', borderRadius: '34px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.12)' },
    headerNarrow: { background: 'linear-gradient(135deg,#0d5c36,#0a7b45)', padding: '24px', color: 'white' },
    headerTopRow: { display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'space-between' },
    backBtn: { width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.18)', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '20px', color: 'white', flexShrink: 0 },
    headerH1: { fontSize: '28px', fontWeight: 800, color: 'white', margin: 0 },
    headerP: { marginTop: '5px', fontSize: '14px', color: '#d7ffe8', lineHeight: 1.4 },
    contentNarrow: { padding: '22px' },
    sectionTitleText: { fontSize: '24px', fontWeight: 800, color: '#222', marginBottom: '18px' },

    donCard: { background: 'white', border: '1px solid #ececec', borderRadius: '24px', overflow: 'hidden', marginBottom: '18px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' },
    donCardImg: { width: '100%', height: '190px', objectFit: 'cover' },
    donCardBody: { padding: '18px' },
    donCardH3: { fontSize: '22px', color: '#222', marginBottom: '10px', marginTop: '8px' },
    donCardFecha: { color: '#777', fontSize: '14px', marginBottom: '8px' },
    donCardUbic: { color: '#555', fontSize: '14px', lineHeight: 1.5 },
    donFooter: { marginTop: '18px', display: 'flex', gap: '12px' },
    btnEliminar: { flex: 1, padding: '12px', border: 'none', borderRadius: '16px', background: '#fff0f0', color: '#d60000', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },

    extra: { marginTop: '10px', background: '#f7f9fb', borderRadius: '24px', padding: '24px', textAlign: 'center', border: '1px solid #ededed' },
    extraH3: { marginTop: '14px', fontSize: '22px', color: '#222' },
    extraP: { marginTop: '10px', color: '#666', lineHeight: 1.6, fontSize: '14px' },
    btnExtra: { marginTop: '20px', width: '100%', border: 'none', padding: '15px', borderRadius: '16px', background: 'linear-gradient(to right,#0d5c36,#0b8a4d)', color: 'white', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },

    cardPerfil: { background: 'white', borderRadius: '28px', padding: '25px 20px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', textAlign: 'center' },
    fotoPerfilBox: { position: 'relative', width: '110px', margin: 'auto' },
    fotoPerfil: { width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '5px solid white', boxShadow: '0 5px 18px rgba(0,0,0,0.15)' },
    cameraBtn: { position: 'absolute', bottom: '4px', right: '2px', width: '34px', height: '34px', borderRadius: '50%', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', fontSize: '16px', cursor: 'pointer' },
    perfilNombre: { marginTop: '18px', fontSize: '26px', color: '#222' },
    perfilCorreo: { marginTop: '6px', color: '#777', fontSize: '14px' },
    perfilBadge: { marginTop: '14px', display: 'inline-block', background: '#dff7e8', color: '#0b7b40', padding: '9px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 'bold' },
    perfilStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '22px' },
    perfilStat: { background: '#f8faf9', borderRadius: '20px', padding: '18px', textAlign: 'center', border: '1px solid #ebebeb' },
    perfilStatNum: { color: '#0b7b40', fontSize: '28px' },
    perfilStatLabel: { marginTop: '5px', color: '#666', fontSize: '13px' },
    opciones: { marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '14px' },
    opcionItem: { background: 'white', borderRadius: '20px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', cursor: 'pointer' },
    opcionLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
    opcionIcon: { width: '45px', height: '45px', borderRadius: '14px', background: '#eef8f1', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px' },
    opcionH4: { fontSize: '15px', color: '#222', margin: 0 },
    opcionP: { marginTop: '3px', fontSize: '12px', color: '#777' },
    perfilBotones: { marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '14px' },
    btnEditar: { width: '100%', border: 'none', borderRadius: '18px', padding: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', background: 'linear-gradient(to right,#0b6b37,#0f8c4b)', color: 'white' },
    btnCerrar: { width: '100%', background: 'white', color: '#e53935', border: '2px solid #f0d6d6', borderRadius: '18px', padding: '16px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },

    // Solicitudes recibidas
    solicitudCard: { background: 'white', border: '1px solid #ececec', borderRadius: '24px', padding: '20px', marginBottom: '18px', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' },
    solicitudHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
    solicitudIcono: { width: '46px', height: '46px', borderRadius: '50%', background: '#eef8f1', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px', flexShrink: 0 },
    solicitudBadge: { background: '#fff3d9', color: '#d38a00', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
    solicitudInfo: { background: '#f8fafb', borderRadius: '14px', padding: '12px 14px', marginBottom: '10px' },
    infoLabelSol: { display: 'block', fontSize: '11px', color: '#999', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    motivoBox: { background: '#f5f5f5', borderRadius: '14px', padding: '14px', marginBottom: '16px' },
    solicitudBotones: { display: 'flex', gap: '12px' },
    btnAceptarSol: { flex: 1, padding: '13px', border: 'none', borderRadius: '14px', background: 'linear-gradient(to right,#0d5c36,#0b8a4d)', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
    btnRechazarSol: { flex: 1, padding: '13px', border: 'none', borderRadius: '14px', background: '#fff0f0', color: '#d60000', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },

    nav: {
    position: 'fixed',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',

    width: '92%',
    maxWidth: '420px',
    minWidth: '280px',

    background: 'rgba(255,255,255,0.94)',
    backdropFilter: 'blur(18px)',

    borderRadius: '26px',
    padding: '14px 10px',

    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',

    boxShadow: '0 10px 30px rgba(0,0,0,0.10)',
    border: '1px solid rgba(255,255,255,0.7)',

    zIndex: 9999,
    boxSizing: 'border-box',

    overflow: 'hidden',
},
navItem: {
    flex: 1,
    textAlign: 'center',
    fontSize: '11px',
    cursor: 'pointer',
    transition: '0.2s',
    padding: '6px 2px',

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',

    minWidth: 0,
},
navIcon: {
    display: 'block',
    fontSize: '23px',
    marginBottom: '4px',
},
};

export default DashboardDonante;