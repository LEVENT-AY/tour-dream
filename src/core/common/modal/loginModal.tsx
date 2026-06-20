import { useState } from 'react'
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import ImageWithBasePath from '../imageWithBasePath';
import { signInUser } from '../../services/firebaseServices';
import { all_routes } from '../../../feature-module/router/all_routes';

const getLoginErrorMessage = (err: { code?: string; message?: string }) => {
  if (
    err.code === "auth/user-not-found" ||
    err.code === "auth/wrong-password" ||
    err.code === "auth/invalid-credential"
  ) {
    return "Invalid email or password.";
  }

  if (err.code === "auth/profile-not-found") {
    return "Your account profile was not found. Please contact support.";
  }

  if (err.code === "auth/role-missing") {
    return "Your account role is missing or invalid. Please contact support.";
  }

  return err.message || "Login failed. Please check your credentials.";
};

const LoginModal = () => {
      const routes = all_routes;
      const navigate = useNavigate();
      const [isPasswordVisible, setPasswordVisible] = useState(false);
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState('');
      const [success, setSuccess] = useState(false);

      const togglePasswordVisibility = () => {
        setPasswordVisible((prevState) => !prevState);
      };

      const closeModal = () => {
        const modalElement = document.getElementById('login-modal');
        const bootstrapApi = (window as typeof window & {
          bootstrap?: {
            Modal?: {
              getOrCreateInstance?: (element: Element) => { hide: () => void };
            };
          };
        }).bootstrap;

        if (modalElement && bootstrapApi?.Modal?.getOrCreateInstance) {
          bootstrapApi.Modal.getOrCreateInstance(modalElement).hide();
        }
      };

      const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccess(false);

        if (!email.trim() || !password.trim()) {
          setError('Please fill in all fields.');
          return;
        }

        setLoading(true);

        try {
          const profile = await signInUser(email.trim(), password);
          setSuccess(true);
          closeModal();

          if (profile.role === 'admin') {
            navigate(routes.adminDashboard);
          } else if (profile.role === 'agent') {
            navigate(routes.agentDashboard);
          } else {
            navigate(routes.userDashboard);
          }
        } catch (err: any) {
          console.error(err);
          setSuccess(false);
          setError(getLoginErrorMessage(err));
        } finally {
          setLoading(false);
        }
      };
  return (
    <>
    {/* Login Modal */}
    <div className="modal fade" id="login-modal">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header d-flex align-items-center justify-content-end pb-0 border-0">
            <Link
              to="#"
              data-bs-dismiss="modal"
            >
              <i className="ti ti-x fs-20" />
            </Link>
          </div>
          <div className="modal-body p-4 pt-0">
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
              <div className="text-center mb-3">
                <h5 className="mb-1">Sign In</h5>
                <p>Sign in to Start Manage your DreamsTour Account</p>
              </div>
              <div className="mb-2">
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
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Password</label>
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <i className="isax isax-lock" />
                  </span>
                  
                  <input
                      type={isPasswordVisible ? "text" : "password"}
                      className="form-control form-control-lg pass-input"
                      placeholder='Enter Password'
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={loading}
                    />
                    <span
                      className={`input-icon-addon toggle-password`}
                      onClick={togglePasswordVisibility}
                    >
                        <i className={`isax ${isPasswordVisible ? 'isax-eye' : 'isax-eye-slash'}`}></i>
                    </span>
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
                    to="#"
                    className="link-primary fw-medium fs-14 mb-2"
                    data-bs-toggle="modal"
                    data-bs-target="#forgot-modal"
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
                  {loading ? 'Signing In...' : 'Login'}
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
                  <Link
                    to="#"
                    className="link-primary fw-medium"
                    data-bs-toggle="modal"
                    data-bs-target="#register-modal"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    {/* /Login Modal */}
  
      </>
  )
}

export default LoginModal
