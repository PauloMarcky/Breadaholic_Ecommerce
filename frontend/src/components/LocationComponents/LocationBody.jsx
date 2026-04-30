import './LocationBody.css';
import { useState } from 'react';
import { Link } from 'react-router-dom'

export function LocationBody() {

  const locations = [
    { id: 0, path: '../public/main-location.png', url: 'https://www.bing.com/maps/search?v=2&pc=FACEBK&mid=8100&mkt=en-US&FORM=FBKPL1&q=nightmarket+santiago%2C+Santiago%2C+Philippines%2C+3311&cp=15.483819%7E120.959999&lvl=16&style=r' },
    { id: 1, path: '../public/other-loc-2.png', url: 'https://www.bing.com/maps/search?v=2&pc=FACEBK&mid=8100&mkt=en-US&FORM=FBKPL1&style=r&q=342+Arranz+Street%2C+Dubinan+West%2C+Santiago%2C+3311+Isabela&cp=16.690448%7E121.539501&lvl=16' },
    { is: 2, path: '../public/other-loc-1.png', url: 'https://www.bing.com/maps/search?v=2&pc=FACEBK&mid=8100&mkt=en-US&FORM=FBKPL1&style=r&q=4+Lanes+Street%2C+Santiago%2C+3311+Isabela&cp=16.687064%7E121.556255&lvl=16' }
  ]


  const [imageLocation, setImageLocation] = useState(locations[0]);

  function handleImageLocation1() {
    setImageLocation(locations[0]);
  };
  function handleImageLocation2() {
    setImageLocation(locations[1]);
  };
  function handleImageLocation3() {
    setImageLocation(locations[2]);
  };

  return (
    <>
      <main className="main-body">
        <div className="locations-container">
          <div className="location-detail" onClick={handleImageLocation1}>
            <img src="../public/location-1.jpg" alt="" />
            <p>Nightmarket Santiago, Santiago, Philippines, 3311</p>
          </div>
          <div className="location-detail" onClick={handleImageLocation2}>
            <img src="../public/location-2.jpg" alt="" />
            <p>342 Arranz Street, Dubinan West, Santiago, 3311 Isabela</p>
          </div>
          <div className="location-detail" onClick={handleImageLocation3}>
            <img src="../public/location-3.jpg" alt="" />
            <p>4 Lanes Street, Santiago, 3311 Isabela</p>
          </div>
        </div>
        <div className="right-part">
          <img className="image-loc" src={imageLocation.path} alt="" />
          <Link
            to={imageLocation.url}
            target="_blank"
            rel="noopener noreferrer">
            <div className="image-overlay">
              Click To Look For Maps
            </div>
          </Link>
        </div>
      </main >
    </>
  )
}