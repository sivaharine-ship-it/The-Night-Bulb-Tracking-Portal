# The Night Bulb Tracking Portal

A web-based citizen complaint management portal that allows users to report and track civic issues such as potholes, damaged roads, and non-working streetlights.

The system provides a structured workflow for complaint registration, officer verification, priority management, location mapping, status updates, and resolution proof.

## Features

### Citizen Portal
- Citizen registration and login
- Submit complaints for:
  - Potholes
  - Damaged roads
  - Non-working streetlights
- Add complaint description and location details
- Upload complaint photographs
- Automatic unique complaint ID generation
- Track complaint status using Complaint ID

### Officer Dashboard
- Officer login
- View all submitted complaints
- Receive notifications for new complaints
- View complete complaint details
- Change complaint priority:
  - Low
  - Medium
  - High
- Update complaint status:
  - Registered
  - Verified
  - Assigned
  - Repair
  - Resolved
- View complaint locations on an interactive map
- Place or move complaint pins on the map
- Upload resolution proof photographs
- Mark complaints as resolved
- View resolution date and proof photograph

### Priority Map
The portal includes an interactive map to visualize complaint locations based on priority.

- High Priority — Red marker
- Medium Priority — Orange marker
- Low Priority — Green marker

Officer updates to complaint priority are reflected in the map.

## Complaint Workflow

```text
Citizen
   |
   v
Submit Complaint
   |
   v
Complaint ID Generated
   |
   v
Officer Notification
   |
   v
Officer Verification
   |
   v
Priority Assignment
   |
   v
Complaint Assigned
   |
   v
Repair
   |
   v
Resolution Photo Upload
   |
   v
Complaint Resolved
