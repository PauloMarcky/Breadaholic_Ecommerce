import './IntroHook.css'
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';


export function IntroHook() {

  const [heroIndex, setHeroIndex] = useState(0);

  const images = [
    "../public/feat-img-1.jpg",
    "../public/feat-img-2.jpg",
    "../public/feat-img-3.jpg"
  ];

  const totalSlides = images.length;

  const slideHero = (dir) => {
    setHeroIndex((prevIndex) => (prevIndex + dir + totalSlides) % totalSlides);
  };

  return (
    <>
      <div className="slider-parent" style={{ position: 'relative', width: '100%' }}>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <clipPath id="wave-clip" clipPathUnits="objectBoundingBox">
              <path d="M0,0 H1 V0.8 C0.9,0.75,0.8,0.85,0.7,0.8 C0.6,0.75,0.5,0.9,0.4,0.85 C0.3,0.8,0.2,0.95,0.1,0.9 C0.05,0.88,0,0.85,0,0.8 Z" />
            </clipPath>
          </defs>
        </svg>

        <section className="feature-images-container">
          <div className="intro">
            <h1>ALL FAVORITES, <br /> ONE PLACE</h1>
            <NavLink to="/menu" className='btn-tomenu'>
              VIEW MENU
            </NavLink>
          </div>

          <div
            className="images-wrapper"
            style={{
              transform: `translateX(-${heroIndex * 100}%)`,
              transition: 'transform 0.5s ease-in-out',
              display: 'flex'
            }}
          >
            {images.map((src, index) => (
              <div className="image" key={index}>
                <img src={src} alt={`Slide ${index}`} />
              </div>
            ))}
          </div>
        </section>
        <div className="arrows">
          <button onClick={() => slideHero(-1)} className="left-arrow">
            <img src="../public/left-arrow.png" alt="Prev" />
          </button>
          <button onClick={() => slideHero(1)} className="right-arrow">
            <img src="../public/right-arrow.png" alt="Next" />
          </button>
        </div>
      </div>
    </>
  )
}