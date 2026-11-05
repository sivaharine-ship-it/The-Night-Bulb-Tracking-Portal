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



// Normalize complaint-photo values returned by PHP/MySQL into a usable image source.

function getComplaintPhotoSource(complaint) {

  const candidates = [

    complaint.photo_data,

    complaint.photo,

    complaint.photo_preview,

    complaint.photoPreview,

    complaint.photo_url,

    complaint.photo_path,

    complaint.uploaded_photo,

    complaint.image

  ]



  const value = candidates.find(

    (item) => typeof item === 'string' && item.trim() !== ''

  )

  if (!value) return ''



  const photo = value.trim()

  if (

    photo.startsWith('data:image/') ||

    photo.startsWith('https://') ||

    photo.startsWith('http://') ||

    photo.startsWith('blob:')

  ) return photo



  // Handle base64 image data stored without a data-URL prefix.

  if (photo.startsWith('/9j/')) return `data:image/jpeg;base64,${photo}`

  if (photo.startsWith('iVBOR')) return `data:image/png;base64,${photo}`



  // Otherwise assume PHP returned a relative upload path or filename.

  return `https://thenightbulbportal.infinityfree.me/${photo.replace(/^\/+/, '')}`

}



function mapDatabaseComplaint(c) {

  const latitude = c.latitude

  const longitude = c.longitude



  return {

    id: String(c.complaint_id ?? c.id ?? ''),

    assignedOfficer: c.assigned_officer || c.assignedOfficer || '',

    type: c.complaint_type || c.type || '',

    description: c.complaint_description || c.description || '',

    location: c.location || c.complaint_location || c.address || '',

    area: c.area || c.complaint_area || '',

    pincode: String(c.pincode || c.pin_code || c.postal_code || ''),

    status: c.status || 'Registered',

    priority: c.priority || 'Medium',

    date: c.created_at || c.complaint_date || c.date || '',

    latitude: latitude !== null && latitude !== '' && latitude !== undefined

      ? Number(latitude)

      : null,

    longitude: longitude !== null && longitude !== '' && longitude !== undefined

      ? Number(longitude)

      : null,

    photoPreview: getComplaintPhotoSource(c),

    photoName: c.photo_name || c.photoName || '',

    resolutionPhoto: c.resolution_photo

      ? (String(c.resolution_photo).startsWith('http')

          ? c.resolution_photo

          : `https://thenightbulbportal.infinityfree.me/${String(c.resolution_photo).replace(/^\/+/, '')}`)

      : '',

    resolutionDate: c.resolved_at || c.resolution_date || '',

    officerRemarks: c.officer_remarks || c.officerRemarks || '',

    isNew: false

  }

}



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



const [resolutionPhotoPreview, setResolutionPhotoPreview] = useState(null)

const [resolutionPhoto, setResolutionPhoto] = useState(null)

  const [complaints, setComplaints] = useState([])

  const [selectedComplaint, setSelectedComplaint] = useState(null)

  const [mapComplaintId, setMapComplaintId] = useState('')

  const [sampleComplaintIds, setSampleComplaintIds] = useState([])



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
    return undefined
  }

  let isMounted = true
  let isFirstLoad = true
  const knownIds = knownComplaintIds.current

  const loadComplaints = async () => {
    try {
      const response = await fetch('https://thenightbulbportal.infinityfree.me/get_complaints.php', {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch complaints (${response.status})`)
      }

      const data = await response.json()
      if (data.success === false) {
        throw new Error(data.message || 'PHP API returned an error')
      }

      const databaseComplaints = (data.complaints || []).map(mapDatabaseComplaint)
      if (!isMounted) return

      if (isFirstLoad) {
        databaseComplaints.forEach((complaint) => knownIds.add(complaint.id))
        isFirstLoad = false
      } else {
        const newlyReceived = databaseComplaints.find(
          (complaint) => complaint.id && !knownIds.has(complaint.id)
        )

        databaseComplaints.forEach((complaint) => knownIds.add(complaint.id))

        if (newlyReceived) {
          setNotificationComplaint((current) => current || newlyReceived)
        }
      }

      setComplaints(databaseComplaints)
      setSelectedComplaint((current) => {
        if (!current) return current
        return databaseComplaints.find((item) => item.id === current.id) || current
      })
    } catch (error) {
      console.error('Error loading database complaints:', error)
    }
  }

  loadComplaints()
  const pollingId = window.setInterval(loadComplaints, 5000)

  return () => {
    isMounted = false
    window.clearInterval(pollingId)
  }
}, [navigate])

// FILTERS

  // =========================================



  const newComplaints = complaints.filter(
    (complaint) => complaint.status === 'Registered'
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





const handleMapPin = async (latitude, longitude) => {

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

  console.log('Pin data:', {

  mapComplaintId,

  latitude,

  longitude

})

console.log(

  'All complaint IDs:',

  complaints.map(c => ({

    id: c.id,

    complaint_id: c.complaint_id

  }))

)





  try {

    const response = await fetch(

      'https://thenightbulbportal.infinityfree.me/update_pin.php',

      {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify({

          complaintId: mapComplaintId,

          latitude: latitude,

          longitude: longitude

        })

      }

    )



    const data = await response.json()



    if (data.success) {

      alert('Map pin saved successfully.')

    } else {

      alert(data.message || 'Pin database update failed.')

    }

  } catch (error) {

    console.error('Pin update error:', error)

    alert('Could not connect to the PHP backend.')

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



  if (!selectedPhoto.type.startsWith('image/')) {

    alert('Please select an image file.')

    event.target.value = ''

    return

  }



  if (selectedPhoto.size > 5 * 1024 * 1024) {

    alert('Photo size must be 5 MB or less.')

    event.target.value = ''

    return

  }



  setResolutionPhoto(selectedPhoto)



  setResolutionPhotoPreview(

    URL.createObjectURL(selectedPhoto)

  )

}

//HANDLE MARK AS RESOLVED



const handleMarkResolved = async () => {

  if (!selectedComplaint) {

    alert('Please select a complaint.')

    return

  }



  if (!resolutionPhoto) {

    alert('Please upload a resolution proof photo.')

    return

  }



  const formData = new FormData()

  formData.append('complaintId', selectedComplaint.id)

  formData.append('resolutionDetails', 'Repair completed')

  formData.append('resolutionPhoto', resolutionPhoto)



  try {

    const response = await fetch(

      'https://thenightbulbportal.infinityfree.me/resolve_complaint.php',

      {

        method: 'POST',

        body: formData

      }

    )



    const data = await response.json()



    if (!response.ok || !data.success) {

      alert(data.message || 'Failed to resolve complaint.')

      return

    }



    alert('Complaint marked as resolved successfully!')



    setSelectedComplaint(null)

    setResolutionPhoto(null)

    setResolutionPhotoPreview(null)



    const refreshed = await fetch(

      'https://thenightbulbportal.infinityfree.me/get_complaints.php'

    )

    const refreshedData = await refreshed.json()



    setComplaints(

      (refreshedData.complaints || []).map(mapDatabaseComplaint)

    )

  } catch (error) {

    console.error(error)

    alert('Could not connect to the PHP server.')

  }

}



  // =========================================

  // STATUS CHANGE

  // =========================================





const handleStatusChange = async (

  complaintId,

  newStatus

) => {

  const complaint = complaints.find(

    (item) => item.id === complaintId

  )



  if (!complaint) {

    alert('Complaint not found.')

    return

  }



  try {

    const response = await fetch(

      'https://thenightbulbportal.infinityfree.me/update_complaint.php',

      {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json'

        },

        body: JSON.stringify({

          complaintId: complaintId,

          status: newStatus,

          priority: complaint.priority || 'Medium'

        })

      }

    )



    const data = await response.json()



    if (!response.ok || !data.success) {

      alert(data.message || 'Status update failed.')

      return

    }



    const updatedComplaints = complaints.map(

      (item) =>

        item.id === complaintId

          ? {

              ...item,

              status: newStatus,

              isNew: false

            }

          : item

    )



    setComplaints(updatedComplaints)



    localStorage.setItem(

      'complaints',

      JSON.stringify(updatedComplaints)

    )



    if (selectedComplaint?.id === complaintId) {

      const updatedComplaint = updatedComplaints.find(

        (item) => item.id === complaintId

      )



      setSelectedComplaint(updatedComplaint)

    }



    alert('Complaint status updated successfully.')

  } catch (error) {

    console.error('Status update error:', error)

    alert('Backend connection failed. Please check the PHP server.')

  }

}



  // =========================================

  // PRIORITY CHANGE

  // =========================================



  // PRIORITY CHANGE

  const handlePriorityChange = async (complaintId, newPriority) => {

    const complaint = complaints.find(

      (item) => item.id === complaintId

    )



    if (!complaint) {

      alert('Complaint not found.')

      return

    }



    try {

      const response = await fetch(

        'https://thenightbulbportal.infinityfree.me/update_complaint.php',

        {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            complaintId,

            status: complaint.status || 'Registered',

            priority: newPriority

          })

        }

      )



      const data = await response.json()



      if (!response.ok || !data.success) {

        alert(data.message || 'Priority update failed.')

        return

      }



      const updatedComplaints = complaints.map((item) =>

        item.id === complaintId

          ? { ...item, priority: newPriority }

          : item

      )



      setComplaints(updatedComplaints)



      if (selectedComplaint?.id === complaintId) {

        setSelectedComplaint(

          updatedComplaints.find((item) => item.id === complaintId)

        )

      }



      alert('Complaint priority updated successfully.')

    } catch (error) {

      console.error('Priority update error:', error)

      alert('Backend connection failed. Check the PHP server.')

    }

  }



  // ASSIGN OFFICER

  const handleAssignOfficer = async (complaintId, officerName, officerRemarks) => {

    if (!officerName.trim()) {

      alert('Please enter an officer name.')

      return

    }



    try {

      const response = await fetch(

        'https://thenightbulbportal.infinityfree.me/assign_officer.php',

        {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            complaintId,

            officerName,

            officerRemarks

          })

        }

      )



      const data = await response.json()



      if (!response.ok || !data.success) {

        alert(data.message || 'Officer assignment failed.')

        return

      }



      const updatedComplaints = complaints.map((item) =>

        item.id === complaintId

          ? { ...item, assignedOfficer: officerName, officerRemarks: officerRemarks || '' }

          : item

      )



      setComplaints(updatedComplaints)



      const updatedComplaint = updatedComplaints.find(

        (item) => item.id === complaintId

      )



      if (updatedComplaint && selectedComplaint?.id === complaintId) {

        setSelectedComplaint(updatedComplaint)

      }



      alert('Officer assigned successfully.')

    } catch (error) {

      console.error('Officer assignment error:', error)

      alert('Backend connection failed. Check the PHP server.')

    }

  }



  // PAGE





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

          <p>
            <strong>Location:</strong>{' '}
            {notificationComplaint.location || 'Not provided'}
          </p>

          <p>
            <strong>Area:</strong>{' '}
            {notificationComplaint.area || 'Not provided'}
          </p>

          <p>
            <strong>Pincode:</strong>{' '}
            {notificationComplaint.pincode || 'Not provided'}
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



              <div className="complaint-photo">

                <label>Uploaded Photo</label>



                {selectedComplaint.photoPreview ? (

                  <img

                    src={selectedComplaint.photoPreview}

                    alt="Complaint evidence"

                    onError={(event) => {

                      console.error(

                        'Complaint photo failed to load:',

                        selectedComplaint.photoPreview

                      )

                      event.currentTarget.style.display = 'none'

                    }}

                    style={{

                      display: 'block',

                      width: '100%',

                      maxWidth: '520px',

                      maxHeight: '360px',

                      height: 'auto',

                      objectFit: 'contain',

                      margin: '12px auto 0',

                      border: '1px solid #d8e1e9',

                      borderRadius: '8px',

                      background: '#f8fafc'

                    }}

                  />

                ) : (

                  <p style={{ color: '#64748b', marginTop: '10px' }}>

                    No complaint photo was returned by the database.

                  </p>

                )}

              </div>



              {/* ASSIGN OFFICER AND RESOLUTION PROOF */}

              <div

                style={{

                  marginTop: '20px',

                  paddingTop: '20px',

                  borderTop: '1px solid #e2e8f0'

                }}

              >

                {selectedComplaint.assignedOfficer ? (

                  <div style={{ marginBottom: '20px' }}>

                    <label

                      style={{

                        display: 'block',

                        marginBottom: '8px',

                        fontWeight: '600'

                      }}

                    >

                      Assigned Officer

                    </label>

                    <p

                      style={{

                        padding: '12px',

                        background: '#f1f5f9',

                        borderRadius: '6px',

                        margin: 0

                      }}

                    >

                      {selectedComplaint.assignedOfficer}

                    </p>

                    <div

                      style={{

                        marginTop: '12px',

                        padding: '12px',

                        background: '#f8fafc',

                        border: '1px solid #e2e8f0',

                        borderRadius: '6px'

                      }}

                    >

                      <label

                        style={{

                          display: 'block',

                          marginBottom: '6px',

                          fontWeight: '600',

                          color: '#334155'

                        }}

                      >

                        Officer Remarks

                      </label>

                      <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-wrap' }}>

                        {selectedComplaint.officerRemarks?.trim()

                          ? selectedComplaint.officerRemarks

                          : 'No officer remarks added.'}

                      </p>

                    </div>

                  </div>

                ) : selectedComplaint.status !== 'Resolved' ? (

                  <div style={{ marginBottom: '20px' }}>

                    <label

                      style={{

                        display: 'block',

                        marginBottom: '8px',

                        fontWeight: '600'

                      }}

                    >

                      Assign Officer

                    </label>

                    <input

                      type="text"

                      placeholder="Enter officer name"

                      id="officerNameInput"

                      style={{

                        width: '100%',

                        padding: '10px',

                        border: '1px solid #ccc',

                        borderRadius: '6px',

                        boxSizing: 'border-box'

                      }}

                    />

                    <input

                      type="text"

                      id="officerRemarksInput"

                      placeholder="Enter officer remarks"

                      style={{

                        width: '100%',

                        boxSizing: 'border-box',

                        padding: '12px',

                        marginTop: '10px',

                        marginBottom: '12px',

                        border: '1px solid #cbd5e1',

                        borderRadius: '6px',

                        fontSize: '14px'

                      }}

                    />

                    <button

                      onClick={() => {

                        const officerName = document.getElementById('officerNameInput').value

                        const officerRemarks = document.getElementById('officerRemarksInput').value

                        handleAssignOfficer(selectedComplaint.id, officerName, officerRemarks)

                      }}

                      style={{

                        marginTop: '10px',

                        padding: '10px 16px',

                        background: '#1e3a5f',

                        color: '#fff',

                        border: 'none',

                        borderRadius: '6px',

                        cursor: 'pointer'

                      }}

                    >

                      Assign Officer

                    </button>

                  </div>

                ) : null}



                {/* RESOLUTION PROOF */}

                {selectedComplaint.status !== 'Resolved' && (

                  <div>

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

                      <div style={{ marginTop: '15px' }}>

                        <p style={{ marginBottom: '8px', fontWeight: '600' }}>

                          New Resolution Photo

                        </p>

                        <img

                          src={resolutionPhotoPreview}

                          alt="Resolution proof preview"

                          style={{

                            width: '180px',

                            height: '140px',

                            objectFit: 'cover',

                            borderRadius: '8px'

                          }}

                        />

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

                )}



                {selectedComplaint.status === 'Resolved' && selectedComplaint.resolutionPhoto && (

                  <div style={{ marginTop: '15px' }}>

                    <p style={{ marginBottom: '8px', fontWeight: '600' }}>

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

                      <p style={{ marginTop: '8px', color: '#64748b' }}>

                        Resolved on: {selectedComplaint.resolutionDate}

                      </p>

                    )}

                  </div>

                )}

              </div>



           </div>



          </div>



        </div>



      )}



    </div>

  )

}



export default OfficerDashboard
