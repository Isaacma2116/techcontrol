import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import type { SVGMotionProps } from 'framer-motion';
import { authService } from '../services/auth.service';

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function Login({ setIsAuthenticated }: LoginProps) {
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isRegisterHovered, setIsRegisterHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const controls = useAnimation();
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number}>>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Verificar si ya está autenticado por "Recordar contraseña"
    const checkAuth = () => {
      const shouldRemember = localStorage.getItem('rememberMe') === 'true';
      if (shouldRemember && authService.getToken()) {
        setIsAuthenticated(true);
      }
    };

    // Configuración inicial
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    checkAuth();
    window.addEventListener('resize', checkIfMobile);
    
    setParticles(
      Array.from({ length: isMobile ? 8 : 15 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (isMobile ? 3 : 4) + 1
      }))
    );
    controls.start('visible');
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [controls, isMobile, setIsAuthenticated]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get('email') as string;
    const contrasena = formData.get('password') as string;

    try {
      await controls.start({
        scale: [1, 0.95, 1],
        transition: { duration: 0.5 }
      });

      await authService.login(identifier, contrasena);

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login error:', err);
      setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const EyeIcon = (props: SVGMotionProps<SVGSVGElement>) => (
    <motion.svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
      whileHover={{ scale: 1.2 }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </motion.svg>
  );

  const EyeOffIcon = (props: SVGMotionProps<SVGSVGElement>) => (
    <motion.svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
      whileHover={{ scale: 1.2 }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </motion.svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2C2C2C] p-4 relative overflow-hidden">
      {/* Partículas flotantes de fondo (menos en móvil) */}
      <AnimatePresence>
        {!isMobile && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-[#FF6B00] bg-opacity-10"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              y: [0, -50],
              x: [0, Math.random() > 0.5 ? 20 : -20]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: Math.random() * 5
            }}
          />
        ))}
      </AnimatePresence>

      {/* Efecto de luz que sigue el cursor (solo en desktop) */}
      {!isMobile && (
        <motion.div
          className="fixed w-64 h-64 rounded-full bg-[#FF6B00] opacity-10 pointer-events-none z-0"
          animate={{
            x: isHovered ? '50%' : '0%',
            y: isHovered ? '50%' : '0%',
            scale: isHovered ? 1.5 : 1,
            transition: { type: 'spring', damping: 20 }
          }}
        />
      )}

      {/* Contenedor principal - Cambio a columna en móvil */}
      <motion.div
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-stretch bg-[#F4F4F4] rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl relative z-10 ${isMobile ? 'min-h-auto' : 'min-h-[650px] h-[650px]'}`}
      >
        {/* Sección naranja - Ocultar en móvil o mostrar más compacta */}
        {!isMobile ? (
          <motion.div 
            variants={itemVariants}
            className="p-12 md:p-16 flex flex-col items-center justify-center bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] w-full md:w-2/5 h-full"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: 'spring',
                stiffness: 100,
                damping: 10,
                delay: 0.2
              }}
              className="mb-8"
            >
              <img 
                src="/logo.png" 
                alt="Logo de la empresa" 
                className="h-72 w-auto object-contain drop-shadow-lg"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center text-white space-y-4"
            >
              <motion.p 
                className="text-3xl font-light"
                whileHover={{ scale: 1.05 }}
              >BACKGROUND</motion.p>
              <motion.p 
                className="text-5xl font-bold"
                whileHover={{ scale: 1.05 }}
              >MECHO & DESIGN</motion.p>
              <motion.p 
                className="text-xl font-light"
                whileHover={{ scale: 1.05 }}
              >eps.10</motion.p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            className="p-6 flex flex-col items-center justify-center bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] w-full"
            variants={itemVariants}
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: 'spring',
                stiffness: 100,
                damping: 10,
                delay: 0.2
              }}
              className="mb-4"
            >
              <img 
                src="/logo.png" 
                alt="Logo de la empresa" 
                className="h-32 w-auto object-contain drop-shadow-lg"
              />
            </motion.div>
            <motion.div className="text-center text-white space-y-2">
              <p className="text-xl font-light">BACKGROUND</p>
              <p className="text-3xl font-bold">MECHO & DESIGN</p>
              <p className="text-sm font-light">eps.10</p>
            </motion.div>
          </motion.div>
        )}

        {/* Sección del formulario - Ajustes para móvil */}
        <motion.div 
          variants={itemVariants}
          className={`p-6 ${isMobile ? 'py-8' : 'md:p-16'} w-full ${!isMobile ? 'md:w-3/5' : ''} relative flex flex-col justify-center`}
          onMouseEnter={() => !isMobile && setIsHovered(true)}
          onMouseLeave={() => !isMobile && setIsHovered(false)}
        >
          {!isMobile && (
            <motion.div 
              className="absolute inset-0 bg-[#FF6B00] opacity-0 pointer-events-none"
              animate={{
                opacity: isHovered ? 0.03 : 0,
                transition: { duration: 0.5 }
              }}
            />
          )}

          <motion.h2 
            className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold text-[#1A1A1A] mb-2`}
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.3 }}
          >
            LOGIN
          </motion.h2>
          
          <motion.p 
            className={`${isMobile ? 'text-base' : 'text-lg'} text-[#6C6C6C] mb-6`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Ingresa tus credenciales para continuar
          </motion.p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-100 text-red-700 rounded-lg text-center"
              >
                {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <label htmlFor="email" className={`block ${isMobile ? 'text-base' : 'text-lg'} font-medium text-[#1A1A1A] mb-2`}>
                Username
              </label>
              <motion.div whileHover={{ scale: isMobile ? 1 : 1.01 }}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 text-base border border-[#6C6C6C] border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all duration-300"
                  placeholder="tu@email.com"
                />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="password" className={`block ${isMobile ? 'text-base' : 'text-lg'} font-medium text-[#1A1A1A] mb-2`}>
                Password
              </label>
              <motion.div 
                className="relative"
                whileHover={{ scale: isMobile ? 1 : 1.01 }}
              >
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 text-base border border-[#6C6C6C] border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] pr-12 transition-all duration-300"
                  placeholder="••••••••"
                />
                <motion.button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-[#6C6C6C] hover:text-[#FF6B00] transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-[#6C6C6C] hover:text-[#FF6B00] transition-colors" />
                  )}
                </motion.button>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex items-center justify-between"
              variants={itemVariants}
            >
              <motion.div 
                className="flex items-center"
                whileHover={{ x: isMobile ? 0 : 5 }}
              >
                <motion.input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#FF6B00] focus:ring-[#FF6B00] border-[#6C6C6C] rounded"
                  whileTap={{ scale: 0.9 }}
                />
                <label htmlFor="rememberMe" className={`ml-2 ${isMobile ? 'text-sm' : 'text-lg'} text-[#1A1A1A]`}>
                  Recordar contraseña
                </label>
              </motion.div>

              <motion.div whileHover={{ scale: isMobile ? 1 : 1.05 }}>
                <Link
                  to="/forgot-password"
                  className={`${isMobile ? 'text-sm' : 'text-lg'} text-[#3498DB] hover:text-[#2980B9] transition-colors duration-300`}
                >
                  Forgot Password?
                </Link>
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                type="submit"
                className="w-full py-4 px-6 text-lg bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white font-bold rounded-xl hover:from-[#FF8C00] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] shadow-lg relative overflow-hidden"
                whileHover={{ 
                  scale: isMobile ? 1 : 1.02,
                  boxShadow: isMobile ? 'none' : '0 10px 25px -5px rgba(255, 107, 0, 0.4)'
                }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {!isMobile && (
                  <motion.span
                    className="absolute inset-0 bg-white opacity-0"
                    animate={{
                      opacity: isHovered ? 0.2 : 0,
                      x: isHovered ? '100%' : '-100%',
                    }}
                    transition={{ duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : !isMobile ? (
                    <motion.span
                      animate={{
                        x: [0, 5, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        repeatType: 'reverse'
                      }}
                      className="mr-2"
                    >
                      →
                    </motion.span>
                  ) : null}
                  {isLoading ? 'PROCESANDO...' : 'LOGIN'}
                </span>
              </motion.button>
            </motion.div>

            {/* Enlace de registro con animación */}
            <motion.div 
              className="text-center pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.p 
                className={`${isMobile ? 'text-sm' : 'text-lg'} text-[#6C6C6C]`}
                whileHover={{ scale: isMobile ? 1 : 1.02 }}
              >
                ¿No tienes cuenta?{' '}
                <motion.span
                  onMouseEnter={() => setIsRegisterHovered(true)}
                  onMouseLeave={() => setIsRegisterHovered(false)}
                >
                  <Link
                    to="/register"
                    className="font-bold text-[#3498DB] relative"
                  >
                    <span className="relative z-10">Regístrate ahora</span>
                    {!isMobile && (
                      <motion.span
                        className="absolute bottom-0 left-0 h-1 bg-[#3498DB] w-full"
                        initial={{ scaleX: 0 }}
                        animate={{ 
                          scaleX: isRegisterHovered ? 1 : 0,
                          transition: { duration: 0.3 }
                        }}
                      />
                    )}
                  </Link>
                </motion.span>
              </motion.p>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}