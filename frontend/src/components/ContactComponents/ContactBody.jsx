import './ContactBody.css';
import { Link } from 'react-router-dom';

export function ContactBody() {
  return (
    <>
      <div className="body-main">
        <div className="contacts-left">
          <div className="header">
            <h2>GET IN TOUCH WITH US</h2>
            <p>Need help? Fill out the form and message us!</p>
          </div>
          <div className="contacts-container">
            <div className="contact-info">
              <div className="header-con">
                <img src="./public/loc.png" alt="" />
                <p>Main Location</p>
              </div>
              <p className="value">Nightmarket Santiago, Santiago, Philippines, 3311</p>
            </div>
            <div className="contact-info">
              <div className="header-con">
                <img src="./public/tele.png" alt="" />
                <p>Phone Number</p>
              </div>
              <p className="value">
                0918 311 8513</p>
            </div>
          </div>
          <hr />
          <p className="follow-mess">FOLLOW OUR PAGE</p>
          <div className="contact-img">
            <Link to={`https://www.facebook.com/Breadaholic04`}
              target='blank'><img src="./public/fb.png" alt="" /></Link>
            <Link to={`https://www.instagram.com/breadaholic04`}
              target='blank'><img src="./public/ig.png" alt="" /></Link>
            <Link to={`https://www.facebook.com/messages/t/108963074220045`}
              target='blank'><img src="./public/mess.png" alt="" /></Link>
          </div>
        </div>
        <div className="contact-right">
          <form className="input-container" action="">
            <p>Name</p>
            <input className="name" type="text" name="" id="" placeholder="Name" />
            <p>Email</p>
            <input className="email" type="email" name="" id="" placeholder="Your Email" />
            <p>Message</p>
            <textarea name="" id="" placeholder="Message...."></textarea>
            <button>SEND MESSAGE</button>
          </form>
        </div>
      </div>
    </>
  )
}
