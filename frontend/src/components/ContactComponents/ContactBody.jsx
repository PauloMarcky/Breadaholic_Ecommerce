import './ContactBody.css';

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
              <p className="value">12345678910</p>
            </div>
          </div>
          <hr />
          <p className="follow-mess">FOLLOW OUR PAGE</p>
          <div className="contact-img">
            <img src="./public/fb.png" alt="" />
            <img src="./public/ig.png" alt="" />
            <img src="./public/mess.png" alt="" />
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
