import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../utils/auth'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      await loginUser(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#050816',
      color: 'white'
    }}>
      <form
        onSubmit={handleLogin}
        style={{
          width: 350,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <h1>LOGIN</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12 }}
        />

        {error && <p>{error}</p>}

        <button type="submit" style={{ padding: 12 }}>
          LOGIN
        </button>

        <Link to="/register" style={{ color: '#00f5ff' }}>
          Create account
        </Link>
      </form>
    </div>
  )
}