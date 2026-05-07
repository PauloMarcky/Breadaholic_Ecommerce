import style from "./Registration.module.css"
import logo from "/business-logo-reg.png";
import { useState } from "react";
import Select from "react-select";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const barangayOptions = [
  { value: "Calao East", label: "Calao East" },
  { value: "Calaocan", label: "Calaocan" },
  { value: "Calao West", label: "Calao West" },
  { value: "Dubinan East", label: "Dubinan East" },
  { value: "Dubinan West", label: "Dubinan West" },
  { value: "Patul", label: "Patul" },
  { value: "Plaridel", label: "Plaridel" },
  { value: "Rosario", label: "Rosario" },
  { value: "Sinsayon", label: "Sinsayon" },
  { value: "Victory Norte", label: "Victory Norte" },
  { value: "Victory Sur", label: "Victory Sur" },
  { value: "Villasis", label: "Villasis" },
];

export function Registration() {

  const [errorSignUp, setErrorSignUp] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSignIn, setIsSignIn] = useState(false);
  const [logInData, setLogInData] = useState({ mobile: "", password: "" });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    barangay: "",
    street: "",
    password: "",
  });

  const navigate = useNavigate();

  const showSignUp = (e) => {
    e.preventDefault();
    setIsSignIn(!isSignIn);
  }

  const handleLogInChange = (e) => {
    setLoginError("");
    setLogInData({ ...logInData, [e.target.name]: e.target.value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSelectChange = (selectedOption) => {
    setFormData({ ...formData, barangay: selectedOption.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.barangay) {
      setErrorSignUp("ERROR: Please enter Barangay to continue");
      return;
    }

    setErrorSignUp("");

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
          status: "active"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("currentUserId", data.user_id);
        alert("Registration Successful!");
        navigate("/home");
      } else {
        setErrorSignUp("INVALID: Mobile Number Already Exist!");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setErrorSignUp("Server connection failed. Please try again later.");
    }
  };

  const handleLogInSubmit = async (e) => {

    e.preventDefault();
    setLoginError("");

    try {

      const response = await fetch("http://127.0.0.1:5000/logIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_number: logInData.mobile,
          password: logInData.password
        })
      })

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("currentUserId", data.user_id);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', data.first_name);
        localStorage.setItem('userRole', data.role);
        sessionStorage.setItem('justLoggedIn', 'true');

        if (data.role === 'admin') {
          navigate("/product_manager");
        } else {
          navigate("/home");
        }
      }

    } catch (error) {
      console.error("Login Error:", error);
      setLoginError("Could not connect to the server");
    }

  }

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
            <div className={style.formContainer} key="login-form">

              <p className={style.welcomeText}>WELCOME DEAR COSTUMER</p>
              <p className={style.loginText}>LOG IN TO ORDER</p>

              <form id={style.loginForm} onSubmit={handleLogInSubmit} >
                <input className={style.field} name="mobile" onChange={handleLogInChange} type="tel" placeholder="Mobile Number" required />
                <input className={style.field} name="password" onChange={handleLogInChange} type="password" placeholder="Password" required />
                {loginError && <p style={{ color: "red", textAlign: "center", fontSize: "12px", margin: "10px 0px", fontFamily: "Arial" }}>{loginError}</p>}
                <button className={style.btnPrimary} type="submit">Log In</button>
              </form>

              <p className={style.switchText}>
                <a href="#" className={style.switchLink} onClick={showSignUp}>Sign Up</a>
              </p>
            </div>

          ) : (

            <div className={style.formContainer} key="signup-section">

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
                {errorSignUp && <p style={{ color: "red", fontSize: "12px", margin: "10px 0px", textAlign: "center", fontFamily: "Arial" }}>{errorSignUp}</p>}
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