import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../utils/auth'

export default function Register() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()

    try {
      await registerUser(email, password)
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
        onSubmit={handleRegister}
        style={{
          width: 350,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <h1>REGISTER</h1>

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
          CREATE ACCOUNT
        </button>

        <Link to="/login" style={{ color: '#00f5ff' }}>
          Already have an account?
        </Link>
      </form>
    </div>
  )
}