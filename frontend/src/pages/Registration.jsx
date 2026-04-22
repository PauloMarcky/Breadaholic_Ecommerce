import style from "./Registration.module.css"
import logo from "/business-logo-reg.png";
import { useState } from "react";
import Select from "react-select";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const barangayOptions = [
  { value: "calao_east", label: "Calao East" },
  { value: "calaocan", label: "Calaocan" },
  { value: "calao_west", label: "Calao West" },
  { value: "dubinan_east", label: "Dubinan East" },
  { value: "dubinan_west", label: "Dubinan West" },
  { value: "patul", label: "Patul" },
  { value: "plaridel", label: "Plaridel" },
  { value: "rosario", label: "Rosario" },
  { value: "sinsayon", label: "Sinsayon" },
  { value: "victory_norte", label: "Victory Norte" },
  { value: "victory_sur", label: "Victory Sur" },
  { value: "villasis", label: "Villasis" },
];

export function Registration() {

  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(false)

  const showSignUp = (e) => {
    e.preventDefault();
    setIsSignIn(!isSignIn);
  }

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    barangay: "",
    street: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSelectChange = (selectedOption) => {
    setFormData({ ...formData, barangay: selectedOption.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:5000/addUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          mobile_number: formData.mobile,
          barangay: formData.barangay,
          street_name: formData.street,
          password: formData.password,
          profile_picture: "./src/assets/profile-demo.jpg", // Default for now
          status: "active"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration Successful!");
        navigate("/");
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  return (
    <div className={style.pageBg}>
      <div className={style.mainContainer}>


        < div className={style.leftSideContainer}>
          <div className={style.logoContainer}>
            <img className={style.logoImg} src={logo} alt="" />
          </div>
          <div className={style.titleContainer}>
            <h1 className={style.title}>Baked w/ Love</h1>
            <p className={style.subTitle}>LOVE AT FIRST BITE</p>
          </div>
          <p className={style.buttomSubTitle}>FEEL THE WARMTH IN EVERY SLICE</p>
        </div>

        <div className={style.rightSideContainer}>
          {!isSignIn ? (
            <div className={style.formContainer} id="login-section">

              <p className={style.welcomeText}>WELCOME DEAR COSTUMER</p>
              <p className={style.loginText}>LOG IN TO ORDER</p>

              <form id={style.loginForm}>
                <input className={style.field} type="tel" placeholder="Mobile Number" required />
                <input className={style.field} type="password" placeholder="Password" required />
                <button className={style.btnPrimary} type="submit">Log In</button>
              </form>

              <p className={style.switchText}>
                <a href="#" className={style.switchLink} onClick={showSignUp}>Sign Up</a>
              </p>
            </div>

          ) : (

            <div className={style.formContainer} id="signup-section">

              <p className={style.welcomeText}>WELCOME DEAR COSTUMER</p>
              <p className={style.signupText}>SIGN IN TO ORDER</p>

              <p className={style.fieldLabel}>Personal Information</p>
              <form onSubmit={handleSubmit}>
                <div className={style.rowTwo}>
                  <input
                    name="firstName"
                    className={style.field}
                    type="text"
                    placeholder="First Name"
                    onChange={handleChange}
                    required />
                  <input
                    name="lastName"
                    className={style.field}
                    type="text"
                    placeholder="Last Name"
                    onChange={handleChange}
                    required />
                </div>
                <input
                  name="mobile"
                  className={style.field}
                  type="tel"
                  placeholder="Mobile Number"
                  onChange={handleChange}
                  required />

                <p className={style.fieldLabel}>Address</p>
                <div className={style.addressInput}>
                  <Select
                    options={barangayOptions}
                    placeholder="Select Barangay"
                    maxMenuHeight={150}
                    onChange={handleSelectChange}
                    classNamePrefix="reactSelect"
                  />
                  <input
                    className={style.field}
                    type="text"
                    name="street"
                    onChange={handleChange}
                    placeholder="Street" />
                </div>

                <input
                  className={style.field}
                  type="password"
                  placeholder="Password"
                  name="password"
                  onChange={handleChange}
                  required />
                <button className={style.btnPrimary} type="submit">Sign Up</button>
              </form>

              <p className={style.switchText}>
                <a href="#" className={style.switchLink} onClick={showSignUp}>Log In</a>
              </p>
            </div>
          )}
        </div>

      </div>
    </div >

  )
}