import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './OfficerLogin.css'

function OfficerLogin() {
  const navigate = useNavigate()

  const [officerId, setOfficerId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()

    if (officerId === 'OFFICER001' && password === '123456') {
      localStorage.setItem('officerLoggedIn', 'true')
      navigate('/officer-dashboard')
    } else {
      setError('Invalid Officer ID or Password')
    }
  }

  return (
    <div className="officer-login-page">

      <div className="officer-login-card">

        <div className="officer-login-header">
          <div className="officer-badge">OFFICER</div>

          <h1>Officer Login</h1>

          <p>
            Sign in to manage citizen complaints
          </p>
        </div>

        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label>Officer ID</label>

            <input
              type="text"
              placeholder="Enter Officer ID"
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button type="submit" className="officer-login-btn">
            Sign In
          </button>

        </form>

        <button
          className="back-portal-btn"
          onClick={() => navigate('/')}
        >
          Back to Citizen Portal
        </button>

      </div>

    </div>
  )
}

export default OfficerLogin