import '../components/Album.css'
import { useRef } from 'react';

export function Album() {

  const scrollRef = useRef(null);

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
        </div>

        <button className="albums-arrow" onClick={() => scroll('left')} ><img src="../public/left-arrow.png" alt="" /></button>

        <div className="albums-container">
          <div className="albums-track" ref={scrollRef}>
            <div className="album-thumb">
            </div>
            <div className="album-thumb">
            </div>
            <div className="album-thumb">
            </div>
            <div className="album-thumb">
            </div>
            <div className="album-thumb">
            </div>
          </div>
        </div>

        <button className="albums-arrow" onClick={() => scroll('right')} ><img src="../public/right-arrow.png" alt="" /></button>
      </div>
    </>
  )
}