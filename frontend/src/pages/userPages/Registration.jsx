import style from "./Registration.module.css"
import logo from "/business-logo-reg.png";
import { useState, useEffect } from "react"; // ✅ NEW: useEffect
import Select from "react-select";
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; // ✅ NEW: Socket.IO client
import "./react-select.css"

const API_BASE = 'http://localhost:5000';
const SOCKET_BASE = 'http://localhost:5000';
const socket = io(SOCKET_BASE, { transports: ['websocket', 'polling'] }); // ✅ Initialize socket

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
    firstName: "", lastName: "", mobile: "", barangay: "", street: "",
    password: "", confirmPass: "",
  });

  const navigate = useNavigate();

  // ✅ NEW: Emit online status when user is already logged in on page load
  useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
      console.log(`🟢 Emitting user_set_online for existing session: ${userId}`);
      socket.emit('user_set_online', { user_id: userId });
    }
  }, []);

  const showSignUp = (e) => {
    e.preventDefault();
    setIsSignIn(!isSignIn);
    setErrorSignUp("");
    setLoginError("");
  }

  const handleLogInChange = (e) => {
    setLoginError("");
    setLogInData({ ...logInData, [e.target.name]: e.target.value });
  };

  const handleChange = (e) => {
    setErrorSignUp("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption) => {
    setErrorSignUp("");
    setFormData({ ...formData, barangay: selectedOption.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.barangay) { setErrorSignUp("Please select a Barangay to continue."); return; }
    if (formData.password !== formData.confirmPass) { setErrorSignUp("Passwords do not match."); return; }
    setErrorSignUp("");

    try {
      const response = await fetch(`${API_BASE}/addUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.firstName, last_name: formData.lastName,
          mobile_number: formData.mobile, barangay: formData.barangay,
          street_name: formData.street, password: formData.password,
          confirmPass: formData.confirmPass, status: "active"
        }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("currentUserId", data.user_id);
        sessionStorage.setItem('justSignedIn', 'true');
        localStorage.setItem('userName', data.first_name);

        // ✅ NEW: Emit online status after successful signup
        socket.emit('user_set_online', { user_id: data.user_id });
        console.log(`🟢 User ${data.user_id} set online after signup`);

        navigate("/home");
      } else {
        setErrorSignUp(data.error || data.message || "An unexpected error occurred.");
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
      const response = await fetch(`${API_BASE}/logIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_number: logInData.mobile,
          password: logInData.password
        })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("currentUserId", data.user_id);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', data.first_name);
        localStorage.setItem('userRole', data.role);
        sessionStorage.setItem('justLoggedIn', 'true');

        // ✅ NEW: Emit online status after successful login
        socket.emit('user_set_online', { user_id: data.user_id });
        console.log(`🟢 User ${data.user_id} set online after login`);

        if (data.role === 'admin') {
          navigate("/product_manager");
        } else {
          navigate("/home");
        }
      } else {
        setLoginError(data.error || data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setLoginError("Could not connect to the server.");
    }
  };

  return (
    <div className={style.pageBg}>
      <div className={style.mainContainer}>
        <div className={style.leftSideContainer}>
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
              <form id={style.loginForm} onSubmit={handleLogInSubmit}>
                <input className={style.field} name="mobile" onChange={handleLogInChange} type="tel" placeholder="Mobile Number" />
                <input className={style.field} name="password" onChange={handleLogInChange} type="password" placeholder="Password" />
                {loginError && <p className={style.errorMessage}>{loginError}</p>}
                <button className={style.btnPrimary} type="submit">Log In</button>
              </form>
              <p className={style.switchText}>
                <a href="#" className={style.switchLink} onClick={showSignUp}>Sign Up</a>
              </p>
            </div>
          ) : (
            <div className={style.formContainer} key="signup-section">
              <p className={style.welcomeText}>WELCOME DEAR COSTUMER</p>
              <p className={style.signupText}>SIGN UP TO ORDER</p>
              <p className={style.fieldLabel}>Personal Information</p>
              <form onSubmit={handleSubmit}>
                <div className={style.rowTwo}>
                  <input name="firstName" className={style.field} type="text" placeholder="First Name" onChange={handleChange} required />
                  <input name="lastName" className={style.field} type="text" placeholder="Last Name" onChange={handleChange} required />
                </div>
                <input name="mobile" className={style.field} type="tel" placeholder="Mobile Number" onChange={handleChange} required />
                <p className={style.fieldLabel}>Address</p>
                <div className={style.addressInput}>
                  <Select options={barangayOptions} placeholder="Select Barangay" maxMenuHeight={150} onChange={handleSelectChange} classNamePrefix="reactSelect" isSearchable={false} components={{ IndicatorSeparator: () => null, DropdownIndicator: () => null }} />
                  <input className={style.field} type="text" name="street" onChange={handleChange} placeholder="Street" />
                </div>
                <input className={style.field} type="password" placeholder="Password" name="password" onChange={handleChange} required />
                <input className={style.field} type="password" placeholder="Confirm Password" name="confirmPass" onChange={handleChange} required />
                {errorSignUp && <p className={style.errorMessage}>{errorSignUp}</p>}
                <button className={style.btnPrimary} type="submit">Sign Up</button>
              </form>
              <p className={style.switchText}>
                <a href="#" className={style.switchLink} onClick={showSignUp}>Log In</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}