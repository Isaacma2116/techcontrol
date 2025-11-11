// components/modals/TermsModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Lock, AlertCircle, Info, Mail, Settings } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200"
          >
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="text-[#FF6B00]" size={28} />
                <h2 className="text-2xl font-bold text-[#1A1A1A]">
                  Términos y Condiciones de Uso - ControTi
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="text-[#6C6C6C] hover:text-[#FF6B00] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-[#1A1A1A]">
              <p className="text-sm text-[#6C6C6C] mb-6">
                Última actualización: {new Date().toLocaleDateString()}
              </p>

              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><Info size={20} /> 1. Aceptación de los Términos</h3>
                <p>
                  El uso de la plataforma implica la aceptación plena y sin reservas de estos Términos y Condiciones. Si no estás de acuerdo con ellos, te solicitamos no utilizar nuestros servicios.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><Settings size={20} /> 2. Descripción del Servicio</h3>
                <p>ControTi permite a los usuarios:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Registrar equipos físicos (PCs, laptops, impresoras, entre otros)</li>
                  <li>Asociar software a cada equipo (nombre, licencia, versión, expiración)</li>
                  <li>Asignar responsables o departamentos</li>
                  <li>Gestionar historial de mantenimiento técnico</li>
                  <li>Visualizar reportes, alertas y filtros personalizados</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} /> 3. Registro y Uso del Sistema</h3>
                <p>
                  Para utilizar la aplicación, es necesario crear una cuenta. Los datos proporcionados deben ser verídicos, actuales y completos. Cada usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><AlertCircle size={20} /> 4. Uso Aceptable</h3>
                <p>Está prohibido:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Utilizar ControTi para actividades ilegales, fraudulentas o no autorizadas</li>
                  <li>Interferir con la seguridad, integridad o disponibilidad del sistema</li>
                  <li>Acceder o intentar acceder a cuentas o datos de otros usuarios sin autorización</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><Lock size={20} /> 5. Información Sensible y Confidencial</h3>
                <p><strong>a) Equipos</strong><br />
                  ControTi permite registrar datos sensibles como números de serie, marcas, modelos, ubicación física y asignación de responsables.
                </p>
                <p><strong>b) Software</strong><br />
                  También se gestionan datos críticos como claves de licencia, fechas de vencimiento, versiones y proveedores.
                </p>
                <p><strong>c) Protección de Datos</strong><br />
                  Todos los datos se almacenan con medidas de seguridad y cifrado estándar. El acceso está limitado a usuarios autorizados. ControTi no compartirá información con terceros sin consentimiento expreso.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold">6. Propiedad Intelectual</h3>
                <p>ControTi, incluyendo su diseño, funcionalidades, interfaz y código, es propiedad del desarrollador. Los datos ingresados por los usuarios son de su exclusiva titularidad.</p>
                <p>Queda estrictamente prohibido copiar, reproducir, modificar o distribuir el sistema sin permiso escrito.</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold">7. Modificación o Personalización del Software</h3>
                <p>Si deseas modificar, personalizar o integrar funcionalidades adicionales en ControTi, deberás solicitar autorización previa escribiendo a:</p>
                <a href="mailto:macias.jose.1hv@gmail.com" className="text-[#3498DB] hover:underline">
                  📧 macias.jose.1hv@gmail.com
                </a>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold">8. Responsabilidad Limitada</h3>
                <p>ControTi no garantiza funcionamiento ininterrumpido ni libre de errores. No se responsabiliza por:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Pérdida de datos ocasionada por mal uso, errores del usuario o fallas externas</li>
                  <li>Daños indirectos causados por decisiones basadas en la información registrada</li>
                  <li>Problemas derivados del uso de dispositivos o conexiones inadecuadas</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold">9. Seguridad y Privacidad</h3>
                <p>El sistema emplea autenticación segura y cifrado para proteger la información. Los datos ingresados no serán utilizados para fines comerciales o externos. El usuario puede solicitar la eliminación total de su cuenta y sus datos en cualquier momento.</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold">10. Cambios en los Términos</h3>
                <p>Estos Términos pueden ser modificados sin previo aviso. Te notificaremos los cambios importantes a través de la plataforma o por correo electrónico. El uso continuo del sistema implica la aceptación de los términos actualizados.</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><Mail size={20} /> 11. Contacto</h3>
                <p>
                  Para consultas, soporte técnico o solicitudes de modificación del software, contáctanos a:
                  <br />
                  <a href="mailto:macias.jose.1hv@gmail.com" className="text-[#3498DB] hover:underline">
                    📧 macias.jose.1hv@gmail.com
                  </a>
                </p>
              </section>
            </div>

            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#FF6B00] text-white font-medium rounded-lg hover:bg-[#FF8C00] transition-colors shadow-md"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
