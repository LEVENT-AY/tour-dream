import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="text-center mt-5">
      <h1>403 - Unauthorized</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
};

export default Unauthorized;
