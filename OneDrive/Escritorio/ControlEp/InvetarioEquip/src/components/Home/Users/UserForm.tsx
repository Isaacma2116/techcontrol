import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useUser } from '../../../hooks/useUser'; // Importamos el hook de usuario

type ColaboradorFormData = {
  nombre: string;
  email: string;
  foto: FileList | null;
  telefono: string;
  departamento: string;
  nuevoDepartamento?: string;
};

const departamentosBase = [
  "Ventas",
  "Marketing",
  "TI",
  "Recursos Humanos",
  "Finanzas",
  "Operaciones",
  "Logística",
  "Atención al Cliente"
];

export default function UserForm({ onClose }: { onClose: () => void }) {
  const { user } = useUser(); // Obtenemos el usuario autenticado
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mostrarNuevoDepartamento, setMostrarNuevoDepartamento] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<ColaboradorFormData>();

  const departamento = watch('departamento');
  const foto = watch('foto');

  const onSubmit = async (data: ColaboradorFormData) => {
    setIsSubmitting(true);
    
    try {
      const departamentoFinal = data.departamento === 'Otro' ? data.nuevoDepartamento : data.departamento;

      const formData = new FormData();
      formData.append('nombre', data.nombre);
      formData.append('email', data.email);
      formData.append('telefono', data.telefono);
      formData.append('departamento', departamentoFinal || '');
      
      // Añadir el ID del usuario que está creando el colaborador
      if (user?.id) {
        formData.append('creadoPor', user.id.toString());
      }
      
      if (data.foto && data.foto.length > 0) {
        formData.append('foto', data.foto[0]);
      }

      const apiUrl = `${import.meta.env.VITE_API_URL}/api/colaboradores`;
      
      // Depuración: Mostrar contenido del FormData
      console.log('Datos a enviar:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Añadir token de autenticación
        },
        timeout: 10000
      });

      toast.success('Colaborador registrado exitosamente!');
      reset();
      setPreviewImage(null);
      onClose();
    } catch (error: any) {
      console.error('Error completo:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Tiempo de espera agotado. El servidor no respondió');
      } else if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Detalles del error:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
          
          const serverMessage = error.response.data?.message || 
                              error.response.data?.error ||
                              'Error en el servidor';
          
          toast.error(`Error ${error.response.status}: ${serverMessage}`);
        } else if (error.request) {
          toast.error('No se recibió respuesta del servidor');
        } else {
          toast.error('Error al configurar la solicitud');
        }
      } else {
        toast.error('Error desconocido al enviar el formulario');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > 2 * 1024 * 1024) {
        toast.warning('La imagen no debe superar los 2MB');
        return;
      }
      
      if (!e.target.files[0].type.match('image.*')) {
        toast.warning('Solo se permiten archivos de imagen');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setValue('departamento', value);
    setMostrarNuevoDepartamento(value === 'Otro');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Encabezado */}
        <div className="bg-orange-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Registro de Colaborador</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-orange-200 focus:outline-none"
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Campo Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              id="nombre"
              type="text"
              {...register('nombre', { 
                required: 'Este campo es obligatorio',
                minLength: {
                  value: 3,
                  message: 'El nombre debe tener al menos 3 caracteres'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: Juan Pérez"
              disabled={isSubmitting}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>

          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              id="email"
              type="email"
              {...register('email', {
                required: 'Este campo es obligatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Correo electrónico inválido'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: juan.perez@empresa.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Campo Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              id="telefono"
              type="tel"
              {...register('telefono', {
                required: 'Este campo es obligatorio',
                pattern: {
                  value: /^[0-9+\-() ]+$/,
                  message: 'Número de teléfono inválido'
                },
                minLength: {
                  value: 8,
                  message: 'El teléfono debe tener al menos 8 caracteres'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: +51 987 654 321"
              disabled={isSubmitting}
            />
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>
            )}
          </div>

          {/* Campo Departamento */}
          <div>
            <label htmlFor="departamento" className="block text-sm font-medium text-gray-700 mb-1">
              Departamento *
            </label>
            <select
              id="departamento"
              {...register('departamento', { required: 'Este campo es obligatorio' })}
              onChange={handleDepartamentoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              disabled={isSubmitting}
            >
              <option value="">Seleccione un departamento</option>
              {departamentosBase.map(depto => (
                <option key={depto} value={depto}>{depto}</option>
              ))}
              <option value="Otro">Otro (especificar)</option>
            </select>
            {errors.departamento && (
              <p className="mt-1 text-sm text-red-600">{errors.departamento.message}</p>
            )}

            {mostrarNuevoDepartamento && (
              <div className="mt-2">
                <input
                  type="text"
                  {...register('nuevoDepartamento', { 
                    required: 'Por favor especifique el nuevo departamento',
                    minLength: {
                      value: 3,
                      message: 'El departamento debe tener al menos 3 caracteres'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Nombre del nuevo departamento"
                  disabled={isSubmitting}
                />
                {errors.nuevoDepartamento && (
                  <p className="mt-1 text-sm text-red-600">{errors.nuevoDepartamento.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Campo Foto */}
          <div>
            <label htmlFor="foto" className="block text-sm font-medium text-gray-700 mb-1">
              Foto del Colaborador
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Vista previa"
                    className="h-16 w-16 rounded-full object-cover border-2 border-orange-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  id="foto"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  {...register('foto')}
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">Formatos: JPG, PNG, GIF (max 2MB)</p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando...
                </>
              ) : 'Registrar Colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}