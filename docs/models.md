# Learning Management System Models Documentation

## User Model
The User model represents all users in the system with different roles and authentication capabilities.

### Fields
- `email` (String, PK): Unique email address, used for login
- `password` (String): Hashed password
- `role` (String): User role - 'admin', 'teacher', or 'student'
- `image` (String): Profile image URL
- `fullName` (String): User's full name
- `phone` (String): Contact number
- `dateOfBirth` (Date): Birth date
- `gender` (String): 'male', 'female', or 'other'
- `isActive` (Boolean): Account status
- `lastLogin` (Date): Last login timestamp
- `refreshTokens` (Array): Array of refresh tokens with device info
- `resetPasswordToken` (String): Token for password reset
- `resetPasswordExpire` (Date): Password reset token expiry
- `emailVerified` (Boolean): Email verification status
- `verificationToken` (String): Email verification token
- `verificationTokenExpire` (Date): Verification token expiry

### Methods
- `matchPassword`: Compare entered password with stored hash
- `addRefreshToken`: Add new refresh token (max 3 tokens)
- `revokeRefreshToken`: Remove specific refresh token
- `revokeAllRefreshTokens`: Remove all refresh tokens
- `cleanExpiredTokens`: Remove expired tokens

## Classroom Model
Represents a learning environment where teachers and students interact.

### Fields
- `name` (String): Classroom name
- `code` (String): Unique classroom code
- `description` (String): Classroom description
- `teacher` (ObjectId): Reference to User (teacher)
- `students` (Array): List of enrolled students with status
- `maxStudents` (Number): Maximum student capacity
- `category` (String): 'academic', 'professional', or 'other'
- `level` (String): 'beginner', 'intermediate', or 'advanced'
- `schedule` (Object): Class schedule details
- `isActive` (Boolean): Classroom status
- `isArchived` (Boolean): Archive status
- `settings` (Object): Classroom configuration
  - `allowStudentInvite` (Boolean)
  - `allowStudentPost` (Boolean)
  - `allowStudentComment` (Boolean)

## Quiz Model
Represents assessments that can be assigned to students.

### Fields
- `title` (String): Quiz title
- `description` (String): Quiz description
- `classroom` (ObjectId): Reference to Classroom
- `createdBy` (ObjectId): Reference to User (creator)
- `questions` (Array): List of Question references
- `duration` (Number): Time limit in minutes
- `startTime` (Date): Quiz start time
- `endTime` (Date): Quiz end time
- `allowReview` (Boolean): Allow answer review
- `showResults` (Boolean): Show results after completion
- `randomizeQuestions` (Boolean): Randomize question order
- `passingScore` (Number): Minimum passing score
- `maxAttempts` (Number): Maximum allowed attempts
- `submissions` (Array): Student submissions
- `visibility` (String): 'draft', 'published', or 'scheduled'
- `tags` (Array): Quiz tags

## Question Model
Represents individual quiz questions with various types and difficulty levels.

### Fields
- `content` (String): Question text
- `image` (String): Question image URL
- `options` (Array): Answer options
  - `content` (String): Option text
  - `isCorrect` (Boolean): Correct answer flag
  - `image` (String): Option image URL
- `explanation` (String): Answer explanation
- `difficulty` (String): 'easy', 'medium', or 'hard'
- `points` (Number): Question point value
- `isAI` (Boolean): AI-generated flag
- `category` (String): Question category
- `subjectCode` (String): Subject identifier
- `statistics` (Object): Usage statistics
- `usageHistory` (Array): Question usage records
- `cooldownPeriod` (Number): Reuse cooldown in days

### Methods
- `canBeUsedInClassroom`: Check if question can be used
- `addUsage`: Record question usage
- `updateStatistics`: Update attempt statistics

## Notification Model
Handles system notifications and alerts.

### Fields
- `title` (String): Notification title
- `content` (String): Notification content
- `type` (String): 'system', 'classroom', 'assignment', or 'quiz'
- `priority` (String): 'low', 'medium', 'high', or 'urgent'
- `sender` (ObjectId): Reference to User (sender)
- `recipients` (Array): List of recipients with read status
- `classroom` (ObjectId): Reference to Classroom
- `relatedTo` (ObjectId): Reference to related entity
- `onModel` (String): Related model type
- `action` (String): Notification action type
- `actionUrl` (String): Related action URL
- `scheduledFor` (Date): Scheduled delivery time
- `expiresAt` (Date): Notification expiry

## Relationships

1. User - Classroom
   - Many-to-Many: Users (students) enroll in multiple Classrooms

2. Classroom - Quiz
   - One-to-Many: Classroom contains multiple Quizzes
   - Many-to-One: Quiz belongs to one Classroom

3. Quiz - Question
   - One-to-Many: Quiz contains multiple Questions
   - Many-to-Many: Questions can be used in multiple Quizzes

4. User - Notification
   - One-to-Many: User sends multiple Notifications
   - Many-to-Many: Users receive multiple Notifications

5. Classroom - Notification
   - One-to-Many: Classroom has multiple Notifications
   - Many-to-One: Notification can be related to one Classroom 