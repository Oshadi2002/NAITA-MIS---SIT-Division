# NAITA SPECIAL INDUSTRIAL TRAINING (SIT) DIVISION
## MANAGEMENT INFORMATION SYSTEM (MIS) AND STUDENT REGISTRATION SYSTEM
### TECHNICAL WORK REPORT

---

# CHAPTER 2 – TECHNICAL WORK INVOLVED

## 2.1 Develop Management Information System

The Management Information System (MIS) developed for the Special Industrial Training (SIT) Division is a modern web-based system designed to digitalize and streamline the administrative and operational processes of the division. The system was developed using React.js for the front-end, Django for the back-end, and PostgreSQL for database management, creating a secure, scalable, and user-friendly platform for managing industrial training activities efficiently.

The primary objective of the MIS is to improve the management of trainee information, industrial placements, monitoring activities, assessments, and certification processes while reducing manual paperwork and improving operational efficiency. The system provides a centralized platform that enables staff members to manage and access important training data accurately and effectively.

The front-end of the system was developed using React.js and Tailwind CSS to create responsive, interactive, and modern user interfaces that enhance usability and accessibility across different devices. Django was used to handle server-side operations, API development, authentication, and business logic implementation, while PostgreSQL ensured secure and reliable data storage and management.

The MIS includes several important functionalities such as trainee registration, placement management, monitoring and inspection tracking, assessment management, certificate handling, user authentication, dashboard reporting, and administrative data management. The system also supports digitalized workflows that help automate routine tasks and improve communication and coordination within the SIT Division.

A major strength of the system is its ability to support digital transformation within the organization by replacing traditional manual processes with efficient computerized operations. The MIS improves data accuracy, reporting efficiency, record management, and decision-making capabilities while enhancing the overall productivity of the SIT Division.

Overall, the Management Information System developed for NAITA SIT Division proved to be a modern, efficient, and scalable solution that supports vocational training administration and contributes to the continuous improvement of industrial training management processes.

### 2.1.1 Problems Encountered and Solutions Implemented

During the development of the Management Information System (MIS) for the Special Industrial Training (SIT) Division, several technical and operational challenges were encountered. These issues provided valuable learning experiences and helped improve both the system and development process through effective problem-solving and implementation strategies.

One major challenge was understanding and analyzing the existing manual workflow of the SIT Division, including trainee registration, placement handling, monitoring, and assessment procedures. Since many processes were managed manually, identifying accurate system requirements and converting them into digital workflows required continuous discussions with staff members and careful process analysis. This issue was addressed by conducting regular requirement gathering sessions and creating structured system designs before implementation.

Another challenge was managing communication between the React front-end and Django back-end. Initially, issues related to API integration, data handling, and authentication affected system functionality. These problems were solved by implementing REST APIs properly, improving request handling, and using token-based authentication methods to ensure secure and smooth communication between the client and server sides of the system.

Database management and data consistency also presented difficulties during development. Handling large amounts of trainee information, placement records, and monitoring data required proper database design and relationship management. This challenge was overcome by designing an organized PostgreSQL relational database structure with optimized tables, foreign key relationships, and validation mechanisms to ensure data accuracy and reliability.

Overall, the problems encountered during the development process significantly improved technical knowledge, problem-solving abilities, teamwork, and project management skills. The solutions implemented contributed to the successful completion of a secure, efficient, and user-friendly Management Information System for the NAITA SIT Division.

#### 1. Wireframe Design & Layout
* **Problem:** During the initial design phase of the Management Information System (MIS) for the NAITA SIT Division, the wireframe layouts contained issues related to spacing, alignment, navigation structure, and component organization. 
* **Solution:** After receiving feedback from supervisors and users within the SIT Division, the wireframe design was refined by improving spacing, alignment, grid layouts, navigation flow, and responsive structure.
* **Comparison:** Initially, several interface components were unevenly spaced, menu structures were inconsistent, and information sections appeared crowded, making the system difficult to navigate. The updated design features an clean, well-spaced modern dashboard with intuitive cards, dynamic layouts, and collapsible navigation panels.

#### 2. User Interface and Experience (UI)
* **Problem:** Difficulty in selecting complementary colors and fonts for the system portals, ensuring a clean and user-friendly experience matching the professional environment of NAITA.
* **Solution:** Multiple UI design concepts, color palettes (specifically structured using custom HSL values representing NAITA branding), font styles (Outfit and Inter), and layout structures were tested using modern design practices and front-end technologies such as React.js and Tailwind CSS.
* **Comparison:** Initially, the interface contained inconsistent colors, font styles, and crowded layouts that affected navigation and readability. The final system is styled with professional color gradients, soft shadows, clear visual states (hover/focus), and alert badges indicating progress states.

---

### 2.1.2 MIS UI and Coding

The following figures illustrate the implemented user interface designs and key coding implementations of the Management Information System.

#### Figure 13: MIS Login Page
* **Description:** A modern, tabbed authentication portal styled with HSL custom colors. It allows users to select their specific role—System Administrator, University Coordinator, District Inspector, or Viva Assessor—ensuring they log in to their designated administrative workspace. Features a responsive split-screen layout displaying system credentials forms on the left and a branding banner with the NAITA logo and tagline on the right.

#### Figure 14: Student Dashboard
* **Description:** The landing dashboard for university coordinators and admins showing real-time statistics including total student submissions, verification statuses, pending placement seminar requests, active viva panels, and upcoming notifications.

#### Figure 15: Student Placement Seminar Page
* **Description:** A dedicated interface where University Coordinators request seminars, manage dates, and view allocations. Admins can view requested seminars and assign District Inspectors to confirm and oversee them.

#### Figure 16: Student Assessment Page
* **Description:** An assessment workspace for Viva Assessors where they are presented with assigned student panels, scheduling details, student info sheets, and marking interfaces based on custom criteria (e.g. Daily Diary, presentation, practical knowledge).

#### Figure 17: Officer Dashboard
* **Description:** Custom view for District Inspectors displaying scheduled placement seminar monitoring tasks, active locations map, and digital forms to upload field inspection reports directly to the backend.

#### Figure 18: User Management Page
* **Description:** The system directory enabling administrators to manage users, search staff by role (Assessor, Coordinator, Inspector), and inspect pending registrations.

#### Figure 19: Placement Assigning Page
* **Description:** An administrative panel to assign registered students to specific Viva Panels, organize time slots, select the evaluating assessors, and define marking metrics.

#### Figure 20: Add User Page
* **Description:** An invitation generator interface for administrators to issue single-use secure links for university coordinators and staff (assessors/inspectors) to register themselves securely.

#### Figure 21: Login Page Code (React Front-End)
* **Location:** `Frontend/client/src/pages/auth/Login.tsx`
* **Description:** Form state handling, role tabs, default test accounts mapping, and store submission logic.
```tsx
export default function Login() {
  const { login } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username: string, password = "password", requestedRole?: string) => {
    setLoading(true);
    const success = await login({ username, password, role: requestedRole } as any);
    if (success) {
      toast({
        title: "Welcome back",
        description: "Successfully logged in to the portal.",
      });
      setLocation("/");
    } else {
      const errorMsg = useStore.getState().error || "";
      let displayMessage = "Incorrect Email or Password! Try again.";
      if (errorMsg.includes("Please select the correct login tab")) {
          displayMessage = "Please select the correct login tab for your role!";
      }
      toast({
        variant: "destructive",
        title: "Login failed",
        description: displayMessage,
      });
    }
    setLoading(false);
  };
  // ... JSX layout with role Tabs
}
```

#### Figure 22: Dashboard Card Component (React Front-End)
* **Location:** `Frontend/client/src/pages/dashboard/Dashboard.tsx`
* **Description:** React code calculating and displaying system statistics and module navigation cards based on authenticated user permissions.
```tsx
export default function Dashboard() {
  const { currentUser, requests } = useStore();
  const [, setLocation] = useLocation();

  if (!currentUser) return null;

  const myRequests = requests;
  const pending = myRequests.filter(r => r.status === 'PENDING').length;
  const total = myRequests.length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Admin Dashboard</h2>
        <p className="text-muted-foreground mt-2">Welcome back, {currentUser.name || currentUser.username}.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(currentUser.role === 'ADMIN' || currentUser.role === 'UNIVERSITY_COORDINATOR') && (
          <>
            <SeminarManagementCard totalRequests={total} pendingRequests={pending} onClick={() => setLocation("/seminar-management")} />
            <StudentDataCard totalStudents={0} onClick={() => setLocation("/student-data")} />
            <MonitoringCard activeMonitors={0} onClick={() => setLocation("/monitoring")} />
          </>
        )}
        {(currentUser.role === 'ADMIN' || currentUser.role === 'UNIVERSITY_COORDINATOR' || currentUser.role === 'ASSESSOR') && (
          <AssessmentCard completedStudents={0} onClick={() => setLocation("/assessment")} />
        )}
      </div>
    </div>
  );
}
```

#### Figure 23: User Management and Invites Viewset (Django Back-End)
* **Location:** `Backend/api/viewsets/invites.py`
* **Description:** DRF viewset executing coordinator invite generations, sending whatsapp/email details, and validating unique UUID tokens.
```python
class CoordinatorInviteViewSet(viewsets.ModelViewSet):
    queryset = CoordinatorInvite.objects.all().order_by('-created_at')
    serializer_class = CoordinatorInviteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return CoordinatorInvite.objects.all().order_by('-created_at')
        return CoordinatorInvite.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
```

---

## 2.2 Student Registration Web Application (Integrated Module)

The Student Registration and Placement Data Collection System is built as a core module of the web application to digitalize and simplify student registration, novation requests, and assessment management workflows. Implementing this sub-system in React and Django created an integrated, secure, and user-friendly platform for managing student details, placement locations, and physical documents.

The primary objective is to replace traditional paper-based registrations, reducing document processing delays and ensuring accurate records. University coordinators generate batch link records that are shared as secure registration portals. Students access these portals to enter their personal data, placement parameters (district, divisional secretariat, supervisor designation), and upload required PDF/Image documents.

Core functionalities include:
1. **Dynamic Registration Form:** Responsive multi-step registration capturing student particulars, academic background, and first/second placement metrics.
2. **File Processing:** Upload logic handling images and PDFs of National Identity Cards (NIC), NAITA training contract forms, worksite approvals, and placement letters.
3. **Google Sheets Synchronizer:** An integration capability importing student submissions compiled from existing Google Forms to transition legacy processes.
4. **Validation and Audit Logs:** Enforced block-letter names check, unique registration constraints, and audit log generation capturing all administrative edits.

### 2.2.1 Problems Encountered and Solutions Implemented

#### 1. Interactive and Engaging User Interface (UI)
* **Problem:** Students frequently submitted incomplete forms or entries with varying capitalization and format inconsistencies (e.g. mixed casing in Name fields, invalid NIC format), creating extra verification work.
* **Solution:** Implemented the front-end form using `react-hook-form` coupled with `zod` resolvers. Schema properties enforce formatting requirements, such as forcing names to block letters via JavaScript uppercase transformation filters.
* **Comparison:** Original inputs accepted any characters, resulting in scrambled student data. The React-based form validates all inputs in real-time, blocking submission of invalid formats.

#### 2. Responsive Design and Cross-Device Compatibility
* **Problem:** Many student trainees submit documents using smartphones, where wide forms cause layout overflow and sizing issues.
* **Solution:** Structured the `StudentForm.tsx` using responsive Tailwind grids, auto-adjusting textareas, and interactive files upload zones designed to adapt to screen sizes.
* **Comparison:** Initial registration forms required a desktop viewport. The redesigned CSS layout collapses form groups to single columns on screen widths below 768px, ensuring an optimal mobile experience.

#### 3. Database Connectivity and Data Handling
* **Problem:** Managing thousands of submissions across various institutes and batches while preventing duplicate registrations for the same training link.
* **Solution:** Configured unique constraints on the relational level in PostgreSQL (using `unique_together = ('nic', 'form_link')`). Wrote custom viewset logic to allow updates only when approved novation (placement changes) parameters exist.
* **Comparison:** Excel-based storage files were prone to duplicate records and overwrites. The database layer guarantees data consistency and referential integrity.

#### 4. System Security and Authentication
* **Problem:** Protecting sensitive files (NIC scans, training contract signatures) from public downloads.
* **Solution:** Set up Django permission classes (`IsAuthenticated`, `AllowAny` for creation, `ADMIN` and `UNIVERSITY_COORDINATOR` for reviews). Uploaded files are routed through private media patterns, and URLs are generated on-demand.
* **Comparison:** Uploaded PDFs were initially saved to public directories. The REST backend restricts access, checking requests permissions before returning files.

---

### 2.2.2 Student Registration Module UI and Coding

The following figures show key interfaces and code blocks associated with the Student Registration and Assessment Module.

#### Figure 24: Student Data Grid
* **Description:** An administrative data table showing trainee submissions filtered by university, batch year, and training district. Authorized officers can inspect uploaded files, verify details, and check the "Checked OK" validation box.

#### Figure 25: Assessor Panel Allocation UI
* **Description:** Interface displaying viva panel schedulers. Allows assessors to allocate specific students to sequential slots, select locations (physical/virtual), and record attendance statuses.

#### Figure 26: Search Student Page
* **Description:** A responsive dashboard query view implementing multi-parameter search (by registration number, NIC, name, or status) to fetch records instantly.

#### Figure 27: Student Details Page
* **Description:** Full overview of a single student submission. Displays personal fields, training company coordinates, dates, and preview cards for files (agreement form, worksite form, and placement letter).

#### Figure 28: Assessment Table Page
* **Description:** The marks sheet listing student scores according to designated viva panel criteria (e.g. Daily Diary, presentation). It calculates total marks and automatically updates student status to PASS or SPECIAL STATUS.

#### Figure 29: Viva Panel Assignment Viewset (Django Back-End)
* **Location:** `Backend/api/viewsets/viva.py`
* **Description:** DRF viewset executing bulk student panel assignment. Ensures students cannot be duplicate-assigned to multiple panels in the same phase.
```python
class VivaPanelViewSet(viewsets.ModelViewSet):
    queryset = VivaPanel.objects.all()
    serializer_class = VivaPanelSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        panel_id = request.data.get('panel_id')
        student_ids = request.data.get('student_ids')
        if not panel_id or not student_ids:
            return Response({"error": "panel_id and student_ids are required"}, status=400)
        
        try:
            panel = VivaPanel.objects.get(id=panel_id)
        except VivaPanel.DoesNotExist:
            return Response({"error": "Panel not found"}, status=404)
        
        assignments = []
        errors = []
        current_count = panel.assignments.count()
        
        for i, student_id in enumerate(student_ids):
            try:
                student = StudentSubmission.objects.get(id=student_id)
                if VivaAssignment.objects.filter(student=student, panel__training_phase=panel.training_phase).exists():
                    errors.append(f"Student {student.initials_name} is already assigned.")
                    continue
                assignment = VivaAssignment.objects.create(
                    panel=panel, student=student, slot_number=current_count + i + 1
                )
                assignments.append(VivaAssignmentSerializer(assignment).data)
            except StudentSubmission.DoesNotExist:
                errors.append(f"Student ID {student_id} not found.")
                
        return Response({"message": f"Successfully assigned {len(assignments)} students.", "assignments": assignments}, status=201)
```

#### Figure 30: Assessment Marks Controller (Django Back-End)
* **Location:** `Backend/api/viewsets/viva.py`
* **Description:** Back-end calculation logic checking marking criteria sums, evaluating pass thresholds, and setting final assessment statuses.
```python
class AssessmentMarkViewSet(viewsets.ModelViewSet):
    queryset = AssessmentMark.objects.all()
    serializer_class = AssessmentMarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        data = self.request.data
        try:
            assignment_id = data.get('assignment')
            assignment = VivaAssignment.objects.get(id=assignment_id)
            marking_criteria = assignment.panel.marking_criteria
            total_max = sum(float(c.get('max', 0)) for c in marking_criteria) if marking_criteria else 100
            if total_max <= 0: total_max = 100
            
            marks_data = data.get('marks_data', {})
            total = sum(float(value) for value in marks_data.values() if value)
            condition = data.get('evaluation_condition', 'NORMAL')
            
            pass_threshold = total_max * 0.5
            if condition == 'NORMAL' and total >= pass_threshold:
                status_val = 'PASS'
            else:
                status_val = 'SPECIAL_STATUS'
                
            serializer.save(
                assessor=self.request.user, total_mark=total, status=status_val,
                marks_data=marks_data, evaluation_condition=condition,
                assessor_remarks=data.get('assessor_remarks', '')
            )
        except Exception as e:
            serializer.save(assessor=self.request.user, total_mark=0, status='SPECIAL_STATUS')
```

#### Figure 31: Student Submission Viewset (Django Back-End)
* **Location:** `Backend/api/viewsets/student_data.py`
* **Description:** Custom handlers validating hashed submission links, extracting form inputs, saving files, and outputting structured registration indexes as Excel documents.
```python
class StudentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = StudentSubmission.objects.all()
    serializer_class = StudentSubmissionSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        hash_id = request.data.get('form_link_id')
        nic = request.data.get('nic')
        
        try:
            link = FormLink.objects.get(id=hash_id, is_active=True)
            existing = StudentSubmission.objects.filter(nic=nic, form_link=link).first()
            if existing:
                has_approved_nov = existing.novation_requests.filter(status='APPROVED').exists()
                if has_approved_nov:
                    update_serializer = self.get_serializer(existing, data=request.data, partial=True)
                    update_serializer.is_valid(raise_exception=True)
                    update_serializer.save(
                         form_link=link, university=link.university, checked_ok=False
                    )
                    return Response(update_serializer.data, status=200)
                else:
                    return Response({"detail": "Submission already exists for this NIC."}, status=400)
            self.perform_create(serializer)
            return Response(serializer.data, status=201)
        except FormLink.DoesNotExist:
            return Response({"detail": "Invalid Link"}, status=400)
```

#### Figure 32: Assessment Mark Django Model Code
* **Location:** `Backend/api/models.py`
* **Description:** Database definition for viva marks linked to assignments, storing assessment indicators and remarks.
```python
class AssessmentMark(models.Model):
    assignment = models.OneToOneField(VivaAssignment, on_delete=models.CASCADE, related_name='marks')
    assessor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_marks')
    marks_data = models.JSONField(default=dict) # Dynamic marks data per criteria
    evaluation_condition = models.CharField(
        max_length=50, 
        choices=[
            ('NORMAL', 'Normal'), 
            ('INCOMPLETE_DIARY', 'Incomplete Daily Diary'), 
            ('EXTEND', 'Extend'), 
            ('VIVA_REPEAT', 'Viva Repeat')
        ], 
        default='NORMAL'
    )
    total_mark = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=[('PASS', 'Pass'), ('SPECIAL_STATUS', 'Special Status')])
    assessor_remarks = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Figure 33: Student Submission Django Model Code
* **Location:** `Backend/api/models.py`
* **Description:** High-fidelity database schema declaring personal attributes, NVQ levels, training schedules, multi-phase structures, and uploaded document fields.
```python
class StudentSubmission(models.Model):
    form_link = models.ForeignKey(FormLink, on_delete=models.SET_NULL, null=True, blank=True, related_name='submissions')
    university = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    batch_year = models.CharField(max_length=50)
    district = models.CharField(max_length=100, default="Colombo")
    
    full_name = models.CharField(max_length=255)
    initials_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=20)
    nic = models.CharField(max_length=20)
    email = models.EmailField()
    contact_number = models.CharField(max_length=20)
    permanent_address = models.TextField()
    
    student_reg_no = models.CharField(max_length=50)
    degree_nvq_level = models.CharField(max_length=100)
    degree_diploma_name = models.CharField(max_length=255)
    
    training_district = models.CharField(max_length=100)
    divisional_secretariat = models.CharField(max_length=100)
    training_establishment = models.CharField(max_length=255)
    training_address = models.TextField()
    officer_in_charge = models.CharField(max_length=255)
    officer_in_charge_contact = models.CharField(max_length=20, null=True, blank=True)
    training_start_date = models.DateField()
    training_end_date = models.DateField()
    training_duration = models.CharField(max_length=50)
    field_of_training = models.CharField(max_length=255)

    # File uploads paths
    nic_copy = models.FileField(upload_to='student_docs/nic/')
    agreement_form = models.FileField(upload_to='student_docs/agreement/')
    work_site_form = models.FileField(upload_to='student_docs/worksite/')
    placement_letter = models.FileField(upload_to='student_docs/placement/')
    
    checked_ok = models.BooleanField(default=False)
    admin_reg_number = models.CharField(max_length=50, null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
```

#### Figure 34: Custom User Django Model Code
* **Location:** `Backend/api/models.py`
* **Description:** Django security schema for user records implementing Role-Based Access Controls (RBAC).
```python
class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('INSPECTOR', 'Inspector'),
        ('ASSESSOR', 'Assessor'),
        ('UNIVERSITY_COORDINATOR', 'University Coordinator'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    university = models.CharField(max_length=255, null=True, blank=True)
    faculty = models.CharField(max_length=255, null=True, blank=True)
    department = models.CharField(max_length=255, null=True, blank=True)
    designation = models.CharField(max_length=255, null=True, blank=True)
    whatsapp_number = models.CharField(max_length=20, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(unique=True)

    REQUIRED_FIELDS = ['email', 'role']
```

#### Figure 35: Google Sheet Management Service (Django Back-End)
* **Location:** `Backend/api/services/google_sheets.py`
* **Description:** Automated data migration module connecting to Google Drive and Spreadsheets API to synchronize trainee entries using `gspread` and service account keys.
```python
def sync_sheet_data(sheet_url, form_link_id):
    try:
        client = get_gspread_client()
        sheet = client.open_by_url(sheet_url)
        worksheet = sheet.get_worksheet(0)
        records = worksheet.get_all_records()
        link = FormLink.objects.get(id=form_link_id)
        
        synced_count = 0
        updated_count = 0
        
        for record in records:
            nic = record.get('NIC') or record.get('nic')
            email = record.get('Email Address') or record.get('Email')
            if not nic:
                continue

            student_data = {
                'full_name': record.get('Full Name', ''),
                'initials_name': record.get('Name with Initials', ''),
                'gender': record.get('Gender', ''),
                'email': email,
                'contact_number': record.get('Contact Number', ''),
                'permanent_address': record.get('Permanent Address', ''),
                'student_reg_no': record.get('Student Registration Number', '') or record.get('Reg No', ''),
                'degree_nvq_level': record.get('Degree/NVQ Level', ''),
                'degree_diploma_name': record.get('Degree/Diploma Name', ''),
                'training_establishment': record.get('Training Establishment', ''),
                'training_address': record.get('Training Address', ''),
                'officer_in_charge': record.get('Officer in Charge', ''),
                'training_duration': record.get('Training Duration', ''),
                'field_of_training': record.get('Field of Training', ''),
                'training_district': record.get('Training District', '')
            }
            
            obj, created = StudentSubmission.objects.update_or_create(
                nic=nic,
                defaults={
                    **student_data, 'form_link': link,
                    'university': link.university, 'subject': link.subject,
                    'batch_year': link.batch_year, 'district': link.district
                }
            )
            if created: synced_count += 1
            else: updated_count += 1
        return {'synced': synced_count, 'updated': updated_count}
    except Exception as e:
        return {'error': str(e)}
```

#### Figure 36: User Migration Code (Django Autogenerated Migration Schema)
* **Location:** `Backend/api/migrations/0001_initial.py` (Excerpts)
* **Description:** Database table migration structure for Custom User schema.
```python
migrations.CreateModel(
    name='User',
    fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('password', models.CharField(max_length=128, verbose_name='password')),
        ('username', models.CharField(unique=True, max_length=150)),
        ('email', models.EmailField(unique=True, max_length=254)),
        ('role', models.CharField(choices=[('ADMIN', 'Admin'), ('INSPECTOR', 'Inspector'), ('ASSESSOR', 'Assessor'), ('UNIVERSITY_COORDINATOR', 'University Coordinator')], max_length=50)),
        ('university', models.CharField(blank=True, max_length=255, null=True)),
    ],
    options={
        'verbose_name': 'user',
        'verbose_name_plural': 'users',
    },
)
```

#### Figure 37: Student Submission Migration Code
* **Location:** `Backend/api/migrations/0001_initial.py` (Excerpts)
* **Description:** Django schema declaration declaring columns, types, and constraints for the student submissions table.
```python
migrations.CreateModel(
    name='StudentSubmission',
    fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('full_name', models.CharField(max_length=255)),
        ('initials_name', models.CharField(max_length=255)),
        ('gender', models.CharField(max_length=20)),
        ('nic', models.CharField(max_length=20)),
        ('email', models.EmailField(max_length=254)),
        ('student_reg_no', models.CharField(max_length=50)),
        ('nic_copy', models.FileField(upload_to='student_docs/nic/')),
        ('agreement_form', models.FileField(upload_to='student_docs/agreement/')),
        ('work_site_form', models.FileField(upload_to='student_docs/worksite/')),
        ('placement_letter', models.FileField(upload_to='student_docs/placement/')),
        ('checked_ok', models.BooleanField(default=False)),
        ('submitted_at', models.DateTimeField(auto_now_add=True)),
    ],
)
```

#### Figure 38: Assessment Mark Migration Code
* **Location:** `Backend/api/migrations/0001_initial.py` (Excerpts)
* **Description:** Table structure mapping columns and relationships for Assessment Marks schema.
```python
migrations.CreateModel(
    name='AssessmentMark',
    fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('marks_data', models.JSONField(default=dict)),
        ('evaluation_condition', models.CharField(choices=[('NORMAL', 'Normal'), ('INCOMPLETE_DIARY', 'Incomplete Daily Diary'), ('EXTEND', 'Extend'), ('VIVA_REPEAT', 'Viva Repeat')], default='NORMAL', max_length=50)),
        ('total_mark', models.DecimalField(decimal_places=2, max_digits=5)),
        ('status', models.CharField(choices=[('PASS', 'Pass'), ('SPECIAL_STATUS', 'Special Status')], max_length=20)),
        ('assessor_remarks', models.TextField(blank=True, null=True)),
        ('assignment', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='marks', to='api.vivaassignment')),
    ],
)
```

#### Figure 39: Front-End Routing Code (React)
* **Location:** `Frontend/client/src/App.tsx`
* **Description:** Front-end SPA routes mapping path structures to specific page layouts with wouter switches.
```tsx
function Router() {
  const { currentUser } = useStore();

  return (
    <Switch>
      <Route path="/login">
        {currentUser ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/register/:token" component={CoordinatorRegistration} />
      <Route path="/staff-register/:token" component={StaffRegistration} />
      
      <Route path="/"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/requests"><ProtectedRoute component={RequestList} /></Route>
      <Route path="/users"><ProtectedRoute component={UserManagement} /></Route>
      <Route path="/student-data"><ProtectedRoute component={StudentDataDashboard} /></Route>
      <Route path="/assessment"><ProtectedRoute component={AssessmentDashboard} /></Route>
      <Route path="/assessor-dashboard"><ProtectedRoute component={AssessorDashboard} /></Route>
      
      {/* Public Route for Student Data Collection */}
      <Route path="/collect-data/:hash"><StudentForm /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}
```

#### Figure 40: Environment settings template
* **Location:** `Frontend/.env` and `Backend/core/settings.py` (Mock configuration details)
* **Description:** Configuration schema demonstrating connection strings, host details, and third-party credential files setup.
```env
# Backend Environment Configuration
DEBUG=True
SECRET_KEY=django-insecure-naita-sitd-mis-secretkey-2026
DATABASE_URL=postgres://naita_user:securepassword@localhost:5432/naita_db
ALLOWED_HOSTS=localhost,127.0.0.1

# Email host for contract mailers
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=sit.naita@gmail.com
EMAIL_HOST_PASSWORD=googleapppassword

# Google API Credentials location
GOOGLE_APPLICATION_CREDENTIALS=credentials.json
```

---

# CHAPTER 3 – CONCLUSION

## 3.1 Conclusion

My training journey, which began with the Higher National Diploma in Information Technology (HNDIT), has been a transformative and enlightening experience. The foundational knowledge and skills acquired during my HNDIT studies provided a robust platform upon which I built my professional competencies. This journey took a significant leap forward when I joined the National Apprentice and Industrial Training Authority (NAITA), where theoretical knowledge met practical application.

At NAITA, I had the opportunity to dive deep into various facets of web development and design. Utilizing React.js, Django, HTML, CSS, JavaScript, and Tailwind CSS, I honed my skills in creating responsive, secure, and modern web systems. Developing the Management Information System (MIS) for the Special Industrial Training (SIT) Division allowed me to gain comprehensive full-stack experience in system architecture, database design with PostgreSQL, REST APIs, and digital document automation workflows. Additionally, my proficiency in UI/UX design was sharpened by testing and translating figma concepts into live responsive screens.

One of the most rewarding aspects of this training was the ability to bridge the gap between learning and real-world application. Creating the student placement registration form with Zod schema validation, integrating Google Sheets synchronization via Google APIs, and implementing Viva Assessment marks automation exemplified this integration, allowing me to contribute meaningful solutions to real problems.

Overall, my journey from HNDIT to the National Apprentice and Industrial Training Authority has been marked by continuous learning, practical application, and professional growth. The skills and experiences gained have not only solidified my technical abilities but have also prepared me to tackle future challenges in the software engineering industry with confidence and innovation.

## 3.2 Suggestions for the organizational development

The Special Industrial Training (SIT) Division of NAITA would benefit from further organizational development through the enhancement of technical infrastructure, human resources, and digital transformation initiatives. As the number of trainees, universities, and industrial training activities continues to increase, additional technical and administrative staff are required to efficiently manage trainee placements, monitoring, assessments, and system operations. Increasing skilled human resources would improve productivity, reduce workload, and enhance the overall quality of services provided by the division.

Additionally, further improvements in IT infrastructure, including modern computer systems, servers, and network facilities, would support the effective implementation and maintenance of digital systems such as the MIS platform. Strengthening digitalization processes and automation within the division can significantly improve operational efficiency, data management, communication, and reporting accuracy.

Regular training programs and professional development opportunities for staff members would also help improve technical knowledge, management skills, and adaptability to modern technologies. Furthermore, strengthening collaboration with industries, universities, and training institutions can create more industrial training opportunities and improve the employability of trainees.

By focusing on technological advancement, staff development, and efficient resource management, the SIT Division can further enhance its training administration processes and continue contributing effectively to vocational and industrial workforce development in Sri Lanka.

## 3.3 Suggestions for my own development

During my training period at the Special Industrial Training (SIT) Division, I identified several areas for my personal and professional development. Although I gained valuable experience in full-stack web application development using React.js, Django, Tailwind CSS, and PostgreSQL, there are still opportunities to further enhance my technical and professional skills.

One important area for improvement is strengthening my knowledge of advanced back-end development, API optimization, and system security to build more scalable and secure enterprise-level applications. I also aim to improve my expertise in cloud technologies, DevOps practices, and deployment processes to better manage modern web applications in real-world environments.

Additionally, improving my UI/UX design skills and learning advanced front-end frameworks and design principles would help me create more user-friendly and visually appealing systems. Expanding my knowledge in database optimization, software architecture, and performance tuning would also enhance my ability to develop efficient and maintainable applications.

From a professional perspective, I would like to further develop my communication, leadership, teamwork, and project management skills to work more effectively within organizational and collaborative environments. Participating in more real-world projects, workshops, and technical training programs will help strengthen my problem-solving abilities and industry knowledge.

Overall, this training experience motivated me to continue learning modern technologies and improving both my technical and professional competencies in order to become a skilled and responsible software developer capable of contributing effectively to the IT industry and digital transformation initiatives.

## 3.4 Suggestions for training development

Industries provide trainees with opportunities to receive training in accordance with relevant Training Standards and Schedules, supervised by a senior officer or qualified engineer who is assigned for this purpose. These officers guide trainees in maintaining their log books (Daily Diaries), writing intermittent reports, and providing extensive coverage of their training. Trainees from relevant institutions are placed in industries that align with their disciplines of study and are subjected to interim and final assessments. The results of successful trainees are sent to their respective institutions to qualify them for the award of Degree or Diploma Certificates.
