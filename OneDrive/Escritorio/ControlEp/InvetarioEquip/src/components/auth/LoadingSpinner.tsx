import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full"
      />
    </div>
  );
}