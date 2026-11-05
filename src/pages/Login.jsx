
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')

    try {
     const response = await fetch(
  'https://thenightbulbportal.infinityfree.me/login.php',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.trim(),
      password: password
    })
  }
) 

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.message ||
          'Invalid email or password. Please try again.'
        )
        return
      }

      // Save citizen login status
localStorage.setItem('citizenLoggedIn', 'true')
localStorage.setItem(
  'citizenUser',
  JSON.stringify(data.user)
)

navigate('/')
    } catch (error) {
      console.error('Login error:', error)

      setError(
        'Cannot connect to the server. Please try again.'
      )
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            NB
          </div>

          <h1>
            Citizen Login
          </h1>

          <p>
            Sign in to access your complaint portal
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
          >
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?
          </p>

          <Link to="/register">
            Create Citizen Account
          </Link>

          <Link
            to="/"
            className="back-home"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
