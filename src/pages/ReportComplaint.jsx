import './ReportComplaint.css'
import { Link } from 'react-router-dom'
import { useState } from 'react'

function ReportComplaint() {
  const [complaintId, setComplaintId] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

  const [complaintType, setComplaintType] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [area, setArea] = useState('')
  const [pincode, setPincode] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // PHOTO SELECTION AND VALIDATION
  const handlePhotoChange = (event) => {
    const selectedPhoto = event.target.files?.[0]

    if (!selectedPhoto) {
      setPhoto(null)
      setPhotoPreview('')
      return
    }

    if (!selectedPhoto.type.startsWith('image/')) {
      alert('Please select a valid image file.')
      event.target.value = ''
      setPhoto(null)
      setPhotoPreview('')
      return
    }

    // Maximum upload size: 5 MB
    if (selectedPhoto.size > 5 * 1024 * 1024) {
      alert('Photo size must not exceed 5 MB.')
      event.target.value = ''
      setPhoto(null)
      setPhotoPreview('')
      return
    }

    setPhoto(selectedPhoto)

    const reader = new FileReader()

    reader.onload = () => {
      setPhotoPreview(
        typeof reader.result === 'string' ? reader.result : ''
      )
    }

    reader.onerror = () => {
      alert('Unable to read the selected photo. Please try again.')
      setPhoto(null)
      setPhotoPreview('')
    }

    reader.readAsDataURL(selectedPhoto)
  }

  // SUBMIT COMPLAINT
  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitting) return

    const trimmedLocation = location.trim()
    const trimmedArea = area.trim()
    const trimmedDescription = description.trim()
    const trimmedPincode = pincode.trim()

    if (
      !complaintType ||
      !trimmedDescription ||
      !trimmedLocation ||
      !trimmedArea ||
      !trimmedPincode
    ) {
      alert('Please fill in all required fields.')
      return
    }

    if (!/^[0-9]{6}$/.test(trimmedPincode)) {
      alert('Please enter a valid 6-digit pincode.')
      return
    }

    // Read the currently logged-in citizen, if available.
    let citizen = {}

    try {
      citizen = JSON.parse(localStorage.getItem('citizenUser') || '{}')
    } catch {
      citizen = {}
    }

    const year = new Date().getFullYear()
    const randomNumber = Math.floor(10000 + Math.random() * 90000)
    const newComplaintId = `NBT-${year}-${randomNumber}`

    const complaintPayload = {
      id: newComplaintId,

      citizen_name:
        citizen.name ||
        citizen.fullName ||
        citizen.citizen_name ||
        'Unknown',

      citizen_email:
        citizen.email ||
        citizen.citizen_email ||
        null,

      citizen_phone:
        citizen.phone ||
        citizen.mobile ||
        citizen.citizen_phone ||
        null,

      type: complaintType,
      description: trimmedDescription,
      location: trimmedLocation,
      area: trimmedArea,
      pincode: trimmedPincode,

      status: 'Registered',
      priority: 'Medium',

      photoName: photo ? photo.name : '',
      photoPreview: photoPreview
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        'https://thenightbulbportal.infinityfree.me/complaints.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(complaintPayload)
        }
      )

      let data

      try {
        data = await response.json()
      } catch {
        throw new Error(
          'The PHP server did not return valid JSON. Check the backend.'
        )
      }

      console.log('PHP Backend Response:', data)

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Complaint could not be saved to the database.'
        )
      }

      // Store the saved image URL, not the large Base64 image.
      const savedComplaint = {
        ...complaintPayload,
        photoPreview: data.photo_url || '',
        photoName: photo ? photo.name : '',
        date: new Date().toLocaleString(),
        isNew: true
      }

      // Keep the existing localStorage functionality.
      let existingComplaints = []

      try {
        existingComplaints = JSON.parse(
          localStorage.getItem('complaints') || '[]'
        )

        if (!Array.isArray(existingComplaints)) {
          existingComplaints = []
        }
      } catch {
        existingComplaints = []
      }

      existingComplaints.push(savedComplaint)

      localStorage.setItem(
        'complaints',
        JSON.stringify(existingComplaints)
      )

      localStorage.setItem('complaintId', newComplaintId)
      localStorage.setItem('complaintStatus', 'Registered')

      setComplaintId(newComplaintId)
      setSubmitted(true)
    } catch (error) {
      console.error('Complaint submission failed:', error)

      alert(
        error.message ||
        'Unable to submit the complaint. Please check whether the PHP backend is running.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // SUCCESS PAGE
  if (submitted) {
    return (
      <div className="report-page">
        <div className="report-container">

          <div className="report-header">
            <Link to="/" className="report-brand">
              <div className="report-logo">
                NBT
              </div>

              <div>
                <strong>
                  The Night Bulb Tracking Portal
                </strong>

                <span>
                  Citizen Complaint Portal
                </span>
              </div>
            </Link>

            <Link to="/" className="report-home">
              Home
            </Link>
          </div>

          <div className="success-box">

            <span>
              COMPLAINT REGISTRATION
            </span>

            <h2>
              Complaint Registered Successfully
            </h2>

            <p>
              Your complaint has been successfully submitted.
            </p>

            <p>
              Your Complaint ID is:
            </p>

            <div className="complaint-id">
              {complaintId}
            </div>

            <p>
              Please save this Complaint ID to track your complaint status.
            </p>

            <Link
              to="/"
              className="success-home"
            >
              Back to Home
            </Link>

          </div>

        </div>
      </div>
    )
  }

  // REPORT FORM
  return (
    <div className="report-page">
      <div className="report-container">

        {/* HEADER */}
        <div className="report-header">

          <Link
            to="/"
            className="report-brand"
          >
            <div className="report-logo">
              NBT
            </div>

            <div>
              <strong>
                The Night Bulb Tracking Portal
              </strong>

              <span>
                Citizen Complaint Portal
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="report-home"
          >
            Home
          </Link>

        </div>

        {/* TITLE */}
        <div className="report-title">

          <span>
            CITIZEN SERVICES
          </span>

          <h1>
            Report a Complaint
          </h1>

          <p>
            Submit the details of the civic issue to register your complaint.
          </p>

        </div>

        {/* FORM CARD */}
        <form
          className="report-card"
          onSubmit={handleSubmit}
        >

          {/* SECTION 1 */}
          <div className="form-section">

            <div className="section-label">
              01
            </div>

            <div className="section-content">

              <h2>
                Complaint Details
              </h2>

              <p>
                Provide information about the issue you want to report.
              </p>

              <div className="form-group">

                <label>
                  Complaint Type
                </label>

                <select
                  value={complaintType}
                  onChange={(event) =>
                    setComplaintType(event.target.value)
                  }
                  required
                >
                  <option value="">
                    Select complaint type
                  </option>

                  <option value="Pothole">
                    Pothole
                  </option>

                  <option value="Damaged Road">
                    Damaged Road
                  </option>

                  <option value="Non-working Streetlight">
                    Non-working Streetlight
                  </option>
                </select>

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe the issue clearly"
                  required
                />

              </div>

            </div>

          </div>

          {/* SECTION 2 */}
          <div className="form-section">

            <div className="section-label">
              02
            </div>

            <div className="section-content">

              <h2>
                Location Details
              </h2>

              <p>
                Provide the location where the issue was identified.
              </p>

              <div className="form-group">

                <label>
                  Location
                </label>

                <input
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="Enter exact location"
                  required
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Area / Locality
                  </label>

                  <input
                    type="text"
                    value={area}
                    onChange={(event) =>
                      setArea(event.target.value)
                    }
                    placeholder="Enter area"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Pincode
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    value={pincode}
                    onChange={(event) =>
                      setPincode(
                        event.target.value.replace(/\D/g, '').slice(0, 6)
                      )
                    }
                    placeholder="Enter pincode"
                    maxLength={6}
                    required
                  />

                </div>

              </div>

            </div>

          </div>

          {/* SECTION 3 */}
          <div className="form-section">

            <div className="section-label">
              03
            </div>

            <div className="section-content">

              <h2>
                Upload Evidence
              </h2>

              <p>
                Upload a photograph of the reported issue, if available.
              </p>

              <div className="upload-box">

                <input
                  id="complaint-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                />

                <label htmlFor="complaint-photo">

                  <strong>
                    Choose a photo
                  </strong>

                  <span>
                    JPG, JPEG, PNG or WebP image (maximum 5 MB)
                  </span>

                </label>

              </div>

              {photoPreview && (
                <div className="photo-preview">

                  <img
                    src={photoPreview}
                    alt="Complaint preview"
                  />

                  <div className="photo-details">

                    <strong>
                      Photo selected
                    </strong>

                    <span>
                      {photo ? photo.name : ''}
                    </span>

                  </div>

                </div>
              )}

            </div>

          </div>

          {/* SECTION 4 */}
          <div className="form-section">

            <div className="section-label">
              04
            </div>

            <div className="section-content">

              <h2>
                Submit Complaint
              </h2>

              <p>
                Review the information and submit your complaint.
              </p>

              <button
                type="submit"
                className="submit-complaint"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Submitting Complaint...'
                  : 'Submit Complaint'}
              </button>

            </div>

          </div>

        </form>

      </div>
    </div>
  )
}

export default ReportComplaint