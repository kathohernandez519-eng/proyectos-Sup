import React, { useState } from 'react';
import { db, auth } from '../firebase/conifg';
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

function CrearDonaciones() {
    const [nombre, setNombre] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [fecha, setFecha] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [disponibleHasta, setDisponibleHasta] = useState('');
    const [metodos, setMetodos] = useState({ bicicleta: false, moto: false, carro: false, camion: false });
    const [cargando, setCargando] = useState(false);
    const [imagenArchivo, setImagenArchivo] = useState(null);
    const [previsualizacion, setPrevisualizacion] = useState(null);
    const [coordenadas, setCoordenadas] = useState(null);

    const navigate = useNavigate();

    const seleccionarArchivo = (e) => {
        const archivo = e.target.files[0];
        if (archivo) {
            setImagenArchivo(archivo);
            setPrevisualizacion(URL.createObjectURL(archivo));
        }
    };

    const toggleMetodo = (key) => setMetodos(prev => ({ ...prev, [key]: !prev[key] }));

    const obtenerUbicacionActual = () => {
        if (!navigator.geolocation) return alert("Tu navegador no soporta geolocalización");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoordenadas({ lat: position.coords.latitude, lng: position.coords.longitude });
                alert("✅ Ubicación obtenida correctamente");
            },
            () => alert("No se pudo obtener la ubicación. Activa el GPS.")
        );
    };

    const manejarPublicacion = async () => {
        if (!nombre || !cantidad || !ubicacion) {
            return alert("Por favor completa los campos obligatorios.");
        }
        setCargando(true);
        try {
            let urlImagen = "https://via.placeholder.com/400x220?text=Sin+Foto";

            if (imagenArchivo) {
                const formData = new FormData();
                formData.append('image', imagenArchivo);
                const response = await fetch('https://api.imgbb.com/1/upload?key=6f2c8c4e2f2e1b8e5c8f9d7e6a5b4c3d', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success) urlImagen = data.data.url;
            }

            const user = auth.currentUser;

            await addDoc(collection(db, "donaciones"), {
                titulo: nombre.trim(),
                nombre: nombre.trim(),
                cantidad: cantidad.trim(),
                fecha: fecha || new Date().toISOString().split('T')[0],
                ubicacion: ubicacion.trim(),
                descripcion: descripcion.trim(),
                disponibleHasta: disponibleHasta || 'Sin límite',
                fotoUrl: urlImagen,
                imagen: urlImagen,
                donador: user?.displayName || user?.email || 'Donante anónimo',
                donadorId: user?.uid || '',
                metodos,
                distancia: '—',
                estado: "disponible",
                fecha_creacion: new Date(),
                coordenadas: coordenadas || null,
                lat: coordenadas?.lat || null,
                lng: coordenadas?.lng || null,
            });

            alert("¡Donación publicada con éxito!");
            navigate('/dashboardona');
        } catch (error) {
            console.error("Error:", error);
            alert("Error al publicar la donación.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={s.page}>
            <div style={s.app}>

                {/* HEADER */}
                <div style={s.header}>
                    <div style={s.headerTop}>
                        <button style={s.backBtn} onClick={() => navigate('/dashboardona')}>❮</button>
                        <div>
                            <h1 style={s.headerH1}>Crear Donación</h1>
                            <p style={s.headerP}>Comparte comida con quienes más lo necesitan</p>
                        </div>
                    </div>
                </div>

                {/* CONTENIDO */}
                <div style={s.content}>

                    {/* FOTO */}
                    <div style={s.section}>
                        <h2 style={s.sectionH2}>Imagen de la donación</h2>
                        <input
                            type="file"
                            id="file-input"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={seleccionarArchivo}
                        />
                        <label htmlFor="file-input" style={s.uploadBox}>
                            {previsualizacion ? (
                                <img src={previsualizacion} alt="preview" style={s.uploadPreview} />
                            ) : (
                                <div style={s.uploadPlaceholder}>
                                    <span style={s.emoji}>🍣</span>
                                    <h3 style={s.uploadH3}>Subir fotografía</h3>
                                    <p style={s.uploadP}>Agrega una imagen clara de la comida que deseas compartir.</p>
                                    <span style={s.uploadBtn}>Seleccionar imagen</span>
                                </div>
                            )}
                        </label>
                        {previsualizacion && (
                            <label htmlFor="file-input" style={s.cambiarFoto}>
                                Cambiar foto
                            </label>
                        )}
                    </div>

                    {/* INFO PRINCIPAL */}
                    <div style={s.section}>
                        <h2 style={s.sectionH2}>Información principal</h2>

                        <label style={s.label}>Título *</label>
                        <input
                            style={s.input}
                            type="text"
                            placeholder="Ejemplo: Comida casera"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                        />

                        <label style={s.label}>Descripción</label>
                        <textarea
                            style={s.textarea}
                            placeholder="Describe brevemente la comida, ingredientes o detalles importantes."
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                        />

                        <label style={s.label}>Cantidad aproximada *</label>
                        <input
                            style={s.input}
                            type="text"
                            placeholder="Ejemplo: 5 platos"
                            value={cantidad}
                            onChange={e => setCantidad(e.target.value)}
                        />
                    </div>

                    {/* UBICACIÓN */}
                    <div style={s.section}>
                        <h2 style={s.sectionH2}>Ubicación y disponibilidad</h2>

                        <label style={s.label}>Dirección *</label>
                        <input
                            style={s.input}
                            type="text"
                            placeholder="Ej: Colonia Escalón, San Salvador"
                            value={ubicacion}
                            onChange={e => setUbicacion(e.target.value)}
                        />

                        <button onClick={obtenerUbicacionActual} style={s.locationBtn}>
                            📍 Usar mi ubicación actual
                        </button>

                        {coordenadas && (
                            <p style={s.locationSuccess}>✅ Ubicación GPS guardada correctamente</p>
                        )}

                        <label style={s.label}>Disponible hasta</label>
                        <input
                            style={s.input}
                            type="text"
                            placeholder="Ej: 7:30 PM"
                            value={disponibleHasta}
                            onChange={e => setDisponibleHasta(e.target.value)}
                        />

                        <label style={s.label}>Fecha</label>
                        <input
                            style={{ ...s.input, marginBottom: 0 }}
                            type="date"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                        />
                    </div>

                    {/* MÉTODOS */}
                    <div style={s.section}>
                        <h2 style={s.sectionH2}>Métodos de entrega</h2>
                        <p style={s.infoText}>
                            Selecciona los métodos disponibles según la cantidad y tipo de comida que donarás.
                        </p>

                        <div style={s.metodosGrid}>
                            {[
                                { key: 'bicicleta', emoji: '🚲', label: 'Bicicleta' },
                                { key: 'moto', emoji: '🏍️', label: 'Moto' },
                                { key: 'carro', emoji: '🚗', label: 'Carro' },
                                { key: 'camion', emoji: '🚚', label: 'Camión' },
                            ].map(m => (
                                <div
                                    key={m.key}
                                    style={{ ...s.metodo, ...(metodos[m.key] ? s.metodoActivo : {}) }}
                                    onClick={() => toggleMetodo(m.key)}
                                >
                                    <span style={s.metodoEmoji}>{m.emoji}</span>
                                    <h4 style={s.metodoLabel}>{m.label}</h4>
                                </div>
                            ))}
                        </div>

                        <button
                            style={{ ...s.btnPublicar, opacity: cargando ? 0.75 : 1 }}
                            onClick={manejarPublicacion}
                            disabled={cargando}
                        >
                            {cargando ? "Publicando..." : "Publicar donación"}
                        </button>
                    </div>

                </div>
            </div>

            {/* NAV */}
            <div style={s.nav}>
                <div style={s.navItem} onClick={() => navigate('/dashboardona')}>
                    <span style={s.navIcon}>🏠</span>Inicio
                </div>
                <div style={{ ...s.navItem, color: '#016d3b', fontWeight: 'bold' }}>
                    <span style={s.navIcon}>➕</span>Donar
                </div>
                <div style={s.navItem} onClick={() => navigate('/dashboardona')}>
                    <span style={s.navIcon}>🍱</span>Mis donaciones
                </div>
                <div style={s.navItem} onClick={() => navigate('/dashboardona')}>
                    <span style={s.navIcon}>👤</span>Perfil
                </div>
            </div>
        </div>
    );
}

const s = {
    page: {
        background: '#eef2f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '18px',
        paddingBottom: '120px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        boxSizing: 'border-box',
    },
    app: {
        width: '100%',
        maxWidth: '430px',
        background: 'white',
        borderRadius: '34px',
        overflow: 'hidden',
        boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
    },

    // Header
    header: {
        background: 'linear-gradient(135deg,#0d5c36,#0a7b45)',
        padding: '24px',
        color: 'white',
    },
    headerTop: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    backBtn: {
        width: '40px',
        height: '40px',
        minWidth: '40px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.18)',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerH1: { fontSize: '24px', fontWeight: 800, margin: 0 },
    headerP: { marginTop: '4px', fontSize: '13px', color: '#d7ffe8', margin: '4px 0 0' },

    // Contenido
    content: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },

    // Secciones
    section: {
        background: '#f8fafb',
        borderRadius: '22px',
        padding: '20px',
        border: '1px solid #ececec',
    },
    sectionH2: { fontSize: '18px', color: '#222', marginBottom: '16px', marginTop: 0 },

    // Upload foto
    uploadBox: {
        display: 'block',
        border: '2px dashed #d9d9d9',
        borderRadius: '18px',
        overflow: 'hidden',
        background: 'white',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    uploadPlaceholder: {
        padding: '30px 20px',
        textAlign: 'center',
    },
    uploadPreview: {
        width: '100%',
        height: '180px',
        objectFit: 'cover',
        display: 'block',
    },
    emoji: { fontSize: '48px', display: 'block' },
    uploadH3: { marginTop: '10px', fontSize: '18px', color: '#222' },
    uploadP: { marginTop: '6px', color: '#888', fontSize: '13px', lineHeight: 1.5 },
    uploadBtn: {
        display: 'inline-block',
        marginTop: '14px',
        background: '#0c7b45',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '14px',
        fontSize: '13px',
        fontWeight: 'bold',
    },
    cambiarFoto: {
        display: 'block',
        textAlign: 'center',
        marginTop: '10px',
        color: '#016d3b',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '13px',
    },

    // Inputs
    label: {
        display: 'block',
        marginBottom: '7px',
        marginTop: '0',
        color: '#333',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    input: {
        width: '100%',
        padding: '13px 14px',
        border: '1px solid #e3e3e3',
        borderRadius: '14px',
        marginBottom: '14px',
        outline: 'none',
        fontSize: '14px',
        color: '#333',
        background: 'white',
        boxSizing: 'border-box',
    },
    textarea: {
        width: '100%',
        padding: '13px 14px',
        border: '1px solid #e3e3e3',
        borderRadius: '14px',
        marginBottom: '14px',
        outline: 'none',
        fontSize: '14px',
        color: '#333',
        background: 'white',
        boxSizing: 'border-box',
        height: '100px',
        resize: 'none', // ← sin resize
    },

    // Ubicación
    locationBtn: {
        width: '100%',
        padding: '14px',
        background: '#0c7b45',
        color: 'white',
        border: 'none',
        borderRadius: '999px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px',
        marginBottom: '14px',
        boxSizing: 'border-box',
    },
    locationSuccess: {
        color: '#0c7b45',
        textAlign: 'center',
        fontSize: '13px',
        margin: '0 0 14px 0',
    },

    // Info text
    infoText: {
        fontSize: '13px',
        color: '#777',
        lineHeight: 1.5,
        marginBottom: '16px',
        marginTop: 0,
    },

    // Métodos
    metodosGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '18px',
    },
    metodo: {
    background: 'white',
    border: '2px solid transparent',
    borderRadius: '16px',
    padding: '16px 12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: '0.2s',
},
    metodoActivo: {
    border: '2px solid #0c7b45',
    background: '#effbf4',
    boxShadow: '0 4px 12px rgba(12,123,69,0.18)',
},
    metodoEmoji: { display: 'block', fontSize: '30px', marginBottom: '8px' },
    metodoLabel: { color: '#222', fontSize: '14px', margin: 0 },

    // Botón publicar
    btnPublicar: {
        width: '100%',
        padding: '16px',
        borderRadius: '16px',
        background: 'linear-gradient(to right,#0d5c36,#0b8a4d)',
        color: 'white',
        fontSize: '15px',
        fontWeight: 'bold',
        border: 'none',
        cursor: 'pointer',
        boxSizing: 'border-box',
    },

    // Nav
   nav: {
    position: 'fixed',
    bottom: '18px',
    left: '50%',
    transform: 'translateX(-50%)',

    width: '100%',
    maxWidth: '420px',

    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(14px)',

    borderRadius: '26px',
    padding: '12px 8px',

    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',

    boxShadow: '0 10px 30px rgba(0,0,0,0.10)',
    border: '1px solid rgba(255,255,255,0.6)',

    zIndex: 999,
    boxSizing: 'border-box',
},
navItem: {
    flex: 1,
    textAlign: 'center',
    fontSize: '11px',
    cursor: 'pointer',
    transition: '0.2s',
    padding: '4px 0',
    color: '#888',
},
navIcon: {
    display: 'block',
    fontSize: '22px',
    marginBottom: '4px',
},

};

export default CrearDonaciones;