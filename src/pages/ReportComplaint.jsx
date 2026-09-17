import './ReportComplaint.css'
import { Link } from 'react-router-dom'
import { useState } from 'react'

function ReportComplaint() {

  const [complaintId, setComplaintId] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

  // FORM VALUES

  const [complaintType, setComplaintType] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [area, setArea] = useState('')
  const [pincode, setPincode] = useState('')


  // =========================================
  // PHOTO SELECTION
  // =========================================

  const handlePhotoChange = (event) => {

    const selectedPhoto = event.target.files[0]

    if (!selectedPhoto) {
      return
    }

    setPhoto(selectedPhoto)

    // Convert image to Base64
    const reader = new FileReader()

    reader.onloadend = () => {

      setPhotoPreview(reader.result)

    }

    reader.readAsDataURL(selectedPhoto)

  }


  // =========================================
  // SUBMIT COMPLAINT
  // =========================================

  const handleSubmit = (event) => {

    event.preventDefault()


    const year = new Date().getFullYear()


    const randomNumber = Math.floor(
      10000 + Math.random() * 90000
    )


    const newComplaintId =
      `NBT-${year}-${randomNumber}`


    // =========================================
    // COMPLETE COMPLAINT OBJECT
    // =========================================

    const newComplaint = {

      id: newComplaintId,

      type: complaintType,

      description: description,

      location: location,

      area: area,

      pincode: pincode,

      status: 'Registered',

      priority: 'Medium',

      date: new Date().toLocaleString(),

      isNew: true,

      photoName: photo ? photo.name : '',

      // Base64 image is saved here
      photoPreview: photoPreview

    }


    // =========================================
    // GET EXISTING COMPLAINTS
    // =========================================

    const existingComplaints =
      JSON.parse(
        localStorage.getItem('complaints')
      ) || []


    // =========================================
    // ADD NEW COMPLAINT
    // =========================================

    existingComplaints.push(newComplaint)


    // =========================================
    // SAVE ALL COMPLAINTS
    // =========================================

    localStorage.setItem(
      'complaints',
      JSON.stringify(existingComplaints)
    )


    // =========================================
    // SAVE LATEST COMPLAINT FOR TRACKING
    // =========================================

    localStorage.setItem(
      'complaintId',
      newComplaintId
    )


    localStorage.setItem(
      'complaintStatus',
      'Registered'
    )


    // =========================================
    // SHOW SUCCESS SCREEN
    // =========================================

    setComplaintId(newComplaintId)

    setSubmitted(true)

  }


  return (

    <div className="report-page">

      <div className="report-container">


        {/* =====================================
            HEADER
        ====================================== */}

        <div className="report-header">

          <Link
            to="/"
            className="report-brand"
          >

            <div className="report-logo">
              NB
            </div>

            <div>

              <strong>
                The Night Bulb
              </strong>

              <span>
                Tracking Portal
              </span>

            </div>

          </Link>


          <Link
            to="/"
            className="report-home"
          >
            Back to Home
          </Link>

        </div>



        {/* =====================================
            TITLE
        ====================================== */}

        <div className="report-title">

          <span>
            CITIZEN COMPLAINT PORTAL
          </span>

          <h1>
            Report an Issue
          </h1>

          <p>
            Submit the details of the civic issue for review and action.
          </p>

        </div>



        {/* =====================================
            SUCCESS MESSAGE
        ====================================== */}

        {submitted && (

          <div className="success-box">

            <span>
              COMPLAINT REGISTERED
            </span>

            <h2>
              Complaint submitted successfully
            </h2>

            <p>
              Your Complaint ID is:
            </p>

            <strong className="complaint-id">
              {complaintId}
            </strong>

            <p>
              Please save this Complaint ID to track your complaint.
            </p>

            <Link
              to="/"
              className="success-home"
            >
              Back to Home
            </Link>

          </div>

        )}



        {/* =====================================
            COMPLAINT FORM
        ====================================== */}

        {!submitted && (

          <div className="report-card">

            <form onSubmit={handleSubmit}>


              {/* =================================
                  SECTION 01
              ================================== */}

              <div className="form-section">

                <div className="section-label">
                  01
                </div>


                <div className="section-content">

                  <h2>
                    Complaint Details
                  </h2>

                  <p>
                    Select the type of issue you want to report.
                  </p>


                  <div className="form-group">

                    <label htmlFor="complaintType">
                      Complaint Type
                    </label>


                    <select
                      id="complaintType"
                      value={complaintType}
                      onChange={(event) =>
                        setComplaintType(event.target.value)
                      }
                      required
                    >

                      <option value="">
                        Select complaint type
                      </option>

                      <option value="Non-Working Streetlight">
                        Non-Working Streetlight
                      </option>

                      <option value="Damaged Road">
                        Damaged Road
                      </option>

                      <option value="Road Pothole">
                        Road Pothole
                      </option>

                    </select>

                  </div>



                  <div className="form-group">

                    <label htmlFor="description">
                      Description
                    </label>

                    <textarea
                      id="description"
                      rows="5"
                      placeholder="Describe the issue clearly"
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      required
                    ></textarea>

                  </div>

                </div>

              </div>



              {/* =================================
                  SECTION 02
              ================================== */}

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

                    <label htmlFor="location">
                      Location / Address
                    </label>

                    <input
                      id="location"
                      type="text"
                      placeholder="Enter the location or address"
                      value={location}
                      onChange={(event) =>
                        setLocation(event.target.value)
                      }
                      required
                    />

                  </div>



                  <div className="form-row">

                    <div className="form-group">

                      <label htmlFor="area">
                        Area
                      </label>

                      <input
                        id="area"
                        type="text"
                        placeholder="Enter area"
                        value={area}
                        onChange={(event) =>
                          setArea(event.target.value)
                        }
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label htmlFor="pincode">
                        PIN Code
                      </label>

                      <input
                        id="pincode"
                        type="text"
                        placeholder="Enter PIN code"
                        value={pincode}
                        onChange={(event) =>
                          setPincode(event.target.value)
                        }
                        required
                      />

                    </div>

                  </div>

                </div>

              </div>



              {/* =================================
                  SECTION 03
              ================================== */}

              <div className="form-section">

                <div className="section-label">
                  03
                </div>


                <div className="section-content">

                  <h2>
                    Upload Evidence
                  </h2>

                  <p>
                    Upload a photograph that helps identify the issue.
                  </p>


                  <div className="upload-box">

                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />


                    {!photoPreview && (

                      <label htmlFor="photo">

                        <strong>
                          Choose a photo
                        </strong>

                        <span>
                          JPG, JPEG or PNG
                        </span>

                      </label>

                    )}


                    {photoPreview && (

                      <div className="photo-preview">

                        <img
                          src={photoPreview}
                          alt="Selected evidence"
                        />

                        <div className="photo-details">

                          <strong>
                            Photo selected
                          </strong>

                          <span>
                            {photo.name}
                          </span>

                        </div>

                      </div>

                    )}

                  </div>

                </div>

              </div>



              {/* =================================
                  SECTION 04
              ================================== */}

              <div className="form-section">

                <div className="section-label">
                  04
                </div>


                <div className="section-content">

                  <h2>
                    Submit Complaint
                  </h2>

                  <p>
                    Review the information before submitting your complaint.
                  </p>


                  <button
                    type="submit"
                    className="submit-complaint"
                  >
                    Submit Complaint
                  </button>

                </div>

              </div>


            </form>

          </div>

        )}

      </div>

    </div>

  )

}

export default ReportComplaint