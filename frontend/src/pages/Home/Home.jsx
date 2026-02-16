import "./Home.css";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import Footer from "../../components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Footer />
    </>
  );
}