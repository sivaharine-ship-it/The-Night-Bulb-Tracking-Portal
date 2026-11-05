import './App.css'
import './ProfilePage.css'
import './EditProfile.css'
import './MyComplaints.css'
import './ResponsiveFix.css'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import {
  UserRound,
  Pencil,
  ClipboardList,
  FilePlus,
  LogOut,
  Mail,
  Phone,
  ArrowLeft,
  PencilLine,
  ShieldCheck
} from 'lucide-react'



import Login from './pages/Login'

import Register from './pages/Register'
import ReportComplaint from './pages/ReportComplaint'
import OfficerLogin from './pages/OfficerLogin'
import OfficerDashboard from './pages/OfficerDashboard'



// ======================================================
// PRIORITY MAP - HOME PAGE ONLY
// ======================================================

function PriorityMap() {
  const [complaints, setComplaints] = useState([])

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const response = await fetch(
          'https://thenightbulbportal.infinityfree.me/get_complaints.php'
        )
        const data = await response.json()
        console.log('Homepage complaints:', data.complaints)

        if (data.success && Array.isArray(data.complaints)) {
          const formattedComplaints = data.complaints.map((complaint) => ({
            id: complaint.complaint_id,
            type: complaint.complaint_type,
            description: complaint.description,
            location: complaint.location,
            area: complaint.area,
            pincode: complaint.pincode,
            status: complaint.status || 'Registered',
            priority: complaint.priority || 'Medium',
            latitude:
              complaint.latitude !== null && complaint.latitude !== ''
                ? Number(complaint.latitude)
                : null,
            longitude:
              complaint.longitude !== null && complaint.longitude !== ''
                ? Number(complaint.longitude)
                : null
          }))

          setComplaints(formattedComplaints)
        }
      } catch (error) {
        console.error('Failed to load homepage map complaints:', error)
      }
    }

    loadComplaints()
    const interval = setInterval(loadComplaints, 5000)
    return () => clearInterval(interval)
  }, [])

  const createMarker = (priority) => {
    let markerColor = '#f59e0b'

    if (priority === 'High') markerColor = '#dc2626'
    if (priority === 'Low') markerColor = '#16a34a'

    return L.divIcon({
      className: '',
      html: `
        <div style="
          width:20px;
          height:20px;
          background:${markerColor};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 1px 5px rgba(0,0,0,0.35);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
  }

  const mappedComplaints = complaints.filter(
    (complaint) =>
      complaint.latitude !== null &&
      complaint.longitude !== null &&
      Number.isFinite(complaint.latitude) &&
      Number.isFinite(complaint.longitude)
  )

  return (
    <section
      id="priority-map"
      style={{
        padding: '70px 0',
        background: '#f5f8fb',
        width: '100%'
      }}
    >
      <div
        className="section-container"
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            marginBottom: '25px',
            textAlign: 'center'
          }}
        >
          <span className="eyebrow">COMPLAINT PRIORITY MAP</span>
          <h2 style={{ marginTop: '10px' }}>
            Complaint Priority Locations
          </h2>
          <p>
            View reported issues according to their priority.
          </p>
        </div>

        {/* Priority legend: centered above the map */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            margin: '0 auto 18px',
            flexWrap: 'wrap',
            fontSize: '14px',
            width: '100%',
            textAlign: 'center'
          }}
        >
          <span>
            <b style={{ color: '#dc2626' }}>●</b> High Priority
          </span>
          <span>
            <b style={{ color: '#f59e0b' }}>●</b> Medium Priority
          </span>
          <span>
            <b style={{ color: '#16a34a' }}>●</b> Low Priority
          </span>
        </div>

        <div
          style={{
            height: '430px',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #d8e1e9'
          }}
        >
          <MapContainer
            center={[11.0168, 76.9558]}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mappedComplaints.map((complaint) => (
              <Marker
                key={complaint.id}
                position={[complaint.latitude, complaint.longitude]}
                icon={createMarker(complaint.priority || 'Medium')}
              >
                <Popup>
                  <strong>{complaint.type}</strong>
                  <br />
                  Complaint ID: {complaint.id}
                  <br />
                  Priority: {complaint.priority || 'Medium'}
                  <br />
                  Location: {complaint.location}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {mappedComplaints.length === 0 && (
          <p
            style={{
              marginTop: '12px',
              fontSize: '13px',
              color: '#64748b',
              textAlign: 'center'
            }}
          >
            No complaint locations have been pinned by an officer yet.
          </p>
        )}
      </div>
    </section>
  )
}

function Home() {

  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const [trackResult, setTrackResult] = useState(null)

  const [citizenUser, setCitizenUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('citizenUser') || 'null')
    } catch {
      return null
    }
  })

  const handleLogout = () => {
    localStorage.removeItem('citizenLoggedIn')
    localStorage.removeItem('citizenUser')
    setCitizenUser(null)
  }


  // ================================
  // TRACK COMPLAINT
  // ================================

  const handleTrack = () => {

    const enteredId = trackingId.trim()

    if (!enteredId) {
      setTrackResult('Please enter your Complaint ID.')
      return
    }

    const complaints =
      JSON.parse(localStorage.getItem('complaints')) || []

    const complaint = complaints.find(
      (item) => item.id === enteredId
    )

    if (complaint) {

      setTrackResult(
        `Complaint found. Current Status: ${complaint.status || 'Registered'}`
      )

    } else {

      setTrackResult(
        'Complaint ID not found. Please check the ID and try again.'
      )

    }

  }


  return (

    <div className="portal">


      {/* ================================
          HEADER
      ================================= */}

      <header className="site-header">

        <div className="header-inner">

          <Link to="/" className="site-logo">

            <div className="logo-mark">
              NB
            </div>

            <div className="logo-text">

              <strong>
                The Night Bulb
              </strong>

              <span>
                Tracking Portal
              </span>

            </div>

          </Link>


          <nav className="header-nav">

            <a href="#services">
              Services
            </a>

            <a href="#process">
              How It Works
            </a>

            <a href="#priority-map">
              Priority Map
            </a>

            <a href="#track">
              Track Complaint
            </a>


            {citizenUser ? (
              <div className="citizen-account">
                <button
                  type="button"
                  className="citizen-account-trigger"
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((open) => !open)}
                >
                  <span className="citizen-avatar">
                    {(citizenUser.name || 'C').charAt(0).toUpperCase()}
                  </span>
                  <span className="citizen-welcome">
                    Welcome back, <strong>{citizenUser.name}</strong>
                  </span>
                  <span className="citizen-chevron">
                    {profileMenuOpen ? '▲' : '▼'}
                  </span>
                </button>

                {profileMenuOpen && (
                  <div className="citizen-profile-menu">
                    <div className="profile-menu-heading">
                      <div className="profile-menu-avatar">
                        <UserRound size={30} />
                      </div>
                      <div>
                        <strong>Welcome back, {citizenUser.name}!</strong>
                        <span>Citizen Account</span>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <UserRound size={21} />
                      <div>
                        <strong>My Profile</strong>
                        <span>View account details</span>
                      </div>
                    </Link>

                    <Link
                      to="/edit-profile"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Pencil size={21} />
                      <div>
                        <strong>Edit Profile</strong>
                        <span>Update name, email and phone</span>
                      </div>
                    </Link>

                    <Link
                      to="/my-complaints"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <ClipboardList size={21} />
                      <div>
                        <strong>My Complaints</strong>
                        <span>View complaints and status</span>
                      </div>
                    </Link>

                    <Link
                      to="/report"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <FilePlus size={21} />
                      <div>
                        <strong>Report a Complaint</strong>
                        <span>Open the complaint form</span>
                      </div>
                    </Link>

                    <button
                      type="button"
                      className="citizen-logout"
                      onClick={() => {
                        handleLogout()
                        setProfileMenuOpen(false)
                      }}
                    >
                      <LogOut size={21} />
                      <strong>Logout</strong>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Link to="/login" className="nav-login">
                  Login
                </Link>

                <Link
                  to="/register"
                  className="nav-login"
                  style={{
                    background: '#0b4a8b',
                    color: '#ffffff',
                    borderColor: '#0b4a8b'
                  }}
                >
                  Register
                </Link>
              </div>
            )}


            <Link
              to="/officer-login"
              className="nav-officer-login"
            >
              Officer Login
            </Link>

          </nav>

        </div>

      </header>


      {/* ================================
          HERO
      ================================= */}

      <main>

        <section className="hero">

          <div className="hero-inner">


            <div className="hero-copy">

              <div className="eyebrow">
                CIVIC COMPLAINT PORTAL
              </div>


              <h1>

                Report an issue.

                <br />

                <span>
                  Track the solution.
                </span>

              </h1>


              <p>
                Report non-working streetlights, damaged roads and
                potholes online. Submit the details, track your
                complaint and follow its progress until resolution.
              </p>


              <div className="hero-actions">

                <Link
                  to="/report"
                  className="btn-primary"
                >
                  Report an Issue
                </Link>


                <a
                  href="#track"
                  className="btn-secondary"
                >
                  Track Complaint
                </a>

              </div>


              <div className="hero-note">

                <span className="note-line"></span>

                Simple. Transparent. Trackable.

              </div>

            </div>


            {/* ================================
                TRACKING CARD
            ================================= */}

            <div className="hero-panel">


              <div className="panel-top">

                <div>

                  <span>
                    COMPLAINT TRACKING
                  </span>

                  <h2>
                    Check Status
                  </h2>

                </div>


                <div className="panel-number">
                  01
                </div>

              </div>


              <div className="panel-form">

                <label>
                  Complaint ID
                </label>


                <input
                  type="text"
                  placeholder="e.g. NBT-2026-00125"
                  value={trackingId}
                  onChange={(event) =>
                    setTrackingId(event.target.value)
                  }
                />


                <button
                  type="button"
                  onClick={handleTrack}
                >
                  Track Complaint
                </button>

              </div>


              {/* TRACK RESULT */}

              {trackResult && (

                <div
                  style={{
                    marginTop: '15px',
                    padding: '12px',
                    background: '#f4f8fb',
                    border: '1px solid #d8e1e9',
                    color: '#263f57',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}
                >
                  {trackResult}
                </div>

              )}


              <div className="panel-divider"></div>


              <div className="sample-status">

                <div className="status-heading">

                  <span>
                    RECENT COMPLAINT
                  </span>

                  <strong>
                    ACTIVE
                  </strong>

                </div>


                <h3>
                  Streetlight Complaint
                </h3>


                <p>
                  Complaint ID: NBT-2026-00125
                </p>


                <div className="mini-progress">


                  <div className="progress-item done">

                    <span>
                      01
                    </span>

                    <small>
                      Registered
                    </small>

                  </div>


                  <div className="progress-item done">

                    <span>
                      02
                    </span>

                    <small>
                      Verified
                    </small>

                  </div>


                  <div className="progress-item">

                    <span>
                      03
                    </span>

                    <small>
                      Repair
                    </small>

                  </div>


                  <div className="progress-item">

                    <span>
                      04
                    </span>

                    <small>
                      Resolved
                    </small>

                  </div>


                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ================================
            SERVICES
        ================================= */}

        <section
          className="services"
          id="services"
        >

          <div className="section-container">


            <div className="section-heading">

              <div>

                <span className="eyebrow">
                  CITIZEN SERVICES
                </span>

                <h2>
                  What can you report?
                </h2>

              </div>


              <p>
                Select the type of civic issue you want to report.
              </p>

            </div>


            <div className="service-grid">


              {/* STREETLIGHT */}

              <div className="service-card">

                <div className="service-top">

                  <span className="service-number">
                    01
                  </span>

                  <span className="service-line"></span>

                </div>


                <h3>

                  Non-Working

                  <br />

                  Streetlight

                </h3>


                <p>
                  Report streetlights that are not functioning
                  or require maintenance.
                </p>


                <Link to="/report">

                  Report Issue

                  <span>
                    →
                  </span>

                </Link>

              </div>


              {/* DAMAGED ROAD */}

              <div className="service-card">

                <div className="service-top">

                  <span className="service-number">
                    02
                  </span>

                  <span className="service-line"></span>

                </div>


                <h3>

                  Damaged

                  <br />

                  Road

                </h3>


                <p>
                  Report damaged or unsafe road conditions
                  requiring attention.
                </p>


                <Link to="/report">

                  Report Issue

                  <span>
                    →
                  </span>

                </Link>

              </div>


              {/* POTHOLE */}

              <div className="service-card">

                <div className="service-top">

                  <span className="service-number">
                    03
                  </span>

                  <span className="service-line"></span>

                </div>


                <h3>

                  Road

                  <br />

                  Pothole

                </h3>


                <p>
                  Report potholes that may require inspection
                  and repair.
                </p>


                <Link to="/report">

                  Report Issue

                  <span>
                    →
                  </span>

                </Link>

              </div>


            </div>

          </div>

        </section>


        {/* ================================
            PROCESS
        ================================= */}

        <section
          className="process"
          id="process"
        >

          <div className="section-container">


            <div className="center-heading">

              <span className="eyebrow">
                COMPLAINT PROCESS
              </span>

              <h2>
                From report to resolution
              </h2>

              <p>
                Every complaint follows a structured process.
              </p>

            </div>


            <div className="process-list">


              <div className="process-item">

                <span>
                  01
                </span>

                <div>

                  <h3>
                    Register
                  </h3>

                  <p>
                    Submit the complaint with required details.
                  </p>

                </div>

              </div>


              <div className="process-item">

                <span>
                  02
                </span>

                <div>

                  <h3>
                    Verify
                  </h3>

                  <p>
                    The submitted complaint is reviewed.
                  </p>

                </div>

              </div>


              <div className="process-item">

                <span>
                  03
                </span>

                <div>

                  <h3>
                    Assign
                  </h3>

                  <p>
                    The complaint is assigned for action.
                  </p>

                </div>

              </div>


              <div className="process-item">

                <span>
                  04
                </span>

                <div>

                  <h3>
                    Repair
                  </h3>

                  <p>
                    Required maintenance work is carried out.
                  </p>

                </div>

              </div>


              <div className="process-item">

                <span>
                  05
                </span>

                <div>

                  <h3>
                    Resolve
                  </h3>

                  <p>
                    The final status is updated.
                  </p>

                </div>

              </div>


            </div>

          </div>

        </section>


        {/* ================================
            PRIORITY MAP
        ================================= */}

        <PriorityMap />


        {/* ================================
            TRACK
        ================================= */}

        <section
          className="track"
          id="track"
        >

          <div className="track-inner">


            <div>

              <span className="eyebrow">
                COMPLAINT TRACKING
              </span>


              <h2>

                Know where your

                <br />

                complaint stands.

              </h2>


              <p>
                Use your unique Complaint ID to check the
                current status of your submitted complaint.
              </p>

            </div>


            <div className="track-form">

              <label>
                Enter Complaint ID
              </label>


              <div className="track-input">

                <input
                  type="text"
                  placeholder="NBT-2026-00125"
                  value={trackingId}
                  onChange={(event) =>
                    setTrackingId(event.target.value)
                  }
                />


                <button
                  type="button"
                  onClick={handleTrack}
                >
                  Track
                </button>

              </div>


              {/* TRACK RESULT */}

              {trackResult && (

                <div
                  style={{
                    marginTop: '15px',
                    padding: '14px',
                    background: '#ffffff',
                    border: '1px solid #d8e1e9',
                    color: '#263f57',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}
                >
                  {trackResult}
                </div>

              )}

            </div>

          </div>

        </section>


        {/* ================================
            FOOTER
        ================================= */}

        <footer className="footer">

          <div className="footer-inner">


            <div>

              <div className="footer-brand">

                <div className="logo-mark">
                  NB
                </div>


                <div className="logo-text">

                  <strong>
                    The Night Bulb
                  </strong>

                  <span>
                    Tracking Portal
                  </span>

                </div>

              </div>


              <p>
                A simple platform for reporting and tracking
                civic complaints.
              </p>

            </div>


            <div className="footer-column">

              <strong>
                Portal
              </strong>

              <a href="#services">
                Services
              </a>

              <a href="#process">
                How It Works
              </a>

              <a href="#priority-map">
                Priority Map
              </a>

              <a href="#track">
                Track Complaint
              </a>

            </div>


            <div className="footer-column">

              <strong>
                Account
              </strong>

              <Link to="/login">
                Login
              </Link>

              <Link to="/register">
                Create Account
              </Link>

              <Link to="/officer-login">
                Officer Login
              </Link>

            </div>


          </div>


          <div className="footer-bottom">

            © 2026 The Night Bulb Tracking Portal

          </div>

        </footer>


      </main>

    </div>

  )

}
function ProtectedReport() {
  const isLoggedIn =
    localStorage.getItem('citizenLoggedIn') === 'true'

  return isLoggedIn
    ? <ReportComplaint />
    : <Navigate to="/login" replace />
}

function CitizenProfilePage() {
  let user = null
  try {
    user = JSON.parse(localStorage.getItem('citizenUser') || 'null')
  } catch {
    user = null
  }

  if (!user) return <Navigate to="/login" replace />

  const displayName = user.name || 'Citizen'
  const initial = displayName.trim().charAt(0).toUpperCase() || 'C'

  return (
    <div className="profile-page">
      <header className="profile-page-header">
        <Link to="/" className="profile-page-brand">
          <span className="profile-page-logo">NB</span>
          <span className="profile-page-brand-text">
            <strong>The Night Bulb</strong>
            <small>Tracking Portal</small>
          </span>
        </Link>
        <Link to="/" className="profile-back-link">
          <ArrowLeft size={17} />
          Back to Home
        </Link>
      </header>

      <main className="profile-page-main">
        <div className="profile-page-intro">
          <span className="profile-eyebrow">CITIZEN ACCOUNT</span>
          <h1>My Profile</h1>
          <p>View your registered account information in one place.</p>
        </div>

        <section className="profile-card" aria-label="Citizen profile details">
          <div className="profile-card-top">
            <div className="profile-large-avatar">{initial}</div>
            <div className="profile-card-identity">
              <h2>{displayName}</h2>
              <p><ShieldCheck size={16} /> Registered Citizen</p>
            </div>
            <Link to="/edit-profile" className="profile-edit-button">
              <PencilLine size={16} />
              Edit Profile
            </Link>
          </div>

          <div className="profile-card-divider" />

          <div className="profile-details-heading">
            <h3>Personal Information</h3>
            <p>Your details associated with this account.</p>
          </div>

          <div className="profile-details-grid">
            <div className="profile-detail-item">
              <span className="profile-detail-icon"><UserRound size={20} /></span>
              <div>
                <span className="profile-detail-label">Full Name</span>
                <strong>{user.name || 'Not provided'}</strong>
              </div>
            </div>
            <div className="profile-detail-item">
              <span className="profile-detail-icon"><Mail size={20} /></span>
              <div>
                <span className="profile-detail-label">Email Address</span>
                <strong>{user.email || 'Not provided'}</strong>
              </div>
            </div>
            <div className="profile-detail-item">
              <span className="profile-detail-icon"><Phone size={20} /></span>
              <div>
                <span className="profile-detail-label">Phone Number</span>
                <strong>{user.phone || 'Not provided'}</strong>
              </div>
            </div>
          </div>

          <div className="profile-card-footer">
            <span>Your account information is shown here.</span>
            <Link to="/">Return to homepage</Link>
          </div>
        </section>
      </main>
    </div>
  )
}

function EditProfilePage() {
  const user = JSON.parse(localStorage.getItem('citizenUser') || 'null')

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [message, setMessage] = useState('')


const handleSave = async (event) => {
  event.preventDefault()
  setMessage('Saving profile...')

  try {
    const response = await fetch(
      'https://thenightbulbportal.infinityfree.me/update_profile.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      }
    )

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('PHP response is not JSON:', responseText)
      setMessage('PHP error: Check the browser console.')
      return
    }

    if (!response.ok || !data.success) {
      setMessage(data.message || 'Profile update failed.')
      return
    }

    const updatedUser = data.user || {
      ...user,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    }

    localStorage.setItem('citizenUser', JSON.stringify(updatedUser))
    setMessage('Profile updated successfully!')
  } catch (error) {
    console.error('Profile update error:', error)
    setMessage(
      'Connection failed. Check PHP server and CORS settings.'
    )
  }
}


  
   
  

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">

        <header className="edit-profile-header">
          <span className="profile-eyebrow">CITIZEN ACCOUNT</span>
          <h1>Edit Profile</h1>
          <p>Update your citizen account details.</p>
        </header>

        <section className="edit-profile-card">
          <form onSubmit={handleSave} className="edit-profile-form">

            <div className="edit-profile-field">
              <label htmlFor="edit-name">Full Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setMessage('')
                }}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="edit-profile-field">
              <label htmlFor="edit-email">Email Address</label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setMessage('')
                }}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="edit-profile-field">
              <label htmlFor="edit-phone">Phone Number</label>
              <input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                  setMessage('')
                }}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="edit-profile-actions">
              <button
                type="submit"
                className="edit-profile-save"
              >
                Save Changes
              </button>

              <Link
                to="/profile"
                className="edit-profile-cancel"
              >
                Cancel
              </Link>
            </div>

            {message && (
              <p role="status" style={{ color: '#176b43', fontSize: '14px' }}>
                {message}
              </p>
            )}

          </form>
        </section>

      </div>
    </div>
  )
}

function MyComplaintsPage() {
  const user = JSON.parse(localStorage.getItem('citizenUser') || 'null')

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="my-complaints-page">
      <div className="my-complaints-header">
        <h1>My Complaints</h1>
        <p>
          Track your reported issues and check their current status.
        </p>
      </div>

      <div className="my-complaints-summary">
        <div className="my-complaints-summary-card">
          <h3>Total Complaints</h3>
          <p className="summary-number">0</p>
        </div>

        <div className="my-complaints-summary-card">
          <h3>In Progress</h3>
          <p className="summary-number">0</p>
        </div>

        <div className="my-complaints-summary-card">
          <h3>Resolved</h3>
          <p className="summary-number">0</p>
        </div>
      </div>

      <div className="my-complaints-toolbar">
        <h2>Your Complaint History</h2>
      </div>

      <div className="my-complaints-empty">
        <h3>No Complaints Yet</h3>
        <p>
          You have not reported any complaints yet.
          Once you submit a complaint, it will appear here.
        </p>

        <Link to="/report" className="my-complaints-back">
          + Report a Complaint
        </Link>
      </div>

      <Link to="/" className="my-complaints-back">
        ← Back to Home
      </Link>
    </div>
  )
}


function App() {

  return (

    <BrowserRouter>

      <Routes>


        <Route
          path="/"
          element={<Home />}
        />


        <Route
          path="/login"
          element={<Login />}
        />


        <Route
          path="/register"
          element={<Register />}
        />


<Route
  path="/report"
  element={<ProtectedReport />}

/>

    


        <Route path="/profile" element={<CitizenProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/my-complaints" element={<MyComplaintsPage />} />

        <Route
          path="/officer-login"
          element={<OfficerLogin />}
        />


        <Route
          path="/officer-dashboard"
          element={<OfficerDashboard />}
        />


      </Routes>

    </BrowserRouter>

  )

}


export default App