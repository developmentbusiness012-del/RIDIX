import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Fait apparaître son contenu en fondu + léger décalage, une seule fois, au scroll.
export function Reveal({ children, delay = 0, y = 28, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Compteur animé qui monte de 0 jusqu'au nombre réel d'entreprises créées sur RIDIX
// (lecture directe en base — jamais un chiffre inventé).
export function LiveCompanyCounter({ className = "" }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1.8, bounce: 0 });
  const [display, setDisplay] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.rpc("get_public_company_count").then(({ data, error }) => {
      const value = error ? 0 : data ?? 0;
      setLoaded(true);
      motionVal.set(value);
    });
  }, [motionVal]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [spring]);

  return (
    <span className={className} style={{ visibility: loaded ? "visible" : "hidden" }}>
      {display.toLocaleString("fr-FR")}
    </span>
  );
}
