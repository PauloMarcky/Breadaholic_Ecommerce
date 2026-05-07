import { Header } from '../../components/Header';
import { FeatureProduct } from '../../components/HomeComponents/FeatureProduct';
import { IntroHook } from '../../components/HomeComponents/IntroHook';
import { Album } from '../../components/HomeComponents/Album';
import { Review } from '../../components/HomeComponents/Review';
import { Footer } from '../../components/Footer';
import '../../index.css';
import React, { useEffect, useState } from 'react';

export function Home() {
  // 1. Initialize state directly from storage. 
  // This function only runs ONCE when the component is born.
  const [welcomeMessage, setWelcomeMessage] = useState(() => {
    const name = localStorage.getItem('userName');
    const ticket = sessionStorage.getItem('justLoggedIn');

    // Only return the name if we haven't shown it this session
    if (name && ticket === 'true') {
      return name;
    }
    return null;
  });
  useEffect(() => {
    // 2. If the initial state decided to show the message...
    if (welcomeMessage) {

      // 3. BURN THE TICKET immediately. 
      // This ensures a refresh will NOT find the ticket again.
      sessionStorage.removeItem('justLoggedIn');

      // 4. Set the timer to hide the UI element
      const timer = setTimeout(() => {
        setWelcomeMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [welcomeMessage]);
  return (
    <>
      {welcomeMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '15px 40px',
          borderRadius: '10px',
          zIndex: 1000000,
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          fontFamily: 'sans-serif'
        }}>
          Welcome, {welcomeMessage}!
        </div>
      )}
      <Header />
      <IntroHook />
      <FeatureProduct />
      <Album />
      <Review />
      <Footer />
    </>
  );
}