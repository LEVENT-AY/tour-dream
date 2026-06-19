import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import { signInUser } from "../../../core/services/firebaseServices";

const Login = () => {
  const routes = all_routes;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  
  // Status states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const profile = await signInUser(email, password);
      setSuccess(true);
      setTimeout(() => {
        if (profile.role === "admin") {
          navigate(routes.adminDashboard);
        } else if (profile.role === "agent") {
          navigate(routes.agentDashboard);
        } else {
          navigate(routes.userDashboard);
        }
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
      <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
        <div className="col-xxl-4 col-lg-6 col-md-6 col-11 mx-auto">
          <div className="p-4 text-center">
            <ImageWithBasePath src="assets/img/logo-dark.svg" alt="logo" className="img-fluid" />
          </div>
          <div className="card authentication-card">
            <div className="card-header">
              <div className="text-center">
                <h5 className="mb-1">Sign In</h5>
                <p>Sign in to Start Manage your DreamsTour Account</p>
              </div>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger text-center py-2 fs-14" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success text-center py-2 fs-14" role="alert">
                  Login successful! Redirecting...
                </div>
              )}
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <i className="isax isax-message" />
                    </span>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      placeholder="Enter Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <div className="input-icon">
                    <span className="input-icon-addon">
                      <i className="isax isax-lock" />
                    </span>
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      className="pass-input form-control"
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <span
                      className={`isax toggle-password ${isPasswordVisible ? "isax-eye" : "isax-eye-slash"}`}
                      onClick={togglePasswordVisibility}
                    />
                  </div>
                </div>
                <div className="mt-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <div className="form-check d-flex align-items-center mb-2">
                      <input
                        className="form-check-input mt-0"
                        type="checkbox"
                        defaultValue=""
                        id="remembers_me"
                        disabled={loading}
                      />
                      <label
                        className="form-check-label ms-2 text-gray-9 fs-14"
                        htmlFor="remembers_me"
                      >
                        Remember Me
                      </label>
                    </div>
                    <Link
                      to={all_routes.forgotPassword}
                      className="link-primary fw-medium fs-14 mb-2"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>
                <div className="mb-3">
                  <button
                    type="submit"
                    className="btn btn-xl btn-primary d-flex align-items-center justify-content-center w-100"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Login"}
                    <i className="isax isax-arrow-right-3 ms-2" />
                  </button>
                </div>
                <div className="login-or mb-3">
                  <span className="span-or">Or</span>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <Link
                    to="#"
                    className="btn btn-light flex-fill d-flex align-items-center justify-content-center me-2"
                  >
                    <ImageWithBasePath
                      src="assets/img/icons/google-icon.svg"
                      className="me-2"
                      alt="Img"
                    />
                    Google
                  </Link>
                  <Link
                    to="#"
                    className="btn btn-light flex-fill d-flex align-items-center justify-content-center"
                  >
                    <ImageWithBasePath
                      src="assets/img/icons/fb-icon.svg"
                      className="me-2"
                      alt="Img"
                    />
                    Facebook
                  </Link>
                </div>
                <div className="d-flex justify-content-center">
                  <p className="fs-14">
                    Don't you have an account?{" "}
                    <Link to={all_routes.register} className="link-primary fw-medium">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
