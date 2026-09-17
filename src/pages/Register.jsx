import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Register.css'

function Register() {

  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  const handleRegister = (event) => {

    event.preventDefault()

    setError('')
    setSuccess('')


    // Password check
    if (password !== confirmPassword) {

      setError(
        'Passwords do not match.'
      )

      return

    }


    // Password length
    if (password.length < 6) {

      setError(
        'Password must contain at least 6 characters.'
      )

      return

    }


    // Check existing account
    const existingUser =
      JSON.parse(
        localStorage.getItem('citizenUser')
      )


    if (
      existingUser &&
      existingUser.email === email.trim()
    ) {

      setError(
        'An account with this email already exists. Please login.'
      )

      return

    }


    // Save citizen account
    const citizenUser = {

      name: name.trim(),

      email: email.trim(),

      phone: phone.trim(),

      password: password

    }


    localStorage.setItem(
      'citizenUser',
      JSON.stringify(citizenUser)
    )


    setSuccess(
      'Account created successfully. Redirecting to login...'
    )


    // Go to login
    setTimeout(() => {

      navigate('/login')

    }, 1500)

  }


  return (

    <div className="register-page">


      <div className="register-card">


        {/* HEADER */}

        <div className="register-header">


          <div className="register-logo">
            NB
          </div>


          <h1>
            Create Citizen Account
          </h1>


          <p>
            Register to report and track civic complaints
          </p>


        </div>



        {/* FORM */}

        <form onSubmit={handleRegister}>


          {/* NAME */}

          <div className="form-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
            />

          </div>



          {/* EMAIL */}

          <div className="form-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />

          </div>



          {/* PHONE */}

          <div className="form-group">

            <label>
              Mobile Number
            </label>

            <input
              type="tel"
              placeholder="Enter your mobile number"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              required
            />

          </div>



          {/* PASSWORD */}

          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

          </div>



          {/* CONFIRM PASSWORD */}

          <div className="form-group">

            <label>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
            />

          </div>



          {/* ERROR */}

          {error && (

            <div className="register-error">

              {error}

            </div>

          )}



          {/* SUCCESS */}

          {success && (

            <div className="register-success">

              {success}

            </div>

          )}



          {/* SUBMIT */}

          <button
            type="submit"
            className="register-button"
          >

            Create Account

          </button>


        </form>



        {/* FOOTER */}

        <div className="register-footer">


          <p>
            Already have an account?
          </p>


          <Link to="/login">
            Sign In
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


export default Register