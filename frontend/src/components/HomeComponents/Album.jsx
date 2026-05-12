import './Album.css'
import { useRef, useState } from 'react'; // ✅ add useState
import { NavLink } from 'react-router-dom'

const albumImages = [
  "/Albums/album1.jpg",
  "/Albums/album2.jpg",
  "/Albums/album3.jpg",
  "/Albums/album4.jpg",
  "/Albums/album5.jpg",
];

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function Album() {
  const scrollRef = useRef(null);
  const [shuffledAlbums] = useState(() => shuffleArray(albumImages)); // ✅ shuffle once on mount

  const scroll = (direction) => {
    const { current } = scrollRef;
    const scrollAmount = 200;
    if (direction === 'left') {
      current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="albums-section">
        <div className="albums-label">
          <h2>Photo<br />Albums</h2>
          <p>come and join us</p>
          <NavLink to={'/locations'}>
            <button>FIND US HERE</button>
          </NavLink>
        </div>

        <button className="albums-arrow" onClick={() => scroll('left')}><img src="../public/left-arrow.png" alt="" /></button>

        <div className="albums-container">
          <div className="albums-track" ref={scrollRef}>
            {shuffledAlbums.map((src, index) => ( // ✅ render from shuffled array
              <div className="album-thumb" key={index}>
                <img src={src} alt={`album ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <button className="albums-arrow" onClick={() => scroll('right')}><img src="../public/right-arrow.png" alt="" /></button>
      </div>
    </>
  );
}