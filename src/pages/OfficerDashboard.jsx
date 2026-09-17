import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './OfficerDashboard.css'

function OfficerMapClick({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng)
    }
  })

  return null
}

function OfficerDashboard() {
  const navigate = useNavigate()

  const [complaints, setComplaints] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [mapComplaintId, setMapComplaintId] = useState('')
  const [resolutionPhoto, setResolutionPhoto] = useState(null)

  // NEW: notification popup
  const [notificationComplaint, setNotificationComplaint] =
    useState(null)

  // NEW: remembers complaints already seen by dashboard
  const knownComplaintIds = useRef(new Set())

  // =========================================
  // LOAD COMPLAINTS + AUTOMATIC NOTIFICATION
  // =========================================

  useEffect(() => {
    const loggedIn = localStorage.getItem('officerLoggedIn')

    if (loggedIn !== 'true') {
      navigate('/officer-login')
      return
    }

    const loadComplaints = (isInitialLoad = false) => {
      const savedComplaints =
        JSON.parse(localStorage.getItem('complaints')) || []

      setComplaints(savedComplaints)

      // First time dashboard loads
      if (isInitialLoad) {
        savedComplaints.forEach((complaint) => {
          knownComplaintIds.current.add(complaint.id)
        })

        // Show notification for existing new complaint
        const newComplaints = savedComplaints.filter(
          (complaint) => complaint.isNew === true
        )

        if (newComplaints.length > 0) {
          setNotificationComplaint(
            newComplaints[newComplaints.length - 1]
          )
        }

        return
      }

      // Check whether a completely new complaint was added
      const newlyAddedComplaint = savedComplaints.find(
        (complaint) =>
          !knownComplaintIds.current.has(complaint.id)
      )

      if (newlyAddedComplaint) {
        setNotificationComplaint(newlyAddedComplaint)
      }

      // Remember all current complaint IDs
      savedComplaints.forEach((complaint) => {
        knownComplaintIds.current.add(complaint.id)
      })
    }

    // Initial load
    loadComplaints(true)

    // Check every second for new complaints
    const interval = setInterval(() => {
      loadComplaints(false)
    }, 1000)

    // Also listen for localStorage changes from another browser tab
    const handleStorageChange = () => {
      loadComplaints(false)
    }

    window.addEventListener(
      'storage',
      handleStorageChange
    )

    return () => {
      clearInterval(interval)

      window.removeEventListener(
        'storage',
        handleStorageChange
      )
    }
  }, [navigate])

  // =========================================
  // FILTERS
  // =========================================

  const newComplaints = complaints.filter(
    (complaint) => complaint.isNew === true
  )

  const registeredComplaints = complaints.filter(
    (complaint) => complaint.status === 'Registered'
  )

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === 'Resolved'
  )

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    localStorage.removeItem('officerLoggedIn')
    navigate('/officer-login')
  }

  // =========================================
  // VIEW COMPLAINT
  // =========================================

  const handleView = (complaint) => {
    setSelectedComplaint(complaint)
  }

  // =========================================
  // CLOSE COMPLAINT MODAL
  // =========================================

  const handleClose = () => {
    setSelectedComplaint(null)
  }

  // =========================================
  // PLACE MAP PIN
  // =========================================

  const handleMapPin = (latitude, longitude) => {
    if (!mapComplaintId) {
      alert('Please select a complaint before placing a pin.')
      return
    }

    const updatedComplaints = complaints.map((complaint) =>
      complaint.id === mapComplaintId
        ? {
            ...complaint,
            latitude,
            longitude
          }
        : complaint
    )

    setComplaints(updatedComplaints)

    localStorage.setItem(
      'complaints',
      JSON.stringify(updatedComplaints)
    )

    const updatedComplaint = updatedComplaints.find(
      (complaint) => complaint.id === mapComplaintId
    )

    if (selectedComplaint?.id === mapComplaintId) {
      setSelectedComplaint(updatedComplaint)
    }
  }

  // =========================================
  // RESOLUTION PHOTO
  // =========================================

  const handleResolutionPhoto = (event) => {
    const selectedPhoto = event.target.files[0]

    if (!selectedPhoto) {
      return
    }

    const reader = new FileReader()

    reader.onloadend = () => {
      setResolutionPhoto(reader.result)
    }

    reader.readAsDataURL(selectedPhoto)
  }

  const handleMarkResolved = () => {
    if (!selectedComplaint) {
      return
    }

    if (!resolutionPhoto) {
      alert('Please upload a resolution photo before marking the complaint as resolved.')
      return
    }

    const updatedComplaints = complaints.map((complaint) =>
      complaint.id === selectedComplaint.id
        ? {
            ...complaint,
            status: 'Resolved',
            isNew: false,
            resolutionPhoto: resolutionPhoto,
            resolutionDate: new Date().toLocaleString()
          }
        : complaint
    )

    setComplaints(updatedComplaints)

    localStorage.setItem(
      'complaints',
      JSON.stringify(updatedComplaints)
    )

    const updatedComplaint = updatedComplaints.find(
      (complaint) => complaint.id === selectedComplaint.id
    )

    setSelectedComplaint(updatedComplaint)
    setResolutionPhoto(null)

    alert('Complaint marked as resolved successfully.')
  }

  // =========================================
  // STATUS CHANGE
  // =========================================

  const handleStatusChange = (
    complaintId,
    newStatus
  ) => {
    const updatedComplaints = complaints.map(
      (complaint) =>
        complaint.id === complaintId
          ? {
              ...complaint,
              status: newStatus,
              isNew: false
            }
          : complaint
    )

    setComplaints(updatedComplaints)

    localStorage.setItem(
      'complaints',
      JSON.stringify(updatedComplaints)
    )

    if (selectedComplaint?.id === complaintId) {
      const updatedComplaint = updatedComplaints.find(
        (complaint) => complaint.id === complaintId
      )

      setSelectedComplaint(updatedComplaint)
    }
  }

  // =========================================
  // PRIORITY CHANGE
  // =========================================

  const handlePriorityChange = (
    complaintId,
    newPriority
  ) => {
    const updatedComplaints = complaints.map(
      (complaint) =>
        complaint.id === complaintId
          ? {
              ...complaint,
              priority: newPriority
            }
          : complaint
    )

    setComplaints(updatedComplaints)

    localStorage.setItem(
      'complaints',
      JSON.stringify(updatedComplaints)
    )

    if (selectedComplaint?.id === complaintId) {
      const updatedComplaint = updatedComplaints.find(
        (complaint) => complaint.id === complaintId
      )

      setSelectedComplaint(updatedComplaint)
    }
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="dashboard-page">

      {/* =========================================
          HEADER
      ========================================= */}

      <header className="dashboard-header">

        <div>
          <h1>
            The Night Bulb Tracking Portal
          </h1>

          <p>
            Officer Complaint Management Dashboard
          </p>
        </div>

        <div className="dashboard-header-right">

          <div className="notification-box">
            New Complaints

            <span>
              {newComplaints.length}
            </span>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* =========================================
          MAIN DASHBOARD
      ========================================= */}

      <main className="dashboard-container">

        {/* =========================================
            WELCOME
        ========================================= */}

        <section className="dashboard-welcome">

          <div>

            <h2>
              Officer Dashboard
            </h2>

            <p>
              Monitor, verify and manage citizen complaints.
            </p>

          </div>

        </section>


        {/* =========================================
            SUMMARY CARDS
        ========================================= */}

        <section className="dashboard-cards">

          <div className="dashboard-card">

            <span>
              Total Complaints
            </span>

            <strong>
              {complaints.length}
            </strong>

          </div>


          <div className="dashboard-card">

            <span>
              New Complaints
            </span>

            <strong>
              {newComplaints.length}
            </strong>

          </div>


          <div className="dashboard-card">

            <span>
              Registered
            </span>

            <strong>
              {registeredComplaints.length}
            </strong>

          </div>


          <div className="dashboard-card">

            <span>
              Resolved
            </span>

            <strong>
              {resolvedComplaints.length}
            </strong>

          </div>

        </section>


        {/* =========================================
            COMPLAINT NOTIFICATIONS
        ========================================= */}

        <section className="notification-section">

          <div className="section-title">

            <h2>
              Complaint Notifications
            </h2>

            <span>
              {newComplaints.length} New
            </span>

          </div>


          {newComplaints.length === 0 ? (

            <div className="empty-notification">
              No new complaints available.
            </div>

          ) : (

            <div className="notification-list">

              {newComplaints.map((complaint) => (

                <div
                  className="notification-item"
                  key={complaint.id}
                >

                  <div>

                    <strong>
                      New Complaint Received
                    </strong>

                    <p>
                      Complaint ID: {complaint.id}
                    </p>

                    <p>
                      Type: {complaint.type}
                    </p>

                  </div>


                  <button
                    onClick={() =>
                      handleView(complaint)
                    }
                  >
                    View
                  </button>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* =========================================
            COMPLAINT PRIORITY MAP
        ========================================= */}

        <section
          style={{
            marginBottom: '30px',
            background: '#ffffff',
            padding: '25px',
            borderRadius: '10px',
            border: '1px solid #d8e1e9'
          }}
        >

          <div
            style={{
              marginBottom: '18px'
            }}
          >

            <h2
              style={{
                marginBottom: '6px'
              }}
            >
              Complaint Priority Map
            </h2>

            <p
              style={{
                margin: 0,
                color: '#64748b'
              }}
            >
              Select a complaint and click on the map
              to place or move its pin.
            </p>

          </div>


          <div
            style={{
              marginBottom: '18px'
            }}
          >

            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600'
              }}
            >
              Select Complaint
            </label>


            <select
              value={mapComplaintId}
              onChange={(e) =>
                setMapComplaintId(e.target.value)
              }
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px'
              }}
            >

              <option value="">
                Select a complaint
              </option>


              {complaints.map((complaint) => (

                <option
                  key={complaint.id}
                  value={complaint.id}
                >
                  {complaint.id} - {complaint.type}
                </option>

              ))}

            </select>

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
              center={[
                11.0168,
                76.9558
              ]}
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


              <OfficerMapClick
                onMapClick={handleMapPin}
              />


              {complaints
                .filter(
                  (complaint) =>
                    complaint.latitude !== undefined &&
                    complaint.longitude !== undefined &&
                    complaint.latitude !== null &&
                    complaint.longitude !== null
                )
                .map((complaint) => {

                  let markerColor = '#f59e0b'

                  if (
                    complaint.priority === 'High'
                  ) {
                    markerColor = '#dc2626'
                  }

                  if (
                    complaint.priority === 'Low'
                  ) {
                    markerColor = '#16a34a'
                  }


                  const markerIcon = L.divIcon({
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
                    iconSize: [
                      20,
                      20
                    ],
                    iconAnchor: [
                      10,
                      10
                    ]
                  })


                  return (

                    <Marker
                      key={complaint.id}
                      position={[
                        complaint.latitude,
                        complaint.longitude
                      ]}
                      icon={markerIcon}
                    >

                      <Popup>

                        <strong>
                          {complaint.type}
                        </strong>

                        <br />

                        Complaint ID: {complaint.id}

                        <br />

                        Priority:{' '}
                        {complaint.priority ||
                          'Medium'}

                      </Popup>

                    </Marker>

                  )

                })}

            </MapContainer>

          </div>

        </section>


        {/* =========================================
            ALL COMPLAINTS
        ========================================= */}

        <section className="complaints-section">

          <div className="section-title">

            <h2>
              All Complaints
            </h2>

            <span>
              {complaints.length} Records
            </span>

          </div>


          {complaints.length === 0 ? (

            <div className="empty-notification">
              No complaints have been submitted yet.
            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      Complaint ID
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Priority
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {complaints.map(
                    (complaint) => (

                      <tr
                        key={complaint.id}
                      >

                        <td>
                          {complaint.id}
                        </td>


                        <td>
                          {complaint.type}
                        </td>


                        <td>
                          {complaint.location}
                        </td>


                        <td>
                          {complaint.date}
                        </td>


                        <td>

                          <select
                            className="table-select"
                            value={
                              complaint.priority ||
                              'Medium'
                            }
                            onChange={(e) =>
                              handlePriorityChange(
                                complaint.id,
                                e.target.value
                              )
                            }
                          >

                            <option value="Low">
                              Low
                            </option>

                            <option value="Medium">
                              Medium
                            </option>

                            <option value="High">
                              High
                            </option>

                          </select>

                        </td>


                        <td>

                          <select
                            className="table-select"
                            value={
                              complaint.status ||
                              'Registered'
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                complaint.id,
                                e.target.value
                              )
                            }
                          >

                            <option value="Registered">
                              Registered
                            </option>

                            <option value="Verified">
                              Verified
                            </option>

                            <option value="Assigned">
                              Assigned
                            </option>

                            <option value="Repair">
                              Repair
                            </option>

                            <option value="Resolved">
                              Resolved
                            </option>

                          </select>

                        </td>


                        <td>

                          <button
                            className="view-btn"
                            onClick={() =>
                              handleView(
                                complaint
                              )
                            }
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>


      {/* =========================================
          NEW COMPLAINT POPUP
      ========================================= */}

      {notificationComplaint && (

        <div
          style={{
            position: 'fixed',
            top: '25px',
            right: '25px',
            width: '360px',
            background: '#ffffff',
            border: '1px solid #d8e1e9',
            borderRadius: '10px',
            boxShadow:
              '0 8px 30px rgba(0,0,0,0.15)',
            padding: '22px',
            zIndex: 3000
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}
          >

            <strong
              style={{
                fontSize: '18px',
                color: '#1e3a5f'
              }}
            >
              NEW COMPLAINT
            </strong>


            <button
              onClick={() =>
                setNotificationComplaint(null)
              }
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              X
            </button>

          </div>


          <p
            style={{
              marginBottom: '8px',
              color: '#475569'
            }}
          >
            A new citizen complaint has been received.
          </p>


          <p>
            <strong>
              Complaint ID:
            </strong>{' '}
            {notificationComplaint.id}
          </p>


          <p>
            <strong>
              Type:
            </strong>{' '}
            {notificationComplaint.type}
          </p>


          <p>
            <strong>
              Priority:
            </strong>{' '}
            {notificationComplaint.priority ||
              'Medium'}
          </p>


          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '16px'
            }}
          >

            <button
              onClick={() => {
                setSelectedComplaint(
                  notificationComplaint
                )

                setNotificationComplaint(null)
              }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '6px',
                background: '#1e3a5f',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              View Complaint
            </button>


            <button
              onClick={() =>
                setNotificationComplaint(null)
              }
              style={{
                padding: '10px 15px',
                border:
                  '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Close
            </button>

          </div>

        </div>

      )}


      {/* =========================================
          COMPLAINT DETAILS MODAL
      ========================================= */}

      {selectedComplaint && (

        <div className="modal-overlay">

          <div className="complaint-modal">

            <div className="modal-header">

              <h2>
                Complaint Details
              </h2>


              <button
                className="close-btn"
                onClick={handleClose}
              >
                Close
              </button>

            </div>


            <div className="complaint-details">

              <div>

                <label>
                  Complaint ID
                </label>

                <p>
                  {selectedComplaint.id}
                </p>

              </div>


              <div>

                <label>
                  Complaint Type
                </label>

                <p>
                  {selectedComplaint.type}
                </p>

              </div>


              <div>

                <label>
                  Description
                </label>

                <p>
                  {selectedComplaint.description}
                </p>

              </div>


              <div>

                <label>
                  Location
                </label>

                <p>
                  {selectedComplaint.location}
                </p>

              </div>


              <div>

                <label>
                  Area
                </label>

                <p>
                  {selectedComplaint.area}
                </p>

              </div>


              <div>

                <label>
                  Pincode
                </label>

                <p>
                  {selectedComplaint.pincode}
                </p>

              </div>


              <div>

                <label>
                  Priority
                </label>


                <select
                  className="modal-select"
                  value={
                    selectedComplaint.priority ||
                    'Medium'
                  }
                  onChange={(e) =>
                    handlePriorityChange(
                      selectedComplaint.id,
                      e.target.value
                    )
                  }
                >

                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                </select>

              </div>


              <div>

                <label>
                  Status
                </label>


                <select
                  className="modal-select"
                  value={
                    selectedComplaint.status ||
                    'Registered'
                  }
                  onChange={(e) =>
                    handleStatusChange(
                      selectedComplaint.id,
                      e.target.value
                    )
                  }
                >

                  <option value="Registered">
                    Registered
                  </option>

                  <option value="Verified">
                    Verified
                  </option>

                  <option value="Assigned">
                    Assigned
                  </option>

                  <option value="Repair">
                    Repair
                  </option>

                  <option value="Resolved">
                    Resolved
                  </option>

                </select>

              </div>


              <div>

                <label>
                  Date Submitted
                </label>

                <p>
                  {selectedComplaint.date}
                </p>

              </div>


              {/* PHOTO */}

              {selectedComplaint.photoPreview && (

                <div className="complaint-photo">

                  <label>
                    Uploaded Photo
                  </label>


                  <img
                    src={
                      selectedComplaint.photoPreview
                    }
                    alt="Complaint evidence"
                  />

                </div>

              )}

              {/* RESOLUTION PROOF */}

              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e2e8f0'
                }}
              >

                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600'
                  }}
                >
                  Resolution Proof Photo
                </label>

                <p
                  style={{
                    marginTop: 0,
                    marginBottom: '12px',
                    color: '#64748b'
                  }}
                >
                  Upload a photo showing that the reported problem has been repaired.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleResolutionPhoto}
                />

                {resolutionPhoto && (

                  <div
                    style={{
                      marginTop: '15px'
                    }}
                  >

                    <p
                      style={{
                        marginBottom: '8px',
                        fontWeight: '600'
                      }}
                    >
                      New Resolution Photo
                    </p>

                    <img
                      src={resolutionPhoto}
                      alt="Resolution proof"
                      style={{
                        width: '100%',
                        maxWidth: '400px',
                        maxHeight: '280px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #d8e1e9'
                      }}
                    />

                  </div>

                )}

                {selectedComplaint.resolutionPhoto && (

                  <div
                    style={{
                      marginTop: '15px'
                    }}
                  >

                    <p
                      style={{
                        marginBottom: '8px',
                        fontWeight: '600'
                      }}
                    >
                      Resolution Photo
                    </p>

                    <img
                      src={selectedComplaint.resolutionPhoto}
                      alt="Resolved complaint"
                      style={{
                        width: '100%',
                        maxWidth: '400px',
                        maxHeight: '280px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #d8e1e9'
                      }}
                    />

                    {selectedComplaint.resolutionDate && (

                      <p
                        style={{
                          marginTop: '8px',
                          color: '#64748b'
                        }}
                      >
                        Resolved on: {selectedComplaint.resolutionDate}
                      </p>

                    )}

                  </div>

                )}

                <button
                  onClick={handleMarkResolved}
                  style={{
                    marginTop: '15px',
                    padding: '11px 18px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#1e3a5f',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Mark as Resolved
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default OfficerDashboard
