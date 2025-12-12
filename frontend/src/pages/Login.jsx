import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    login();                 // 🔥 BU ŞART
    navigate("/dashboard");  // 🔥 BU ŞART
  };

  return (
    <form onSubmit={handleLogin}>
      <button type="submit">Giriş Yap</button>
    </form>
  );
}

