import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/common/Navbar';

// --- Reusable Motion Components ---

// Spring configuration for premium snappy feel
const springConfig = { type: 'spring', stiffness: 400, damping: 25 };

// Easing for reveals
const easeOutQuint = [0.22, 1, 0.36, 1];

const FadeUp = ({ children, delay = 0, y = 30, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.8, delay, ease: easeOutQuint }}
    {...props}
  >
    {children}
  </motion.div>
);

const StaggerContainer = ({ children, delayChildren = 0 }) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-50px' }}
    variants={{
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren } }
    }}
  >
    {children}
  </motion.div>
);

const StaggerItem = ({ children }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeOutQuint } }
    }}
  >
    {children}
  </motion.div>
);

// Animated Counter Hook
function useCountUp(target, duration = 2, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const Counter = ({ value, label, suffix = '' }) => {
  const [inView, setInView] = useState(false);
  const count = useCountUp(value, 2.5, inView);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      whileInView={{ opacity: 1 }} 
      viewport={{ once: true }} 
      onViewportEnter={() => setInView(true)}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
    >
      <span style={{ 
        fontFamily: 'var(--font-sans)', 
        fontSize: 'var(--text-5xl)', 
        fontWeight: 600, 
        color: 'var(--primary)',
        letterSpacing: '-1px',
        lineHeight: 1 
      }}>
        {count.toLocaleString()}{suffix}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
        {label}
      </span>
    </motion.div>
  );
};

// --- Main Page Component ---

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    {
      role: 'Donor',
      title: 'Post in 30 seconds.',
      desc: 'Got surplus food? Open the app, snap a quick photo, enter the quantity, and set a pickup window. Our algorithm instantly notifies verified NGOs within a 10km radius.',
      steps: ['Log food details', 'Algorithm matches NGOs', 'Volunteer arrives for pickup']
    },
    {
      role: 'NGO',
      title: 'Claim what you need.',
      desc: 'Stop relying on unstructured WhatsApp groups. See all active donations on a live map, filter by food type and quantity, and claim portions instantly to feed your beneficiaries.',
      steps: ['Scan live map', 'Claim donation', 'Assign to your volunteer fleet']
    },
    {
      role: 'Volunteer',
      title: 'Deliver with purpose.',
      desc: 'Your NGO assigns you a task. You get turn-by-turn navigation, digital verification via photo upload, and a tracked impact profile for every delivery completed.',
      steps: ['Accept assigned task', 'Navigate to pickup', 'Upload delivery proof']
    }
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflow: 'hidden' }}>
      <Navbar />

      {/* 1. Hero Section */}
      <section style={{ 
        position: 'relative', 
        paddingTop: 'var(--space-20)', 
        paddingBottom: 'var(--space-16)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: 900 }}>
          
          <FadeUp delay={0.1}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
              Moving 1,000+ meals daily across 28 cities
            </div>
          </FadeUp>

          <FadeUp delay={0.2} y={40}>
            <h1 style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: 'clamp(48px, 8vw, 84px)', 
              fontWeight: 500, 
              lineHeight: 1.05, 
              letterSpacing: '-0.02em',
              color: 'var(--text)',
              marginBottom: 'var(--space-6)'
            }}>
              Surplus food belongs on plates. <br/>
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not in landfills.</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.3} y={30}>
            <p style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--text-muted)',
              maxWidth: 600,
              margin: '0 auto var(--space-8)',
              lineHeight: 1.6
            }}>
              The logistics engine connecting restaurants with local NGOs to distribute surplus food securely, efficiently, and with dignity.
            </p>
          </FadeUp>

          <FadeUp delay={0.4} y={20}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={springConfig}>
                <Link to="/signup?role=donor" style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--accent)', color: '#fff',
                  padding: '16px 32px', borderRadius: 'var(--radius-full)',
                  fontSize: '16px', fontWeight: 600,
                  boxShadow: '0 8px 16px rgba(242, 110, 34, 0.25)',
                  textDecoration: 'none'
                }}>
                  Donate surplus food
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={springConfig}>
                <Link to="/signup?role=ngo" style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', color: 'var(--text)',
                  border: '1px solid var(--border)',
                  padding: '16px 32px', borderRadius: 'var(--radius-full)',
                  fontSize: '16px', fontWeight: 500,
                  textDecoration: 'none'
                }}>
                  Claim food for your NGO
                </Link>
              </motion.div>
            </div>
          </FadeUp>
        </div>

        {/* Abstract Background Elements */}
        <motion.div style={{ y: yBg, position: 'absolute', top: '10%', left: '5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(44,85,69,0.04) 0%, rgba(255,255,255,0) 70%)', zIndex: 1 }} />
        <motion.div style={{ y: yBg, position: 'absolute', top: '30%', right: '0%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(242,110,34,0.03) 0%, rgba(255,255,255,0) 70%)', zIndex: 1 }} />
      </section>


      {/* 2. Live Impact Section */}
      <section style={{ padding: 'var(--space-16) 0', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="container">
          <StaggerContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-10)' }}>
              <StaggerItem>
                <div style={{ paddingLeft: 'var(--space-4)', borderLeft: '1px solid var(--border)' }}>
                  <Counter value={68} suffix="M" label="Tonnes wasted in India annually" />
                </div>
              </StaggerItem>
              <StaggerItem>
                <div style={{ paddingLeft: 'var(--space-4)', borderLeft: '1px solid var(--border)' }}>
                  <Counter value={24800} suffix="+" label="Meals rescued this month via Aahaar" />
                </div>
              </StaggerItem>
              <StaggerItem>
                <div style={{ paddingLeft: 'var(--space-4)', borderLeft: '1px solid var(--border)' }}>
                  <Counter value={45} suffix="m" label="Average time from post to pickup" />
                </div>
              </StaggerItem>
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* 3. Interactive Mechanics (How It Works) */}
      <section style={{ padding: 'var(--space-20) 0' }}>
        <div className="container">
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', fontWeight: 500, letterSpacing: '-1px', marginBottom: 'var(--space-3)' }}>
                Built for scale and speed.
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-lg)', maxWidth: 500, margin: '0 auto' }}>
                A multi-sided marketplace designed to remove the friction from food redistribution.
              </p>
            </div>
          </FadeUp>

          <div style={{ maxWidth: 900, margin: '0 auto', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {tabs.map((tab, idx) => (
                <button
                  key={tab.role}
                  onClick={() => setActiveTab(idx)}
                  style={{
                    flex: 1, padding: '20px', fontSize: '15px', fontWeight: 500,
                    color: activeTab === idx ? 'var(--text)' : 'var(--text-muted)',
                    background: activeTab === idx ? 'var(--surface)' : 'transparent',
                    borderBottom: activeTab === idx ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.role} View
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: 'var(--space-8)' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, marginBottom: 'var(--space-3)', letterSpacing: '-0.5px' }}>
                    {tabs[activeTab].title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, marginBottom: 'var(--space-6)', maxWidth: 600 }}>
                    {tabs[activeTab].desc}
                  </p>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                    {tabs[activeTab].steps.map((step, i) => (
                      <div key={step} style={{ flex: 1, minWidth: 200, padding: 'var(--space-4)', background: 'var(--bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                          Step 0{i + 1}
                        </span>
                        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Final CTA (Urgency) */}
      <section style={{ padding: 'var(--space-20) 0', background: 'var(--primary)', color: '#ffffff' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 800 }}>
          <FadeUp>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', fontWeight: 500, letterSpacing: '-1px', marginBottom: 'var(--space-5)', color: '#fff' }}>
              The food is already cooked.<br/>It just needs a destination.
            </h2>
            <p style={{ fontSize: 'var(--text-lg)', color: 'rgba(255,255,255,0.8)', marginBottom: 'var(--space-8)' }}>
              Stop throwing away perfect food. Join the network of 300+ donors and NGOs making a measurable impact in their communities.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={springConfig}>
              <Link to="/signup" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent)', color: '#fff',
                padding: '18px 40px', borderRadius: 'var(--radius-full)',
                fontSize: '18px', fontWeight: 600,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                textDecoration: 'none'
              }}>
                Start rescuing food today
              </Link>
            </motion.div>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: 'var(--space-8) 0', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            aahaar<span style={{ color: 'var(--accent)' }}>.</span>
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-6)', fontSize: '14px', color: 'var(--text-muted)' }}>
            <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>Log in</Link>
            <Link to="/signup" style={{ textDecoration: 'none', color: 'inherit' }}>Sign up</Link>
            <a href="mailto:hello@aahaar.in" style={{ textDecoration: 'none', color: 'inherit' }}>Contact</a>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Aahaar. Engineered for impact.
          </p>
        </div>
      </footer>
    </div>
  );
}
