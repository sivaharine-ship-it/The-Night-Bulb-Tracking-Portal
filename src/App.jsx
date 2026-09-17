import './App.css'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'


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

    const loadComplaints = () => {
      const savedComplaints =
        JSON.parse(localStorage.getItem('complaints')) || []

      setComplaints(savedComplaints)
    }

    loadComplaints()

    const interval = setInterval(loadComplaints, 1000)

    return () => clearInterval(interval)

  }, [])

  const createMarker = (priority) => {

    let markerColor = '#f59e0b'

    if (priority === 'High') {
      markerColor = '#dc2626'
    }

    if (priority === 'Low') {
      markerColor = '#16a34a'
    }

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
      complaint.latitude !== undefined &&
      complaint.longitude !== undefined &&
      complaint.latitude !== null &&
      complaint.longitude !== null
  )

  return (
    <section
      id="priority-map"
      style={{
        padding: '70px 0',
        background: '#f5f8fb'
      }}
    >
      <div
        className="section-container"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}
      >
        <div style={{ marginBottom: '25px' }}>
          <span className="eyebrow">
            COMPLAINT PRIORITY MAP
          </span>

          <h2 style={{ marginTop: '10px' }}>
            Complaint Priority Locations
          </h2>

          <p>
            View reported issues according to their priority.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '18px',
            flexWrap: 'wrap',
            fontSize: '14px'
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
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #d8e1e9'
          }}
        >
          <MapContainer
            center={[11.0168, 76.9558]}
            zoom={13}
            style={{
              height: '100%',
              width: '100%'
            }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mappedComplaints.map((complaint) => (
              <Marker
                key={complaint.id}
                position={[
                  complaint.latitude,
                  complaint.longitude
                ]}
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
              color: '#64748b'
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

  const [trackingId, setTrackingId] = useState('')
  const [trackResult, setTrackResult] = useState(null)


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


            <Link
              to="/login"
              className="nav-login"
            >
              Login
            </Link>


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
          element={<ReportComplaint />}
        />


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