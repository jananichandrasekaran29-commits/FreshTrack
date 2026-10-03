import { useState } from "react";

const API_URL = "https://fresh-track-backend.vercel.app";

function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = isSignup
        ? `${API_URL}/api/auth/signup`
        : `${API_URL}/api/auth/login`;

      const body = isSignup
        ? { name, email, password }
        : { email, password };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Something went wrong");
        return;
      }

      if (isSignup) {
        alert("Signup successful! Please login.");

        setIsSignup(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login successful!");

        if (onLogin) {
          onLogin(data.user);
        }
      }
    } catch (error) {
      alert("Backend connection failed");
      console.error(error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1>🥗 FreshTrack</h1>

        <p style={styles.subtitle}>
          Smart Food Expiry & Waste Reduction System
        </p>

        <h2>
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>

        <form onSubmit={handleSubmit}>

          {isSignup && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            {isSignup ? "Sign Up" : "Login"}
          </button>

        </form>

        <p style={styles.switchText}>
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            onClick={() => setIsSignup(!isSignup)}
            style={styles.linkButton}
          >
            {isSignup ? " Login" : " Sign Up"}
          </button>
        </p>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f0fdf4",
  },

  card: {
    width: "350px",
    padding: "30px",
    borderRadius: "15px",
    background: "white",
    boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
    textAlign: "center",
  },

  subtitle: {
    color: "#666",
    marginBottom: "25px",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    padding: "12px",
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
  },

  switchText: {
    marginTop: "20px",
  },

  linkButton: {
    border: "none",
    background: "none",
    color: "#16a34a",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Login;