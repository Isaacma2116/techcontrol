import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import type { SVGMotionProps } from 'framer-motion';
import TermsModal from '../components/auth/TermsModal';
import { authService } from '../services/auth.service';

interface RegisterProps {
  setIsAuthenticated: (value: boolean) => void;
}

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

export default function Register({ setIsAuthenticated }: RegisterProps) {
  const navigate = useNavigate();
  const controls = useAnimation();
  
  // Estados
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoginHovered, setIsLoginHovered] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number}>>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');

  // Efectos
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      setParticles(
        Array.from({ length: mobile ? 8 : 15 }).map((_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * (mobile ? 3 : 4) + 1
        }))
      );
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    controls.start('visible');
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [controls]);

  // Handlers
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      await controls.start({ x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.5 } });
      return;
    }

    if (!acceptTerms) {
      setShowTermsModal(true);
      return;
    }

    try {
      await controls.start({ scale: [1, 0.95, 1], transition: { duration: 0.5 } });

      await authService.register({
        nombre: formData.name,
        correo: formData.email,
        contrasena: formData.password
      });

      const loginResponse = await authService.login({
        correo: formData.email,
        contrasena: formData.password
      });

      if (loginResponse.success) {
        setIsAuthenticated(true);
        navigate('/home');
      } else {
        throw new Error(loginResponse.message || 'Error en el login automático');
      }
      
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      await controls.start({ x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.5 } });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
    setError('');
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    field === 'password' 
      ? setShowPassword(!showPassword) 
      : setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2C2C2C] p-4 relative overflow-hidden">
      <TermsModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAcceptTerms(true);
          setShowTermsModal(false);
        }}
      />

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

      <motion.div
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className={`flex ${isMobile ? 'flex-col-reverse' : 'flex-row-reverse'} items-stretch bg-[#F4F4F4] rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl relative z-10 ${isMobile ? 'min-h-auto' : 'min-h-[650px] h-[650px]'}`}
      >
        <motion.div 
          variants={itemVariants}
          className={`p-6 ${isMobile ? 'py-8' : 'md:p-16'} w-full ${!isMobile ? 'md:w-3/5' : ''} relative flex flex-col justify-center overflow-y-auto`}
          style={{ maxHeight: isMobile ? 'none' : '650px' }}
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
          
          <motion.p 
            className={`${isMobile ? 'text-base' : 'text-lg'} text-[#6C6C6C] mb-6`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Crea una cuenta para comenzar
          </motion.p>

          {error && (
            <motion.div 
              className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants}>
              <label htmlFor="name" className={`block ${isMobile ? 'text-base' : 'text-lg'} font-medium text-[#1A1A1A] mb-2`}>
                Nombre Completo
              </label>
              <motion.div whileHover={{ scale: isMobile ? 1 : 1.01 }}>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base border border-[#6C6C6C] border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all duration-300"
                  placeholder="Tu nombre completo"
                />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="email" className={`block ${isMobile ? 'text-base' : 'text-lg'} font-medium text-[#1A1A1A] mb-2`}>
                Correo Electrónico
              </label>
              <motion.div whileHover={{ scale: isMobile ? 1 : 1.01 }}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base border border-[#6C6C6C] border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all duration-300"
                  placeholder="tu@email.com"
                />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="password" className={`block ${isMobile ? 'text-base' : 'text-lg'} font-medium text-[#1A1A1A] mb-2`}>
                Contraseña
              </label>
              <motion.div className="relative" whileHover={{ scale: isMobile ? 1 : 1.01 }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base border border-[#6C6C6C] border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] pr-12 transition-all duration-300"
                  placeholder="••••••••"
                />
                <motion.button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('password')}
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

            <motion.div variants={itemVariants}>
              <label htmlFor="confirmPassword" className={`block ${isMobile ? 'text-base' : 'text-lg'} font-medium text-[#1A1A1A] mb-2`}>
                Confirmar Contraseña
              </label>
              <motion.div className="relative" whileHover={{ scale: isMobile ? 1 : 1.01 }}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base border border-[#6C6C6C] border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] pr-12 transition-all duration-300"
                  placeholder="••••••••"
                />
                <motion.button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  whileTap={{ scale: 0.9 }}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-[#6C6C6C] hover:text-[#FF6B00] transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-[#6C6C6C] hover:text-[#FF6B00] transition-colors" />
                  )}
                </motion.button>
              </motion.div>
              {passwordError && (
                <motion.p 
                  className="text-red-500 text-sm mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {passwordError}
                </motion.p>
              )}
            </motion.div>

            <motion.div className="flex items-start" variants={itemVariants}>
              <motion.div className="flex items-center h-5" whileHover={{ x: isMobile ? 0 : 5 }}>
                <motion.input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 text-[#FF6B00] focus:ring-[#FF6B00] border-[#6C6C6C] rounded"
                  whileTap={{ scale: 0.9 }}
                />
              </motion.div>
              <label htmlFor="acceptTerms" className={`ml-2 ${isMobile ? 'text-sm' : 'text-base'} text-[#1A1A1A]`}>
                Acepto los{' '}
                <button 
                  type="button" 
                  className="text-[#3498DB] hover:underline"
                  onClick={() => setShowTermsModal(true)}
                >
                  Términos y Condiciones
                </button>
              </label>
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
                  {!isMobile && (
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
                  )}
                  REGISTRARSE
                </span>
              </motion.button>
            </motion.div>

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
                ¿Ya tienes una cuenta?{' '}
                <motion.span
                  onMouseEnter={() => setIsLoginHovered(true)}
                  onMouseLeave={() => setIsLoginHovered(false)}
                >
                  <Link
                    to="/login"
                    className="font-bold text-[#3498DB] relative"
                  >
                    <span className="relative z-10">Inicia Sesión</span>
                    {!isMobile && (
                      <motion.span
                        className="absolute bottom-0 left-0 h-1 bg-[#3498DB] w-full"
                        initial={{ scaleX: 0 }}
                        animate={{ 
                          scaleX: isLoginHovered ? 1 : 0,
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
                className="text-3xl font-bold"
                whileHover={{ scale: 1.05 }}
              >Organiza tus equipos.</motion.p>
              <motion.p 
                className="text-2xl font-light"
                whileHover={{ scale: 1.05 }}
              >Regístrate en Controlti</motion.p>
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
              <p className="text-xl font-bold">Organiza tus equipos.</p>
              <p className="text-lg font-light">Regístrate en Controlti</p>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}