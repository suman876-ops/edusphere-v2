/* Console resource catalogue — one descriptor drives list, form and validation. */
window.ERP_RESOURCES = [
  {
    key: 'students', label: 'Students', icon: 'cap', table: 'erp_students',
    search: 'full_name', order: 'created_at.desc',
    columns: [
      { name: 'enrolment_no', label: 'Enrolment', required: true, width: '120px' },
      { name: 'full_name', label: 'Name', required: true },
      { name: 'section_id', label: 'Section', type: 'ref', ref: 'erp_sections', refLabel: 'name' },
      { name: 'guardian_phone', label: 'Guardian phone' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'graduated', 'dropped'], default: 'active' },
      { name: 'admitted_on', label: 'Admitted', type: 'date' }
    ]
  },
  {
    key: 'staff', label: 'Faculty & staff', icon: 'users', table: 'erp_staff',
    search: 'full_name', order: 'created_at.desc',
    columns: [
      { name: 'employee_no', label: 'Employee no', required: true },
      { name: 'full_name', label: 'Name', required: true },
      { name: 'department', label: 'Department' },
      { name: 'weekly_load', label: 'Weekly load', type: 'number', default: 0 },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'on_leave'], default: 'active' }
    ]
  },
  {
    key: 'applications', label: 'Admissions', icon: 'file', table: 'erp_applications',
    search: 'applicant', order: 'created_at.desc',
    columns: [
      { name: 'applicant', label: 'Applicant', required: true },
      { name: 'email', label: 'Email', required: true, type: 'email' },
      { name: 'phone', label: 'Phone' },
      { name: 'program_id', label: 'Program', type: 'ref', ref: 'erp_programs', refLabel: 'name' },
      { name: 'status', label: 'Status', type: 'select', options: ['enquiry', 'applied', 'shortlisted', 'offered', 'enrolled', 'rejected', 'withdrawn'], default: 'enquiry' },
      { name: 'merit_score', label: 'Merit', type: 'number' }
    ]
  },
  {
    key: 'departments', label: 'Departments', icon: 'building', table: 'erp_departments',
    search: 'name', order: 'name.asc',
    columns: [
      { name: 'name', label: 'Name', required: true },
      { name: 'code', label: 'Code', required: true }
    ]
  },
  {
    key: 'programs', label: 'Programs', icon: 'layers', table: 'erp_programs',
    search: 'name', order: 'name.asc',
    columns: [
      { name: 'name', label: 'Name', required: true },
      { name: 'code', label: 'Code', required: true },
      { name: 'department_id', label: 'Department', type: 'ref', ref: 'erp_departments', refLabel: 'name', required: true },
      { name: 'duration_years', label: 'Years', type: 'number', default: 4 }
    ]
  },
  {
    key: 'batches', label: 'Batches', icon: 'calendar', table: 'erp_batches',
    search: 'name', order: 'name.asc',
    columns: [
      { name: 'name', label: 'Name', required: true },
      { name: 'program_id', label: 'Program', type: 'ref', ref: 'erp_programs', refLabel: 'name', required: true },
      { name: 'start_year', label: 'Start', type: 'number', required: true },
      { name: 'end_year', label: 'End', type: 'number', required: true }
    ]
  },
  {
    key: 'sections', label: 'Sections', icon: 'users', table: 'erp_sections',
    search: 'name', order: 'name.asc',
    columns: [
      { name: 'name', label: 'Section', required: true },
      { name: 'batch_id', label: 'Batch', type: 'ref', ref: 'erp_batches', refLabel: 'name', required: true },
      { name: 'capacity', label: 'Capacity', type: 'number', default: 60 }
    ]
  },
  {
    key: 'subjects', label: 'Subjects', icon: 'book', table: 'erp_subjects',
    search: 'name', order: 'semester.asc',
    columns: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'credits', label: 'Credits', type: 'number', default: 3 },
      { name: 'semester', label: 'Semester', type: 'number', default: 1 }
    ]
  },
  {
    key: 'timetable', label: 'Timetable', icon: 'calendar', table: 'erp_timetable_slots',
    order: 'day_of_week.asc',
    columns: [
      { name: 'section_id', label: 'Section', type: 'ref', ref: 'erp_sections', refLabel: 'name', required: true },
      { name: 'subject_id', label: 'Subject', type: 'ref', ref: 'erp_subjects', refLabel: 'name', required: true },
      { name: 'staff_id', label: 'Teacher', type: 'ref', ref: 'erp_staff', refLabel: 'full_name' },
      { name: 'day_of_week', label: 'Day', type: 'number', required: true, default: 1 },
      { name: 'period', label: 'Period', type: 'number', required: true, default: 1 },
      { name: 'room', label: 'Room' }
    ]
  },
  {
    key: 'attendance', label: 'Attendance', icon: 'qr', table: 'erp_attendance_sessions',
    order: 'held_on.desc',
    columns: [
      { name: 'section_id', label: 'Section', type: 'ref', ref: 'erp_sections', refLabel: 'name', required: true },
      { name: 'subject_id', label: 'Subject', type: 'ref', ref: 'erp_subjects', refLabel: 'name' },
      { name: 'held_on', label: 'Date', type: 'date', required: true },
      { name: 'period', label: 'Period', type: 'number', default: 1 }
    ]
  },
  {
    key: 'attendance_records', label: 'Attendance marks', icon: 'clipboard', table: 'erp_attendance_records',
    order: 'created_at.desc',
    columns: [
      { name: 'session_id', label: 'Session', type: 'ref', ref: 'erp_attendance_sessions', refLabel: 'held_on', required: true },
      { name: 'student_id', label: 'Student', type: 'ref', ref: 'erp_students', refLabel: 'full_name', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['present', 'absent', 'late', 'excused'], default: 'present' }
    ]
  },
  {
    key: 'exams', label: 'Exams', icon: 'award', table: 'erp_exams',
    search: 'name', order: 'created_at.desc',
    columns: [
      { name: 'name', label: 'Exam', required: true },
      { name: 'subject_id', label: 'Subject', type: 'ref', ref: 'erp_subjects', refLabel: 'name' },
      { name: 'held_on', label: 'Date', type: 'date' },
      { name: 'max_marks', label: 'Max marks', type: 'number', default: 100 },
      { name: 'is_published', label: 'Published', type: 'boolean', default: false }
    ]
  },
  {
    key: 'marks', label: 'Marks', icon: 'chart', table: 'erp_exam_marks',
    order: 'created_at.desc',
    columns: [
      { name: 'exam_id', label: 'Exam', type: 'ref', ref: 'erp_exams', refLabel: 'name', required: true },
      { name: 'student_id', label: 'Student', type: 'ref', ref: 'erp_students', refLabel: 'full_name', required: true },
      { name: 'marks', label: 'Marks', type: 'number', required: true }
    ]
  },
  {
    key: 'fee_heads', label: 'Fee heads', icon: 'rupee', table: 'erp_fee_heads',
    search: 'name', order: 'name.asc',
    columns: [
      { name: 'name', label: 'Head', required: true },
      { name: 'amount_paise', label: 'Amount (paise)', type: 'number', required: true }
    ]
  },
  {
    key: 'invoices', label: 'Invoices', icon: 'receipt', table: 'erp_fee_invoices',
    search: 'title', order: 'created_at.desc',
    columns: [
      { name: 'title', label: 'Title', required: true },
      { name: 'student_id', label: 'Student', type: 'ref', ref: 'erp_students', refLabel: 'full_name', required: true },
      { name: 'fee_head_id', label: 'Head', type: 'ref', ref: 'erp_fee_heads', refLabel: 'name' },
      { name: 'amount_paise', label: 'Amount (paise)', type: 'number', required: true },
      { name: 'due_on', label: 'Due', type: 'date' }
    ]
  },
  {
    key: 'payments', label: 'Payments', icon: 'card', table: 'erp_payments',
    order: 'paid_at.desc',
    columns: [
      { name: 'invoice_id', label: 'Invoice', type: 'ref', ref: 'erp_fee_invoices', refLabel: 'title', required: true },
      { name: 'amount_paise', label: 'Amount (paise)', type: 'number', required: true },
      { name: 'method', label: 'Method', type: 'select', options: ['upi', 'card', 'netbanking', 'cash', 'cheque', 'scholarship'], default: 'upi' },
      { name: 'reference', label: 'Reference' }
    ]
  },
  {
    key: 'books', label: 'Library', icon: 'book', table: 'erp_books',
    search: 'title', order: 'created_at.desc',
    columns: [
      { name: 'title', label: 'Title', required: true },
      { name: 'author', label: 'Author' },
      { name: 'isbn', label: 'ISBN' },
      { name: 'copies', label: 'Copies', type: 'number', default: 1 }
    ]
  },
  {
    key: 'loans', label: 'Book issues', icon: 'clipboard', table: 'erp_book_loans',
    order: 'issued_on.desc',
    columns: [
      { name: 'book_id', label: 'Book', type: 'ref', ref: 'erp_books', refLabel: 'title', required: true },
      { name: 'student_id', label: 'Student', type: 'ref', ref: 'erp_students', refLabel: 'full_name' },
      { name: 'issued_on', label: 'Issued', type: 'date' },
      { name: 'due_on', label: 'Due', type: 'date' },
      { name: 'returned_on', label: 'Returned', type: 'date' },
      { name: 'fine_paise', label: 'Fine (paise)', type: 'number', default: 0 }
    ]
  },
  {
    key: 'hostels', label: 'Hostels', icon: 'bed', table: 'erp_hostels',
    search: 'name', order: 'name.asc',
    columns: [
      { name: 'name', label: 'Hostel', required: true },
      { name: 'kind', label: 'Kind', type: 'select', options: ['boys', 'girls', 'mixed'], default: 'boys' }
    ]
  },
  {
    key: 'rooms', label: 'Rooms', icon: 'bed', table: 'erp_rooms',
    search: 'number', order: 'number.asc',
    columns: [
      { name: 'hostel_id', label: 'Hostel', type: 'ref', ref: 'erp_hostels', refLabel: 'name', required: true },
      { name: 'number', label: 'Room', required: true },
      { name: 'beds', label: 'Beds', type: 'number', default: 2 }
    ]
  },
  {
    key: 'allocations', label: 'Allocations', icon: 'users', table: 'erp_hostel_allocations',
    order: 'from_date.desc',
    columns: [
      { name: 'room_id', label: 'Room', type: 'ref', ref: 'erp_rooms', refLabel: 'number', required: true },
      { name: 'student_id', label: 'Student', type: 'ref', ref: 'erp_students', refLabel: 'full_name', required: true },
      { name: 'from_date', label: 'From', type: 'date' },
      { name: 'to_date', label: 'To', type: 'date' }
    ]
  },
  {
    key: 'routes', label: 'Routes', icon: 'bus', table: 'erp_routes',
    search: 'name', order: 'name.asc',
    columns: [
      { name: 'name', label: 'Route', required: true },
      { name: 'vehicle_no', label: 'Vehicle' },
      { name: 'capacity', label: 'Capacity', type: 'number', default: 40 }
    ]
  },
  {
    key: 'stops', label: 'Stops', icon: 'pin', table: 'erp_stops',
    search: 'name', order: 'seq.asc',
    columns: [
      { name: 'route_id', label: 'Route', type: 'ref', ref: 'erp_routes', refLabel: 'name', required: true },
      { name: 'name', label: 'Stop', required: true },
      { name: 'seq', label: 'Order', type: 'number', default: 1 },
      { name: 'pickup_at', label: 'Pickup', type: 'time' }
    ]
  },
  {
    key: 'courses', label: 'Courses', icon: 'play', table: 'erp_courses',
    search: 'title', order: 'created_at.desc',
    columns: [
      { name: 'title', label: 'Course', required: true },
      { name: 'subject_id', label: 'Subject', type: 'ref', ref: 'erp_subjects', refLabel: 'name' },
      { name: 'section_id', label: 'Section', type: 'ref', ref: 'erp_sections', refLabel: 'name' }
    ]
  },
  {
    key: 'assignments', label: 'Assignments', icon: 'file', table: 'erp_assignments',
    search: 'title', order: 'created_at.desc',
    columns: [
      { name: 'title', label: 'Title', required: true },
      { name: 'course_id', label: 'Course', type: 'ref', ref: 'erp_courses', refLabel: 'title', required: true },
      { name: 'due_at', label: 'Due', type: 'datetime' },
      { name: 'max_marks', label: 'Max marks', type: 'number', default: 10 }
    ]
  },
  {
    key: 'submissions', label: 'Submissions', icon: 'clipboard', table: 'erp_submissions',
    order: 'submitted_at.desc',
    columns: [
      { name: 'assignment_id', label: 'Assignment', type: 'ref', ref: 'erp_assignments', refLabel: 'title', required: true },
      { name: 'student_id', label: 'Student', type: 'ref', ref: 'erp_students', refLabel: 'full_name', required: true },
      { name: 'marks', label: 'Marks', type: 'number' }
    ]
  },
  {
    key: 'notices', label: 'Notices', icon: 'bell', table: 'erp_notices',
    search: 'title', order: 'created_at.desc',
    columns: [
      { name: 'title', label: 'Title', required: true },
      { name: 'body', label: 'Body', type: 'textarea', required: true },
      { name: 'audience', label: 'Audience', type: 'select', options: ['all', 'students', 'parents', 'staff'], default: 'all' },
      { name: 'published_at', label: 'Published', type: 'datetime' }
    ]
  },
  {
    key: 'memberships', label: 'People & access', icon: 'lock', table: 'erp_memberships',
    order: 'created_at.desc', noCreate: true,
    columns: [
      { name: 'user_id', label: 'User', required: true },
      { name: 'role', label: 'Role', type: 'select', options: ['admin', 'registrar', 'accountant', 'faculty', 'librarian', 'warden', 'transport', 'student', 'parent'], default: 'faculty' },
      { name: 'is_active', label: 'Active', type: 'boolean', default: true }
    ]
  },
  {
    key: 'audit', label: 'Audit log', icon: 'shield', table: 'erp_audit_log',
    order: 'created_at.desc', readOnly: true,
    columns: [
      { name: 'created_at', label: 'When', type: 'datetime' },
      { name: 'table_name', label: 'Table' },
      { name: 'action', label: 'Action' },
      { name: 'actor_id', label: 'Actor' }
    ]
  }
];
