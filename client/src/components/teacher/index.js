// Export all components by category

// Stream Components
export * from './stream';

// Assignment Components  
export * from './assignment';

// Quiz Components
export * from './quiz';

// Grading Components
export * from './grading';

// Material Components
export * from './material';

// Classroom Components
export * from './classroom';

// Common Components
export * from './common';

// Backwards compatibility - Direct exports
export { AnnouncementEditor, StreamItem, StreamHeader, StreamSidebar, StreamEmptyState } from './stream';
export { AssignmentList, SubmissionManagement } from './assignment';
export { QuizManagement } from './quiz';
export { GradesTab } from './grading';
export { MaterialList } from './material';
export { StudentList, BackgroundCustomizer } from './classroom';
export { PDFViewerModal } from './common'; 