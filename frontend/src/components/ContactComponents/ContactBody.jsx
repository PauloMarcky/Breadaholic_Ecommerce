import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ContactBody.css'

export function ContactBody() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null); // 'sending' | 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      await axios.post('http://10.137.201.159:5000/send_contact_email', formData);
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
          <form className="input-container" onSubmit={handleSubmit}>
            <p>Name</p>
            <input
              className="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              required
            />
            <p>Email</p>
            <input
              className="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
              required
            />
            <p>Message</p>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Message...."
              required
            ></textarea>
            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'SEND MESSAGE'}
            </button>
            {status === 'success' && <p className="success-msg" style={{ color: 'var(--cream)', textAlign: 'center' }}>✓ Message sent!</p>}
            {status === 'error' && <p className="error-msg" style={{ color: 'red', textAlign: 'center' }}>✗ Failed. Try again.</p>}
          </form>
        </div>
      </div>
    </>
  )
}