import { motion } from 'framer-motion'

export default function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-4 px-4 py-2"
    >
      {[80, 60, 90].map((w, i) => (
        <div key={i} className="flex items-end gap-3">
          <div className="w-7 h-7 rounded-full skeleton flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="skeleton rounded-xl h-4" style={{ width: `${w}%` }} />
            <div className="skeleton rounded-xl h-4" style={{ width: `${w - 20}%` }} />
          </div>
        </div>
      ))}
    </motion.div>
  )
}
