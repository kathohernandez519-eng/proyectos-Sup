import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/conifg';
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

function Registro() {

    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [dui, setDui] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [rol, setRol] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 480);

    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 480);

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (rol === 'repartidor') {
            navigate('/registrorepartidor', { replace: true });
        }
    }, [rol, navigate]);

    const handleClick = () => {

        if (rol === 'repartidor') return;

        if (
            !nombre.trim() ||
            !apellidos.trim() ||
            !dui.trim() ||
            !fechaNacimiento ||
            !telefono.trim() ||
            !direccion.trim() ||
            !email.trim() ||
            !pass.trim() ||
            !rol
        ) {
            alert("Por favor completa todos los campos");
            return;
        }

        setLoading(true);

        createUserWithEmailAndPassword(auth, email, pass)

            .then((credencial) => {

                const user = credencial.user;

                return setDoc(doc(db, "usuarios", user.uid), {
                    uid: user.uid,
                    nombre: nombre.trim(),
                    apellidos: apellidos.trim(),
                    dui: dui.trim(),
                    fecha_nacimiento: fechaNacimiento,
                    telefono: telefono.trim(),
                    direccion: direccion.trim(),
                    correo: email.toLowerCase().trim(),
                    rol,
                    fecha_registro: new Date()
                });
            })

            .then(() => {
                alert("¡Cuenta creada con éxito en BiteX!");
                navigate('/index');
            })

            .catch((error) => {

                console.error("Error al registrar:", error);

                if (error.code === 'auth/weak-password') {
                    alert("La contraseña debe tener al menos 6 caracteres.");

                } else if (error.code === 'auth/email-already-in-use') {
                    alert("Este correo ya está en uso.");

                } else if (error.code === 'auth/invalid-email') {
                    alert("El correo electrónico no es válido.");

                } else {
                    alert("Error: " + error.message);
                }
            })

            .finally(() => {
                setLoading(false);
            });
    };

    return (

        <div style={styles.fullPageBackground}>

            <div style={{
                ...styles.whiteCard,
                padding: isMobile ? '40px 20px' : '50px 40px',
                width: isMobile ? '90%' : '440px'
            }}>

                {/* LOGO */}
                <div style={styles.logoContainer}>
                    <img src={logo} alt="Logo BiteX" style={styles.logo} />
                </div>

                <h1 style={{
                    ...styles.title,
                    fontSize: isMobile ? '24px' : '30px'
                }}>
                    Crear cuenta
                </h1>

                <div style={styles.underline}></div>

                {/* NOMBRES */}
                <div style={styles.inputWrapper}>

                    <label style={styles.floatingLabel}>
                        Nombres
                    </label>

                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>

                    <input
                        type="text"
                        placeholder="Tus nombres"
                        style={styles.input}
                        value={nombre}
                        onChange={(e) => {

                            const value = e.target.value.replace(
                                /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,
                                ''
                            );

                            setNombre(value);
                        }}
                    />

                </div>

                {/* APELLIDOS */}
                <div style={styles.inputWrapper}>

                    <label style={styles.floatingLabel}>
                        Apellidos
                    </label>

                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>

                    <input
                        type="text"
                        placeholder="Tus apellidos"
                        style={styles.input}
                        value={apellidos}
                        onChange={(e) => {

                            const value = e.target.value.replace(
                                /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,
                                ''
                            );

                            setApellidos(value);
                        }}
                    />

                </div>

                {/* DUI */}
                <div style={styles.inputWrapper}>

                    <label style={styles.floatingLabel}>
                        DUI
                    </label>

                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                            <line x1="7" y1="8" x2="17" y2="8"></line>
                            <line x1="7" y1="12" x2="13" y2="12"></line>
                        </svg>
                    </div>

                    <input
                        type="text"
                        placeholder="00000000-0"
                        style={styles.input}
                        maxLength={10}
                        value={dui}
                        onChange={(e) => {

                            let value = e.target.value.replace(/[^0-9]/g, '');

                            if (value.length > 8) {
                                value =
                                    value.slice(0, 8) +
                                    '-' +
                                    value.slice(8, 9);
                            }

                            setDui(value);
                        }}
                    />

                </div>

                {/* FECHA NACIMIENTO */}
                <div style={styles.inputWrapper}>

                    <label style={styles.floatingLabel}>
                        Fecha de nacimiento
                    </label>

                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>

                    <input
                        type="date"
                        style={styles.input}
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                    />

                </div>

                {/* TELÉFONO */}
                <div style={styles.inputWrapper}>

                    <label style={styles.floatingLabel}>
                        Número de teléfono
                    </label>

                    <div style={styles.iconContainer}>
                        <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#168a32"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 
    19.79 19.79 0 0 1-8.63-3.07 
    19.5 19.5 0 0 1-6-6 
    19.79 19.79 0 0 1-3.07-8.67
    A2 2 0 0 1 4.11 2h3
    a2 2 0 0 1 2 1.72
    c.12.9.32 1.78.59 2.62
    a2 2 0 0 1-.45 2.11L8.09 9.91
    a16 16 0 0 0 6 6
    l1.46-1.46
    a2 2 0 0 1 2.11-.45
    c.84.27 1.72.47 2.62.59
    A2 2 0 0 1 22 16.92z">
    </path>
</svg>
                    </div>

                    <input
                        type="text"
                        placeholder="0000-0000"
                        style={styles.input}
                        maxLength={9}
                        value={telefono}
                        onChange={(e) => {

                            let value = e.target.value.replace(/[^0-9]/g, '');

                            if (value.length > 4) {
                                value =
                                    value.slice(0, 4) +
                                    '-' +
                                    value.slice(4, 8);
                            }

                            setTelefono(value);
                        }}
                    />

                </div>

                {/* DIRECCIÓN */}
                <div style={styles.inputWrapper}>

                    <label style={styles.floatingLabel}>
                        Dirección
                    </label>

                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>

                    <input
                        type="text"
                        placeholder="Tu dirección"
                        style={styles.input}
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                    />

                </div>

                {/* CORREO */}
                <div style={styles.inputWrapper}>

                    <label style={styles.floatingLabel}>
                        Correo electrónico
                    </label>

                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2">
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

                    <label style={styles.floatingLabel}>
                        Contraseña
                    </label>

                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2"></rect>
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

                {/* ROL */}
                <div style={styles.inputWrapper}>

                    <label style={styles.floatingLabel}>
                        Tipo de usuario
                    </label>

                    <div style={styles.iconContainer}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#168a32" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                    </div>

                    <select
                        style={styles.select}
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                    >

                        <option value="" disabled>
                            Selecciona tu tipo de usuario
                        </option>

                        <option value="donante">
                            Donante
                        </option>

                        <option value="beneficiario">
                            Beneficiario
                        </option>

                        <option value="repartidor">
                            Repartidor
                        </option>

                    </select>

                </div>

                {rol === 'repartidor' && (

                    <div style={styles.repartidorNotice}>

                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14"></path>
                            <path d="m12 5 7 7-7 7"></path>
                        </svg>

                        Redirigiendo al formulario especial...

                    </div>
                )}

                <button
                    style={styles.btnSubmit}
                    onClick={handleClick}
                    disabled={loading || rol === 'repartidor'}
                >

                    {loading
                        ? "Creando cuenta..."
                        : rol === 'repartidor'
                            ? "Redirigiendo..."
                            : "Crear cuenta"}

                </button>

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

    logoContainer: {
        marginBottom: '15px',
        display: 'flex',
        justifyContent: 'center'
    },

    logo: {
        width: '80px',
        height: 'auto'
    },

    title: {
        color: '#111827',
        margin: '0 0 10px 0',
        fontWeight: '600'
    },

    underline: {
        width: '30px',
        height: '3px',
        backgroundColor: '#168a32',
        margin: '0 auto 36px auto',
        borderRadius: '10px',
    },

    inputWrapper: {
        position: 'relative',
        marginBottom: '28px',
        width: '100%'
    },

    floatingLabel: {
        position: 'absolute',
        top: '-10px',
        left: '15px',
        backgroundColor: '#fff',
        padding: '0 8px',
        color: '#168a32',
        fontSize: '13px',
        fontWeight: 'bold',
        zIndex: 2,
    },

    iconContainer: {
        position: 'absolute',
        top: '50%',
        left: '18px',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1,
    },

    input: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '18px 18px 18px 52px',
        borderRadius: '14px',
        border: '1px solid #d1d5db',
        backgroundColor: '#ffffff',
        fontSize: '16px',
        outline: 'none',
        color: '#333',
    },

    select: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '18px 18px 18px 52px',
        borderRadius: '14px',
        border: '1px solid #d1d5db',
        backgroundColor: '#ffffff',
        fontSize: '16px',
        outline: 'none',
        color: '#555',
        appearance: 'none',
        cursor: 'pointer',
    },

    repartidorNotice: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        backgroundColor: '#fff3e0',
        color: '#b84a00',
        borderRadius: '10px',
        padding: '9px 14px',
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '16px',
    },

    btnSubmit: {
        backgroundColor: '#ff5a00',
        color: 'white',
        width: '100%',
        padding: '18px',
        borderRadius: '14px',
        border: 'none',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        boxShadow: '0 6px 20px rgba(255, 90, 0, 0.25)',
        transition: 'all 0.3s ease'
    },
};

export default Registro;