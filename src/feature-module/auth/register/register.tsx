import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import { signUpUser } from "../../../core/services/firebaseServices";

type PasswordField = "password" | "confirmPassword";

const Register = () => {
  const routes = all_routes;
  const navigate = useNavigate();

  // State variables for form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [role, setRole] = useState<"customer" | "agent">("customer");
  const [agree, setAgree] = useState(false);
  
  // Status states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Form validations
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agree) {
      setError("You must agree to the Terms Of Service");
      return;
    }

    setLoading(true);
    try {
      await signUpUser(email, password, name);
      setSuccess(true);
      setTimeout(() => {
        navigate(routes.userDashboard);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Register */}
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
          <div className="col-xxl-4 col-lg-6 col-md-6 col-11 mx-auto">
            <div className="p-4 text-center">
              <ImageWithBasePath
                src="assets/img/logo-dark.svg"
                alt="logo"
                className="img-fluid"
              />
            </div>
            <div className="card authentication-card">
              <div className="card-header">
                <div className="text-center">
                  <h5 className="mb-1">Sign Up</h5>
                  <p>Create your DreamsTour Account</p>
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
                    Account created successfully! Redirecting...
                  </div>
                )}
                <form onSubmit={handleRegister}>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <div className="input-icon">
                      <span className="input-icon-addon">
                        <i className="isax isax-user" />
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
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
{/* Role selection removed for security */}
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <div className="input-icon">
                      <span className="input-icon-addon">
                        <i className="isax isax-lock" />
                      </span>
                      <input
                        type={passwordVisibility.password ? "text" : "password"}
                        className="pass-input form-control"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <span
                        className={`isax toggle-passwords ${
                          passwordVisibility.password ? "isax-eye" : "isax-eye-slash"
                        }`}
                        onClick={() => togglePasswordVisibility("password")}
                      ></span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm Password</label>
                    <div className="input-icon">
                      <span className="input-icon-addon">
                        <i className="isax isax-lock" />
                      </span>
                      <input
                        type={passwordVisibility.confirmPassword ? "text" : "password"}
                        className="pass-input form-control"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                      <span
                        className={`isax toggle-passwords ${
                          passwordVisibility.confirmPassword ? "isax-eye" : "isax-eye-slash"
                        }`}
                        onClick={() => togglePasswordVisibility("confirmPassword")}
                      ></span>
                    </div>
                  </div>
                  <div className="mt-3 mb-3">
                    <div className="d-flex">
                      <div className="form-check d-flex align-items-center mb-2">
                        <input
                          className="form-check-input mt-0"
                          type="checkbox"
                          id="agree"
                          checked={agree}
                          onChange={(e) => setAgree(e.target.checked)}
                          disabled={loading}
                        />
                        <label
                          className="form-check-label ms-2 text-gray-9 fs-14"
                          htmlFor="agree"
                        >
                          I agree with the&nbsp;
                          <Link
                            to={routes.termsConditions}
                            className="link-primary fw-medium"
                          >
                            Terms Of Service.
                          </Link>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <button
                      type="submit"
                      className="btn btn-xl btn-primary d-flex align-items-center justify-content-center w-100"
                      disabled={loading}
                    >
                      {loading ? "Registering..." : "Register"}
                      <i className="isax isax-arrow-right-3 ms-2" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Register */}
    </>
  );
};

export default Register;
