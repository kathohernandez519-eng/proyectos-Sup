import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/conifg';
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import logo from '../assets/logo.png';

function RegistroRepartidor() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [telefono, setTelefono] = useState('');
    const [vehiculo, setVehiculo] = useState('');
    const [placa, setPlaca] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 480);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 480);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const manejarRegistroRepartidor = async () => {
        if (!nombre.trim() || !email.trim() || !pass.trim() || !telefono.trim() || !vehiculo || !placa.trim()) {
            alert("Por favor completa todos los campos");
            return;
        }

        setLoading(true);

        try {
            const credencial = await createUserWithEmailAndPassword(auth, email, pass);
            const user = credencial.user;

            await setDoc(doc(db, "usuarios", user.uid), {
                uid: user.uid,
                nombre: nombre.trim(),
                correo: email.toLowerCase().trim(),
                telefono: telefono.trim(),
                rol: "repartidor",
                vehiculo,
                placa: placa.toUpperCase().trim(),
                fecha_registro: new Date(),
                estado: "pendiente"
            });

            alert("¡Registro de repartidor exitoso! Tu cuenta será revisada.");
            navigate('/index');

        } catch (error) {
            console.error("Error:", error);
            if (error.code === 'auth/weak-password') alert("La contraseña debe tener al menos 6 caracteres.");
            else if (error.code === 'auth/email-already-in-use') alert("Este correo ya está registrado.");
            else if (error.code === 'auth/invalid-email') alert("El correo no es válido.");
            else alert("Error al registrar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.fullPageBackground}>
            <div style={{
                ...styles.whiteCard,
                padding: isMobile ? '40px 20px' : '50px 40px',
                width: isMobile ? '90%' : '460px'
            }}>

                {/* LOGO */}
                <div style={styles.logoContainer}>
                    <img src={logo} alt="Logo BiteX" style={styles.logo} />
                </div>

                <h1 style={{ ...styles.title, fontSize: isMobile ? '22px' : '28px' }}>
                    Registro de Repartidor
                </h1>
                <div style={styles.underline}></div>

                {/* NOMBRE */}
                <div style={styles.inputWrapper}>
                    <label style={styles.floatingLabel}>Nombre completo</label>
                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Tu nombre completo"
                        style={styles.input}
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>

                {/* CORREO */}
                <div style={styles.inputWrapper}>
                    <label style={styles.floatingLabel}>Correo electrónico</label>
                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                    </div>
                    <input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        style={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/* CONTRASEÑA */}
                <div style={styles.inputWrapper}>
                    <label style={styles.floatingLabel}>Contraseña</label>
                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            <circle cx="12" cy="16" r="1"></circle>
                        </svg>
                    </div>
                    <input
                        type="password"
                        placeholder="••••••••"
                        style={styles.input}
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                    />
                </div>

                {/* TELÉFONO */}
                <div style={styles.inputWrapper}>
                    <label style={styles.floatingLabel}>Teléfono</label>
                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                    </div>
                    <input
                        type="tel"
                        placeholder="+503 7000-0000"
                        style={styles.input}
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                    />
                </div>

                {/* VEHÍCULO */}
                <div style={styles.inputWrapper}>
                    <label style={styles.floatingLabel}>Tipo de vehículo</label>
                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" rx="2"></rect>
                            <path d="M16 8h4l3 5v3h-7V8z"></path>
                            <circle cx="5.5" cy="18.5" r="2.5"></circle>
                            <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                    </div>
                    <select
                        style={styles.select}
                        value={vehiculo}
                        onChange={(e) => setVehiculo(e.target.value)}
                    >
                        <option value="" disabled>Selecciona vehículo</option>
                        <option value="bicicleta">Bicicleta</option>
                        <option value="motocicleta">Motocicleta</option>
                        <option value="auto">Automóvil</option>
                        <option value="camion">Camión</option>
                    </select>
                </div>

                {/* PLACA */}
                <div style={styles.inputWrapper}>
                    <label style={styles.floatingLabel}>Placa / Identificador</label>
                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2"></rect>
                            <path d="M16 3h-8l-2 4h12l-2-4z"></path>
                            <circle cx="12" cy="14" r="2"></circle>
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="ABC-1234 o ID bicicleta"
                        style={styles.input}
                        value={placa}
                        onChange={(e) => setPlaca(e.target.value)}
                    />
                </div>

                <button
                    style={styles.btnSubmit}
                    onClick={manejarRegistroRepartidor}
                    disabled={loading}
                >
                    {loading ? "Registrando..." : "Registrarme como Repartidor"}
                </button>

                <div style={styles.dividerContainer}>
                    <div style={styles.line}></div>
                    <span style={styles.dividerText}>¿Cambiaste de idea?</span>
                    <div style={styles.line}></div>
                </div>

                <div style={styles.registerLinkContainer} onClick={() => navigate('/registro')}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#101828" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    <span style={styles.registerText}>Volver al registro</span>
                </div>

            </div>
        </div>
    );
}

const styles = {
    fullPageBackground: {
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(180deg, #d3eab4 0%, #ffffff 100%)',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        margin: 0,
        padding: '20px',
        boxSizing: 'border-box',
    },
    whiteCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: '28px',
        boxSizing: 'border-box',
        textAlign: 'center',
        boxShadow: '0 15px 40px rgba(0,0,0,0.08)',
    },
    logoContainer: { marginBottom: '15px', display: 'flex', justifyContent: 'center' },
    logo: { width: '80px', height: 'auto' },
    title: { color: '#111827', margin: '0 0 10px 0', fontWeight: '600' },
    underline: {
        width: '30px', height: '3px', backgroundColor: '#168a32',
        margin: '0 auto 36px auto', borderRadius: '10px',
    },
    inputWrapper: { position: 'relative', marginBottom: '28px', width: '100%' },
    floatingLabel: {
        position: 'absolute', top: '-10px', left: '15px',
        backgroundColor: '#fff', padding: '0 8px',
        color: '#168a32', fontSize: '13px', fontWeight: 'bold', zIndex: 2,
    },
    iconContainer: {
        position: 'absolute', top: '50%', left: '18px',
        transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', zIndex: 1,
    },
    input: {
        width: '100%', boxSizing: 'border-box',
        padding: '18px 18px 18px 52px',
        borderRadius: '14px', border: '1px solid #d1d5db',
        backgroundColor: '#ffffff', fontSize: '16px', outline: 'none', color: '#333',
    },
    select: {
        width: '100%', boxSizing: 'border-box',
        padding: '18px 18px 18px 52px',
        borderRadius: '14px', border: '1px solid #d1d5db',
        backgroundColor: '#ffffff', fontSize: '16px', outline: 'none', color: '#555',
        appearance: 'none', cursor: 'pointer',
    },
    btnSubmit: {
        backgroundColor: '#ff5a00', color: 'white', width: '100%',
        padding: '18px', borderRadius: '14px', border: 'none',
        fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
        marginTop: '10px', boxShadow: '0 6px 20px rgba(255, 90, 0, 0.25)',
    },
    dividerContainer: { display: 'flex', alignItems: 'center', margin: '35px 0 25px 0' },
    line: { flex: 1, height: '1px', backgroundColor: '#e5e7eb' },
    dividerText: { margin: '0 15px', color: '#6b7280', fontSize: '14px', fontWeight: '500' },
    registerLinkContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    registerText: { color: '#168a32', fontWeight: '800', fontSize: '20px' },
};

export default RegistroRepartidor;