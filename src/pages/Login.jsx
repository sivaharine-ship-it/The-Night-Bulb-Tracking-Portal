import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')


  const handleLogin = (event) => {

    event.preventDefault()

    setError('')


    const savedUser =
      JSON.parse(localStorage.getItem('citizenUser'))


    if (!savedUser) {

      setError(
        'No citizen account found. Please register first.'
      )

      return

    }


    if (
      email.trim() === savedUser.email &&
      password === savedUser.password
    ) {

      localStorage.setItem(
        'citizenLoggedIn',
        'true'
      )

      navigate('/')

    } else {

      setError(
        'Invalid email or password. Please try again.'
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