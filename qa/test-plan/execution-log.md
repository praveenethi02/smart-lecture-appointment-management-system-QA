# Test Execution Log (Section 3.2)

- **Executed:** 2026-11-24, 02:25 (Asia/Colombo) against `http://localhost:5000/api`
- **Environment:** Windows 11, Node.js v26.5.0, in-memory MongoDB with seeded demo data
- **Method:** AI-assisted run: the API requests below were sent by a Node.js script; selected UI behaviour was checked in a browser (see "UI checks")
- Tokens are redacted. Timestamps are UTC. Cases are listed in execution order.
- An earlier attempt stopped at TC-AUTH-03 with ECONNRESET when the `node --watch` backend process restarted; its in-memory database was recreated. The complete run below started afterwards from freshly seeded data.

## TC-AUTH-01

**login kasun@student.apex.edu** (2026-11-23T20:55:01.821Z)

```text
POST /api/auth/login
Authorization: none
Body: {"email":"kasun@student.apex.edu","password":"Student@123"}

Status: 200
Response: {"success":true,"message":"Login successful","token":"<redacted>","user":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","role":"student","registrationNumber":"EG2023001","department":{"_id":"6b04a8138040521778607ba6","name":"Computer Engineering","code":"CE"},"departmentName":"Computer Engineering","specialization":"","officeLocation":"","phone":"+94 71 111 2233","bio":"","profileImage":"","isActive":true,"createdAt":"2026-11-23T20:54:44.491Z","updatedAt":"2026-11-23T20:54:44.491Z","__v":0}}
```

## TC-AUTH-02

**login kasun@student.apex.edu** (2026-11-23T20:55:01.895Z)

```text
POST /api/auth/login
Authorization: none
Body: {"email":"kasun@student.apex.edu","password":"Wrong@123"}

Status: 401
Response: {"success":false,"message":"Invalid email or password"}
```

## TC-AUTH-03

**register** (2026-11-23T20:55:01.982Z)

```text
POST /api/auth/register
Authorization: none
Body: {"name":"Test Student","email":"test1@student.apex.edu","password":"Test@123"}

Status: 201
Response: {"success":true,"message":"Student account registered successfully","token":"<redacted>","user":{"name":"Test Student","email":"test1@student.apex.edu","role":"student","registrationNumber":"","department":null,"departmentName":"","specialization":"","officeLocation":"","phone":"","bio":"","profileImage":"","isActive":true,"_id":"6b04a8258040521778607bf3","createdAt":"2026-11-23T20:55:01.978Z","updatedAt":"2026-11-23T20:55:01.978Z","__v":0}}
```

**login as new user test1@student.apex.edu** (2026-11-23T20:55:02.050Z)

```text
POST /api/auth/login
Authorization: none
Body: {"email":"test1@student.apex.edu","password":"Test@123"}

Status: 200
Response: {"success":true,"message":"Login successful","token":"<redacted>","user":{"_id":"6b04a8258040521778607bf3","name":"Test Student","email":"test1@student.apex.edu","role":"student","registrationNumber":"","department":null,"departmentName":"","specialization":"","officeLocation":"","phone":"","bio":"","profileImage":"","isActive":true,"createdAt":"2026-11-23T20:55:01.978Z","updatedAt":"2026-11-23T20:55:01.978Z","__v":0}}
```

## TC-AUTH-04

**register, 5-char password** (2026-11-23T20:55:02.053Z)

```text
POST /api/auth/register
Authorization: none
Body: {"name":"Test Student 2","email":"test2@student.apex.edu","password":"Ab@12"}

Status: 400
Response: {"success":false,"message":"Password must be at least 6 characters long"}
```

## TC-AUTH-05

**register existing email** (2026-11-23T20:55:02.064Z)

```text
POST /api/auth/register
Authorization: none
Body: {"name":"Test Student","email":"kasun@student.apex.edu","password":"Test@123"}

Status: 409
Response: {"success":false,"message":"An account with this email already exists"}
```

## SETUP

**login dr.kamal@apex.edu** (2026-11-23T20:55:02.131Z)

```text
POST /api/auth/login
Authorization: none
Body: {"email":"dr.kamal@apex.edu","password":"Lecturer@123"}

Status: 200
Response: {"success":true,"message":"Login successful","token":"<redacted>","user":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","role":"lecturer","employeeId":"LEC-101","department":{"_id":"6b04a8138040521778607ba6","name":"Computer Engineering","code":"CE"},"departmentName":"Computer Engineering","specialization":"Computer Systems, Embedded Computing & Cloud Architectures","officeLocation":"Engineering Block A, Room 304","phone":"+94 77 123 4567","bio":"Senior Lecturer in Computer Engineering with 12+ years of research in distributed computing, embedded systems, and high-performance computing.","profileImage":"","isActive":true,"createdAt":"2026-11-23T20:54:44.262Z","updatedAt":"2026-11-23T20:54:44.262Z","__v":0}}
```

## TC-SLOT-01

**create 60 min** (2026-11-23T20:55:02.182Z)

```text
POST /api/availability
Authorization: Bearer <redacted>
Body: {"date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person"}

Status: 201
Response: {"success":true,"message":"Availability slot created successfully","slot":{"lecturerId":"6b04a8148040521778607bb0","date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"_id":"6b04a8268040521778607bfc","createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.179Z","__v":0}}
```

**lecturer slot list for 2026-12-15** (2026-11-23T20:55:02.202Z)

```text
GET /api/availability?date=2026-12-15
Authorization: Bearer <redacted>

Status: 200
Response: {"success":true,"count":1,"slots":[{"_id":"6b04a8268040521778607bfc","lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures"},"date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.179Z","__v":0}]}
```

## TC-SLOT-02

**create 4 min** (2026-11-23T20:55:02.208Z)

```text
POST /api/availability
Authorization: Bearer <redacted>
Body: {"date":"2026-12-15","startTime":"12:00","endTime":"12:04","location":"Room 101","meetingMethod":"in-person"}

Status: 400
Response: {"success":false,"message":"End time must be after start time, and slot duration must be at least 5 minutes"}
```

## TC-SLOT-03

**create 5 min** (2026-11-23T20:55:02.225Z)

```text
POST /api/availability
Authorization: Bearer <redacted>
Body: {"date":"2026-12-15","startTime":"12:30","endTime":"12:35","location":"Room 101","meetingMethod":"in-person"}

Status: 201
Response: {"success":true,"message":"Availability slot created successfully","slot":{"lecturerId":"6b04a8148040521778607bb0","date":"2026-12-15","startTime":"12:30","endTime":"12:35","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"_id":"6b04a8268040521778607c07","createdAt":"2026-11-23T20:55:02.223Z","updatedAt":"2026-11-23T20:55:02.223Z","__v":0}}
```

**lecturer slot list for 2026-12-15** (2026-11-23T20:55:02.241Z)

```text
GET /api/availability?date=2026-12-15
Authorization: Bearer <redacted>

Status: 200
Response: {"success":true,"count":2,"slots":[{"_id":"6b04a8268040521778607bfc","lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures"},"date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.179Z","__v":0},{"_id":"6b04a8268040521778607c07","lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures"},"date":"2026-12-15","startTime":"12:30","endTime":"12:35","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"createdAt":"2026-11-23T20:55:02.223Z","updatedAt":"2026-11-23T20:55:02.223Z","__v":0}]}
```

## TC-SLOT-04

**create 481 min** (2026-11-23T20:55:02.253Z)

```text
POST /api/availability
Authorization: Bearer <redacted>
Body: {"date":"2026-12-16","startTime":"08:00","endTime":"16:01","location":"Room 101","meetingMethod":"in-person"}

Status: 400
Response: {"success":false,"message":"End time must be after start time, and slot duration must be at least 5 minutes"}
```

## TC-SLOT-05

**create past date** (2026-11-23T20:55:02.271Z)

```text
POST /api/availability
Authorization: Bearer <redacted>
Body: {"date":"2026-11-20","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person"}

Status: 400
Response: {"success":false,"message":"Cannot create availability slots for past dates or times"}
```

## TC-SLOT-06

**create overlapping** (2026-11-23T20:55:02.280Z)

```text
POST /api/availability
Authorization: Bearer <redacted>
Body: {"date":"2026-12-15","startTime":"10:30","endTime":"11:30","location":"Room 102","meetingMethod":"in-person"}

Status: 400
Response: {"success":false,"message":"This slot overlaps with an existing slot from 10:00 to 11:00 on 2026-12-15"}
```

## TC-BOOK-01

**book** (2026-11-23T20:55:02.321Z)

```text
POST /api/appointments
Authorization: Bearer <redacted>
Body: {"availabilityId":"6b04a8268040521778607bfc","reason":"Project guidance"}

Status: 201
Response: {"success":true,"message":"Appointment booked and confirmed successfully!","appointment":{"_id":"6b04a8268040521778607c1b","studentId":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","registrationNumber":"EG2023001","department":"6b04a8138040521778607ba6"},"lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures","officeLocation":"Engineering Block A, Room 304"},"availabilityId":{"_id":"6b04a8268040521778607bfc","lecturerId":"6b04a8148040521778607bb0","date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"booked","currentAppointmentId":"6b04a8268040521778607c1b","createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.314Z","__v":0},"reason":"Project guidance","studentMessage":"","status":"confirmed","lecturerResponse":"","cancellationReason":"","cancelledBy":null,"bookedAt":"2026-11-23T20:55:02.313Z","confirmedAt":"2026-11-23T20:55:02.313Z","completedAt":null,"cancelledAt":null,"createdAt":"2026-11-23T20:55:02.313Z","updatedAt":"2026-11-23T20:55:02.313Z","__v":0}}
```

**my appointments** (2026-11-23T20:55:02.336Z)

```text
GET /api/appointments/my?date=2026-12-15
Authorization: Bearer <redacted>

Status: 200
Response: {"success":true,"count":1,"appointments":[{"_id":"6b04a8268040521778607c1b","studentId":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","registrationNumber":"EG2023001","department":"6b04a8138040521778607ba6","phone":"+94 71 111 2233"},"lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures","officeLocation":"Engineering Block A, Room 304","phone":"+94 77 123 4567"},"availabilityId":{"_id":"6b04a8268040521778607bfc","lecturerId":"6b04a8148040521778607bb0","date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"booked","currentAppointmentId":"6b04a8268040521778607c1b","createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.314Z","__v":0},"reason":"Project guidance","studentMessage":"","status":"confirmed","lecturerResponse":"","cancellationReason":"","cancelledBy":null,"bookedAt":"2026-11-23T20:55:02.313Z","confirmedAt":"2026-11-23T20:55:02.313Z","completedAt":null,"cancelledAt":null,"createdAt":"2026-11-23T20:55:02.313Z","updatedAt":"2026-11-23T20:55:02.313Z","__v":0}]}
```

**slots offered to students on 2026-12-15** (2026-11-23T20:55:02.347Z)

```text
GET /api/lecturers/6b04a8148040521778607bb0/availability?date=2026-12-15
Authorization: none

Status: 200
Response: {"success":true,"count":1,"slots":[{"_id":"6b04a8268040521778607c07","lecturerId":"6b04a8148040521778607bb0","date":"2026-12-15","startTime":"12:30","endTime":"12:35","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"createdAt":"2026-11-23T20:55:02.223Z","updatedAt":"2026-11-23T20:55:02.223Z","__v":0}]}
```

## TC-BOOK-02

**book, 3 spaces** (2026-11-23T20:55:02.369Z)

```text
POST /api/appointments
Authorization: Bearer <redacted>
Body: {"availabilityId":"6b04a8268040521778607c07","reason":"   "}

Status: 400
Response: {"success":false,"message":"Appointment reason is required"}
```

**lecturer slot list for 2026-12-15** (2026-11-23T20:55:02.383Z)

```text
GET /api/availability?date=2026-12-15
Authorization: Bearer <redacted>

Status: 200
Response: {"success":true,"count":2,"slots":[{"_id":"6b04a8268040521778607bfc","lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures"},"date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"booked","currentAppointmentId":{"_id":"6b04a8268040521778607c1b","studentId":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","registrationNumber":"EG2023001"},"lecturerId":"6b04a8148040521778607bb0","availabilityId":"6b04a8268040521778607bfc","reason":"Project guidance","studentMessage":"","status":"confirmed","lecturerResponse":"","cancellationReason":"","cancelledBy":null,"bookedAt":"2026-11-23T20:55:02.313Z","confirmedAt":"2026-11-23T20:55:02.313Z","completedAt":null,"cancelledAt":null,"createdAt":"2026-11-23T20:55:02.313Z","updatedAt":"2026-11-23T20:55:02.313Z","__v":0},"createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.314Z","__v":0},{"_id":"6b04a8268040521778607c07","lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures"},"date":"2026-12-15","startTime":"12:30","endTime":"12:35","location":"Room 101","meetingMethod":"in-person","notes":"","status":"booked","currentAppointmentId":null,"createdAt":"2026-11-23T20:55:02.223Z","updatedAt":"2026-11-23T20:55:02.365Z","__v":0}]}
```

**slots offered to students on 2026-12-15** (2026-11-23T20:55:02.392Z)

```text
GET /api/lecturers/6b04a8148040521778607bb0/availability?date=2026-12-15
Authorization: none

Status: 200
Response: {"success":true,"count":0,"slots":[]}
```

**my appointments** (2026-11-23T20:55:02.400Z)

```text
GET /api/appointments/my?date=2026-12-15
Authorization: Bearer <redacted>

Status: 200
Response: {"success":true,"count":1,"appointments":[{"_id":"6b04a8268040521778607c1b","studentId":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","registrationNumber":"EG2023001","department":"6b04a8138040521778607ba6","phone":"+94 71 111 2233"},"lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures","officeLocation":"Engineering Block A, Room 304","phone":"+94 77 123 4567"},"availabilityId":{"_id":"6b04a8268040521778607bfc","lecturerId":"6b04a8148040521778607bb0","date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"booked","currentAppointmentId":"6b04a8268040521778607c1b","createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.314Z","__v":0},"reason":"Project guidance","studentMessage":"","status":"confirmed","lecturerResponse":"","cancellationReason":"","cancelledBy":null,"bookedAt":"2026-11-23T20:55:02.313Z","confirmedAt":"2026-11-23T20:55:02.313Z","completedAt":null,"cancelledAt":null,"createdAt":"2026-11-23T20:55:02.313Z","updatedAt":"2026-11-23T20:55:02.313Z","__v":0}]}
```

## TC-BOOK-03

**slots offered to students on 2026-12-15** (2026-11-23T20:55:02.406Z)

```text
GET /api/lecturers/6b04a8148040521778607bb0/availability?date=2026-12-15
Authorization: none

Status: 200
Response: {"success":true,"count":0,"slots":[]}
```

**repeat booking** (2026-11-23T20:55:02.426Z)

```text
POST /api/appointments
Authorization: Bearer <redacted>
Body: {"availabilityId":"6b04a8268040521778607bfc","reason":"Project guidance"}

Status: 400
Response: {"success":false,"message":"You already have an active appointment for this time slot"}
```

## TC-BOOK-04

**slots offered to students on 2026-12-15** (2026-11-23T20:55:02.438Z)

```text
GET /api/lecturers/6b04a8148040521778607bb0/availability?date=2026-12-15
Authorization: none

Status: 200
Response: {"success":true,"count":0,"slots":[]}
```

**second student** (2026-11-23T20:55:02.458Z)

```text
POST /api/appointments
Authorization: Bearer <redacted>
Body: {"availabilityId":"6b04a8268040521778607bfc","reason":"Double booking attempt"}

Status: 409
Response: {"success":false,"message":"This slot is no longer available or was booked by another student just now."}
```

## TC-SLOT-09

**edit booked slot** (2026-11-23T20:55:02.470Z)

```text
PATCH /api/availability/6b04a8268040521778607bfc
Authorization: Bearer <redacted>
Body: {"location":"Room 999"}

Status: 400
Response: {"success":false,"message":"Cannot edit an availability slot that is already booked by a student"}
```

**delete booked slot** (2026-11-23T20:55:02.487Z)

```text
DELETE /api/availability/6b04a8268040521778607bfc
Authorization: Bearer <redacted>

Status: 400
Response: {"success":false,"message":"Cannot delete an availability slot that has an active booking. Cancel the appointment first."}
```

**lecturer slot list for 2026-12-15** (2026-11-23T20:55:02.505Z)

```text
GET /api/availability?date=2026-12-15
Authorization: Bearer <redacted>

Status: 200
Response: {"success":true,"count":2,"slots":[{"_id":"6b04a8268040521778607bfc","lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures"},"date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"booked","currentAppointmentId":{"_id":"6b04a8268040521778607c1b","studentId":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","registrationNumber":"EG2023001"},"lecturerId":"6b04a8148040521778607bb0","availabilityId":"6b04a8268040521778607bfc","reason":"Project guidance","studentMessage":"","status":"confirmed","lecturerResponse":"","cancellationReason":"","cancelledBy":null,"bookedAt":"2026-11-23T20:55:02.313Z","confirmedAt":"2026-11-23T20:55:02.313Z","completedAt":null,"cancelledAt":null,"createdAt":"2026-11-23T20:55:02.313Z","updatedAt":"2026-11-23T20:55:02.313Z","__v":0},"createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.314Z","__v":0},{"_id":"6b04a8268040521778607c07","lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures"},"date":"2026-12-15","startTime":"12:30","endTime":"12:35","location":"Room 101","meetingMethod":"in-person","notes":"","status":"booked","currentAppointmentId":null,"createdAt":"2026-11-23T20:55:02.223Z","updatedAt":"2026-11-23T20:55:02.365Z","__v":0}]}
```

## TC-CAN-02

**create slot today +1h** (2026-11-23T20:55:02.519Z)

```text
POST /api/availability
Authorization: Bearer <redacted>
Body: {"date":"2026-11-24","startTime":"03:25","endTime":"03:55","location":"Room 101","meetingMethod":"in-person"}

Status: 201
Response: {"success":true,"message":"Availability slot created successfully","slot":{"lecturerId":"6b04a8148040521778607bb0","date":"2026-11-24","startTime":"03:25","endTime":"03:55","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"_id":"6b04a8268040521778607c60","createdAt":"2026-11-23T20:55:02.517Z","updatedAt":"2026-11-23T20:55:02.517Z","__v":0}}
```

**book it** (2026-11-23T20:55:02.547Z)

```text
POST /api/appointments
Authorization: Bearer <redacted>
Body: {"availabilityId":"6b04a8268040521778607c60","reason":"Quick question"}

Status: 201
Response: {"success":true,"message":"Appointment booked and confirmed successfully!","appointment":{"_id":"6b04a8268040521778607c69","studentId":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","registrationNumber":"EG2023001","department":"6b04a8138040521778607ba6"},"lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures","officeLocation":"Engineering Block A, Room 304"},"availabilityId":{"_id":"6b04a8268040521778607c60","lecturerId":"6b04a8148040521778607bb0","date":"2026-11-24","startTime":"03:25","endTime":"03:55","location":"Room 101","meetingMethod":"in-person","notes":"","status":"booked","currentAppointmentId":"6b04a8268040521778607c69","createdAt":"2026-11-23T20:55:02.517Z","updatedAt":"2026-11-23T20:55:02.539Z","__v":0},"reason":"Quick question","studentMessage":"","status":"confirmed","lecturerResponse":"","cancellationReason":"","cancelledBy":null,"bookedAt":"2026-11-23T20:55:02.537Z","confirmedAt":"2026-11-23T20:55:02.537Z","completedAt":null,"cancelledAt":null,"createdAt":"2026-11-23T20:55:02.537Z","updatedAt":"2026-11-23T20:55:02.537Z","__v":0}}
```

**cancel** (2026-11-23T20:55:02.567Z)

```text
PATCH /api/appointments/6b04a8268040521778607c69/cancel
Authorization: Bearer <redacted>
Body: {"cancellationReason":"Test"}

Status: 400
Response: {"success":false,"message":"Appointments cannot be cancelled less than 2 hour(s) before the scheduled start time."}
```

**appointment after attempt** (2026-11-23T20:55:02.583Z)

```text
GET /api/appointments/6b04a8268040521778607c69
Authorization: Bearer <redacted>

Status: 200
Response: {"success":true,"appointment":{"_id":"6b04a8268040521778607c69","studentId":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","registrationNumber":"EG2023001","department":"6b04a8138040521778607ba6","phone":"+94 71 111 2233"},"lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures","officeLocation":"Engineering Block A, Room 304","phone":"+94 77 123 4567"},"availabilityId":{"_id":"6b04a8268040521778607c60","lecturerId":"6b04a8148040521778607bb0","date":"2026-11-24","startTime":"03:25","endTime":"03:55","location":"Room 101","meetingMethod":"in-person","notes":"","status":"booked","currentAppointmentId":"6b04a8268040521778607c69","createdAt":"2026-11-23T20:55:02.517Z","updatedAt":"2026-11-23T20:55:02.539Z","__v":0},"reason":"Quick question","studentMessage":"","status":"confirmed","lecturerResponse":"","cancellationReason":"","cancelledBy":null,"bookedAt":"2026-11-23T20:55:02.537Z","confirmedAt":"2026-11-23T20:55:02.537Z","completedAt":null,"cancelledAt":null,"createdAt":"2026-11-23T20:55:02.537Z","updatedAt":"2026-11-23T20:55:02.537Z","__v":0}}
```

## TC-CAN-01

**cancel** (2026-11-23T20:55:02.685Z)

```text
PATCH /api/appointments/6b04a8268040521778607c1b/cancel
Authorization: Bearer <redacted>
Body: {"cancellationReason":"Test"}

Status: 200
Response: {"success":true,"message":"Appointment cancelled successfully","appointment":{"_id":"6b04a8268040521778607c1b","studentId":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","registrationNumber":"EG2023001"},"lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures"},"availabilityId":{"_id":"6b04a8268040521778607bfc","lecturerId":"6b04a8148040521778607bb0","date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.598Z","__v":0},"reason":"Project guidance","studentMessage":"","status":"cancelled","lecturerResponse":"","cancellationReason":"Test","cancelledBy":"6b04a8148040521778607bb8","bookedAt":"2026-11-23T20:55:02.313Z","confirmedAt":"2026-11-23T20:55:02.313Z","completedAt":null,"cancelledAt":"2026-11-23T20:55:02.596Z","createdAt":"2026-11-23T20:55:02.313Z","updatedAt":"2026-11-23T20:55:02.597Z","__v":0}}
```

**appointment after cancel** (2026-11-23T20:55:02.706Z)

```text
GET /api/appointments/6b04a8268040521778607c1b
Authorization: Bearer <redacted>

Status: 200
Response: {"success":true,"appointment":{"_id":"6b04a8268040521778607c1b","studentId":{"_id":"6b04a8148040521778607bb8","name":"Kasun Mendis","email":"kasun@student.apex.edu","registrationNumber":"EG2023001","department":"6b04a8138040521778607ba6","phone":"+94 71 111 2233"},"lecturerId":{"_id":"6b04a8148040521778607bb0","name":"Dr. Kamal Perera","email":"dr.kamal@apex.edu","department":"6b04a8138040521778607ba6","specialization":"Computer Systems, Embedded Computing & Cloud Architectures","officeLocation":"Engineering Block A, Room 304","phone":"+94 77 123 4567"},"availabilityId":{"_id":"6b04a8268040521778607bfc","lecturerId":"6b04a8148040521778607bb0","date":"2026-12-15","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"createdAt":"2026-11-23T20:55:02.179Z","updatedAt":"2026-11-23T20:55:02.598Z","__v":0},"reason":"Project guidance","studentMessage":"","status":"cancelled","lecturerResponse":"","cancellationReason":"Test","cancelledBy":"6b04a8148040521778607bb8","bookedAt":"2026-11-23T20:55:02.313Z","confirmedAt":"2026-11-23T20:55:02.313Z","completedAt":null,"cancelledAt":"2026-11-23T20:55:02.596Z","createdAt":"2026-11-23T20:55:02.313Z","updatedAt":"2026-11-23T20:55:02.597Z","__v":0}}
```

## TC-RBAC-01

**student calls admin dashboard** (2026-11-23T20:55:02.717Z)

```text
GET /api/admin/dashboard
Authorization: Bearer <redacted>

Status: 403
Response: {"success":false,"message":"Forbidden: Access denied for role 'student'. Required: admin"}
```

## TC-RBAC-02

**lecturer books** (2026-11-23T20:55:02.732Z)

```text
POST /api/appointments
Authorization: Bearer <redacted>
Body: {"availabilityId":"6b04a8268040521778607bfc","reason":"Lecturer attempt"}

Status: 403
Response: {"success":false,"message":"Forbidden: Access denied for role 'lecturer'. Required: student"}
```

## TC-RBAC-03

**no token** (2026-11-23T20:55:02.745Z)

```text
GET /api/appointments/my
Authorization: none

Status: 401
Response: {"success":false,"message":"Authentication required. No token provided."}
```

## TC-AUTH-07

**login admin@apex.edu** (2026-11-23T20:55:02.829Z)

```text
POST /api/auth/login
Authorization: none
Body: {"email":"admin@apex.edu","password":"Admin@123"}

Status: 200
Response: {"success":true,"message":"Login successful","token":"<redacted>","user":{"_id":"6b04a8138040521778607bae","name":"Dr. Arthur Pendelton (Admin)","email":"admin@apex.edu","role":"admin","employeeId":"ADM-001","department":null,"departmentName":"","specialization":"","officeLocation":"Administrative Complex, Room 102","phone":"+94 11 234 5678","bio":"","profileImage":"","isActive":true,"createdAt":"2026-11-23T20:54:43.887Z","updatedAt":"2026-11-23T20:54:43.887Z","__v":0}}
```

**find user** (2026-11-23T20:55:02.849Z)

```text
GET /api/admin/users?search=dinithi
Authorization: Bearer <redacted>

Status: 200
Response: {"success":true,"total":1,"page":1,"totalPages":1,"users":[{"_id":"6b04a8148040521778607bb9","name":"Dinithi Jayasinghe","email":"dinithi@student.apex.edu","role":"student","registrationNumber":"EG2023002","department":{"_id":"6b04a8138040521778607ba7","name":"Civil Engineering","code":"CIV"},"departmentName":"Civil Engineering","specialization":"","officeLocation":"","phone":"+94 71 222 3344","bio":"","profileImage":"","isActive":true,"createdAt":"2026-11-23T20:54:44.491Z","updatedAt":"2026-11-23T20:54:44.491Z","__v":0}]}
```

**deactivate** (2026-11-23T20:55:02.859Z)

```text
PATCH /api/admin/users/6b04a8148040521778607bb9/status
Authorization: Bearer <redacted>
Body: {"isActive":false}

Status: 200
Response: {"success":true,"message":"User account has been deactivated","user":{"_id":"6b04a8148040521778607bb9","name":"Dinithi Jayasinghe","email":"dinithi@student.apex.edu","role":"student","isActive":false}}
```

**login dinithi@student.apex.edu** (2026-11-23T20:55:02.933Z)

```text
POST /api/auth/login
Authorization: none
Body: {"email":"dinithi@student.apex.edu","password":"Student@123"}

Status: 403
Response: {"success":false,"message":"Account is deactivated. Please contact the administrator."}
```

## TC-AUTH-06

**NoSQL payload** (2026-11-23T20:55:02.946Z)

```text
POST /api/auth/login
Authorization: none
Body: {"email":{"$ne":null},"password":"x"}

Status: 500
Response: {"success":false,"message":"email.toLowerCase is not a function"}
```

## TC-SLOT-07

**month 13** (2026-11-23T20:55:02.966Z)

```text
POST /api/availability
Authorization: Bearer <redacted>
Body: {"date":"2027-13-01","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person"}

Status: 201
Response: {"success":true,"message":"Availability slot created successfully","slot":{"lecturerId":"6b04a8148040521778607bb0","date":"2027-13-01","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"_id":"6b04a8268040521778607ca1","createdAt":"2026-11-23T20:55:02.964Z","updatedAt":"2026-11-23T20:55:02.964Z","__v":0}}
```

## TC-SLOT-08

**31 February** (2026-11-23T20:55:02.982Z)

```text
POST /api/availability
Authorization: Bearer <redacted>
Body: {"date":"2027-02-31","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person"}

Status: 201
Response: {"success":true,"message":"Availability slot created successfully","slot":{"lecturerId":"6b04a8148040521778607bb0","date":"2027-02-31","startTime":"10:00","endTime":"11:00","location":"Room 101","meetingMethod":"in-person","notes":"","status":"available","currentAppointmentId":null,"_id":"6b04a8268040521778607ca6","createdAt":"2026-11-23T20:55:02.980Z","updatedAt":"2026-11-23T20:55:02.980Z","__v":0}}
```

## UI checks (browser, http://localhost:5173)

Performed after the API run, on the resulting data.

| Test case | Observed |
|---|---|
| TC-AUTH-01 | Login as kasun redirected to /student/dashboard |
| TC-BOOK-02 | 3 spaces entered on the 2026-12-15 10:00 slot (free again after TC-CAN-01): message "Please enter a reason for the appointment"; slot still offered afterwards |
| TC-SLOT-09 | On the 2026-11-24 03:25 slot booked in TC-CAN-02: "Booked by: Kasun Mendis", "Active Booking Locked", no edit/delete icons |
| TC-RBAC-01 | /admin/dashboard redirected to /unauthorized, "403 - Access Denied" |
| TC-RBAC-02 | Alert "Only students can book appointment slots. Please sign in with a student account."; booking modal not opened |
| TC-RBAC-03 | /student/dashboard redirected to /login |

## Observations

1. **BUG-06 (#8):** in TC-BOOK-02 the direct API call returned 400, but the slot changed to `booked` with `currentAppointmentId: null` and was no longer offered to students.
2. TC-SLOT-04: rejection is correct, but the message does not mention the 480-minute maximum.
