import { motion } from "framer-motion";

export default function GaugeChart({ value }) {

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="gauge"
    >
      {Math.round(value * 100)}%
    </motion.div>
  );
}